/**
 * Live Data Fetcher — inietta dati reali nel prompt prima della generazione
 *
 * Fonti gratuite:
 *   FRED API (Federal Reserve) — tassi, prezzi, indici economici
 *   BLS API  (Bureau of Labor Statistics) — PPI materiali, CPI per categoria
 *   NREL API (National Renewable Energy Lab) — prezzi energia, incentivi solari
 *   Census API — dati abitativi, demografici
 *
 * Env vars opzionali (degrada gracefully se assenti):
 *   FRED_API_KEY  — gratuito: https://fred.stlouisfed.org/docs/api/api_key.html
 *   BLS_API_KEY   — gratuito: https://www.bls.gov/developers/
 *   NREL_API_KEY  — gratuito: https://developer.nrel.gov/signup/
 *
 * Cache in-memory 24h — una sola fetch per serie al giorno.
 */

const CACHE = new Map(); // key → { value, expiresAt }
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 ore

function cached(key, fetcher) {
  const now = Date.now();
  const entry = CACHE.get(key);
  if (entry && entry.expiresAt > now) return Promise.resolve(entry.value);
  return fetcher().then(value => {
    CACHE.set(key, { value, expiresAt: now + CACHE_TTL });
    return value;
  });
}

function formatDate(dateStr) {
  // "2026-02-01" → "February 2026"
  const d = new Date(dateStr + 'T12:00:00Z');
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
}

// ── FRED API ────────────────────────────────────────────────────────────────
async function fetchFredSeries(seriesId) {
  const key = process.env.FRED_API_KEY;
  if (!key) return null;

  const url = `https://api.stlouisfed.org/fred/series/observations?series_id=${seriesId}&api_key=${key}&file_type=json&sort_order=desc&limit=1`;
  const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!res.ok) return null;
  const data = await res.json();
  const obs = data.observations?.[0];
  if (!obs || obs.value === '.') return null;
  return { value: parseFloat(obs.value), date: obs.date, dateFormatted: formatDate(obs.date) };
}

// ── BLS API ─────────────────────────────────────────────────────────────────
async function fetchBlsSeries(seriesIds) {
  const key = process.env.BLS_API_KEY;
  const now = new Date();
  const year = now.getFullYear();

  const body = {
    seriesid: seriesIds,
    startyear: String(year - 1),
    endyear: String(year),
    ...(key ? { registrationkey: key } : {})
  };

  const res = await fetch('https://api.bls.gov/publicAPI/v2/timeseries/data/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(10000)
  });
  if (!res.ok) return {};
  const data = await res.json();
  if (data.status !== 'REQUEST_SUCCEEDED') return {};

  const result = {};
  for (const series of data.Results?.series || []) {
    const latest = series.data?.[0];
    if (!latest) continue;
    result[series.seriesID] = {
      value: parseFloat(latest.value),
      period: `${latest.periodName} ${latest.year}`
    };
  }
  return result;
}

// ── NREL API ─────────────────────────────────────────────────────────────────
async function fetchNrelElectricityRates(state = 'US') {
  const key = process.env.NREL_API_KEY;
  if (!key) return null;
  const url = `https://developer.nrel.gov/api/utility_rates/v3.json?api_key=${key}&address=${state}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!res.ok) return null;
  const data = await res.json();
  const rate = data.outputs?.residential;
  if (!rate) return null;
  return { residentialRate: rate, unit: 'cents/kWh' };
}

// ── Census API ───────────────────────────────────────────────────────────────
async function fetchCensusMedianHomeValue() {
  // American Community Survey 1-year estimate — B25077 (Median value owner-occupied)
  const url = `https://api.census.gov/data/2023/acs/acs1?get=B25077_001E&for=us:1`;
  const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!res.ok) return null;
  const data = await res.json();
  const value = data?.[1]?.[0];
  if (!value) return null;
  return { medianHomeValue: parseInt(value), year: 2023 };
}

