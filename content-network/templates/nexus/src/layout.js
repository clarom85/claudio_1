/**
 * NEXUS — Tech/digital magazine style
 * Dark mode, accent viola/cyan, font monospace per kicker, card grandi
 */
import { COOKIE_BANNER_CSS, COOKIE_BANNER_HTML, COOKIE_BANNER_JS, EMAIL_FORM_JS, NATIVE_ADS_CSS, NATIVE_ADS_JS } from '../../shared/snippets.js';
function esc(str=''){return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}

export const CSS=`
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --bg:#0f0f13;--surface:#1a1a24;--surface2:#22222e;--purple:#7c3aed;--cyan:#06b6d4;
  --white:#f0f0f8;--muted:#8888aa;--border:#2a2a3a;
  --ff-head:'Inter',system-ui,sans-serif;--ff-mono:'JetBrains Mono','Fira Code',monospace;
  --max:1180px;--r:8px
}
html{font-size:16px;scroll-behavior:smooth}
body{font-family:var(--ff-head);background:var(--bg);color:var(--white);line-height:1.6}
.wrap{max-width:var(--max);margin:0 auto;padding:0 16px}
a{color:inherit}

/* Header */
.hdr-bar{height:3px;background:linear-gradient(90deg,var(--purple),var(--cyan))}
.hdr-main{background:var(--surface);border-bottom:1px solid var(--border);padding:14px 0}
.hdr-main .wrap{display:flex;align-items:center;justify-content:space-between;gap:20px}
.logo{text-decoration:none;display:flex;align-items:center;gap:10px}
.logo-icon{width:36px;height:36px;background:linear-gradient(135deg,var(--purple),var(--cyan));border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:900;color:#fff}
.logo-text{font-size:22px;font-weight:800;letter-spacing:-0.5px}
.logo-text span{background:linear-gradient(90deg,var(--purple),var(--cyan));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
.hdr-ad{flex:1;max-width:680px;min-height:80px;background:var(--surface2);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;font-size:11px;color:var(--muted);border-radius:var(--r)}
.hdr-nav{background:var(--surface2);border-bottom:1px solid var(--border)}
.hdr-nav ul{list-style:none;display:flex;gap:0;max-width:var(--max);margin:0 auto;padding:0 16px}
.hdr-nav a{display:block;color:var(--muted);text-decoration:none;padding:10px 16px;font-size:13px;font-weight:600;transition:color .2s}
.hdr-nav a:hover{color:var(--cyan)}

/* Layout */
.site-main{padding:32px 0 64px}
.art-layout{display:grid;grid-template-columns:1fr 300px;gap:32px;margin-top:28px}
@media(max-width:900px){.art-layout{grid-template-columns:1fr}}

/* Article */
.art-hdr{margin-bottom:24px}
.art-kicker{font-family:var(--ff-mono);font-size:11px;letter-spacing:2px;color:var(--cyan);margin-bottom:10px;text-transform:uppercase}
.art-title{font-size:clamp(26px,4vw,42px);font-weight:800;line-height:1.15;letter-spacing:-0.5px;margin-bottom:14px}
.art-meta{display:flex;align-items:center;gap:16px;flex-wrap:wrap;padding:14px 0;border-top:1px solid var(--border);border-bottom:1px solid var(--border);margin-bottom:14px}
.author-chip{display:flex;align-items:center;gap:8px}
.author-dot{width:8px;height:8px;border-radius:50%;background:linear-gradient(135deg,var(--purple),var(--cyan))}
.author-name{font-weight:600;font-size:14px}
.author-title{font-size:12px;color:var(--muted)}
.art-date{font-size:13px;color:var(--muted);font-family:var(--ff-mono)}

/* Ad */
.ad{background:var(--surface2);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;font-size:11px;color:var(--muted);border-radius:var(--r)}
.ad-leader{width:100%;min-height:90px;margin:16px 0}
.ad-inline{width:100%;min-height:250px;margin:28px 0}
.ad-sidebar{width:100%;min-height:250px;margin-bottom:20px}

/* Content */
.art-body{background:var(--surface);padding:28px;border-radius:var(--r);border:1px solid var(--border)}
.intro{font-size:18px;line-height:1.75;color:var(--white);font-weight:500;border-left:3px solid var(--cyan);padding-left:16px;margin-bottom:24px}
.art-section{margin:28px 0}
.art-section h2{font-size:20px;font-weight:700;margin-bottom:14px;padding-bottom:8px;border-bottom:1px solid var(--border);color:var(--cyan)}
.art-section p{margin-bottom:14px;font-size:16px;line-height:1.75;color:#d0d0e8}
.art-list{padding-left:20px;margin:12px 0}
.art-list li{margin-bottom:8px;line-height:1.65;font-size:15px;color:#d0d0e8}
.art-list li::marker{color:var(--cyan)}
.code-block{background:var(--bg);border:1px solid var(--border);border-radius:var(--r);padding:16px;font-family:var(--ff-mono);font-size:14px;margin:16px 0;overflow-x:auto}
.faq-wrap{background:var(--bg);border:1px solid var(--border);padding:24px;border-radius:var(--r);margin:28px 0}
.faq-wrap>h2{font-size:18px;font-weight:700;margin-bottom:16px;color:var(--cyan)}
.faq-item{margin-bottom:14px;padding-bottom:14px;border-bottom:1px solid var(--border)}
.faq-item:last-child{border-bottom:none;margin-bottom:0;padding-bottom:0}
.faq-q{font-weight:700;font-size:15px;margin-bottom:6px;color:var(--white)}
.faq-a{font-size:14px;line-height:1.7;color:var(--muted)}
.conclusion h2{font-size:20px;font-weight:700;margin-bottom:12px;color:var(--purple)}
.conclusion p{font-size:16px;line-height:1.75;margin-bottom:12px;color:#d0d0e8}
.tags{display:flex;flex-wrap:wrap;gap:8px;margin-top:24px;padding-top:16px;border-top:1px solid var(--border)}
.tag{background:var(--surface2);border:1px solid var(--border);padding:4px 12px;border-radius:20px;font-size:12px;text-decoration:none;color:var(--muted);font-family:var(--ff-mono)}
.tag:hover{border-color:var(--cyan);color:var(--cyan)}

/* Sidebar */
.sidebar-box{background:var(--surface);border:1px solid var(--border);border-radius:var(--r);padding:20px;margin-bottom:20px}
.sidebar-box h3{font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:var(--cyan);margin-bottom:14px}
.related-item{display:flex;gap:10px;margin-bottom:12px;padding-bottom:12px;border-bottom:1px solid var(--border)}
.related-item:last-child{border-bottom:none}
.related-img{width:65px;height:50px;object-fit:cover;border-radius:4px;flex-shrink:0}
.related-title{font-size:13px;font-weight:600;color:var(--white);text-decoration:none;line-height:1.4;display:block}
.related-title:hover{color:var(--cyan)}
.nl-box{background:linear-gradient(135deg,#1a0a3a,#0a1a3a);border:1px solid var(--purple);border-radius:var(--r);padding:20px;margin-bottom:20px}
.nl-box h3{font-size:15px;font-weight:700;margin-bottom:4px}
.nl-box p{font-size:13px;color:var(--muted);margin-bottom:12px}
.nl-box input{width:100%;padding:10px 12px;background:var(--bg);border:1px solid var(--border);border-radius:6px;color:var(--white);font-size:14px;margin-bottom:8px}
.nl-box button{width:100%;background:linear-gradient(90deg,var(--purple),var(--cyan));border:none;padding:10px;border-radius:6px;color:#fff;font-weight:700;cursor:pointer;font-size:14px}

/* Home */
.home-hero{display:grid;grid-template-columns:3fr 2fr;gap:24px;margin-bottom:32px}
@media(max-width:700px){.home-hero{grid-template-columns:1fr}}
.card{background:var(--surface);border:1px solid var(--border);border-radius:var(--r);overflow:hidden;transition:border-color .2s}
.card:hover{border-color:var(--purple)}
.card-img img{width:100%;aspect-ratio:16/9;object-fit:cover}
.card-body{padding:16px}
.card-cat{font-family:var(--ff-mono);font-size:10px;letter-spacing:1.5px;text-transform:uppercase;color:var(--cyan);margin-bottom:6px}
.card-title{font-size:17px;font-weight:700;line-height:1.3;margin-bottom:8px;letter-spacing:-.2px}
.card-title a{color:var(--white);text-decoration:none}
.card-title a:hover{color:var(--cyan)}
.card-excerpt{font-size:13px;color:var(--muted);line-height:1.6}
.art-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(270px,1fr));gap:16px;margin:20px 0}
.section-title{font-size:18px;font-weight:700;margin-bottom:20px;color:var(--white)}
.section-title span{background:linear-gradient(90deg,var(--purple),var(--cyan));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}

/* Footer */
.site-footer{background:var(--surface);border-top:1px solid var(--border);padding:36px 0 16px;margin-top:56px}
.footer-grid{display:grid;grid-template-columns:2fr 1fr 1fr;gap:28px;margin-bottom:24px}
@media(max-width:600px){.footer-grid{grid-template-columns:1fr}}
.footer-col h4{font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:var(--cyan);margin-bottom:12px;font-family:var(--ff-mono)}
.footer-col ul{list-style:none}
.footer-col li{margin-bottom:8px}
.footer-col a{color:var(--muted);text-decoration:none;font-size:13px}
.footer-col a:hover{color:var(--white)}
.footer-bottom{border-top:1px solid var(--border);padding-top:14px;text-align:center;font-size:12px;color:var(--muted)}
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
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;700&display=swap"/>
<link rel="stylesheet" href="/assets/style.css"/>
</head><body>${body}
${COOKIE_BANNER_HTML}
<script>${COOKIE_BANNER_JS}${EMAIL_FORM_JS}${NATIVE_ADS_JS}
fetch('/api/categories.json').then(r=>r.json()).then(cats=>{const nav=document.getElementById('main-nav');cats.slice(0,6).forEach(c=>{const li=document.createElement('li');li.innerHTML='<a href="/category/'+c.slug+'">'+c.name+'</a>';nav.appendChild(li)})}).catch(()=>{});
</script></body></html>`}

