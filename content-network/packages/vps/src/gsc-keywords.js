/**
 * gsc-keywords.js — Estrai query reali da Google Search Console e aggiungile al pool.
 *
 * Usa la Search Console API (searchanalytics.query) per estrarre le query con cui
 * Google ha mostrato il sito, ma per cui non ha ancora un articolo dedicato.
 * Queste sono keyword già validate da Google per il tuo dominio specifico.
 *
 * Filtri applicati:
 *  - impressions ≥ 10 (escludi query rarissime)
 *  - posizione media > 5 (opportunità di salire → keyword con gap di copertura)
 *  - ≥ 3 parole (no query troppo generiche)
 *  - escludi keyword già presenti nel pool (exact match)
 *  - escludi keyword Jaccard ≥ 0.55 vs pool esistente
 *  - escludi branded (nome dominio nella query)
 *
 * Setup:
 *   GSC_SERVICE_ACCOUNT_JSON=/opt/content-network/gsc-service-account.json
 *   Il service account deve avere accesso Owner/Full in GSC.
 *   NB: usa scope 'webmasters.readonly' (diverso dall'Indexing API).
 *
 * Uso: node packages/vps/src/gsc-keywords.js [--site-id <id>] [--days <n>] [--dry-run]
 */
import 'dotenv/config';
import { readFileSync } from 'fs';
import { createSign } from 'crypto';
import { sql } from '@content-network/db';
import { filterKeywords, deduplicateAcrossSites } from '@content-network/keyword-engine/src/filter.js';
import { clusterKeywords } from '@content-network/keyword-engine/src/cluster.js';

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const days = parseInt(args.find(a => a.startsWith('--days='))?.split('=')[1]
  || args[args.indexOf('--days') + 1] || '90');
const siteIdFilter = parseInt(args.find(a => a.startsWith('--site-id='))?.split('=')[1]
  || args[args.indexOf('--site-id') + 1] || '0') || null;

const GSC_JSON = process.env.GSC_SERVICE_ACCOUNT_JSON;

// ─── Auth helpers (riusa da gsc.js) ──────────────────────────────────────────

function loadCredentials() {
  if (!GSC_JSON) return null;
  try {
    const raw = GSC_JSON.startsWith('{') ? GSC_JSON : readFileSync(GSC_JSON, 'utf-8');
    return JSON.parse(raw);
  } catch (e) {
    console.warn(`[GSC] Cannot load credentials: ${e.message}`);
    return null;
  }
}

function buildJWT(credentials, scope) {
  const now = Math.floor(Date.now() / 1000);
  const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({
    iss: credentials.client_email,
    scope,
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  })).toString('base64url');
  const sign = createSign('RSA-SHA256');
  sign.update(`${header}.${payload}`);
  return `${header}.${payload}.${sign.sign(credentials.private_key, 'base64url')}`;
}

async function getAccessToken(credentials, scope) {
  const jwt = buildJWT(credentials, scope);
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });
  const data = await res.json();
  if (!data.access_token) throw new Error(`GSC auth failed: ${JSON.stringify(data)}`);
  return data.access_token;
}

// ─── GSC Search Analytics ─────────────────────────────────────────────────────

