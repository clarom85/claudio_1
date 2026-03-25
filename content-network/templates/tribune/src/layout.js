/**
 * TRIBUNE — Broadsheet newspaper style
 * Verde/grigio scuro, layout a colonne, serif classico, autorevolezza
 */
import { COOKIE_BANNER_CSS, COOKIE_BANNER_HTML, COOKIE_BANNER_JS, EMAIL_FORM_JS, NATIVE_ADS_CSS, NATIVE_ADS_JS, getMgidLoader, injectMgidInArticle, getMgidSmartWidget } from '../../shared/snippets.js';

export const CSS = `
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --green:#1a5c3a;--dark:#1c1c1c;--gold:#c9a84c;--light:#f7f5f0;
  --white:#fff;--border:#c8c0b0;--muted:#5a5a5a;
  --ff-head:'Playfair Display',Georgia,serif;--ff-body:'Source Serif 4',Georgia,serif;
  --max:1160px;--shadow:0 1px 4px rgba(0,0,0,.12)
}
html{font-size:16px;scroll-behavior:smooth;overflow-y:scroll;scrollbar-gutter:stable}
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
.hdr-nav{background:var(--green);display:flex;align-items:center;justify-content:center}
.hdr-nav ul{flex:1;list-style:none;display:flex;justify-content:center;flex-wrap:wrap}
.hdr-nav a{display:block;color:rgba(255,255,255,.9);text-decoration:none;padding:10px 18px;font-size:15px;font-weight:600;font-family:var(--ff-head);transition:background .2s}
.hdr-nav a:hover{background:rgba(255,255,255,.15)}
.nav-toggle{display:none;background:none;border:none;cursor:pointer;color:#fff;font-size:24px;line-height:1;width:48px;height:48px;align-items:center;justify-content:center;flex-shrink:0}
@media(max-width:640px){.hdr-nav{flex-wrap:wrap;justify-content:flex-end}.nav-toggle{display:flex}.hdr-nav ul{display:none;flex-direction:column;width:100%;order:2}.hdr-nav ul.nav-open{display:flex}.hdr-nav a{padding:14px 20px;border-bottom:1px solid rgba(255,255,255,.15)}}

/* Layout */
.site-main{padding:28px 0 56px}
.art-layout{display:grid;grid-template-columns:1fr 280px;gap:36px;margin-top:24px}
@media(max-width:860px){.art-layout{grid-template-columns:1fr}}

/* Article */
.art-hdr{border-bottom:3px double var(--border);padding-bottom:20px;margin-bottom:20px}
.art-kicker{font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:var(--green);margin-bottom:8px}
.art-title{font-family:var(--ff-head);font-size:clamp(28px,4vw,44px);font-weight:700;line-height:1.15;color:var(--dark);margin-bottom:12px}
.art-deck{font-size:18px;font-style:italic;color:var(--muted);margin-bottom:16px;border-top:1px solid var(--border);border-bottom:1px solid var(--border);padding:10px 0}
.art-byline{font-size:13px;color:var(--muted);line-height:1.4}
.art-byline strong{color:var(--dark)}

/* Ad units */
.ad{background:#f0ede8;border:1px solid var(--border);display:flex;align-items:center;justify-content:center;font-size:11px;color:#bbb}
.ad-leader{width:100%;min-height:90px;margin:16px 0}
.ad-inline{width:100%;min-height:250px;margin:28px 0}
.ad-sidebar{width:100%;min-height:250px;margin-bottom:20px}
.ad-footer{width:100%;min-height:90px;text-align:center;padding:8px 0}

/* Content */
.art-body{background:var(--white);padding:28px;border-radius:2px;box-shadow:var(--shadow)}
.art-body .article-header{display:none}.art-body .article-hero-image{display:none}.art-body .article-sidebar{display:none}
.intro{font-size:19px;line-height:1.75;color:var(--dark);font-weight:600;margin-bottom:24px}
.intro::first-letter{font-size:64px;line-height:.8;float:left;margin:4px 8px 0 0;font-family:var(--ff-head);color:var(--green)}
.art-section{margin:28px 0}
.art-section h2{font-family:var(--ff-head);font-size:22px;font-weight:700;color:var(--dark);margin-top:36px;margin-bottom:14px;padding-bottom:6px;border-bottom:2px solid var(--green)}
.art-section p{margin-bottom:24px;font-size:16.5px;line-height:1.8}
.art-list{list-style:none;padding-left:0;margin:16px 0}
.art-list li{margin-bottom:10px;line-height:1.7;font-size:16px;padding:11px 16px 11px 52px;background:var(--light);border-left:3px solid var(--green);position:relative;border-radius:2px}
.art-list li::before{content:"✓";position:absolute;left:14px;color:var(--green);font-weight:700}
.art-section ul:not(.art-list){padding-left:22px;margin:12px 0}
.art-section ul:not(.art-list) li{margin-bottom:8px;line-height:1.7;font-size:16px}
.cost-table{width:100%;border-collapse:collapse;margin:24px 0;font-size:15px}
.cost-table th{background:var(--green);color:#fff;padding:10px 14px;text-align:left;font-family:var(--ff-head);font-size:13px;letter-spacing:.5px;text-transform:uppercase}
.cost-table td{padding:10px 14px;border-bottom:1px solid var(--border);vertical-align:top}
.cost-table tr:nth-child(even) td{background:var(--light)}
.cost-table tr:hover td{background:#f0ede8}
.cost-table td:last-child{font-weight:600;color:var(--green);white-space:nowrap}
.pull-quote{border-left:5px solid var(--gold);padding:16px 24px;margin:28px 0;background:#fdfaf4;font-family:var(--ff-head);font-size:20px;font-style:italic;line-height:1.5;color:var(--dark)}
.faq-wrap{background:var(--light);border:1px solid var(--border);padding:24px;margin-top:40px;padding-top:32px;border-top:3px solid var(--green)}
.art-section p,.article-section p{margin-bottom:24px;font-size:16.5px;line-height:1.85}
.art-section p strong,.article-section p strong{color:var(--dark)}
.article-section{margin:28px 0}
.article-section h2{font-family:var(--ff-head);font-size:22px;font-weight:700;color:var(--dark);margin-top:36px;margin-bottom:14px;padding-bottom:6px;border-bottom:2px solid var(--green)}
.faq-wrap>h2{font-family:var(--ff-head);font-size:20px;margin-top:40px;margin-bottom:16px;padding-bottom:8px;border-bottom:2px solid var(--dark)}
.faq-item{margin-bottom:16px;padding-bottom:16px;border-bottom:1px solid var(--border)}
.faq-item:last-child{border-bottom:none;margin-bottom:0;padding-bottom:0}
.faq-q{font-weight:700;font-size:16px;margin-bottom:6px}
.faq-a{font-size:15px;line-height:1.7;color:var(--muted)}
.conclusion h2{font-family:var(--ff-head);font-size:22px;margin-bottom:14px;padding-bottom:6px;border-bottom:2px solid var(--dark)}
.conclusion p{font-size:16.5px;line-height:1.8;margin-bottom:14px}
.tags{display:flex;flex-wrap:wrap;gap:8px;margin-top:24px;padding-top:16px;border-top:1px solid var(--border)}
.tag{background:var(--light);border:1px solid var(--border);padding:4px 12px;font-size:12px;text-decoration:none;color:var(--dark)}
.tag:hover{background:var(--green);color:#fff;border-color:var(--green)}

/* Article hero image */
.art-hero{width:100%;aspect-ratio:16/9;object-fit:cover;object-position:center;display:block;margin:20px 0;border-radius:2px}
.art-author-row{display:flex;align-items:center;gap:10px;margin-top:10px}
.art-author-avatar{width:48px;height:48px;border-radius:50%;object-fit:cover;object-position:center;flex-shrink:0;border:2px solid var(--border)}

/* Sidebar */
.sidebar-box{background:var(--white);padding:20px;border:1px solid var(--border);margin-bottom:20px;border-top:4px solid var(--green)}
.sidebar-box h3{font-family:var(--ff-head);font-size:16px;margin-bottom:12px;padding-bottom:8px;border-bottom:1px solid var(--border);text-transform:uppercase;letter-spacing:.5px}
.related-item{display:flex;gap:10px;margin-bottom:12px;padding-bottom:12px;border-bottom:1px solid var(--border)}
.related-item:last-child{border-bottom:none}
.related-img{width:65px;height:50px;object-fit:cover;flex-shrink:0}
.related-title{font-size:13px;font-weight:700;font-family:var(--ff-head);color:var(--dark);text-decoration:none;line-height:1.3;display:block}
.related-title:hover{color:var(--green)}
.nl-box{background:var(--green,#1a5c3a);color:#fff;padding:24px 20px;margin-bottom:20px;border-radius:4px}
.nl-box h3{font-size:16px;font-weight:700;margin-bottom:6px;letter-spacing:.3px}
.nl-box input{width:100%;padding:11px 14px;border:none;border-radius:3px;margin-bottom:10px;font-size:14px;box-sizing:border-box}
.nl-box button{width:100%;background:#c9a84c;color:#1a1a2e;border:none;padding:12px;font-weight:700;cursor:pointer;font-size:15px;border-radius:3px;letter-spacing:.5px;transition:opacity .2s}

/* Home */
.hero-layout{display:grid;grid-template-columns:2fr 1fr;gap:28px;margin-bottom:32px;padding-bottom:28px;border-bottom:3px double var(--border);align-items:start}
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
.art-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:20px;margin:20px 0}
.section-title{font-family:var(--ff-head);font-size:24px;color:var(--dark);margin-bottom:20px;padding-bottom:8px;border-bottom:3px double var(--border)}

/* Footer */
.site-footer{background:var(--dark);color:rgba(255,255,255,.75);padding:36px 0 16px;margin-top:56px}
.footer-grid{display:grid;grid-template-columns:2fr 1fr 1fr;gap:28px;margin-bottom:24px}
@media(max-width:600px){.footer-grid{grid-template-columns:1fr}.art-body{padding:16px}}
.footer-about{text-align:center}.footer-about h3{color:#fff;font-family:var(--ff-head);font-size:18px;margin-bottom:10px}
.footer-col h4{color:#fff;font-size:12px;text-transform:uppercase;letter-spacing:1.5px;margin-bottom:10px}
.footer-col ul{list-style:none}
.footer-col li{margin-bottom:6px}
.footer-col a{color:rgba(255,255,255,.65);text-decoration:none;font-size:13px}
.footer-col a:hover{color:#fff}
.footer-bottom{border-top:1px solid rgba(255,255,255,.1);padding-top:14px;text-align:center;font-size:12px;color:rgba(255,255,255,.45)}
${COOKIE_BANNER_CSS}${NATIVE_ADS_CSS}`;

