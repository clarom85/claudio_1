/**
 * Scheduler — VPS edition
 * Gira ogni ora. Pubblica articoli, genera nuovi, aggiorna file HTML direttamente.
 * Niente build, niente deploy — scrivi file e nginx serve subito.
 *
 * Cron: 0 * * * * cd /opt/content-network/content-network && node packages/scheduler/src/index.js
 */
import 'dotenv/config';
import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import {
  getDueItems, updateQueueItem, updateArticleStatus,
  getSitesByStatus, getUnusedKeywords, getArticlesBySite, sql
} from '@content-network/db';
import { generateSitemap, writeSiteFile } from '@content-network/vps';
import { classifyArticle, getCategoriesForNiche } from '@content-network/content-engine/src/categories.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '../../..');
const TEMPLATES_DIR = join(ROOT, 'templates');
const WWW_ROOT = process.env.WWW_ROOT || '/var/www';
const ARTICLES_PER_DAY = parseInt(process.env.ARTICLES_PER_DAY || '50');
const BATCH_PER_HOUR = Math.ceil(ARTICLES_PER_DAY / 24);

async function run() {
  const now = new Date();
  console.log(`\n⏰ Scheduler: ${now.toISOString()}`);

  const stats = { published: 0, failed: 0, rebuilt: 0 };

  // 1. Pubblica articoli in coda
  await publishDueArticles(stats);

  // 2. Genera nuovi articoli (ogni giorno alle 01:xx)
  if (now.getHours() === 1) {
    await triggerDailyGeneration();
  }

  // 3. Aggiorna homepage + sitemap dei siti con nuovi articoli
  await rebuildAffectedSites(stats);

  console.log(`\n📊 Done — published: ${stats.published}, failed: ${stats.failed}, rebuilt: ${stats.rebuilt}`);
  process.exit(0);
}

async function publishDueArticles(stats) {
  const due = await getDueItems(BATCH_PER_HOUR);
  if (!due.length) { console.log('  No articles due'); return; }

  console.log(`  Publishing ${due.length} articles...`);

  for (const item of due) {
    try {
      await updateQueueItem(item.id, 'processing');

      // Recupera articolo completo
      const [article] = await sql`
        SELECT a.*, n.slug as niche_slug FROM articles a
        JOIN sites s ON a.site_id = s.id
        JOIN niches n ON s.niche_id = n.id
        WHERE a.id = ${item.article_id}
      `;
      if (!article) throw new Error('Article not found');

      const [site] = await sql`SELECT * FROM sites WHERE id = ${item.site_id}`;
      const siteConfig = await buildSiteConfig(site, article.niche_slug);

      // Genera HTML articolo
      await writeArticlePage(article, siteConfig, site.template);

      // Aggiorna stato DB
      await updateArticleStatus(item.article_id, 'published');
      await sql`UPDATE sites SET articles_count = articles_count + 1 WHERE id = ${item.site_id}`;
      await updateQueueItem(item.id, 'done');

      stats.published++;
      console.log(`  ✅ ${article.title?.slice(0, 60)}`);
    } catch (err) {
      await updateQueueItem(item.id, 'failed', err.message);
      stats.failed++;
      console.log(`  ❌ ${err.message}`);
    }
  }
}

async function writeArticlePage(article, siteConfig, template) {
  const { renderArticlePage } = await import(`${TEMPLATES_DIR}/${template}/src/layout.js`);

  // Recupera articoli correlati (stessa nicchia, diverso slug)
  const related = await sql`
    SELECT a.slug, a.title, a.meta_description FROM articles a
    JOIN sites s ON a.site_id = s.id
    WHERE s.domain = ${siteConfig.domain}
      AND a.status = 'published'
      AND a.slug != ${article.slug}
    ORDER BY RANDOM()
    LIMIT 5
  `;

  const cat = classifyArticle(siteConfig.nicheSlug, article.keyword || '', article.title);
  const articleData = {
    slug: article.slug,
    title: article.title,
    metaDescription: article.meta_description,
    excerpt: (article.meta_description || '').slice(0, 120) + '...',
    content: article.content,
    schemas: article.schema_markup || [],
    category: cat.name,
    categorySlug: cat.slug,
    date: article.published_at || article.created_at
  };

  const html = renderArticlePage(articleData, siteConfig, related.map(r => ({
    slug: r.slug, title: r.title
  })));

  const dir = join(WWW_ROOT, siteConfig.domain, article.slug);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'index.html'), html, 'utf-8');
}

async function rebuildAffectedSites(stats) {
  // Siti che hanno avuto nuove pubblicazioni nelle ultime 2 ore
  const affected = await sql`
    SELECT DISTINCT s.id, s.domain, s.template, s.niche_id,
           n.slug as niche_slug, n.name as niche_name
    FROM sites s
    JOIN articles a ON a.site_id = s.id
    JOIN niches n ON s.niche_id = n.id
    WHERE s.status = 'live'
      AND a.status = 'published'
      AND a.published_at > NOW() - INTERVAL '2 hours'
  `;

  if (!affected.length) return;
  console.log(`  🏗️  Rebuilding ${affected.length} sites...`);

  for (const site of affected) {
    try {
      const { renderHomePage } = await import(`${TEMPLATES_DIR}/${site.template}/src/layout.js`);

      const articles = await getArticlesBySite(site.id, 300);
      const published = articles.filter(a => a.status === 'published');

      const siteConfig = await buildSiteConfig(site, site.niche_slug);

      // Articoli per il frontend
      const articlesData = published.map(a => {
        const cat = classifyArticle(site.niche_slug, a.keyword || '', a.title);
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
          tags: []
        };
      });

      // Homepage
      const homeHtml = renderHomePage(articlesData, siteConfig);
      writeFileSync(join(WWW_ROOT, site.domain, 'index.html'), homeHtml, 'utf-8');

      // API JSON (include derived categories)
      updateApiFiles(site.domain, articlesData, { name: site.niche_name, slug: site.niche_slug });

      // Category pages
      await generateCategoryPages(site.domain, articlesData, siteConfig, site.template);

      // Sitemap (include category pages)
      const categoryUrls = buildCategoryUrls(articlesData);
      generateSitemap(site.domain, [...published, ...categoryUrls]);

      stats.rebuilt++;
      console.log(`  ✅ Rebuilt: ${site.domain} (${published.length} articles)`);
    } catch (err) {
      console.log(`  ❌ Rebuild failed ${site.domain}: ${err.message}`);
    }
  }
}