// ── Per-niche data builders ──────────────────────────────────────────────────

const NICHE_DATA_FETCHERS = {

  'home-improvement-costs': async () => {
    const results = [];
    try {
      // BLS: PPI for construction materials (PCU236116236116 = residential construction)
      const bls = await cached('bls-construction', () =>
        fetchBlsSeries(['PCU236116236116', 'CUSR0000SAH21'])
      );
      const ppi = bls['PCU236116236116'];
      const applianceCpi = bls['CUSR0000SAH21'];
      if (ppi) results.push(`Residential construction PPI: ${ppi.value.toFixed(1)} (${ppi.period}, BLS)`);
      if (applianceCpi) results.push(`Household appliances CPI: ${applianceCpi.value.toFixed(1)} (${applianceCpi.period}, BLS)`);

      // FRED: lumber PPI proxy
      const lumber = await cached('fred-lumber', () => fetchFredSeries('WPU0811'));
      if (lumber) results.push(`Lumber & wood products PPI: ${lumber.value.toFixed(1)} (${lumber.dateFormatted}, FRED/BLS)`);
    } catch (_) {}
    return results;
  },

  'personal-finance': async () => {
    const results = [];
    try {
      const [ffr, mortgage, cpi, savings] = await Promise.allSettled([
        cached('fred-fedfunds',   () => fetchFredSeries('FEDFUNDS')),
        cached('fred-mortgage30', () => fetchFredSeries('MORTGAGE30US')),
        cached('fred-cpi',        () => fetchFredSeries('CPIAUCSL')),
        cached('fred-savings',    () => fetchFredSeries('DFF')),
      ]);
      if (ffr.value)     results.push(`Federal Funds Rate: ${ffr.value.value.toFixed(2)}% (${ffr.value.dateFormatted}, Federal Reserve / FRED)`);
      if (mortgage.value) results.push(`30-Year Fixed Mortgage Rate: ${mortgage.value.value.toFixed(2)}% (${mortgage.value.dateFormatted}, Freddie Mac / FRED)`);
      if (cpi.value)     results.push(`CPI (all items): ${cpi.value.value.toFixed(1)} (${cpi.value.dateFormatted}, BLS / FRED)`);
    } catch (_) {}
    return results;
  },

  'real-estate-investing': async () => {
    const results = [];
    try {
      const [price, mortgage, starts] = await Promise.allSettled([
        cached('fred-homeprice', () => fetchFredSeries('MSPUS')),
        cached('fred-mortgage30', () => fetchFredSeries('MORTGAGE30US')),
        cached('fred-hostart',   () => fetchFredSeries('HOUST')),
      ]);
      if (price.value)   results.push(`Median US Home Sale Price: $${price.value.value.toLocaleString()} (${price.value.dateFormatted}, Census/HUD via FRED)`);
      if (mortgage.value) results.push(`30-Year Fixed Mortgage Rate: ${mortgage.value.value.toFixed(2)}% (${mortgage.value.dateFormatted}, Freddie Mac / FRED)`);
      if (starts.value)  results.push(`Housing Starts: ${starts.value.value.toFixed(0)}K units annualized (${starts.value.dateFormatted}, Census Bureau / FRED)`);

      const census = await cached('census-homeval', fetchCensusMedianHomeValue);
      if (census) results.push(`Median Owner-Occupied Home Value: $${census.medianHomeValue.toLocaleString()} (${census.year} ACS, US Census Bureau)`);
    } catch (_) {}
    return results;
  },

  'credit-cards-banking': async () => {
    const results = [];
    try {
      const [cardRate, ffr, prime] = await Promise.allSettled([
        cached('fred-ccrate', () => fetchFredSeries('TERMCBCCALLNS')),
        cached('fred-fedfunds', () => fetchFredSeries('FEDFUNDS')),
        cached('fred-prime',    () => fetchFredSeries('DPRIME')),
      ]);
      if (cardRate.value) results.push(`Average Credit Card Interest Rate (commercial banks): ${cardRate.value.value.toFixed(2)}% (${cardRate.value.dateFormatted}, Federal Reserve / FRED)`);
      if (ffr.value)      results.push(`Federal Funds Rate: ${ffr.value.value.toFixed(2)}% (${ffr.value.dateFormatted}, Federal Reserve / FRED)`);
      if (prime.value)    results.push(`Prime Rate: ${prime.value.value.toFixed(2)}% (${prime.value.dateFormatted}, Federal Reserve / FRED)`);
    } catch (_) {}
    return results;
  },

  'solar-energy': async () => {
    const results = [];
    try {
      const elec = await cached('fred-electricity', () => fetchFredSeries('APU000072610'));
      if (elec) results.push(`Average US Retail Electricity Price: ${elec.value.toFixed(1)} cents/kWh (${elec.dateFormatted}, EIA via FRED)`);

      const nrel = await cached('nrel-elec', () => fetchNrelElectricityRates('US'));
      if (nrel) results.push(`Average Residential Electricity Rate: ${nrel.residentialRate.toFixed(1)} cents/kWh (NREL / EIA)`);
    } catch (_) {}
    return results;
  },

  'automotive-guide': async () => {
    const results = [];
    try {
      const [usedCar, newCar, gas] = await Promise.allSettled([
        cached('fred-usedcar', () => fetchFredSeries('CUSR0000SETA02')),
        cached('fred-newcar',  () => fetchFredSeries('CUSR0000SETA01')),
        cached('fred-gas',     () => fetchFredSeries('GASREGCOVW')),
      ]);
      if (usedCar.value) results.push(`Used Car & Truck CPI: ${usedCar.value.value.toFixed(1)} (${usedCar.value.dateFormatted}, BLS via FRED)`);
      if (newCar.value)  results.push(`New Vehicle CPI: ${newCar.value.value.toFixed(1)} (${newCar.value.dateFormatted}, BLS via FRED)`);
      if (gas.value)     results.push(`Average US Regular Gasoline Price: $${gas.value.value.toFixed(2)}/gallon (${gas.value.dateFormatted}, EIA via FRED)`);
    } catch (_) {}
    return results;
  },

  'insurance-guide': async () => {
    const results = [];
    try {
      const [homeIns, autoIns, medCare] = await Promise.allSettled([
        cached('fred-homeins', () => fetchFredSeries('CUSR0000SEHF02')),
        cached('fred-autoins', () => fetchFredSeries('CUSR0000SEHF03')),
        cached('fred-medicare', () => fetchFredSeries('CUUR0000SAM2')),
      ]);
      if (homeIns.value) results.push(`Homeowners Insurance CPI: ${homeIns.value.value.toFixed(1)} (${homeIns.value.dateFormatted}, BLS via FRED)`);
      if (autoIns.value) results.push(`Auto Insurance CPI: ${autoIns.value.value.toFixed(1)} (${autoIns.value.dateFormatted}, BLS via FRED)`);
      if (medCare.value) results.push(`Medical Care Services CPI: ${medCare.value.value.toFixed(1)} (${medCare.value.dateFormatted}, BLS via FRED)`);
    } catch (_) {}
    return results;
  },

  'health-symptoms': async () => {
    const results = [];
    try {
      const medCare = await cached('fred-medcare', () => fetchFredSeries('CUUR0000SAM2'));
      if (medCare) results.push(`Medical Care Services CPI: ${medCare.value.toFixed(1)} (${medCare.dateFormatted}, BLS via FRED)`);
      const hospCost = await cached('fred-hosp', () => fetchFredSeries('CUUR0000SAM22'));
      if (hospCost) results.push(`Hospital & Related Services CPI: ${hospCost.value.toFixed(1)} (${hospCost.dateFormatted}, BLS via FRED)`);
    } catch (_) {}
    return results;
  },

  'senior-care-medicare': async () => {
    const results = [];
    try {
      const [medCare, nursing] = await Promise.allSettled([
        cached('fred-medcare', () => fetchFredSeries('CUUR0000SAM2')),
        cached('fred-nursing', () => fetchFredSeries('CUUR0000SAM213')),
      ]);
      if (medCare.value) results.push(`Medical Care Services CPI: ${medCare.value.value.toFixed(1)} (${medCare.value.dateFormatted}, BLS via FRED)`);
      if (nursing.value) results.push(`Nursing Home & Adult Day Services CPI: ${nursing.value.value.toFixed(1)} (${nursing.value.dateFormatted}, BLS via FRED)`);
    } catch (_) {}
    return results;
  },

  'weight-loss-fitness': async () => {
    const results = [];
    try {
      const food = await cached('fred-food', () => fetchFredSeries('CUUR0000SAF11'));
      if (food) results.push(`Food at Home CPI: ${food.value.toFixed(1)} (${food.dateFormatted}, BLS via FRED)`);
      const sportGoods = await cached('fred-sport', () => fetchFredSeries('CUSR0000SSEA011'));
      if (sportGoods) results.push(`Sporting Goods CPI: ${sportGoods.value.toFixed(1)} (${sportGoods.dateFormatted}, BLS via FRED)`);
    } catch (_) {}
    return results;
  },

  'business-startup': async () => {
    const results = [];
    try {
      const [prime, smallBizRate, cpi] = await Promise.allSettled([
        cached('fred-prime',   () => fetchFredSeries('DPRIME')),
        cached('fred-sbrate',  () => fetchFredSeries('TERMSBLOANS')),
        cached('fred-cpi',     () => fetchFredSeries('CPIAUCSL')),
      ]);
      if (prime.value)      results.push(`Prime Lending Rate: ${prime.value.value.toFixed(2)}% (${prime.value.dateFormatted}, Federal Reserve / FRED)`);
      if (smallBizRate.value) results.push(`Average Small Business Loan Rate: ${smallBizRate.value.value.toFixed(2)}% (${smallBizRate.value.dateFormatted}, Federal Reserve / FRED)`);
      if (cpi.value)        results.push(`CPI (inflation baseline): ${cpi.value.value.toFixed(1)} (${cpi.value.dateFormatted}, BLS / FRED)`);
    } catch (_) {}
    return results;
  },

  'cybersecurity-privacy': async () => {
    // No direct economic API; use tech-adjacent CPI and labor data
    const results = [];
    try {
      const itWorker = await cached('bls-itwage', () =>
        fetchBlsSeries(['OEUN000000015204000000003'])  // Computer occupations mean wage
      );
      // This series may not exist — graceful skip if empty
    } catch (_) {}
    return results;
  },

};

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Fetch live data points for a niche.
 * Returns an array of formatted strings ready to inject into the prompt.
 * Returns empty array if no API keys configured or fetch fails.
 */
export async function fetchLiveData(nicheSlug) {
  const fetcher = NICHE_DATA_FETCHERS[nicheSlug];
  if (!fetcher) return [];

  try {
    const points = await fetcher();
    return points.filter(Boolean);
  } catch (err) {
    console.warn(`[data-fetcher] Failed for ${nicheSlug}:`, err.message);
    return [];
  }
}

/**
 * Format live data points into a prompt block.
 * Returns empty string if no data available.
 */
export function formatLiveDataBlock(dataPoints) {
  if (!dataPoints?.length) return '';
  const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
  return `
LIVE DATA (fetched ${dateStr} — use these exact figures when relevant to the topic; cite the source shown):
${dataPoints.map(p => `- ${p}`).join('\n')}
Note: Weave 1-2 of these data points naturally into your article where relevant. Quote them accurately with the source name. This makes the article uniquely dateable and authoritative.`;
}