function esc(str=''){return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}

export function renderHeader(site){return`
<div class="hdr-dateline">${new Date().toLocaleDateString('en-US',{weekday:'long',year:'numeric',month:'long',day:'numeric'})} — EST. ${new Date().getFullYear()}</div>
<header>
  <div class="hdr-main">
    <div class="wrap">
      <a href="/" class="logo"><span>${esc(site.name.replace('The ',''))}</span></a>
      <div class="tagline">Trusted • Accurate • In-Depth</div>
      <div class="hdr-rule"></div>
    </div>
  </div>
  <nav class="hdr-nav"><button class="nav-toggle" id="nav-toggle" aria-label="Open menu" aria-expanded="false">&#9776;</button><ul id="main-nav"><li><a href="/">Home</a></li>${(site.categories||[]).map(c=>`<li><a href="/category/${c.slug}/">${esc(c.name)}</a></li>`).join('')}${site.toolSlug?`<li><a href="/tools/${site.toolSlug}/" style="color:#c9a84c;font-weight:700">Free Calculator</a></li>`:''}</ul></nav>
</header>
<script>document.getElementById('nav-toggle')?.addEventListener('click',function(){var u=document.getElementById('main-nav');var o=u.classList.toggle('nav-open');this.setAttribute('aria-expanded',String(o));this.innerHTML=o?'&#10005;':'&#9776;'});</script>`}

