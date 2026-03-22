/**
 * ECHO — Lifestyle magazine style
 * Beige/terracotta/sage, serif elegante, immagini grandi, font morbido
 */
import { COOKIE_BANNER_CSS, COOKIE_BANNER_HTML, COOKIE_BANNER_JS, EMAIL_FORM_JS, NATIVE_ADS_CSS, NATIVE_ADS_JS } from '../../shared/snippets.js';
function esc(str=''){return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}

export const CSS=`
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --cream:#faf6f1;--terra:#c4622d;--sage:#5a7a5a;--warm:#3d2b1f;
  --light:#f0e8de;--white:#fff;--border:#d8ccc0;--muted:#7a6a5a;
  --ff-head:'Cormorant Garamond','Garamond',Georgia,serif;
  --ff-body:'Lato',system-ui,sans-serif;--max:1100px
}
html{font-size:16px;scroll-behavior:smooth}
body{font-family:var(--ff-body);background:var(--cream);color:var(--warm);line-height:1.7}
.wrap{max-width:var(--max);margin:0 auto;padding:0 20px}

/* Header */
.hdr-top{background:var(--warm);color:rgba(255,255,255,.7);font-size:11px;letter-spacing:1.5px;text-transform:uppercase;text-align:center;padding:7px}
.hdr-main{background:var(--cream);border-bottom:1px solid var(--border);padding:20px 0}
.hdr-main .wrap{display:flex;align-items:center;justify-content:space-between;gap:20px}
.logo{text-decoration:none}
.logo-name{font-family:var(--ff-head);font-size:48px;font-weight:400;color:var(--warm);letter-spacing:4px;text-transform:uppercase;line-height:1}
.logo-sub{font-size:10px;letter-spacing:4px;text-transform:uppercase;color:var(--muted);display:block;text-align:center;margin-top:4px}
.hdr-ad{flex:1;max-width:650px;min-height:90px;background:var(--light);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;font-size:11px;color:var(--muted)}
.hdr-nav{border-top:1px solid var(--border);border-bottom:2px solid var(--terra)}
.hdr-nav ul{list-style:none;display:flex;justify-content:center;gap:0;flex-wrap:wrap;max-width:var(--max);margin:0 auto;padding:0 16px}
.hdr-nav a{display:block;color:var(--warm);text-decoration:none;padding:10px 18px;font-size:13px;letter-spacing:1.5px;text-transform:uppercase;font-weight:600;transition:color .2s}
.hdr-nav a:hover{color:var(--terra)}

/* Layout */
.site-main{padding:32px 0 64px}
.art-layout{display:grid;grid-template-columns:1fr 280px;gap:40px;margin-top:28px}
@media(max-width:860px){.art-layout{grid-template-columns:1fr}}

/* Article */
.art-hdr{text-align:center;margin-bottom:28px;padding-bottom:24px;border-bottom:1px solid var(--border)}
.art-category{font-size:11px;letter-spacing:3px;text-transform:uppercase;color:var(--terra);margin-bottom:12px;display:block}
.art-title{font-family:var(--ff-head);font-size:clamp(30px,5vw,52px);font-weight:400;line-height:1.15;color:var(--warm);margin-bottom:16px}
.art-deck{font-size:18px;font-style:italic;color:var(--muted);margin-bottom:20px;max-width:680px;margin-left:auto;margin-right:auto}
.art-byline{font-size:12px;letter-spacing:1.5px;text-transform:uppercase;color:var(--muted)}

/* Ad */
.ad{background:var(--light);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;font-size:11px;color:var(--muted)}
.ad-leader{width:100%;min-height:90px;margin:16px 0}
.ad-inline{width:100%;min-height:250px;margin:28px 0}
.ad-sidebar{width:100%;min-height:250px;margin-bottom:24px}

/* Content */
.art-body{background:var(--white);padding:36px;border:1px solid var(--border)}
.intro{font-size:19px;line-height:1.85;font-style:italic;color:var(--warm);margin-bottom:28px;padding-bottom:20px;border-bottom:1px solid var(--border)}
.intro::first-letter{font-family:var(--ff-head);font-size:72px;line-height:.75;float:left;margin:6px 10px 0 0;color:var(--terra)}
.art-section{margin:28px 0}
.art-section h2{font-family:var(--ff-head);font-size:26px;font-weight:400;color:var(--warm);margin-bottom:14px;letter-spacing:1px}
.art-section p{margin-bottom:16px;font-size:16px;line-height:1.85}
.art-list{padding-left:20px;margin:12px 0}
.art-list li{margin-bottom:10px;line-height:1.8;font-size:16px}
.art-list li::marker{color:var(--terra)}
.pull-quote{border:none;border-top:2px solid var(--terra);border-bottom:2px solid var(--terra);padding:20px 0;margin:32px 0;text-align:center;font-family:var(--ff-head);font-size:24px;font-style:italic;color:var(--warm);line-height:1.5}
.faq-wrap{background:var(--cream);border:1px solid var(--border);padding:28px;margin:28px 0}
.faq-wrap>h2{font-family:var(--ff-head);font-size:24px;font-weight:400;margin-bottom:20px;padding-bottom:10px;border-bottom:1px solid var(--border)}
.faq-item{margin-bottom:16px;padding-bottom:16px;border-bottom:1px solid var(--border)}
.faq-item:last-child{border-bottom:none;margin:0;padding:0}
.faq-q{font-weight:700;font-size:15px;margin-bottom:8px;color:var(--warm)}
.faq-a{font-size:15px;line-height:1.75;color:var(--muted)}
.conclusion h2{font-family:var(--ff-head);font-size:24px;font-weight:400;margin-bottom:14px}
.conclusion p{font-size:16px;line-height:1.85;margin-bottom:14px}
.tags{display:flex;flex-wrap:wrap;gap:8px;margin-top:24px;padding-top:20px;border-top:1px solid var(--border)}
.tag{background:var(--cream);border:1px solid var(--border);padding:5px 14px;font-size:12px;text-decoration:none;color:var(--muted);letter-spacing:.5px}
.tag:hover{background:var(--terra);color:#fff;border-color:var(--terra)}

/* Sidebar */
.sidebar-box{background:var(--white);border:1px solid var(--border);padding:24px;margin-bottom:24px;border-top:3px solid var(--terra)}
.sidebar-box h3{font-family:var(--ff-head);font-size:18px;font-weight:400;margin-bottom:14px;padding-bottom:10px;border-bottom:1px solid var(--border);letter-spacing:1px}
.related-item{display:flex;gap:12px;margin-bottom:14px;padding-bottom:14px;border-bottom:1px solid var(--border)}
.related-item:last-child{border-bottom:none}
.related-img{width:72px;height:54px;object-fit:cover;flex-shrink:0}
.related-title{font-size:13px;font-family:var(--ff-head);font-weight:400;color:var(--warm);text-decoration:none;line-height:1.4;display:block;font-size:15px}
.related-title:hover{color:var(--terra)}
.nl-box{background:var(--warm);color:rgba(255,255,255,.9);padding:24px;margin-bottom:24px}
.nl-box h3{font-family:var(--ff-head);font-size:20px;font-weight:400;margin-bottom:6px}
.nl-box p{font-size:13px;color:rgba(255,255,255,.6);margin-bottom:14px}
.nl-box input{width:100%;padding:10px 14px;background:transparent;border:1px solid rgba(255,255,255,.3);color:#fff;font-size:14px;margin-bottom:8px}
.nl-box input::placeholder{color:rgba(255,255,255,.4)}
.nl-box button{width:100%;background:var(--terra);color:#fff;border:none;padding:11px;cursor:pointer;font-size:13px;letter-spacing:1.5px;text-transform:uppercase;font-weight:600}

/* Home */
.home-hero{display:grid;grid-template-columns:3fr 2fr;gap:32px;margin-bottom:36px;padding-bottom:32px;border-bottom:1px solid var(--border)}
@media(max-width:700px){.home-hero{grid-template-columns:1fr}}
.card{background:var(--white);border:1px solid var(--border)}
.card-img img{width:100%;aspect-ratio:3/2;object-fit:cover}
.card-body{padding:18px}
.card-cat{font-size:10px;letter-spacing:2.5px;text-transform:uppercase;color:var(--terra);margin-bottom:8px}
.card-title{font-family:var(--ff-head);font-size:20px;font-weight:400;line-height:1.3;margin-bottom:8px}
.card-title a{color:var(--warm);text-decoration:none}
.card-title a:hover{color:var(--terra)}
.card-excerpt{font-size:14px;color:var(--muted);line-height:1.65;margin-bottom:10px}
.art-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:24px;margin:20px 0}
.section-title{font-family:var(--ff-head);font-size:28px;font-weight:400;color:var(--warm);margin-bottom:24px;padding-bottom:10px;border-bottom:1px solid var(--border);letter-spacing:2px;text-transform:uppercase}

/* Footer */
.site-footer{background:var(--warm);color:rgba(255,255,255,.75);padding:40px 0 20px;margin-top:56px}
.footer-grid{display:grid;grid-template-columns:2fr 1fr 1fr;gap:32px;margin-bottom:28px}
@media(max-width:600px){.footer-grid{grid-template-columns:1fr}}
.footer-logo{font-family:var(--ff-head);font-size:28px;font-weight:400;color:#fff;letter-spacing:3px;text-transform:uppercase;margin-bottom:8px}
.footer-col h4{font-size:10px;letter-spacing:2px;text-transform:uppercase;color:rgba(255,255,255,.5);margin-bottom:12px}
.footer-col ul{list-style:none}
.footer-col li{margin-bottom:7px}
.footer-col a{color:rgba(255,255,255,.65);text-decoration:none;font-size:13px}
.footer-col a:hover{color:#fff}
.footer-bottom{border-top:1px solid rgba(255,255,255,.1);padding-top:16px;text-align:center;font-size:12px;color:rgba(255,255,255,.4);letter-spacing:.5px}
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
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&family=Lato:wght@400;700&display=swap"/>
<link rel="stylesheet" href="/assets/style.css"/>
</head><body>${body}
${COOKIE_BANNER_HTML}
<script>${COOKIE_BANNER_JS}${EMAIL_FORM_JS}${NATIVE_ADS_JS}
</script></body></html>`}

