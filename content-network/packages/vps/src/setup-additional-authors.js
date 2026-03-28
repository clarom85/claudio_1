/**
 * setup-additional-authors.js — Scarica immagini e crea pagine autore
 * per gli autori aggiuntivi definiti in ADDITIONAL_AUTHORS.
 *
 * Da eseguire dopo aver aggiunto nuovi siti o nuovi autori aggiuntivi.
 * È idempotente: non sovrascrive immagini o pagine già esistenti.
 *
 * Uso:
 *   node packages/vps/src/setup-additional-authors.js
 *   node packages/vps/src/setup-additional-authors.js --force   # sovrascrive tutto
 */
import 'dotenv/config';
import { existsSync, mkdirSync, writeFileSync, createWriteStream } from 'fs';
import { join } from 'path';
import https from 'https';
import http from 'http';
import { sql } from '@content-network/db';
import { ADDITIONAL_AUTHORS } from '@content-network/content-engine/src/prompts.js';

const WWW_ROOT = process.env.WWW_ROOT || '/var/www';
const PEXELS_KEY = process.env.PEXELS_API_KEY;
const FORCE = process.argv.includes('--force');

// Pexels search queries per autore aggiuntivo — portrait professionale
const PORTRAIT_QUERIES = {
  'karen-phillips':   'professional woman smiling portrait headshot',
  'dan-mercer':       'professional man confident portrait headshot',
  'sarah-campbell':   'professional woman business portrait headshot',
  'chris-washington': 'professional man serious portrait headshot',
};