export function renderFooter(site){return`
<footer class="site-footer">
  ${adUnit('footer')}
  <div class="wrap">
    <div class="footer-grid">
      <div class="footer-about"><h3>${esc(site.name)}</h3><p>Delivering trusted, expert-backed information since ${new Date().getFullYear()}.</p></div>
      <div class="footer-col"><h4>Navigate</h4><ul><li><a href="/about/">About</a></li><li><a href="/contact/">Contact</a></li><li><a href="/advertise/">Advertise</a></li></ul></div>
      <div class="footer-col"><h4>Legal</h4><ul><li><a href="/privacy/">Privacy</a></li><li><a href="/terms/">Terms</a></li><li><a href="/disclaimer/">Disclaimer</a></li></ul></div>
    </div>
    <div class="footer-bottom"><p>© ${new Date().getFullYear()} ${esc(site.name)}. All rights reserved. For informational purposes only.</p></div>
  </div>
</footer>`}

function adUnit(type){
  const ezoicId=process.env.EZOIC_SITE_ID||'';
  const adsenseId=process.env.ADSENSE_ID||'';
  const minH={leaderboard:90,inline:280,sidebar:250,footer:90}[type]||250;
  if(ezoicId){const ids={leaderboard:101,inline:102,sidebar:104,footer:106};return `<div id="ezoic-pub-ad-placeholder-${ids[type]||102}" style="min-height:${minH}px"></div>`;}
  // Nessun ID AdSense configurato → non mostrare box grigi vuoti
  if(!adsenseId) return '';
  const cls={leaderboard:'ad-leader',inline:'ad-inline',sidebar:'ad-sidebar',footer:'ad-footer'};
  const fmt={leaderboard:'leaderboard',inline:'fluid',sidebar:'rectangle',footer:'leaderboard'};
  return `<div class="ad ${cls[type]}" style="min-height:${minH}px"><ins class="adsbygoogle" style="display:block" data-ad-client="${adsenseId}" data-ad-format="${fmt[type]}"></ins></div>`;}

