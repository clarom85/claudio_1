/**
 * VORTEX — Adventure/travel magazine style
 * Arancione/teal/quasi-nero, full-width hero images, bold adventurous
 */
import { COOKIE_BANNER_CSS, COOKIE_BANNER_HTML, COOKIE_BANNER_JS, EMAIL_FORM_JS, NATIVE_ADS_CSS, NATIVE_ADS_JS } from '../../shared/snippets.js';
function esc(str=''){return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}

export const CSS=`
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --orange:#f97316;--teal:#0d9488;--dark:#111827;--near-black:#0a0f1a;
  --light:#f8fafc;--white:#fff;--border:#1f2937;--muted:#6b7280;
  --ff-head:'Bebas Neue','Impact',Arial Black,sans-serif;
  --ff-body:'Nunito','Segoe UI',system-ui,sans-serif;--max:1200px
}
html{font-size:16px;scroll-behavior:smooth}
body{font-family:var(--ff-body);background:var(--dark);color:var(--light);line-height:1.65}
.wrap{max-width:var(--max);margin:0 auto;padding:0 16px}

/* Header */
.hdr-main{background:rgba(10,15,26,.95);border-bottom:1px solid var(--border);padding:12px 0;position:sticky;top:0;z-index:100;backdrop-filter:blur(10px)}
.hdr-main .wrap{display:flex;align-items:center;justify-content:space-between;gap:20px}
.logo{text-decoration:none;display:flex;align-items:center;gap:8px}
.logo-v{font-family:var(--ff-head);font-size:36px;line-height:1;color:var(--orange);letter-spacing:2px}
.logo-text{font-family:var(--ff-head);font-size:28px;letter-spacing:3px;color:var(--white);line-height:1}
.hdr-ad{flex:1;max-width:680px;min-height:80px;background:rgba(255,255,255,.05);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;font-size:11px;color:var(--muted)}
.hdr-nav ul{list-style:none;display:flex;gap:4px;flex-wrap:wrap}
.hdr-nav a{color:rgba(255,255,255,.65);text-decoration:none;padding:6px 12px;font-size:13px;font-weight:700;letter-spacing:.5px;text-transform:uppercase;border-radius:4px;transition:all .2s}
.hdr-nav a:hover{background:var(--orange);color:#fff}

/* Layout */
.site-main{padding:32px 0 64px}
.art-layout{display:grid;grid-template-columns:1fr 300px;gap:32px;margin-top:28px}
@media(max-width:900px){.art-layout{grid-template-columns:1fr}}

/* Article hero */
.art-hero{position:relative;height:400px;overflow:hidden;margin-bottom:0}
.art-hero img{width:100%;height:100%;object-fit:cover}
.art-hero-overlay{position:absolute;inset:0;background:linear-gradient(to top,rgba(10,15,26,.95) 0%,rgba(10,15,26,.4) 50%,transparent 100%)}
.art-hero-content{position:absolute;bottom:0;left:0;right:0;padding:32px}
.art-kicker{font-family:var(--ff-head);font-size:12px;letter-spacing:3px;color:var(--orange);margin-bottom:10px;display:block}
.art-title{font-family:var(--ff-head);font-size:clamp(32px,5vw,54px);letter-spacing:2px;line-height:1.05;color:var(--white);text-shadow:0 2px 8px rgba(0,0,0,.5)}

/* Article header (no hero) */
.art-hdr{padding:24px 0;border-bottom:1px solid var(--border);margin-bottom:24px}
.art-title-plain{font-family:var(--ff-head);font-size:clamp(28px,4vw,46px);letter-spacing:2px;line-height:1.1;color:var(--white);margin-bottom:12px}
.art-meta{display:flex;align-items:center;gap:16px;flex-wrap:wrap;padding:14px 0;margin-top:12px}
.author-badge{display:flex;align-items:center;gap:8px;background:rgba(255,255,255,.05);padding:8px 14px;border-radius:24px;border:1px solid var(--border)}
.author-name{font-weight:700;font-size:13px;color:var(--orange)}
.author-title{font-size:11px;color:var(--muted)}
.art-date{font-size:12px;color:var(--muted)}

/* Ad */
.ad{background:rgba(255,255,255,.04);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;font-size:11px;color:var(--muted)}
.ad-leader{width:100%;min-height:90px;margin:16px 0}
.ad-inline{width:100%;min-height:250px;margin:28px 0}
.ad-sidebar{width:100%;min-height:250px;margin-bottom:20px}

/* Content */
.art-body{background:rgba(255,255,255,.03);padding:28px;border:1px solid var(--border);border-radius:8px}
.intro{font-size:18px;line-height:1.8;color:#e0e8f0;font-weight:600;border-left:4px solid var(--orange);padding-left:16px;margin-bottom:24px}
.art-section{margin:28px 0}
.art-section h2{font-family:var(--ff-head);font-size:26px;letter-spacing:2px;color:var(--orange);margin-bottom:14px;padding-bottom:8px;border-bottom:1px solid var(--border)}
.art-section p{margin-bottom:14px;font-size:16px;line-height:1.8;color:#c8d8e8}
.art-list{padding-left:20px;margin:12px 0}
.art-list li{margin-bottom:10px;line-height:1.7;font-size:15px;color:#c8d8e8}
.art-list li::marker{color:var(--orange)}
.highlight-box{background:rgba(249,115,22,.08);border:1px solid rgba(249,115,22,.3);border-radius:8px;padding:20px;margin:24px 0}
.highlight-box p{font-size:16px;line-height:1.75;color:var(--light)}
.faq-wrap{background:rgba(13,148,136,.06);border:1px solid rgba(13,148,136,.3);padding:24px;border-radius:8px;margin:28px 0}
.faq-wrap>h2{font-family:var(--ff-head);font-size:22px;letter-spacing:2px;margin-bottom:16px;color:var(--teal)}
.faq-item{margin-bottom:16px;padding-bottom:16px;border-bottom:1px solid rgba(255,255,255,.06)}
.faq-item:last-child{border-bottom:none;margin:0;padding:0}
.faq-q{font-weight:700;font-size:15px;margin-bottom:6px;color:var(--white)}
.faq-a{font-size:14px;line-height:1.7;color:var(--muted)}
.conclusion h2{font-family:var(--ff-head);font-size:22px;letter-spacing:2px;margin-bottom:12px;color:var(--teal)}
.conclusion p{font-size:16px;line-height:1.8;margin-bottom:12px;color:#c8d8e8}
.tags{display:flex;flex-wrap:wrap;gap:8px;margin-top:24px;padding-top:16px;border-top:1px solid var(--border)}
.tag{background:rgba(255,255,255,.05);border:1px solid var(--border);padding:5px 14px;border-radius:20px;font-size:12px;text-decoration:none;color:var(--muted);font-weight:600;letter-spacing:.5px;text-transform:uppercase}
.tag:hover{background:var(--orange);color:#fff;border-color:var(--orange)}

/* Sidebar */
.sidebar-box{background:rgba(255,255,255,.04);border:1px solid var(--border);border-radius:8px;padding:20px;margin-bottom:20px;border-top:3px solid var(--orange)}
.sidebar-box h3{font-family:var(--ff-head);font-size:18px;letter-spacing:2px;margin-bottom:14px;color:var(--orange)}
.related-item{display:flex;gap:10px;margin-bottom:12px;padding-bottom:12px;border-bottom:1px solid var(--border)}
.related-item:last-child{border-bottom:none}
.related-img{width:68px;height:52px;object-fit:cover;border-radius:4px;flex-shrink:0}
.related-title{font-size:13px;font-weight:700;color:var(--light);text-decoration:none;line-height:1.4;display:block}
.related-title:hover{color:var(--orange)}
.nl-box{background:linear-gradient(135deg,rgba(249,115,22,.15),rgba(13,148,136,.15));border:1px solid var(--border);border-radius:8px;padding:20px;margin-bottom:20px}
.nl-box h3{font-family:var(--ff-head);font-size:20px;letter-spacing:2px;margin-bottom:6px;color:var(--orange)}
.nl-box p{font-size:13px;color:var(--muted);margin-bottom:14px}
.nl-box input{width:100%;padding:10px 14px;background:rgba(255,255,255,.07);border:1px solid var(--border);color:var(--light);font-size:14px;border-radius:6px;margin-bottom:8px}
.nl-box button{width:100%;background:var(--orange);color:#fff;border:none;padding:10px;border-radius:6px;cursor:pointer;font-weight:700;font-size:14px;letter-spacing:1px;text-transform:uppercase}
.nl-box button:hover{background:#ea6c10}

/* Home */
.home-hero-wrap{position:relative;height:500px;overflow:hidden;margin-bottom:32px}
.home-hero-img{width:100%;height:100%;object-fit:cover}
.home-hero-overlay{position:absolute;inset:0;background:linear-gradient(to top,rgba(10,15,26,1) 0%,rgba(10,15,26,.5) 50%,transparent 100%)}
.home-hero-content{position:absolute;bottom:0;padding:40px;left:0;right:0}
.card{background:rgba(255,255,255,.04);border:1px solid var(--border);border-radius:8px;overflow:hidden;transition:border-color .2s}
.card:hover{border-color:var(--orange)}
.card-img img{width:100%;aspect-ratio:16/9;object-fit:cover}
.card-body{padding:16px}
.card-cat{font-family:var(--ff-head);font-size:11px;letter-spacing:2px;text-transform:uppercase;color:var(--orange);margin-bottom:6px}
.card-title{font-family:var(--ff-head);font-size:20px;letter-spacing:1px;line-height:1.2;margin-bottom:8px}
.card-title a{color:var(--white);text-decoration:none}
.card-title a:hover{color:var(--orange)}
.card-excerpt{font-size:13px;color:var(--muted);line-height:1.6}
.art-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(270px,1fr));gap:16px;margin:20px 0}
.section-title{font-family:var(--ff-head);font-size:28px;letter-spacing:3px;color:var(--white);margin-bottom:20px;padding-bottom:8px;border-bottom:1px solid var(--border)}
.section-title span{color:var(--orange)}

/* Footer */
.site-footer{background:var(--near-black);border-top:1px solid var(--border);padding:40px 0 20px;margin-top:56px}
.footer-grid{display:grid;grid-template-columns:2fr 1fr 1fr;gap:32px;margin-bottom:28px}
@media(max-width:600px){.footer-grid{grid-template-columns:1fr}}
.footer-logo{font-family:var(--ff-head);font-size:28px;letter-spacing:3px;color:var(--orange);margin-bottom:8px}
.footer-col h4{font-family:var(--ff-head);font-size:14px;letter-spacing:2px;color:var(--orange);margin-bottom:12px}
.footer-col ul{list-style:none}
.footer-col li{margin-bottom:7px}
.footer-col a{color:var(--muted);text-decoration:none;font-size:13px}
.footer-col a:hover{color:var(--orange)}
.footer-bottom{border-top:1px solid var(--border);padding-top:16px;text-align:center;font-size:12px;color:var(--muted)}
${COOKIE_BANNER_CSS}${NATIVE_ADS_CSS}`;

