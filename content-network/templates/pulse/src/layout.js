/**
 * PULSE — Tabloid style
 * Rosso/navy, breaking ticker, header bold, sidebar ad-heavy
 */
import { COOKIE_BANNER_CSS, COOKIE_BANNER_HTML, COOKIE_BANNER_JS, EMAIL_FORM_JS, NATIVE_ADS_CSS, NATIVE_ADS_JS, getMgidLoader, injectMgidInArticle, getMgidSmartWidget } from '../../shared/snippets.js';

export const CSS = `
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --red:#c0392b;--navy:#1a1a2e;--accent:#e67e22;
  --bg:#f4f4f0;--white:#fff;--border:#ddd;--muted:#666;
  --ff-head:'Merriweather',Georgia,serif;--ff-body:'Open Sans',system-ui,sans-serif;
  --max:1200px;--shadow:0 2px 8px rgba(0,0,0,.1);--r:4px
}
html{font-size:16px;scroll-behavior:smooth;overflow-y:scroll;scrollbar-gutter:stable;overflow-x:hidden}
body{font-family:var(--ff-body);background:var(--bg);color:#1a1a1a;line-height:1.6;overflow-x:hidden}
.wrap{max-width:var(--max);margin:0 auto;padding:0 16px}
a{color:inherit}
img{max-width:100%;height:auto;display:block}

/* Ticker */
.ticker{background:var(--red);color:#fff;display:flex;align-items:center;height:36px;overflow:hidden;clip-path:inset(0);position:sticky;top:0;z-index:100;font-size:13px}
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
.hdr-nav{background:var(--navy);position:sticky;top:0;z-index:90;display:flex;align-items:center;justify-content:center}
.hdr-nav ul{flex:1;list-style:none;display:flex;justify-content:center;flex-wrap:wrap}
.hdr-nav a{display:block;color:rgba(255,255,255,.85);text-decoration:none;padding:10px 16px;font-size:15px;font-weight:600;letter-spacing:.5px;text-transform:uppercase;transition:background .2s}
.hdr-nav a:hover,.hdr-nav a.active{background:var(--red);color:#fff}
.nav-toggle{display:none;background:none;border:none;cursor:pointer;color:rgba(255,255,255,.85);font-size:24px;line-height:1;width:48px;height:48px;align-items:center;justify-content:center;flex-shrink:0}
@media(max-width:640px){.hdr-nav{flex-wrap:wrap;justify-content:flex-end}.nav-toggle{display:flex}.hdr-nav ul{display:none;flex-direction:column;width:100%;order:2}.hdr-nav ul.nav-open{display:flex}.hdr-nav a{padding:14px 20px;border-bottom:1px solid rgba(255,255,255,.1)}}

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
.author-img{width:44px;height:44px;border-radius:50%;object-fit:cover;object-position:center;background:var(--bg)}
.author-name{display:block;font-weight:600;font-size:14px;color:var(--navy)}
.author-title{display:block;font-size:12px;color:var(--muted)}
.art-date{font-size:13px;color:var(--muted)}

/* Ad units — hidden until AdSense fills them */
.ad{border-radius:var(--r);overflow:hidden;min-height:0}
.ad:not(:has(ins.adsbygoogle[data-ad-status="filled"])){min-height:0!important;border:none!important;background:none!important;margin:0!important;padding:0!important}
.mgid-wrap{min-height:0;overflow:hidden}
.ad-leader{width:100%;margin:16px 0}
.ad-inline{width:100%;margin:24px 0}
.ad-sidebar{width:100%}
.ad-footer{width:100%;text-align:center;padding:16px;background:rgba(0,0,0,.2)}

/* Article content */
.art-body{background:#fff;padding:24px;border-radius:var(--r);box-shadow:var(--shadow);overflow-x:hidden;overflow-wrap:break-word;word-break:break-word}
.art-body .article-header{display:none}.art-body .article-hero-image{display:none}.art-body .article-sidebar{display:none}
.faq-answer{display:none;overflow:hidden}.faq-item.faq-open .faq-answer{display:block}.faq-question{cursor:pointer;user-select:none;display:flex;justify-content:space-between;align-items:center;gap:8px}.faq-question::after{content:'+';font-size:20px;font-weight:300;flex-shrink:0;color:var(--red)}.faq-item.faq-open .faq-question::after{content:'−'}
.quick-answer-box{background:#fff5f5!important;border-left-color:var(--red)!important}
.quick-answer-box .qa-label{color:var(--red)!important;font-family:var(--ff-head)}
.quick-answer-box .qa-text{color:var(--navy)!important;font-size:17px!important}
.intro{font-size:18px;line-height:1.7;color:var(--navy);font-weight:500;border-left:4px solid var(--red);padding-left:16px;margin:16px 0 24px}
.art-section{margin:28px 0}
.art-section h2{font-family:var(--ff-head);font-size:22px;font-weight:700;color:var(--navy);margin-top:36px;margin-bottom:12px;padding-bottom:8px;border-bottom:2px solid var(--red)}
.art-section p{margin-bottom:24px;font-size:16px;line-height:1.75}
.art-list{list-style:none;padding-left:0;margin:16px 0}
.art-list li{margin-bottom:8px;line-height:1.65;font-size:16px;padding:11px 16px 11px 52px;background:var(--bg);border-left:3px solid var(--red);position:relative;border-radius:var(--r)}
.art-list li::before{content:"✓";position:absolute;left:14px;color:var(--red);font-weight:700}
.author-note{border-left:4px solid var(--accent);padding:16px 20px;background:#fff8f0;border-radius:0 var(--r) var(--r) 0;margin:24px 0;font-style:italic}
.author-note p{font-size:16px;line-height:1.7;margin-bottom:8px}
.author-note cite{font-size:13px;color:var(--muted);font-style:normal}

/* FAQ */
.faq-wrap{background:#f8f9ff;padding:24px;border-radius:var(--r);margin:28px 0}
.faq-wrap>h2{font-family:var(--ff-head);font-size:20px;margin-top:40px;margin-bottom:16px;color:var(--navy)}
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
.nl-form input{padding:10px 12px;border:none;border-radius:var(--r);font-size:16px;width:100%}
.nl-form button{background:var(--red);color:#fff;border:none;padding:10px;border-radius:var(--r);cursor:pointer;font-weight:600;font-size:14px}
.nl-form button:hover{background:#a93226}

/* Related articles */
.related-item{display:flex;gap:10px;margin-bottom:12px;padding-bottom:12px;border-bottom:1px solid var(--border)}
.related-item:last-child{border-bottom:none;margin-bottom:0;padding-bottom:0}
.related-img{width:70px;height:52px;object-fit:cover;border-radius:3px;flex-shrink:0}
.related-title{font-size:13px;font-weight:600;color:var(--navy);text-decoration:none;line-height:1.4;display:block}
.related-title:hover{color:var(--red)}

/* Homepage */
.hero-grid{display:grid;grid-template-columns:2fr 1fr;gap:24px;margin-bottom:32px;align-items:start}
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
.art-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:20px;margin:24px 0}
.section-title{font-family:var(--ff-head);font-size:22px;color:var(--navy);margin-bottom:20px;padding-bottom:8px;border-bottom:3px solid var(--red)}

/* Compact card sidebar */
.compact-card{display:flex;gap:12px;padding:12px;background:#fff;border-radius:var(--r);margin-bottom:12px;box-shadow:0 1px 4px rgba(0,0,0,.08)}
.compact-img{width:80px;height:60px;object-fit:cover;border-radius:3px;flex-shrink:0}

/* Footer */
.site-footer{background:var(--navy);color:rgba(255,255,255,.8);padding:52px 0 24px;margin-top:48px}
.footer-grid{display:grid;grid-template-columns:2fr 1fr 1fr;gap:32px;margin-bottom:32px}
@media(max-width:600px){.footer-grid{grid-template-columns:1fr}}
.footer-about{text-align:center}.footer-about h3{color:#fff;font-family:var(--ff-head);font-size:20px;margin-bottom:10px}
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
  .trust-box{padding:14px 16px}
  .trust-box-hdr{flex-direction:column;align-items:flex-start}
  .art-section h2,.article-section h2{margin-top:16px}
  .faq-wrap,.article-faq{margin-top:24px;padding-top:16px}
  .key-takeaways{padding:14px 16px}
  .site-main{padding:20px 0 48px}
  .faq-wrap>h2{margin-top:12px}
  .ad-inline{margin:16px 0}
  .ad-leader{margin:8px 0}
}
/* Article hero + cost table */
.art-hero{width:100%;aspect-ratio:16/9;object-fit:cover;object-position:center;display:block;margin:20px 0;border-radius:var(--r)}
.cost-table{width:100%;border-collapse:collapse;margin:24px 0;font-size:15px}
.cost-table th{background:var(--navy);color:#fff;padding:10px 14px;text-align:left;font-family:var(--ff-head);font-size:13px;letter-spacing:.5px;text-transform:uppercase}
.cost-table td{padding:10px 14px;border-bottom:1px solid var(--border);vertical-align:top}
.cost-table tr:nth-child(even) td{background:var(--bg)}
.cost-table tr:hover td{background:#f0ede8}
.cost-table td:last-child{font-weight:700;color:var(--red);white-space:nowrap}
/* FAQ divider */
.faq-wrap,.article-faq{margin-top:40px;padding-top:32px;border-top:3px double var(--border)}
/* Paragraph spacing + article-section compat */
.art-section p,.article-section p,.art-body p{margin-bottom:18px;font-size:16px;line-height:1.85}
.art-section p strong,.article-section p strong{color:var(--navy);font-weight:700}
.article-section{margin:28px 0}
.article-section h2{font-family:var(--ff-head);font-size:22px;font-weight:700;color:var(--navy);margin-top:36px;margin-bottom:12px;padding-bottom:8px;border-bottom:2px solid var(--red)}
/* Trust box */
.trust-box{background:#f3f9f5;border:1px solid #c5ddd0;border-left:5px solid var(--navy);padding:18px 22px;margin:0 0 24px;border-radius:var(--r)}
.trust-box-hdr{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;flex-wrap:wrap;gap:8px}
.trust-box-title{font-family:var(--ff-head);font-size:15px;font-weight:700;color:var(--navy);display:flex;align-items:center;gap:6px}
.trust-box-date{font-size:11px;color:var(--muted);background:rgba(0,0,0,.05);padding:3px 8px;border-radius:10px;white-space:nowrap}
.trust-box-body{font-size:13px;color:#3a4a3a;line-height:1.65;margin-bottom:10px}
.trust-box-footer{display:flex;flex-direction:column;gap:4px;font-size:12px;color:var(--muted);border-top:1px solid #c5ddd0;padding-top:8px;margin-top:4px}
.trust-box-reviewer{color:var(--navy);font-weight:600}
/* Mobile: table overflow */
.art-body table,.art-body .cost-table{display:block;overflow-x:auto;-webkit-overflow-scrolling:touch;max-width:100%}
.art-body img{max-width:100%;height:auto}
/* del/s: always inherit parent color — prevents invisible strikethrough on light-bg boxes */
.art-body del,.art-body s,.art-body strike{color:inherit!important}
/* Inline-styled boxes from content engine: prevent overflow, enforce containment */
.art-body .quick-answer-box,.art-body .key-takeaways,.art-body nav,.art-body .how-to-step,.art-body .article-section{max-width:100%;box-sizing:border-box;overflow-x:hidden}
.art-body .article-content{max-width:100%;overflow-x:hidden}
@media(max-width:480px){
  .wrap{padding:0 10px}
  .art-body{padding:12px}
  .art-hdr{padding:12px 0;margin-bottom:12px}
  .art-section h2,.article-section h2{margin-top:12px;font-size:19px}
  .art-section,.article-section{margin:8px 0}
  .art-section p,.article-section p,.art-body p{margin-bottom:12px;font-size:15px;line-height:1.7}
  .intro{padding-left:10px;margin-bottom:14px;font-size:16px}
  .faq-wrap{padding:14px;margin:12px 0}
  .highlight-box{padding:12px;margin:12px 0}
  .tags{margin-top:16px;padding-top:12px}
  .art-meta{gap:8px;padding:8px 0}
  .author-badge{padding:6px 10px}
  .site-footer{margin-top:32px}
  .art-hero{margin:10px 0}
}
@media(max-width:375px){
  .wrap{padding:0 8px}
  .art-body{padding:10px}
}
${COOKIE_BANNER_CSS}${NATIVE_ADS_CSS}`;

