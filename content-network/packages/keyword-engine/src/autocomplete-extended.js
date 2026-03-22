/**
 * Extended Autocomplete Sources
 * YouTube, Bing, Amazon — stessa logica di Google autocomplete
 * ma fonti diverse = keywords diverse, più long-tail commerciali
 */

const DELAY = 400;
const sleep = ms => new Promise(r => setTimeout(r, ms));

// ── YouTube Autocomplete ──────────────────────────────────────
// Ottimo per: how-to, tutorials, "best X", review — intento video = intento reale
async function fetchYouTube(query) {
  const url = `https://suggestqueries.google.com/complete/search?client=youtube&ds=yt&q=${encodeURIComponent(query)}`;
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
      signal: AbortSignal.timeout(5000)
    });
    if (!res.ok) return [];
    const text = await res.text();
    // Risposta JSONP: window.google.ac.h([["kw1",...]])
    const match = text.match(/\[\[(.+)\]\]/);
    if (!match) return [];
    const items = JSON.parse(`[[${match[1]}]]`);
    return items.map(i => i[0]).filter(Boolean);
  } catch { return []; }
}

// ── Bing Autocomplete ─────────────────────────────────────────
// Ottimo per: keywords che Google non suggerisce, varianti commerciali
async function fetchBing(query) {
  const url = `https://api.bing.com/osjson.aspx?query=${encodeURIComponent(query)}&market=en-US`;
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
      signal: AbortSignal.timeout(5000)
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data[1] || [];
  } catch { return []; }
}

// ── Amazon Autocomplete ───────────────────────────────────────
// Ottimo per: intento commerciale/transazionale puro (best, buy, cheap, review)
async function fetchAmazon(query) {
  const url = `https://completion.amazon.com/api/2017/suggestions?limit=10&prefix=${encodeURIComponent(query)}&suggestion-type=KEYWORD&page-type=Search&lop=en_US&site-variant=desktop&mid=ATVPDKIKX0DER&alias=aps`;
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json'
      },
      signal: AbortSignal.timeout(5000)
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.suggestions || []).map(s => s.value).filter(Boolean);
  } catch { return []; }
}

// ── Quora scraping ────────────────────────────────────────────
// Ottimo per: domande informazionali lunghe, "how do people X"
async function fetchQuora(query) {
  const url = `https://www.quora.com/search?q=${encodeURIComponent(query)}&type=question`;
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
        'Accept': 'text/html'
      },
      signal: AbortSignal.timeout(8000)
    });
    if (!res.ok) return [];
    const html = await res.text();
    // Estrai titoli di domande dal markup
    const matches = [...html.matchAll(/class="q-text qu-dynamicFontSize--regular[^"]*">([^<]{20,120})\?</g)];
    return matches.map(m => m[1].trim() + '?').slice(0, 15);
  } catch { return []; }
}

// ── Espansione A-Z per ogni fonte ─────────────────────────────
const AZ = 'abcdefghijklmnopqrstuvwxyz'.split('');

async function expandWithSource(fetchFn, seed, useAZ = true) {
  const results = new Set();

  // Base query
  const base = await fetchFn(seed);
  base.forEach(k => results.add(k));
  await sleep(DELAY);

  if (useAZ) {
    // A-Z expansion (solo prime 13 lettere per bilanciare velocità/quantità)
    for (const char of AZ.slice(0, 13)) {
      const suggestions = await fetchFn(`${seed} ${char}`);
      suggestions.forEach(k => results.add(k));
      await sleep(DELAY);
    }
  }

  return [...results];
}

/**
 * Espande keyword con YouTube + Bing + Amazon + Quora
 *
 * @param {string[]} seeds - seed keywords
 * @returns {string[]} keywords raw
 */
export async function expandAllExtended(seeds) {
  const allKeywords = new Set();

  for (const seed of seeds) {
    console.log(`  [Extended] Expanding: "${seed}"`);

    // YouTube — A-Z expansion
    console.log('    → YouTube...');
    const yt = await expandWithSource(fetchYouTube, seed, true);
    yt.forEach(k => allKeywords.add(k));
    console.log(`       ${yt.length} suggestions`);

    // Bing — A-Z expansion
    console.log('    → Bing...');
    const bing = await expandWithSource(fetchBing, seed, true);
    bing.forEach(k => allKeywords.add(k));
    console.log(`       ${bing.length} suggestions`);

    // Amazon — base only (AZ meno utile per Amazon)
    console.log('    → Amazon...');
    const amz = await expandWithSource(fetchAmazon, seed, false);
    amz.forEach(k => allKeywords.add(k));
    console.log(`       ${amz.length} suggestions`);

    // Quora — base only (scraping, non fare troppe richieste)
    console.log('    → Quora...');
    const quora = await expandWithSource(fetchQuora, seed, false);
    quora.forEach(k => allKeywords.add(k));
    console.log(`       ${quora.length} suggestions`);

    await sleep(1000); // pausa tra seed diverse
  }

  return [...allKeywords];
}
