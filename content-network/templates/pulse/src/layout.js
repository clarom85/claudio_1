/**
 * PULSE — Tabloid style
 * Rosso/navy, breaking ticker, header bold, sidebar ad-heavy
 */
import { COOKIE_BANNER_CSS, COOKIE_BANNER_HTML, COOKIE_BANNER_JS, EMAIL_FORM_JS, NATIVE_ADS_CSS, NATIVE_ADS_JS } from '../../shared/snippets.js';

export const CSS = `
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --red:#c0392b;--navy:#1a1a2e;--accent:#e67e22;
  --bg:#f4f4f0;--white:#fff;--border:#ddd;--muted:#666;
  --ff-head:'Merriweather',Georgia,serif;--ff-body:'Open Sans',system-ui,sans-serif;
  --max:1200px;--shadow:0 2px 8px rgba(0,0,0,.1);--r:4px
}
html{font-size:16px;scroll-behavior:smooth}
body{font-family:var(--ff-body);background:var(--bg);color:#1a1a1a;line-height:1.6}
.wrap{max-width:var(--max);margin:0 auto;padding:0 16px}
a{color:inherit}
img{max-width:100%;height:auto;display:block}

/* Ticker */
.ticker{background:var(--red);color:#fff;display:flex;align-items:center;height:36px;overflow:hidden;position:sticky;top:0;z-index:100;font-size:13px}
.ticker-lbl{background:var(--navy);padding:0 14px;height:100%;display:flex;align-items:center;font-weight:700;letter-spacing:1.5px;font-size:11px;flex-shrink:0;white-space:nowrap}
.ticker-track{flex:1;overflow:hidden;padding:0 12px}
.ticker-inner{white-space:nowrap;display:inline-block;animation:tick 35s linear infinite}
.ticker-inner:hover{animation-play-state:paused}
.ticker-inner a{color:#fff;text-decoration:none;margin:0 10px}
.ticker-inner a:hover{text-decoration:underline}
@keyframes tick{0%{transform:translateX(100vw)}100%{transform:translateX(-100%)}}

/* Header */
.hdr-top{background:var(--navy);color:rgba(255,255,255,.7);font-size:12px;padding:6px 0}
.hdr-top .wrap{display:flex;justify-content:space-between;align-items:center}
.hdr-top a{color:rgba(255,255,255,.7);text-decoration:none}
.hdr-top a:hover{color:#fff}
.hdr-top nav{display:flex;gap:16px}
.hdr-main{background:#fff;border-bottom:3px solid var(--red);padding:12px 0}
.hdr-main .wrap{display:flex;align-items:center;justify-content:space-between;gap:20px}
.logo{text-decoration:none;line-height:1}
.logo-the{display:block;font-family:var(--ff-head);font-size:13px;color:var(--muted);letter-spacing:2px;text-transform:uppercase}
.logo-name{display:block;font-family:var(--ff-head);font-size:42px;font-weight:900;color:var(--red);line-height:.9}
.hdr-ad{flex:1;max-width:728px;min-height:90px;background:#f9f9f9;border:1px solid #eee;display:flex;align-items:center;justify-content:center;font-size:11px;color:#bbb}
.hdr-nav{background:var(--navy);position:sticky;top:36px;z-index:90}
.hdr-nav ul{list-style:none;display:flex}
.hdr-nav a{display:block;color:rgba(255,255,255,.85);text-decoration:none;padding:10px 16px;font-size:13px;font-weight:600;letter-spacing:.5px;text-transform:uppercase;transition:background .2s}
.hdr-nav a:hover,.hdr-nav a.active{background:var(--red);color:#fff}

/* Layout */
.site-main{padding:24px 0 48px;min-height:60vh}
.art-layout{display:grid;grid-template-columns:1fr 300px;gap:32px;margin-top:24px}
@media(max-width:900px){.art-layout{grid-template-columns:1fr}}

/* Article header */
.art-hdr{border-bottom:2px solid var(--border);padding-bottom:20px;margin-bottom:4px}
.breadcrumb{font-size:13px;color:var(--muted);margin-bottom:12px}
.breadcrumb a{color:var(--red);text-decoration:none}
.art-title{font-family:var(--ff-head);font-size:clamp(26px,4vw,40px);font-weight:900;line-height:1.2;color:var(--navy);margin-bottom:16px}
.art-meta{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;margin-bottom:16px;padding:12px 0;border-top:1px solid var(--border);border-bottom:1px solid var(--border)}
.author{display:flex;align-items:center;gap:10px}
.author-img{width:44px;height:44px;border-radius:50%;object-fit:cover;background:var(--bg)}
.author-name{display:block;font-weight:600;font-size:14px;color:var(--navy)}
.author-title{display:block;font-size:12px;color:var(--muted)}
.art-date{font-size:13px;color:var(--muted)}

/* Ad units */
.ad{background:#f9f9f9;border:1px solid #eee;display:flex;align-items:center;justify-content:center;font-size:11px;color:#bbb;border-radius:var(--r)}
.ad-leader{width:100%;min-height:90px;margin:16px 0}
.ad-inline{width:100%;min-height:250px;margin:24px 0}
.ad-sidebar{width:100%;min-height:250px}
.ad-footer{width:100%;min-height:90px;text-align:center;padding:16px;background:rgba(0,0,0,.2)}

/* Article content */
.art-body{background:#fff;padding:24px;border-radius:var(--r);box-shadow:var(--shadow)}
.intro{font-size:18px;line-height:1.7;color:var(--navy);font-weight:500;border-left:4px solid var(--red);padding-left:16px;margin:16px 0 24px}
.art-section{margin:28px 0}
.art-section h2{font-family:var(--ff-head);font-size:22px;font-weight:700;color:var(--navy);margin-bottom:12px;padding-bottom:8px;border-bottom:2px solid var(--red)}
.art-section p{margin-bottom:14px;font-size:16px;line-height:1.75}
.art-list{padding-left:20px;margin:12px 0}
.art-list li{margin-bottom:8px;line-height:1.6}
.author-note{border-left:4px solid var(--accent);padding:16px 20px;background:#fff8f0;border-radius:0 var(--r) var(--r) 0;margin:24px 0;font-style:italic}
.author-note p{font-size:16px;line-height:1.7;margin-bottom:8px}
.author-note cite{font-size:13px;color:var(--muted);font-style:normal}

/* FAQ */
.faq-wrap{background:#f8f9ff;padding:24px;border-radius:var(--r);margin:28px 0}
.faq-wrap>h2{font-family:var(--ff-head);font-size:20px;margin-bottom:16px;color:var(--navy)}
.faq-item{margin-bottom:16px;padding-bottom:16px;border-bottom:1px solid var(--border)}
.faq-item:last-child{border-bottom:none;margin-bottom:0;padding-bottom:0}
.faq-q{font-size:16px;font-weight:600;color:var(--navy);margin-bottom:6px}
.faq-a{font-size:15px;line-height:1.65;color:var(--muted)}

/* Conclusion + tags */
.conclusion h2{font-family:var(--ff-head);font-size:22px;margin-bottom:12px;padding-bottom:8px;border-bottom:2px solid var(--navy)}
.conclusion p{margin-bottom:12px;font-size:16px;line-height:1.75}
.tags{display:flex;flex-wrap:wrap;gap:8px;margin-top:24px;padding-top:16px;border-top:1px solid var(--border)}
.tag-lbl{font-size:13px;color:var(--muted);font-weight:600;align-self:center}
.tag{background:var(--bg);border:1px solid var(--border);padding:4px 10px;border-radius:20px;font-size:12px;text-decoration:none;color:var(--navy);transition:background .2s}
.tag:hover{background:var(--red);color:#fff;border-color:var(--red)}

/* Sidebar */
.sidebar{display:flex;flex-direction:column;gap:24px}
.sidebar-box{background:#fff;border-radius:var(--r);padding:20px;box-shadow:var(--shadow);border-top:3px solid var(--red)}
.sidebar-box h3{font-family:var(--ff-head);font-size:16px;margin-bottom:12px;color:var(--navy);text-transform:uppercase;letter-spacing:.5px}
.sidebar-newsletter{background:var(--navy);color:#fff;border-radius:var(--r);padding:20px}
.sidebar-newsletter h3{font-size:16px;margin-bottom:12px}
.nl-form{display:flex;flex-direction:column;gap:8px}
.nl-form input{padding:10px 12px;border:none;border-radius:var(--r);font-size:14px;width:100%}
.nl-form button{background:var(--red);color:#fff;border:none;padding:10px;border-radius:var(--r);cursor:pointer;font-weight:600;font-size:14px}
.nl-form button:hover{background:#a93226}

/* Related articles */
.related-item{display:flex;gap:10px;margin-bottom:12px;padding-bottom:12px;border-bottom:1px solid var(--border)}
.related-item:last-child{border-bottom:none;margin-bottom:0;padding-bottom:0}
.related-img{width:70px;height:52px;object-fit:cover;border-radius:3px;flex-shrink:0}
.related-title{font-size:13px;font-weight:600;color:var(--navy);text-decoration:none;line-height:1.4;display:block}
.related-title:hover{color:var(--red)}

/* Homepage */
.hero-grid{display:grid;grid-template-columns:2fr 1fr;gap:24px;margin-bottom:32px}
@media(max-width:700px){.hero-grid{grid-template-columns:1fr}}
.card{background:#fff;border-radius:var(--r);overflow:hidden;box-shadow:var(--shadow);transition:transform .2s,box-shadow .2s}
.card:hover{transform:translateY(-2px);box-shadow:0 4px 16px rgba(0,0,0,.15)}
.card-img{width:100%;aspect-ratio:16/9;overflow:hidden;background:var(--bg)}
.card-img img{width:100%;height:100%;object-fit:cover}
.card-body{padding:16px}
.card-cat{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:var(--red);margin-bottom:6px}
.card-title{font-family:var(--ff-head);font-size:18px;font-weight:700;line-height:1.3;margin-bottom:8px}
.card-title a{color:var(--navy);text-decoration:none}
.card-title a:hover{color:var(--red)}
.card-excerpt{font-size:14px;color:var(--muted);line-height:1.6;margin-bottom:10px}
.card-meta{font-size:12px;color:var(--muted);display:flex;gap:12px}
.art-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:20px;margin:24px 0}
.section-title{font-family:var(--ff-head);font-size:22px;color:var(--navy);margin-bottom:20px;padding-bottom:8px;border-bottom:3px solid var(--red)}

/* Compact card sidebar */
.compact-card{display:flex;gap:12px;padding:12px;background:#fff;border-radius:var(--r);margin-bottom:12px;box-shadow:0 1px 4px rgba(0,0,0,.08)}
.compact-img{width:80px;height:60px;object-fit:cover;border-radius:3px;flex-shrink:0}

/* Footer */
.site-footer{background:var(--navy);color:rgba(255,255,255,.8);padding:40px 0 20px;margin-top:48px}
.footer-grid{display:grid;grid-template-columns:2fr 1fr 1fr;gap:32px;margin-bottom:32px}
@media(max-width:600px){.footer-grid{grid-template-columns:1fr}}
.footer-about h3{color:#fff;font-family:var(--ff-head);font-size:20px;margin-bottom:10px}
.footer-about p{font-size:14px;line-height:1.7}
.footer-col h4{color:#fff;font-size:13px;text-transform:uppercase;letter-spacing:1px;margin-bottom:12px}
.footer-col ul{list-style:none}
.footer-col li{margin-bottom:6px}
.footer-col a{color:rgba(255,255,255,.7);text-decoration:none;font-size:14px}
.footer-col a:hover{color:#fff}
.footer-bottom{border-top:1px solid rgba(255,255,255,.1);padding-top:16px;text-align:center;font-size:13px;color:rgba(255,255,255,.5)}
.footer-disclaimer{margin-top:6px;font-size:12px}

@media(max-width:600px){
  .logo-name{font-size:28px}
  .hdr-ad{display:none}
  .art-body{padding:16px}
}
${COOKIE_BANNER_CSS}${NATIVE_ADS_CSS}`;

