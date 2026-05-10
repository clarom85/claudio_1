/**
 * inject-parentcare-cta.js — Inserisce il banner ParentCare Finder
 * negli articoli pubblicati di medicarepriceguide.com (site-id 11).
 *
 * Idempotente: salta articoli che hanno già `class="parentcare-cta"`.
 * Dopo il run, lanciare `rerender-articles.js --site-id 11` per
 * aggiornare l'HTML su disco.
 *
 * Uso:
 *   node packages/vps/src/inject-parentcare-cta.js --site-id 11
 *   node packages/vps/src/inject-parentcare-cta.js --site-id 11 --dry-run
 */

import 'dotenv/config';
import { sql } from '@content-network/db';
import { buildParentCareCtaHTML } from '@content-network/parentcare/cta-banner';

async function run() {
  const args = process.argv.slice(2);
  const siteId = parseInt(args.find(a => a.startsWith('--site-id='))?.split('=')[1]
    || args[args.indexOf('--site-id') + 1]) || 11;
  const dryRun = args.includes('--dry-run');

  const site = (await sql`
    SELECT s.id, s.domain, n.slug AS niche_slug
    FROM sites s JOIN niches n ON n.id = s.niche_id
    WHERE s.id = ${siteId}
  `)[0];
  if (!site) { console.error(`Site ${siteId} not found`); process.exit(1); }

  console.log(`Injecting ParentCare CTA into ${site.domain} (${site.niche_slug})${dryRun ? ' [DRY RUN]' : ''}\n`);

  const articles = await sql`
    SELECT id, slug, content
    FROM articles
    WHERE site_id = ${siteId} AND status = 'published'
  `;

  const banner = buildParentCareCtaHTML({ source: `article_${site.domain.split('.')[0]}` });
  let ok = 0, skipped = 0, failed = 0;

  for (const a of articles) {
    if (!a.content) { skipped++; continue; }
    if (a.content.includes('class="parentcare-cta"')) { skipped++; continue; }

    const updated = a.content.replace(
      /(<section[^>]*class="[^"]*article-conclusion[^"]*"[\s\S]*?<\/section>)/i,
      (m) => `${m}\n${banner}`
    );

    const finalContent = updated === a.content ? `${a.content}\n${banner}` : updated;
    if (dryRun) {
      console.log(`  · would inject into ${a.slug}`);
      ok++; continue;
    }

    try {
      await sql`UPDATE articles SET content = ${finalContent}, updated_at = NOW() WHERE id = ${a.id}`;
      console.log(`  ✓ ${a.slug}`);
      ok++;
    } catch (err) {
      console.error(`  ✗ ${a.slug}: ${err.message}`);
      failed++;
    }
  }

  console.log(`\nDone. injected=${ok}, skipped=${skipped}, failed=${failed}`);
  if (!dryRun && ok > 0) {
    console.log(`\nNext step: node packages/vps/src/rerender-articles.js --site-id ${siteId}`);
  }
  process.exit(0);
}

run().catch(err => { console.error(err); process.exit(1); });
