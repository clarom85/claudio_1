/**
 * TRIBUNE — Broadsheet newspaper style
 * Verde/grigio scuro, layout a colonne, serif classico, autorevolezza
 */
import { readFileSync } from 'fs';

export const CSS = `
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --green:#1a5c3a;--dark:#1c1c1c;--gold:#c9a84c;--light:#f7f5f0;
  --white:#fff;--border:#c8c0b0;--muted:#5a5a5a;
  --ff-head:'Playfair Display',Georgia,serif;--ff-body:'Source Serif 4',Georgia,serif;
  --max:1160px;--shadow:0 1px 4px rgba(0,0,0,.12)
}
html{font-size:16px;scroll-behavior:smooth}
body{font-family:var(--ff-body);background:var(--light);color:var(--dark);line-height:1.7}
.wrap{max-width:var(--max);margin:0 auto;padding:0 16px}

/* Header newspaper style */
.hdr-dateline{background:var(--dark);color:rgba(255,255,255,.6);font-size:11px;letter-spacing:1px;text-align:center;padding:5px}
.hdr-main{background:var(--white);border-bottom:4px double var(--dark);padding:16px 0 12px}
.hdr-main .wrap{text-align:center}
.logo{font-family:var(--ff-head);font-size:56px;font-weight:700;color:var(--dark);letter-spacing:-1px;line-height:1;text-decoration:none;display:block}
.logo span{color:var(--green)}
.tagline{font-size:12px;letter-spacing:3px;text-transform:uppercase;color:var(--muted);margin-top:4px}
.hdr-rule{height:3px;background:linear-gradient(90deg,var(--dark) 0,var(--green) 50%,var(--dark) 100%);margin:12px 0}
.hdr-nav{background:var(--green)}
.hdr-nav ul{list-style:none;display:flex;justify-content:center;flex-wrap:wrap}
.hdr-nav a{display:block;color:rgba(255,255,255,.9);text-decoration:none;padding:9px 18px;font-size:13px;font-weight:600;font-family:var(--ff-head);transition:background .2s}
.hdr-nav a:hover{background:rgba(255,255,255,.15)}

/* Layout */
.site-main{padding:28px 0 56px}
.art-layout{display:grid;grid-template-columns:1fr 280px;gap:36px;margin-top:24px}
@media(max-width:860px){.art-layout{grid-template-columns:1fr}}

/* Article */
.art-hdr{border-bottom:3px double var(--border);padding-bottom:20px;margin-bottom:20px}
.art-kicker{font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:var(--green);margin-bottom:8px}
.art-title{font-family:var(--ff-head);font-size:clamp(28px,4vw,44px);font-weight:700;line-height:1.15;color:var(--dark);margin-bottom:12px}
.art-deck{font-size:18px;font-style:italic;color:var(--muted);margin-bottom:16px;border-top:1px solid var(--border);border-bottom:1px solid var(--border);padding:10px 0}
.art-byline{font-size:13px;color:var(--muted);display:flex;gap:16px;flex-wrap:wrap}
.art-byline strong{color:var(--dark)}

/* Ad units */
.ad{background:#f0ede8;border:1px solid var(--border);display:flex;align-items:center;justify-content:center;font-size:11px;color:#bbb}
.ad-leader{width:100%;min-height:90px;margin:16px 0}
.ad-inline{width:100%;min-height:250px;margin:28px 0}
.ad-sidebar{width:100%;min-height:250px;margin-bottom:20px}

/* Content */
.art-body{background:var(--white);padding:28px;border-radius:2px;box-shadow:var(--shadow)}
.intro{font-size:19px;line-height:1.75;color:var(--dark);font-weight:600;margin-bottom:24px}
.intro::first-letter{font-size:64px;line-height:.8;float:left;margin:4px 8px 0 0;font-family:var(--ff-head);color:var(--green)}
.art-section{margin:28px 0}
.art-section h2{font-family:var(--ff-head);font-size:22px;font-weight:700;color:var(--dark);margin-bottom:14px;padding-bottom:6px;border-bottom:2px solid var(--green)}
.art-section p{margin-bottom:16px;font-size:16.5px;line-height:1.8}
.art-list{padding-left:22px;margin:12px 0}
.art-list li{margin-bottom:10px;line-height:1.7;font-size:16px}
.pull-quote{border-left:5px solid var(--gold);padding:16px 24px;margin:28px 0;background:#fdfaf4;font-family:var(--ff-head);font-size:20px;font-style:italic;line-height:1.5;color:var(--dark)}
.faq-wrap{background:var(--light);border:1px solid var(--border);padding:24px;margin:28px 0}
.faq-wrap>h2{font-family:var(--ff-head);font-size:20px;margin-bottom:16px;padding-bottom:8px;border-bottom:2px solid var(--dark)}
.faq-item{margin-bottom:16px;padding-bottom:16px;border-bottom:1px solid var(--border)}
.faq-item:last-child{border-bottom:none;margin-bottom:0;padding-bottom:0}
.faq-q{font-weight:700;font-size:16px;margin-bottom:6px}
.faq-a{font-size:15px;line-height:1.7;color:var(--muted)}
.conclusion h2{font-family:var(--ff-head);font-size:22px;margin-bottom:14px;padding-bottom:6px;border-bottom:2px solid var(--dark)}
.conclusion p{font-size:16.5px;line-height:1.8;margin-bottom:14px}
.tags{display:flex;flex-wrap:wrap;gap:8px;margin-top:24px;padding-top:16px;border-top:1px solid var(--border)}
.tag{background:var(--light);border:1px solid var(--border);padding:4px 12px;font-size:12px;text-decoration:none;color:var(--dark)}
.tag:hover{background:var(--green);color:#fff;border-color:var(--green)}

/* Sidebar */
.sidebar-box{background:var(--white);padding:20px;border:1px solid var(--border);margin-bottom:20px;border-top:4px solid var(--green)}
.sidebar-box h3{font-family:var(--ff-head);font-size:16px;margin-bottom:12px;padding-bottom:8px;border-bottom:1px solid var(--border);text-transform:uppercase;letter-spacing:.5px}
.related-item{display:flex;gap:10px;margin-bottom:12px;padding-bottom:12px;border-bottom:1px solid var(--border)}
.related-item:last-child{border-bottom:none}
.related-img{width:65px;height:50px;object-fit:cover;flex-shrink:0}
.related-title{font-size:13px;font-weight:700;font-family:var(--ff-head);color:var(--dark);text-decoration:none;line-height:1.3;display:block}
.related-title:hover{color:var(--green)}
.nl-box{background:var(--green);color:#fff;padding:20px;margin-bottom:20px}
.nl-box h3{font-family:var(--ff-head);font-size:16px;margin-bottom:10px}
.nl-box input{width:100%;padding:9px 12px;border:none;margin-bottom:8px;font-size:14px}
.nl-box button{width:100%;background:var(--gold);color:var(--dark);border:none;padding:10px;font-weight:700;cursor:pointer;font-size:14px}

/* Home */
.hero-layout{display:grid;grid-template-columns:2fr 1fr;gap:28px;margin-bottom:32px;padding-bottom:28px;border-bottom:3px double var(--border)}
@media(max-width:700px){.hero-layout{grid-template-columns:1fr}}
.card{background:var(--white);border:1px solid var(--border)}
.card-img img{width:100%;aspect-ratio:16/9;object-fit:cover}
.card-body{padding:16px}
.card-cat{font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:var(--green);margin-bottom:6px}
.card-title{font-family:var(--ff-head);font-size:18px;font-weight:700;line-height:1.3;margin-bottom:8px}
.card-title a{color:var(--dark);text-decoration:none}
.card-title a:hover{color:var(--green)}
.card-excerpt{font-size:14px;color:var(--muted);line-height:1.6;margin-bottom:8px}
.card-meta{font-size:12px;color:var(--muted)}
.art-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:20px;margin:20px 0}
.section-title{font-family:var(--ff-head);font-size:24px;color:var(--dark);margin-bottom:20px;padding-bottom:8px;border-bottom:3px double var(--border)}

/* Footer */
.site-footer{background:var(--dark);color:rgba(255,255,255,.75);padding:36px 0 16px;margin-top:56px}
.footer-grid{display:grid;grid-template-columns:2fr 1fr 1fr;gap:28px;margin-bottom:24px}
@media(max-width:600px){.footer-grid{grid-template-columns:1fr}}
.footer-about h3{color:#fff;font-family:var(--ff-head);font-size:18px;margin-bottom:10px}
.footer-col h4{color:#fff;font-size:12px;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:10px}
.footer-col ul{list-style:none}
.footer-col li{margin-bottom:6px}
.footer-col a{color:rgba(255,255,255,.65);text-decoration:none;font-size:13px}
.footer-col a:hover{color:#fff}
.footer-bottom{border-top:1px solid rgba(255,255,255,.1);padding-top:14px;text-align:center;font-size:12px;color:rgba(255,255,255,.45)}
`;

