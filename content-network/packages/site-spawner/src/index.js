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
  generateRobotsTxt, generateAdsTxt, generateSitemap, writeSiteFile, enableSSL
} from '@content-network/vps';
import { setupDomain as cfSetupDomain, purgeCache as cfPurgeCache } from '@content-network/vps/src/cloudflare.js';
import { AUTHOR_PERSONAS } from '@content-network/content-engine/src/prompts.js';
import { generateAuthors } from '@content-network/content-engine/src/author-generator.js';
import { getCategoriesForNiche } from '@content-network/content-engine/src/categories.js';
import { TOOL_CONFIGS } from '@content-network/content-engine/src/tools/tool-configs.js';
import { generateToolPage } from '@content-network/content-engine/src/tools/tool-generator.js';
import { getAllCategoryIntros } from '@content-network/content-engine/src/category-intros.js';

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

  // A/B template: se --template specificato usa quello, altrimenti assegna round-robin
  // con leggera randomizzazione per distribuzione uniforme tra tutti i template
  const templateArg = args.find(a => a.startsWith('--template='))?.split('=')[1]
    || args[args.indexOf('--template') + 1];
  const template = templateArg && TEMPLATES.includes(templateArg)
    ? templateArg
    : getTemplateForWeek(weekNumber, parseInt(count));

  // ab_variant = 'A' se template corrisponde a quello di default per la nicchia, 'B' altrimenti
  const abVariant = template === niche.template ? 'A' : 'B';

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

  // Salva ab_variant
  await sql`UPDATE sites SET ab_variant = ${abVariant} WHERE id = ${site.id}`;
  console.log(`A/B Variant: ${abVariant} (template: ${template} vs niche default: ${niche.template})`);

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

    // 4. Immagine placeholder + og:image default
    writePlaceholderImage(domain, siteConfig.name);

    // 5. robots.txt + ads.txt
    generateRobotsTxt(domain);
    generateAdsTxt(domain, process.env.ADSENSE_ID, process.env.EZOIC_SITE_ID);

    // 6. API endpoints JSON (vuoti inizialmente)
    writeApiFiles(domain, [], niche);

    // 7. Pagine statiche (About, Privacy, Contact, Terms, 404)
    console.log('📄 Generating static pages...');
    await generateStaticPages(domain, siteConfig, template);

    // 7b. Pagina autore — genera bio lunga + scarica foto
    console.log('👤 Generating author profile...');
    try {
      const sitePublicDir = join(WWW_ROOT, domain);
      const authors = await generateAuthors(nicheSlug, { destDir: sitePublicDir, isVps: true });
      if (authors?.length) {
        await generateAuthorPage(domain, authors[0], siteConfig, template);
        siteConfig.authorData = authors[0]; // salva per usare nella about page
      }
    } catch (err) {
      console.warn(`  ⚠️  Author generation failed (non-blocking): ${err.message}`);
    }

    // 7c. Interactive tool page per la nicchia
    const toolConfig = TOOL_CONFIGS[nicheSlug];
    if (toolConfig) {
      console.log(`🔧 Generating interactive tool: ${toolConfig.title}...`);
      try {
        generateToolFile(domain, toolConfig, siteConfig);
        console.log(`  ✅ Tool: /tools/${toolConfig.slug}/`);
      } catch (err) {
        console.warn(`  ⚠️  Tool generation failed (non-blocking): ${err.message}`);
      }
    }

    // 7d. Category pages con intro text
    console.log('📂 Generating category pages...');
    const categories = getCategoriesForNiche(nicheSlug);
    const categoryIntros = getAllCategoryIntros(nicheSlug);
    for (const cat of categories) {
      generateCategoryPage(domain, cat, categoryIntros[cat.slug], siteConfig);
    }
    console.log(`  ✅ ${categories.length} category pages generated`);

    // 8. Homepage con articoli (vuota inizialmente)
    await generateHomePage(domain, [], siteConfig, template);

    // 9. nginx virtual host
    console.log('⚙️  Configuring nginx...');
    createNginxConfig(domain);
    const reloaded = reloadNginx();
    if (!reloaded) console.warn('  ⚠️  nginx reload failed — check manually');

    // 10. Cloudflare setup (DNS + CDN + SSL + settings)
    const serverIp = process.env.SERVER_IP || '178.104.17.161';
    let nameservers = [];
    if (process.env.CLOUDFLARE_API_TOKEN) {
      try {
        const cf = await cfSetupDomain(domain, serverIp);
        nameservers = cf.nameservers;
        // Con Cloudflare proxy attivo, SSL è gestito da CF — Certbot opzionale
        await updateSiteStatus(site.id, 'live', `https://${domain}`);
      } catch (err) {
        console.warn(`  ⚠️  Cloudflare setup failed (non-blocking): ${err.message}`);
        await updateSiteStatus(site.id, 'live', `http://${domain}`);
      }
    } else {
      // Fallback: SSL manuale con Certbot
      const certbotEmail = process.env.CERTBOT_EMAIL;
      if (certbotEmail) {
        console.log('🔒 Enabling SSL with Certbot...');
        enableSSL(domain, certbotEmail);
      }
      await updateSiteStatus(site.id, 'live', certbotEmail ? `https://${domain}` : `http://${domain}`);
      console.log(`  ℹ️  Set CLOUDFLARE_API_TOKEN in .env for automatic CDN + SSL`);
    }

    // 11. Sitemap completa
    const authorSlugs = siteConfig.authorData ? [siteConfig.authorData.avatar] : [];
    generateSitemap(domain, [], {
      categories,
      authorSlugs,
      toolSlug: toolConfig?.slug || null
    });

    console.log(`\n✅ Site ready: https://${domain}`);
    console.log(`\n📋 Next steps:`);
    if (nameservers.length) {
      console.log(`  1. Set nameservers at your registrar:`);
      nameservers.forEach(ns => console.log(`     → ${ns}`));
      console.log(`  2. Generate keywords: npm run keyword -- --niche ${nicheSlug}`);
      console.log(`  3. Generate content:  npm run content -- --site-id ${site.id} --count 50`);
    } else {
      console.log(`  1. Point DNS A record: ${domain} → ${serverIp}`);
      console.log(`  2. Generate keywords: npm run keyword -- --niche ${nicheSlug}`);
      console.log(`  3. Generate content:  npm run content -- --site-id ${site.id} --count 50`);
    }

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
      noindex: false,
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
      noindex: true,
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
      noindex: true,
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
      noindex: true,
      description: `Disclaimer for ${domain}`,
      body: `<div style="max-width:800px;margin:40px auto;padding:0 20px">
        <h1 style="font-size:32px;margin-bottom:16px">Disclaimer</h1>
        <p style="font-size:16px;line-height:1.8;margin-bottom:16px">The information provided on ${siteName} is for general informational purposes only. While we strive to keep information accurate and up-to-date, we make no representations or warranties of any kind.</p>
        <p style="font-size:16px;line-height:1.8">We may earn commissions from affiliate links. This does not affect our editorial independence.</p>
      </div>`
    },
    'contact/index.html': {
      title: 'Contact Us',
      noindex: true,
      description: `Contact ${siteName}`,
      body: `<div style="max-width:600px;margin:40px auto;padding:0 20px">
        <h1 style="font-size:32px;margin-bottom:16px">Contact Us</h1>
        <p style="font-size:16px;line-height:1.8;margin-bottom:24px">Have a question, correction, or want to work with us? Reach out below.</p>
        <p style="font-size:16px">📧 Email: <a href="mailto:contact@${domain}">contact@${domain}</a></p>
      </div>`
    },
    'advertise/index.html': {
      title: 'Advertise With Us',
      noindex: true,
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
    const canonical = `${siteConfig.url}/${path.replace('index.html', '')}`;
    const html = simplePageWrapper(page.title, page.description, page.body, siteConfig, { noindex: page.noindex || false, canonical });
    writeFileSync(join(WWW_ROOT, domain, path), html, 'utf-8');
  }

  // 404 page — must live at root level (nginx: error_page 404 /404.html)
  const notFoundBody = `
<div style="max-width:600px;margin:80px auto;padding:0 20px;text-align:center;">
  <div style="font-size:80px;font-weight:900;color:#e8e8e8;line-height:1;margin-bottom:16px;">404</div>
  <h1 style="font-family:Georgia,serif;font-size:28px;font-weight:700;color:#1a1a2e;margin-bottom:12px;">Page Not Found</h1>
  <p style="font-size:16px;line-height:1.7;color:#666;margin-bottom:32px;">
    The page you're looking for doesn't exist or may have been moved.
    Here are some helpful links instead:
  </p>
  <div style="display:flex;flex-wrap:wrap;gap:12px;justify-content:center;margin-bottom:40px;">
    <a href="/" style="display:inline-block;background:#c0392b;color:white;padding:11px 22px;border-radius:5px;text-decoration:none;font-size:15px;font-weight:700;">← Back to Home</a>
    <a href="/tools/" style="display:inline-block;background:#1a1a2e;color:white;padding:11px 22px;border-radius:5px;text-decoration:none;font-size:15px;font-weight:700;">Free Calculator</a>
  </div>
  <div style="border-top:1px solid #eee;padding-top:28px;">
    <p style="font-size:14px;font-weight:700;color:#1a1a2e;margin-bottom:12px;">Browse by Category</p>
    <div style="display:flex;flex-wrap:wrap;gap:8px;justify-content:center;" id="notfound-cats"></div>
  </div>
</div>
<script>
  fetch('/api/categories.json').then(r=>r.json()).then(cats=>{
    const el=document.getElementById('notfound-cats');
    if(!el||!cats?.length)return;
    el.innerHTML=cats.slice(0,6).map(c=>\`<a href="/category/\${c.slug}/" style="display:inline-block;background:#f4f4f0;color:#333;padding:6px 14px;border-radius:20px;text-decoration:none;font-size:13px;font-weight:600;">\${c.name}</a>\`).join('');
  }).catch(()=>{});
</script>`;

  writeFileSync(join(WWW_ROOT, domain, '404.html'),
    simplePageWrapper('Page Not Found', `The page you're looking for doesn't exist — ${siteName}`, notFoundBody, siteConfig, { noindex: true }),
    'utf-8');
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