async function fetchGscQueries(siteUrl, token, startDate, endDate) {
  const endpoint = `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`;
  const body = {
    startDate,
    endDate,
    dimensions: ['query'],
    rowLimit: 1000,
    startRow: 0,
    dataState: 'all',
  };
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`GSC query failed for ${siteUrl}: ${err}`);
  }
  const data = await res.json();
  return data.rows || [];
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function run() {
  console.log(`\n📊 GSC Keyword Extraction${dryRun ? ' [DRY RUN]' : ''} — last ${days} days\n`);

  const credentials = loadCredentials();
  if (!credentials) {
    console.error('GSC_SERVICE_ACCOUNT_JSON not configured. Set path in .env');
    process.exit(1);
  }

  // Scope per Search Console (diverso dall'Indexing API)
  const token = await getAccessToken(credentials, 'https://www.googleapis.com/auth/webmasters.readonly');

  const siteFilter = siteIdFilter ? sql`AND s.id = ${siteIdFilter}` : sql``;
  const sites = await sql`
    SELECT s.id, s.domain, n.id as niche_id, n.slug as niche_slug
    FROM sites s JOIN niches n ON s.niche_id = n.id
    WHERE s.status = 'live' ${siteFilter}
  `;

  // Date range
  const end = new Date();
  const start = new Date(end - days * 24 * 60 * 60 * 1000);
  const fmt = d => d.toISOString().split('T')[0];
  const startDate = fmt(start);
  const endDate = fmt(end);

  let totalAdded = 0;

  for (const site of sites) {
    console.log(`\n🌐 ${site.domain} [${site.niche_slug}]`);

    // Carica pool esistente per questa nicchia
    const existing = await sql`SELECT keyword FROM keywords WHERE niche_id = ${site.niche_id}`;
    const existingSet = new Set(existing.map(r => r.keyword.toLowerCase().trim()));

    // Carica articoli pubblicati per slug check
    const articles = await sql`SELECT slug FROM articles WHERE site_id = ${site.id}`;
    const slugSet = new Set(articles.map(a => a.slug));

    // Fetch da GSC
    let rows;
    try {
      const siteUrl = `https://${site.domain}/`;
      rows = await fetchGscQueries(siteUrl, token, startDate, endDate);
    } catch (e) {
      console.warn(`  ⚠️  GSC fetch failed: ${e.message}`);
      continue;
    }
    console.log(`  GSC returned ${rows.length} queries`);

    // Filtra opportunità: impressions ≥ 10, posizione > 5, ≥ 3 parole
    const brandTerms = site.domain.split('.')[0].split('-');
    const candidates = rows
      .filter(r => {
        const q = r.keys[0].toLowerCase();
        const words = q.split(/\s+/);
        if (words.length < 3) return false;                          // troppo generico
        if (r.impressions < 10) return false;                        // rarissimo
        if (r.position <= 5) return false;                           // già in top 5, no gap
        if (brandTerms.some(b => b.length > 3 && q.includes(b))) return false; // branded
        return true;
      })
      .map(r => r.keys[0]);

    console.log(`  Candidates after filter: ${candidates.length}`);

    if (candidates.length === 0) continue;

    // Passa per filterKeywords (lunghezza, anni, dedup batch)
    const filtered = filterKeywords(candidates);

    // Dedup vs pool esistente (Jaccard 0.55, fingerprint)
    const deduped = deduplicateAcrossSites(filtered, existing.map(r => r.keyword));

    // Rimuovi predicted slug conflicts
    const clean = deduped.filter(k => {
      const slug = k.keyword.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      return !slugSet.has(slug);
    });

    console.log(`  New unique keywords: ${clean.length}`);

    if (clean.length === 0) continue;

    // Cluster
    const clustered = clusterKeywords(clean.map(k => k.keyword), site.niche_slug, []);
    const clusterMap = new Map(clustered.map(c => [c.keyword, c]));

    if (!dryRun) {
      // Inserisci nel DB
      for (const k of clean) {
        const cluster = clusterMap.get(k.keyword) || {};
        try {
          await sql`
            INSERT INTO keywords (niche_id, keyword, source, intent, cluster_slug, is_pillar, used)
            VALUES (${site.niche_id}, ${k.keyword}, 'gsc', ${k.intent || 'informational'},
                    ${cluster.clusterSlug || null}, ${cluster.isPillar || false}, false)
            ON CONFLICT (niche_id, keyword) DO NOTHING
          `;
          totalAdded++;
        } catch { /* skip on conflict */ }
      }
      console.log(`  ✅ Added ${clean.length} keywords from GSC`);
    } else {
      clean.slice(0, 10).forEach(k => console.log(`  + ${k.keyword}`));
      if (clean.length > 10) console.log(`  ... e altri ${clean.length - 10}`);
    }
  }

  console.log(`\n✅ Total new keywords from GSC: ${dryRun ? '(dry-run)' : totalAdded}`);
  process.exit(0);
}

run().catch(err => { console.error(err); process.exit(1); });
