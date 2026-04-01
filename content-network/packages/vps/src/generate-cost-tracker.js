/**
 * generate-cost-tracker.js — Monthly cost trend pages
 *
 * Reads price_snapshots from DB, generates /cost-tracker/ index page
 * with inline SVG line charts for each metric tracked for the site's niche.
 *
 * Manual:  node packages/vps/src/generate-cost-tracker.js --all
 *          node packages/vps/src/generate-cost-tracker.js --site-id 5
 *
 * Called by scheduler monthly, and by site-spawner at spawn time.
 */
import 'dotenv/config';
import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { sql } from '@content-network/db';
import { NICHE_METRICS } from './price-snapshot.js';

const WWW_ROOT = process.env.WWW_ROOT || '/var/www';

function htmlEsc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ── SVG line chart ─────────────────────────────────────────────────────────────

function buildSvgChart(dataPoints, unit, accentColor = '#2980b9') {
  if (!dataPoints || dataPoints.length < 2) return '';

  const sorted = [...dataPoints].sort((a, b) => a.period.localeCompare(b.period));
  const values = sorted.map(d => d.value);
  const minV = Math.min(...values);
  const maxV = Math.max(...values);
  const range = maxV - minV || 1;

  const W = 560, H = 160;
  const PAD = { top: 16, right: 16, bottom: 36, left: 56 };
  const cW = W - PAD.left - PAD.right;
  const cH = H - PAD.top - PAD.bottom;

  const xS = i => PAD.left + (i / Math.max(sorted.length - 1, 1)) * cW;
  const yS = v => PAD.top + cH - ((v - minV) / range) * cH;

  const pts = sorted.map((d, i) => `${xS(i).toFixed(1)},${yS(d.value).toFixed(1)}`);
  const linePath = `M ${pts.join(' L ')}`;
  const areaPath = `M ${xS(0).toFixed(1)},${(PAD.top + cH).toFixed(1)} L ${pts.join(' L ')} L ${xS(sorted.length - 1).toFixed(1)},${(PAD.top + cH).toFixed(1)} Z`;

  // Y-axis: 3 labels
  const yTicks = [minV, minV + range / 2, maxV];
  const yLabels = yTicks.map(v => {
    let label;
    if (unit === '%')          label = `${v.toFixed(1)}%`;
    else if (unit === 'usd')   label = `$${v.toFixed(2)}`;
    else if (unit === 'cents/kWh') label = `${v.toFixed(1)}¢`;
    else                       label = v.toFixed(1);
    return `<text x="${(PAD.left - 6).toFixed(0)}" y="${(yS(v) + 4).toFixed(0)}" text-anchor="end" font-size="10" fill="#888">${htmlEsc(label)}</text>`;
  }).join('');

  // X-axis: month labels (show every 2nd if crowded)
  const step = sorted.length > 10 ? 2 : 1;
  const xLabels = sorted.map((d, i) => {
    if (i % step !== 0 && i !== sorted.length - 1) return '';
    const date  = new Date(d.period + 'T12:00:00Z');
    const label = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    return `<text x="${xS(i).toFixed(1)}" y="${(H - 6).toFixed(0)}" text-anchor="middle" font-size="10" fill="#888">${label}</text>`;
  }).join('');

  // Latest value dot highlighted
  const lastI = sorted.length - 1;
  const dots = sorted.map((d, i) => {
    const r = i === lastI ? 4 : 3;
    const fill = i === lastI ? accentColor : '#fff';
    const stroke = accentColor;
    return `<circle cx="${xS(i).toFixed(1)}" cy="${yS(d.value).toFixed(1)}" r="${r}" fill="${fill}" stroke="${stroke}" stroke-width="1.5"/>`;
  }).join('');

  // Trend arrow + delta
  const first  = values[0];
  const last   = values[values.length - 1];
  const deltaPct = ((last - first) / first * 100).toFixed(1);
  const arrow  = parseFloat(deltaPct) >= 0 ? '▲' : '▼';
  const deltaColor = parseFloat(deltaPct) >= 0 ? '#e74c3c' : '#27ae60';

  return `<div style="position:relative">
<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;display:block" role="img" aria-label="Price trend chart">
  <defs>
    <linearGradient id="area-${unit.replace(/\W/g, '')}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${accentColor}" stop-opacity="0.18"/>
      <stop offset="100%" stop-color="${accentColor}" stop-opacity="0.02"/>
    </linearGradient>
  </defs>
  <line x1="${PAD.left}" y1="${PAD.top}" x2="${PAD.left}" y2="${PAD.top + cH}" stroke="#eee" stroke-width="1"/>
  <line x1="${PAD.left}" y1="${PAD.top + cH}" x2="${PAD.left + cW}" y2="${PAD.top + cH}" stroke="#eee" stroke-width="1"/>
  <path d="${areaPath}" fill="url(#area-${unit.replace(/\W/g, '')})"/>
  <path d="${linePath}" fill="none" stroke="${accentColor}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>
  ${dots}
  ${yLabels}
  ${xLabels}
</svg>
<div style="position:absolute;top:12px;right:12px;font-size:12px;font-weight:700;color:${deltaColor}">${arrow} ${Math.abs(parseFloat(deltaPct))}% vs ${new Date(sorted[0].period + 'T12:00:00Z').toLocaleDateString('en-US', { month: 'short', year: '2-digit' })}</div>
</div>`;
}