function header(site){return`
<div class="hdr-top">${new Date().toLocaleDateString('en-US',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}</div>
<header>
  <div class="hdr-main"><div class="wrap">
    <a href="/" class="logo"><span class="logo-name">${esc(site.name)}</span><span class="logo-sub">Living · Wellness · Inspiration</span></a>
    <div class="hdr-ad ad" style="min-height:90px"><ins class="adsbygoogle" style="display:block" data-ad-format="leaderboard"></ins></div>
  </div></div>
  <nav class="hdr-nav"><ul id="main-nav"><li><a href="/">Home</a></li>${(site.categories||[]).map(c=>`<li><a href="/category/${c.slug}/">${esc(c.name)}</a></li>`).join('')}</ul></nav>
</header>`}

function footer(site){return`
<footer class="site-footer"><div class="wrap">
  <div class="footer-grid">
    <div><div class="footer-logo">${esc(site.name)}</div><p style="font-size:13px;line-height:1.7">Inspiring guides for a better everyday life.</p></div>
    <div class="footer-col"><h4>Explore</h4><ul><li><a href="/about/">About</a></li><li><a href="/contact/">Contact</a></li><li><a href="/advertise/">Advertise</a></li></ul></div>
    <div class="footer-col"><h4>Legal</h4><ul><li><a href="/privacy/">Privacy</a></li><li><a href="/terms/">Terms</a></li><li><a href="/disclaimer/">Disclaimer</a></li></ul></div>
  </div>
  <div class="footer-bottom"><p>© ${new Date().getFullYear()} ${esc(site.name)} — For informational purposes only</p></div>
</div></footer>`}