export function renderBase({ title, description, slug, siteName, siteUrl, schemas = [], body, adsenseId = '' }) {
  const canonical = slug ? `${siteUrl}/${slug}/` : `${siteUrl}/`;
  const schemasHtml = schemas.map(s =>
    `<script type="application/ld+json">${JSON.stringify(s)}</script>`
  ).join('\n');

  return `<!DOCTYPE html>
<html lang="en" data-adsense="${adsenseId}">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<meta name="robots" content="index,follow,max-image-preview:large"/>
<title>${esc(title)} | ${esc(siteName)}</title>
<meta name="description" content="${esc(description)}"/>
<link rel="canonical" href="${canonical}"/>
<meta property="og:title" content="${esc(title)}"/>
<meta property="og:description" content="${esc(description)}"/>
<meta property="og:url" content="${canonical}"/>
<meta property="og:site_name" content="${esc(siteName)}"/>
<meta property="og:type" content="${slug ? 'article' : 'website'}"/>
<meta name="twitter:card" content="summary_large_image"/>
<meta name="twitter:title" content="${esc(title)}"/>
<meta name="twitter:description" content="${esc(description)}"/>
${schemasHtml}
<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Merriweather:wght@700;900&family=Open+Sans:wght@400;500;600&display=swap"/>
<link rel="stylesheet" href="/assets/style.css"/>
</head>
<body>
${body}
${COOKIE_BANNER_HTML}
<script>
${COOKIE_BANNER_JS}
${EMAIL_FORM_JS}
${NATIVE_ADS_JS}
// Load nav categories
fetch('/api/categories.json').then(r=>r.json()).then(cats=>{
  const nav=document.getElementById('main-nav');
  if(!nav)return;
  cats.slice(0,6).forEach(c=>{
    const li=document.createElement('li');
    li.innerHTML='<a href="/category/'+c.slug+'">'+c.name+'</a>';
    nav.appendChild(li);
  });
}).catch(()=>{});
// Trending ticker
fetch('/api/trending.json').then(r=>r.json()).then(arts=>{
  const el=document.getElementById('ticker-inner');
  if(!el||!arts.length)return;
  el.innerHTML=arts.slice(0,8).map(a=>'<a href="/'+a.slug+'/">'+a.title+'</a>').join('<span style="opacity:.5;margin:0 6px">•</span>');
}).catch(()=>{});
</script>
</body>
</html>`;
}