export function renderBase({title,description,slug,siteName,siteUrl,schemas=[],body,adsenseId='',ogImage='',noindex=false,datePublished='',dateModified='',authorUrl='',prevUrl='',nextUrl='',lcpImage='',ga4MeasurementId=''}){
  const canonical=slug?`${siteUrl}/${slug}/`:`${siteUrl}/`;
  const schemasHtml=schemas.map(s=>`<script type="application/ld+json">${JSON.stringify(s)}</script>`).join('\n');
  const robots=noindex?'noindex, follow':'index, follow, max-image-preview:large';
  const ga4Id=ga4MeasurementId||process.env.GA4_MEASUREMENT_ID||'';
  const gscVerification=process.env.GOOGLE_SITE_VERIFICATION||'';
  const ezoicId=process.env.EZOIC_SITE_ID||'';
  const effectiveOgImage=ogImage||(siteUrl?`${siteUrl}/images/og-default.jpg`:'');
  const isArticle=slug&&!slug.startsWith('category/')&&!slug.startsWith('tag/')&&slug!=='about'&&slug!=='contact'&&slug!=='privacy'&&slug!=='terms'&&slug!=='disclaimer'&&slug!=='advertise'&&slug!=='editorial-process';
  return `<!DOCTYPE html><html lang="en" data-adsense="${adsenseId}"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<meta name="robots" content="${robots}"/><meta name="theme-color" content="#1a5c3a"/>
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
${adsenseId?`<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseId}" crossorigin="anonymous"></script>`:''}
${ga4Id?`<script async src="https://www.googletagmanager.com/gtag/js?id=${ga4Id}"></script><script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${ga4Id}',{anonymize_ip:true});</script>`:''}
${ezoicId?`<script src="//www.ezojs.com/ezoic/sa.min.js" async></script>`:''}
${lcpImage?`<link rel="preload" as="image" href="${lcpImage}" fetchpriority="high"/>`:''}
<link rel="icon" type="image/svg+xml" href="/favicon.svg"/><link rel="icon" href="/favicon.ico"/><link rel="apple-touch-icon" href="/apple-touch-icon.png"/>
<link rel="preconnect" href="https://fonts.googleapis.com"/><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
<link rel="preconnect" href="https://pagead2.googlesyndication.com"/><link rel="preconnect" href="https://www.googletagmanager.com"/><link rel="dns-prefetch" href="https://www.google-analytics.com"/>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Source+Serif+4:wght@400;600&display=swap"/>
<link rel="stylesheet" href="/assets/style.v2.css"/>
${getMgidLoader()}</head><body>${body}
${ezoicId?'':COOKIE_BANNER_HTML}<script>${ezoicId?'':COOKIE_BANNER_JS}${EMAIL_FORM_JS}${NATIVE_ADS_JS}</script></body></html>`}

export function renderArticlePage(article,site,relatedArticles=[]){
  const date=new Date(article.date||Date.now());
  const relatedHtml=relatedArticles.slice(0,4).map(r=>`<div class="related-item"><img class="related-img" src="${r.image||`/images/${r.slug}.jpg`}" alt="${esc(r.title)}" loading="lazy" decoding="async" width="400" height="225" onerror="this.style.display='none'"/><a class="related-title" href="/${r.slug}/">${esc(r.title)}</a></div>`).join('');
  const body=`${renderHeader(site)}<main class="site-main"><div class="wrap">
    <header class="art-hdr">
      <div class="art-kicker"><a href="/category/${article.categorySlug||'guides'}/" style="color:inherit;text-decoration:none">${esc(article.category||'Expert Guide')}</a></div>
      <h1 class="art-title">${esc(article.title)}</h1>
      <div class="art-deck">${esc(article.metaDescription)}</div>
      <div class="art-author-row">
        <img class="art-author-avatar" src="/images/author-${esc(site.authorAvatar||'default')}.jpg" alt="${esc(site.authorName)}" loading="lazy" decoding="async" width="44" height="44" onerror="this.style.display='none'"/>
        <div class="art-byline">By <strong>${esc(site.authorName)}</strong> · ${esc(site.authorTitle)} · <time datetime="${date.toISOString()}">${date.toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'})}</time></div>
      </div>
      ${adUnit('leaderboard')}
    </header>
    ${article.image?`<img class="art-hero" src="${article.image}" alt="${esc(article.title)}" loading="eager" fetchpriority="high" decoding="async" width="1200" height="480"/>`:''}
    <div class="art-layout">
      <div class="art-body">${injectMgidInArticle(article.content)}${(()=>{const sn=process.env.DISQUS_SHORTNAME||'';if(!sn)return '';const pu=`${site.url}/${article.slug}/`;return '<div style="margin-top:48px;padding-top:32px;border-top:2px solid var(--border)"><div id="disqus_thread"></div><scr'+'ipt>var disqus_config=function(){this.page.url="'+pu+'";this.page.identifier="'+article.slug+'";};<\/scr'+'ipt><scr'+'ipt>(function(){var d=document,sc=d.createElement("script");sc.src="https://'+sn+'.disqus.com/embed.js";sc.setAttribute("data-timestamp",+new Date());(d.head||d.body).appendChild(sc);})();<\/scr'+'ipt></div>';})()}</div>
      <aside>
        ${adUnit('sidebar')}
        ${relatedHtml?`<div class="sidebar-box"><h3>Related</h3>${relatedHtml}</div>`:''}
        ${site.toolSlug?`<div style='background:#1a5c3a;padding:20px;margin-bottom:20px;border-radius:4px;text-align:center'><strong style='color:#fff;font-size:15px;display:block;margin-bottom:8px'>Free Cost Calculator</strong><p style='color:rgba(255,255,255,.85);font-size:13px;margin:0 0 14px;line-height:1.5'>Get an instant estimate for your project in 60 seconds.</p><a href='/tools/${site.toolSlug}/' style='display:block;background:#c9a84c;color:#1a1a2e;padding:11px 16px;border-radius:3px;font-weight:700;font-size:14px;text-decoration:none'>Calculate My Cost →</a></div>`:''}
        <div class="nl-box"><h3>Weekly Expert Tips</h3><form class="nl-form newsletter-form"><input type="email" placeholder="your@email.com"/><button type="submit">Subscribe</button></form></div>
        ${adUnit('sidebar')}
      </aside>
    </div>
    ${adUnit('leaderboard')}${getMgidSmartWidget()}
  </div></main>${renderFooter(site)}`;
  const pubIso=article.date?new Date(article.date).toISOString():'';
  const modIso=article.updatedAt?new Date(article.updatedAt).toISOString():pubIso;
  return renderBase({title:article.title,description:article.metaDescription,slug:article.slug,siteName:site.name,siteUrl:site.url,schemas:article.schemas||[],body,adsenseId:site.adsenseId,ga4MeasurementId:site.ga4MeasurementId||'',ogImage:article.image?`${site.url}${article.image}`:'',datePublished:pubIso,dateModified:modIso,authorUrl:`${site.url}/author/${site.authorAvatar||''}/`,lcpImage:article.image?`${site.url}${article.image}`:''});
}

export function renderHomePage(articles,site){
  const hero=articles[0];const featured=articles.slice(1,4);const latest=articles.slice(4,20);
  const featuredHtml=featured.length?`<div>${featured.map(a=>`<article class="card" style="margin-bottom:16px"><div class="card-body"><div class="card-cat">${esc(a.category||'Guide')}</div><div class="card-title"><a href="/${a.slug}/">${esc(a.title)}</a></div></div></article>`).join('')}</div>`:'';
  const heroCard=hero?`<article class="card"><div class="card-img"><img src="${hero.image||`/images/${hero.slug}.jpg`}" alt="${esc(hero.title)}" loading="eager" onerror="this.style.display='none'"/></div><div class="card-body"><div class="card-cat">${esc(hero.category||'Featured')}</div><h2 class="card-title" style="font-size:26px"><a href="/${hero.slug}/">${esc(hero.title)}</a></h2><p class="card-excerpt">${esc(hero.excerpt)}</p><div class="card-meta">${esc(hero.author)}</div></div></article>`:'';
  const heroHtml=hero?(featuredHtml?`<div class="hero-layout">${heroCard}${featuredHtml}</div>`:`<div style="margin-bottom:32px;padding-bottom:28px;border-bottom:3px double var(--border)">${heroCard}</div>`):'';

  const gridHtml=latest.length?`<section><h2 class="section-title">Latest Coverage</h2><div class="art-grid">${latest.map(a=>`<article class="card"><div class="card-img"><img src="${a.image||`/images/${a.slug}.jpg`}" alt="${esc(a.title)}" loading="lazy" decoding="async" width="400" height="225" onerror="this.style.display='none'"/></div><div class="card-body"><div class="card-cat">${esc(a.category||'Guide')}</div><h3 class="card-title"><a href="/${a.slug}/">${esc(a.title)}</a></h3><p class="card-excerpt">${esc(a.excerpt)}</p></div></article>`).join('')}</div></section>`:'';
  const h1Html=`<div style="text-align:center;padding:20px 16px 22px;border-bottom:3px double var(--border);margin-bottom:28px;background:var(--light)"><span style="font-size:10px;letter-spacing:3px;text-transform:uppercase;color:var(--muted);display:block;margin-bottom:8px">Your Trusted Source For</span><h1 style="font-family:var(--ff-head);font-size:clamp(20px,3.5vw,32px);color:var(--dark);margin:0 0 10px;font-weight:900;line-height:1.1">${esc(site.tagline||site.name)}</h1><p style="font-size:12px;color:var(--muted);letter-spacing:1.5px;text-transform:uppercase;margin:0">Real costs &amp; expert advice — updated ${new Date().getFullYear()}</p></div>`;
  const body=`${renderHeader(site)}<main class="site-main"><div class="wrap">${adUnit('leaderboard')}${h1Html}${heroHtml}${adUnit('leaderboard')}${gridHtml}${adUnit('leaderboard')}</div></main>${renderFooter(site)}`;
  const orgSchema={'@context':'https://schema.org','@type':'Organization','@id':`${site.url}/#organization`,name:site.name,url:site.url,logo:{'@type':'ImageObject',url:`${site.url}/logo.png`,width:200,height:60}};
  const webSiteSchema={'@context':'https://schema.org','@type':'WebSite','@id':`${site.url}/#website`,url:site.url,name:site.name,description:site.tagline||site.name,potentialAction:{'@type':'SearchAction',target:{'@type':'EntryPoint',urlTemplate:`${site.url}/?s={search_term_string}`},'query-input':'required name=search_term_string'}};
  const heroImg=hero?(hero.image||`/images/${hero.slug}.jpg`):'';
  const metaDesc=site.tagline?`${site.tagline}. Trusted guides, real costs, expert advice.`:`${site.name}: authoritative expert-backed articles.`;
  return renderBase({title:`${site.name} — Expert Coverage & Analysis`,description:metaDesc,siteName:site.name,siteUrl:site.url,body,adsenseId:site.adsenseId,ga4MeasurementId:site.ga4MeasurementId||'',ogImage:hero?`${site.url}${heroImg}`:'',schemas:[orgSchema,webSiteSchema],lcpImage:heroImg?`${site.url}${heroImg}`:''});
}

