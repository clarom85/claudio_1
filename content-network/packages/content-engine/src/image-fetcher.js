/**
 * Image fetcher — scarica immagine da Pexels API per ogni articolo
 * Richiede: PEXELS_API_KEY in .env
 * Salva: /public/images/{slug}.jpg nel sito di destinazione
 */

import { createWriteStream, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { pipeline } from 'stream/promises';

const PEXELS_API = 'https://api.pexels.com/v1/search';
const PEXELS_KEY = process.env.PEXELS_API_KEY;

/**
 * Cerca e scarica un'immagine rilevante per la keyword data.
 * @param {string} keyword - La keyword dell'articolo
 * @param {string} slug    - Lo slug dell'articolo (usato come nome file)
 * @param {string} destDir - Directory pubblica del sito (es. /opt/content-network/sites/pulse/public)
 * @returns {string|null}  - Path relativo usabile in HTML (es. /images/slug.jpg), o null se fallisce
 */
export async function fetchArticleImage(keyword, slug, destDir) {
  if (!PEXELS_KEY) {
    console.warn('  [image] PEXELS_API_KEY not set, skipping image fetch');
    return null;
  }

  // Semplifica la keyword per la ricerca (rimuovi parole superflue)
  const searchQuery = sanitizeQuery(keyword);

  try {
    const res = await fetch(
      `${PEXELS_API}?query=${encodeURIComponent(searchQuery)}&per_page=5&orientation=landscape`,
      { headers: { Authorization: PEXELS_KEY } }
    );

    if (!res.ok) {
      console.warn(`  [image] Pexels API error: ${res.status} ${res.statusText}`);
      return null;
    }

    const data = await res.json();
    if (!data.photos?.length) {
      console.warn(`  [image] No photos found for query: "${searchQuery}"`);
      return null;
    }

    // Prendi la prima foto (landscape, qualità alta ma non enorme)
    const photo = data.photos[0];
    const imageUrl = photo.src.large; // 940px wide — buon compromesso qualità/peso

    // Scarica e salva
    const imagesDir = join(destDir, 'images');
    if (!existsSync(imagesDir)) mkdirSync(imagesDir, { recursive: true });

    const destPath = join(imagesDir, `${slug}.jpg`);
    const imgRes = await fetch(imageUrl);
    if (!imgRes.ok) throw new Error(`Failed to download image: ${imgRes.status}`);

    await pipeline(imgRes.body, createWriteStream(destPath));

    console.log(`  [image] Saved: /images/${slug}.jpg (source: Pexels photo ${photo.id})`);
    return `/images/${slug}.jpg`;

  } catch (err) {
    console.warn(`  [image] Failed for "${keyword}": ${err.message}`);
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
    .replace(/\b\d{4,5}\b/g, '')  // rimuovi numeri lunghi (ZIP codes, ecc.)
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 60); // max 60 chars per la ricerca
}