export function renderArticlePage(article, site, relatedArticles = []) {
  const { title, metaDescription, content, slug, schemas = [] } = article;
  const date = new Date(article.date || Date.now());
  const dateStr = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const dateIso = date.toISOString();

  const relatedHtml = relatedArticles.slice(0, 5).map(r => `
    <div class="related-item">
      <img class="related-img" src="/images/${r.slug}.webp" alt="${esc(r.title)}" loading="lazy" onerror="this.src='/images/placeholder.webp'"/>
      <a class="related-title" href="/${r.slug}/">${esc(r.title)}</a>
    </div>`).join('');

  const body = `
${header(site)}
<main class="site-main">
  <div class="wrap">
    <header class="art-hdr">
      <div class="breadcrumb"><a href="/">Home</a> › <span>${esc(title)}</span></div>
      <h1 class="art-title">${esc(title)}</h1>
      <div class="art-meta">
        <div class="author">
          <img class="author-img" src="/images/author-${site.authorAvatar}.webp" alt="${esc(site.authorName)}" loading="lazy" onerror="this.style.display='none'"/>
          <div>
            <span class="author-name">${esc(site.authorName)}</span>
            <span class="author-title">${esc(site.authorTitle)}</span>
          </div>
        </div>
        <time class="art-date" datetime="${dateIso}">${dateStr}</time>
      </div>
      <div class="ad ad-leader">
        <ins class="adsbygoogle" style="display:block" data-ad-format="leaderboard"></ins>
      </div>
    </header>

    <div class="art-layout">
      <div class="art-body">
        ${content}
      </div>
      <aside class="sidebar">
        <div class="ad ad-sidebar">
          <ins class="adsbygoogle" style="display:block" data-ad-format="rectangle"></ins>
        </div>
        ${relatedHtml ? `<div class="sidebar-box"><h3>Related Articles</h3>${relatedHtml}</div>` : ''}
        <div class="ad ad-sidebar">
          <ins class="adsbygoogle" style="display:block" data-ad-format="rectangle"></ins>
        </div>
        <div class="sidebar-newsletter">
          <h3>Get Expert Tips Weekly</h3>
          <form class="nl-form" onsubmit="return false">
            <input type="email" placeholder="your@email.com"/>
            <button type="submit">Subscribe Free</button>
          </form>
        </div>
        <div class="ad ad-sidebar">
          <ins class="adsbygoogle" style="display:block" data-ad-format="rectangle"></ins>
        </div>
      </aside>
    </div>
  </div>
</main>
${footer(site)}`;

  return renderBase({ title, description: metaDescription, slug, siteName: site.name, siteUrl: site.url, schemas, body, adsenseId: site.adsenseId });
}

