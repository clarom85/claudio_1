/**
 * price-snapshot.js — Monthly price data collector
 *
 * Fetches historical economic data from FRED/BLS for each active niche,
 * saves monthly snapshots to the price_snapshots table.
 *
 * Idempotent: ON CONFLICT DO NOTHING — safe to run multiple times per month.
 * Backfills last 18 months on first run for each metric.
 *
 * Schedule: 1st of each month at 15:xx UTC (via scheduler)
 * Manual:   node packages/vps/src/price-snapshot.js [--niche <slug>]
 */
import 'dotenv/config';
import { sql } from '@content-network/db';

const FRED_KEY = process.env.FRED_API_KEY;
const BLS_KEY  = process.env.BLS_API_KEY;

// ── Metric definitions per niche ─────────────────────────────────────────────

export const NICHE_METRICS = {
  'home-improvement-costs': [
    {
      key:    'lumber-ppi',
      label:  'Lumber & Wood Products PPI',
      fredId: 'WPU0811',
      unit:   'index',
      source: 'BLS via FRED',
      description: 'Producer Price Index for lumber and wood products (base 1982=100). Directly tracks raw material cost for framing, decking, flooring, and finish work — the #1 volatile material cost in residential renovation.',
    },
    {
      key:    'construction-labor',
      label:  'Construction Worker Avg Hourly Wage',
      fredId: 'CES2000000008',
      unit:   'usd',
      source: 'BLS via FRED',
      description: 'Average hourly earnings for construction workers (USD). Labor accounts for 40–60% of any renovation budget — this is the most direct proxy for contractor billing rates.',
    },
    {
      key:    'concrete-ppi',
      label:  'Concrete Products PPI',
      fredId: 'WPU1321',
      unit:   'index',
      source: 'BLS via FRED',
      description: 'Producer Price Index for concrete products — tracks costs for foundations, slabs, driveways, and patios.',
    },
    {
      key:    'copper-ppi',
      label:  'Copper & Brass Products PPI',
      fredId: 'WPU102501',
      unit:   'index',
      source: 'BLS via FRED',
      description: 'Producer Price Index for copper and brass mill shapes — the primary driver of plumbing and electrical rough-in costs, often the biggest surprise in a renovation budget.',
    },
  ],

  'insurance-guide': [
    {
      key:    'household-insurance-cpi',
      label:  'Household Insurance CPI',
      fredId: 'CUSR0000SEHF',
      unit:   'index',
      source: 'BLS via FRED',
      description: 'Consumer Price Index for household insurance (homeowners, renters, and vehicle) — base 1982-84=100.',
    },
    {
      key:    'homeowners-insurance-cpi',
      label:  'Homeowners Insurance CPI',
      fredId: 'CUSR0000SEHF02',
      unit:   'index',
      source: 'BLS via FRED',
      description: 'Consumer Price Index for homeowners insurance (base 1982-84=100).',
    },
    {
      key:    'medical-care-cpi',
      label:  'Medical Care Services CPI',
      fredId: 'CUUR0000SAM2',
      unit:   'index',
      source: 'BLS via FRED',
      description: 'Consumer Price Index for medical care services — key driver of health insurance premiums.',
    },
  ],

  'solar-energy': [
    {
      key:    'electricity-price',
      label:  'Avg US Retail Electricity Price',
      fredId: 'APU000072610',
      unit:   'cents/kWh',
      source: 'EIA via FRED',
      description: 'Average US retail electricity price (cents per kWh) — the primary driver of solar ROI.',
    },
    {
      key:    'ppi-electric-power',
      label:  'Electric Power PPI',
      fredId: 'WPU054',
      unit:   'index',
      source: 'BLS via FRED',
      description: 'Producer Price Index for electric power generation, transmission, and distribution.',
    },
  ],

  'senior-care-medicare': [
    {
      key:    'medical-care-cpi',
      label:  'Medical Care Services CPI',
      fredId: 'CUUR0000SAM2',
      unit:   'index',
      source: 'BLS via FRED',
      description: 'Consumer Price Index for medical care services.',
    },
    {
      key:    'medical-care-cpi',
      label:  'Medical Care CPI',
      fredId: 'CPIMEDSL',
      unit:   'index',
      source: 'BLS via FRED',
      description: 'Consumer Price Index for all medical care — primary cost driver for Medicare premiums and supplemental insurance.',
    },
  ],

  'legal-advice': [
    {
      key:    'professional-services-wages',
      label:  'Professional Services Avg Hourly Wage',
      fredId: 'CES6000000008',
      unit:   'usd',
      source: 'BLS via FRED',
      description: 'Average hourly earnings in professional and business services — tracks attorney and paralegal billing rate trends.',
    },
    {
      key:    'professional-wages',
      label:  'Professional & Business Services Wages',
      fredId: 'CES6000000008',
      unit:   'usd',
      source: 'BLS via FRED',
      description: 'Average hourly earnings in professional and business services — proxy for attorney billing rates.',
    },
  ],

  'personal-finance': [
    {
      key:    'fed-funds-rate',
      label:  'Federal Funds Rate',
      fredId: 'FEDFUNDS',
      unit:   '%',
      source: 'Federal Reserve via FRED',
      description: 'Federal funds effective rate — directly influences savings, CD, and loan rates.',
    },
    {
      key:    'mortgage-30yr',
      label:  '30-Year Fixed Mortgage Rate',
      fredId: 'MORTGAGE30US',
      unit:   '%',
      source: 'Freddie Mac via FRED',
      description: '30-year fixed-rate mortgage average.',
    },
    {
      key:    'cpi-all',
      label:  'CPI (All Items)',
      fredId: 'CPIAUCSL',
      unit:   'index',
      source: 'BLS via FRED',
      description: 'Consumer Price Index for all urban consumers — headline inflation measure.',
    },
  ],
};

