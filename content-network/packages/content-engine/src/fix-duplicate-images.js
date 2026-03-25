/**
 * fix-duplicate-images.js
 * Rileva e sostituisce TUTTE le immagini duplicate su disco per un sito.
 * Scansiona tutti i JPG nella cartella images/ (non solo articoli published).
 * Uso: node packages/content-engine/src/fix-duplicate-images.js --site-id 5
 */
import 'dotenv/config';
import { createHash } from 'crypto';
import { existsSync, readFileSync, writeFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { spawnSync } from 'child_process';
import { sql } from '@content-network/db';

const PEXELS_API = 'https://api.pexels.com/v1/search';
const PEXELS_KEY = process.env.PEXELS_API_KEY;
const WWW_ROOT = process.env.WWW_ROOT || '/var/www';
const USED_IDS_FILE = '.pexels-used.json';
const SKIP_FILES = /^(author-|og-default|placeholder)/;

function md5(buf) {
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

function postProcess(filePath) {
  try { spawnSync('jpegoptim', ['--strip-all', '--quiet', filePath], { timeout: 10000 }); } catch {}
  try {
    spawnSync('cwebp', ['-q', '82', '-quiet', filePath, '-o', filePath.replace(/\.jpg$/i, '.webp')], { timeout: 15000 });
  } catch {}
}

function slugToQuery(filename) {
  return filename
    .replace(/\.jpg$/, '')
    .replace(/-/g, ' ')
    .replace(/\bcost(s)?\b/gi, '')
    .replace(/\bprice(s)?\b/gi, '')
    .replace(/\bhow (much|to)\b/gi, '')
    .replace(/\bnear me\b/gi, '')
    .replace(/\b\d{4,5}\b/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 60);
}

async function fetchUniquePhoto(query, usedIds, existingMd5s) {
  for (let page = 1; page <= 6; page++) {
    const res = await fetch(
      `${PEXELS_API}?query=${encodeURIComponent(query)}&per_page=20&page=${page}&orientation=landscape`,
      { headers: { Authorization: PEXELS_KEY } }
    );
    if (!res.ok) break;
    const data = await res.json();
    if (!data.photos?.length) break;
    for (const photo of data.photos) {
      if (usedIds.has(photo.id)) continue;
      // Download and check MD5 before accepting
      try {
        const r = await fetch(photo.src.large);
        if (!r.ok) continue;
        const buf = Buffer.from(await r.arrayBuffer());
        if (existingMd5s.has(md5(buf))) { usedIds.add(photo.id); continue; }
        return { photo, buf };
      } catch { continue; }
    }
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

  // Scansiona TUTTI i JPG su disco (non solo articoli published nel DB)
  const allJpgs = readdirSync(imagesDir)
    .filter(f => f.endsWith('.jpg') && !SKIP_FILES.test(f))
    .map(f => ({ filename: f, path: join(imagesDir, f) }));

  console.log(`\n🔍 Scansione ${allJpgs.length} immagini per ${site.domain}...\n`);

  // Gruppo per MD5: md5 → primo filename (keeper)
  const md5Map = new Map();
  const duplicates = [];

  for (const img of allJpgs) {
    try {
      const hash = md5(readFileSync(img.path));
      if (md5Map.has(hash)) {
        duplicates.push({ ...img, hash, keeper: md5Map.get(hash) });
        console.log(`  🔁 DUP: ${img.filename} == ${md5Map.get(hash)}`);
      } else {
        md5Map.set(hash, img.filename);
      }
    } catch { console.log(`  ⚠️  Impossibile leggere: ${img.filename}`); }
  }

  if (!duplicates.length) {
    console.log('✅ Nessun duplicato trovato!');
    process.exit(0);
  }

  console.log(`\n📥 Re-scarico ${duplicates.length} immagini duplicate...\n`);

  // usedIds + existingMd5s: aggiornati live durante il loop
  const usedIds = loadUsedIds(imagesDir);
  const existingMd5s = new Set(md5Map.keys()); // MD5 delle immagini keeper

  let fixed = 0;
  for (const dup of duplicates) {
    const query = slugToQuery(dup.filename);
    console.log(`  [${dup.filename}] query: "${query}"...`);

    const result = await fetchUniquePhoto(query, usedIds, existingMd5s);
    if (!result) {
      console.log(`  ❌ Nessuna foto disponibile per "${query}"`);
      continue;
    }

    try {
      writeFileSync(dup.path, result.buf);
      existingMd5s.add(md5(result.buf));
      saveUsedId(imagesDir, result.photo.id);
      usedIds.add(result.photo.id);
      postProcess(dup.path);
      console.log(`  ✅ ${dup.filename} → Pexels #${result.photo.id}`);
      fixed++;
    } catch (err) {
      console.log(`  ❌ Salvataggio fallito: ${err.message}`);
    }

    await new Promise(r => setTimeout(r, 300));
  }

  console.log(`\n✅ Corrette ${fixed}/${duplicates.length} immagini duplicate`);
}

run().catch(err => { console.error(err); process.exit(1); });
