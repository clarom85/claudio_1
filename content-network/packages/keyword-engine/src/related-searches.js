/**
 * Google Related Searches — "Searches related to X"
 * Estrae le 8 query in fondo alla SERP Google.
 * Diversi dai PAA: sono query più ampie/laterali, ottimi per trovare
 * cluster adiacenti non coperti dai seed originali.
 */

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function fetchRelatedSearches(query) {
  const url = `https://www.google.com/search?q=${encodeURIComponent(query)}&hl=en&gl=us`;
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept': 'text/html'
      },
      signal: AbortSignal.timeout(8000)
    });

    if (!res.ok) return [];
    const html = await res.text();

    const results = new Set();

    // Pattern 1: JSON embedded — "query":"keyword" in related searches block
    const jsonMatches = [...html.matchAll(/"query"\s*:\s*"([^"]{10,100})"/g)];
    for (const m of jsonMatches) {
      const q = m[1].replace(/\\u003c/g, '<').replace(/\\u003e/g, '>').replace(/\\u0026/g, '&');
      if (q && !q.includes('\\') && q !== query) results.add(q);
    }

    // Pattern 2: href links nel blocco related searches (/search?q=...)
    const hrefMatches = [...html.matchAll(/href="\/search\?q=([^"&]{10,150})[^"]*"[^>]*>([^<]{10,100})<\/a>/g)];
    for (const m of hrefMatches) {
      const decoded = decodeURIComponent(m[1].replace(/\+/g, ' '));
      if (decoded && decoded !== query && !/^(site:|inurl:|intitle:)/i.test(decoded)) {
        results.add(decoded);
      }
    }

    return [...results].slice(0, 8);
  } catch {
    return [];
  }
}

/**
 * Fetcha le related searches per ogni seed keyword.
 * @param {string[]} seeds
 * @param {number} delay - ms tra richieste
 * @returns {string[]} keyword raw
 */
export async function getRelatedSearches(seeds, delay = 1500) {
  const all = new Set();

  for (const seed of seeds) {
    const related = await fetchRelatedSearches(seed);
    related.forEach(k => all.add(k));
    await sleep(delay);
  }

  return [...all];
}