// ── FRED historical fetch (monthly, last N months) ────────────────────────────

async function fetchFredHistory(seriesId, months = 18) {
  if (!FRED_KEY) return [];
  const start = new Date();
  start.setMonth(start.getMonth() - months);
  const startStr = start.toISOString().slice(0, 10);

  const url = `https://api.stlouisfed.org/fred/series/observations?series_id=${seriesId}&api_key=${FRED_KEY}&file_type=json&sort_order=asc&observation_start=${startStr}&frequency=m`;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(12000) });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.observations || [])
      .filter(o => o.value !== '.')
      .map(o => ({
        period: o.date.slice(0, 7) + '-01', // normalize to YYYY-MM-01
        value:  parseFloat(o.value),
      }));
  } catch {
    return [];
  }
}

// ── BLS historical fetch (last 2 years, annual frequency) ─────────────────────

async function fetchBlsHistory(seriesId, months = 18) {
  const now = new Date();
  const endYear   = now.getFullYear();
  const startYear = endYear - 2;

  try {
    const body = {
      seriesid: [seriesId],
      startyear: String(startYear),
      endyear:   String(endYear),
      ...(BLS_KEY ? { registrationkey: BLS_KEY } : {}),
    };
    const res = await fetch('https://api.bls.gov/publicAPI/v2/timeseries/data/', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(body),
      signal:  AbortSignal.timeout(12000),
    });
    if (!res.ok) return [];
    const data = await res.json();
    if (data.status !== 'REQUEST_SUCCEEDED') return [];

    const series = data.Results?.series?.[0];
    if (!series) return [];

    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - months);

    return (series.data || [])
      .map(d => {
        // BLS period: "M01" → month 1, "M02" → month 2, etc.
        const monthNum = parseInt(d.period.replace('M', ''), 10);
        if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) return null;
        const month = String(monthNum).padStart(2, '0');
        const period = `${d.year}-${month}-01`;
        return { period, value: parseFloat(d.value) };
      })
      .filter(d => d && !isNaN(d.value) && new Date(d.period) >= cutoff)
      .sort((a, b) => a.period.localeCompare(b.period));
  } catch {
    return [];
  }
}

// ── DB helpers ────────────────────────────────────────────────────────────────

async function ensureTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS price_snapshots (
      id           SERIAL PRIMARY KEY,
      niche_slug   TEXT NOT NULL,
      metric_key   TEXT NOT NULL,
      metric_label TEXT NOT NULL,
      value        NUMERIC NOT NULL,
      period       DATE NOT NULL,
      source       TEXT NOT NULL,
      unit         TEXT NOT NULL DEFAULT 'index',
      series_id    TEXT,
      created_at   TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(niche_slug, metric_key, period)
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_price_snapshots_niche ON price_snapshots(niche_slug, period DESC)`;
}

async function upsertSnapshots(nicheSlug, metric, dataPoints) {
  let saved = 0;
  for (const dp of dataPoints) {
    try {
      await sql`
        INSERT INTO price_snapshots(niche_slug, metric_key, metric_label, value, period, source, unit, series_id)
        VALUES(${nicheSlug}, ${metric.key}, ${metric.label}, ${dp.value}, ${dp.period}, ${metric.source}, ${metric.unit}, ${metric.fredId || metric.blsId || null})
        ON CONFLICT(niche_slug, metric_key, period) DO NOTHING
      `;
      saved++;
    } catch { /* skip bad rows */ }
  }
  return saved;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function collectForNiche(nicheSlug, isBackfill = false) {
  const metrics = NICHE_METRICS[nicheSlug];
  if (!metrics) {
    console.log(`  No metrics defined for ${nicheSlug} — skipping`);
    return;
  }

  const months = isBackfill ? 18 : 2;
  console.log(`  ${nicheSlug} — fetching ${metrics.length} metrics (${months} months)...`);

  for (const metric of metrics) {
    try {
      let dataPoints = [];

      if (metric.fredId) {
        dataPoints = await fetchFredHistory(metric.fredId, months);
      } else if (metric.blsId) {
        dataPoints = await fetchBlsHistory(metric.blsId, months);
      }

      if (!dataPoints.length) {
        console.log(`    [${metric.key}] No data returned`);
        continue;
      }

      const saved = await upsertSnapshots(nicheSlug, metric, dataPoints);
      console.log(`    [${metric.key}] ${saved} rows saved (${dataPoints.length} fetched)`);
    } catch (err) {
      console.warn(`    [${metric.key}] Error: ${err.message}`);
    }
  }
}

async function run() {
  const nicheArg = (() => {
    const i = process.argv.indexOf('--niche');
    return i >= 0 ? process.argv[i + 1] : null;
  })();

  console.log('\n📈 Price Snapshot Collector\n');

  await ensureTable();

  // Determine if this is a first-ever run (backfill 18 months) or regular monthly run
  const [{ count }] = await sql`SELECT COUNT(*)::int AS count FROM price_snapshots`;
  const isBackfill = count === 0;
  if (isBackfill) console.log('  First run — backfilling 18 months of history...\n');

  const niches = nicheArg ? [nicheArg] : Object.keys(NICHE_METRICS);

  for (const slug of niches) {
    await collectForNiche(slug, isBackfill);
  }

  const [{ total }] = await sql`SELECT COUNT(*)::int AS total FROM price_snapshots`;
  console.log(`\n✅ Done. Total snapshots in DB: ${total}`);
  process.exit(0);
}

if (process.argv[1]?.includes('price-snapshot')) {
  run().catch(err => { console.error(err); process.exit(1); });
}
