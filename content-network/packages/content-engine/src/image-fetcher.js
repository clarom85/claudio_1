/**
 * Image fetcher — scarica immagine da Pexels API per ogni articolo
 * Richiede: PEXELS_API_KEY in .env
 * Salva: /public/images/{slug}.jpg nel sito di destinazione
 *
 * Unicità: traccia gli ID foto già usati in images/.pexels-used.json
 * → ogni sito non ripete mai la stessa foto Pexels, anche tra run separati.
 */

import { createWriteStream, mkdirSync, existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { pipeline } from 'stream/promises';

const PEXELS_API = 'https://api.pexels.com/v1/search';
const PEXELS_KEY = process.env.PEXELS_API_KEY;
const USED_IDS_FILE = '.pexels-used.json';

/** Carica l'insieme di photo ID già usati per questo sito. */
function loadUsedIds(imagesDir) {
  const filePath = join(imagesDir, USED_IDS_FILE);
  if (!existsSync(filePath)) return new Set();
  try {
    const data = JSON.parse(readFileSync(filePath, 'utf-8'));
    return new Set(data.ids || []);
  } catch {
    return new Set();
  }
}

/** Persiste un nuovo photo ID nel file di tracciamento. */
function saveUsedId(imagesDir, photoId) {
  const filePath = join(imagesDir, USED_IDS_FILE);
  const usedIds = loadUsedIds(imagesDir);
  usedIds.add(photoId);
  writeFileSync(filePath, JSON.stringify({ ids: [...usedIds] }), 'utf-8');
}

/**
 * Cerca e scarica un'immagine unica (non già usata su questo sito) da Pexels.
 * @param {string} keyword - La keyword dell'articolo
 * @param {string} slug    - Lo slug dell'articolo (usato come nome file)
 * @param {string} destDir - Directory pubblica del sito (es. /var/www/miosito.com)
 * @returns {string|null}  - Path relativo usabile in HTML (es. /images/slug.jpg), o null se fallisce
 */
export async function fetchArticleImage(keyword, slug, destDir) {
  if (!PEXELS_KEY) {
    console.warn('  [image] PEXELS_API_KEY not set, skipping image fetch');
    return null;
  }

  const searchQuery = sanitizeQuery(keyword);
  const imagesDir = join(destDir, 'images');
  if (!existsSync(imagesDir)) mkdirSync(imagesDir, { recursive: true });

  const usedIds = loadUsedIds(imagesDir);

  // Prova fino a 3 pagine di risultati Pexels per trovare una foto non ancora usata
  for (let page = 1; page <= 3; page++) {
    try {
      const res = await fetch(
        `${PEXELS_API}?query=${encodeURIComponent(searchQuery)}&per_page=15&page=${page}&orientation=landscape`,
        { headers: { Authorization: PEXELS_KEY } }
      );

      if (!res.ok) {
        console.warn(`  [image] Pexels API error: ${res.status} ${res.statusText}`);
        return null;
      }

      const data = await res.json();
      if (!data.photos?.length) break; // nessun risultato su questa pagina

      // Trova la prima foto non ancora usata su questo sito
      const photo = data.photos.find(p => !usedIds.has(p.id));
      if (!photo) continue; // tutte già usate → prova pagina successiva

      const imageUrl = photo.src.large; // 940px wide
      const destPath = join(imagesDir, `${slug}.jpg`);

      const imgRes = await fetch(imageUrl);
      if (!imgRes.ok) throw new Error(`Download failed: ${imgRes.status}`);

      await pipeline(imgRes.body, createWriteStream(destPath));

      // Registra questo ID come usato
      saveUsedId(imagesDir, photo.id);

      console.log(`  [image] Saved: /images/${slug}.jpg (Pexels #${photo.id}, page ${page})`);
      return `/images/${slug}.jpg`;

    } catch (err) {
      console.warn(`  [image] Failed for "${keyword}": ${err.message}`);
      return null;
    }
  }

  // Tutte le pagine esaurite — fallback: usa comunque la prima foto disponibile
  console.warn(`  [image] No unique photo found for "${searchQuery}", using first available`);
  try {
    const res = await fetch(
      `${PEXELS_API}?query=${encodeURIComponent(searchQuery)}&per_page=1&orientation=landscape`,
      { headers: { Authorization: PEXELS_KEY } }
    );
    const data = await res.json();
    if (!data.photos?.length) return null;
    const photo = data.photos[0];
    const destPath = join(imagesDir, `${slug}.jpg`);
    const imgRes = await fetch(photo.src.large);
    if (!imgRes.ok) return null;
    await pipeline(imgRes.body, createWriteStream(destPath));
    saveUsedId(imagesDir, photo.id);
    return `/images/${slug}.jpg`;
  } catch {
    return null;
  }
}

/**
 * Pulisce la keyword per la ricerca Pexels.
 * Rimuove costi, prezzi, parole troppo specifiche che danno 0 risultati.
 */
function sanitizeQuery(keyword) {
  return keyword
    .replace(/\bcost(s)?\b/gi, '')
    .replace(/\bprice(s)?\b/gi, '')
    .replace(/\bhow (much|to)\b/gi, '')
    .replace(/\bnear me\b/gi, '')
    .replace(/\b\d{4,5}\b/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 60);
}