function renderBase({title,description,slug,siteName,siteUrl,schemas=[],body,adsenseId=''}){
  const canonical=slug?`${siteUrl}/${slug}/`:`${siteUrl}/`;
  const schemasHtml=schemas.map(s=>`<script type="application/ld+json">${JSON.stringify(s)}</script>`).join('\n');
  return`<!DOCTYPE html><html lang="en" data-adsense="${adsenseId}"><head>
<meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<meta name="robots" content="index,follow,max-image-preview:large"/>
<title>${esc(title)} | ${esc(siteName)}</title>
<meta name="description" content="${esc(description)}"/>
<link rel="canonical" href="${canonical}"/>
<meta property="og:title" content="${esc(title)}"/>
<meta property="og:description" content="${esc(description)}"/>
<meta property="og:url" content="${canonical}"/>
<meta property="og:type" content="${slug?'article':'website'}"/>
${schemasHtml}
<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Nunito:wght@400;600;700&display=swap"/>
<link rel="stylesheet" href="/assets/style.css"/>
</head><body>${body}
${COOKIE_BANNER_HTML}
<script>${COOKIE_BANNER_JS}${EMAIL_FORM_JS}${NATIVE_ADS_JS}
fetch('/api/categories.json').then(r=>r.json()).then(cats=>{const nav=document.getElementById('main-nav');cats.slice(0,6).forEach(c=>{const li=document.createElement('li');li.innerHTML='<a href="/category/'+c.slug+'">'+c.name+'</a>';nav.appendChild(li)})}).catch(()=>{});
</script></body></html>`}