export function renderHomePage(articles, site) {
  const hero = articles[0];
  const featured = articles.slice(1, 5);
  const latest = articles.slice(5, 25);

  const heroHtml = hero ? `
    <section class="hero-grid">
      <article class="card">
        <div class="card-img"><img src="/images/${hero.slug}.webp" alt="${esc(hero.title)}" loading="eager" onerror="this.src='/images/placeholder.webp'"/></div>
        <div class="card-body">
          <div class="card-cat">${esc(hero.category || 'Featured')}</div>
          <h2 class="card-title" style="font-size:28px"><a href="/${hero.slug}/">${esc(hero.title)}</a></h2>
          <p class="card-excerpt">${esc(hero.excerpt)}</p>
          <div class="card-meta"><span>${esc(hero.author)}</span></div>
        </div>
      </article>
      <div>${featured.map(a => `
        <div class="compact-card">
          <img class="compact-img" src="/images/${a.slug}.webp" alt="${esc(a.title)}" loading="lazy" onerror="this.src='/images/placeholder.webp'"/>
          <div>
            <div class="card-cat" style="font-size:10px">${esc(a.category || 'Guide')}</div>
            <a href="/${a.slug}/" style="font-family:'Merriweather',serif;font-size:14px;font-weight:700;color:#1a1a2e;text-decoration:none;line-height:1.3;display:block">${esc(a.title)}</a>
          </div>
        </div>`).join('')}
      </div>
    </section>` : '';

  const gridHtml = latest.length ? `
    <section>
      <h2 class="section-title">Latest Articles</h2>
      <div class="art-grid">
        ${latest.map(a => `
          <article class="card">
            <div class="card-img"><img src="/images/${a.slug}.webp" alt="${esc(a.title)}" loading="lazy" onerror="this.src='/images/placeholder.webp'"/></div>
            <div class="card-body">
              <div class="card-cat">${esc(a.category || 'Guide')}</div>
              <h3 class="card-title"><a href="/${a.slug}/">${esc(a.title)}</a></h3>
              <p class="card-excerpt">${esc(a.excerpt)}</p>
              <div class="card-meta"><span>${esc(a.author)}</span></div>
            </div>
          </article>`).join('')}
      </div>
    </section>` : '<p style="text-align:center;padding:48px;color:#999">Articles coming soon...</p>';

  const body = `
${header(site)}
<main class="site-main">
  <div class="wrap">
    <div class="ad ad-leader"><ins class="adsbygoogle" style="display:block" data-ad-format="leaderboard"></ins></div>
    ${heroHtml}
    <div class="ad ad-leader"><ins class="adsbygoogle" style="display:block" data-ad-format="leaderboard"></ins></div>
    ${gridHtml}
  </div>
</main>
${footer(site)}`;

  return renderBase({
    title: `${site.name} — Expert Guides & How-To Articles`,
    description: `${site.name}: trusted source for expert guides, practical advice, and in-depth how-to articles.`,
    siteName: site.name, siteUrl: site.url, body, adsenseId: site.adsenseId
  });
}

