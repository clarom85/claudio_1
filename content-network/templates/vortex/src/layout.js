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
.ad-footer{width:100%;min-height:90px;text-align:center;padding:8px 0}

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

function adUnit(type){
  const ezoicId=process.env.EZOIC_SITE_ID||'';
  const minH={leaderboard:90,inline:280,sidebar:250,footer:90}[type]||250;
  if(ezoicId){const ids={leaderboard:101,inline:102,sidebar:104,footer:106};return `<div id="ezoic-pub-ad-placeholder-${ids[type]||102}" style="min-height:${minH}px"></div>`;}
  const cls={leaderboard:'ad-leader',inline:'ad-inline',sidebar:'ad-sidebar',footer:'ad-footer'};
  const fmt={leaderboard:'leaderboard',inline:'fluid',sidebar:'rectangle',footer:'leaderboard'};
  return `<div class="ad ${cls[type]}" style="min-height:${minH}px"><ins class="adsbygoogle" style="display:block" data-ad-format="${fmt[type]}"></ins></div>`;}

function renderBase({title,description,slug,siteName,siteUrl,schemas=[],body,adsenseId='',ogImage='',noindex=false,datePublished='',dateModified='',authorUrl='',prevUrl='',nextUrl=''}){
  const canonical=slug?`${siteUrl}/${slug}/`:`${siteUrl}/`;
  const schemasHtml=schemas.map(s=>`<script type="application/ld+json">${JSON.stringify(s)}</script>`).join('\n');
  const robots=noindex?'noindex, follow':'index, follow, max-image-preview:large';
  const ga4Id=process.env.GA4_MEASUREMENT_ID||'';
  const gscVerification=process.env.GOOGLE_SITE_VERIFICATION||'';
  const ezoicId=process.env.EZOIC_SITE_ID||'';
  const effectiveOgImage=ogImage||(siteUrl?`${siteUrl}/images/og-default.jpg`:'');
  const isArticle=slug&&!slug.startsWith('category/')&&!slug.startsWith('tag/')&&slug!=='about'&&slug!=='contact'&&slug!=='privacy'&&slug!=='terms'&&slug!=='disclaimer'&&slug!=='advertise'&&slug!=='editorial-process';
  return `<!DOCTYPE html><html lang="en" data-adsense="${adsenseId}"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<meta name="robots" content="${robots}"/><meta name="theme-color" content="#f97316"/>
<meta property="og:locale" content="en_US"/>${gscVerification?`<meta name="google-site-verification" content="${gscVerification}"/>`:''}
<title>${esc(title)} | ${esc(siteName)}</title>
<meta name="description" content="${esc(description)}"/><link rel="canonical" href="${canonical}"/>${prevUrl?`<link rel="prev" href="${prevUrl}"/>`:''}${nextUrl?`<link rel="next" href="${nextUrl}"/>`:''}
<link rel="alternate" type="application/rss+xml" title="${esc(siteName)}" href="${siteUrl}/feed.xml"/>${authorUrl?`<link rel="author" href="${authorUrl}"/>`:''}
<meta property="og:title" content="${esc(title)}"/><meta property="og:description" content="${esc(description)}"/><meta property="og:url" content="${canonical}"/><meta property="og:site_name" content="${esc(siteName)}"/>
<meta property="og:type" content="${isArticle?'article':'website'}"/>
${effectiveOgImage?`<meta property="og:image" content="${effectiveOgImage}"/><meta property="og:image:width" content="1200"/><meta property="og:image:height" content="630"/><meta name="twitter:image" content="${effectiveOgImage}"/>`:''}
${isArticle&&datePublished?`<meta property="og:article:published_time" content="${datePublished}"/>`:''}${isArticle&&(dateModified||datePublished)?`<meta property="og:article:modified_time" content="${dateModified||datePublished}"/>`:''}<meta name="twitter:card" content="summary_large_image"/>
<meta name="twitter:title" content="${esc(title)}"/><meta name="twitter:description" content="${esc(description)}"/>
${schemasHtml}
${ga4Id?`<script async src="https://www.googletagmanager.com/gtag/js?id=${ga4Id}"></script><script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${ga4Id}',{anonymize_ip:true});</script>`:''}
${ezoicId?`<script src="//www.ezojs.com/ezoic/sa.min.js" async></script>`:''}
<link rel="icon" href="/favicon.ico"/><link rel="apple-touch-icon" href="/apple-touch-icon.png"/>
<link rel="preconnect" href="https://fonts.googleapis.com"/><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
<link rel="preconnect" href="https://pagead2.googlesyndication.com"/><link rel="preconnect" href="https://www.googletagmanager.com"/><link rel="dns-prefetch" href="https://www.google-analytics.com"/>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Nunito:wght@400;600;700&display=swap"/>
<link rel="stylesheet" href="/assets/style.css"/>
</head><body>${body}
${ezoicId?'':COOKIE_BANNER_HTML}<script>${ezoicId?'':COOKIE_BANNER_JS}${EMAIL_FORM_JS}${NATIVE_ADS_JS}</script></body></html>`}

function header(site){return`
<header>
  <div class="hdr-main"><div class="wrap">
    <a href="/" class="logo"><span class="logo-v">${esc((site.name||'V')[0].toUpperCase())}</span><span class="logo-text">${esc(site.name.toUpperCase())}</span></a>
    ${adUnit('leaderboard')}
    <nav class="hdr-nav"><ul id="main-nav"><li><a href="/">Home</a></li>${(site.categories||[]).map(c=>`<li><a href="/category/${c.slug}/">${esc(c.name)}</a></li>`).join('')}</ul></nav>
  </div></div>
</header>`}

function footer(site){return`
<footer class="site-footer">${adUnit('footer')}<div class="wrap">
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
      ${adUnit('leaderboard')}
    </header>
    <div class="art-layout">
      <div class="art-body">${article.content}${(()=>{const sn=process.env.DISQUS_SHORTNAME||'';if(!sn)return '';const pu=`${site.url}/${article.slug}/`;return '<div style="margin-top:48px;padding-top:32px;border-top:2px solid var(--border)"><div id="disqus_thread"></div><scr'+'ipt>var disqus_config=function(){this.page.url="'+pu+'";this.page.identifier="'+article.slug+'";};<\/scr'+'ipt><scr'+'ipt>(function(){var d=document,sc=d.createElement("script");sc.src="https://'+sn+'.disqus.com/embed.js";sc.setAttribute("data-timestamp",+new Date());(d.head||d.body).appendChild(sc);})();<\/scr'+'ipt></div>';})()}</div>
      <aside>
        ${adUnit('sidebar')}
        ${relatedHtml?`<div class="sidebar-box"><h3>Related</h3>${relatedHtml}</div>`:''}
        <div class="nl-box"><h3>Stay Informed</h3><p>Expert guides delivered weekly</p><form class="nl-form newsletter-form"><input type="email" placeholder="your@email.com"/><button type="submit">Subscribe</button></form></div>
        ${adUnit('sidebar')}
      </aside>
    </div>
  ${adUnit('leaderboard')}
  </div></main>${footer(site)}`;
  const pubIso=article.date?new Date(article.date).toISOString():'';
  const modIso=article.updatedAt?new Date(article.updatedAt).toISOString():pubIso;
  return renderBase({title:article.title,description:article.metaDescription,slug:article.slug,siteName:site.name,siteUrl:site.url,schemas:article.schemas||[],body,adsenseId:site.adsenseId,ogImage:article.image?`${site.url}${article.image}`:'',datePublished:pubIso,dateModified:modIso,authorUrl:`${site.url}/author/${site.authorAvatar||''}/`});
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
  const body=`${header(site)}<main class="site-main">${heroHtml}<div class="wrap">${adUnit('leaderboard')}${gridHtml}</div></main>${footer(site)}`;
  const orgSchema={'@context':'https://schema.org','@type':'Organization','@id':`${site.url}/#organization`,name:site.name,url:site.url,logo:{'@type':'ImageObject',url:`${site.url}/logo.png`,width:200,height:60}};
  return renderBase({title:`${site.name} — Discover & Explore`,description:`${site.name}: expert guides and insider knowledge.`,siteName:site.name,siteUrl:site.url,body,adsenseId:site.adsenseId,ogImage:hero?`${site.url}/images/${hero.slug}.jpg`:'',schemas:[orgSchema]});
}