function header(site){return`
<div class="hdr-bar"></div>
<header>
  <div class="hdr-main"><div class="wrap">
    <a href="/" class="logo"><div class="logo-icon">N</div><div class="logo-text"><span>${esc(site.name)}</span></div></a>
    <div class="hdr-ad ad">Advertisement</div>
  </div></div>
  <nav class="hdr-nav"><ul id="main-nav"><li><a href="/">Home</a></li></ul></nav>
</header>`}

function footer(site){return`
<footer class="site-footer"><div class="wrap">
  <div class="footer-grid">
    <div><div class="footer-col"><h4>${esc(site.name)}</h4></div><p style="font-size:13px;color:#8888aa;line-height:1.7">Expert-driven guides and technical analysis for modern problems.</p></div>
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
      <div class="art-kicker">// <a href="/category/${article.categorySlug||'guides'}/" style="color:inherit;text-decoration:none">${esc(article.category||'expert-guide')}</a></div>
      <h1 class="art-title">${esc(article.title)}</h1>
      <div class="art-meta">
        <div class="author-chip"><div class="author-dot"></div><div><span class="author-name">${esc(site.authorName)}</span><br/><span class="author-title">${esc(site.authorTitle)}</span></div></div>
        <time class="art-date" datetime="${date.toISOString()}">${date.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}</time>
      </div>
      <div class="ad ad-leader"><ins class="adsbygoogle" style="display:block" data-ad-format="leaderboard"></ins></div>
    </header>
    <div class="art-layout">
      <div class="art-body">${article.content}</div>
      <aside>
        <div class="ad ad-sidebar"><ins class="adsbygoogle" style="display:block" data-ad-format="rectangle"></ins></div>
        ${relatedHtml?`<div class="sidebar-box"><h3>Related</h3>${relatedHtml}</div>`:''}
        <div class="nl-box"><h3>Stay Updated</h3><p>Expert guides in your inbox</p><form class="nl-form" onsubmit="return false"><input type="email" placeholder="your@email.com"/><button>Subscribe</button></form></div>
        <div class="ad ad-sidebar"><ins class="adsbygoogle" style="display:block" data-ad-format="rectangle"></ins></div>
      </aside>
    </div>
  </div></main>${footer(site)}`;
  return renderBase({title:article.title,description:article.metaDescription,slug:article.slug,siteName:site.name,siteUrl:site.url,schemas:article.schemas||[],body,adsenseId:site.adsenseId});
}

