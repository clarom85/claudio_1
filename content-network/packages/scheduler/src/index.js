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
import { generateSitemap, writeSiteFile, generateRssFeed, pingSitemap, generateAdsTxt } from '@content-network/vps';
import { purgeCache as cfPurgeCache } from '@content-network/vps/src/cloudflare.js';
import { classifyArticle, getCategoriesForNiche } from '@content-network/content-engine/src/categories.js';
import { getDailyArticleLimit, logScheduleInfo } from '@content-network/content-engine/src/publishing-schedule.js';
import { injectInternalLinks } from '@content-network/content-engine/src/link-injector.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '../../..');
const TEMPLATES_DIR = join(ROOT, 'templates');
const WWW_ROOT = process.env.WWW_ROOT || '/var/www';
// ARTICLES_PER_DAY è ora calcolato dinamicamente per sito (publishing-schedule.js)
// Questo valore è usato solo come cap assoluto di sicurezza
const MAX_ARTICLES_PER_DAY = parseInt(process.env.MAX_ARTICLES_PER_DAY || '35');

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

  // 3. Content freshness refresh (ogni domenica alle 03:xx — max 3 articoli per sito)
  if (now.getHours() === 3 && now.getDay() === 0) {
    await refreshStaleArticles(stats);
  }

  // 4. Aggiorna homepage + sitemap dei siti con nuovi articoli
  await rebuildAffectedSites(stats);

  console.log(`\n📊 Done — published: ${stats.published}, failed: ${stats.failed}, rebuilt: ${stats.rebuilt}`);
  process.exit(0);
}

async function publishDueArticles(stats) {
  // Pubblica max articoli per questa ora (finestra 15 ore / ~2 per ora in warm-up)
  const BATCH_PER_HOUR = Math.ceil(MAX_ARTICLES_PER_DAY / 15);
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
    date: article.published_at || article.created_at,
    image: article.image || null,
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
          tags: a.tags || []
        };
      });

      // Homepage
      const homeHtml = renderHomePage(articlesData, siteConfig);
      writeFileSync(join(WWW_ROOT, site.domain, 'index.html'), homeHtml, 'utf-8');

      // API JSON (include derived categories)
      updateApiFiles(site.domain, articlesData, { name: site.niche_name, slug: site.niche_slug });

      // Category pages
      await generateCategoryPages(site.domain, articlesData, siteConfig, site.template);

      // Tag pages — eliminates 404s from tag links in articles
      await generateTagPages(site.domain, articlesData, siteConfig);

      // ads.txt — rigenera ad ogni rebuild per recepire ADSENSE_ID se aggiunto dopo lo spawn
      generateAdsTxt(site.domain, process.env.ADSENSE_ID);

      // Sitemap + RSS feed + ping search engines
      const categoryUrls = buildCategoryUrls(articlesData);
      const tagUrls = buildTagUrls(articlesData);
      generateSitemap(site.domain, [...published, ...categoryUrls, ...tagUrls], { siteName: siteConfig.name });
      generateRssFeed(site.domain, published, { siteName: siteConfig.name });
      await pingSitemap(site.domain);

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
    // Calcola limite giornaliero basato sull'età del sito
    const { count: dailyLimit, ageDays, label } = getDailyArticleLimit(site.created_at);
    const cappedLimit = Math.min(dailyLimit, MAX_ARTICLES_PER_DAY);

    console.log(`\n  📍 ${site.domain} — ${ageDays}d old — ${label}`);
    console.log(`  📰 Today's target: ${cappedLimit} articles`);

    const unused = await getUnusedKeywords(site.niche_id, 1);

    // Replenish keywords se sotto il doppio del limite giornaliero
    if (unused.length < cappedLimit * 2) {
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

    // Genera articoli con il limite calcolato dall'età
    try {
      execSync(
        `node packages/content-engine/src/index.js --site-id ${site.id} --count ${cappedLimit}`,
        { cwd: ROOT, stdio: 'inherit', timeout: 600000 }
      );
    } catch (e) {
      console.log(`  ⚠️  Content engine: ${e.message?.slice(0, 80)}`);
    }

    // Re-linking pass cross-batch — aggiorna link interni su tutto il sito
    await relinkSite(site);
  }
}

/**
 * Content freshness — aggiorna articoli > 90 giorni.
 * Ogni domenica, prende max 3 articoli stale per sito,
 * aggiorna "last reviewed" date nel DB e nell'HTML.
 * Costo zero (niente Claude API) — solo aggiornamento data.
 * Segnale di freshness per Google.
 */