function esc(str=''){return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}

function header(site){return`
<div class="hdr-dateline">${new Date().toLocaleDateString('en-US',{weekday:'long',year:'numeric',month:'long',day:'numeric'})} — EST. ${new Date().getFullYear()}</div>
<header>
  <div class="hdr-main">
    <div class="wrap">
      <a href="/" class="logo">The <span>${esc(site.name.replace('The ',''))}</span> Tribune</a>
      <div class="tagline">Trusted • Accurate • In-Depth</div>
      <div class="hdr-rule"></div>
    </div>
  </div>
  <nav class="hdr-nav"><ul id="main-nav"><li><a href="/">Home</a></li></ul></nav>
</header>`}

function footer(site){return`
<footer class="site-footer">
  <div class="wrap">
    <div class="footer-grid">
      <div class="footer-about"><h3>${esc(site.name)}</h3><p>Delivering trusted, expert-backed information since ${new Date().getFullYear()}.</p></div>
      <div class="footer-col"><h4>Navigate</h4><ul><li><a href="/about/">About</a></li><li><a href="/contact/">Contact</a></li><li><a href="/advertise/">Advertise</a></li></ul></div>
      <div class="footer-col"><h4>Legal</h4><ul><li><a href="/privacy/">Privacy</a></li><li><a href="/terms/">Terms</a></li><li><a href="/disclaimer/">Disclaimer</a></li></ul></div>
    </div>
    <div class="footer-bottom"><p>© ${new Date().getFullYear()} ${esc(site.name)}. All rights reserved. For informational purposes only.</p></div>
  </div>
</footer>`}

