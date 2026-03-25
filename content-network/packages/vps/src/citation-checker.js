/**
 * citation-checker.js — Health check + fix dei link di citazione negli articoli pubblicati.
 *
 * PROBLEMA: Articoli generati prima del fix citation-sources.js possono avere
 * URL inventati (404) nella sezione "Sources & References".
 *
 * FUNZIONAMENTO:
 * 1. Legge tutti gli articoli pubblicati dal DB
 * 2. Estrae gli URL dalla sezione citazioni dell'HTML
 * 3. HEAD check su ciascun URL unico (timeout 6s, concorrenza 10)
 * 4. Riporta quanti sono broken
 * 5. Con --fix: rimpiazza URL broken con il base domain verificato dal TRUSTED_CITATION_URLS
 *    e riscrive HTML su disco + aggiorna DB
 *
 * Uso:
 *   node packages/vps/src/citation-checker.js --site-id 5         # check solo
 *   node packages/vps/src/citation-checker.js --all               # check tutti i siti
 *   node packages/vps/src/citation-checker.js --all --fix         # check + fix
 *   node packages/vps/src/citation-checker.js --site-id 5 --fix
 */

import 'dotenv/config';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { sql } from '@content-network/db';
import { TRUSTED_CITATION_URLS } from '@content-network/content-engine/src/citation-sources.js';

const WWW_ROOT = process.env.WWW_ROOT || '/var/www';
const CONCURRENCY = 10;
const TIMEOUT_MS = 6000;

// Estrae tutti gli href dalla sezione "Sources & References" di un HTML
function extractCitationUrls(html) {
  const urls = [];
  // La sezione citazioni ha classe article-citations
  const sectionMatch = html.match(/<section class="article-citations"[\s\S]*?<\/section>/);
  if (!sectionMatch) return urls;

  const re = /href="([^"]+)"/g;
  let m;
  while ((m = re.exec(sectionMatch[0])) !== null) {
    const url = m[1];
    if (url.startsWith('http')) urls.push(url);
  }
  return [...new Set(urls)];
}

// Controlla un URL con HEAD request, ritorna { url, ok, status, error }
async function checkUrl(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      redirect: 'follow',
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; CitationChecker/1.0)' }
    });
    clearTimeout(timer);
    return { url, ok: res.status < 400, status: res.status };
  } catch (err) {
    clearTimeout(timer);
    return { url, ok: false, status: 0, error: err.message.slice(0, 60) };
  }
}

// Esegue checkUrl in batch con concorrenza limitata
async function checkUrlsBatch(urls) {
  const results = [];
  for (let i = 0; i < urls.length; i += CONCURRENCY) {
    const batch = urls.slice(i, i + CONCURRENCY);
    const batchResults = await Promise.all(batch.map(checkUrl));
    results.push(...batchResults);
    // Breve pausa tra batch per non stressare i server
    if (i + CONCURRENCY < urls.length) {
      await new Promise(r => setTimeout(r, 300));
    }
  }
  return results;
}

// Dato un URL broken, ritorna l'URL verificato dal TRUSTED_CITATION_URLS
// oppure '' se l'host non è nella whitelist
function getTrustedFallback(url) {
  try {
    const { hostname } = new URL(url);
    return TRUSTED_CITATION_URLS[hostname] || TRUSTED_CITATION_URLS[hostname.replace('www.', '')] || '';
  } catch {
    return '';
  }
}

// Rimpiazza un URL broken nell'HTML con il fallback verificato (o lo rimuove)
function fixCitationInHtml(html, brokenUrl, fallbackUrl) {
  if (fallbackUrl) {
    // Rimpiazza solo nell'href, non nel testo visibile
    return html.split(`href="${brokenUrl}"`).join(`href="${fallbackUrl}"`);
  } else {
    // Rimuovi il link ma mantieni il testo: <a href="broken">Source</a> → Source
    const escaped = brokenUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return html.replace(
      new RegExp(`<a href="${escaped}"[^>]*>([^<]+)<\/a>`, 'g'),
      '$1'
    );
  }
}

async function processArticle(article, brokenUrls, brokenMap, fix, domain) {
  if (!brokenUrls.length) return { fixed: 0 };

  const htmlPath = join(WWW_ROOT, domain, article.slug, 'index.html');
  if (!existsSync(htmlPath)) return { fixed: 0 };

  let html = readFileSync(htmlPath, 'utf-8');
  let dbContent = article.content || '';
  let changed = false;

  for (const brokenUrl of brokenUrls) {
    const fallback = brokenMap.get(brokenUrl) || '';
    html = fixCitationInHtml(html, brokenUrl, fallback);
    dbContent = fixCitationInHtml(dbContent, brokenUrl, fallback);
    changed = true;
  }

  if (changed && fix) {
    writeFileSync(htmlPath, html, 'utf-8');
    await sql`UPDATE articles SET content = ${dbContent}, updated_at = NOW() WHERE id = ${article.id}`;
    return { fixed: brokenUrls.length };
  }
  return { fixed: 0 };
}

