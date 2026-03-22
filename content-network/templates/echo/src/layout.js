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
.ad-footer{width:100%;min-height:90px;text-align:center;padding:8px 0}

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

function adUnit(type){
  const ezoicId=process.env.EZOIC_SITE_ID||'';
  const minH={leaderboard:90,inline:280,sidebar:250,footer:90}[type]||250;
  if(ezoicId){const ids={leaderboard:101,inline:102,sidebar:104,footer:106};return `<div id="ezoic-pub-ad-placeholder-${ids[type]||102}" style="min-height:${minH}px"></div>`;}
  const cls={leaderboard:'ad-leader',inline:'ad-inline',sidebar:'ad-sidebar',footer:'ad-footer'};
  const fmt={leaderboard:'leaderboard',inline:'fluid',sidebar:'rectangle',footer:'leaderboard'};
  return `<div class="ad ${cls[type]}" style="min-height:${minH}px"><ins class="adsbygoogle" style="display:block" data-ad-format="${fmt[type]}"></ins></div>`;}

function renderBase({title,description,slug,siteName,siteUrl,schemas=[],body,adsenseId='',ogImage='',noindex=false,datePublished='',dateModified='',authorUrl=''}){
  const canonical=slug?`${siteUrl}/${slug}/`:`${siteUrl}/`;
  const schemasHtml=schemas.map(s=>`<script type="application/ld+json">${JSON.stringify(s)}</script>`).join('\n');
  const robots=noindex?'noindex, follow':'index, follow, max-image-preview:large';
  const ga4Id=process.env.GA4_MEASUREMENT_ID||'';
  const gscVerification=process.env.GOOGLE_SITE_VERIFICATION||'';
  const ezoicId=process.env.EZOIC_SITE_ID||'';
  const effectiveOgImage=ogImage||(siteUrl?`${siteUrl}/images/og-default.jpg`:'');
  const isArticle=slug&&!slug.startsWith('category/')&&!slug.startsWith('tag/')&&slug!=='about'&&slug!=='contact'&&slug!=='privacy'&&slug!=='terms'&&slug!=='disclaimer'&&slug!=='advertise'&&slug!=='editorial-process';
  return `<!DOCTYPE html><html lang="en" data-adsense="${adsenseId}"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<meta name="robots" content="${robots}"/><meta name="theme-color" content="#c4622d"/>
<meta property="og:locale" content="en_US"/>${gscVerification?`<meta name="google-site-verification" content="${gscVerification}"/>`:''}
<title>${esc(title)} | ${esc(siteName)}</title>
<meta name="description" content="${esc(description)}"/><link rel="canonical" href="${canonical}"/>
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
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&family=Lato:wght@400;700&display=swap"/>
<link rel="stylesheet" href="/assets/style.css"/>
</head><body>${body}
${ezoicId?'':COOKIE_BANNER_HTML}<script>${ezoicId?'':COOKIE_BANNER_JS}${EMAIL_FORM_JS}${NATIVE_ADS_JS}</script></body></html>`}

function header(site){return`
<div class="hdr-top">${new Date().toLocaleDateString('en-US',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}</div>
<header>
  <div class="hdr-main"><div class="wrap">
    <a href="/" class="logo"><span class="logo-name">${esc(site.name)}</span><span class="logo-sub">Living · Wellness · Inspiration</span></a>
    ${adUnit('leaderboard')}
  </div></div>
  <nav class="hdr-nav"><ul id="main-nav"><li><a href="/">Home</a></li>${(site.categories||[]).map(c=>`<li><a href="/category/${c.slug}/">${esc(c.name)}</a></li>`).join('')}</ul></nav>
</header>`}

