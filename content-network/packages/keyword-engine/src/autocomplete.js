/**
 * Google Autocomplete scraper
 * Espande una seed keyword con tutte le lettere A-Z e cifre 0-9
 * + prefissi comuni per long-tail informativi
 */

const PREFIXES = [
  'how to', 'how much', 'what is', 'why does', 'when to',
  'best way to', 'can i', 'should i', 'is it safe to',
  'how long does', 'what happens when', 'how do i', 'tips for',
  'cost of', 'price of', 'average cost', 'how to fix'
];

const SUFFIXES_AZ = 'abcdefghijklmnopqrstuvwxyz'.split('');
const SUFFIXES_09 = '0123456789'.split('');

async function fetchAutocomplete(query, lang = 'en', country = 'us') {
  const encoded = encodeURIComponent(query);
  const url = `https://suggestqueries.google.com/complete/search?client=firefox&hl=${lang}&gl=${country}&q=${encoded}`;

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0'
      },
      signal: AbortSignal.timeout(5000)
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data[1] || [];
  } catch {
    return [];
  }
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

/**
 * Espande una seed keyword in centinaia di long-tail
 * Rispetta rate limiting per non triggherare blocchi
 */
export async function expandKeyword(seed, { lang = 'en', country = 'us', delay = 300 } = {}) {
  const results = new Set();

  // 1. Base
  const base = await fetchAutocomplete(seed, lang, country);
  base.forEach(k => results.add(k));
  await sleep(delay);

  // 2. A-Z expansion
  for (const char of SUFFIXES_AZ) {
    const suggestions = await fetchAutocomplete(`${seed} ${char}`, lang, country);
    suggestions.forEach(k => results.add(k));
    await sleep(delay);
  }

  // 3. Prefix expansion (solo i più rilevanti per non esplodere le richieste)
  const relevantPrefixes = seed.length < 20 ? PREFIXES.slice(0, 8) : PREFIXES.slice(0, 4);
  for (const prefix of relevantPrefixes) {
    const suggestions = await fetchAutocomplete(`${prefix} ${seed}`, lang, country);
    suggestions.forEach(k => results.add(k));
    await sleep(delay);
  }

  return [...results].filter(k => k.length > seed.length + 2);
}

/**
 * Espande un array di seed keywords in parallelo controllato
 */
export async function expandAllSeeds(seeds, options = {}) {
  const allKeywords = new Set();
  for (const seed of seeds) {
    console.log(`  Expanding: "${seed}"`);
    const expanded = await expandKeyword(seed, options);
    expanded.forEach(k => allKeywords.add(k));
    await sleep(500);
  }
  return [...allKeywords];
}