export function renderCategoryPage(articles,category,site,page=1,totalPages=1){
  const gridHtml=articles.map(a=>`<article class="card"><div class="card-img"><img src="/images/${a.slug}.webp" alt="${esc(a.title)}" loading="lazy" onerror="this.src='/images/placeholder.webp'"/></div><div class="card-body"><div class="card-cat">${esc(category.name)}</div><h2 class="card-title"><a href="/${a.slug}/">${esc(a.title)}</a></h2><p class="card-excerpt">${esc(a.excerpt||'')}</p></div></article>`).join('');
  const schema={'@context':'https://schema.org','@type':'BreadcrumbList',itemListElement:[{'@type':'ListItem',position:1,name:'Home',item:`${site.url}/`},{'@type':'ListItem',position:2,name:category.name,item:`${site.url}/category/${category.slug}/`}]};
  const itemListSchema={'@context':'https://schema.org','@type':'ItemList',name:category.name,numberOfItems:articles.length,itemListElement:articles.slice(0,10).map((a,i)=>({'@type':'ListItem',position:i+1,url:`${site.url}/${a.slug}/`,name:a.title}))};
  const catBase=`${site.url}/category/${category.slug}`;
  const prevUrl=page>1?(page===2?`${catBase}/`:`${catBase}/page/${page-1}/`):'';
  const nextUrl=page<totalPages?`${catBase}/page/${page+1}/`:'';
  const paginationHtml=totalPages>1?`<nav class="pagination" aria-label="Page navigation" style="display:flex;justify-content:center;align-items:center;gap:16px;margin:32px 0;padding:16px 0;border-top:1px solid var(--border)">${page>1?`<a href="${page===2?`/category/${category.slug}/`:`/category/${category.slug}/page/${page-1}/`}" rel="prev" style="padding:8px 20px;border:1px solid var(--border);border-radius:4px;color:var(--fg);text-decoration:none">&#8592; Prev</a>`:'<span style="padding:8px 20px;opacity:.4">&#8592; Prev</span>'}<span style="color:var(--muted);font-size:14px">Page ${page} of ${totalPages}</span>${page<totalPages?`<a href="/category/${category.slug}/page/${page+1}/" rel="next" style="padding:8px 20px;border:1px solid var(--border);border-radius:4px;color:var(--fg);text-decoration:none">Next &#8594;</a>`:'<span style="padding:8px 20px;opacity:.4">Next &#8594;</span>'}</nav>`:'';
  const body=`${header(site)}<main class="site-main"><div class="wrap">${adUnit('leaderboard')}<div style="margin:20px 0 4px;font-size:12px;text-transform:uppercase;letter-spacing:2px;color:var(--muted)"><a href="/" style="color:var(--orange)">Home</a> › <span>${esc(category.name)}</span></div><h1 class="section-title"><span>${esc(category.name)}</span></h1><p style="color:var(--muted);margin-bottom:28px;font-size:13px">${articles.length} article${articles.length!==1?'s':''}</p><div class="art-grid">${gridHtml}</div>${adUnit('leaderboard')}${paginationHtml}</div></main>${footer(site)}`;
  const pageTitle=page>1?`${category.name} — Page ${page} — ${site.name}`:`${category.name} — ${site.name}`;
  const pageSchemas=page===1?[schema,itemListSchema]:[schema];
  return renderBase({title:pageTitle,description:`Browse ${articles.length} expert articles about ${category.name} on ${site.name}.`,slug:page>1?`category/${category.slug}/page/${page}`:`category/${category.slug}`,siteName:site.name,siteUrl:site.url,schemas:pageSchemas,body,adsenseId:site.adsenseId,ogImage:articles[0]?`${site.url}/images/${articles[0].slug}.jpg`:'',prevUrl,nextUrl});
}

