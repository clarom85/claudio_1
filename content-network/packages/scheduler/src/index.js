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
  getSitesByStatus, getUnusedKeywords, getUnusedKeywordCount, getArticlesBySite, sql,
  markArticlesGscSubmitted, getUnsubmittedArticles, getLatestRankings, getTemplatePerformance
} from '@content-network/db';
import { generateSitemap, writeSiteFile, generateRssFeed, pingSitemap, generateAdsTxt } from '@content-network/vps';
import { purgeCache as cfPurgeCache } from '@content-network/vps/src/cloudflare.js';
import { submitSiteNewArticles } from '@content-network/vps/src/gsc.js';
import { trackSiteRankings, getLowRankingArticles } from '@content-network/vps/src/ranking-tracker.js';
import { runLinkGraphAnalysis } from '@content-network/vps/src/link-graph.js';
import { alertCritical, alertWarning, alertReport } from '@content-network/vps/src/alert.js';
import { runBackup } from '@content-network/vps/src/backup.js';
import { classifyArticle, getCategoriesForNiche } from '@content-network/content-engine/src/categories.js';
import { getDailyArticleLimit, logScheduleInfo, isDeadDay, isWithinPublishingWindow } from '@content-network/content-engine/src/publishing-schedule.js';
import { injectInternalLinks, injectPillarSatelliteLinks } from '@content-network/content-engine/src/link-injector.js';

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

  // 2. Genera nuovi articoli (ogni giorno alle 06:xx UTC = 01:00 EST, pre-alba)
  // A quest'ora getPublishTime() schedula gli slot dalle 08:00 EST in poi — zero pubblicazioni notturne
  if (now.getHours() === 6) {
    await triggerDailyGeneration();
  }

  // 3. Content freshness refresh (ogni domenica alle 03:xx — max 3 articoli per sito)
  if (now.getHours() === 3 && now.getDay() === 0) {
    await refreshStaleArticles(stats);
  }

  // 4. Aggiorna homepage + sitemap dei siti con nuovi articoli
  await rebuildAffectedSites(stats);

  // 5. GSC auto-submit degli articoli non ancora sottomessi (ogni giorno alle 02:xx)
  if (now.getHours() === 2) {
    await submitNewArticlesToGSC();
  }

  // 6. Ranking tracker (ogni domenica alle 04:xx)
  if (now.getHours() === 4 && now.getDay() === 0) {
    await runWeeklyRankingCheck(stats);
  }

  // 7. Smart content refresh basato su ranking (ogni domenica alle 05:xx)
  if (now.getHours() === 5 && now.getDay() === 0) {
    await smartContentRefresh(stats);
  }

  // 8. Link graph analysis (ogni domenica alle 06:xx)
  if (now.getHours() === 6 && now.getDay() === 0) {
    await runWeeklyLinkGraphAnalysis();
  }

  // Report domenicale completo (ogni domenica alle 07:xx)
  if (now.getHours() === 7 && now.getDay() === 0) {
    await sendWeeklyReport(stats);
  }

  // Backup settimanale DB + WWW (ogni domenica alle 08:xx)
  if (now.getHours() === 8 && now.getDay() === 0) {
    await runBackup();
  }

  console.log(`\n📊 Done — published: ${stats.published}, failed: ${stats.failed}, rebuilt: ${stats.rebuilt}`);
  process.exit(0);
}