async function generateAuthorPage(domain, author, siteConfig, template) {
  const { renderBase } = await import(`${TEMPLATES_DIR}/${template}/src/layout.js`);
  const siteName = siteConfig.name;

  // Paragrafi della bio lunga
  const bioParagraphs = (author.longBio || author.shortBio)
    .split('\n\n')
    .filter(p => p.trim())
    .map(p => `<p style="font-size:16px;line-height:1.9;margin-bottom:22px">${p.trim()}</p>`)
    .join('');

  const socialLinks = author.socialLinks
    ? Object.entries(author.socialLinks)
        .filter(([, url]) => url)
        .map(([net, url]) => `<a href="${url}" target="_blank" rel="noopener noreferrer"
          style="display:inline-block;background:#1a1a2e;color:white;padding:8px 16px;border-radius:4px;text-decoration:none;font-size:13px;font-weight:600;margin-right:8px;margin-bottom:8px;">${net.charAt(0).toUpperCase() + net.slice(1)}</a>`)
        .join('')
    : '';

  const body = `
<div style="max-width:900px;margin:32px auto;padding:0 20px">
  <!-- Hero -->
  <div style="background:white;border-radius:4px;box-shadow:0 2px 8px rgba(0,0,0,0.1);overflow:hidden;margin-bottom:36px;">
    <div style="height:4px;background:#c0392b;"></div>
    <div style="padding:40px;display:flex;gap:36px;align-items:flex-start;flex-wrap:wrap;">
      <img src="/authors/${author.avatar}.jpg"
        alt="${author.name}"
        onerror="this.src='/images/placeholder.webp'"
        style="width:180px;height:180px;object-fit:cover;border-radius:50%;border:4px solid #f4f4f0;box-shadow:0 4px 16px rgba(0,0,0,0.15);flex-shrink:0;" />
      <div style="flex:1;min-width:240px;">
        <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:#c0392b;margin-bottom:8px;">Expert Contributor</div>
        <h1 style="font-family:Georgia,serif;font-size:clamp(24px,4vw,36px);font-weight:900;color:#1a1a2e;margin-bottom:8px;line-height:1.2;">${author.name}</h1>
        <p style="font-size:16px;font-weight:600;color:#666;margin-bottom:20px;">${author.title}</p>
        <p style="font-size:15px;line-height:1.75;color:#333;border-left:3px solid #c0392b;padding-left:14px;margin-bottom:24px;">${author.shortBio}</p>
        ${socialLinks}
      </div>
    </div>
  </div>

  <!-- Bio lunga -->
  <div style="display:grid;grid-template-columns:1fr 280px;gap:32px;align-items:start;">
    <div style="background:white;border-radius:4px;box-shadow:0 2px 8px rgba(0,0,0,0.1);padding:36px;">
      <h2 style="font-family:Georgia,serif;font-size:22px;font-weight:700;color:#1a1a2e;margin-bottom:24px;padding-bottom:12px;border-bottom:2px solid #c0392b;">About ${author.name}</h2>
      ${bioParagraphs}
    </div>
    <aside>
      <div style="background:white;border-radius:4px;box-shadow:0 2px 8px rgba(0,0,0,0.1);padding:24px;border-top:3px solid #c0392b;margin-bottom:20px;">
        <h3 style="font-family:Georgia,serif;font-size:15px;font-weight:700;color:#1a1a2e;margin-bottom:16px;text-transform:uppercase;letter-spacing:0.5px;">Role at ${siteName}</h3>
        <p style="font-size:14px;line-height:1.7;color:#555;">${author.title} — writes and reviews all content in this area to ensure accuracy and real-world relevance.</p>
      </div>
      <div style="background:#1a1a2e;color:white;border-radius:4px;padding:24px;">
        <h3 style="font-size:15px;font-weight:700;margin-bottom:12px;">Editorial Standards</h3>
        <p style="font-size:13px;line-height:1.7;color:rgba(255,255,255,0.75);margin-bottom:16px;">All content is fact-checked and reviewed before publication. We follow strict guidelines for accuracy.</p>
        <a href="/about/" style="color:#c0392b;font-size:13px;font-weight:600;text-decoration:none;">Read our editorial process →</a>
      </div>
    </aside>
  </div>
</div>`;

  const html = simplePageWrapper(`${author.name} — ${author.title}`, author.shortBio, body, siteConfig, { canonical: `${siteConfig.url}/author/${author.avatar}/` });
  const dir = join(WWW_ROOT, domain, 'author', author.avatar);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'index.html'), html, 'utf-8');
  console.log(`  ✅ Author page: /author/${author.avatar}/`);
}