export function render404Page(site){
  const body=`${header(site)}<main class="site-main"><div class="wrap" style="text-align:center;padding:80px 20px"><h1 style="font-family:'Bebas Neue',sans-serif;font-size:80px;letter-spacing:4px;color:#f97316">404</h1><p style="color:#6b7280;margin:16px 0 24px;font-size:18px">This page got lost on the trail</p><a href="/" style="background:#f97316;color:#fff;padding:14px 28px;text-decoration:none;font-weight:700;border-radius:6px;font-size:14px;letter-spacing:1px;text-transform:uppercase">← Back to Home</a></div></main>${footer(site)}`;
  return renderBase({title:'404 Not Found',description:'Page not found',siteName:site.name,siteUrl:site.url,body,noindex:true});
}

export function renderTagPage(tag, articles, site) {
  const listHtml = articles.slice(0, 40).map(a => `
    <article class="card">
      <div class="card-img"><img src="/images/${a.slug}.webp" alt="${esc(a.title)}" loading="lazy" onerror="this.src='/images/placeholder.webp'"/></div>
      <div class="card-body">
        <div class="card-cat">${esc(a.category || '')}</div>
        <h2 class="card-title"><a href="/${a.slug}/">${esc(a.title)}</a></h2>
        <p class="card-excerpt">${esc(a.excerpt || '')}</p>
      </div>
    </article>`).join('');
  const itemListSchema = {
    '@context': 'https://schema.org', '@type': 'ItemList',
    name: tag.name, numberOfItems: articles.length,
    itemListElement: articles.slice(0, 10).map((a, i) => ({
      '@type': 'ListItem', position: i + 1, url: `${site.url}/${a.slug}/`, name: a.title
    }))
  };
  const body = `${header(site)}<main class="site-main"><div class="wrap">
    ${adUnit('leaderboard')}
    <h1 class="section-title">Topic: ${esc(tag.name)}</h1>
    <p style="color:var(--muted);margin-bottom:28px">${articles.length} article${articles.length !== 1 ? 's' : ''}</p>
    <div class="art-grid">${listHtml}</div>
    ${adUnit('leaderboard')}
  </div></main>${footer(site)}`;
  return renderBase({
    title: `${tag.name} — ${site.name}`,
    description: `Browse ${articles.length} expert articles about ${tag.name} on ${site.name}.`,
    slug: `tag/${tag.slug}`,
    siteName: site.name, siteUrl: site.url,
    schemas: [itemListSchema], body, adsenseId: site.adsenseId,
    ogImage: articles[0] ? `${site.url}/images/${articles[0].slug}.jpg` : ''
  });
}