function htmlEsc(str = '') {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function simplePageWrapper(title, description, content, site, { canonical = '' } = {}) {
  const ga4Id = process.env.GA4_MEASUREMENT_ID || '';
  const gscKeys = (process.env.GOOGLE_SITE_VERIFICATION || '').split(',').map(s => s.trim()).filter(Boolean);
  const ga4Script = ga4Id ? `
  <script async src="https://www.googletagmanager.com/gtag/js?id=${ga4Id}"></script>
  <script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${ga4Id}',{anonymize_ip:true});</script>` : '';

  return `<!DOCTYPE html><html lang="en"><head>
<meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<meta name="robots" content="index, follow, max-image-preview:large"/>
${gscKeys.map(k=>`<meta name="google-site-verification" content="${k}"/>`).join('\n')}
<title>${htmlEsc(title)} | ${htmlEsc(site.name)}</title>
<meta name="description" content="${htmlEsc(description)}"/>
${canonical ? `<link rel="canonical" href="${canonical}"/>` : ''}
<meta property="og:title" content="${htmlEsc(title)}"/>
<meta property="og:description" content="${htmlEsc(description)}"/>
<meta property="og:type" content="website"/>
<meta property="og:site_name" content="${htmlEsc(site.name)}"/>
${canonical ? `<meta property="og:url" content="${canonical}"/>` : ''}
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

function buildAuthorPageHtml(author, siteConfig, imgSrc) {
  const bioParagraphs = author.bio
    .split(/\n\n|\n/)
    .filter(p => p.trim().length > 20)
    .map(p => `<p style="font-size:16px;line-height:1.9;margin-bottom:22px">${p.trim()}</p>`)
    .join('');

  const personSchema = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: author.name,
    jobTitle: author.title,
    description: author.bio,
    url: `${siteConfig.url}/author/${author.avatar}/`,
    image: imgSrc,
    worksFor: { '@type': 'Organization', name: siteConfig.name, url: siteConfig.url },
  });

  const body = `
<script type="application/ld+json">${personSchema}</script>
<style>
.author-bio-grid{display:grid;grid-template-columns:1fr 280px;gap:32px;align-items:start}
@media(max-width:700px){
  .author-bio-grid{grid-template-columns:1fr}
  .author-hero-flex{flex-direction:column;align-items:center;text-align:center;padding:24px!important}
  .author-hero-flex img{width:120px!important;height:120px!important}
}
</style>
<div style="max-width:900px;margin:32px auto;padding:0 20px">
  <div style="background:white;border-radius:4px;box-shadow:0 2px 8px rgba(0,0,0,0.1);overflow:hidden;margin-bottom:36px;">
    <div style="height:4px;background:#c0392b;"></div>
    <div class="author-hero-flex" style="padding:40px;display:flex;gap:36px;align-items:flex-start;flex-wrap:wrap;">
      <img src="${imgSrc}"
        alt="${htmlEsc(author.name)}"
        onerror="this.style.display='none'"
        style="width:160px;height:160px;object-fit:cover;object-position:center;border-radius:50%;border:4px solid #f4f4f0;box-shadow:0 4px 16px rgba(0,0,0,0.15);flex-shrink:0;" />
      <div style="flex:1;min-width:220px;">
        <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:#c0392b;margin-bottom:8px;">Expert Contributor</div>
        <h1 style="font-family:Georgia,serif;font-size:clamp(22px,4vw,34px);font-weight:900;color:#1a1a2e;margin-bottom:8px;line-height:1.2;">${htmlEsc(author.name)}</h1>
        <p style="font-size:15px;font-weight:600;color:#666;margin-bottom:16px;">${htmlEsc(author.title)}</p>
        <p style="font-size:14px;line-height:1.75;color:#333;border-left:3px solid #c0392b;padding-left:14px;margin-bottom:20px;">${htmlEsc(author.bio.slice(0, 200))}${author.bio.length > 200 ? '...' : ''}</p>
      </div>
    </div>
  </div>
  <div class="author-bio-grid">
    <div style="background:white;border-radius:4px;box-shadow:0 2px 8px rgba(0,0,0,0.1);padding:32px;">
      <h2 style="font-family:Georgia,serif;font-size:20px;font-weight:700;color:#1a1a2e;margin-bottom:24px;padding-bottom:12px;border-bottom:2px solid #c0392b;">About ${htmlEsc(author.name)}</h2>
      ${bioParagraphs}
    </div>
    <aside>
      <div style="background:white;border-radius:4px;box-shadow:0 2px 8px rgba(0,0,0,0.1);padding:24px;border-top:3px solid #c0392b;margin-bottom:20px;">
        <h3 style="font-family:Georgia,serif;font-size:14px;font-weight:700;color:#1a1a2e;margin-bottom:12px;text-transform:uppercase;letter-spacing:0.5px;">Role at ${htmlEsc(siteConfig.name)}</h3>
        <p style="font-size:14px;line-height:1.7;color:#555;">${htmlEsc(author.title)} — writes and reviews content in this area to ensure accuracy and real-world relevance.</p>
      </div>
      <div style="background:#1a1a2e;color:white;border-radius:4px;padding:24px;">
        <h3 style="font-size:14px;font-weight:700;margin-bottom:12px;">Editorial Standards</h3>
        <p style="font-size:13px;line-height:1.7;color:rgba(255,255,255,0.75);margin-bottom:16px;">All content is fact-checked and reviewed before publication. We follow strict guidelines for accuracy.</p>
        <a href="/about/" style="color:#c0392b;font-size:13px;font-weight:600;text-decoration:none;">Read our editorial process &#8594;</a>
      </div>
    </aside>
  </div>
</div>`;

  return simplePageWrapper(
    `${author.name} — ${author.title}`,
    author.bio.slice(0, 155),
    body,
    siteConfig,
    { canonical: `${siteConfig.url}/author/${author.avatar}/` }
  );
}

async function downloadPexelsImage(query, destPath) {
  if (!PEXELS_KEY) throw new Error('PEXELS_API_KEY not set');

  const searchUrl = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=5&orientation=square`;
  const resp = await fetch(searchUrl, { headers: { Authorization: PEXELS_KEY } });
  if (!resp.ok) throw new Error(`Pexels search failed: ${resp.status}`);
  const data = await resp.json();

  const photos = data.photos || [];
  if (!photos.length) throw new Error(`No Pexels results for: ${query}`);

  // Pick the first photo, use medium size (350px)
  const imgUrl = photos[0].src.medium;

  await new Promise((resolve, reject) => {
    const proto = imgUrl.startsWith('https') ? https : http;
    const file = createWriteStream(destPath);
    proto.get(imgUrl, res => {
      res.pipe(file);
      file.on('finish', () => { file.close(); resolve(); });
    }).on('error', err => { file.close(); reject(err); });
  });
}

async function setupAuthor(author, domain, siteConfig) {
  const imgDest = join(WWW_ROOT, domain, 'images', `author-${author.avatar}.jpg`);
  const pageDir = join(WWW_ROOT, domain, 'author', author.avatar);
  const pageFile = join(pageDir, 'index.html');

  // ── Image ────────────────────────────────────────────────────────────────
  let imgSrc;
  if (!existsSync(imgDest) || FORCE) {
    const query = PORTRAIT_QUERIES[author.avatar] || 'professional business portrait headshot';
    try {
      await downloadPexelsImage(query, imgDest);
      console.log(`    📷 Downloaded: /images/author-${author.avatar}.jpg`);
      imgSrc = `/images/author-${author.avatar}.jpg`;
    } catch (err) {
      console.warn(`    ⚠️  Pexels failed (${err.message}) — using avatarUrl fallback`);
      imgSrc = author.avatarUrl || `/images/author-${author.avatar}.jpg`;
    }
  } else {
    console.log(`    ✓ Image already exists: /images/author-${author.avatar}.jpg`);
    imgSrc = `/images/author-${author.avatar}.jpg`;
  }

  // ── Author page ──────────────────────────────────────────────────────────
  if (!existsSync(pageFile) || FORCE) {
    mkdirSync(pageDir, { recursive: true });
    const html = buildAuthorPageHtml(author, siteConfig, imgSrc);
    writeFileSync(pageFile, html, 'utf8');
    console.log(`    📄 Created: /author/${author.avatar}/`);
  } else {
    console.log(`    ✓ Author page already exists: /author/${author.avatar}/`);
  }
}

async function run() {
  const sites = await sql`
    SELECT s.id, s.domain, s.status, n.slug as niche_slug
    FROM sites s
    JOIN niches n ON n.id = s.niche_id
    WHERE s.status = 'live'
  `;

  console.log(`\n👥 Setup Additional Authors — ${sites.length} live site(s)\n`);

  for (const site of sites) {
    const extras = ADDITIONAL_AUTHORS[site.niche_slug];
    if (!extras || extras.length === 0) {
      console.log(`⏭  ${site.domain} (${site.niche_slug}) — no additional authors defined`);
      continue;
    }

    const siteConfig = {
      name: site.domain.replace(/\..+$/, '').replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
      url: `https://${site.domain}`,
    };

    console.log(`🌐 ${site.domain} (${site.niche_slug}) — ${extras.length} additional author(s)`);
    for (const author of extras) {
      console.log(`  → ${author.name}`);
      await setupAuthor(author, site.domain, siteConfig);
    }
  }

  console.log('\n✅ Done');
  process.exit(0);
}

run().catch(err => { console.error(err); process.exit(1); });