export function renderCategoryPage(articles,category,site,page=1,totalPages=1){
  const gridHtml=articles.map(a=>`<article class="card"><div class="card-img"><img src="${a.image||`/images/${a.slug}.jpg`}" alt="${esc(a.title)}" loading="lazy" decoding="async" width="400" height="225" onerror="this.style.display='none'"/></div><div class="card-body"><div class="card-cat">${esc(category.name)}</div><h2 class="card-title"><a href="/${a.slug}/">${esc(a.title)}</a></h2><p class="card-excerpt">${esc(a.excerpt||'')}</p><div class="card-meta">${esc(a.author||site.authorName)}</div></div></article>`).join('');
  const schema={'@context':'https://schema.org','@type':'BreadcrumbList',itemListElement:[{'@type':'ListItem',position:1,name:'Home',item:`${site.url}/`},{'@type':'ListItem',position:2,name:category.name,item:`${site.url}/category/${category.slug}/`}]};
  const itemListSchema={'@context':'https://schema.org','@type':'ItemList',name:category.name,numberOfItems:articles.length,itemListElement:articles.slice(0,10).map((a,i)=>({'@type':'ListItem',position:i+1,url:`${site.url}/${a.slug}/`,name:a.title}))};
  const catBase=`${site.url}/category/${category.slug}`;
  const prevUrl=page>1?(page===2?`${catBase}/`:`${catBase}/page/${page-1}/`):'';
  const nextUrl=page<totalPages?`${catBase}/page/${page+1}/`:'';
  const paginationHtml=totalPages>1?`<nav class="pagination" aria-label="Page navigation" style="display:flex;justify-content:center;align-items:center;gap:16px;margin:32px 0;padding:16px 0;border-top:1px solid var(--border)">${page>1?`<a href="${page===2?`/category/${category.slug}/`:`/category/${category.slug}/page/${page-1}/`}" rel="prev" style="padding:8px 20px;border:1px solid var(--border);border-radius:4px;color:var(--dark);text-decoration:none">&#8592; Prev</a>`:'<span style="padding:8px 20px;opacity:.4">&#8592; Prev</span>'}<span style="color:var(--muted);font-size:14px">Page ${page} of ${totalPages}</span>${page<totalPages?`<a href="/category/${category.slug}/page/${page+1}/" rel="next" style="padding:8px 20px;border:1px solid var(--border);border-radius:4px;color:var(--dark);text-decoration:none">Next &#8594;</a>`:'<span style="padding:8px 20px;opacity:.4">Next &#8594;</span>'}</nav>`:'';
  const body=`${renderHeader(site)}<main class="site-main"><div class="wrap">${adUnit('leaderboard')}<div style="margin:20px 0 4px;font-size:13px;color:var(--muted)"><a href="/" style="color:var(--green)">Home</a> › <span>${esc(category.name)}</span></div><h1 class="section-title">${esc(category.name)}</h1><p style="color:var(--muted);margin-bottom:28px;font-size:14px">${articles.length} expert article${articles.length!==1?'s':''}</p><div class="art-grid">${gridHtml}</div>${adUnit('leaderboard')}${paginationHtml}</div></main>${renderFooter(site)}`;
  const pageTitle=page>1?`${category.name} — Page ${page} — ${site.name}`:`${category.name} — ${site.name}`;
  const pageSchemas=page===1?[schema,itemListSchema]:[schema];
  return renderBase({title:pageTitle,description:`Browse ${articles.length} expert articles about ${category.name} on ${site.name}.`,slug:page>1?`category/${category.slug}/page/${page}`:`category/${category.slug}`,siteName:site.name,siteUrl:site.url,schemas:pageSchemas,body,adsenseId:site.adsenseId,ga4MeasurementId:site.ga4MeasurementId||'',ogImage:articles[0]?`${site.url}/images/${articles[0].slug}.jpg`:'',prevUrl,nextUrl});
}