export function renderBase({ title, description, slug, siteName, siteUrl, schemas = [], body, adsenseId = '', ogImage = '', noindex = false, datePublished = '', dateModified = '', authorUrl = '', prevUrl = '', nextUrl = '', lcpImage = '', ga4MeasurementId = '', mgidSiteId = '' }) {
  const canonical = slug ? `${siteUrl}/${slug}/` : `${siteUrl}/`;
  const fixedSchemas = schemas.map(s => s['@type'] !== 'BreadcrumbList' ? s : { ...s, itemListElement: (s.itemListElement || []).map(item => ({ ...item, item: item.item && !item.item.endsWith('/') ? item.item + '/' : item.item })) });
  const schemasHtml = fixedSchemas.map(s =>
    `<script type="application/ld+json">${JSON.stringify(s)}</script>`
  ).join('\n');
  const robots = noindex ? 'noindex, follow' : 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1';
  const ga4Id = ga4MeasurementId || process.env.GA4_MEASUREMENT_ID || '';
  const gscKeys = (process.env.GOOGLE_SITE_VERIFICATION || '').split(',').map(s => s.trim()).filter(Boolean);
  const ezoicId = process.env.EZOIC_SITE_ID || '';
  const effectiveOgImage = ogImage || (siteUrl ? `${siteUrl}/images/og-default.jpg` : '');
  const isArticle = slug && !slug.startsWith('category/') && !slug.startsWith('tag/') && slug !== 'about' && slug !== 'contact' && slug !== 'privacy' && slug !== 'terms' && slug !== 'disclaimer' && slug !== 'advertise' && slug !== 'editorial-process';

  return `<!DOCTYPE html>
<html lang="en" data-adsense="${adsenseId}">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"/>
<meta name="robots" content="${robots}"/>
<meta name="theme-color" content="#c0392b"/>
<meta property="og:locale" content="en_US"/>
${gscKeys.map(k=>`<meta name="google-site-verification" content="${k}"/>`).join('\n')}
<title>${esc(title)} | ${esc(siteName)}</title>
<meta name="description" content="${esc(description)}"/>
<link rel="canonical" href="${canonical}"/>${prevUrl ? `<link rel="prev" href="${prevUrl}"/>` : ''}${nextUrl ? `<link rel="next" href="${nextUrl}"/>` : ''}
<link rel="alternate" type="application/rss+xml" title="${esc(siteName)}" href="${siteUrl}/feed.xml"/>
${authorUrl ? `<link rel="author" href="${authorUrl}"/>` : ''}
<meta property="og:title" content="${esc(title)}"/>
<meta property="og:description" content="${esc(description)}"/>
<meta property="og:url" content="${canonical}"/>
<meta property="og:site_name" content="${esc(siteName)}"/>
<meta property="og:type" content="${isArticle ? 'article' : 'website'}"/>
${effectiveOgImage ? `<meta property="og:image" content="${effectiveOgImage}"/><meta property="og:image:width" content="1200"/><meta property="og:image:height" content="630"/><meta name="twitter:image" content="${effectiveOgImage}"/>` : ''}
${isArticle && datePublished ? `<meta property="og:article:published_time" content="${datePublished}"/>` : ''}
${isArticle && (dateModified || datePublished) ? `<meta property="og:article:modified_time" content="${dateModified || datePublished}"/>` : ''}
<meta name="twitter:card" content="summary_large_image"/>
<meta name="twitter:title" content="${esc(title)}"/>
<meta name="twitter:description" content="${esc(description)}"/>
${schemasHtml}
${adsenseId ? `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseId}" crossorigin="anonymous"></script>` : ''}
${ga4Id ? `<script async src="https://www.googletagmanager.com/gtag/js?id=${ga4Id}"></script><script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${ga4Id}',{anonymize_ip:true});</script>` : ''}
${ezoicId ? `<script src="//www.ezojs.com/ezoic/sa.min.js" async></script>` : ''}
${lcpImage ? `<link rel="preload" as="image" href="${lcpImage}" fetchpriority="high"/>` : ''}
<link rel="icon" type="image/svg+xml" href="/favicon.svg"/><link rel="icon" href="/favicon.ico"/>
<link rel="apple-touch-icon" href="/apple-touch-icon.png"/>
<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
<link rel="preconnect" href="https://pagead2.googlesyndication.com"/>
<link rel="preconnect" href="https://www.googletagmanager.com"/>
<link rel="dns-prefetch" href="https://www.google-analytics.com"/>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Merriweather:wght@700;900&family=Open+Sans:wght@400;500;600&display=swap"/>
<link rel="stylesheet" href="/assets/style.v2.css"/>
${getMgidLoader(mgidSiteId)}</head>
<body>
${body}
${ezoicId ? '' : COOKIE_BANNER_HTML}
<script>
${ezoicId ? '' : COOKIE_BANNER_JS}
${EMAIL_FORM_JS}
${NATIVE_ADS_JS}
document.querySelectorAll('.mgid-wrap').forEach(function(w){var i=w.querySelector('[data-type="_mgwidget"]');if(!i)return;new MutationObserver(function(m,o){if(i.children.length>0){w.style.margin='32px 0';o.disconnect();}}).observe(i,{childList:true,subtree:true});});
// Collapse unfilled ad slots — works on all browsers (no !important in inline styles)
(function(){var c=function(el){el.style.display='none';el.style.height='0';el.style.minHeight='0';el.style.margin='0';el.style.padding='0';el.style.overflow='hidden';el.style.border='none';};if(window.MutationObserver){document.querySelectorAll('ins.adsbygoogle').forEach(function(ins){var ad=ins.closest&&ins.closest('.ad');if(!ad)return;new MutationObserver(function(){var s=ins.getAttribute('data-ad-status');if(s&&s!=='filled')c(ad);else if(s==='filled'){ad.style.display='';ad.style.height='';ad.style.minHeight='';ad.style.margin='';ad.style.padding='';}}).observe(ins,{attributes:true,attributeFilter:['data-ad-status']});});}setTimeout(function(){document.querySelectorAll('.ad').forEach(function(d){var ins=d.querySelector('ins.adsbygoogle');if(!ins||ins.getAttribute('data-ad-status')!=='filled')c(d);});},3000);})();
// Trending ticker
fetch('/api/trending.json').then(r=>r.json()).then(arts=>{
  var el=document.getElementById('ticker-inner');
  var wrap=document.getElementById('ticker-wrap');
  if(!el||!wrap||!arts.length)return;
  el.innerHTML=arts.slice(0,8).map(a=>'<a href="/'+a.slug+'/">'+a.title+'</a>').join('<span style="opacity:.5;margin:0 6px">•</span>');
  wrap.style.display='flex';
  var nav=document.querySelector('.hdr-nav');
  if(nav)nav.style.top='36px';
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
  const starsHtml=(()=>{if(!article.rating)return '';const tot=(article.rating.thumbsUp||0)+(article.rating.thumbsDown||0);if(tot<5)return '';const rv=parseFloat(((article.rating.thumbsUp/tot)*4+1).toFixed(1));const full=Math.floor(rv);const stars='★'.repeat(full)+'☆'.repeat(5-full);return `<span style="color:#e67e22;font-size:14px;letter-spacing:1px;margin-left:10px;">${stars}</span><span style="font-size:12px;color:#888;margin-left:4px;">${rv}/5 (${tot})</span>`;})();
  const updatedDate=article.updatedAt?new Date(article.updatedAt):null;
  const showUpdated=updatedDate&&(updatedDate-date)>7*86400000;
  const updatedStr=showUpdated?updatedDate.toLocaleDateString('en-US',{month:'long',year:'numeric'}):'';
  const updatedBadgeHtml=showUpdated?`<span style="color:var(--muted);font-size:11px;margin-left:8px;">· Reviewed ${updatedStr}</span>`:'';
  const reviewer=site.reviewer||null;
  const factCheckHtml=(site.ymyl&&reviewer?.name)?`<div style="display:inline-flex;align-items:center;gap:6px;background:#fff0f0;border:1px solid #f5c6cb;border-radius:4px;padding:5px 12px;margin-top:10px;font-size:13px;color:var(--red);"><span>✓</span><span>Fact-checked by <strong>${esc(reviewer.name)}</strong>${reviewer.title?', '+esc(reviewer.title):''}</span></div>`:'';

  const relatedHtml = relatedArticles.slice(0, 5).map(r => `
    <div class="related-item">
      <img class="related-img" src="${r.image||'/images/'+r.slug+'.jpg'}" alt="${esc(r.title)}" loading="lazy" decoding="async" width="400" height="225" onerror="this.style.display='none'"/>
      <a class="related-title" href="/${r.slug}/">${esc(r.title)}</a>
    </div>`).join('');

  const slugifyTag=s=>s.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
  const tagsHtml=(article.tags||[]).length?`<div class="article-tags"><span class="tags-label">Topics:</span>${(article.tags||[]).map(t=>`<a href="/tag/${slugifyTag(t)}" class="tag">${t}</a>`).join('')}</div>`:'';
  const trustBlockHtml = buildTrustBlock(article, site);
  const calcCtaHtml = site.toolSlug ? `<div style="background:linear-gradient(135deg,var(--navy),#0d0d1f);padding:24px;margin:32px 0 0;border-radius:var(--r);text-align:center"><strong style="color:#fff;font-size:16px;display:block;margin-bottom:8px">Free Rate Calculator</strong><p style="color:rgba(255,255,255,.85);font-size:14px;margin:0 0 16px;line-height:1.5">Get your personalized estimate in 60 seconds.</p><a href="/tools/${site.toolSlug}/" style="display:inline-block;background:var(--red);color:#fff;padding:12px 28px;border-radius:var(--r);font-weight:700;font-size:15px;text-decoration:none">Calculate Now →</a></div>` : '';

  const body = `
${renderHeader(site)}
<main class="site-main">
  <div class="wrap">
    <header class="art-hdr">
      <div class="breadcrumb"><a href="/">Home</a> › ${article.categorySlug ? `<a href="/category/${article.categorySlug}/">${esc(article.category)}</a> › ` : ''}<span>${esc(title)}</span></div>
      <h1 class="art-title">${esc(title)}</h1>
      <div class="art-meta">
        <div class="author">
          <img class="author-img" src="/images/author-${esc(site.authorAvatar||'default')}.jpg" alt="${esc(site.authorName)}" loading="lazy" decoding="async" width="44" height="44" onerror="this.style.display='none'"/>
          <div>
            <span class="author-name">${esc(site.authorName)}</span>
            <span class="author-title">${esc(site.authorTitle)}</span>
          </div>
        </div>
        <time class="art-date" datetime="${dateIso}">${dateStr}</time>${updatedBadgeHtml}<span class="art-readtime"> · ${Math.max(1,Math.ceil((article.wordCount||article.content.replace(/<[^>]+>/g,'').split(/\s+/).length)/200))} min read</span>${starsHtml}
      </div>
      ${factCheckHtml?`<div style="margin:8px 0 0">${factCheckHtml}</div>`:''}
      ${adUnit('leaderboard')}
    </header>
    ${article.image?`<img class="art-hero" src="${article.image}" alt="${esc(title)}" loading="eager" fetchpriority="high" decoding="async" width="1200" height="480"/>`:``}
    ${trustBlockHtml}

    <div class="art-layout">
      <div class="art-body">
        ${injectCalcCtaMidArticle(injectMgidInArticle(content, site.mgidInArticleId), calcCtaHtml)}
        ${tagsHtml}
        ${site.ymyl ? `<div style="margin:36px 0 0;padding:16px 20px;background:#fffbeb;border:1px solid #fde68a;border-left:4px solid #f59e0b;border-radius:4px">
  <p style="font-size:13px;line-height:1.65;margin:0;color:#78350f"><strong style="display:block;margin-bottom:4px">Insurance Information Disclosure</strong>This article is for educational and informational purposes only. It does not constitute professional insurance advice, a solicitation, or a recommendation to purchase any specific policy. Premium estimates and coverage terms vary significantly by insurer, state, age, claims history, and individual underwriting criteria. Always compare quotes from multiple licensed carriers and consult a licensed insurance professional before making coverage decisions. <a href="/disclaimer/" style="color:#92400e;font-weight:600;text-decoration:underline">Read our full disclaimer →</a></p>
</div>` : ''}
        ${(() => {
          const shortname = process.env.DISQUS_SHORTNAME || '';
          if (!shortname) return '';
          const pageUrl = `${site.url}/${slug}/`;
          return `<div style="margin-top:48px;padding-top:32px;border-top:2px solid #eee;">
  <div id="disqus_thread"></div>
  <script>
    var disqus_config = function() {
      this.page.url = '${pageUrl}';
      this.page.identifier = '${slug}';
    };
    (function() {
      var d = document, s = d.createElement('script');
      s.src = 'https://${shortname}.disqus.com/embed.js';
      s.setAttribute('data-timestamp', +new Date());
      (d.head || d.body).appendChild(s);
    })();
  </script>
</div>`;
        })()}
      </div>
      <aside class="sidebar">
        ${adUnit('sidebar')}
        ${relatedHtml ? `<div class="sidebar-box"><h3>Related Articles</h3>${relatedHtml}</div>` : ''}
        ${adUnit('sidebar')}
        ${site.toolSlug?`<div style='background:#c0392b;padding:20px;margin-bottom:20px;border-radius:4px;text-align:center'><strong style='color:#fff;font-size:15px;display:block;margin-bottom:8px'>Free Cost Calculator</strong><p style='color:rgba(255,255,255,.85);font-size:13px;margin:0 0 14px;line-height:1.5'>Get an instant estimate for your project in 60 seconds.</p><a href='/tools/${site.toolSlug}/' style='display:block;background:#f8f8f8;color:#c0392b;padding:11px 16px;border-radius:3px;font-weight:700;font-size:14px;text-decoration:none'>Calculate My Cost →</a></div>`:''}
        <div class="sidebar-newsletter">
          <h3>Get Expert Tips Weekly</h3>
          <form class="nl-form newsletter-form">
            <input type="email" placeholder="your@email.com"/>
            <button type="submit">Subscribe Free</button>
          </form>
        </div>
        ${adUnit('sidebar')}
      </aside>
    </div>
${getMgidSmartWidget(site.mgidSmartId)}
  </div>
</main>
${renderFooter(site)}
<script>(function(){document.querySelectorAll('.faq-item').forEach(function(item,i){if(i===0)item.classList.add('faq-open');var q=item.querySelector('.faq-question');if(!q)return;q.addEventListener('click',function(){item.classList.toggle('faq-open');});});})();</script>`;

  const pubIso = article.date ? new Date(article.date).toISOString() : '';
  const modIso = article.updatedAt ? new Date(article.updatedAt).toISOString() : pubIso;
  return renderBase({ title, description: metaDescription, slug, siteName: site.name, siteUrl: site.url, schemas, body, adsenseId: site.adsenseId, ga4MeasurementId: site.ga4MeasurementId || '', mgidSiteId: site.mgidSiteId || '', ogImage: article.image ? `${site.url}${article.image}` : `${site.url}/images/${slug}.jpg`, datePublished: pubIso, dateModified: modIso, authorUrl: `${site.url}/author/${site.authorAvatar}/`, lcpImage: article.image ? `${site.url}${article.image}` : `${site.url}/images/${slug}.jpg` });
}

export function renderHomePage(articles, site) {
  const hero = articles[0];
  const featured = articles.slice(1, 5);
  const latest = articles.slice(5, 14);

  const featuredHtml = featured.length ? `<div>${featured.map(a => `
        <div class="compact-card">
          <img class="compact-img" src="${a.image||'/images/'+a.slug+'.jpg'}" alt="${esc(a.title)}" loading="lazy" decoding="async" width="400" height="225" onerror="this.style.display='none'"/>
          <div>
            <div class="card-cat" style="font-size:10px">${esc(a.category || 'Guide')}</div>
            <a href="/${a.slug}/" style="font-family:'Merriweather',serif;font-size:14px;font-weight:700;color:#1a1a2e;text-decoration:none;line-height:1.3;display:block">${esc(a.title)}</a>
          </div>
        </div>`).join('')}
      </div>` : '';
  const heroCard = hero ? `<article class="card">
        <div class="card-img"><img src="${hero.image||'/images/'+hero.slug+'.jpg'}" alt="${esc(hero.title)}" loading="eager" onerror="this.style.display='none'"/></div>
        <div class="card-body">
          <div class="card-cat">${esc(hero.category || 'Featured')}</div>
          <h2 class="card-title" style="font-size:28px"><a href="/${hero.slug}/">${esc(hero.title)}</a></h2>
          <p class="card-excerpt">${esc(hero.excerpt)}</p>
          <div class="card-meta"><span>${esc(hero.author)}</span></div>
        </div>
      </article>` : '';
  const heroHtml = hero ? (featuredHtml ? `<section class="hero-grid">${heroCard}${featuredHtml}</section>` : `<section style="margin-bottom:32px;padding-bottom:28px;border-bottom:3px double var(--border)">${heroCard}</section>`) : '';

  const gridHtml = latest.length ? `
    <section>
      <h2 class="section-title">Latest Articles</h2>
      <div class="art-grid">
        ${latest.map(a => `
          <article class="card">
            <div class="card-img"><img src="${a.image||'/images/'+a.slug+'.jpg'}" alt="${esc(a.title)}" loading="lazy" decoding="async" width="400" height="225" onerror="this.style.display='none'"/></div>
            <div class="card-body">
              <div class="card-cat">${esc(a.category || 'Guide')}</div>
              <h3 class="card-title"><a href="/${a.slug}/">${esc(a.title)}</a></h3>
              <p class="card-excerpt">${esc(a.excerpt)}</p>
              <div class="card-meta"><span>${esc(a.author)}</span></div>
            </div>
          </article>`).join('')}
      </div>
    </section>` : '<p style="text-align:center;padding:48px;color:#999">Articles coming soon...</p>';

  // Category sections: group all articles by category, show up to 4 per category
  const byCategory = {};
  for (const a of articles) {
    const key = a.categorySlug || 'general';
    if (!byCategory[key]) byCategory[key] = [];
    byCategory[key].push(a);
  }
  const catsWithArticles = (site.categories || []).filter(c => byCategory[c.slug]?.length >= 1);
  const categorySectionsHtml = catsWithArticles.length >= 2 ? catsWithArticles.map(cat => {
    const catArticles = byCategory[cat.slug].slice(0, 4);
    const total = byCategory[cat.slug].length;
    return `
    <section style="margin-top:44px">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;padding-bottom:8px;border-bottom:3px solid var(--red)">
        <h2 style="font-family:var(--ff-head);font-size:22px;font-weight:700;color:var(--navy);margin:0">${esc(cat.name)}</h2>
        <a href="/category/${cat.slug}/" style="font-size:13px;color:var(--red);font-weight:700;text-decoration:none;white-space:nowrap">See all${total > 1 ? ` (${total})` : ''} →</a>
      </div>
      <div class="art-grid">
        ${catArticles.map(a => `
          <article class="card">
            <div class="card-img"><img src="${a.image||'/images/'+a.slug+'.jpg'}" alt="${esc(a.title)}" loading="lazy" decoding="async" width="400" height="225" onerror="this.style.display='none'"/></div>
            <div class="card-body">
              <h3 class="card-title"><a href="/${a.slug}/">${esc(a.title)}</a></h3>
              <p class="card-excerpt">${esc(a.excerpt)}</p>
              <div class="card-meta"><span>${esc(a.author)}</span></div>
            </div>
          </article>`).join('')}
      </div>
    </section>`;
  }).join('') : '';

  const h1Html = `<div style="background:var(--accent);color:#fff;text-align:center;padding:20px 16px;margin-bottom:24px;border-radius:2px"><h1 style="font-size:clamp(18px,3.5vw,30px);font-weight:900;margin:0 0 8px;line-height:1.15">${esc(site.tagline||site.name)}</h1>${site.homepageSubline?`<p style="font-size:12px;color:var(--muted);letter-spacing:1.5px;margin:0;text-transform:uppercase">${esc(site.homepageSubline)}</p>`:''}</div>`;
  const costTrackerHtml=site.costTrackerData?.length?`<section style="margin:0 0 28px;padding:16px 20px;border:1px solid var(--border,#e2e8f0)"><div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;padding-bottom:10px;border-bottom:1px solid var(--border,#e2e8f0)"><h2 style="margin:0;font-size:15px;font-weight:700">📈 Price Index</h2><a href="/cost-tracker/" style="font-size:13px;font-weight:700;color:#c0392b;text-decoration:none">Full Tracker →</a></div><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:10px">${site.costTrackerData.map(m=>`<div style="padding:10px;border:1px solid var(--border,#e2e8f0)"><div style="font-size:10px;color:var(--muted,#888);margin-bottom:3px;text-transform:uppercase">${esc(m.label)}</div><div style="font-size:18px;font-weight:800">${m.unit==='%'?m.value.toFixed(2)+'%':m.unit==='usd'?'$'+m.value.toFixed(2):m.value.toFixed(1)}</div>${m.delta!=null?`<div style="font-size:11px;color:${m.delta>=0?'#e53e3e':'#38a169'};margin-top:2px">${m.delta>=0?'▲':'▼'} ${Math.abs(m.delta).toFixed(1)}% MoM</div>`:''}</div>`).join('')}</div></section>`:'';
  const body = `
${renderHeader(site)}
<main class="site-main">
  <div class="wrap">
    ${adUnit('leaderboard')}
    ${h1Html}
    ${heroHtml}
    ${costTrackerHtml}
    ${adUnit('leaderboard')}
    ${gridHtml}
    ${categorySectionsHtml}
  </div>
</main>
${renderFooter(site)}`;

  const orgSchema = {
    '@context': 'https://schema.org', '@type': 'Organization',
    '@id': `${site.url}/#organization`, name: site.name, url: site.url,
    logo: { '@type': 'ImageObject', url: `${site.url}/logo.png`, width: 200, height: 60 }
  };
  const webSiteSchema = {
    '@context': 'https://schema.org', '@type': 'WebSite',
    '@id': `${site.url}/#website`, url: site.url, name: site.name,
    description: site.tagline || site.name,
    potentialAction: { '@type': 'SearchAction', target: { '@type': 'EntryPoint', urlTemplate: `${site.url}/?s={search_term_string}` }, 'query-input': 'required name=search_term_string' }
  };
  const itemListSchema = articles.length ? {
    '@context': 'https://schema.org', '@type': 'ItemList',
    name: `Latest Articles — ${site.name}`,
    numberOfItems: Math.min(articles.length, 10),
    itemListElement: articles.slice(0, 10).map((a, i) => ({
      '@type': 'ListItem', position: i + 1,
      url: `${site.url}/${a.slug}/`, name: a.title
    }))
  } : null;
  const heroImg = hero ? (hero.image || `/images/${hero.slug}.jpg`) : '';
  const metaDesc = site.tagline ? `${site.tagline}. Trusted guides, real data, expert advice.` : `${site.name}: trusted source for expert guides, practical advice, and in-depth how-to articles.`;
  return renderBase({
    title: `Expert Guides & How-To Articles`,
    description: metaDesc,
    siteName: site.name, siteUrl: site.url, body, adsenseId: site.adsenseId, ga4MeasurementId: site.ga4MeasurementId || '',
    ogImage: heroImg ? `${site.url}${heroImg}` : '',
    schemas: [orgSchema, webSiteSchema, ...(itemListSchema ? [itemListSchema] : [])],
    lcpImage: heroImg ? `${site.url}${heroImg}` : '',
    mgidSiteId: site.mgidSiteId || ''
  });
}

export function render404Page(site) {
  const body = `
${renderHeader(site)}
<main class="site-main">
  <div class="wrap" style="text-align:center;padding:80px 20px">
    <h1 style="font-family:'Merriweather',serif;font-size:48px;color:#c0392b;margin-bottom:16px">404</h1>
    <p style="font-size:20px;margin-bottom:24px">Page not found</p>
    <a href="/" style="background:#c0392b;color:#fff;padding:12px 24px;border-radius:4px;text-decoration:none;font-weight:600">← Back to Home</a>
  </div>
</main>
${renderFooter(site)}`;
  return renderBase({ title: 'Page Not Found', description: 'Page not found', siteName: site.name, siteUrl: site.url, body, noindex: true, ga4MeasurementId: site.ga4MeasurementId || '' });
}

export function renderCategoryPage(articles, category, site, page = 1, totalPages = 1) {
  const gridHtml = articles.map(a => `
    <article class="card">
      <div class="card-img"><img src="${a.image||'/images/'+a.slug+'.jpg'}" alt="${esc(a.title)}" loading="lazy" decoding="async" width="400" height="225" onerror="this.style.display='none'"/></div>
      <div class="card-body">
        <div class="card-cat">${esc(category.name)}</div>
        <h2 class="card-title"><a href="/${a.slug}/">${esc(a.title)}</a></h2>
        <p class="card-excerpt">${esc(a.excerpt || '')}</p>
        <div class="card-meta"><span>${esc(a.author || site.authorName)}</span></div>
      </div>
    </article>`).join('');

  const breadcrumbSchema = { '@context':'https://schema.org','@type':'BreadcrumbList',itemListElement:[
    {'@type':'ListItem',position:1,name:'Home',item:`${site.url}/`},
    {'@type':'ListItem',position:2,name:category.name,item:`${site.url}/category/${category.slug}/`}
  ]};

  const itemListSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: category.name,
    numberOfItems: articles.length,
    itemListElement: articles.slice(0, 10).map((a, i) => ({
      '@type': 'ListItem', position: i + 1,
      url: `${site.url}/${a.slug}/`, name: a.title
    }))
  };

  const catBase = `${site.url}/category/${category.slug}`;
  const prevUrl = page > 1 ? (page === 2 ? `${catBase}/` : `${catBase}/page/${page - 1}/`) : '';
  const nextUrl = page < totalPages ? `${catBase}/page/${page + 1}/` : '';
  const paginationHtml = totalPages > 1 ? `<nav class="pagination" aria-label="Page navigation" style="display:flex;justify-content:center;align-items:center;gap:16px;margin:32px 0;padding:16px 0;border-top:1px solid var(--border)">${page > 1 ? `<a href="${page === 2 ? `/category/${category.slug}/` : `/category/${category.slug}/page/${page - 1}/`}" rel="prev" style="padding:8px 20px;border:1px solid var(--border);border-radius:4px;color:var(--navy);text-decoration:none">&#8592; Prev</a>` : '<span style="padding:8px 20px;opacity:.4">&#8592; Prev</span>'}<span style="color:var(--muted);font-size:14px">Page ${page} of ${totalPages}</span>${page < totalPages ? `<a href="/category/${category.slug}/page/${page + 1}/" rel="next" style="padding:8px 20px;border:1px solid var(--border);border-radius:4px;color:var(--navy);text-decoration:none">Next &#8594;</a>` : '<span style="padding:8px 20px;opacity:.4">Next &#8594;</span>'}</nav>` : '';

  const body = `
${renderHeader(site)}
<main class="site-main">
  <div class="wrap">
    <div class="ad ad-leader"><ins class="adsbygoogle" style="display:block" data-ad-format="leaderboard"></ins></div>
    <div class="breadcrumb" style="margin:16px 0 4px"><a href="/">Home</a> › <span>${esc(category.name)}</span></div>
    <h1 class="section-title">${esc(category.name)}</h1>
    <p style="color:var(--muted);margin-bottom:28px">${articles.length} expert article${articles.length !== 1 ? 's' : ''}</p>
    <div class="art-grid">${gridHtml}</div>
    <div class="ad ad-leader" style="margin-top:32px"><ins class="adsbygoogle" style="display:block" data-ad-format="leaderboard"></ins></div>
    ${paginationHtml}
  </div>
</main>
${renderFooter(site)}`;

  const pageTitle = page > 1 ? `${category.name} — Page ${page}` : `${category.name}`;
  const pageSchemas = page === 1 ? [breadcrumbSchema, itemListSchema] : [breadcrumbSchema];
  return renderBase({
    title: pageTitle,
    description: `Browse ${articles.length} expert articles about ${category.name} on ${site.name}. Practical guides, cost estimates, and how-to advice.`,
    slug: page > 1 ? `category/${category.slug}/page/${page}` : `category/${category.slug}`,
    siteName: site.name, siteUrl: site.url,
    schemas: pageSchemas, body, adsenseId: site.adsenseId, ga4MeasurementId: site.ga4MeasurementId || '',
    ogImage: articles[0] ? `${site.url}/images/${articles[0].slug}.jpg` : '',
    prevUrl, nextUrl
  });
}

