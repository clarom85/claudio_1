/**
 * Volume Scorer — DataForSEO Keywords Data API
 * Arricchisce le keyword con search_volume, cpc, difficulty.
 *
 * Costo: ~$0.0005/keyword
 *   500 keyword × 20 nicchie = 10.000 query = ~$5 totale
 *
 * Env: DATAFORSEO_LOGIN, DATAFORSEO_PASSWORD
 * Registrazione: https://dataforseo.com (piano pay-as-you-go, no subscription)
 */

const DATAFORSEO_LOGIN    = process.env.DATAFORSEO_LOGIN;
const DATAFORSEO_PASSWORD = process.env.DATAFORSEO_PASSWORD;
const BATCH_SIZE = 1000; // max keywords per chiamata API

function getAuthHeader() {
  const encoded = Buffer.from(`${DATAFORSEO_LOGIN}:${DATAFORSEO_PASSWORD}`).toString('base64');
  return `Basic ${encoded}`;
}

function mapDifficulty(competition) {
  if (competition == null) return 'unknown';
  if (competition < 0.33) return 'low';
  if (competition < 0.66) return 'medium';
  return 'high';
}

/**
 * Chiama DataForSEO per un batch di keyword (max 1000).
 * @param {string[]} keywords
 * @param {string} language  - e.g. 'en'
 * @param {string} country   - location_code, e.g. '2840' (US)
 * @returns {Map<string, {searchVolume, cpc, difficulty}>}
 */
async function fetchVolumesBatch(keywords, language = 'en', locationCode = 2840) {
  const res = await fetch(
    'https://api.dataforseo.com/v3/keywords_data/google_ads/search_volume/live',
    {
      method: 'POST',
      headers: {
        'Authorization': getAuthHeader(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify([{
        keywords,
        language_code: language,
        location_code: locationCode,
      }]),
      signal: AbortSignal.timeout(30000)
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`DataForSEO error ${res.status}: ${err}`);
  }

  const data = await res.json();
  const results = data?.tasks?.[0]?.result || [];
  const map = new Map();

  for (const item of results) {
    map.set(item.keyword.toLowerCase(), {
      searchVolume: item.search_volume || 0,
      cpc:          item.cpc          || 0,
      difficulty:   mapDifficulty(item.competition),
    });
  }

  return map;
}

/**
 * Recupera volumi di ricerca per una lista di keyword.
 * Gestisce automaticamente il batching (max 1000/chiamata).
 *
 * @param {string[]} keywords
 * @param {object}   opts
 * @param {string}   opts.language
 * @param {string}   opts.country   - ISO country code, e.g. 'us'
 * @returns {Map<string, {searchVolume, cpc, difficulty}>}
 */
export async function fetchSearchVolumes(keywords, { language = 'en', country = 'us' } = {}) {
  if (!DATAFORSEO_LOGIN || !DATAFORSEO_PASSWORD) {
    console.log('  [Volume] No DATAFORSEO credentials — skipping volume scoring');
    return new Map();
  }

  // Mappa country ISO → DataForSEO location_code
  const LOCATION_CODES = {
    'us': 2840, 'gb': 2826, 'ca': 2124, 'au': 2036,
    'de': 2276, 'fr': 2250, 'it': 2380, 'es': 2724,
  };
  const locationCode = LOCATION_CODES[country.toLowerCase()] || 2840;

  const allResults = new Map();
  const batches = [];

  for (let i = 0; i < keywords.length; i += BATCH_SIZE) {
    batches.push(keywords.slice(i, i + BATCH_SIZE));
  }

  console.log(`  [Volume] Scoring ${keywords.length} keywords in ${batches.length} batch(es)...`);

  for (let i = 0; i < batches.length; i++) {
    try {
      const batchResults = await fetchVolumesBatch(batches[i], language, locationCode);
      for (const [k, v] of batchResults) allResults.set(k, v);
      console.log(`  [Volume] Batch ${i + 1}/${batches.length}: ${batchResults.size} results`);

      // Pausa tra batch per non saturare l'API
      if (i < batches.length - 1) {
        await new Promise(r => setTimeout(r, 1000));
      }
    } catch (e) {
      console.warn(`  [Volume] Batch ${i + 1} failed: ${e.message}`);
    }
  }

  return allResults;
}