function header(site){return`
<header>
  <div class="hdr-main"><div class="wrap">
    <a href="/" class="logo"><span class="logo-v">V</span><span class="logo-text">${esc(site.name.toUpperCase())}</span></a>
    <div class="hdr-ad ad">Advertisement</div>
    <nav class="hdr-nav"><ul id="main-nav"><li><a href="/">Home</a></li>${(site.categories||[]).map(c=>`<li><a href="/category/${c.slug}/">${esc(c.name)}</a></li>`).join('')}</ul></nav>
  </div></div>
</header>`}

function footer(site){return`
<footer class="site-footer"><div class="wrap">
  <div class="footer-grid">
    <div><div class="footer-logo">${esc(site.name)}</div><p style="font-size:13px;color:#6b7280;line-height:1.7">Discover the world through expert guides and insider knowledge.</p></div>
    <div class="footer-col"><h4>Explore</h4><ul><li><a href="/about/">About</a></li><li><a href="/contact/">Contact</a></li><li><a href="/advertise/">Advertise</a></li></ul></div>
    <div class="footer-col"><h4>Legal</h4><ul><li><a href="/privacy/">Privacy</a></li><li><a href="/terms/">Terms</a></li><li><a href="/disclaimer/">Disclaimer</a></li></ul></div>
  </div>
  <div class="footer-bottom"><p>© ${new Date().getFullYear()} ${esc(site.name)} — Informational purposes only</p></div>
</div></footer>`}

