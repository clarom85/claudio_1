/**
 * fix-duplicate-images.js
 * Rileva e sostituisce le immagini duplicate su un sito.
 * Uso: node packages/content-engine/src/fix-duplicate-images.js --site-id 5
 */
import 'dotenv/config';
import { createHash } from 'crypto';
import { createWriteStream, mkdirSync, existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { pipeline } from 'stream/promises';
import { sql } from '@content-network/db';

const PEXELS_API = 'https://api.pexels.com/v1/search';
const PEXELS_KEY = process.env.PEXELS_API_KEY;
const WWW_ROOT = process.env.WWW_ROOT || '/var/www';
const USED_IDS_FILE = '.pexels-used.json';

function md5File(path) {
  const buf = readFileSync(path);
  return createHash('md5').update(buf).digest('hex');
}

function loadUsedIds(imagesDir) {
  const f = join(imagesDir, USED_IDS_FILE);
  if (!existsSync(f)) return new Set();
  try { return new Set(JSON.parse(readFileSync(f, 'utf-8')).ids || []); } catch { return new Set(); }
}

function saveUsedId(imagesDir, id) {
  const f = join(imagesDir, USED_IDS_FILE);
  const ids = loadUsedIds(imagesDir);
  ids.add(id);
  writeFileSync(f, JSON.stringify({ ids: [...ids] }), 'utf-8');
}

function sanitizeQuery(keyword) {
  return keyword
    .replace(/\bcost(s)?\b/gi, '').replace(/\bprice(s)?\b/gi, '')
    .replace(/\bhow (much|to)\b/gi, '').replace(/\bnear me\b/gi, '')
    .replace(/\b\d{4,5}\b/g, '').replace(/\s+/g, ' ').trim().slice(0, 60);
}

async function fetchUniquePhoto(query, usedIds) {
  for (let page = 1; page <= 5; page++) {
    const res = await fetch(
      `${PEXELS_API}?query=${encodeURIComponent(query)}&per_page=15&page=${page}&orientation=landscape`,
      { headers: { Authorization: PEXELS_KEY } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.photos?.length) break;
    const photo = data.photos.find(p => !usedIds.has(p.id));
    if (photo) return photo;
  }
  return null;
}

async function run() {
  if (!PEXELS_KEY) { console.error('PEXELS_API_KEY non configurata'); process.exit(1); }

  const args = process.argv.slice(2);
  const siteId = parseInt(args.find(a => a.startsWith('--site-id='))?.split('=')[1]
    || args[args.indexOf('--site-id') + 1]);
  if (!siteId) { console.error('Uso: node fix-duplicate-images.js --site-id <id>'); process.exit(1); }

  const [site] = await sql`SELECT domain FROM sites WHERE id = ${siteId}`;
  if (!site) { console.error(`Site ${siteId} non trovato`); process.exit(1); }

  const imagesDir = join(WWW_ROOT, site.domain, 'images');
  if (!existsSync(imagesDir)) { console.error(`Directory immagini non trovata: ${imagesDir}`); process.exit(1); }

  // Carica articoli pubblicati con immagine
  const articles = await sql`
    SELECT a.id, a.slug, a.image, k.keyword
    FROM articles a
    JOIN keywords k ON a.keyword_id = k.id
    WHERE a.site_id = ${siteId} AND a.status = 'published' AND a.image IS NOT NULL
    ORDER BY a.id
  `;

  console.log(`\n🔍 Analisi immagini per ${site.domain} (${articles.length} articoli)\n`);

  // Calcola MD5 di ogni immagine → trova duplicati
  const md5Map = new Map(); // md5 → primo slug che lo usa
  const duplicates = [];

  for (const art of articles) {
    const imgPath = join(WWW_ROOT, site.domain, art.image);
    if (!existsSync(imgPath)) { console.log(`  ⚠️  File mancante: ${art.image}`); continue; }
    const hash = md5File(imgPath);
    if (md5Map.has(hash)) {
      duplicates.push({ ...art, imgPath, hash });
      console.log(`  🔁 DUPLICATO: ${art.slug} (stesso MD5 di ${md5Map.get(hash)})`);
    } else {
      md5Map.set(hash, art.slug);
    }
  }

  if (!duplicates.length) {
    console.log('✅ Nessun duplicato trovato — tutte le immagini sono uniche!');
    process.exit(0);
  }

  console.log(`\n📥 Re-scarico ${duplicates.length} immagini duplicate...\n`);

  // Carica ID Pexels già usati (dal file di tracking)
  const usedIds = loadUsedIds(imagesDir);

  // Aggiungi gli MD5 delle immagini non-duplicate come "occupate" —
  // non possiamo ricavare l'ID Pexels da file già scaricati, ma il file .pexels-used
  // verrà popolato man mano che re-scarichiamo
  let fixed = 0;
  for (const art of duplicates) {
    const query = sanitizeQuery(art.keyword);
    console.log(`  [${art.slug}] cercando foto unica per "${query}"...`);

    const photo = await fetchUniquePhoto(query, usedIds);
    if (!photo) {
      console.log(`  ❌ Nessuna foto disponibile per "${query}"`);
      continue;
    }

    try {
      const imgRes = await fetch(photo.src.large);
      if (!imgRes.ok) throw new Error(`HTTP ${imgRes.status}`);
      await pipeline(imgRes.body, createWriteStream(art.imgPath));
      saveUsedId(imagesDir, photo.id);
      usedIds.add(photo.id); // aggiorna il set in memoria per questo run
      console.log(`  ✅ Sostituita: /images/${art.slug.split('/').pop()}.jpg (Pexels #${photo.id})`);
      fixed++;
    } catch (err) {
      console.log(`  ❌ Download fallito: ${err.message}`);
    }

    // Piccola pausa per rispettare i rate limit Pexels
    await new Promise(r => setTimeout(r, 300));
  }

  console.log(`\n✅ Corrette ${fixed}/${duplicates.length} immagini duplicate`);
  await sql.end();
}

run().catch(err => { console.error(err); process.exit(1); });