export function renderTagPage(tag, articles, site) {
  const listHtml = articles.slice(0, 40).map(a => `
    <article class="card">
      <div class="card-img"><img src="${a.image||'/images/'+a.slug+'.jpg'}" alt="${esc(a.title)}" loading="lazy" decoding="async" width="400" height="225" onerror="this.style.display='none'"/></div>
      <div class="card-body">
        <div class="card-cat">${esc(a.category || '')}</div>
        <h2 class="card-title"><a href="/${a.slug}/">${esc(a.title)}</a></h2>
        <p class="card-excerpt">${esc(a.excerpt || '')}</p>
      </div>
    </article>`).join('');

  const body = `
${renderHeader(site)}
<main class="site-main">
  <div class="wrap">
    <div class="breadcrumb" style="margin:16px 0 4px"><a href="/">Home</a> › <span>Topic: ${esc(tag.name)}</span></div>
    <h1 class="section-title">Topic: ${esc(tag.name)}</h1>
    <p style="color:var(--muted);margin-bottom:28px">${articles.length} article${articles.length !== 1 ? 's' : ''}</p>
    <div class="art-grid">${listHtml}</div>
  </div>
</main>
${renderFooter(site)}`;

  const itemListSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: tag.name,
    numberOfItems: articles.length,
    itemListElement: articles.slice(0, 10).map((a, i) => ({
      '@type': 'ListItem', position: i + 1,
      url: `${site.url}/${a.slug}/`, name: a.title
    }))
  };

  return renderBase({
    title: `${tag.name}`,
    description: `Browse ${articles.length} expert articles about ${tag.name} on ${site.name}.`,
    slug: `tag/${tag.slug}`,
    siteName: site.name, siteUrl: site.url,
    schemas: articles.length >= 3 ? [itemListSchema] : [], body, adsenseId: site.adsenseId, ga4MeasurementId: site.ga4MeasurementId || '',
    ogImage: articles[0] ? `${site.url}/images/${articles[0].slug}.jpg` : '',
    noindex: articles.length < 3
  });
}

