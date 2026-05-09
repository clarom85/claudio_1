/**
 * inject-leadgen-cta.js — Backfill: inserisce il banner CTA leadgen
 * negli articoli già pubblicati che non lo contengono ancora.
 *
 * Uso:
 *   node packages/vps/src/inject-leadgen-cta.js --site-id 5
 *   node packages/vps/src/inject-leadgen-cta.js --all
 *
 * Idempotente: salta articoli che hanno già `class="leadgen-cta"`.
 * Dopo l'esecuzione, lanciare `rerender-articles.js --site-id <id>` per
 * scrivere l'HTML aggiornato su disco e purgare la cache.
 */
import 'dotenv/config';
import { sql } from '@content-network/db';
import { buildLeadGenCtaHTML, getLeadGenConfig } from '@content-network/content-engine/src/leadgen-cta.js';

async function processOne(site) {
  const cfg = getLeadGenConfig(site.niche_slug);
  if (!cfg) {
    console.log(`  · ${site.domain} (${site.niche_slug}): nessuna mappatura leadgen, skip.`);
    return { ok: 0, skipped: 0, failed: 0, notMapped: true };
  }

  const articles = await sql`
    SELECT id, slug, content
      FROM articles
     WHERE site_id = ${site.id}
       AND status = 'published'
  `;

  let ok = 0, skipped = 0, failed = 0;
  const sourceTag = `article_${site.domain.split('.')[0]}`;
  const banner = buildLeadGenCtaHTML(site.niche_slug, { source: sourceTag });

  for (const a of articles) {
    if (!a.content) { skipped++; continue; }
    if (a.content.includes('class="leadgen-cta"')) { skipped++; continue; }

    // Inserisci il banner dopo la sezione conclusion (case-insensitive).
    const updated = a.content.replace(
      /(<section[^>]*class="[^"]*article-conclusion[^"]*"[\s\S]*?<\/section>)/i,
      (m) => `${m}\n${banner}`
    );

    if (updated === a.content) {
      // Nessun match della section conclusion → fallback: append in fondo.
      const fallback = `${a.content}\n${banner}`;
      try {
        await sql`UPDATE articles SET content = ${fallback}, updated_at = NOW() WHERE id = ${a.id}`;
        ok++;
        process.stdout.write(`  ✅ (fallback append) ${a.slug}\n`);
      } catch (err) {
        failed++;
        process.stdout.write(`  ❌ ${a.slug}: ${err.message}\n`);
      }
      continue;
    }

    try {
      await sql`UPDATE articles SET content = ${updated}, updated_at = NOW() WHERE id = ${a.id}`;
      ok++;
      process.stdout.write(`  ✅ ${a.slug}\n`);
    } catch (err) {
      failed++;
      process.stdout.write(`  ❌ ${a.slug}: ${err.message}\n`);
    }
  }

  return { ok, skipped, failed };
}

async function run() {
  const args = process.argv.slice(2);
  const all = args.includes('--all');
  const siteIdArg = args.find(a => a.startsWith('--site-id='))?.split('=')[1]
    || args[args.indexOf('--site-id') + 1];

  let sites = [];
  if (all) {
    sites = await sql`
      SELECT s.id, s.domain, n.slug AS niche_slug
        FROM sites s JOIN niches n ON s.niche_id = n.id
       WHERE s.id IN (SELECT DISTINCT site_id FROM articles WHERE status = 'published')
       ORDER BY s.id
    `;
  } else {
    const id = parseInt(siteIdArg);
    if (!id) {
      console.error('Uso: node inject-leadgen-cta.js --site-id <id> | --all');
      process.exit(1);
    }
    sites = await sql`
      SELECT s.id, s.domain, n.slug AS niche_slug
        FROM sites s JOIN niches n ON s.niche_id = n.id
       WHERE s.id = ${id}
    `;
  }

  if (sites.length === 0) {
    console.error('Nessun sito trovato.');
    process.exit(1);
  }

  let totalOk = 0, totalSkipped = 0, totalFailed = 0;
  for (const site of sites) {
    console.log(`\n→ ${site.domain} (niche: ${site.niche_slug})`);
    const r = await processOne(site);
    totalOk += r.ok || 0;
    totalSkipped += r.skipped || 0;
    totalFailed += r.failed || 0;
  }

  console.log(`\n✅ Backfill complete: ${totalOk} updated, ${totalSkipped} skipped (already present or no content), ${totalFailed} failed.`);
  console.log('Successivo: lanciare `rerender-articles.js --site-id <id>` per ciascun sito.');
  process.exit(0);
}

run().catch((err) => { console.error(err); process.exit(1); });
