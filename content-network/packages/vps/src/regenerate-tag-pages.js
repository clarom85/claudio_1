/**
 * regenerate-tag-pages.js — Rigenera tutte le pagine tag per un sito.
 *
 * Allineato con la nuova regola: genera tag pages per TUTTI i tag con >= 1 articolo
 * (precedentemente >= 2, causando mismatch con la sitemap).
 *
 * Uso:
 *   node packages/vps/src/regenerate-tag-pages.js --site-id 5
 *   node packages/vps/src/regenerate-tag-pages.js --all
 */
import 'dotenv/config';
import { readFileSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { sql } from '@content-network/db';

const WWW_ROOT = process.env.WWW_ROOT || '/var/www';
const TEMPLATES_DIR = new URL('../../../templates', import.meta.url).pathname;

async function regenerateTagPages(site) {
  const articles = await sql`
    SELECT slug, title, tags, image, published_at, meta_description
    FROM articles
    WHERE site_id = ${site.id} AND status = 'published'
    ORDER BY published_at DESC
  `;

  // Build tag → articles map, all tags >= 1 article
  const tagMap = {};
  for (const a of articles) {
    for (const tag of (a.tags || [])) {
      const slug = tag.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      if (!slug) continue;
      if (!tagMap[slug]) tagMap[slug] = { name: tag, slug, articles: [] };
      tagMap[slug].articles.push(a);
    }
  }
  const tags = Object.values(tagMap);
  if (!tags.length) { console.log(`  ${site.domain}: no tags`); return 0; }

  let categories = [];
  try {
    categories = JSON.parse(readFileSync(join(WWW_ROOT, site.domain, 'api', 'categories.json'), 'utf-8')).slice(0, 7);
  } catch {}

  const siteName = site.domain.split('.')[0].replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  const siteConfig = {
    id: site.id, domain: site.domain, name: siteName, url: `https://${site.domain}`,
    template: site.template, nicheSlug: site.niche_slug, categories,
    authorName: '', authorTitle: '', authorBio: '', authorAvatar: '',
    adsenseId: process.env.ADSENSE_ID || '', ga4MeasurementId: site.ga4_measurement_id || '',
    mgidSiteId: site.mgid_site_id || '', mgidInArticleId: site.mgid_in_article_id || '',
    mgidSmartId: site.mgid_smart_id || '', tagline: '', toolSlug: null,
  };

  const { renderTagPage } = await import(`${TEMPLATES_DIR}/${site.template}/src/layout.js`);

  for (const tag of tags) {
    const html = renderTagPage(tag, tag.articles, siteConfig);
    const dir = join(WWW_ROOT, site.domain, 'tag', tag.slug);
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, 'index.html'), html, 'utf-8');
  }

  console.log(`  ✅ ${site.domain}: ${tags.length} tag pages (${articles.length} articles)`);
  return tags.length;
}

async function run() {
  const args = process.argv.slice(2);
  const all = args.includes('--all');
  const siteId = parseInt(args.find(a => a.startsWith('--site-id='))?.split('=')[1]
    || args[args.indexOf('--site-id') + 1]);

  if (!all && !siteId) {
    console.error('Uso: node regenerate-tag-pages.js --site-id <id>  oppure  --all');
    process.exit(1);
  }

  const sites = all
    ? await sql`SELECT s.id, s.domain, s.template, s.ga4_measurement_id, s.mgid_site_id, s.mgid_in_article_id, s.mgid_smart_id, n.slug as niche_slug FROM sites s JOIN niches n ON n.id = s.niche_id WHERE s.status != 'inactive' ORDER BY s.id`
    : await sql`SELECT s.id, s.domain, s.template, s.ga4_measurement_id, s.mgid_site_id, s.mgid_in_article_id, s.mgid_smart_id, n.slug as niche_slug FROM sites s JOIN niches n ON n.id = s.niche_id WHERE s.id = ${siteId}`;

  if (!sites.length) { console.error('Nessun sito trovato'); process.exit(1); }

  console.log(`\nRigenerando tag pages per ${sites.length} sito/i...\n`);

  for (const site of sites) {
    try {
      await regenerateTagPages(site);
    } catch (err) {
      console.error(`  ❌ ${site.domain}: ${err.message}`);
    }
  }

  console.log('\nDone.');
  process.exit(0);
}

run().catch(err => { console.error(err); process.exit(1); });