function generateCategoryPage(domain, category, introData, siteConfig) {
  const siteName = siteConfig.name;
  const headline = introData?.headline || `${category.name} — Articles & Guides`;
  const introText = (introData?.intro || `Explore our in-depth guides and articles about ${category.name.toLowerCase()}. All content is written by verified experts and reviewed for accuracy.`).replace(/\{\{siteName\}\}/g, siteName);

  const body = `
<div style="max-width:900px;margin:32px auto;padding:0 20px;">
  <!-- Breadcrumb -->
  <nav style="font-size:13px;color:#999;margin-bottom:20px;">
    <a href="/" style="color:#999;">Home</a> › <span style="color:#555;">${category.name}</span>
  </nav>

  <!-- Category hero -->
  <div style="border-bottom:3px solid #c0392b;margin-bottom:28px;padding-bottom:20px;">
    <h1 style="font-family:Georgia,serif;font-size:clamp(22px,4vw,32px);font-weight:900;color:#1a1a2e;margin-bottom:14px;">${headline}</h1>
    <p style="font-size:16px;line-height:1.85;color:#444;max-width:720px;">${introText}</p>
  </div>

  <!-- Articles grid (populated dynamically) -->
  <div id="cat-articles" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:20px;margin-bottom:40px;">
    <p style="color:#aaa;font-size:14px;grid-column:1/-1;">Loading articles...</p>
  </div>

  <!-- Internal tool CTA -->
  <div style="background:#fef5f4;border:1px solid #f5c6c0;border-left:4px solid #c0392b;border-radius:6px;padding:20px 24px;margin-top:32px;">
    <p style="font-size:15px;font-weight:600;color:#1a1a2e;margin-bottom:6px;">Free Planning Tool</p>
    <p style="font-size:14px;color:#555;margin-bottom:12px;">Use our interactive calculator to get an instant, personalized estimate for your project.</p>
    <a href="/tools/" style="display:inline-block;background:#c0392b;color:white;padding:9px 20px;border-radius:5px;text-decoration:none;font-size:14px;font-weight:700;">Try the Calculator →</a>
  </div>
</div>

<script>
  fetch('/api/articles.json')
    .then(r => r.json())
    .then(articles => {
      const cat = '${category.name}'.toLowerCase();
      const filtered = articles.filter(a => a.category && a.category.toLowerCase() === cat);
      const el = document.getElementById('cat-articles');
      if (!filtered.length) { el.innerHTML = '<p style="color:#aaa;font-size:14px;">Articles coming soon.</p>'; return; }
      el.innerHTML = filtered.map(a => \`
        <a href="/\${a.slug}" style="display:block;text-decoration:none;background:white;border:1px solid #eee;border-radius:6px;overflow:hidden;transition:box-shadow .2s;" onmouseover="this.style.boxShadow='0 4px 16px rgba(0,0,0,.1)'" onmouseout="this.style.boxShadow=''">
          <img src="/images/\${a.slug}.jpg" alt="\${a.title}" loading="lazy" style="width:100%;height:160px;object-fit:cover;display:block;" onerror="this.style.display='none'" />
          <div style="padding:14px 16px;">
            <p style="font-size:14px;font-weight:700;color:#1a1a2e;margin:0 0 6px;line-height:1.4;">\${a.title}</p>
            <p style="font-size:13px;color:#666;margin:0;line-height:1.5;">\${(a.excerpt || '').slice(0, 100)}\${a.excerpt?.length > 100 ? '...' : ''}</p>
          </div>
        </a>\`).join('');
    }).catch(() => {
      document.getElementById('cat-articles').innerHTML = '<p style="color:#aaa;font-size:14px;">Articles coming soon.</p>';
    });
</script>`;

  const html = simplePageWrapper(headline, introText.slice(0, 160), body, siteConfig, { canonical: `${siteConfig.url}/category/${category.slug}/` });
  const dir = join(WWW_ROOT, domain, 'category', category.slug);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'index.html'), html, 'utf-8');
}

