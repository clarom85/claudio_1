/**
 * Site Spawner — VPS edition
 * Crea directory nginx, virtual host, CSS, pagine statiche
 * Niente Astro, niente build. HTML generato direttamente.
 *
 * Usage: node packages/site-spawner/src/index.js --niche home-improvement-costs --domain homecosthub.com
 */
import 'dotenv/config';
import { writeFileSync, mkdirSync, copyFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import {
  getNicheBySlug, createSite, updateSiteStatus,
  getArticlesBySite, sql
} from '@content-network/db';
import {
  createSiteDirectory, createNginxConfig, reloadNginx,
  generateRobotsTxt, generateSitemap, writeSiteFile
} from '@content-network/vps';
import { AUTHOR_PERSONAS } from '@content-network/content-engine/src/prompts.js';
import { getCategoriesForNiche } from '@content-network/content-engine/src/categories.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '../../..');
const TEMPLATES_DIR = join(ROOT, 'templates');
const WWW_ROOT = process.env.WWW_ROOT || '/var/www';

const TEMPLATES = ['pulse', 'tribune', 'nexus', 'echo', 'vortex'];

function getTemplateForWeek(weekNumber, siteIndex) {
  const global = (weekNumber - 1) * 10 + siteIndex;
  return TEMPLATES[Math.floor(global / 10) % TEMPLATES.length];
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
  if (!niche) { console.error('Niche not found. Run db:migrate first.'); process.exit(1); }

  const weekNumber = getWeekNumber();
  const [{ count }] = await sql`SELECT COUNT(*) as count FROM sites WHERE week_number = ${weekNumber}`;
  const template = getTemplateForWeek(weekNumber, parseInt(count));
  const author = AUTHOR_PERSONAS[nicheSlug] || AUTHOR_PERSONAS['home-improvement-costs'];

  console.log(`\n🚀 Site Spawner (VPS)`);
  console.log(`Domain:   ${domain}`);
  console.log(`Niche:    ${niche.name}`);
  console.log(`Template: ${template}`);
  console.log(`Author:   ${author.name}\n`);

  // 1. DB record
  const site = await createSite({
    nicheId: niche.id, domain,
    cfProjectName: domain.replace(/\./g, '-'),
    template, weekNumber
  });

  const siteConfig = {
    id: site.id, domain,
    name: generateSiteName(domain),
    url: `https://${domain}`,
    template,
    authorName: author.name,
    authorTitle: author.title,
    authorBio: author.bio,
    authorAvatar: author.avatar,
    adsenseId: process.env.ADSENSE_ID || '',
    nicheSlug,
    categories: getCategoriesForNiche(niche.slug).slice(0, 7)
  };

  try {
    // 2. Crea directory
    console.log('📁 Creating site directory...');
    createSiteDirectory(domain);

    // 3. CSS dal template
    console.log(`🎨 Writing CSS (template: ${template})...`);
    const { CSS } = await import(`${TEMPLATES_DIR}/${template}/src/layout.js`);
    writeSiteFile(domain, 'assets/style.css', CSS);

    // 4. Immagine placeholder
    writePlaceholderImage(domain);

    // 5. robots.txt
    generateRobotsTxt(domain);

    // 6. API endpoints JSON (vuoti inizialmente)
    writeApiFiles(domain, [], niche);

    // 7. Pagine statiche (About, Privacy, Contact, Terms, 404)
    console.log('📄 Generating static pages...');
    await generateStaticPages(domain, siteConfig, template);

    // 8. Homepage con articoli (vuota inizialmente)
    await generateHomePage(domain, [], siteConfig, template);

    // 9. Sitemap vuota
    generateSitemap(domain, []);

    // 10. nginx virtual host
    console.log('⚙️  Configuring nginx...');
    createNginxConfig(domain);
    const reloaded = reloadNginx();
    if (!reloaded) console.warn('  ⚠️  nginx reload failed — check manually');

    await updateSiteStatus(site.id, 'live', `http://${domain}`);

    console.log(`\n✅ Site live: http://${domain}`);
    console.log(`\n📋 Next steps:`);
    console.log(`  1. Point DNS A record: ${domain} → this server IP`);
    console.log(`  2. Enable SSL: certbot --nginx -d ${domain} -d www.${domain} -m you@email.com --agree-tos --redirect`);
    console.log(`  3. Generate keywords: npm run keyword -- --niche ${nicheSlug}`);
    console.log(`  4. Generate content:  npm run content -- --site-id ${site.id} --count 50`);

  } catch (err) {
    await updateSiteStatus(site.id, 'failed');
    console.error('❌ Spawn failed:', err);
    process.exit(1);
  }

  process.exit(0);
}

async function generateStaticPages(domain, siteConfig, template) {
  const { renderBase } = await import(`${TEMPLATES_DIR}/${template}/src/layout.js`);
  const siteName = siteConfig.name;

  const pages = {
    'about/index.html': {
      title: 'About Us',
      description: `Learn about ${siteName} and our team of experts.`,
      body: `<div style="max-width:800px;margin:40px auto;padding:0 20px">
        <h1 style="font-size:32px;margin-bottom:20px">About ${siteName}</h1>
        <p style="font-size:16px;line-height:1.8;margin-bottom:16px">
          ${siteName} is dedicated to providing accurate, in-depth, and genuinely helpful
          information. Our team of specialists brings years of hands-on experience to every
          article we publish.
        </p>
        <p style="font-size:16px;line-height:1.8;margin-bottom:16px">
          We believe everyone deserves access to clear, honest, expert-level guidance.
          Everything we publish is thoroughly researched and reviewed by subject matter experts.
        </p>
        <h2 style="font-size:22px;margin:28px 0 12px">Our Editorial Standards</h2>
        <p style="font-size:16px;line-height:1.8;margin-bottom:16px">
          Every article is written by a verified expert, fact-checked against authoritative sources,
          and updated regularly. We do not accept payment to influence editorial content.
        </p>
        <h2 style="font-size:22px;margin:28px 0 12px">Meet Our Expert</h2>
        <p style="font-size:16px;line-height:1.8">${siteConfig.authorBio}</p>
      </div>`
    },
    'privacy/index.html': {
      title: 'Privacy Policy',
      description: `Privacy policy for ${domain}`,
      body: `<div style="max-width:800px;margin:40px auto;padding:0 20px">
        <h1 style="font-size:32px;margin-bottom:8px">Privacy Policy</h1>
        <p style="color:#999;margin-bottom:24px">Last updated: ${new Date().toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'})}</p>
        <p style="font-size:16px;line-height:1.8;margin-bottom:16px">This Privacy Policy describes how ${domain} collects, uses, and shares information when you use our website.</p>
        <h2 style="font-size:20px;margin:24px 0 10px">Information We Collect</h2>
        <p style="font-size:16px;line-height:1.8;margin-bottom:16px">We collect information automatically through Google Analytics and advertising data through Google AdSense.</p>
        <h2 style="font-size:20px;margin:24px 0 10px">Advertising</h2>
        <p style="font-size:16px;line-height:1.8;margin-bottom:16px">We use Google AdSense. Google may use cookies to serve ads based on prior visits. Opt out at <a href="https://www.google.com/settings/ads">google.com/settings/ads</a>.</p>
        <h2 style="font-size:20px;margin:24px 0 10px">Contact</h2>
        <p style="font-size:16px;line-height:1.8">Privacy questions: privacy@${domain}</p>
      </div>`
    },
    'terms/index.html': {
      title: 'Terms of Service',
      description: `Terms of service for ${domain}`,
      body: `<div style="max-width:800px;margin:40px auto;padding:0 20px">
        <h1 style="font-size:32px;margin-bottom:8px">Terms of Service</h1>
        <p style="color:#999;margin-bottom:24px">Last updated: ${new Date().toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'})}</p>
        <p style="font-size:16px;line-height:1.8;margin-bottom:16px">By accessing ${domain}, you agree to these terms. Content is for informational purposes only.</p>
        <h2 style="font-size:20px;margin:24px 0 10px">Disclaimer</h2>
        <p style="font-size:16px;line-height:1.8">Information on this site does not constitute professional advice. Always consult qualified professionals for specific situations.</p>
      </div>`
    },
    'disclaimer/index.html': {
      title: 'Disclaimer',
      description: `Disclaimer for ${domain}`,
      body: `<div style="max-width:800px;margin:40px auto;padding:0 20px">
        <h1 style="font-size:32px;margin-bottom:16px">Disclaimer</h1>
        <p style="font-size:16px;line-height:1.8;margin-bottom:16px">The information provided on ${siteName} is for general informational purposes only. While we strive to keep information accurate and up-to-date, we make no representations or warranties of any kind.</p>
        <p style="font-size:16px;line-height:1.8">We may earn commissions from affiliate links. This does not affect our editorial independence.</p>
      </div>`
    },
    'contact/index.html': {
      title: 'Contact Us',
      description: `Contact ${siteName}`,
      body: `<div style="max-width:600px;margin:40px auto;padding:0 20px">
        <h1 style="font-size:32px;margin-bottom:16px">Contact Us</h1>
        <p style="font-size:16px;line-height:1.8;margin-bottom:24px">Have a question, correction, or want to work with us? Reach out below.</p>
        <p style="font-size:16px">📧 Email: <a href="mailto:contact@${domain}">contact@${domain}</a></p>
      </div>`
    },
    'advertise/index.html': {
      title: 'Advertise With Us',
      description: `Advertising opportunities on ${siteName}`,
      body: `<div style="max-width:700px;margin:40px auto;padding:0 20px">
        <h1 style="font-size:32px;margin-bottom:16px">Advertise With Us</h1>
        <p style="font-size:16px;line-height:1.8;margin-bottom:16px">${siteName} reaches a highly targeted audience interested in ${siteName.toLowerCase()}. We offer display advertising, sponsored content, and affiliate partnerships.</p>
        <p style="font-size:16px">Contact us: <a href="mailto:ads@${domain}">ads@${domain}</a></p>
      </div>`
    }
  };

  for (const [path, page] of Object.entries(pages)) {
    const dir = join(WWW_ROOT, domain, path.replace('/index.html', ''));
    mkdirSync(dir, { recursive: true });
    // Wrap body in a basic layout (can't use renderBase without full template context)
    const html = simplePageWrapper(page.title, page.description, page.body, siteConfig);
    writeFileSync(join(WWW_ROOT, domain, path), html, 'utf-8');
  }
}

async function generateHomePage(domain, articles, siteConfig, template) {
  const { renderHomePage } = await import(`${TEMPLATES_DIR}/${template}/src/layout.js`);
  const html = renderHomePage(articles, siteConfig);
  writeFileSync(join(WWW_ROOT, domain, 'index.html'), html, 'utf-8');
}

function writeApiFiles(domain, articles, niche) {
  const apiDir = join(WWW_ROOT, domain, 'api');
  mkdirSync(apiDir, { recursive: true });

  const lite = articles.map(a => ({ slug: a.slug, title: a.title, excerpt: a.excerpt || '', tags: a.tags || [], category: a.category || 'Guide' }));
  writeFileSync(join(apiDir, 'articles.json'), JSON.stringify(lite), 'utf-8');
  writeFileSync(join(apiDir, 'trending.json'), JSON.stringify(lite.slice(0, 8)), 'utf-8');

  // Pre-populate with niche sub-categories so nav shows from day 1
  const nicheCats = getCategoriesForNiche(niche.slug);
  const cats = nicheCats.length ? nicheCats : [{ name: niche.name, slug: niche.slug }];
  writeFileSync(join(apiDir, 'categories.json'), JSON.stringify(cats), 'utf-8');
}

function writePlaceholderImage(domain) {
  // SVG placeholder — no external dependency
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" viewBox="0 0 800 450">
    <rect width="800" height="450" fill="#e8e8e8"/>
    <text x="400" y="225" text-anchor="middle" fill="#aaa" font-size="24" font-family="sans-serif">Image</text>
  </svg>`;
  writeFileSync(join(WWW_ROOT, domain, 'images/placeholder.webp'), svg, 'utf-8');
}

function simplePageWrapper(title, description, content, site) {
  return `<!DOCTYPE html><html lang="en"><head>
<meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${title} | ${site.name}</title>
<meta name="description" content="${description}"/>
<link rel="stylesheet" href="/assets/style.css"/>
</head><body>
<header style="background:#1a1a2e;padding:14px 20px">
  <a href="/" style="color:#fff;text-decoration:none;font-size:22px;font-weight:800">${site.name}</a>
</header>
<main style="padding:20px 0;min-height:60vh">${content}</main>
<footer style="background:#1a1a2e;color:rgba(255,255,255,.6);text-align:center;padding:20px;font-size:13px">
  <p>© ${new Date().getFullYear()} ${site.name} · <a href="/privacy/" style="color:rgba(255,255,255,.5)">Privacy</a> · <a href="/terms/" style="color:rgba(255,255,255,.5)">Terms</a></p>
</footer>
</body></html>`;
}

function generateSiteName(domain) {
  const base = domain.split('.')[0];
  return base.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

function getWeekNumber() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  return Math.ceil(((now - start) / 86400000 + start.getDay() + 1) / 7);
}

run().catch(err => { console.error(err); process.exit(1); });