// ── Page builder ───────────────────────────────────────────────────────────────

function buildCostTrackerPage(nicheSlug, nicheName, metricsData, siteConfig) {
  const updatedDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const accentColors = ['#2980b9', '#e67e22', '#27ae60', '#8e44ad', '#c0392b'];

  const metricCards = metricsData.map((m, idx) => {
    if (!m.dataPoints.length) return '';
    const latest  = m.dataPoints[m.dataPoints.length - 1];
    const latDate = new Date(latest.period + 'T12:00:00Z').toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    const color   = accentColors[idx % accentColors.length];

    let formattedValue;
    if (m.unit === '%')           formattedValue = `${latest.value.toFixed(2)}%`;
    else if (m.unit === 'usd')    formattedValue = `$${latest.value.toFixed(2)}`;
    else if (m.unit === 'cents/kWh') formattedValue = `${latest.value.toFixed(1)}¢/kWh`;
    else                          formattedValue = latest.value.toFixed(1);

    const chartSvg = buildSvgChart(m.dataPoints, m.unit, color);

    return `
<div style="background:#fff;border:1px solid #e8e8e8;border-radius:8px;padding:20px;margin-bottom:24px">
  <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:4px">
    <h2 style="margin:0;font-size:17px;color:#1a1a2e">${htmlEsc(m.label)}</h2>
    <span style="font-size:11px;color:#999;white-space:nowrap;margin-left:12px">Source: ${htmlEsc(m.source)}</span>
  </div>
  <div style="margin-bottom:12px">
    <span style="font-size:28px;font-weight:800;color:${color}">${htmlEsc(formattedValue)}</span>
    <span style="font-size:12px;color:#888;margin-left:8px">${htmlEsc(latDate)}</span>
  </div>
  ${chartSvg}
  <div style="background:#f8f9fb;border-left:3px solid ${color};padding:10px 14px;margin-top:14px;border-radius:0 4px 4px 0">
    <div style="font-size:10px;font-weight:700;color:${color};text-transform:uppercase;letter-spacing:.6px;margin-bottom:5px">What this measures</div>
    <p style="font-size:13px;color:#444;margin:0;line-height:1.6">${htmlEsc(m.description)}</p>
  </div>
</div>`;
  }).join('');

  if (!metricCards.trim()) return null;

  const ga4Id  = siteConfig.ga4MeasurementId || '';
  const gscKeys = (process.env.GOOGLE_SITE_VERIFICATION || '').split(',').map(s => s.trim()).filter(Boolean);
  const ga4Script = ga4Id ? `<script async src="https://www.googletagmanager.com/gtag/js?id=${ga4Id}"></script>
<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${ga4Id}',{anonymize_ip:true});</script>` : '';

  const title       = `${nicheName} Cost Tracker — Monthly Price Trends`;
  const description = `Track real monthly price trends for ${nicheName.toLowerCase()} costs. Data sourced from FRED, BLS, and US government agencies. Updated monthly.`;
  const canonical   = `${siteConfig.url}/cost-tracker/`;

  const schemaJson = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    name:    title,
    description,
    url:     canonical,
    creator: { '@type': 'Organization', name: siteConfig.name, url: siteConfig.url },
    temporalCoverage: `${new Date().getFullYear() - 1}/${new Date().getFullYear()}`,
    license: 'https://creativecommons.org/licenses/by/4.0/',
    keywords: `${nicheName}, cost trends, price index, monthly data, FRED, BLS`,
  });

  return `<!DOCTYPE html><html lang="en"><head>
<meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<meta name="robots" content="index, follow, max-image-preview:large"/>
${gscKeys.map(k => `<meta name="google-site-verification" content="${k}"/>`).join('\n')}
<title>${htmlEsc(title)} | ${htmlEsc(siteConfig.name)}</title>
<meta name="description" content="${htmlEsc(description)}"/>
<link rel="canonical" href="${canonical}"/>
<meta property="og:title" content="${htmlEsc(title)}"/>
<meta property="og:description" content="${htmlEsc(description)}"/>
<meta property="og:type" content="website"/>
<meta property="og:site_name" content="${htmlEsc(siteConfig.name)}"/>
<meta property="og:url" content="${canonical}"/>
<meta property="og:image" content="${siteConfig.url}/images/og-default.jpg"/>
<meta name="twitter:card" content="summary_large_image"/>
<link rel="icon" type="image/svg+xml" href="/favicon.svg"/>
<link rel="stylesheet" href="/assets/style.v2.css"/>
<script type="application/ld+json">${schemaJson}</script>
${ga4Script}
</head><body>
<header style="background:#1a1a2e;padding:14px 20px;display:flex;align-items:center;gap:16px">
  <a href="/" style="color:#fff;text-decoration:none;font-size:20px;font-weight:800">${htmlEsc(siteConfig.name)}</a>
  <nav style="margin-left:auto;font-size:13px;display:flex;gap:16px">
    <a href="/glossary/" style="color:rgba(255,255,255,.7);text-decoration:none">Glossary</a>
    <a href="/tools/" style="color:rgba(255,255,255,.7);text-decoration:none">Calculator</a>
    <a href="/cost-tracker/" style="color:#fff;text-decoration:none;font-weight:700">Cost Tracker</a>
  </nav>
</header>
<main style="max-width:760px;margin:16px auto;padding:28px 20px;background:#fff;color:#1a1a1a;border-radius:8px;box-shadow:0 2px 16px rgba(0,0,0,.15)">
  <nav aria-label="Breadcrumb" style="font-size:13px;color:#888;margin-bottom:20px">
    <a href="/" style="color:#2980b9;text-decoration:none">${htmlEsc(siteConfig.name)}</a>
    <span style="margin:0 6px">›</span>
    <span>Cost Tracker</span>
  </nav>

  <h1 style="font-size:26px;color:#1a1a2e;margin:0 0 8px">${htmlEsc(nicheName)} Cost Tracker</h1>
  <p style="color:#555;font-size:15px;margin:0 0 8px">Real monthly price data from US government sources (FRED, Bureau of Labor Statistics). Updated automatically each month.</p>
  <p style="font-size:12px;color:#999;margin:0 0 20px">Last updated: ${updatedDate} &middot; Data: Federal Reserve / BLS</p>

  <div style="background:#eef6ff;border:1px solid #c3daf9;border-radius:6px;padding:14px 16px;margin-bottom:28px">
    <div style="font-size:12px;font-weight:700;color:#1a5c9e;margin-bottom:6px">📖 How to read this data</div>
    <p style="font-size:13px;color:#2c4a6e;margin:0;line-height:1.6">These indices track the real cost of materials and labor that go into home renovation projects, sourced directly from US government agencies. <strong>When an index rises, contractor quotes typically follow within 1–3 months</strong> — materials get passed through to the homeowner. Use the trend charts to gauge whether prices are climbing, stabilizing, or pulling back before locking in a quote or signing a contract.</p>
  </div>

  ${metricCards}

  <div style="background:#f9f9f9;border-radius:8px;padding:16px;margin-top:32px;font-size:13px;color:#666">
    <strong>Data Sources</strong><br/>
    All data is sourced from official US government databases: the
    <a href="https://fred.stlouisfed.org/" rel="noopener noreferrer nofollow" style="color:#2980b9">Federal Reserve Economic Data (FRED)</a>,
    the <a href="https://www.bls.gov/" rel="noopener noreferrer nofollow" style="color:#2980b9">Bureau of Labor Statistics (BLS)</a>,
    and the <a href="https://www.eia.gov/" rel="noopener noreferrer nofollow" style="color:#2980b9">US Energy Information Administration (EIA)</a>.
    Charts show up to 18 months of monthly observations. Index values use the BLS base period (1982-84=100 unless noted).
  </div>
</main>
<footer style="background:#1a1a2e;color:rgba(255,255,255,.6);text-align:center;padding:20px;font-size:13px;margin-top:40px">
  <p>&copy; ${new Date().getFullYear()} ${htmlEsc(siteConfig.name)} &middot;
     <a href="/privacy/" style="color:rgba(255,255,255,.5)">Privacy</a> &middot;
     <a href="/terms/" style="color:rgba(255,255,255,.5)">Terms</a> &middot;
     <a href="/glossary/" style="color:rgba(255,255,255,.5)">Glossary</a>
  </p>
</footer>
</body></html>`;
}