function generateToolFile(domain, toolConfig, siteConfig) {
  const TEMPLATE_COLORS = {
    pulse:   '#c0392b',
    tribune: '#1a3a6b',
    nexus:   '#0d7377',
    echo:    '#4a235a',
    vortex:  '#b7410e',
  };
  const color = TEMPLATE_COLORS[siteConfig.template] || '#c0392b';

  const html = generateToolPage(toolConfig, {
    name:  siteConfig.name,
    url:   siteConfig.url,
    color,
    niche: siteConfig.nicheSlug,
  });

  const toolDir = join(WWW_ROOT, domain, 'tools', toolConfig.slug);
  mkdirSync(toolDir, { recursive: true });
  writeFileSync(join(toolDir, 'index.html'), html, 'utf-8');
}

function writePlaceholderImage(domain, siteName = '') {
  // SVG placeholder — no external dependency
  const placeholder = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" viewBox="0 0 800 450">
    <rect width="800" height="450" fill="#e8e8e8"/>
    <text x="400" y="225" text-anchor="middle" fill="#aaa" font-size="24" font-family="sans-serif">Image</text>
  </svg>`;
  writeFileSync(join(WWW_ROOT, domain, 'images/placeholder.webp'), placeholder, 'utf-8');

  // og-default.jpg — 1200x630 branded SVG, used as og:image fallback for non-article pages.
  // Real social crawlers prefer JPG/PNG; replace with an actual image once available via Pexels.
  const label = siteName || domain;
  const ogDefault = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
    <rect width="1200" height="630" fill="#1a1a2e"/>
    <rect x="0" y="0" width="8" height="630" fill="#c0392b"/>
    <text x="80" y="290" font-family="Georgia,serif" font-size="52" font-weight="bold" fill="#ffffff">${label}</text>
    <text x="80" y="360" font-family="sans-serif" font-size="24" fill="rgba(255,255,255,0.6)">Expert Guides &amp; How-To Articles</text>
  </svg>`;
  writeFileSync(join(WWW_ROOT, domain, 'images/og-default.jpg'), ogDefault, 'utf-8');
}