export function render404Page(site) {
  const body = `
${header(site)}
<main class="site-main">
  <div class="wrap" style="text-align:center;padding:80px 20px">
    <h1 style="font-family:'Merriweather',serif;font-size:48px;color:#c0392b;margin-bottom:16px">404</h1>
    <p style="font-size:20px;margin-bottom:24px">Page not found</p>
    <a href="/" style="background:#c0392b;color:#fff;padding:12px 24px;border-radius:4px;text-decoration:none;font-weight:600">← Back to Home</a>
  </div>
</main>
${footer(site)}`;
  return renderBase({ title: 'Page Not Found', description: 'Page not found', siteName: site.name, siteUrl: site.url, body });
}

// ── Shared partials ──────────────────────────────────────────
function header(site) {
  return `
<div class="ticker">
  <span class="ticker-lbl">TRENDING</span>
  <div class="ticker-track"><div class="ticker-inner" id="ticker-inner">Loading...</div></div>
</div>
<header>
  <div class="hdr-top">
    <div class="wrap">
      <span>${new Date().toLocaleDateString('en-US',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}</span>
      <nav><a href="/about/">About</a><a href="/contact/">Contact</a><a href="/privacy/">Privacy</a></nav>
    </div>
  </div>
  <div class="hdr-main">
    <div class="wrap">
      <a href="/" class="logo">
        <span class="logo-the">The</span>
        <span class="logo-name">${esc(site.name.replace('The ',''))}</span>
      </a>
      <div class="hdr-ad ad">728×90 Advertisement</div>
    </div>
  </div>
  <nav class="hdr-nav">
    <div class="wrap">
      <ul id="main-nav" style="list-style:none;display:flex">
        <li><a href="/">Home</a></li>
      </ul>
    </div>
  </nav>
</header>`;
}