export function renderArticlePage(article,site,relatedArticles=[]){
  const date=new Date(article.date||Date.now());
  const relatedHtml=relatedArticles.slice(0,4).map(r=>`<div class="related-item"><img class="related-img" src="/images/${r.slug}.webp" alt="${esc(r.title)}" loading="lazy" onerror="this.src='/images/placeholder.webp'"/><a class="related-title" href="/${r.slug}/">${esc(r.title)}</a></div>`).join('');
  const body=`${header(site)}<main class="site-main"><div class="wrap">
    <header class="art-hdr">
      <span class="art-kicker"><a href="/category/${article.categorySlug||'guides'}/" style="color:inherit;text-decoration:none">${esc(article.category||'GUIDE')}</a></span>
      <h1 class="art-title-plain">${esc(article.title)}</h1>
      <div class="art-meta">
        <div class="author-badge"><div><span class="author-name">${esc(site.authorName)}</span><br/><span class="author-title">${esc(site.authorTitle)}</span></div></div>
        <time class="art-date" datetime="${date.toISOString()}">${date.toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'})}</time>
      </div>
      <div class="ad ad-leader"><ins class="adsbygoogle" style="display:block" data-ad-format="leaderboard"></ins></div>
    </header>
    <div class="art-layout">
      <div class="art-body">${article.content}</div>
      <aside>
        <div class="ad ad-sidebar"><ins class="adsbygoogle" style="display:block" data-ad-format="rectangle"></ins></div>
        ${relatedHtml?`<div class="sidebar-box"><h3>Related</h3>${relatedHtml}</div>`:''}
        <div class="nl-box"><h3>Stay Informed</h3><p>Expert guides delivered weekly</p><form class="nl-form" onsubmit="return false"><input type="email" placeholder="your@email.com"/><button>Subscribe</button></form></div>
        <div class="ad ad-sidebar"><ins class="adsbygoogle" style="display:block" data-ad-format="rectangle"></ins></div>
      </aside>
    </div>
  </div></main>${footer(site)}`;
  return renderBase({title:article.title,description:article.metaDescription,slug:article.slug,siteName:site.name,siteUrl:site.url,schemas:article.schemas||[],body,adsenseId:site.adsenseId});
}