// ── Shared partials ──────────────────────────────────────────
export function renderHeader(site) {
  return `
<div class="ticker" id="ticker-wrap" style="display:none">
  <span class="ticker-lbl">TRENDING</span>
  <div class="ticker-track"><div class="ticker-inner" id="ticker-inner"></div></div>
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
      <div class="hdr-ad ad"></div>
    </div>
  </div>
  <nav class="hdr-nav">
    <div class="wrap" style="display:flex;align-items:center">
      <button class="nav-toggle" id="nav-toggle" aria-label="Open menu" aria-expanded="false">&#9776;</button>
      <ul id="main-nav" style="list-style:none">
        <li><a href="/">Home</a></li>
        ${(site.categories||[]).map(c=>`<li><a href="/category/${c.slug}/">${esc(c.name)}</a></li>`).join('')}
        ${site.toolSlug?`<li><a href="/tools/${site.toolSlug}/" style="color:#e67e22;font-weight:700">${site.toolLabel||'Free Calculator'}</a></li>`:''}
        ${site.hasCostTracker?`<li><a href="/cost-tracker/">Cost Tracker</a></li>`:''}
      </ul>
    </div>
  </nav>
</header>
<script>document.getElementById('nav-toggle')?.addEventListener('click',function(){var u=document.getElementById('main-nav');var o=u.classList.toggle('nav-open');this.setAttribute('aria-expanded',String(o));this.innerHTML=o?'&#10005;':'&#9776;'});</script>`;
}