function footer(site) {
  return `
<footer class="site-footer">
  <div class="ad-footer"><ins class="adsbygoogle" style="display:block" data-ad-format="leaderboard"></ins></div>
  <div class="wrap">
    <div class="footer-grid">
      <div class="footer-about">
        <h3>${esc(site.name)}</h3>
        <p>Your trusted source for expert guides, how-to articles, and actionable information.</p>
      </div>
      <div class="footer-col">
        <h4>Company</h4>
        <ul>
          <li><a href="/about/">About Us</a></li>
          <li><a href="/contact/">Contact</a></li>
          <li><a href="/advertise/">Advertise</a></li>
        </ul>
      </div>
      <div class="footer-col">
        <h4>Legal</h4>
        <ul>
          <li><a href="/privacy/">Privacy Policy</a></li>
          <li><a href="/terms/">Terms of Service</a></li>
          <li><a href="/disclaimer/">Disclaimer</a></li>
        </ul>
      </div>
    </div>
    <div class="footer-bottom">
      <p>© ${new Date().getFullYear()} ${esc(site.name)}. All rights reserved.</p>
      <p class="footer-disclaimer">Content is for informational purposes only. Always consult a professional for specific advice.</p>
    </div>
  </div>
</footer>`;
}

function esc(str = '') {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