async function run() {
  const args = process.argv.slice(2);
  const all = args.includes('--all');
  const fix = args.includes('--fix');
  const siteId = parseInt(
    args.find(a => a.startsWith('--site-id='))?.split('=')[1]
    || args[args.indexOf('--site-id') + 1]
  );

  if (!all && !siteId) {
    console.error('Uso: node citation-checker.js --site-id <id>  oppure  --all  [--fix]');
    process.exit(1);
  }

  const sites = all
    ? await sql`SELECT id, domain FROM sites WHERE status != 'inactive' ORDER BY id`
    : await sql`SELECT id, domain FROM sites WHERE id = ${siteId}`;

  if (!sites.length) { console.error('Nessun sito trovato'); process.exit(1); }

  console.log(`\nCitation Health Check${fix ? ' + FIX' : ''} — ${sites.length} sito/i\n`);

  let totalChecked = 0, totalBroken = 0, totalFixed = 0;

  for (const site of sites) {
    console.log(`\n--- ${site.domain} ---`);

    const articles = await sql`
      SELECT id, slug, content FROM articles
      WHERE site_id = ${site.id} AND status = 'published'
    `;

    if (!articles.length) { console.log('  Nessun articolo pubblicato'); continue; }

    // Raccogli tutti gli URL da tutti gli articoli del sito
    const urlToArticles = new Map(); // url → [article]
    for (const article of articles) {
      const htmlPath = join(WWW_ROOT, site.domain, article.slug, 'index.html');
      if (!existsSync(htmlPath)) continue;
      const html = readFileSync(htmlPath, 'utf-8');
      const urls = extractCitationUrls(html);
      for (const url of urls) {
        if (!urlToArticles.has(url)) urlToArticles.set(url, []);
        urlToArticles.get(url).push(article);
      }
    }

    const uniqueUrls = [...urlToArticles.keys()];
    if (!uniqueUrls.length) { console.log('  Nessuna citation URL trovata'); continue; }

    console.log(`  ${articles.length} articoli, ${uniqueUrls.length} URL unici da controllare...`);

    const results = await checkUrlsBatch(uniqueUrls);
    totalChecked += results.length;

    const broken = results.filter(r => !r.ok);
    totalBroken += broken.length;

    // Mappa broken url → fallback verificato
    const brokenMap = new Map(
      broken.map(r => [r.url, getTrustedFallback(r.url)])
    );

    // Report
    const ok = results.filter(r => r.ok);
    console.log(`  OK: ${ok.length}  |  Broken: ${broken.length}`);
    for (const r of broken) {
      const fallback = brokenMap.get(r.url) || '(nessun fallback)';
      console.log(`  [${r.status || 'ERR'}] ${r.url.slice(0, 80)}`);
      console.log(`        → fallback: ${fallback}`);
      if (r.error) console.log(`        → errore: ${r.error}`);
    }

    if (fix && broken.length) {
      console.log(`  Fixing ${broken.length} URL broken...`);
      // Per ogni articolo che contiene URL broken, fissa
      const affectedArticles = new Set();
      for (const r of broken) {
        for (const art of urlToArticles.get(r.url) || []) {
          affectedArticles.add(art);
        }
      }

      for (const article of affectedArticles) {
        const htmlPath = join(WWW_ROOT, site.domain, article.slug, 'index.html');
        if (!existsSync(htmlPath)) continue;
        let html = readFileSync(htmlPath, 'utf-8');
        let dbContent = article.content || '';
        let changed = false;

        for (const r of broken) {
          if (!urlToArticles.get(r.url)?.includes(article)) continue;
          const fallback = brokenMap.get(r.url) || '';
          const htmlFixed = fixCitationInHtml(html, r.url, fallback);
          const dbFixed = fixCitationInHtml(dbContent, r.url, fallback);
          if (htmlFixed !== html) { html = htmlFixed; changed = true; }
          if (dbFixed !== dbContent) { dbContent = dbFixed; }
        }

        if (changed) {
          writeFileSync(htmlPath, html, 'utf-8');
          await sql`UPDATE articles SET content = ${dbContent}, updated_at = NOW() WHERE id = ${article.id}`;
          totalFixed++;
          console.log(`    Riparato: ${article.slug}`);
        }
      }
    }
  }

  console.log(`\n=== TOTALE ===`);
  console.log(`URL controllati : ${totalChecked}`);
  console.log(`URL broken      : ${totalBroken}`);
  if (fix) console.log(`Articoli fixati : ${totalFixed}`);
  if (!fix && totalBroken > 0) {
    console.log(`\nRilancia con --fix per riparare automaticamente.`);
  }

  process.exit(0);
}

run().catch(err => { console.error(err); process.exit(1); });
