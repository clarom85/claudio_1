/**
 * Health Check — verifica stato di tutti i siti live
 *
 * Usage: node packages/vps/src/health-check.js [--domain example.com]
 *
 * Controlla per ogni sito:
 * - File critici su disco (index.html, style.css, sitemap.xml, robots.txt, ads.txt, 404.html)
 * - Articoli DB vs file HTML su disco
 * - Category pages presenti
 * - HTTP response (se SKIP_HTTP non impostato)
 * - Sitemap non vuota
 * - ads.txt presente
 */
import 'dotenv/config';
import { existsSync, readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';
import { getSitesByStatus, sql } from '@content-network/db';
import { alertCritical, alertWarning } from './alert.js';

const WWW_ROOT = process.env.WWW_ROOT || '/var/www';
const SKIP_HTTP = process.env.SKIP_HTTP === '1';

const args = process.argv.slice(2);
const filterDomain = args.find(a => a.startsWith('--domain='))?.split('=')[1]
  || args[args.indexOf('--domain') + 1];

const RED   = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RESET = '\x1b[0m';
const BOLD  = '\x1b[1m';

function ok(msg)   { console.log(`  ${GREEN}✓${RESET} ${msg}`); }
function warn(msg) { console.log(`  ${YELLOW}⚠${RESET}  ${msg}`); }
function fail(msg) { console.log(`  ${RED}✗${RESET} ${msg}`); }

async function run() {
  console.log(`\n${BOLD}Content Network — Health Check${RESET}`);
  console.log(`WWW_ROOT: ${WWW_ROOT}`);
  console.log(`Time: ${new Date().toISOString()}\n`);

  let liveSites;
  try {
    liveSites = await getSitesByStatus('live');
  } catch (e) {
    if (e.code === '42P01') {
      console.log('No sites table yet — no live sites to check.');
      process.exit(0);
    }
    throw e;
  }
  const sites = filterDomain
    ? liveSites.filter(s => s.domain === filterDomain)
    : liveSites;

  if (!sites.length) {
    console.log('No live sites found.');
    process.exit(0);
  }

  const summary = { total: sites.length, healthy: 0, warnings: 0, errors: 0 };

  for (const site of sites) {
    const siteDir = join(WWW_ROOT, site.domain);
    const issues = [];
    const warnings = [];

    console.log(`${BOLD}${site.domain}${RESET} (${site.template})`);

    // ── 1. Cartella sito esiste ──────────────────────────────────────────
    if (!existsSync(siteDir)) {
      fail('Site directory missing!');
      issues.push('no-dir');
      summary.errors++;
      console.log('');
      continue;
    }

    // ── 2. File critici (assenza = errore) ───────────────────────────────
    const criticalFiles = [
      ['index.html',         'Homepage'],
      ['assets/style.v2.css',   'CSS'],
      ['sitemap.xml',        'Sitemap'],
      ['robots.txt',         'robots.txt'],
      ['api/articles.json',  'API articles'],
      ['api/categories.json','API categories'],
    ];

    for (const [file, label] of criticalFiles) {
      const path = join(siteDir, file);
      if (!existsSync(path)) {
        fail(`${label} missing: /${file}`);
        issues.push(file);
      } else {
        ok(`${label} exists`);
      }
    }

    // ── File opzionali (assenza = warning, non errore) ────────────────────
    const optionalFiles = [
      ['ads.txt',  'ads.txt (add ADSENSE_ID to activate)'],
      ['404.html', '404 page'],
    ];

    for (const [file, label] of optionalFiles) {
      const path = join(siteDir, file);
      if (!existsSync(path)) {
        warn(`${label} missing`);
        warnings.push(file);
      } else {
        ok(`${file} exists`);
      }
    }

    // ── 3. Sitemap non vuota ──────────────────────────────────────────────
    const sitemapPath = join(siteDir, 'sitemap.xml');
    if (existsSync(sitemapPath)) {
      const sitemap = readFileSync(sitemapPath, 'utf-8');
      const urlCount = (sitemap.match(/<url>/g) || []).length;
      if (urlCount === 0) {
        fail('Sitemap is empty (0 URLs)');
        issues.push('empty-sitemap');
      } else if (urlCount < 5) {
        warn(`Sitemap has only ${urlCount} URL(s)`);
        warnings.push('thin-sitemap');
      } else {
        ok(`Sitemap has ${urlCount} URLs`);
      }
    }

    // ── 4. Articoli: DB vs disco ──────────────────────────────────────────
    const dbArticles = await sql`
      SELECT COUNT(*) as count FROM articles
      WHERE site_id = ${site.id} AND status = 'published'
    `;
    const dbCount = parseInt(dbArticles[0].count);

    // Conta file HTML nelle sottocartelle (ogni articolo = slug/index.html)
    let diskCount = 0;
    try {
      const entries = readdirSync(siteDir, { withFileTypes: true });
      for (const entry of entries) {
        if (!entry.isDirectory()) continue;
        // Escludi cartelle di sistema
        if (['assets','images','api','category','tag','author','tools','page'].includes(entry.name)) continue;
        if (existsSync(join(siteDir, entry.name, 'index.html'))) diskCount++;
      }
    } catch (e) { /* ignore */ }

    if (dbCount === 0) {
      warn(`No published articles in DB (content engine not run yet)`);
      warnings.push('no-articles');
    } else if (diskCount < dbCount) {
      warn(`Articles on disk (${diskCount}) < DB published (${dbCount}) — scheduler may be behind`);
      warnings.push('articles-behind');
    } else {
      ok(`Articles: ${dbCount} in DB, ${diskCount} on disk`);
    }

    // ── 5. Category pages ─────────────────────────────────────────────────
    const catDir = join(siteDir, 'category');
    if (existsSync(catDir)) {
      const cats = readdirSync(catDir, { withFileTypes: true }).filter(e => e.isDirectory());
      if (cats.length === 0) {
        warn('No category directories found');
        warnings.push('no-categories');
      } else {
        ok(`Category pages: ${cats.length} categories`);
      }
    } else {
      warn('No /category/ directory');
      warnings.push('no-categories');
    }

    // ── 6. CSS non vuoto ──────────────────────────────────────────────────
    const cssPath = join(siteDir, 'assets/style.v2.css');
    if (existsSync(cssPath)) {
      const cssSize = statSync(cssPath).size;
      if (cssSize < 1000) {
        warn(`CSS file suspiciously small (${cssSize} bytes)`);
        warnings.push('small-css');
      } else {
        ok(`CSS size: ${(cssSize / 1024).toFixed(1)} KB`);
      }
    }

    // ── 7. HTTP check (opzionale, skip in dev) ────────────────────────────
    if (!SKIP_HTTP && site.cf_deploy_url) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);
        const res = await fetch(site.cf_deploy_url, {
          method: 'HEAD', signal: controller.signal,
          headers: { 'User-Agent': 'ContentNetworkHealthCheck/1.0' }
        });
        clearTimeout(timeout);
        if (res.status === 200) {
          ok(`HTTP ${res.status} — site is live`);
        } else if (res.status === 301 || res.status === 302) {
          ok(`HTTP ${res.status} redirect (normal for www→non-www)`);
        } else {
          fail(`HTTP ${res.status} — unexpected response`);
          issues.push(`http-${res.status}`);
        }
      } catch (e) {
        warn(`HTTP check failed: ${e.message} (DNS may not have propagated yet)`);
        warnings.push('http-unreachable');
      }
    }

    // ── 8. Queue arretrata ────────────────────────────────────────────────
    const queuePending = await sql`
      SELECT COUNT(*) as count FROM publish_queue
      WHERE site_id = ${site.id}
        AND status = 'pending'
        AND scheduled_for < NOW() - INTERVAL '2 hours'
    `;
    const overduePending = parseInt(queuePending[0].count);
    if (overduePending > 10) {
      warn(`${overduePending} articles overdue in publish queue (scheduler down?)`);
      warnings.push('queue-overdue');
    } else if (overduePending > 0) {
      warn(`${overduePending} articles pending in queue (publishing in progress)`);
    } else {
      ok('Publish queue up to date');
    }

    // ── Risultato sito ────────────────────────────────────────────────────
    if (issues.length === 0 && warnings.length === 0) {
      console.log(`  ${GREEN}${BOLD}→ HEALTHY${RESET}`);
      summary.healthy++;
    } else if (issues.length === 0) {
      console.log(`  ${YELLOW}${BOLD}→ OK WITH WARNINGS${RESET} (${warnings.join(', ')})`);
      summary.warnings++;
    } else {
      console.log(`  ${RED}${BOLD}→ ERRORS${RESET} (${issues.join(', ')})`);
      summary.errors++;
    }
    console.log('');
  }

  // ── Disk usage check ──────────────────────────────────────────────────
  try {
    const dfOut = execSync("df -h / | tail -1 | awk '{print $5}'", { encoding: 'utf-8' }).trim();
    const pct = parseInt(dfOut);
    if (pct >= 90) {
      console.log(`${RED}⚠  Disk usage CRITICAL: ${dfOut}${RESET}`);
      await alertCritical('Disk usage critical', `VPS disk at ${dfOut} — immediate action required`);
    } else if (pct >= 80) {
      console.log(`${YELLOW}⚠  Disk usage warning: ${dfOut}${RESET}`);
      await alertWarning('Disk usage high', `VPS disk at ${dfOut}`);
    } else {
      console.log(`${GREEN}✓ Disk usage: ${dfOut}${RESET}`);
    }
  } catch (e) { /* non bloccante */ }

  // ── Summary ───────────────────────────────────────────────────────────
  console.log(`\n${BOLD}Summary${RESET}: ${summary.total} sites checked`);
  console.log(`  ${GREEN}Healthy:  ${summary.healthy}${RESET}`);
  if (summary.warnings) console.log(`  ${YELLOW}Warnings: ${summary.warnings}${RESET}`);
  if (summary.errors)   console.log(`  ${RED}Errors:   ${summary.errors}${RESET}`);
  console.log('');

  // Alert Telegram se ci sono errori
  if (summary.errors > 0) {
    await alertCritical(
      `${summary.errors} site(s) with errors`,
      `Health check found issues. Run health-check manually for details.`
    );
  }

  process.exit(summary.errors > 0 ? 1 : 0);
}

run().catch(err => { console.error('Health check error:', err); process.exit(1); });