function footer(site){return`
<footer class="site-footer">${adUnit('footer')}<div class="wrap">
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
      ${adUnit('leaderboard')}
    </header>
    <div class="art-layout">
      <div class="art-body">${article.content}${(()=>{const sn=process.env.DISQUS_SHORTNAME||'';if(!sn)return '';const pu=`${site.url}/${article.slug}/`;return '<div style="margin-top:48px;padding-top:32px;border-top:2px solid var(--border)"><div id="disqus_thread"></div><scr'+'ipt>var disqus_config=function(){this.page.url="'+pu+'";this.page.identifier="'+article.slug+'";};<\/scr'+'ipt><scr'+'ipt>(function(){var d=document,sc=d.createElement("script");sc.src="https://'+sn+'.disqus.com/embed.js";sc.setAttribute("data-timestamp",+new Date());(d.head||d.body).appendChild(sc);})();<\/scr'+'ipt></div>';})()}</div>
      <aside>
        ${adUnit('sidebar')}
        ${relatedHtml?`<div class="sidebar-box"><h3>You May Also Like</h3>${relatedHtml}</div>`:''}
        <div class="nl-box"><h3>Weekly Inspiration</h3><p>Expert tips delivered to your inbox</p><form class="nl-form newsletter-form"><input type="email" placeholder="your@email.com"/><button type="submit">Subscribe</button></form></div>
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
  const hero=articles[0];const side=articles.slice(1,4);const latest=articles.slice(4,20);
  const heroHtml=hero?`<div class="home-hero">
    <article class="card"><div class="card-img"><img src="/images/${hero.slug}.webp" alt="${esc(hero.title)}" loading="eager" onerror="this.src='/images/placeholder.webp'"/></div><div class="card-body"><div class="card-cat">${esc(hero.category||'Featured')}</div><h2 class="card-title" style="font-size:28px"><a href="/${hero.slug}/">${esc(hero.title)}</a></h2><p class="card-excerpt">${esc(hero.excerpt)}</p></div></article>
    <div>${side.map(a=>`<article class="card" style="margin-bottom:16px"><div class="card-img"><img src="/images/${a.slug}.webp" alt="${esc(a.title)}" loading="lazy" onerror="this.src='/images/placeholder.webp'" style="aspect-ratio:3/2"/></div><div class="card-body"><div class="card-cat">${esc(a.category||'Guide')}</div><div class="card-title"><a href="/${a.slug}/">${esc(a.title)}</a></div></div></article>`).join('')}</div>
  </div>`:'';
  const gridHtml=latest.length?`<section><h2 class="section-title">Latest Stories</h2><div class="art-grid">${latest.map(a=>`<article class="card"><div class="card-img"><img src="/images/${a.slug}.webp" alt="${esc(a.title)}" loading="lazy" onerror="this.src='/images/placeholder.webp'"/></div><div class="card-body"><div class="card-cat">${esc(a.category||'Guide')}</div><h3 class="card-title"><a href="/${a.slug}/">${esc(a.title)}</a></h3><p class="card-excerpt">${esc(a.excerpt)}</p></div></article>`).join('')}</div></section>`:'';
  const body=`${header(site)}<main class="site-main"><div class="wrap">${adUnit('leaderboard')}${heroHtml}${adUnit('leaderboard')}${gridHtml}</div></main>${footer(site)}`;
  const orgSchema={'@context':'https://schema.org','@type':'Organization','@id':`${site.url}/#organization`,name:site.name,url:site.url,logo:{'@type':'ImageObject',url:`${site.url}/logo.png`,width:200,height:60}};
  return renderBase({title:`${site.name} — Lifestyle & Wellness Guides`,description:`${site.name}: inspiring guides for better living.`,siteName:site.name,siteUrl:site.url,body,adsenseId:site.adsenseId,ogImage:hero?`${site.url}/images/${hero.slug}.jpg`:'',schemas:[orgSchema]});
}

export function renderCategoryPage(articles,category,site){
  const gridHtml=articles.map(a=>`<article class="card"><div class="card-img"><img src="/images/${a.slug}.webp" alt="${esc(a.title)}" loading="lazy" onerror="this.src='/images/placeholder.webp'" style="aspect-ratio:3/2"/></div><div class="card-body"><div class="card-cat">${esc(category.name)}</div><h2 class="card-title"><a href="/${a.slug}/">${esc(a.title)}</a></h2><p class="card-excerpt">${esc(a.excerpt||'')}</p></div></article>`).join('');
  const schema={'@context':'https://schema.org','@type':'BreadcrumbList',itemListElement:[{'@type':'ListItem',position:1,name:'Home',item:`${site.url}/`},{'@type':'ListItem',position:2,name:category.name,item:`${site.url}/category/${category.slug}/`}]};
  const itemListSchema={'@context':'https://schema.org','@type':'ItemList',name:category.name,numberOfItems:articles.length,itemListElement:articles.slice(0,10).map((a,i)=>({'@type':'ListItem',position:i+1,url:`${site.url}/${a.slug}/`,name:a.title}))};
  const body=`${header(site)}<main class="site-main"><div class="wrap">${adUnit('leaderboard')}<p style="text-align:center;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:var(--muted);margin:24px 0 8px"><a href="/" style="color:var(--terra)">Home</a> › <span>${esc(category.name)}</span></p><h1 class="section-title" style="text-align:center;font-size:clamp(28px,4vw,46px)">${esc(category.name)}</h1><p style="text-align:center;color:var(--muted);margin-bottom:32px;font-size:13px;letter-spacing:1px">${articles.length} ARTICLE${articles.length!==1?'S':''}</p><div class="art-grid">${gridHtml}</div>${adUnit('leaderboard')}</div></main>${footer(site)}`;
  return renderBase({title:`${category.name} — ${site.name}`,description:`Browse ${articles.length} expert articles about ${category.name} on ${site.name}.`,slug:`category/${category.slug}`,siteName:site.name,siteUrl:site.url,schemas:[schema,itemListSchema],body,adsenseId:site.adsenseId,ogImage:articles[0]?`${site.url}/images/${articles[0].slug}.jpg`:''});
}

export function render404Page(site){
  const body=`${header(site)}<main class="site-main"><div class="wrap" style="text-align:center;padding:80px 20px"><h1 style="font-family:'Cormorant Garamond',serif;font-size:48px;font-weight:400">Not Found</h1><p style="margin:16px 0 24px;color:#7a6a5a">This page doesn't exist</p><a href="/" style="background:#c4622d;color:#fff;padding:12px 24px;text-decoration:none;font-weight:700;letter-spacing:1px;text-transform:uppercase;font-size:13px">← Back Home</a></div></main>${footer(site)}`;
  return renderBase({title:'Page Not Found',description:'Page not found',siteName:site.name,siteUrl:site.url,body,noindex:true});
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
