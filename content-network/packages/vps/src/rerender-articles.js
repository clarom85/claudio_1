/**
 * rerender-articles.js — Re-renderizza tutti gli articoli pubblicati di un sito.
 * Uso: node packages/vps/src/rerender-articles.js --site-id 5
 * Utile dopo modifiche al template per applicarle agli articoli esistenti.
 */
import 'dotenv/config';
import { mkdirSync, writeFileSync, readFileSync } from 'fs';
import { join } from 'path';
import { sql } from '@content-network/db';
import { purgeCache } from './cloudflare.js';
import { classifyArticle } from '@content-network/content-engine/src/categories.js';
import { AUTHOR_PERSONAS, ADDITIONAL_AUTHORS } from '@content-network/content-engine/src/prompts.js';

/**
 * Detects the article author from the baked-in content HTML.
 * Falls back to primary AUTHOR_PERSONAS if not detectable.
 * Keeps reviewer/trustSources/ymyl from the site-level primary author.
 */
function detectArticleAuthor(content, nicheSlug) {
  const primary = AUTHOR_PERSONAS[nicheSlug] || AUTHOR_PERSONAS['home-improvement-costs'];
  if (!content) return primary;
  const extras = ADDITIONAL_AUTHORS[nicheSlug] || [];
  // Try avatar image URL (new-format articles: /images/author-{slug}.jpg)
  const match = content.match(/author-([a-z][a-z0-9-]+)\.jpg/);
  if (match) {
    const avatarSlug = match[1];
    if (primary.avatar === avatarSlug) return primary;
    const found = extras.find(a => a.avatar === avatarSlug);
    if (found) return found;
  }
  // Fallback: detect by author name in content (old articles with pravatar.cc URLs)
  for (const extra of extras) {
    if (content.includes(extra.name)) return extra;
  }
  return primary;
}
import { patchArticleSchemas } from '@content-network/content-engine/src/schema.js';

const WWW_ROOT = process.env.WWW_ROOT || '/var/www';
const TEMPLATES_DIR = new URL('../../../templates', import.meta.url).pathname;