export function renderArticlePage(article,site,relatedArticles=[]){
  const date=new Date(article.date||Date.now());
  const relatedHtml=relatedArticles.slice(0,4).map(r=>`<div class="related-item"><img class="related-img" src="/images/${r.slug}.webp" alt="${esc(r.title)}" loading="lazy" onerror="this.src='/images/placeholder.webp'"/><a class="related-title" href="/${r.slug}/">${esc(r.title)}</a></div>`).join('');
  const body=`${header(site)}<main class="site-main"><div class="wrap">
    <header class="art-hdr">
      <span class="art-category"><a href="/category/${article.categorySlug||'guides'}/" style="color:inherit;text-decoration:none">${esc(article.category||'Lifestyle')}</a></span>
      <h1 class="art-title">${esc(article.title)}</h1>
      <p class="art-deck">${esc(article.metaDescription)}</p>
      <div class="art-byline">By <strong>${esc(site.authorName)}</strong> · ${esc(site.authorTitle)} · <time datetime="${date.toISOString()}">${date.toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'})}</time></div>
      <div class="ad ad-leader"><ins class="adsbygoogle" style="display:block" data-ad-format="leaderboard"></ins></div>
    </header>
    <div class="art-layout">
      <div class="art-body">${article.content}</div>
      <aside>
        <div class="ad ad-sidebar"><ins class="adsbygoogle" style="display:block" data-ad-format="rectangle"></ins></div>
        ${relatedHtml?`<div class="sidebar-box"><h3>You May Also Like</h3>${relatedHtml}</div>`:''}
        <div class="nl-box"><h3>Weekly Inspiration</h3><p>Expert tips delivered to your inbox</p><form class="nl-form" onsubmit="return false"><input type="email" placeholder="your@email.com"/><button>Subscribe</button></form></div>
        <div class="ad ad-sidebar"><ins class="adsbygoogle" style="display:block" data-ad-format="rectangle"></ins></div>
      </aside>
    </div>
  </div></main>${footer(site)}`;
  return renderBase({title:article.title,description:article.metaDescription,slug:article.slug,siteName:site.name,siteUrl:site.url,schemas:article.schemas||[],body,adsenseId:site.adsenseId});
}

