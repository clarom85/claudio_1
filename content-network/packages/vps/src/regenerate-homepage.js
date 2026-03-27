/**
 * regenerate-homepage.js — Rigenera index.html per siti esistenti.
 * Uso: node packages/vps/src/regenerate-homepage.js --site-id 5
 *      node packages/vps/src/regenerate-homepage.js --all
 */
import 'dotenv/config';
import { writeFileSync, readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { sql } from '@content-network/db';
import { classifyArticle, getCategoriesForNiche } from '@content-network/content-engine/src/categories.js';
import { generateRssFeed } from './index.js';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const ROOT = join(__dirname, '..', '..', '..');
const TEMPLATES_DIR = join(ROOT, 'templates');
const WWW_ROOT = process.env.WWW_ROOT || '/var/www';

async function buildSiteConfig(site, nicheSlug) {
  const { AUTHOR_PERSONAS } = await import('@content-network/content-engine/src/prompts.js');
  const author = AUTHOR_PERSONAS[nicheSlug] || AUTHOR_PERSONAS['home-improvement-costs'];

  let categories = [];
  try {
    const catsFile = join(WWW_ROOT, site.domain, 'api', 'categories.json');
    categories = JSON.parse(readFileSync(catsFile, 'utf-8')).slice(0, 7);
  } catch {
    categories = getCategoriesForNiche(nicheSlug).slice(0, 7);
  }

  const siteName = site.domain.split('.')[0].replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

  let toolSlug = null;
  try {
    const { TOOL_CONFIGS } = await import('@content-network/content-engine/src/tools/tool-configs.js');
    toolSlug = TOOL_CONFIGS[nicheSlug]?.slug || null;
  } catch {}

  return {
    domain: site.domain,
    name: siteName,
    url: `https://${site.domain}`,
    nicheSlug,
    authorName: author?.name || 'Editorial Team',
    authorAvatar: author?.avatar || 'default',
    authorTitle: author?.title || 'Editor',
    authorBio: author?.bio || '',
    reviewer: author?.reviewer || null,
    trustSources: author?.trustSources || '',
    trustMethodology: author?.trustMethodology || '',
    ymyl: author?.ymyl || false,
    categories,
    adsenseId:        process.env.ADSENSE_ID || '',
    ga4MeasurementId: site.ga4_measurement_id || '',
    ezoicId:          process.env.EZOIC_SITE_ID || '',
    mgidSiteId:       site.mgid_site_id || process.env.MGID_SITE_ID || '',
    mgidInArticleId:  site.mgid_in_article_id || process.env.MGID_IN_ARTICLE_WIDGET_ID || '',
    mgidSmartId:      site.mgid_smart_id || process.env.MGID_SMART_WIDGET_ID || '',
    toolSlug,
  };
}

async function regenerateHomepage(site) {
  const nicheSlug = site.niche_slug;
  const { renderHomePage } = await import(`${TEMPLATES_DIR}/${site.template}/src/layout.js`);

  const articles = await sql`
    SELECT a.slug, a.title, a.meta_description, a.content, a.schema_markup,
           a.tags, a.image, a.published_at, a.created_at
    FROM articles a
    WHERE a.site_id = ${site.id} AND a.status = 'published'
    ORDER BY a.published_at DESC NULLS LAST
    LIMIT 300
  `;

  const siteConfig = await buildSiteConfig(site, nicheSlug);

  const articlesData = articles.map(a => {
    const cat = classifyArticle(nicheSlug, a.slug || '', a.title);
    return {
      slug: a.slug,
      title: a.title,
      metaDescription: a.meta_description,
      excerpt: (a.meta_description || '').slice(0, 120) + '...',
      content: a.content,
      schemas: a.schema_markup || [],
      category: cat.name,
      categorySlug: cat.slug,
      author: siteConfig.authorName,
      date: a.published_at || a.created_at,
      tags: a.tags || [],
      image: a.image || null,
    };
  });

  const homeHtml = renderHomePage(articlesData, siteConfig);
  writeFileSync(join(WWW_ROOT, site.domain, 'index.html'), homeHtml, 'utf-8');

  const feedArticles = articlesData.map(a => ({
    slug: a.slug,
    title: a.title,
    meta_description: a.metaDescription,
    excerpt: a.excerpt,
    published_at: a.date,
    category: a.category,
  }));
  generateRssFeed(site.domain, feedArticles, { siteName: siteConfig.name });
}

async function run() {
  const args = process.argv.slice(2);
  const all = args.includes('--all');
  const siteId = parseInt(args.find(a => a.startsWith('--site-id='))?.split('=')[1]
    || args[args.indexOf('--site-id') + 1]);

  if (!all && !siteId) {
    console.error('Uso: node regenerate-homepage.js --site-id <id>  oppure  --all');
    process.exit(1);
  }

  const sites = all
    ? await sql`SELECT s.*, n.slug as niche_slug FROM sites s JOIN niches n ON s.niche_id = n.id WHERE s.status != 'inactive' ORDER BY s.id`
    : await sql`SELECT s.*, n.slug as niche_slug FROM sites s JOIN niches n ON s.niche_id = n.id WHERE s.id = ${siteId}`;

  if (!sites.length) { console.error('Nessun sito trovato'); process.exit(1); }

  console.log(`Rigenerando homepage per ${sites.length} sito/i...\n`);
  let ok = 0, fail = 0;

  for (const site of sites) {
    try {
      await regenerateHomepage(site);
      console.log(`  OK  ${site.domain}`);
      ok++;
    } catch (err) {
      console.error(`  ERR ${site.domain}: ${err.message}`);
      fail++;
    }
  }

  console.log(`\nCompletato: ${ok} ok, ${fail} falliti`);
  process.exit(0);
}

run().catch(err => { console.error(err); process.exit(1); });
