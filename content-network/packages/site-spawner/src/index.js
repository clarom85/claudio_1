/**
 * Site Spawner
 * Crea un nuovo sito statico Astro a partire da un template,
 * lo popola con gli articoli del DB e lo deploya su Cloudflare Pages
 *
 * Usage: node packages/site-spawner/src/index.js --niche home-improvement-costs --domain homecosthub.com
 */
import 'dotenv/config';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import fse from 'fs-extra';
import { execSync } from 'child_process';
import {
  getNicheBySlug, createSite, updateSiteStatus,
  getArticlesBySite, sql
} from '@content-network/db';
import { createPagesProject, uploadDeploy, getProjectUrl } from './cloudflare.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '../../..');
const TEMPLATES_DIR = join(ROOT, 'templates');
const SITES_DIR = join(ROOT, 'sites');

// Template rotation: 1 template ogni 10 siti
const TEMPLATES = ['pulse', 'tribune', 'nexus', 'echo', 'vortex'];

function getTemplateForSite(weekNumber, siteIndexInWeek) {
  const globalIndex = (weekNumber - 1) * 10 + siteIndexInWeek;
  return TEMPLATES[Math.floor(globalIndex / 10) % TEMPLATES.length];
}

async function run() {
  const args = process.argv.slice(2);
  const nicheSlug = args.find(a => a.startsWith('--niche='))?.split('=')[1]
    || args[args.indexOf('--niche') + 1];
  const domain = args.find(a => a.startsWith('--domain='))?.split('=')[1]
    || args[args.indexOf('--domain') + 1];

  if (!nicheSlug || !domain) {
    console.error('Usage: node index.js --niche <slug> --domain <domain.com>');
    process.exit(1);
  }

  const niche = await getNicheBySlug(nicheSlug);
  if (!niche) { console.error('Niche not found'); process.exit(1); }

  // Calcola settimana corrente e template
  const weekNumber = getWeekNumber();
  const sitesThisWeek = await sql`
    SELECT COUNT(*) as count FROM sites WHERE week_number = ${weekNumber}
  `;
  const siteIndex = parseInt(sitesThisWeek[0].count);
  const template = getTemplateForSite(weekNumber, siteIndex);

  const projectName = domain.replace(/\./g, '-').replace(/[^a-z0-9-]/g, '');

  console.log(`\n🚀 Site Spawner`);
  console.log(`Domain: ${domain}`);
  console.log(`Niche: ${niche.name}`);
  console.log(`Template: ${template}`);
  console.log(`Week: ${weekNumber}, Site #${siteIndex + 1}\n`);

  // 1. Crea record nel DB
  console.log('📝 Creating site record...');
  const site = await createSite({
    nicheId: niche.id,
    domain,
    cfProjectName: projectName,
    template,
    weekNumber
  });

  try {
    // 2. Copia template
    console.log(`📁 Copying template "${template}"...`);
    const siteDir = join(SITES_DIR, domain);
    await fse.remove(siteDir);
    await fse.copy(join(TEMPLATES_DIR, template), siteDir);

    // 3. Configura .env per il sito
    const siteName = generateSiteName(domain, niche.name);
    const envContent = [
      `SITE_URL=https://${domain}`,
      `SITE_NAME=${siteName}`,
      `ADSENSE_ID=${process.env.ADSENSE_ID || ''}`,
    ].join('\n');
    await fse.writeFile(join(siteDir, '.env'), envContent);

    // 4. Genera pagine statiche essenziali (About, Privacy, Contact)
    await generateStaticPages(siteDir, { siteName, domain, niche });

    // 5. Popola con articoli se ce ne sono
    console.log('📰 Loading articles...');
    const articles = await getArticlesBySite(site.id, 200);
    if (articles.length > 0) {
      await writeArticlesData(siteDir, articles);
      console.log(`   → ${articles.length} articles loaded`);
    } else {
      await writeArticlesData(siteDir, []);
      console.log('   → No articles yet (will be added by scheduler)');
    }

    // 6. Build Astro
    console.log('🔨 Building site...');
    await updateSiteStatus(site.id, 'building');
    execSync('npm install --prefer-offline 2>&1', { cwd: siteDir, stdio: 'pipe' });
    execSync('npm run build 2>&1', { cwd: siteDir, stdio: 'pipe' });
    console.log('   → Build successful');

    // 7. Deploy su Cloudflare Pages
    console.log('☁️  Creating Cloudflare Pages project...');
    await createPagesProject(projectName, domain);

    console.log('📤 Deploying to Cloudflare...');
    await uploadDeploy(projectName, join(siteDir, 'dist'));

    const deployUrl = await getProjectUrl(projectName);
    await updateSiteStatus(site.id, 'live', deployUrl);

    console.log(`\n✅ Site live at: ${deployUrl}`);
    console.log(`   Custom domain: https://${domain} (configure DNS in Cloudflare)`);
    console.log(`\nNext steps:`);
    console.log(`  1. Add DNS CNAME: ${domain} → ${projectName}.pages.dev`);
    console.log(`  2. Run keyword engine: npm run keyword -- --niche ${nicheSlug}`);
    console.log(`  3. Run content engine: npm run content -- --site-id ${site.id} --count 50`);

  } catch (err) {
    await updateSiteStatus(site.id, 'failed');
    console.error('Site spawner error:', err);
    process.exit(1);
  }

  process.exit(0);
}