function renderBase({title,description,slug,siteName,siteUrl,schemas=[],body,adsenseId=''}){
  const canonical=slug?`${siteUrl}/${slug}/`:`${siteUrl}/`;
  const schemasHtml=schemas.map(s=>`<script type="application/ld+json">${JSON.stringify(s)}</script>`).join('\n');
  const adsenseScript=adsenseId?`<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseId}" crossorigin="anonymous"></script>`:'';
  return`<!DOCTYPE html><html lang="en"><head>
<meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<meta name="robots" content="index,follow,max-image-preview:large"/>
<title>${esc(title)} | ${esc(siteName)}</title>
<meta name="description" content="${esc(description)}"/>
<link rel="canonical" href="${canonical}"/>
<meta property="og:title" content="${esc(title)}"/><meta property="og:description" content="${esc(description)}"/>
<meta property="og:url" content="${canonical}"/><meta property="og:type" content="${slug?'article':'website'}"/>
${schemasHtml}${adsenseScript}
<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Source+Serif+4:wght@400;600&display=swap"/>
<link rel="stylesheet" href="/assets/style.css"/>
</head><body>${body}
<script>document.querySelectorAll('.adsbygoogle').forEach(el=>{try{(adsbygoogle=window.adsbygoogle||[]).push({})}catch(e){}});
fetch('/api/categories.json').then(r=>r.json()).then(cats=>{const nav=document.getElementById('main-nav');cats.slice(0,6).forEach(c=>{const li=document.createElement('li');li.innerHTML='<a href="/category/'+c.slug+'">'+c.name+'</a>';nav.appendChild(li)})}).catch(()=>{});
fetch('/api/trending.json').then(r=>r.json()).then(arts=>{const el=document.getElementById('ticker-inner');if(el&&arts.length)el.innerHTML=arts.slice(0,8).map(a=>'<a href="/'+a.slug+'/">'+a.title+'</a>').join(' • ')}).catch(()=>{});
</script></body></html>`}