async function publishDueArticles(stats) {
  // Guard assoluto: nessuna pubblicazione fuori finestra EST 08:00–20:00
  if (!isWithinPublishingWindow()) {
    console.log('  Outside publishing window (EST 08:00–20:00) — skipping publish');
    return;
  }

  // Recovery: articoli bloccati in 'processing' → rimetti in pending
  // (lo scheduler fa process.exit(0) dopo ogni run, quindi qualunque item
  //  in 'processing' all'avvio è necessariamente rimasto bloccato da un crash precedente)
  await sql`UPDATE publish_queue SET status = 'pending' WHERE status = 'processing'`;

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

      // Aggiorna stato DB — entrambi devono riuscire prima di marcare done
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
    SELECT a.slug, a.title, a.meta_description, a.image FROM articles a
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
    slug: r.slug, title: r.title, image: r.image || null
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
          tags: a.tags || [],
          image: a.image || null
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
      generateAdsTxt(site.domain, process.env.ADSENSE_ID, process.env.EZOIC_SITE_ID);

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
    // Giorno STOP? Siti diversi hanno stop diversificati (seeded su siteId + data)
    if (isDeadDay(site.id, site.created_at)) {
      console.log(`\n  📍 ${site.domain} — DEAD DAY (scheduled stop, skipping)`);
      continue;
    }

    // Calcola limite giornaliero basato sull'età del sito
    const { count: dailyLimit, ageDays, label } = getDailyArticleLimit(site.created_at);
    const cappedLimit = Math.min(dailyLimit, MAX_ARTICLES_PER_DAY);

    console.log(`\n  📍 ${site.domain} — ${ageDays}d old — ${label}`);
    console.log(`  📰 Today's target: ${cappedLimit} articles`);

    // Controlla keyword rimanenti — soglia 200 = ~6 giorni di buffer a ritmo max
    const KEYWORD_REFILL_THRESHOLD = 200;
    const remainingCount = await getUnusedKeywordCount(site.niche_id);
    console.log(`  🔑 Keywords remaining: ${remainingCount}`);

    if (remainingCount < KEYWORD_REFILL_THRESHOLD) {
      const [niche] = await sql`SELECT slug FROM niches WHERE id = ${site.niche_id}`;
      // --expand aggiunge i pillar già nel DB come seed aggiuntivi per massimizzare varietà
      const expandFlag = remainingCount < 50 ? '' : '--expand';
      console.log(`  📡 Replenishing keywords for ${site.domain} (${remainingCount} left)...`);
      try {
        execSync(
          `node packages/keyword-engine/src/index.js --niche ${niche.slug} ${expandFlag}`.trim(),
          { cwd: ROOT, stdio: 'pipe', timeout: 300000 }
        );
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

  // Carica tutti gli articoli pubblicati (slug, title, content, tags, cluster data)
  const articles = await sql`
    SELECT a.id, a.slug, a.title, a.content, a.meta_description,
           a.schema_markup, a.published_at, a.created_at,
           COALESCE(a.tags, '{}') as tags,
           k.cluster_slug, k.is_pillar
    FROM articles a
    LEFT JOIN keywords k ON a.keyword_id = k.id
    WHERE a.site_id = ${site.id}
      AND a.status = 'published'
    ORDER BY a.published_at ASC
  `;

  if (articles.length < 2) {
    console.log(`  ℹ️  Not enough articles for cross-linking (${articles.length})`);
    return;
  }

  // Prepara array per link injector (inclusi campi cluster per bidirectional linking)
  const input = articles.map(a => ({
    id: a.id,
    slug: a.slug,
    title: a.title,
    content: a.content || '',
    tags: a.tags || [],
    cluster_slug: a.cluster_slug || null,
    is_pillar: a.is_pillar || false,
    // Campi pass-through
    metaDescription: a.meta_description,
    schemas: a.schema_markup,
  }));

  // Pass 1: Bidirectional pillar-satellite linking (structural, deterministic)
  const clusterLinked = injectPillarSatelliteLinks(input);
  // Pass 2: Random cross-linking for remaining link budget — idempotente
  const relinked = injectInternalLinks(clusterLinked);

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

const ARTICLES_PER_CAT_PAGE = 20;

async function generateCategoryPages(domain, articles, siteConfig, template) {
  const { renderCategoryPage } = await import(`${TEMPLATES_DIR}/${template}/src/layout.js`);

  // Group articles by category
  const catMap = {};
  for (const a of articles) {
    const slug = a.categorySlug || siteConfig.nicheSlug;
    if (!catMap[slug]) catMap[slug] = { name: a.category, slug, articles: [] };
    catMap[slug].articles.push(a);
  }

  let pageCount = 0;
  for (const cat of Object.values(catMap)) {
    if (!cat.articles.length) continue;
    const totalPages = Math.ceil(cat.articles.length / ARTICLES_PER_CAT_PAGE);

    for (let page = 1; page <= totalPages; page++) {
      const pageArticles = cat.articles.slice((page - 1) * ARTICLES_PER_CAT_PAGE, page * ARTICLES_PER_CAT_PAGE);
      const html = renderCategoryPage(pageArticles, cat, siteConfig, page, totalPages);

      if (page === 1) {
        const dir = join(WWW_ROOT, domain, 'category', cat.slug);
        mkdirSync(dir, { recursive: true });
        writeFileSync(join(dir, 'index.html'), html, 'utf-8');
      } else {
        const dir = join(WWW_ROOT, domain, 'category', cat.slug, 'page', String(page));
        mkdirSync(dir, { recursive: true });
        writeFileSync(join(dir, 'index.html'), html, 'utf-8');
      }
      pageCount++;
    }
  }
  console.log(`  📂 Generated ${Object.keys(catMap).length} category pages (${pageCount} total pages)`);
}

function buildCategoryUrls(articles) {
  const catMap = {};
  for (const a of articles) {
    const slug = a.categorySlug;
    if (!slug) continue;
    catMap[slug] = (catMap[slug] || 0) + 1;
  }
  const now = new Date().toISOString();
  const urls = [];
  for (const [slug, count] of Object.entries(catMap)) {
    urls.push({ slug: `category/${slug}`, published_at: now });
    const totalPages = Math.ceil(count / ARTICLES_PER_CAT_PAGE);
    for (let p = 2; p <= totalPages; p++) {
      urls.push({ slug: `category/${slug}/page/${p}`, published_at: now });
    }
  }
  return urls;
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

  const NICHE_TAGLINES = {
    'home-improvement-costs':    'Expert cost guides for home improvement, renovation & repair projects',
    'personal-finance':          'Practical personal finance advice, budgeting tips & money strategies',
    'insurance-guide':           'Clear, unbiased insurance guides to help you choose the right coverage',
    'legal-advice':              'Plain-language legal guides written by experienced professionals',
    'real-estate-investing':     'Real estate investing strategies, market analysis & property guides',
    'health-symptoms':           'Trusted health symptom guides reviewed by medical professionals',
    'credit-cards-banking':      'Credit card reviews, banking tips & strategies to maximize rewards',
    'weight-loss-fitness':       'Evidence-based weight loss & fitness guides from certified experts',
    'automotive-guide':          'Car buying, maintenance & repair guides from automotive professionals',
    'online-education':          'Online education reviews, learning strategies & course comparisons',
    'cybersecurity-privacy':     'Cybersecurity & privacy guides to keep you safe in the digital world',
    'mental-health-wellness':    'Mental health & wellness resources from licensed professionals',
    'home-security-systems':     'Home security system reviews, installation guides & safety tips',
    'solar-energy':              'Solar energy guides, cost breakdowns & installation advice',
    'senior-care-medicare':      'Senior care guides, Medicare explained & resources for families',
    'business-startup':          'Business startup guides, funding strategies & entrepreneurship advice',
    'pet-care-by-breed':         'Breed-specific pet care guides from experienced veterinarians',
    'software-error-fixes':      'Step-by-step software error fixes and technical troubleshooting guides',
    'diet-specific-recipes':     'Diet-specific recipes, meal plans & nutrition guides by dietitians',
    'small-town-tourism':        'Hidden gem travel guides for small towns, local attractions & road trips',
  };

  const siteName = site.domain.split('.')[0].replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  const tagline = NICHE_TAGLINES[nicheSlug] || `Expert guides and in-depth articles on ${siteName}`;

  // Tool slug per il calcolatore interattivo
  let toolSlug = null;
  try {
    const { TOOL_CONFIGS } = await import('@content-network/content-engine/src/tools/tool-configs.js');
    toolSlug = TOOL_CONFIGS[nicheSlug]?.slug || null;
  } catch {}

  return {
    id: site.id,
    domain: site.domain,
    name: siteName,
    url: `https://${site.domain}`,
    template: site.template,
    authorName: author.name,
    authorTitle: author.title,
    authorBio: author.bio,
    authorAvatar: author.avatar,
    adsenseId: process.env.ADSENSE_ID || '',
    ga4MeasurementId: site.ga4_measurement_id || '',
    nicheSlug,
    tagline,
    categories,
    toolSlug
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

// ── 5. GSC auto-submit ────────────────────────────────────────────────────────
async function submitNewArticlesToGSC() {
  console.log('\n🔍 GSC: submitting new articles...');
  const liveSites = await getSitesByStatus('live');

  for (const site of liveSites) {
    try {
      const unsubmitted = await getUnsubmittedArticles(site.id);
      if (!unsubmitted.length) continue;

      const articles = await getArticlesBySite(site.id, 300);
      const result = await submitSiteNewArticles(site.domain, articles);

      if (result.submitted > 0) {
        const submittedIds = unsubmitted.slice(0, result.submitted).map(a => a.id);
        await markArticlesGscSubmitted(submittedIds);
        console.log(`  ✅ ${site.domain}: ${result.submitted} URLs submitted to GSC`);
      }
    } catch (e) {
      console.warn(`  ⚠️  GSC error for ${site.domain}: ${e.message}`);
    }
  }
}

// ── 6. Weekly ranking check ───────────────────────────────────────────────────
async function runWeeklyRankingCheck(stats) {
  console.log('\n📈 Weekly ranking check...');
  const liveSites = await getSitesByStatus('live');

  if (!liveSites.length) { console.log('  No live sites'); return; }

  let totalRanked = 0;
  for (const site of liveSites) {
    try {
      const result = await trackSiteRankings(site);
      totalRanked += result.ranked;
    } catch (e) {
      console.warn(`  ⚠️  Ranking check failed for ${site.domain}: ${e.message}`);
    }
  }
  stats.ranked = totalRanked;
}

// ── 7. Smart content refresh (AI rewrite per articoli con ranking basso) ──────
async function smartContentRefresh(stats) {
  console.log('\n🧠 Smart content refresh (low-ranking articles)...');

  const liveSites = await getSitesByStatus('live');
  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

  if (!ANTHROPIC_API_KEY) {
    console.log('  No ANTHROPIC_API_KEY — skipping smart refresh');
    return;
  }

  for (const site of liveSites) {
    try {
      // Articoli in posizione 21-50 (abbastanza vicini ma non ancora in page 1/2)
      const candidates = await getLowRankingArticles(site.id, 20, 3);
      if (!candidates.length) {
        console.log(`  ${site.domain}: no low-ranking candidates`);
        continue;
      }

      console.log(`  ${site.domain}: ${candidates.length} articles to refresh`);

      for (const article of candidates) {
        try {
          const rewritten = await rewriteArticleWithClaude(article, site, ANTHROPIC_API_KEY);
          if (!rewritten) continue;

          // Aggiorna DB
          await sql`
            UPDATE articles
            SET content = ${rewritten.content},
                title = ${rewritten.title || article.title},
                meta_description = ${rewritten.metaDescription || article.meta_description},
                updated_at = NOW()
            WHERE id = ${article.article_id}
          `;

          // Aggiorna file HTML su disco
          const [siteRow] = await sql`SELECT template FROM sites WHERE id = ${site.id}`;
          await writeRefreshedArticlePage(article, rewritten, site, siteRow.template);

          stats.refreshed = (stats.refreshed || 0) + 1;
          console.log(`  ✅ Refreshed: ${article.slug} (was pos ${article.position})`);

          // Pausa tra richieste API
          await new Promise(r => setTimeout(r, 3000));
        } catch (e) {
          console.warn(`  ⚠️  Rewrite failed for ${article.slug}: ${e.message}`);
        }
      }
    } catch (e) {
      console.warn(`  ⚠️  Smart refresh error for ${site.domain}: ${e.message}`);
    }
  }
}

async function rewriteArticleWithClaude(article, site, apiKey) {
  const prompt = `You are an expert SEO content writer. Rewrite the following article to improve its Google ranking for the keyword "${article.keyword}".

Current position: ${article.position} (goal: top 10)

RULES:
- Keep the same HTML structure and formatting
- Make content more comprehensive (add more depth, examples, data)
- Improve the intro (first 2 paragraphs are crucial for engagement)
- Ensure the target keyword appears naturally in H1, first paragraph, and 2-3 subheadings
- Add a FAQ section at the end if not present
- Keep word count similar or slightly longer
- Do NOT change the slug or URL structure

Return JSON: {"title": "...", "metaDescription": "...", "content": "full HTML content"}

CURRENT ARTICLE:
Title: ${article.title}
Meta: ${article.meta_description}

${article.content?.slice(0, 8000)}`;

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 8000,
      messages: [{ role: 'user', content: prompt }]
    })
  });

  if (!res.ok) throw new Error(`Claude API error: ${res.status}`);
  const data = await res.json();
  const text = data.content?.[0]?.text || '';

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('No JSON in Claude response');
  return JSON.parse(jsonMatch[0]);
}

async function writeRefreshedArticlePage(article, rewritten, site, template) {
  const { renderArticlePage } = await import(`${TEMPLATES_DIR}/${template}/src/layout.js`);
  const [siteData] = await sql`SELECT * FROM sites WHERE domain = ${site.domain}`;
  const siteConfig = await buildSiteConfig(siteData, site.niche_slug || '');

  const related = await sql`
    SELECT slug, title FROM articles
    WHERE site_id = ${siteData.id} AND status = 'published' AND slug != ${article.slug}
    ORDER BY RANDOM() LIMIT 5
  `;

  const cat = classifyArticle(siteConfig.nicheSlug, article.keyword || '', rewritten.title || article.title);
  const articleData = {
    slug: article.slug,
    title: rewritten.title || article.title,
    metaDescription: rewritten.metaDescription || article.meta_description,
    excerpt: (rewritten.metaDescription || article.meta_description || '').slice(0, 120) + '...',
    content: rewritten.content,
    schemas: [],
    category: cat.name,
    categorySlug: cat.slug,
    date: new Date().toISOString(),
  };

  const html = renderArticlePage(articleData, siteConfig, related.map(r => ({ slug: r.slug, title: r.title })));
  const dir = join(WWW_ROOT, site.domain, article.slug);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'index.html'), html, 'utf-8');
}

