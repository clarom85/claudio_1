/**
 * Volume Scorer — search volume, CPC, difficulty per keyword
 *
 * Supporta due provider (in ordine di priorità):
 *
 * 1. Keywords Everywhere API (raccomandato)
 *    $10 per 100.000 crediti = $0.0001/keyword
 *    https://keywordseverywhere.com/api.html
 *    Env: KEYWORDS_EVERYWHERE_API_KEY
 *
 * 2. DataForSEO Keywords Data API
 *    $0.0005/keyword — pay-as-you-go
 *    https://dataforseo.com
 *    Env: DATAFORSEO_LOGIN, DATAFORSEO_PASSWORD
 *
 * Se nessun provider è configurato, il volume scoring viene saltato
 * e le keyword vengono ordinate in modo casuale (funziona comunque).
 */

const KE_API_KEY          = process.env.KEYWORDS_EVERYWHERE_API_KEY;
const DATAFORSEO_LOGIN    = process.env.DATAFORSEO_LOGIN;
const DATAFORSEO_PASSWORD = process.env.DATAFORSEO_PASSWORD;

function mapDifficulty(competition) {
  if (competition == null) return 'unknown';
  if (competition < 0.33) return 'low';
  if (competition < 0.66) return 'medium';
  return 'high';
}

// ── Keywords Everywhere ───────────────────────────────────────
// Batch size: 100 keywords per chiamata (limite API)
async function fetchViaKeywordsEverywhere(keywords, country = 'us') {
  const map = new Map();
  const BATCH = 100;

  for (let i = 0; i < keywords.length; i += BATCH) {
    const batch = keywords.slice(i, i + BATCH);
    const body = new URLSearchParams();
    body.append('country', country);
    body.append('currency', 'USD');
    body.append('dataSource', 'gkp');
    batch.forEach(kw => body.append('kw[]', kw));

    const res = await fetch('https://api.keywordseverywhere.com/v1/get_keyword_data', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${KE_API_KEY}`,
        'Accept': 'application/json'
      },
      body,
      signal: AbortSignal.timeout(15000)
    });

    if (!res.ok) throw new Error(`Keywords Everywhere error ${res.status}: ${await res.text()}`);
    const data = await res.json();

    for (const item of (data.data || [])) {
      map.set(item.keyword.toLowerCase(), {
        searchVolume: item.vol       || 0,
        cpc:          item.cpc?.value || 0,
        difficulty:   mapDifficulty(item.competition),
      });
    }

    if (i + BATCH < keywords.length) {
      await new Promise(r => setTimeout(r, 500));
    }
  }

  return map;
}

// ── DataForSEO ────────────────────────────────────────────────
// Batch size: 1000 keywords per chiamata
async function fetchViaDataForSEO(keywords, language = 'en', country = 'us') {
  const LOCATION_CODES = {
    'us': 2840, 'gb': 2826, 'ca': 2124, 'au': 2036,
    'de': 2276, 'fr': 2250, 'it': 2380, 'es': 2724,
  };
  const locationCode = LOCATION_CODES[country] || 2840;
  const auth = Buffer.from(`${DATAFORSEO_LOGIN}:${DATAFORSEO_PASSWORD}`).toString('base64');
  const map = new Map();
  const BATCH = 1000;

  for (let i = 0; i < keywords.length; i += BATCH) {
    const batch = keywords.slice(i, i + BATCH);
    const res = await fetch(
      'https://api.dataforseo.com/v3/keywords_data/google_ads/search_volume/live',
      {
        method: 'POST',
        headers: { 'Authorization': `Basic ${auth}`, 'Content-Type': 'application/json' },
        body: JSON.stringify([{ keywords: batch, language_code: language, location_code: locationCode }]),
        signal: AbortSignal.timeout(30000)
      }
    );

    if (!res.ok) throw new Error(`DataForSEO error ${res.status}: ${await res.text()}`);
    const data = await res.json();

    for (const item of (data?.tasks?.[0]?.result || [])) {
      map.set(item.keyword.toLowerCase(), {
        searchVolume: item.search_volume || 0,
        cpc:          item.cpc          || 0,
        difficulty:   mapDifficulty(item.competition),
      });
    }

    if (i + BATCH < keywords.length) {
      await new Promise(r => setTimeout(r, 1000));
    }
  }

  return map;
}

// ── API pubblica ──────────────────────────────────────────────

/**
 * Recupera volumi di ricerca per una lista di keyword.
 * Sceglie automaticamente il provider disponibile.
 *
 * @param {string[]} keywords
 * @param {object}   opts
 * @param {string}   opts.language  - e.g. 'en'
 * @param {string}   opts.country   - ISO 2-letter, e.g. 'us'
 * @returns {Map<string, {searchVolume, cpc, difficulty}>}
 */
export async function fetchSearchVolumes(keywords, { language = 'en', country = 'us' } = {}) {
  if (!keywords.length) return new Map();

  if (KE_API_KEY) {
    console.log(`  [Volume] Keywords Everywhere — scoring ${keywords.length} keywords`);
    try {
      return await fetchViaKeywordsEverywhere(keywords, country);
    } catch (e) {
      console.warn(`  [Volume] Keywords Everywhere failed: ${e.message}`);
    }
  }

  if (DATAFORSEO_LOGIN && DATAFORSEO_PASSWORD) {
    console.log(`  [Volume] DataForSEO — scoring ${keywords.length} keywords`);
    try {
      return await fetchViaDataForSEO(keywords, language, country);
    } catch (e) {
      console.warn(`  [Volume] DataForSEO failed: ${e.message}`);
    }
  }

  console.log('  [Volume] No volume provider configured — skipping (set KEYWORDS_EVERYWHERE_API_KEY or DATAFORSEO_LOGIN)');
  return new Map();
}
