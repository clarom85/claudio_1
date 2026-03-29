/**
 * generate-data-pages.js — Generates /data/{slug}/ "linkable asset" pages
 * with real FRED/BLS economic data for each niche.
 *
 * Pages are designed to be cited by journalists and bloggers:
 *   - State-by-state data table (sortable)
 *   - CSS bar chart (top 10 states)
 *   - Dataset JSON-LD schema
 *   - Full methodology + source attribution
 *
 * Usage:
 *   node packages/vps/src/generate-data-pages.js --all
 *   node packages/vps/src/generate-data-pages.js --site-id 5
 *
 * Requires: FRED_API_KEY in .env (free — fred.stlouisfed.org)
 * Cache: /tmp/content-network-fred-{seriesType}.json (7-day TTL)
 */
import 'dotenv/config';
import { writeFileSync, mkdirSync, readFileSync, existsSync, statSync } from 'fs';
import { join } from 'path';
import { sql } from '@content-network/db';
import { DATA_PAGE_CONFIGS, US_STATES, DATA_SERIES } from '@content-network/content-engine/src/data-page-configs.js';

const WWW_ROOT  = process.env.WWW_ROOT || '/var/www';
const CACHE_DIR = process.env.TMPDIR || '/tmp';
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days

// ── Helpers ─────────────────────────────────────────────────────────────────