async function triggerDailyGeneration() {
  console.log('  🌅 Daily generation...');
  const liveSites = await getSitesByStatus('live');

  for (const site of liveSites) {
    const unused = await getUnusedKeywords(site.niche_id, 1);

    // Se keywords basse, triggera keyword engine
    if (unused.length < ARTICLES_PER_DAY) {
      const [niche] = await sql`SELECT slug FROM niches WHERE id = ${site.niche_id}`;
      console.log(`  📡 Replenishing keywords for ${site.domain}...`);
      try {
        execSync(`node packages/keyword-engine/src/index.js --niche ${niche.slug}`, {
          cwd: ROOT, stdio: 'pipe', timeout: 180000
        });
      } catch (e) {
        console.log(`  ⚠️  Keyword engine: ${e.message?.slice(0, 80)}`);
      }
    }

    // Genera articoli
    console.log(`  ✍️  Generating ${ARTICLES_PER_DAY} articles for ${site.domain}...`);
    try {
      execSync(
        `node packages/content-engine/src/index.js --site-id ${site.id} --count ${ARTICLES_PER_DAY}`,
        { cwd: ROOT, stdio: 'pipe', timeout: 600000 }
      );
    } catch (e) {
      console.log(`  ⚠️  Content engine: ${e.message?.slice(0, 80)}`);
    }
  }
}

function updateApiFiles(domain, articles, niche) {
  const apiDir = join(WWW_ROOT, domain, 'api');
  mkdirSync(apiDir, { recursive: true });

  const lite = articles.map(a => ({ slug: a.slug, title: a.title, excerpt: a.excerpt, tags: a.tags || [], category: a.category, categorySlug: a.categorySlug }));
  writeFileSync(join(apiDir, 'articles.json'), JSON.stringify(lite), 'utf-8');
  writeFileSync(join(apiDir, 'trending.json'), JSON.stringify(lite.slice(0, 8)), 'utf-8');

  // Build category list with counts, sorted by article count desc
  const catMap = {};
  for (const a of articles) {
    const slug = a.categorySlug || niche.slug;
    const name = a.category || niche.name;
    if (!catMap[slug]) catMap[slug] = { name, slug, count: 0 };
    catMap[slug].count++;
  }
  const cats = Object.values(catMap).sort((a, b) => b.count - a.count).slice(0, 8);
  writeFileSync(join(apiDir, 'categories.json'), JSON.stringify(cats), 'utf-8');
}

async function generateCategoryPages(domain, articles, siteConfig, template) {
  const { renderCategoryPage } = await import(`${TEMPLATES_DIR}/${template}/src/layout.js`);

  // Group articles by category
  const catMap = {};
  for (const a of articles) {
    const slug = a.categorySlug || siteConfig.nicheSlug;
    if (!catMap[slug]) catMap[slug] = { name: a.category, slug, articles: [] };
    catMap[slug].articles.push(a);
  }

  for (const cat of Object.values(catMap)) {
    if (!cat.articles.length) continue;
    const html = renderCategoryPage(cat.articles, cat, siteConfig);
    const dir = join(WWW_ROOT, domain, 'category', cat.slug);
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, 'index.html'), html, 'utf-8');
  }
  console.log(`  📂 Generated ${Object.keys(catMap).length} category pages`);
}

function buildCategoryUrls(articles) {
  const slugs = [...new Set(articles.map(a => a.categorySlug).filter(Boolean))];
  return slugs.map(slug => ({ slug: `category/${slug}`, published_at: new Date().toISOString() }));
}

async function buildSiteConfig(site, nicheSlug) {
  const { AUTHOR_PERSONAS } = await import('@content-network/content-engine/src/prompts.js');
  const author = AUTHOR_PERSONAS[nicheSlug] || AUTHOR_PERSONAS['home-improvement-costs'];

  // Load categories from api/categories.json (written by updateApiFiles)
  let categories = [];
  try {
    const catsFile = join(WWW_ROOT, site.domain, 'api', 'categories.json');
    categories = JSON.parse(readFileSync(catsFile, 'utf-8')).slice(0, 7);
  } catch (e) {
    categories = getCategoriesForNiche(nicheSlug).slice(0, 7);
  }

  return {
    id: site.id,
    domain: site.domain,
    name: site.domain.split('.')[0].replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    url: `https://${site.domain}`,
    template: site.template,
    authorName: author.name,
    authorTitle: author.title,
    authorBio: author.bio,
    authorAvatar: author.avatar,
    adsenseId: process.env.ADSENSE_ID || '',
    nicheSlug,
    categories
  };
}

function categoryFromNiche(nicheSlug) {
  const map = {
    'home-improvement-costs': 'Home Improvement',
    'pet-care-by-breed': 'Pet Care',
    'software-error-fixes': 'Tech Support',
    'diet-specific-recipes': 'Recipes',
    'small-town-tourism': 'Travel'
  };
  return map[nicheSlug] || 'Guide';
}

run().catch(err => { console.error('Scheduler error:', err); process.exit(1); });