export function renderHomePage(articles,site){
  const hero=articles[0];const side=articles.slice(1,4);const latest=articles.slice(4,20);
  const heroHtml=hero?`<div class="home-hero">
    <article class="card"><div class="card-img"><img src="/images/${hero.slug}.webp" alt="${esc(hero.title)}" loading="eager" onerror="this.src='/images/placeholder.webp'"/></div><div class="card-body"><div class="card-cat">${esc(hero.category||'Featured')}</div><h2 class="card-title" style="font-size:28px"><a href="/${hero.slug}/">${esc(hero.title)}</a></h2><p class="card-excerpt">${esc(hero.excerpt)}</p></div></article>
    <div>${side.map(a=>`<article class="card" style="margin-bottom:16px"><div class="card-img"><img src="/images/${a.slug}.webp" alt="${esc(a.title)}" loading="lazy" onerror="this.src='/images/placeholder.webp'" style="aspect-ratio:3/2"/></div><div class="card-body"><div class="card-cat">${esc(a.category||'Guide')}</div><div class="card-title"><a href="/${a.slug}/">${esc(a.title)}</a></div></div></article>`).join('')}</div>
  </div>`:'';
  const gridHtml=latest.length?`<section><h2 class="section-title">Latest Stories</h2><div class="art-grid">${latest.map(a=>`<article class="card"><div class="card-img"><img src="/images/${a.slug}.webp" alt="${esc(a.title)}" loading="lazy" onerror="this.src='/images/placeholder.webp'"/></div><div class="card-body"><div class="card-cat">${esc(a.category||'Guide')}</div><h3 class="card-title"><a href="/${a.slug}/">${esc(a.title)}</a></h3><p class="card-excerpt">${esc(a.excerpt)}</p></div></article>`).join('')}</div></section>`:'';
  const body=`${header(site)}<main class="site-main"><div class="wrap"><div class="ad ad-leader"><ins class="adsbygoogle" style="display:block" data-ad-format="leaderboard"></ins></div>${heroHtml}<div class="ad ad-leader"><ins class="adsbygoogle" style="display:block" data-ad-format="leaderboard"></ins></div>${gridHtml}</div></main>${footer(site)}`;
  return renderBase({title:`${site.name} — Lifestyle & Wellness Guides`,description:`${site.name}: inspiring guides for better living.`,siteName:site.name,siteUrl:site.url,body,adsenseId:site.adsenseId});
}