export function renderHomePage(articles,site){
  const hero=articles[0];const side=articles.slice(1,4);const latest=articles.slice(4,20);
  const heroHtml=hero?`<div class="home-hero">
    <article class="card"><div class="card-img"><img src="/images/${hero.slug}.webp" alt="${esc(hero.title)}" loading="eager" onerror="this.src='/images/placeholder.webp'"/></div><div class="card-body"><div class="card-cat">${esc(hero.category||'Guide')}</div><h2 class="card-title" style="font-size:24px"><a href="/${hero.slug}/">${esc(hero.title)}</a></h2><p class="card-excerpt">${esc(hero.excerpt)}</p></div></article>
    <div>${side.map(a=>`<article class="card" style="margin-bottom:12px"><div class="card-body"><div class="card-cat">${esc(a.category||'Guide')}</div><div class="card-title" style="font-size:15px"><a href="/${a.slug}/">${esc(a.title)}</a></div></div></article>`).join('')}</div>
  </div>`:'';
  const gridHtml=latest.length?`<section><h2 class="section-title"><span>Latest Articles</span></h2><div class="art-grid">${latest.map(a=>`<article class="card"><div class="card-img"><img src="/images/${a.slug}.webp" alt="${esc(a.title)}" loading="lazy" onerror="this.src='/images/placeholder.webp'"/></div><div class="card-body"><div class="card-cat">${esc(a.category||'Guide')}</div><h3 class="card-title"><a href="/${a.slug}/">${esc(a.title)}</a></h3><p class="card-excerpt">${esc(a.excerpt)}</p></div></article>`).join('')}</div></section>`:'';
  const body=`${header(site)}<main class="site-main"><div class="wrap"><div class="ad ad-leader"><ins class="adsbygoogle" style="display:block" data-ad-format="leaderboard"></ins></div>${heroHtml}<div class="ad ad-leader"><ins class="adsbygoogle" style="display:block" data-ad-format="leaderboard"></ins></div>${gridHtml}</div></main>${footer(site)}`;
  return renderBase({title:`${site.name} — Expert Technical Guides`,description:`${site.name}: expert-driven guides and solutions.`,siteName:site.name,siteUrl:site.url,body,adsenseId:site.adsenseId});
}