export function renderArticlePage(article,site,relatedArticles=[]){
  const date=new Date(article.date||Date.now());
  const relatedHtml=relatedArticles.slice(0,4).map(r=>`<div class="related-item"><img class="related-img" src="/images/${r.slug}.webp" alt="${esc(r.title)}" loading="lazy" onerror="this.src='/images/placeholder.webp'"/><a class="related-title" href="/${r.slug}/">${esc(r.title)}</a></div>`).join('');
  const body=`${header(site)}<main class="site-main"><div class="wrap">
    <header class="art-hdr">
      <div class="art-kicker">${esc(article.category||'Expert Guide')}</div>
      <h1 class="art-title">${esc(article.title)}</h1>
      <div class="art-deck">${esc(article.metaDescription)}</div>
      <div class="art-byline"><span>By <strong>${esc(site.authorName)}</strong></span><span>${esc(site.authorTitle)}</span><time datetime="${date.toISOString()}">${date.toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'})}</time></div>
      <div class="ad ad-leader"><ins class="adsbygoogle" style="display:block" data-ad-format="leaderboard"></ins></div>
    </header>
    <div class="art-layout">
      <div class="art-body">${article.content}</div>
      <aside>
        <div class="ad ad-sidebar"><ins class="adsbygoogle" style="display:block" data-ad-format="rectangle"></ins></div>
        ${relatedHtml?`<div class="sidebar-box"><h3>Related</h3>${relatedHtml}</div>`:''}
        <div class="nl-box"><h3>Weekly Expert Tips</h3><form onsubmit="return false"><input type="email" placeholder="your@email.com"/><button>Subscribe</button></form></div>
        <div class="ad ad-sidebar"><ins class="adsbygoogle" style="display:block" data-ad-format="rectangle"></ins></div>
      </aside>
    </div>
  </div></main>${footer(site)}`;
  return renderBase({title:article.title,description:article.metaDescription,slug:article.slug,siteName:site.name,siteUrl:site.url,schemas:article.schemas||[],body,adsenseId:site.adsenseId});
}

export function renderHomePage(articles,site){
  const hero=articles[0];const featured=articles.slice(1,4);const latest=articles.slice(4,20);
  const heroHtml=hero?`<div class="hero-layout">
    <article class="card"><div class="card-img"><img src="/images/${hero.slug}.webp" alt="${esc(hero.title)}" loading="eager" onerror="this.src='/images/placeholder.webp'"/></div><div class="card-body"><div class="card-cat">${esc(hero.category||'Featured')}</div><h2 class="card-title" style="font-size:26px"><a href="/${hero.slug}/">${esc(hero.title)}</a></h2><p class="card-excerpt">${esc(hero.excerpt)}</p><div class="card-meta">${esc(hero.author)}</div></div></article>
    <div>${featured.map(a=>`<article class="card" style="margin-bottom:16px"><div class="card-body"><div class="card-cat">${esc(a.category||'Guide')}</div><div class="card-title"><a href="/${a.slug}/">${esc(a.title)}</a></div></div></article>`).join('')}</div>
  </div>`:'';
  const gridHtml=latest.length?`<section><h2 class="section-title">Latest Coverage</h2><div class="art-grid">${latest.map(a=>`<article class="card"><div class="card-img"><img src="/images/${a.slug}.webp" alt="${esc(a.title)}" loading="lazy" onerror="this.src='/images/placeholder.webp'"/></div><div class="card-body"><div class="card-cat">${esc(a.category||'Guide')}</div><h3 class="card-title"><a href="/${a.slug}/">${esc(a.title)}</a></h3><p class="card-excerpt">${esc(a.excerpt)}</p></div></article>`).join('')}</div></section>`:'';
  const body=`${header(site)}<main class="site-main"><div class="wrap"><div class="ad ad-leader"><ins class="adsbygoogle" style="display:block" data-ad-format="leaderboard"></ins></div>${heroHtml}<div class="ad ad-leader"><ins class="adsbygoogle" style="display:block" data-ad-format="leaderboard"></ins></div>${gridHtml}</div></main>${footer(site)}`;
  return renderBase({title:`${site.name} — Expert Coverage & Analysis`,description:`${site.name}: authoritative expert-backed articles.`,siteName:site.name,siteUrl:site.url,body,adsenseId:site.adsenseId});
}

export function render404Page(site){
  const body=`${header(site)}<main class="site-main"><div class="wrap" style="text-align:center;padding:80px 20px"><h1 style="font-family:'Playfair Display',serif;font-size:48px">404</h1><p style="margin:16px 0 24px;font-size:18px">Page not found</p><a href="/" style="background:#1a5c3a;color:#fff;padding:12px 24px;text-decoration:none;font-weight:700">← Back to Home</a></div></main>${footer(site)}`;
  return renderBase({title:'Page Not Found',description:'Page not found',siteName:site.name,siteUrl:site.url,body});
}