export function renderFooter(site) {
  return `
<footer class="site-footer">
  ${adUnit('footer')}
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
          <li><a href="/glossary/">Glossary</a></li>
          <li><a href="/data/">Data</a></li>
        </ul>
      </div>
      <div class="footer-col">
        <h4>Legal &amp; Standards</h4>
        <ul>
          <li><a href="/privacy/">Privacy Policy</a></li>
          <li><a href="/terms/">Terms of Service</a></li>
          <li><a href="/disclaimer/">Disclaimer</a></li>
          <li><a href="/methodology/">Our Methodology</a></li>
          <li><a href="/editorial-process/">Editorial Process</a></li>
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

// Ad unit helper — switches between Ezoic placeholders and AdSense <ins> based on env
// Ezoic placeholder IDs must match what you configure in the Ezoic dashboard:
//   101 = top leaderboard, 102 = inline/in-article, 104 = sidebar, 106 = footer
function adUnit(type) {
  const ezoicId = process.env.EZOIC_SITE_ID || '';
  const adsenseId = process.env.ADSENSE_ID || '';
  const minH = { leaderboard: 90, inline: 280, sidebar: 250, footer: 90 }[type] || 250;
  if (ezoicId) {
    const ids = { leaderboard: 101, inline: 102, sidebar: 104, footer: 106 };
    return `<div id="ezoic-pub-ad-placeholder-${ids[type] || 102}" style="min-height:${minH}px"></div>`;
  }
  if (!adsenseId) return '';
  const cls = { leaderboard: 'ad-leader', inline: 'ad-inline', sidebar: 'ad-sidebar', footer: 'ad-footer' };
  const fmt = { leaderboard: 'leaderboard', inline: 'fluid', sidebar: 'rectangle', footer: 'leaderboard' };
  return `<div class="ad ${cls[type]}"><ins class="adsbygoogle" style="display:block" data-ad-client="${adsenseId}" data-ad-format="${fmt[type]}"></ins></div>`;
}

function esc(str = '') {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function injectCalcCtaMidArticle(html,ctaHtml){
  if(!ctaHtml)return html;
  const marker='class="article-section"';
  const idx=html.indexOf(marker);
  if(idx===-1)return html;
  const idx2=html.indexOf(marker,idx+marker.length);
  if(idx2===-1)return html;
  // step back to the opening tag '<'
  const tagStart=html.lastIndexOf('<',idx2);
  return html.slice(0,tagStart)+ctaHtml+html.slice(tagStart);
}

function buildTrustBlock(article,site){
  const date=new Date(article.date||Date.now());
  const dateStr=date.toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'});
  const rev=site.reviewer;
  const reviewerHtml=rev?`<span class="trust-box-reviewer">Reviewed by ${esc(rev.name)}</span><span>${esc(rev.title)}${rev.credentials?` · ${esc(rev.credentials)}`:''}</span>`:'';
  const sourcesHtml=site.trustSources?`<span>Data sources: ${esc(site.trustSources)}</span>`:'';
  const ymylHtml=site.ymyl?`<span style="color:#b45309;font-weight:600">⚠ Financial &amp; insurance content. Consult a licensed professional before making decisions.</span>`:'';
  const footerItems=[reviewerHtml,sourcesHtml,ymylHtml].filter(Boolean).join('');
  return `<div class="trust-box"><div class="trust-box-hdr"><span class="trust-box-title">✓ Editorial Standards</span><span class="trust-box-date">Updated ${esc(dateStr)}</span></div>${site.trustMethodology?`<div class="trust-box-body">${esc(site.trustMethodology)}</div>`:''}${footerItems?`<div class="trust-box-footer">${footerItems}</div>`:''}</div>`;
}