export function renderCategoryPage(articles,category,site){
  const gridHtml=articles.map(a=>`<article class="card"><div class="card-img"><img src="/images/${a.slug}.webp" alt="${esc(a.title)}" loading="lazy" onerror="this.src='/images/placeholder.webp'"/></div><div class="card-body"><div class="card-cat">${esc(category.name)}</div><h2 class="card-title"><a href="/${a.slug}/">${esc(a.title)}</a></h2><p class="card-excerpt">${esc(a.excerpt||'')}</p></div></article>`).join('');
  const schema={'@context':'https://schema.org','@type':'BreadcrumbList',itemListElement:[{'@type':'ListItem',position:1,name:'Home',item:`${site.url}/`},{'@type':'ListItem',position:2,name:category.name,item:`${site.url}/category/${category.slug}/`}]};
  const body=`${header(site)}<main class="site-main"><div class="wrap"><div class="ad ad-leader"><ins class="adsbygoogle" style="display:block" data-ad-format="leaderboard"></ins></div><div style="margin:20px 0 4px;font-family:var(--ff-mono);font-size:11px;color:var(--muted)"><a href="/" style="color:var(--cyan)">~</a> / <span style="color:var(--white)">${esc(category.name)}</span></div><h1 class="section-title"><span>${esc(category.name)}</span></h1><p style="color:var(--muted);margin-bottom:28px;font-family:var(--ff-mono);font-size:13px">${articles.length} article${articles.length!==1?'s':''}</p><div class="art-grid">${gridHtml}</div><div class="ad ad-leader" style="margin-top:32px"><ins class="adsbygoogle" style="display:block" data-ad-format="leaderboard"></ins></div></div></main>${footer(site)}`;
  return renderBase({title:`${category.name} — ${site.name}`,description:`Browse ${articles.length} expert articles about ${category.name} on ${site.name}.`,slug:`category/${category.slug}`,siteName:site.name,siteUrl:site.url,schemas:[schema],body,adsenseId:site.adsenseId});
}

export function render404Page(site){
  const body=`${header(site)}<main class="site-main"><div class="wrap" style="text-align:center;padding:80px 20px"><div style="font-family:'JetBrains Mono',monospace;font-size:12px;color:#06b6d4;margin-bottom:8px">// error</div><h1 style="font-size:48px;font-weight:800;margin-bottom:16px">404</h1><p style="color:#8888aa;margin-bottom:24px">Page not found</p><a href="/" style="background:linear-gradient(90deg,#7c3aed,#06b6d4);color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:700">← Back to Home</a></div></main>${footer(site)}`;
  return renderBase({title:'404 Not Found',description:'Page not found',siteName:site.name,siteUrl:site.url,body});
}