async function run() {
  const args = process.argv.slice(2);
  const siteId = parseInt(args.find(a => a.startsWith('--site-id='))?.split('=')[1]
    || args[args.indexOf('--site-id') + 1]);
  if (!siteId) { console.error('Uso: node rerender-articles.js --site-id <id>'); process.exit(1); }

  const [site] = await sql`
    SELECT s.*, n.slug as niche_slug, n.name as niche_name
    FROM sites s JOIN niches n ON s.niche_id = n.id
    WHERE s.id = ${siteId}
  `;
  if (!site) { console.error(`Site ${siteId} non trovato`); process.exit(1); }

  const articles = await sql`
    SELECT a.*, k.keyword
    FROM articles a JOIN keywords k ON a.keyword_id = k.id
    WHERE a.site_id = ${siteId} AND a.status = 'published'
    ORDER BY a.id
  `;

  // Aggregate feedback votes per article slug for AggregateRating schema
  const feedbackRows = await sql`
    SELECT slug,
      COUNT(*) FILTER (WHERE vote = 'yes')::int AS thumbs_up,
      COUNT(*) FILTER (WHERE vote = 'no')::int  AS thumbs_down
    FROM article_feedback
    WHERE site = ${site.domain}
    GROUP BY slug
  `;
  const feedbackMap = new Map(feedbackRows.map(r => [r.slug, { thumbsUp: r.thumbs_up, thumbsDown: r.thumbs_down }]));

  const { renderArticlePage } = await import(`${TEMPLATES_DIR}/${site.template}/src/layout.js`);
  // Primary used for site-level trust data (reviewer, trustSources, ymyl)
  const primaryAuthor = AUTHOR_PERSONAS[site.niche_slug] || AUTHOR_PERSONAS['home-improvement-costs'];

  let categories = [];
  try {
    const catsFile = join(WWW_ROOT, site.domain, 'api', 'categories.json');
    categories = JSON.parse(readFileSync(catsFile, 'utf-8')).slice(0, 7);
  } catch {}

  const NICHE_TAGLINES = {
    'home-improvement-costs': 'Expert cost guides for home improvement, renovation & repair projects',
    'personal-finance': 'Practical personal finance advice, budgeting tips & money strategies',
    'insurance-guide': 'Clear, unbiased insurance guides to help you choose the right coverage',
    'legal-advice': 'Plain-language legal guides written by experienced professionals',
    'real-estate-investing': 'Real estate investing strategies, market analysis & property guides',
    'health-symptoms': 'Trusted health symptom guides reviewed by medical professionals',
    'credit-cards-banking': 'Credit card reviews, banking tips & strategies to maximize rewards',
    'weight-loss-fitness': 'Evidence-based weight loss & fitness guides from certified experts',
    'automotive-guide': 'Car buying, maintenance & repair guides from automotive professionals',
    'online-education': 'Online education reviews, learning strategies & course comparisons',
    'cybersecurity-privacy': 'Cybersecurity & privacy guides to keep you safe in the digital world',
    'mental-health-wellness': 'Mental health & wellness resources from licensed professionals',
    'home-security-systems': 'Home security system reviews, installation guides & safety tips',
    'solar-energy': 'Solar energy guides, cost breakdowns & installation advice',
    'senior-care-medicare': 'Senior care guides, Medicare explained & resources for families',
    'business-startup': 'Business startup guides, funding strategies & entrepreneurship advice',
    'pet-care-by-breed': 'Breed-specific pet care guides from experienced veterinarians',
    'software-error-fixes': 'Step-by-step software error fixes and technical troubleshooting guides',
    'diet-specific-recipes': 'Diet-specific recipes, meal plans & nutrition guides by dietitians',
    'small-town-tourism': 'Hidden gem travel guides for small towns, local attractions & road trips',
  };

  const siteName = site.domain.split('.')[0].replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  let toolSlug = null;
  let toolLabel = 'Free Calculator';
  try {
    const { TOOL_CONFIGS } = await import('@content-network/content-engine/src/tools/tool-configs.js');
    toolSlug = TOOL_CONFIGS[site.niche_slug]?.slug || null;
    toolLabel = TOOL_CONFIGS[site.niche_slug]?.navLabel || 'Free Calculator';
  } catch {}

  const baseSiteConfig = {
    id: site.id,
    domain: site.domain,
    name: siteName,
    url: `https://${site.domain}`,
    template: site.template,
    adsenseId: process.env.ADSENSE_ID || '',
    ga4MeasurementId: site.ga4_measurement_id || '',
    mgidSiteId: site.mgid_site_id || '',
    mgidInArticleId: site.mgid_in_article_id || '',
    mgidSmartId: site.mgid_smart_id || '',
    nicheSlug: site.niche_slug,
    tagline: NICHE_TAGLINES[site.niche_slug] || `Expert guides on ${siteName}`,
    categories,
    toolSlug,
    toolLabel,
    hasCostTracker: true,
    // Trust data always from primary author (site-level, not per-article)
    reviewer: primaryAuthor.reviewer || null,
    trustSources: primaryAuthor.trustSources || '',
    trustMethodology: primaryAuthor.trustMethodology || '',
    ymyl: primaryAuthor.ymyl || false,
  };

  // Carica articoli correlati per ogni articolo (cached in memoria)
  const allPublished = articles.map(a => ({
    slug: a.slug, title: a.title, image: a.image || null
  }));

  console.log(`\n🔄 Re-rendering ${articles.length} articles for ${site.domain}\n`);
  let ok = 0, fail = 0;

  for (const a of articles) {
    try {
      const cat = classifyArticle(site.niche_slug, a.keyword || '', a.title);
      const related = allPublished.filter(r => r.slug !== a.slug).sort(() => Math.random() - .5).slice(0, 4);
      const rating = feedbackMap.get(a.slug) || null;
      const patchedSchemas = patchArticleSchemas(a.schema_markup || [], {
        template: site.template,
        rating
      });
      // Use the author actually embedded in the content HTML (preserves original variant)
      const articleAuthor = detectArticleAuthor(a.content, site.niche_slug);
      // Replace old pravatar.cc placeholder URLs with correct local author image
      const strippedContent = (a.content || '')
        .replace(/<div class="article-tags">[\s\S]*?<\/div>/, '')
        .replace(/https:\/\/i\.pravatar\.cc\/150\?u=[^"']+/g, `/images/author-${articleAuthor.avatar}.jpg`);
      const articleData = {
        slug: a.slug, title: a.title, metaDescription: a.meta_description,
        excerpt: (a.meta_description || '').slice(0, 120) + '...',
        content: strippedContent, schemas: patchedSchemas,
        category: cat.name, categorySlug: cat.slug,
        tags: a.tags || [],
        date: a.published_at || a.created_at,
        updatedAt: a.updated_at,
        image: a.image || null
      };

      const siteConfig = {
        ...baseSiteConfig,
        authorName: articleAuthor.name,
        authorTitle: articleAuthor.title,
        authorBio: articleAuthor.bio,
        authorAvatar: articleAuthor.avatar,
      };

      const html = renderArticlePage(articleData, siteConfig, related);
      const dir = join(WWW_ROOT, site.domain, a.slug);
      mkdirSync(dir, { recursive: true });
      writeFileSync(join(dir, 'index.html'), html, 'utf-8');
      ok++;
      process.stdout.write(`  ✅ ${a.slug}\n`);
    } catch (err) {
      fail++;
      process.stdout.write(`  ❌ ${a.slug}: ${err.message}\n`);
    }
  }

  // Rigenera articles.json e trending.json con i soli articoli del sito
  const apiDir = join(WWW_ROOT, site.domain, 'api');
  mkdirSync(apiDir, { recursive: true });
  const lite = articles
    .filter(a => a.status === 'published')
    .map(a => {
      const cat = classifyArticle(site.niche_slug, a.keyword || '', a.title);
      const authorInfo = detectArticleAuthor(a.content, site.niche_slug);
      return { slug: a.slug, title: a.title, excerpt: (a.meta_description || '').slice(0, 120), tags: a.tags || [], category: cat.name, categorySlug: cat.slug, image: a.image || '', author: authorInfo.name, authorAvatar: authorInfo.avatar };
    });
  writeFileSync(join(apiDir, 'articles.json'),  JSON.stringify(lite),              'utf-8');
  writeFileSync(join(apiDir, 'trending.json'),  JSON.stringify(lite.slice(0, 8)), 'utf-8');

  console.log(`\n✅ Completato: ${ok} ok, ${fail} falliti`);
  if (process.env.CLOUDFLARE_API_TOKEN) {
    console.log('\nPurgando CF cache...');
    await purgeCache(site.domain).catch(e => console.warn(`  ⚠ CF ${site.domain}: ${e.message}`));
    console.log('CF cache purgata ✓');
  }
  process.exit(0);
}

run().catch(err => { console.error(err); process.exit(1); });