async function generateStaticPages(siteDir, { siteName, domain, niche }) {
  const pagesDir = join(siteDir, 'src/pages');

  // robots.txt
  await fse.writeFile(join(siteDir, 'public/robots.txt'), `User-agent: *
Allow: /
Sitemap: https://${domain}/sitemap-index.xml
`);

  // About page
  await fse.writeFile(join(pagesDir, 'about.astro'), `---
import Base from '../layouts/Base.astro';
const siteName = import.meta.env.SITE_NAME || '${siteName}';
---
<Base title="About Us" description="Learn about ${siteName} and our expert team.">
  <article style="background:white; padding:32px; border-radius:4px; max-width:800px;">
    <h1 style="font-family:'Merriweather',serif; font-size:32px; margin-bottom:16px;">About ${siteName}</h1>
    <p style="font-size:16px; line-height:1.8; margin-bottom:16px;">
      ${siteName} is dedicated to providing accurate, in-depth, and genuinely helpful information
      about ${niche.name.toLowerCase()}. Our team of specialists brings years of hands-on
      experience to every article we publish.
    </p>
    <p style="font-size:16px; line-height:1.8; margin-bottom:16px;">
      We believe that everyone deserves access to clear, honest, expert-level guidance without
      having to navigate confusing or unreliable sources. That's why everything we publish is
      thoroughly researched and reviewed by subject matter experts.
    </p>
    <h2 style="font-family:'Merriweather',serif; font-size:22px; margin: 24px 0 12px;">Our Editorial Standards</h2>
    <p style="font-size:16px; line-height:1.8;">
      Every article on ${siteName} is written by a verified expert, fact-checked against
      authoritative sources, and updated regularly to reflect current best practices.
      We do not accept payment to influence our editorial content.
    </p>
  </article>
</Base>
`);

  // Privacy policy
  await fse.writeFile(join(pagesDir, 'privacy.astro'), `---
import Base from '../layouts/Base.astro';
---
<Base title="Privacy Policy" description="Privacy policy for ${domain}">
  <article style="background:white; padding:32px; border-radius:4px; max-width:800px;">
    <h1 style="font-family:'Merriweather',serif; font-size:32px; margin-bottom:16px;">Privacy Policy</h1>
    <p style="color:#666; margin-bottom:24px;">Last updated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
    <p style="font-size:16px; line-height:1.8; margin-bottom:16px;">
      This Privacy Policy describes how ${domain} ("we", "us", or "our") collects, uses,
      and shares information when you use our website.
    </p>
    <h2 style="font-size:20px; margin: 20px 0 10px;">Information We Collect</h2>
    <p style="font-size:16px; line-height:1.8; margin-bottom:16px;">
      We collect information you provide directly (such as newsletter subscriptions) and
      information collected automatically (such as usage data through Google Analytics and
      advertising data through Google AdSense).
    </p>
    <h2 style="font-size:20px; margin: 20px 0 10px;">Advertising</h2>
    <p style="font-size:16px; line-height:1.8; margin-bottom:16px;">
      We use Google AdSense to display advertisements. Google may use cookies to serve ads
      based on your prior visits. You can opt out at <a href="https://www.google.com/settings/ads">google.com/settings/ads</a>.
    </p>
    <h2 style="font-size:20px; margin: 20px 0 10px;">Contact</h2>
    <p style="font-size:16px; line-height:1.8;">
      For privacy questions, contact us at: privacy@${domain}
    </p>
  </article>
</Base>
`);
}

async function writeArticlesData(siteDir, articles) {
  const contentDir = join(siteDir, 'src/content');
  await fse.ensureDir(contentDir);

  const articlesForFrontend = articles.map(a => ({
    slug: a.slug,
    title: a.title,
    metaDescription: a.meta_description,
    excerpt: a.meta_description?.slice(0, 120) + '...',
    content: a.content,
    schemas: a.schema_markup,
    tags: [],
    author: a.author_name || 'Editorial Team',
    category: 'Guide',
    date: a.published_at || a.created_at,
    wordCount: a.word_count
  }));

  await fse.writeJSON(join(contentDir, 'articles.json'), articlesForFrontend, { spaces: 0 });

  // API endpoints per JS client-side
  const apiDir = join(siteDir, 'public/api');
  await fse.ensureDir(apiDir);
  await fse.writeJSON(join(apiDir, 'articles.json'), articlesForFrontend.map(a => ({
    slug: a.slug, title: a.title, excerpt: a.excerpt, tags: a.tags, category: a.category
  })));

  // Trending (top 10 più recenti)
  await fse.writeJSON(join(apiDir, 'trending.json'), articlesForFrontend.slice(0, 10).map(a => ({
    slug: a.slug, title: a.title
  })));

  // Categories
  const categories = [...new Set(articlesForFrontend.map(a => a.category))];
  await fse.writeJSON(join(apiDir, 'categories.json'), categories.map(c => ({
    name: c, slug: c.toLowerCase().replace(/\s+/g, '-')
  })));
}

function generateSiteName(domain, nicheName) {
  const base = domain.split('.')[0];
  const words = base.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  return `The ${words}`;
}

function getWeekNumber() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  return Math.ceil(((now - start) / 86400000 + start.getDay() + 1) / 7);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