// ── Sitemap helper ─────────────────────────────────────────────────────────────

function addCostTrackerToSitemap(domain) {
  const sitemapPath = join(WWW_ROOT, domain, 'sitemap.xml');
  if (!existsSync(sitemapPath)) return;

  const url = `https://${domain}/cost-tracker/`;
  const sitemap = readFileSync(sitemapPath, 'utf-8');
  if (sitemap.includes('/cost-tracker/')) return; // already present

  const todayStr = new Date().toISOString().slice(0, 10);
  const newEntry = `  <url>\n    <loc>${url}</loc>\n    <lastmod>${todayStr}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.6</priority>\n  </url>`;
  const updated  = sitemap.replace('</urlset>', `${newEntry}\n</urlset>`);
  writeFileSync(sitemapPath, updated, 'utf-8');
  console.log(`  Sitemap updated with /cost-tracker/`);
}

// ── Main export (used by site-spawner) ────────────────────────────────────────

export async function generateCostTrackerForSite({ domain, nicheSlug, nicheName, ga4MeasurementId = '' }) {
  const metrics  = NICHE_METRICS[nicheSlug];
  if (!metrics) {
    console.log(`  No metrics defined for ${nicheSlug} — cost-tracker skipped`);
    return 0;
  }

  const destDir  = join(WWW_ROOT, domain, 'cost-tracker');
  mkdirSync(destDir, { recursive: true });

  const siteConfig = {
    name: domain.replace(/\.[^.]+$/, '').replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
    url:  `https://${domain}`,
    ga4MeasurementId,
  };

  // Fetch snapshots from DB
  const rows = await sql`
    SELECT metric_key, value, period::text AS period
    FROM price_snapshots
    WHERE niche_slug = ${nicheSlug}
    ORDER BY period ASC
  `;

  // Group by metric_key
  const byKey = {};
  for (const r of rows) {
    if (!byKey[r.metric_key]) byKey[r.metric_key] = [];
    byKey[r.metric_key].push({ period: r.period, value: parseFloat(r.value) });
  }

  // Build metricsData with dataPoints
  const metricsData = metrics.map(m => ({
    ...m,
    dataPoints: byKey[m.key] || [],
  }));

  const html = buildCostTrackerPage(nicheSlug, nicheName, metricsData, siteConfig);
  if (!html) {
    console.log(`  No data yet for ${nicheSlug} — cost-tracker page skipped`);
    return 0;
  }

  writeFileSync(join(destDir, 'index.html'), html, 'utf-8');
  addCostTrackerToSitemap(domain);

  const totalPoints = Object.values(byKey).reduce((s, arr) => s + arr.length, 0);
  return totalPoints;
}

