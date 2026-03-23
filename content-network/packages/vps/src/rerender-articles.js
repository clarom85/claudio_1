/**
 * rerender-articles.js — Re-renderizza tutti gli articoli pubblicati di un sito.
 * Uso: node packages/vps/src/rerender-articles.js --site-id 5
 * Utile dopo modifiche al template per applicarle agli articoli esistenti.
 */
import 'dotenv/config';
import { mkdirSync, writeFileSync, readFileSync } from 'fs';
import { join } from 'path';
import { sql } from '@content-network/db';
import { classifyArticle } from '@content-network/content-engine/src/categories.js';
import { AUTHOR_PERSONAS } from '@content-network/content-engine/src/prompts.js';

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

  const { renderArticlePage } = await import(`${TEMPLATES_DIR}/${site.template}/src/layout.js`);
  const author = AUTHOR_PERSONAS[site.niche_slug] || AUTHOR_PERSONAS['home-improvement-costs'];

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
  try {
    const { TOOL_CONFIGS } = await import('@content-network/content-engine/src/tools/tool-configs.js');
    toolSlug = TOOL_CONFIGS[site.niche_slug]?.slug || null;
  } catch {}

  const siteConfig = {
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
    nicheSlug: site.niche_slug,
    tagline: NICHE_TAGLINES[site.niche_slug] || `Expert guides on ${siteName}`,
    categories,
    toolSlug
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
      const articleData = {
        slug: a.slug, title: a.title, metaDescription: a.meta_description,
        excerpt: (a.meta_description || '').slice(0, 120) + '...',
        content: a.content, schemas: a.schema_markup || [],
        category: cat.name, categorySlug: cat.slug,
        date: a.published_at || a.created_at,
        updatedAt: a.updated_at,
        image: a.image || null
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

  console.log(`\n✅ Completato: ${ok} ok, ${fail} falliti`);
  process.exit(0);
}

run().catch(err => { console.error(err); process.exit(1); });
