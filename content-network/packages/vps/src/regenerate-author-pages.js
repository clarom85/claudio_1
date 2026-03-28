/**
 * regenerate-author-pages.js — Rigenera le pagine autore per siti esistenti.
 *
 * Legge la longBio dal file api/author.json (persistito da generateAuthors()),
 * così la pagina usa sempre la bio completa (450-600 parole) invece del
 * fallback corto da AUTHOR_PERSONAS.
 *
 * Uso:
 *   node packages/vps/src/regenerate-author-pages.js --site-id 5
 *   node packages/vps/src/regenerate-author-pages.js --all
 *
 * Se api/author.json non esiste sul sito, usa AUTHOR_PERSONAS come fallback.
 */
import 'dotenv/config';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { sql } from '@content-network/db';
import { AUTHOR_PERSONAS } from '@content-network/content-engine/src/prompts.js';

const WWW_ROOT = process.env.WWW_ROOT || '/var/www';

function htmlEsc(str = '') {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function simplePageWrapper(title, description, content, site, { noindex = false, canonical = '', ogImage = '' } = {}) {
  const effectiveOgImage = ogImage || `${site.url}/images/og-default.jpg`;
  const ga4Id = process.env.GA4_MEASUREMENT_ID || '';
  const gscKeys = (process.env.GOOGLE_SITE_VERIFICATION || '').split(',').map(s => s.trim()).filter(Boolean);
  const ga4Script = ga4Id ? `
  <script async src="https://www.googletagmanager.com/gtag/js?id=${ga4Id}"></script>
  <script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${ga4Id}',{anonymize_ip:true});</script>` : '';
  const robots = noindex ? 'noindex, follow' : 'index, follow, max-image-preview:large';

  return `<!DOCTYPE html><html lang="en"><head>
<meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<meta name="robots" content="${robots}"/>
${gscKeys.map(k=>`<meta name="google-site-verification" content="${k}"/>`).join('\n')}
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
<link rel="icon" type="image/svg+xml" href="/favicon.svg"/>
<link rel="stylesheet" href="/assets/style.v2.css"/>
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

function buildAuthorPageHtml(author, siteConfig) {
  const bioParagraphs = (author.longBio || author.shortBio)
    .split(/\n\n|\n/)
    .filter(p => p.trim().length > 30)
    .map(p => `<p style="font-size:16px;line-height:1.9;margin-bottom:22px">${p.trim()}</p>`)
    .join('');

  const socialLinksHtml = author.socialLinks
    ? Object.entries(author.socialLinks)
        .filter(([, url]) => url)
        .map(([net, url]) => `<a href="${url}" target="_blank" rel="noopener noreferrer"
          style="display:inline-block;background:#1a1a2e;color:white;padding:8px 16px;border-radius:4px;text-decoration:none;font-size:13px;font-weight:600;margin-right:8px;margin-bottom:8px;">${net.charAt(0).toUpperCase() + net.slice(1)}</a>`)
        .join('')
    : '';

  const body = `
<style>
.author-bio-grid{display:grid;grid-template-columns:1fr 280px;gap:32px;align-items:start}
@media(max-width:700px){
  .author-bio-grid{grid-template-columns:1fr}
  .author-hero-flex{flex-direction:column;align-items:center;text-align:center;padding:24px!important}
  .author-hero-flex img{width:120px!important;height:120px!important}
  .author-hero-flex .author-short-bio{text-align:left}
}
</style>
<div style="max-width:900px;margin:32px auto;padding:0 20px">
  <!-- Hero -->
  <div style="background:white;border-radius:4px;box-shadow:0 2px 8px rgba(0,0,0,0.1);overflow:hidden;margin-bottom:36px;">
    <div style="height:4px;background:#c0392b;"></div>
    <div class="author-hero-flex" style="padding:40px;display:flex;gap:36px;align-items:flex-start;flex-wrap:wrap;">
      <img src="/images/author-${author.avatar}.jpg"
        alt="${author.name}"
        onerror="this.style.display='none'"
        style="width:160px;height:160px;object-fit:cover;object-position:center;border-radius:50%;border:4px solid #f4f4f0;box-shadow:0 4px 16px rgba(0,0,0,0.15);flex-shrink:0;" />
      <div style="flex:1;min-width:220px;">
        <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:#c0392b;margin-bottom:8px;">Expert Contributor</div>
        <h1 style="font-family:Georgia,serif;font-size:clamp(22px,4vw,34px);font-weight:900;color:#1a1a2e;margin-bottom:8px;line-height:1.2;">${author.name}</h1>
        <p style="font-size:15px;font-weight:600;color:#666;margin-bottom:16px;">${author.title}</p>
        <p class="author-short-bio" style="font-size:14px;line-height:1.75;color:#333;border-left:3px solid #c0392b;padding-left:14px;margin-bottom:20px;">${author.shortBio}</p>
        ${socialLinksHtml}
      </div>
    </div>
  </div>

  <!-- Bio lunga -->
  <div class="author-bio-grid">
    <div style="background:white;border-radius:4px;box-shadow:0 2px 8px rgba(0,0,0,0.1);padding:32px;">
      <h2 style="font-family:Georgia,serif;font-size:20px;font-weight:700;color:#1a1a2e;margin-bottom:24px;padding-bottom:12px;border-bottom:2px solid #c0392b;">About ${author.name}</h2>
      ${bioParagraphs}
    </div>
    <aside>
      <div style="background:white;border-radius:4px;box-shadow:0 2px 8px rgba(0,0,0,0.1);padding:24px;border-top:3px solid #c0392b;margin-bottom:20px;">
        <h3 style="font-family:Georgia,serif;font-size:14px;font-weight:700;color:#1a1a2e;margin-bottom:12px;text-transform:uppercase;letter-spacing:0.5px;">Role at ${siteConfig.name}</h3>
        <p style="font-size:14px;line-height:1.7;color:#555;">${author.title} — writes and reviews all content in this area to ensure accuracy and real-world relevance.</p>
      </div>
      <div style="background:#1a1a2e;color:white;border-radius:4px;padding:24px;">
        <h3 style="font-size:14px;font-weight:700;margin-bottom:12px;">Editorial Standards</h3>
        <p style="font-size:13px;line-height:1.7;color:rgba(255,255,255,0.75);margin-bottom:16px;">All content is fact-checked and reviewed before publication. We follow strict guidelines for accuracy.</p>
        <a href="/about/" style="color:#c0392b;font-size:13px;font-weight:600;text-decoration:none;">Read our editorial process →</a>
      </div>
    </aside>
  </div>
</div>`;

  return simplePageWrapper(
    `${author.name} — ${author.title}`,
    author.shortBio,
    body,
    siteConfig,
    { canonical: `${siteConfig.url}/author/${author.avatar}/` }
  );
}

async function regenerateAuthorPage(site) {
  const siteName = site.domain.split('.')[0].replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  const siteUrl = `https://${site.domain}`;
  const siteConfig = { name: siteName, url: siteUrl, domain: site.domain };

  // Try to load persisted longBio from api/author.json
  let author = null;
  const authorJsonPath = join(WWW_ROOT, site.domain, 'api', 'author.json');
  if (existsSync(authorJsonPath)) {
    try {
      const saved = JSON.parse(readFileSync(authorJsonPath, 'utf-8'));
      if (saved.longBio && saved.longBio.length > 200) {
        author = {
          avatar: saved.slug,
          name: saved.name,
          title: saved.title,
          longBio: saved.longBio,
          shortBio: saved.shortBio,
          socialLinks: saved.socialLinks || {}
        };
        console.log(`  Loaded longBio from api/author.json (${saved.longBio.split(' ').length} words)`);
      }
    } catch (err) {
      console.warn(`  [author] Could not read api/author.json: ${err.message}`);
    }
  }

  // Fallback to AUTHOR_PERSONAS (shortBio only — warns user)
  if (!author) {
    const persona = AUTHOR_PERSONAS[site.niche_slug] || AUTHOR_PERSONAS['home-improvement-costs'];
    author = {
      avatar: persona.avatar,
      name: persona.name,
      title: persona.title,
      longBio: null,
      shortBio: persona.bio,
      socialLinks: {
        linkedin: `https://linkedin.com/in/${persona.avatar}`,
        twitter: `https://twitter.com/${persona.avatar.replace('-', '')}`
      }
    };
    console.warn(`  ⚠️  api/author.json not found — using shortBio fallback (run site-spawner to generate full bio)`);
  }

  const html = buildAuthorPageHtml(author, siteConfig);
  const dir = join(WWW_ROOT, site.domain, 'author', author.avatar);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'index.html'), html, 'utf-8');
  console.log(`  ✅ /author/${author.avatar}/ — ${author.longBio ? author.longBio.split(' ').length : 0} words`);
}