// ── CLI runner ─────────────────────────────────────────────────────────────────

async function run() {
  const siteIdArg = (() => {
    const i = process.argv.indexOf('--site-id');
    return i >= 0 ? parseInt(process.argv[i + 1]) : null;
  })();
  const allFlag = process.argv.includes('--all');

  console.log('\n📊 Cost Tracker Page Generator\n');

  let sites;
  if (siteIdArg) {
    sites = await sql`SELECT s.*, n.slug AS niche_slug, n.name AS niche_name, s.ga4_measurement_id FROM sites s JOIN niches n ON s.niche_id = n.id WHERE s.id = ${siteIdArg} AND s.status = 'live'`;
  } else if (allFlag) {
    sites = await sql`SELECT s.*, n.slug AS niche_slug, n.name AS niche_name, s.ga4_measurement_id FROM sites s JOIN niches n ON s.niche_id = n.id WHERE s.status = 'live'`;
  } else {
    console.log('Usage: node generate-cost-tracker.js --all | --site-id <id>');
    process.exit(1);
  }

  for (const site of sites) {
    console.log(`  ${site.domain} (${site.niche_slug})...`);
    try {
      const count = await generateCostTrackerForSite({
        domain:           site.domain,
        nicheSlug:        site.niche_slug,
        nicheName:        site.niche_name,
        ga4MeasurementId: site.ga4_measurement_id || '',
      });
      if (count) console.log(`  ✅ ${site.domain}: /cost-tracker/ generated (${count} data points)`);
      else       console.log(`  ⚠️  ${site.domain}: no data yet — run price-snapshot.js first`);
    } catch (err) {
      console.warn(`  ❌ ${site.domain}: ${err.message}`);
    }
  }

  process.exit(0);
}

if (process.argv[1]?.includes('generate-cost-tracker')) {
  run().catch(err => { console.error(err); process.exit(1); });
}
