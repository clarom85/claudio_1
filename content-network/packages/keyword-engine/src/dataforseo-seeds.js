/**
 * DataForSEO Labs — keyword suggestions per seed keyword
 *
 * Usa il database di DataForSEO (non live scraping) per trovare keyword correlate.
 * Vantaggi rispetto a Google Autocomplete:
 *  - Molto più veloce (database lookup, non scraping in tempo reale)
 *  - Restituisce search_volume + CPC direttamente per ogni keyword
 *  - 50 suggestions per seed → ~800 keyword aggiuntive per run tipico
 *
 * Costo: ~$0.0015/keyword restituita (DataForSEO Labs pricing)
 * Con 16 seeds × 50 results = 800 keywords ≈ $1.20/run
 *
 * Env richieste: DATAFORSEO_LOGIN, DATAFORSEO_PASSWORD
 */

const DATAFORSEO_LOGIN    = process.env.DATAFORSEO_LOGIN;
const DATAFORSEO_PASSWORD = process.env.DATAFORSEO_PASSWORD;

const LOCATION_CODES = {
  us: 2840, gb: 2826, ca: 2124, au: 2036,
  de: 2276, fr: 2250, it: 2380, es: 2724,
};

/**
 * Recupera keyword suggestions da DataForSEO Labs per un array di seed.
 * Elabora i seed in batch da 5 per minimizzare le chiamate API.
 *
 * @param {string[]} seeds
 * @param {object}   opts
 * @param {string}   opts.language - es. 'en'
 * @param {string}   opts.country  - ISO 2-letter, es. 'us'
 * @param {number}   opts.limitPerSeed - keyword per seed (default 50)
 * @returns {string[]} array di keyword (stringhe)
 */
export async function getDataForSEOSuggestions(seeds, { language = 'en', country = 'us', limitPerSeed = 50 } = {}) {
  if (!DATAFORSEO_LOGIN || !DATAFORSEO_PASSWORD) return [];

  const locationCode = LOCATION_CODES[country] || 2840;
  const auth = Buffer.from(`${DATAFORSEO_LOGIN}:${DATAFORSEO_PASSWORD}`).toString('base64');
  const allKeywords = [];

  // Batch di 5 seed per richiesta (DataForSEO supporta task multipli in un body)
  const BATCH = 5;
  for (let i = 0; i < seeds.length; i += BATCH) {
    const batch = seeds.slice(i, i + BATCH);
    const tasks = batch.map(seed => ({
      keyword: seed,
      location_code: locationCode,
      language_code: language,
      limit: limitPerSeed,
      filters: [['keyword_data.keyword_info.search_volume', '>', 0]],
      order_by: ['keyword_data.keyword_info.search_volume,desc'],
    }));

    try {
      const res = await fetch(
        'https://api.dataforseo.com/v3/dataforseo_labs/google/keyword_suggestions/live',
        {
          method: 'POST',
          headers: {
            Authorization: `Basic ${auth}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(tasks),
          signal: AbortSignal.timeout(30000),
        }
      );

      if (!res.ok) {
        console.warn(`  [DataForSEO Labs] HTTP ${res.status}: ${await res.text().catch(() => '')}`);
        continue;
      }

      const data = await res.json();
      for (const task of (data?.tasks || [])) {
        if (task.status_code !== 20000) {
          console.warn(`  [DataForSEO Labs] Task error: ${task.status_message}`);
          continue;
        }
        for (const result of (task?.result || [])) {
          for (const item of (result?.items || [])) {
            if (item.keyword) allKeywords.push(item.keyword);
          }
        }
      }
    } catch (e) {
      console.warn(`  [DataForSEO Labs] ${e.message}`);
    }

    if (i + BATCH < seeds.length) {
      await new Promise(r => setTimeout(r, 500));
    }
  }

  return allKeywords;
}