export function renderHomePage(articles,site){
  const hero=articles[0];const latest=articles.slice(1,21);
  const heroHtml=hero?`<div class="home-hero-wrap">
    <img class="home-hero-img" src="/images/${hero.slug}.webp" alt="${esc(hero.title)}" loading="eager" onerror="this.src='/images/placeholder.webp'"/>
    <div class="home-hero-overlay"></div>
    <div class="home-hero-content">
      <span class="art-kicker">${esc(hero.category||'FEATURED')}</span>
      <h2 style="font-family:'Bebas Neue',sans-serif;font-size:clamp(32px,5vw,56px);letter-spacing:2px;color:#fff;margin-bottom:12px;line-height:1.05"><a href="/${hero.slug}/" style="color:#fff;text-decoration:none">${esc(hero.title)}</a></h2>
      <p style="font-size:16px;color:rgba(255,255,255,.8);max-width:600px">${esc(hero.excerpt)}</p>
    </div>
  </div>`:'';
  const gridHtml=latest.length?`<section><h2 class="section-title"><span>Latest</span> Articles</h2><div class="art-grid">${latest.map(a=>`<article class="card"><div class="card-img"><img src="/images/${a.slug}.webp" alt="${esc(a.title)}" loading="lazy" onerror="this.src='/images/placeholder.webp'"/></div><div class="card-body"><div class="card-cat">${esc(a.category||'Guide')}</div><h3 class="card-title"><a href="/${a.slug}/">${esc(a.title)}</a></h3><p class="card-excerpt">${esc(a.excerpt)}</p></div></article>`).join('')}</div></section>`:'';
  const body=`${header(site)}<main class="site-main">${heroHtml}<div class="wrap"><div class="ad ad-leader"><ins class="adsbygoogle" style="display:block" data-ad-format="leaderboard"></ins></div>${gridHtml}</div></main>${footer(site)}`;
  return renderBase({title:`${site.name} — Discover & Explore`,description:`${site.name}: expert guides and insider knowledge.`,siteName:site.name,siteUrl:site.url,body,adsenseId:site.adsenseId});
}

export function renderCategoryPage(articles,category,site){
  const gridHtml=articles.map(a=>`<article class="card"><div class="card-img"><img src="/images/${a.slug}.webp" alt="${esc(a.title)}" loading="lazy" onerror="this.src='/images/placeholder.webp'"/></div><div class="card-body"><div class="card-cat">${esc(category.name)}</div><h2 class="card-title"><a href="/${a.slug}/">${esc(a.title)}</a></h2><p class="card-excerpt">${esc(a.excerpt||'')}</p></div></article>`).join('');
  const schema={'@context':'https://schema.org','@type':'BreadcrumbList',itemListElement:[{'@type':'ListItem',position:1,name:'Home',item:`${site.url}/`},{'@type':'ListItem',position:2,name:category.name,item:`${site.url}/category/${category.slug}/`}]};
  const body=`${header(site)}<main class="site-main"><div class="wrap"><div class="ad ad-leader"><ins class="adsbygoogle" style="display:block" data-ad-format="leaderboard"></ins></div><div style="margin:20px 0 4px;font-size:12px;text-transform:uppercase;letter-spacing:2px;color:var(--muted)"><a href="/" style="color:var(--orange)">Home</a> › <span>${esc(category.name)}</span></div><h1 class="section-title"><span>${esc(category.name)}</span></h1><p style="color:var(--muted);margin-bottom:28px;font-size:13px">${articles.length} article${articles.length!==1?'s':''}</p><div class="art-grid">${gridHtml}</div><div class="ad ad-leader" style="margin-top:32px"><ins class="adsbygoogle" style="display:block" data-ad-format="leaderboard"></ins></div></div></main>${footer(site)}`;
  return renderBase({title:`${category.name} — ${site.name}`,description:`Browse ${articles.length} expert articles about ${category.name} on ${site.name}.`,slug:`category/${category.slug}`,siteName:site.name,siteUrl:site.url,schemas:[schema],body,adsenseId:site.adsenseId});
}

export function render404Page(site){
  const body=`${header(site)}<main class="site-main"><div class="wrap" style="text-align:center;padding:80px 20px"><h1 style="font-family:'Bebas Neue',sans-serif;font-size:80px;letter-spacing:4px;color:#f97316">404</h1><p style="color:#6b7280;margin:16px 0 24px;font-size:18px">This page got lost on the trail</p><a href="/" style="background:#f97316;color:#fff;padding:14px 28px;text-decoration:none;font-weight:700;border-radius:6px;font-size:14px;letter-spacing:1px;text-transform:uppercase">← Back to Home</a></div></main>${footer(site)}`;
  return renderBase({title:'404 Not Found',description:'Page not found',siteName:site.name,siteUrl:site.url,body});
}