function htmlEsc(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function siteName(domain) {
  return domain
    .replace(/\.(com|net|org|io|co)$/, '')
    .split(/[-.]/)
    .filter(Boolean)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function simplePageWrapper(title, description, content, siteConfig, opts = {}) {
  const { canonical = '', noindex = false } = opts;
  const ga4Id    = siteConfig.ga4MeasurementId || '';
  const robots   = noindex ? 'noindex,follow' : 'index,follow,max-image-preview:large';
  const ga4Block = ga4Id ? `
  <script async src="https://www.googletagmanager.com/gtag/js?id=${ga4Id}"></script>
  <script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${ga4Id}',{anonymize_ip:true});</script>` : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<meta name="robots" content="${robots}"/>
<title>${htmlEsc(title)} | ${htmlEsc(siteConfig.name)}</title>
<meta name="description" content="${htmlEsc(description)}"/>
${canonical ? `<link rel="canonical" href="${htmlEsc(canonical)}"/>` : ''}
<meta property="og:title" content="${htmlEsc(title)}"/>
<meta property="og:description" content="${htmlEsc(description)}"/>
<meta property="og:type" content="dataset"/>
<meta property="og:site_name" content="${htmlEsc(siteConfig.name)}"/>
${canonical ? `<meta property="og:url" content="${htmlEsc(canonical)}"/>` : ''}
<meta property="og:image" content="${siteConfig.url}/images/og-default.jpg"/>
<meta name="twitter:card" content="summary_large_image"/>
<link rel="icon" type="image/svg+xml" href="/favicon.svg"/>
<link rel="stylesheet" href="/assets/style.v2.css"/>
${ga4Block}
<style>
.data-wrap{max-width:900px;margin:40px auto;padding:0 20px;color:#1a1a1a;font-family:system-ui,sans-serif}
.data-breadcrumb{font-size:13px;color:#999;margin-bottom:16px}
.data-breadcrumb a{color:#999;text-decoration:none}
.data-h1{font-size:clamp(22px,4vw,34px);font-weight:700;margin:0 0 12px;line-height:1.25}
.data-lead{font-size:16px;color:#444;line-height:1.75;margin:0 0 28px}
.data-stats-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin:0 0 36px}
.data-stat{background:#f8f9fa;border:1px solid #e5e7eb;border-radius:8px;padding:14px 16px;text-align:center}
.data-stat-label{font-size:11px;text-transform:uppercase;letter-spacing:.07em;color:#6b7280;margin:0 0 4px}
.data-stat-value{font-size:20px;font-weight:700;color:#111}
.data-stat-state{font-size:12px;color:#9ca3af;margin-top:2px}
@media(max-width:600px){.data-stats-grid{grid-template-columns:1fr 1fr}}
h2.data-section-title{font-size:20px;font-weight:700;margin:36px 0 16px;padding-top:24px;border-top:2px solid #e5e7eb}
/* Bar chart */
.bar-chart{margin:0 0 8px}
.bar-row{display:flex;align-items:center;gap:10px;margin-bottom:7px;font-size:14px}
.bar-label{width:140px;text-align:right;color:#374151;flex-shrink:0;font-size:13px}
.bar-track{flex:1;background:#f3f4f6;border-radius:4px;height:22px;position:relative}
.bar-fill{height:100%;border-radius:4px;background:linear-gradient(90deg,#2563eb,#3b82f6);transition:width .3s}
.bar-val{position:absolute;right:6px;top:50%;transform:translateY(-50%);font-size:12px;font-weight:600;color:#1e40af;white-space:nowrap}
/* Data table */
.data-table-wrap{overflow-x:auto;margin:0 0 12px}
.data-table{width:100%;border-collapse:collapse;font-size:14px}
.data-table th{background:#1e3a5f;color:#fff;padding:10px 12px;text-align:left;cursor:pointer;user-select:none;white-space:nowrap;position:sticky;top:0}
.data-table th:hover{background:#2d5282}
.data-table td{padding:9px 12px;border-bottom:1px solid #f0f0f0;vertical-align:middle}
.data-table tbody tr:hover{background:#f8faff}
.data-table .rank{color:#9ca3af;font-size:12px;text-align:center;width:36px}
.data-table .val{font-weight:600;color:#111}
.badge-above{background:#dcfce7;color:#166534;font-size:11px;padding:2px 7px;border-radius:10px;font-weight:600}
.badge-below{background:#fee2e2;color:#991b1b;font-size:11px;padding:2px 7px;border-radius:10px;font-weight:600}
.badge-avg{background:#fef9c3;color:#854d0e;font-size:11px;padding:2px 7px;border-radius:10px;font-weight:600}
.sort-arrow{margin-left:4px;opacity:.5;font-size:11px}
/* Methodology */
.methodology-box{background:#f8f9fa;border-left:4px solid #2563eb;border-radius:0 8px 8px 0;padding:20px 24px;margin:16px 0;font-size:15px;line-height:1.8;color:#374151}
.methodology-box p{margin:0 0 12px}
.methodology-box p:last-child{margin:0}
.data-source-line{font-size:13px;color:#6b7280;margin-top:12px}
.data-source-line a{color:#2563eb}
.data-footer-note{font-size:12px;color:#9ca3af;margin-top:28px;padding-top:16px;border-top:1px solid #e5e7eb}
.cta-box{background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:18px 22px;margin:32px 0;font-size:15px;line-height:1.7;color:#1e40af}
.cta-box a{color:#1d4ed8;font-weight:600}
</style>
</head>
<body>
<header style="background:#1a1a2e;padding:14px 20px;display:flex;align-items:center;gap:16px">
  <a href="/" style="color:#fff;text-decoration:none;font-size:20px;font-weight:800">${htmlEsc(siteConfig.name)}</a>
  <nav style="margin-left:auto;font-size:13px;display:flex;gap:16px;flex-wrap:wrap">
    <a href="/data/" style="color:rgba(255,255,255,.85);text-decoration:none;font-weight:600">Data</a>
    <a href="/glossary/" style="color:rgba(255,255,255,.7);text-decoration:none">Glossary</a>
  </nav>
</header>
<main style="min-height:60vh">${content}</main>
<footer style="background:#1a1a2e;color:rgba(255,255,255,.6);text-align:center;padding:24px 20px;font-size:13px">
  <p>&copy; ${new Date().getFullYear()} ${htmlEsc(siteConfig.name)} &middot;
     <a href="/privacy/" style="color:rgba(255,255,255,.5)">Privacy</a> &middot;
     <a href="/terms/" style="color:rgba(255,255,255,.5)">Terms</a> &middot;
     <a href="/glossary/" style="color:rgba(255,255,255,.5)">Glossary</a> &middot;
     <a href="/data/" style="color:rgba(255,255,255,.5)">Data</a>
  </p>
</footer>
</body>
</html>`;
}

// ── FRED fetcher with file cache ─────────────────────────────────────────────

async function fetchFredObservation(seriesId, apiKey) {
  const url = `https://api.stlouisfed.org/fred/series/observations?series_id=${seriesId}&api_key=${apiKey}&file_type=json&sort_order=desc&limit=1`;
  const res = await fetch(url, { signal: AbortSignal.timeout(12000) });
  if (!res.ok) return null;
  const data = await res.json();
  const obs = data.observations?.[0];
  if (!obs || obs.value === '.') return null;
  return { value: parseFloat(obs.value), date: obs.date };
}

/**
 * Fetch data for all 50 states for a given series type.
 * Results are cached in a JSON file for CACHE_TTL (7 days).
 * Returns array of { abbrev, name, value, date } sorted by value desc.
 * Returns null if no FRED API key configured.
 */
async function fetchAllStateData(seriesType) {
  const apiKey = process.env.FRED_API_KEY;
  if (!apiKey) return null;

  const cacheFile = join(CACHE_DIR, `content-network-fred-${seriesType}.json`);

  // Check file cache
  if (existsSync(cacheFile)) {
    try {
      const ageSecs = (Date.now() - statSync(cacheFile).mtimeMs);
      if (ageSecs < CACHE_TTL) {
        const cached = JSON.parse(readFileSync(cacheFile, 'utf-8'));
        if (Array.isArray(cached) && cached.length > 0) return cached;
      }
    } catch (_) { /* stale/corrupt cache — refetch */ }
  }

  const seriesDef = DATA_SERIES[seriesType];
  const results   = [];
  const BATCH     = 5; // concurrent FRED requests

  console.log(`    Fetching FRED ${seriesType} for ${US_STATES.length} states...`);

  for (let i = 0; i < US_STATES.length; i += BATCH) {
    const batch = US_STATES.slice(i, i + BATCH);
    const settled = await Promise.allSettled(
      batch.map(async ([abbrev, name]) => {
        const seriesId = seriesDef.buildId(abbrev);
        const obs = await fetchFredObservation(seriesId, apiKey);
        if (!obs) return null;
        return { abbrev, name, value: obs.value, date: obs.date };
      })
    );
    for (const r of settled) {
      if (r.status === 'fulfilled' && r.value) results.push(r.value);
    }
    // Small pause between batches to respect FRED rate limits
    if (i + BATCH < US_STATES.length) {
      await new Promise(r => setTimeout(r, 300));
    }
  }

  if (!results.length) return null;

  // Sort descending by value
  results.sort((a, b) => b.value - a.value);

  // Save to file cache
  try {
    writeFileSync(cacheFile, JSON.stringify(results, null, 2), 'utf-8');
  } catch (_) { /* non-fatal */ }

  return results;
}

// ── HTML builders ────────────────────────────────────────────────────────────

function formatDate(dateStr) {
  if (!dateStr) return new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const d = new Date(dateStr + 'T12:00:00Z');
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function buildDataPageContent(config, stateData, seriesDef, siteConfig) {
  const pageUrl  = `${siteConfig.url}/data/${config.slug}/`;
  const dateNow  = new Date().toISOString().split('T')[0];
  const dataDate = stateData?.length ? formatDate(stateData[0].date) : new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  // Dataset JSON-LD schema
  const datasetSchema = {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    name: config.h1,
    description: config.metaDescription,
    url: pageUrl,
    dateModified: dateNow,
    creator: { '@type': 'Organization', name: siteConfig.name, url: siteConfig.url },
    license: 'https://creativecommons.org/licenses/by/4.0/',
    isAccessibleForFree: true,
    variableMeasured: seriesDef.label,
    spatialCoverage: { '@type': 'Place', name: 'United States' },
    temporalCoverage: String(new Date().getFullYear()),
    distribution: [{
      '@type': 'DataDownload',
      encodingFormat: 'text/html',
      contentUrl: pageUrl,
    }],
    ...(stateData?.length ? {
      measurementTechnique: config.methodology.slice(0, 300),
    } : {}),
  };

  let statsSectionHtml  = '';
  let chartSectionHtml  = '';
  let tableSectionHtml  = '';
  let noDataNoticeHtml  = '';

  if (stateData && stateData.length >= 10) {
    const total = stateData.length;
    const avg   = stateData.reduce((s, r) => s + r.value, 0) / total;
    const top   = stateData[0];
    const bot   = stateData[total - 1];

    // Stats summary
    statsSectionHtml = `
<div class="data-stats-grid">
  <div class="data-stat">
    <div class="data-stat-label">Highest</div>
    <div class="data-stat-value">${htmlEsc(seriesDef.formatValue(top.value))}</div>
    <div class="data-stat-state">${htmlEsc(top.name)}</div>
  </div>
  <div class="data-stat">
    <div class="data-stat-label">National Average</div>
    <div class="data-stat-value">${htmlEsc(seriesDef.formatValue(avg))}</div>
    <div class="data-stat-state">All ${total} states</div>
  </div>
  <div class="data-stat">
    <div class="data-stat-label">Lowest</div>
    <div class="data-stat-value">${htmlEsc(seriesDef.formatValue(bot.value))}</div>
    <div class="data-stat-state">${htmlEsc(bot.name)}</div>
  </div>
</div>`;

    // Bar chart: top 10
    const top10    = stateData.slice(0, 10);
    const maxVal   = top10[0].value;
    const barRows  = top10.map(r => {
      const pct = ((r.value / maxVal) * 100).toFixed(1);
      return `<div class="bar-row">
  <div class="bar-label">${htmlEsc(r.name)}</div>
  <div class="bar-track">
    <div class="bar-fill" style="width:${pct}%"></div>
    <span class="bar-val">${htmlEsc(seriesDef.formatValue(r.value))}</span>
  </div>
</div>`;
    }).join('\n');

    chartSectionHtml = `
<h2 class="data-section-title">Top 10 States — ${htmlEsc(seriesDef.label)}</h2>
<div class="bar-chart">${barRows}</div>
<p style="font-size:12px;color:#9ca3af;margin:4px 0 0">Data: ${htmlEsc(seriesDef.source)} &bull; Period: ${htmlEsc(dataDate)}</p>`;

    // Full sortable table
    const tableRows = stateData.map((r, idx) => {
      const diff     = ((r.value - avg) / avg) * 100;
      const sign     = diff >= 0 ? '+' : '';
      const badgeCls = diff > 5 ? 'badge-above' : diff < -5 ? 'badge-below' : 'badge-avg';
      return `<tr>
    <td class="rank">${idx + 1}</td>
    <td><strong>${htmlEsc(r.name)}</strong> <span style="color:#9ca3af;font-size:12px">${htmlEsc(r.abbrev)}</span></td>
    <td class="val">${htmlEsc(seriesDef.formatValue(r.value))}</td>
    <td><span class="${badgeCls}">${sign}${diff.toFixed(1)}%</span></td>
  </tr>`;
    }).join('\n');

    tableSectionHtml = `
<h2 class="data-section-title">All ${total} States — Complete Data Table</h2>
<p style="font-size:13px;color:#6b7280;margin:0 0 12px">Click column headers to sort. Data period: ${htmlEsc(dataDate)}.</p>
<div class="data-table-wrap">
<table class="data-table" id="stateTable">
  <thead>
    <tr>
      <th onclick="sortTable(0)" title="Sort by rank"># <span class="sort-arrow">&#8597;</span></th>
      <th onclick="sortTable(1)" title="Sort by state">State <span class="sort-arrow">&#8597;</span></th>
      <th onclick="sortTable(2)" title="Sort by ${seriesDef.label}">${htmlEsc(seriesDef.label)} <span class="sort-arrow">&#8597;</span></th>
      <th onclick="sortTable(3)" title="Sort by vs national average">vs Nat&apos;l Avg <span class="sort-arrow">&#8597;</span></th>
    </tr>
  </thead>
  <tbody>${tableRows}</tbody>
</table>
</div>
<script>
(function(){
  var tbl = document.getElementById('stateTable');
  var sortDir = {};
  window.sortTable = function(col) {
    var tbody = tbl.tBodies[0];
    var rows  = Array.from(tbody.rows);
    var asc   = !sortDir[col];
    sortDir   = {};
    sortDir[col] = asc;
    rows.sort(function(a, b) {
      var av = a.cells[col].textContent.trim().replace(/[^0-9.+-]/g,'');
      var bv = b.cells[col].textContent.trim().replace(/[^0-9.+-]/g,'');
      var an = parseFloat(av), bn = parseFloat(bv);
      if (!isNaN(an) && !isNaN(bn)) return asc ? an - bn : bn - an;
      return asc ? av.localeCompare(bv) : bv.localeCompare(av);
    });
    rows.forEach(function(r){ tbody.appendChild(r); });
  };
})();
</script>`;
  } else {
    noDataNoticeHtml = `
<div style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:18px 22px;margin:24px 0;font-size:15px;color:#78350f">
  <strong>Live data temporarily unavailable.</strong> Configure <code>FRED_API_KEY</code> in your environment to enable real-time state data.
  The data structure and methodology below are finalized — data will populate automatically on next page regeneration.
</div>`;
  }

  return `
<script type="application/ld+json">${JSON.stringify(datasetSchema)}</script>
<div class="data-wrap">
  <nav class="data-breadcrumb">
    <a href="/">Home</a> &rsaquo;
    <a href="/data/">Data</a> &rsaquo;
    <span>${htmlEsc(config.h1)}</span>
  </nav>

  <h1 class="data-h1">${htmlEsc(config.h1)}</h1>
  <p class="data-lead">${htmlEsc(config.tableIntro)}</p>

  ${statsSectionHtml}
  ${noDataNoticeHtml}
  ${chartSectionHtml}
  ${tableSectionHtml}

  <h2 class="data-section-title">Data Source &amp; Methodology</h2>
  <div class="methodology-box">
    <p>${htmlEsc(config.methodology)}</p>
    <p class="data-source-line">
      <strong>Source:</strong> <a href="${htmlEsc(seriesDef.sourceUrl)}" rel="nofollow noopener" target="_blank">${htmlEsc(seriesDef.source)}</a><br>
      <strong>Series type:</strong> ${htmlEsc(seriesDef.notes)}<br>
      <strong>Last updated:</strong> ${htmlEsc(dataDate)}<br>
      <strong>Coverage:</strong> All 50 US states
    </p>
  </div>

  <div class="cta-box">
    <strong>Citing this data?</strong> You&apos;re welcome to use and reference this page. Please attribute: &ldquo;${htmlEsc(config.citationText)} via <a href="${htmlEsc(siteConfig.url)}">${htmlEsc(siteConfig.name)}</a>, sourced from ${htmlEsc(seriesDef.source)}.&rdquo;
  </div>

  <p class="data-footer-note">
    Data provided for informational purposes only. Source: ${htmlEsc(seriesDef.source)}.
    All values represent the most recently published observation as of ${htmlEsc(dataDate)}.
    ${htmlEsc(siteConfig.name)} is not affiliated with FRED, the Federal Reserve, BEA, or BLS.
  </p>
</div>`;
}

function buildDataIndexContent(configs, siteConfig) {
  const schemaJson = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `Economic Data Resources — ${siteConfig.name}`,
    numberOfItems: configs.length,
    itemListElement: configs.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.h1,
      url: `${siteConfig.url}/data/${c.slug}/`,
    })),
  });

  const cards = configs.map(c => {
    const seriesDef = DATA_SERIES[c.seriesType];
    return `<a href="/data/${htmlEsc(c.slug)}/" class="data-card">
  <div class="data-card-label">${htmlEsc(seriesDef.label)}</div>
  <div class="data-card-title">${htmlEsc(c.h1)}</div>
  <div class="data-card-desc">${htmlEsc(c.metaDescription.slice(0, 110))}...</div>
  <div class="data-card-source">${htmlEsc(seriesDef.source.split(' via')[0])}</div>
</a>`;
  }).join('\n');

  return `
<script type="application/ld+json">${schemaJson}</script>
<style>
.data-index-wrap{max-width:860px;margin:40px auto;padding:0 20px;font-family:system-ui,sans-serif;color:#1a1a1a}
.data-index-wrap h1{font-size:clamp(22px,4vw,34px);font-weight:700;margin:0 0 10px}
.data-index-wrap .lead{font-size:16px;color:#555;line-height:1.75;margin:0 0 32px}
.data-card{display:block;background:#fff;border:1px solid #e5e7eb;border-radius:10px;padding:18px 22px;margin-bottom:14px;text-decoration:none;color:inherit;transition:border-color .2s,box-shadow .2s}
.data-card:hover{border-color:#2563eb;box-shadow:0 2px 12px rgba(37,99,235,.12)}
.data-card-label{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#2563eb;margin-bottom:5px}
.data-card-title{font-size:18px;font-weight:700;margin:0 0 6px;color:#111}
.data-card-desc{font-size:14px;color:#555;line-height:1.6;margin:0 0 10px}
.data-card-source{font-size:12px;color:#9ca3af}
</style>
<div class="data-index-wrap">
  <nav style="font-size:13px;color:#999;margin-bottom:16px">
    <a href="/" style="color:#999;text-decoration:none">Home</a> &rsaquo; <span>Data</span>
  </nav>
  <h1>Economic Data &amp; Research</h1>
  <p class="lead">State-by-state economic data from official US government sources (FRED, BEA, BLS, FHFA). Free to use and cite with attribution.</p>
  ${cards}
  <p style="font-size:13px;color:#aaa;margin-top:24px">
    ${configs.length} dataset${configs.length > 1 ? 's' : ''} &bull; Updated ${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
  </p>
</div>`;
}

// ── Sitemap updater ──────────────────────────────────────────────────────────

function updateSitemap(siteDir, siteUrl, slugs) {
  const sitemapPath = join(siteDir, 'sitemap.xml');
  if (!existsSync(sitemapPath)) return;
  try {
    let sitemap = readFileSync(sitemapPath, 'utf-8');
    // Remove existing /data/ entries
    sitemap = sitemap.replace(/[ \t]*<url>\s*<loc>[^<]+\/data\/[^<]*<\/loc>[\s\S]*?<\/url>\n?/g, '');
    const entries = [
      `  <url>\n    <loc>${siteUrl}/data/</loc>\n    <changefreq>monthly</changefreq>\n    <priority>0.7</priority>\n  </url>`,
      ...slugs.map(slug =>
        `  <url>\n    <loc>${siteUrl}/data/${slug}/</loc>\n    <changefreq>monthly</changefreq>\n    <priority>0.6</priority>\n  </url>`
      ),
    ].join('\n');
    sitemap = sitemap.replace('</urlset>', `${entries}\n</urlset>`);
    writeFileSync(sitemapPath, sitemap, 'utf-8');
  } catch (_) { /* non-fatal */ }
}

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Generates /data/{slug}/ and /data/ for a single site.
 * Exported for site-spawner integration.
 * @returns {number} number of data pages written (0 or 1)
 */
export async function generateDataPagesForSite({ domain, nicheSlug, nicheName, ga4MeasurementId = '' }) {
  const config = DATA_PAGE_CONFIGS[nicheSlug];
  if (!config) return 0;

  const siteConfig = {
    name: siteName(domain),
    url: `https://${domain}`,
    ga4MeasurementId,
  };

  const seriesDef = DATA_SERIES[config.seriesType];

  // Attempt to fetch state data (returns null if no FRED_API_KEY)
  let stateData = null;
  try {
    stateData = await fetchAllStateData(config.seriesType);
  } catch (err) {
    console.warn(`    [data-pages] FRED fetch failed for ${domain}: ${err.message}`);
  }

  const siteDir  = join(WWW_ROOT, domain);
  const dataRoot = join(siteDir, 'data');
  const pageDir  = join(dataRoot, config.slug);
  mkdirSync(pageDir, { recursive: true });

  // Write the data page
  const pageContent = buildDataPageContent(config, stateData, seriesDef, siteConfig);
  const pageHtml    = simplePageWrapper(
    config.pageTitle,
    config.metaDescription,
    pageContent,
    siteConfig,
    { canonical: `${siteConfig.url}/data/${config.slug}/` }
  );
  writeFileSync(join(pageDir, 'index.html'), pageHtml, 'utf-8');

  // Write the /data/ index page
  const indexContent = buildDataIndexContent([config], siteConfig);
  const indexHtml    = simplePageWrapper(
    `Economic Data & Research — ${siteConfig.name}`,
    `State-by-state economic data from FRED, BEA, and BLS. Free reference data for ${(nicheName || nicheSlug).toLowerCase()} research.`,
    indexContent,
    siteConfig,
    { canonical: `${siteConfig.url}/data/` }
  );
  writeFileSync(join(dataRoot, 'index.html'), indexHtml, 'utf-8');

  // Update sitemap
  updateSitemap(siteDir, siteConfig.url, [config.slug]);

  return 1;
}

// ── CLI runner ───────────────────────────────────────────────────────────────

async function run() {
  const args   = process.argv.slice(2);
  const all    = args.includes('--all');
  const siteId = parseInt(
    args.find(a => a.startsWith('--site-id='))?.split('=')[1]
    || args[args.indexOf('--site-id') + 1]
  );

  if (!all && !siteId) {
    console.error('Usage: node generate-data-pages.js --all  OR  --site-id <id>');
    process.exit(1);
  }

  const sites = all
    ? await sql`SELECT s.id, s.domain, s.ga4_measurement_id, n.slug AS niche_slug, n.name AS niche_name FROM sites s JOIN niches n ON n.id = s.niche_id WHERE s.status != 'inactive' ORDER BY s.id`
    : await sql`SELECT s.id, s.domain, s.ga4_measurement_id, n.slug AS niche_slug, n.name AS niche_name FROM sites s JOIN niches n ON n.id = s.niche_id WHERE s.id = ${siteId}`;

  if (!sites.length) { console.error('No sites found'); process.exit(1); }

  const hasFredKey = !!process.env.FRED_API_KEY;
  console.log(`\nGenerating data pages for ${sites.length} site(s) (FRED key: ${hasFredKey ? 'YES' : 'NO — pages will have placeholder data'})\n`);

  let ok = 0, skip = 0;
  for (const site of sites) {
    const config = DATA_PAGE_CONFIGS[site.niche_slug];
    if (!config) {
      console.log(`  SKIP  ${site.domain} — no data config for "${site.niche_slug}"`);
      skip++;
      continue;
    }
    try {
      await generateDataPagesForSite({
        domain: site.domain,
        nicheSlug: site.niche_slug,
        nicheName: site.niche_name,
        ga4MeasurementId: site.ga4_measurement_id || '',
      });
      console.log(`  OK    ${site.domain} — /data/${config.slug}/`);
      ok++;
    } catch (err) {
      console.error(`  ERROR ${site.domain}: ${err.message}`);
    }
  }

  console.log(`\nDone — ${ok} generated, ${skip} skipped`);
  process.exit(0);
}

run().catch(err => { console.error(err); process.exit(1); });