async function run() {
  const args = process.argv.slice(2);
  const all = args.includes('--all');
  const siteId = parseInt(args.find(a => a.startsWith('--site-id='))?.split('=')[1]
    || args[args.indexOf('--site-id') + 1]);

  if (!all && !siteId) {
    console.error('Uso: node regenerate-author-pages.js --site-id <id>  oppure  --all');
    process.exit(1);
  }

  const sites = all
    ? await sql`SELECT s.id, s.domain, n.slug as niche_slug FROM sites s JOIN niches n ON n.id = s.niche_id WHERE s.status != 'inactive' ORDER BY s.id`
    : await sql`SELECT s.id, s.domain, n.slug as niche_slug FROM sites s JOIN niches n ON n.id = s.niche_id WHERE s.id = ${siteId}`;

  if (!sites.length) { console.error('Nessun sito trovato'); process.exit(1); }

  console.log(`\nRigenerando pagine autore per ${sites.length} sito/i...\n`);
  let ok = 0, fail = 0;

  for (const site of sites) {
    console.log(`📝 ${site.domain}`);
    try {
      await regenerateAuthorPage(site);
      ok++;
    } catch (err) {
      console.error(`  ❌ ${site.domain}: ${err.message}`);
      fail++;
    }
  }

  console.log(`\n✅ Completato: ${ok} ok, ${fail} falliti`);
  process.exit(0);
}

run().catch(err => { console.error(err); process.exit(1); });