// ── 8. Link graph analysis ────────────────────────────────────────────────────
async function runWeeklyLinkGraphAnalysis() {
  console.log('\n🕸️  Weekly link graph analysis...');
  const liveSites = await getSitesByStatus('live');
  if (!liveSites.length) { console.log('  No live sites'); return; }

  const reports = await runLinkGraphAnalysis(liveSites);

  // Alert se ci sono problemi strutturali gravi
  const sitesWithIssues = reports.filter(r => !r.skipped && r.orphanCount > 5);
  if (sitesWithIssues.length > 0) {
    const details = sitesWithIssues
      .map(r => `• ${r.site}: ${r.orphanCount} orphan articles`)
      .join('\n');
    await alertWarning('Link graph issues detected', details);
  }
}

// ── Weekly report ─────────────────────────────────────────────────────────────
async function sendWeeklyReport(stats) {
  try {
    const liveSites = await getSitesByStatus('live');
    const totalArticles = await sql`SELECT COUNT(*) as count FROM articles WHERE status = 'published'`;
    const performance = await getTemplatePerformance();

    const templateLines = performance
      .map(p => `  ${p.template}${p.ab_variant ? ` (${p.ab_variant})` : ''}: ${p.articles_published} articles, avg rank: ${p.avg_ranking ?? 'N/A'}`)
      .join('\n');

    await alertReport({
      'Live sites': liveSites.length,
      'Total articles': totalArticles[0]?.count || 0,
      'Published this run': stats.published || 0,
      'Refreshed': stats.refreshed || 0,
      'Ranked': stats.ranked || 0,
      'Template performance': '\n' + templateLines
    });
  } catch (e) {
    console.warn(`Weekly report error: ${e.message}`);
  }
}

run().catch(err => { console.error('Scheduler error:', err); process.exit(1); });