export function renderCategoryPage(articles,category,site){
  const gridHtml=articles.map(a=>`<article class="card"><div class="card-img"><img src="/images/${a.slug}.webp" alt="${esc(a.title)}" loading="lazy" onerror="this.src='/images/placeholder.webp'" style="aspect-ratio:3/2"/></div><div class="card-body"><div class="card-cat">${esc(category.name)}</div><h2 class="card-title"><a href="/${a.slug}/">${esc(a.title)}</a></h2><p class="card-excerpt">${esc(a.excerpt||'')}</p></div></article>`).join('');
  const schema={'@context':'https://schema.org','@type':'BreadcrumbList',itemListElement:[{'@type':'ListItem',position:1,name:'Home',item:`${site.url}/`},{'@type':'ListItem',position:2,name:category.name,item:`${site.url}/category/${category.slug}/`}]};
  const body=`${header(site)}<main class="site-main"><div class="wrap"><div class="ad ad-leader"><ins class="adsbygoogle" style="display:block" data-ad-format="leaderboard"></ins></div><p style="text-align:center;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:var(--muted);margin:24px 0 8px"><a href="/" style="color:var(--terra)">Home</a> › <span>${esc(category.name)}</span></p><h1 class="section-title" style="text-align:center;font-size:clamp(28px,4vw,46px)">${esc(category.name)}</h1><p style="text-align:center;color:var(--muted);margin-bottom:32px;font-size:13px;letter-spacing:1px">${articles.length} ARTICLE${articles.length!==1?'S':''}</p><div class="art-grid">${gridHtml}</div><div class="ad ad-leader" style="margin-top:32px"><ins class="adsbygoogle" style="display:block" data-ad-format="leaderboard"></ins></div></div></main>${footer(site)}`;
  return renderBase({title:`${category.name} — ${site.name}`,description:`Browse ${articles.length} expert articles about ${category.name} on ${site.name}.`,slug:`category/${category.slug}`,siteName:site.name,siteUrl:site.url,schemas:[schema],body,adsenseId:site.adsenseId});
}

export function render404Page(site){
  const body=`${header(site)}<main class="site-main"><div class="wrap" style="text-align:center;padding:80px 20px"><h1 style="font-family:'Cormorant Garamond',serif;font-size:48px;font-weight:400">Not Found</h1><p style="margin:16px 0 24px;color:#7a6a5a">This page doesn't exist</p><a href="/" style="background:#c4622d;color:#fff;padding:12px 24px;text-decoration:none;font-weight:700;letter-spacing:1px;text-transform:uppercase;font-size:13px">← Back Home</a></div></main>${footer(site)}`;
  return renderBase({title:'Page Not Found',description:'Page not found',siteName:site.name,siteUrl:site.url,body});
}