export function render404Page(site){
  const body=`${renderHeader(site)}<main class="site-main"><div class="wrap" style="text-align:center;padding:80px 20px"><h1 style="font-family:'Playfair Display',serif;font-size:48px">404</h1><p style="margin:16px 0 24px;font-size:18px">Page not found</p><a href="/" style="background:#1a5c3a;color:#fff;padding:12px 24px;text-decoration:none;font-weight:700">← Back to Home</a></div></main>${renderFooter(site)}`;
  return renderBase({title:'Page Not Found',description:'Page not found',siteName:site.name,siteUrl:site.url,body,noindex:true,ga4MeasurementId:site.ga4MeasurementId||''});
}

export function renderTagPage(tag, articles, site) {
  const listHtml = articles.slice(0, 40).map(a => `
    <article class="card">
      <div class="card-img"><img src="${a.image||`/images/${a.slug}.jpg`}" alt="${esc(a.title)}" loading="lazy" decoding="async" width="400" height="225" onerror="this.style.display='none'"/></div>
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
  const body = `${renderHeader(site)}<main class="site-main"><div class="wrap">
    ${adUnit('leaderboard')}
    <h1 class="section-title">Topic: ${esc(tag.name)}</h1>
    <p style="color:var(--muted);margin-bottom:28px">${articles.length} article${articles.length !== 1 ? 's' : ''}</p>
    <div class="art-grid">${listHtml}</div>
    ${adUnit('leaderboard')}
  </div></main>${renderFooter(site)}`;
  return renderBase({
    title: `${tag.name} — ${site.name}`,
    description: `Browse ${articles.length} expert articles about ${tag.name} on ${site.name}.`,
    slug: `tag/${tag.slug}`,
    siteName: site.name, siteUrl: site.url,
    schemas: [itemListSchema], body, adsenseId: site.adsenseId,
    ogImage: articles[0] ? `${site.url}/images/${articles[0].slug}.jpg` : ''
  });
}