async function refreshStaleArticles(stats) {
  console.log('\n♻️  Content freshness refresh...');

  const liveSites = await getSitesByStatus('live');

  for (const site of liveSites) {
    const stale = await sql`
      SELECT id, slug, title
      FROM articles
      WHERE site_id = ${site.id}
        AND status = 'published'
        AND published_at < NOW() - INTERVAL '90 days'
        AND (updated_at IS NULL OR updated_at < NOW() - INTERVAL '90 days')
      ORDER BY updated_at ASC NULLS FIRST
      LIMIT 3
    `;

    if (!stale.length) continue;

    const newDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric'
    });

    for (const article of stale) {
      // 1. Aggiorna DB
      await sql`UPDATE articles SET updated_at = NOW() WHERE id = ${article.id}`;

      // 2. Aggiorna "Last reviewed" + dateModified schema nell'HTML su disco
      const htmlPath = join(WWW_ROOT, site.domain, article.slug, 'index.html');
      if (existsSync(htmlPath)) {
        try {
          let html = readFileSync(htmlPath, 'utf-8');
          // Update visible "Last reviewed" date
          html = html.replace(
            /(<strong[^>]*>Last reviewed:<\/strong>\s*)([^<]+)/,
            `$1 ${newDate}`
          );
          // Update dateModified in JSON-LD schema
          html = html.replace(
            /"dateModified":"[^"]*"/g,
            `"dateModified":"${new Date().toISOString()}"`
          );
          writeFileSync(htmlPath, html, 'utf-8');
        } catch (e) { /* non bloccare */ }
      }

      stats.refreshed = (stats.refreshed || 0) + 1;
      console.log(`  ♻️  Refreshed: ${article.slug} (${site.domain})`);
    }

    // Purge cache CF per gli articoli aggiornati
    if (stale.length && process.env.CLOUDFLARE_API_TOKEN) {
      try {
        const urls = stale.map(a => `https://${site.domain}/${a.slug}/`);
        const { purgeUrls } = await import('@content-network/vps/src/cloudflare.js');
        await purgeUrls(site.domain, urls);
      } catch (e) { /* non bloccare */ }
    }
  }

  if (stats.refreshed) {
    console.log(`  ✅ Total refreshed: ${stats.refreshed} articles`);
  } else {
    console.log(`  ℹ️  No stale articles found`);
  }
}

/**
 * Re-linking pass cross-batch.
 * Carica tutti gli articoli pubblicati del sito, ri-inietta link interni
 * su tutto il corpus, aggiorna DB e riscrive solo i file modificati.
 */
async function relinkSite(site) {
  console.log(`\n  🔗 Re-linking pass: ${site.domain}...`);

  // Carica tutti gli articoli pubblicati (slug, title, content, tags)
  const articles = await sql`
    SELECT id, slug, title, content, meta_description,
           schema_markup, published_at, created_at,
           COALESCE(tags, '{}') as tags
    FROM articles
    WHERE site_id = ${site.id}
      AND status = 'published'
    ORDER BY published_at ASC
  `;

  if (articles.length < 2) {
    console.log(`  ℹ️  Not enough articles for cross-linking (${articles.length})`);
    return;
  }

  // Prepara array per link injector
  const input = articles.map(a => ({
    id: a.id,
    slug: a.slug,
    title: a.title,
    content: a.content || '',
    tags: a.tags || [],
    // Campi pass-through
    metaDescription: a.meta_description,
    schemas: a.schema_markup,
  }));

  // Inietta link — idempotente (non duplica link già esistenti)
  const relinked = injectInternalLinks(input);

  let updated = 0;

  for (let i = 0; i < relinked.length; i++) {
    const original = input[i];
    const result   = relinked[i];

    // Aggiorna solo se il contenuto è effettivamente cambiato
    if (result.content === original.content) continue;

    // 1. Aggiorna DB
    await sql`
      UPDATE articles
      SET content = ${result.content}, updated_at = NOW()
      WHERE id = ${original.id}
    `;

    // 2. Riscrivi HTML su disco
    const dir = join(WWW_ROOT, site.domain, result.slug);
    const indexFile = join(dir, 'index.html');
    if (existsSync(indexFile)) {
      try {
        let html = readFileSync(indexFile, 'utf-8');
        // Sostituisce solo il corpo dell'articolo (dentro articleBody itemprop)
        // Usa un replace semplice: rimpiazza il contenuto tra i tag dell'article
        const newHtml = html.replace(
          /(<div[^>]*itemprop="articleBody"[^>]*>)([\s\S]*?)(<\/div>\s*<aside)/,
          (_, open, _old, close) => `${open}${result.content}${close}`
        );
        if (newHtml !== html) {
          writeFileSync(indexFile, newHtml, 'utf-8');
        }
      } catch (e) {
        // Non bloccare il processo se un file non esiste o è corrotto
      }
    }

    updated++;
  }

  console.log(`  ✅ Re-linked: ${updated}/${articles.length} articles updated`);

  // Purge cache Cloudflare se ci sono stati aggiornamenti
  if (updated > 0 && process.env.CLOUDFLARE_API_TOKEN) {
    try {
      await cfPurgeCache(site.domain);
    } catch (e) {
      console.warn(`  ⚠️  CF purge failed: ${e.message}`);
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

function buildTagUrls(articles) {
  const tagSlugs = new Set();
  for (const a of articles) {
    for (const tag of (a.tags || [])) {
      const slug = tag.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      if (slug) tagSlugs.add(slug);
    }
  }
  return [...tagSlugs].map(slug => ({ slug: `tag/${slug}`, published_at: new Date().toISOString() }));
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

/**
 * Genera pagine statiche per ogni tag con 2+ articoli.
 * Risolve i 404 dai link /tag/{slug}/ presenti negli articoli.
 */
async function generateTagPages(domain, articlesData, siteConfig) {
  // Build tag → articles map
  const tagMap = {};
  for (const a of articlesData) {
    for (const tag of (a.tags || [])) {
      const slug = tag.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      if (!slug) continue;
      if (!tagMap[slug]) tagMap[slug] = { name: tag, slug, articles: [] };
      tagMap[slug].articles.push(a);
    }
  }

  const tags = Object.values(tagMap).filter(t => t.articles.length >= 2);
  if (!tags.length) return;

  const { renderTagPage } = await import(`${TEMPLATES_DIR}/${siteConfig.template}/src/layout.js`);

  for (const tag of tags) {
    const html = renderTagPage(tag, tag.articles, siteConfig);
    const dir = join(WWW_ROOT, domain, 'tag', tag.slug);
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, 'index.html'), html, 'utf-8');
  }

  console.log(`  🏷️  Generated ${tags.length} tag pages`);
}

run().catch(err => { console.error('Scheduler error:', err); process.exit(1); });