function simplePageWrapper(title, description, content, site, { noindex = false, canonical = '', ogImage = '' } = {}) {
  const effectiveOgImage = ogImage || `${site.url}/images/og-default.jpg`;
  const ga4Id = process.env.GA4_MEASUREMENT_ID || '';
  const gscVerification = process.env.GOOGLE_SITE_VERIFICATION || '';
  const ga4Script = ga4Id ? `
  <script async src="https://www.googletagmanager.com/gtag/js?id=${ga4Id}"></script>
  <script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${ga4Id}',{anonymize_ip:true});</script>` : '';
  const robots = noindex ? 'noindex, follow' : 'index, follow, max-image-preview:large';

  return `<!DOCTYPE html><html lang="en"><head>
<meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<meta name="robots" content="${robots}"/>
${gscVerification ? `<meta name="google-site-verification" content="${gscVerification}"/>` : ''}
<title>${htmlEsc(title)} | ${htmlEsc(site.name)}</title>
<meta name="description" content="${htmlEsc(description)}"/>
${canonical ? `<link rel="canonical" href="${canonical}"/>` : ''}
<meta property="og:title" content="${htmlEsc(title)}"/>
<meta property="og:description" content="${htmlEsc(description)}"/>
<meta property="og:type" content="website"/>
<meta property="og:site_name" content="${htmlEsc(site.name)}"/>
${canonical ? `<meta property="og:url" content="${canonical}"/>` : ''}
<meta property="og:image" content="${effectiveOgImage}"/>
<meta name="twitter:card" content="summary_large_image"/>
<link rel="preconnect" href="https://pagead2.googlesyndication.com"/>
<link rel="preconnect" href="https://www.googletagmanager.com"/>
<link rel="dns-prefetch" href="https://www.google-analytics.com"/>
<link rel="stylesheet" href="/assets/style.css"/>
${ga4Script}
</head><body>
<header style="background:#1a1a2e;padding:14px 20px">
  <a href="/" style="color:#fff;text-decoration:none;font-size:22px;font-weight:800">${site.name}</a>
</header>
<main style="padding:20px 0;min-height:60vh">${content}</main>
<footer style="background:#1a1a2e;color:rgba(255,255,255,.6);text-align:center;padding:20px;font-size:13px">
  <p>&copy; ${new Date().getFullYear()} ${site.name} &middot; <a href="/privacy/" style="color:rgba(255,255,255,.5)">Privacy</a> &middot; <a href="/terms/" style="color:rgba(255,255,255,.5)">Terms</a></p>
</footer>
</body></html>`;
}

function htmlEsc(str = '') {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
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
