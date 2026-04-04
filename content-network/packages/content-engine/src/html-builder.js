/**
 * Converte il JSON generato da Claude in HTML semantico
 * Ottimizzato per SEO e ad placement
 */

import { buildArticleSchema, buildFAQSchema, buildBreadcrumbSchema, buildHowToSchema } from './schema.js';

const NEWS_TEMPLATES = new Set(['pulse', 'tribune']);

// Ad unit helper — returns '' when no ad network configured (avoids CLS flash)
function adUnit(type) {
  const ezoicId = process.env.EZOIC_SITE_ID || '';
  const adsenseId = process.env.ADSENSE_ID || '';
  if (ezoicId) {
    const ids = { inline: 102, inline2: 103, sidebar: 104 };
    const minH = type === 'sidebar' ? 250 : 280;
    return `<div id="ezoic-pub-ad-placeholder-${ids[type] || 102}" style="min-height:${minH}px"></div>`;
  }
  // No ad network configured — return empty to avoid layout flash
  if (!adsenseId) return '';
  if (type === 'sidebar') {
    return `<div class="ad ad-sidebar"><ins class="adsbygoogle" style="display:block" data-ad-client="${adsenseId}" data-ad-format="rectangle"></ins></div>`;
  }
  // min-height:0 overrides the CSS class — fluid in-article ads size themselves; blank slot = 0px not 280px
  return `<div class="ad ad-inline" style="min-height:0"><ins class="adsbygoogle" style="display:block;text-align:center" data-ad-client="${adsenseId}" data-ad-format="fluid" data-ad-layout="in-article"></ins></div>`;
}

const AD_UNIT_INLINE = adUnit('inline');
const AD_UNIT_SIDEBAR = adUnit('sidebar');

/**
 * Inject contextual internal links into article section content.
 * Matches titles/keywords of other articles and wraps first occurrence in <a>.
 */
/**
 * Crea un iniettore di link interni con stato condiviso per tutto l'articolo.
 * Garantisce max `maxLinks` link totali indipendentemente dal numero di sezioni.
 */
function createLinkInjector(relatedArticles, currentSlug, maxLinks = 3) {
  let linksAdded = 0;
  const usedSlugs = new Set();
  // Shuffle una volta per articolo: sezioni diverse linkano articoli diversi
  const targets = [...(relatedArticles || [])]
    .filter(a => a.slug !== currentSlug)
    .sort(() => Math.random() - 0.5);

  return function injectLinks(html) {
    if (!html || linksAdded >= maxLinks) return html;
    let result = html;

    for (const art of targets) {
      if (linksAdded >= maxLinks) break;
      if (usedSlugs.has(art.slug)) continue;

      const words = (art.title || '').split(' ').filter(w => w.length > 3);
      if (words.length < 2) continue;

      for (let i = 0; i <= words.length - 2; i++) {
        const phrase = words.slice(i, i + 3).join(' ');
        if (phrase.length < 10) continue;

        const linked = injectLinkInTextNode(result, phrase, art.slug);
        if (linked !== result) {
          result = linked;
          usedSlugs.add(art.slug);
          linksAdded++;
          break; // una frase per target, poi prossimo articolo
        }
      }
    }
    return result;
  };
}

/**
 * Inietta un link nella prima occorrenza di `phrase` in un testo HTML,
 * operando solo su nodi testo (non dentro tag o <a> esistenti).
 */
function injectLinkInTextNode(html, phrase, slug) {
  const parts = html.split(/(<[^>]+>)/);
  let injected = false;
  let insideAnchor = false;

  return parts.map(part => {
    if (injected) return part;
    if (part.startsWith('<')) {
      if (/^<a[\s>]/i.test(part))  insideAnchor = true;
      if (/^<\/a>/i.test(part))    insideAnchor = false;
      return part;
    }
    if (insideAnchor) return part;

    const regex = new RegExp(`(${escapeRegexChars(phrase)})`, 'i');
    if (regex.test(part)) {
      injected = true;
      return part.replace(regex, `<a href="/${slug}/" style="color:inherit;text-decoration:underline;text-decoration-color:rgba(0,0,0,.25)">$1</a>`);
    }
    return part;
  }).join('');
}

function escapeRegexChars(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function buildArticleHTML(articleData, { author, siteName, siteUrl, slug, keyword, relatedArticles = [], toolSlug = '', template = '', rating = null }) {
  const { title, intro, sections, faq, conclusion, authorNote, expertTip, tags, citations, comparisonTable } = articleData;
  // Enforce Google's 160-char limit — Claude occasionally overshoots
  const metaDescription = (articleData.metaDescription || '').slice(0, 160);

  const datePublished = new Date().toISOString();
  const dateFormatted = new Date(datePublished).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const wordCount = countWords(intro + sections.map(s => s.content).join(' ') + conclusion);
  const readingTime = Math.max(1, Math.ceil(wordCount / 230));

  const articleSchema = buildArticleSchema({
    title, description: metaDescription, slug, author,
    siteName, siteUrl, datePublished, dateModified: datePublished, imageSlug: slug,
    wordCount,
    articleType: NEWS_TEMPLATES.has(template) ? 'NewsArticle' : 'Article',
    rating
  });

  const faqSchema = buildFAQSchema(faq);

  // HowTo schema for step-based articles
  const howToSchema = (articleData.schemaType === 'HowTo' && sections.length >= 2)
    ? buildHowToSchema({
        title,
        description: metaDescription,
        steps: sections.map(s => ({ name: s.h2, text: s.content.split('\n\n')[0] })),
        totalTime: 'PT30M'
      })
    : null;

  const categorySlug = articleData.category
    ? articleData.category.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    : null;

  const breadcrumbItems = [{ name: 'Home', path: '/' }];
  if (categorySlug && articleData.category) {
    breadcrumbItems.push({ name: articleData.category, path: `/category/${categorySlug}/` });
  }
  breadcrumbItems.push({ name: title, path: `/${slug}/` });

  const breadcrumb = buildBreadcrumbSchema(breadcrumbItems, siteUrl);

  // Table of Contents (only for articles with 3+ sections)
  const tocHTML = sections.length >= 3 ? `
  <nav style="background:#f0f4ff;border:1px solid #d0d9ff;border-left:4px solid #3b5bdb;border-radius:4px;padding:18px 22px;margin:0 0 28px;">
    <p style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#3b5bdb;margin:0 0 10px;">In This Article</p>
    <ol style="margin:0;padding-left:18px;">
      ${sections.map(s => `<li style="margin-bottom:5px;"><a href="#${slugify(s.h2)}" style="color:#3b5bdb;text-decoration:none;font-size:14px;line-height:1.5;">${escapeHtml(s.h2)}</a></li>`).join('')}
    </ol>
  </nav>` : '';

  // Determine article layout type from schema hint + keyword patterns
  const isHowTo = articleData.schemaType === 'HowTo'
    || /\bhow[ -]to\b|\bstep[- ]by[- ]step\b|\bguide to\b|\binstall(ation)?\b/i.test(keyword);
  const isCost = !isHowTo && /\bcost(s)?\b|\bprice(s)?\b|\b vs \b|\bcompar|\bhow much\b|\baverage\b|\bexpensive\b|\bcheap/i.test(keyword);
  const layoutType = isHowTo ? 'howto' : isCost ? 'cost' : 'standard';

  // ── Featured comparison table (shown prominently after TOC) ────────────────
  const comparisonTableHTML = (comparisonTable?.headers?.length && comparisonTable?.rows?.length)
    ? (() => {
        const { caption, headers, rows } = comparisonTable;
        const ths = headers.map(h => `<th>${escapeHtml(String(h))}</th>`).join('');
        const trs = rows.map(row =>
          `<tr>${row.map(cell => `<td>${escapeHtml(String(cell ?? ''))}</td>`).join('')}</tr>`
        ).join('');
        return `<div style="margin:4px 0 32px;overflow-x:auto;-webkit-overflow-scrolling:touch;">
    ${caption ? `<p style="font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:#555;margin:0 0 8px;">${escapeHtml(caption)}</p>` : ''}
    <table class="cost-table" style="width:100%">
      <thead><tr>${ths}</tr></thead>
      <tbody>${trs}</tbody>
    </table>
  </div>`;
      })()
    : '';

  // Max 2 inline ads inside sections — different Ezoic IDs to avoid duplicates
  // linkInjector: shared state across all sections, max links scales with word count
  const estWordCount = countWords((articleData.sections || []).map(s => s.content).join(' '));
  const maxInlineLinks = Math.min(6, Math.max(3, Math.floor(estWordCount / 300)));
  const linkInjector = createLinkInjector(relatedArticles, slug, maxInlineLinks);

  // ── Cost layout: Quick Summary box ──────────────────────────────────────────
  const costSummaryHTML = (layoutType === 'cost' && articleData.keyTakeaways?.length)
    ? `<div style="background:#f0f9f4;border:2px solid #c3e6d0;border-left:5px solid #1a5c3a;border-radius:6px;padding:20px 24px;margin:0 0 28px;">
      <p style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#1a5c3a;margin:0 0 12px;">💰 Quick Cost Summary</p>
      <ul style="list-style:none;padding:0;margin:0;">
        ${articleData.keyTakeaways.slice(0,4).map(t=>`<li style="font-size:15px;line-height:1.7;padding:5px 0 5px 20px;position:relative;color:#1a1a1a;border-bottom:1px solid #d5ead9;"><span style="position:absolute;left:0;color:#1a5c3a;font-weight:700;">$</span>${t}</li>`).join('')}
      </ul>
    </div>` : '';

  // ── Cost layout: inline calculator CTA (shown after section 2) ──────────────
  const calcCtaHTML = (layoutType === 'cost' && toolSlug)
    ? `<div style="background:linear-gradient(135deg,#1a5c3a 0%,#2d7a4f 100%);color:#fff;border-radius:8px;padding:24px 28px;margin:28px 0;text-align:center;box-shadow:0 4px 16px rgba(26,92,58,.25)">
      <p style="font-size:11px;letter-spacing:2px;text-transform:uppercase;opacity:.75;margin:0 0 8px">Free Tool</p>
      <h3 style="font-size:20px;font-weight:700;margin:0 0 10px;line-height:1.2">Get Your Personalized Cost Estimate</h3>
      <p style="font-size:14px;opacity:.88;margin:0 0 18px;line-height:1.5">Answer 3 quick questions — get a price range tailored to your project and location.</p>
      <a href="/tools/${toolSlug}/" style="display:inline-block;background:#fff;color:#1a5c3a;padding:12px 32px;border-radius:6px;font-weight:700;font-size:15px;text-decoration:none;box-shadow:0 2px 8px rgba(0,0,0,.15)">Start Free Calculator →</a>
    </div>` : '';

  // ── HowTo layout: progress header ───────────────────────────────────────────
  const howtoHeaderHTML = layoutType === 'howto'
    ? `<div style="display:flex;align-items:center;gap:12px;background:#f0f4ff;border:1px solid #d0d9ff;border-radius:6px;padding:14px 18px;margin:0 0 24px;">
      <span style="font-size:24px">📋</span>
      <div>
        <p style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#3b5bdb;margin:0 0 2px">Step-by-Step Guide</p>
        <p style="font-size:14px;color:#444;margin:0">${sections.length} steps · Est. ${Math.max(5, sections.length * 3)}–${Math.max(10, sections.length * 7)} minutes</p>
      </div>
    </div>` : '';

  let sectionsHTML = '';
  sections.forEach((section, i) => {
    const adAfter = i === 1 ? adUnit('inline') : i === 3 ? adUnit('inline2') : '';
    // For cost layout: inject calculator CTA after section 2 instead of 2nd ad
    const calcAfter = (layoutType === 'cost' && i === 1) ? calcCtaHTML : '';

    let listHTML = '';
    if (section.hasList && section.listItems?.length) {
      listHTML = `<ul class="art-list">${section.listItems.map(item => `<li>${item}</li>`).join('')}</ul>`;
    }

    const sectionContent = linkInjector(section.content).split('\n\n').map(p => `<p style="margin-bottom:24px;line-height:1.9">${p}</p>`).join('');

    if (layoutType === 'howto') {
      // HowTo layout: numbered step with badge
      sectionsHTML += `
    <section class="article-section how-to-step" style="margin-bottom:28px;padding:20px 24px;background:#f9fafb;border-left:4px solid #3b5bdb;border-radius:0 6px 6px 0">
      <div style="display:flex;align-items:flex-start;gap:14px;margin-bottom:14px">
        <span style="display:inline-flex;width:34px;height:34px;border-radius:50%;background:#3b5bdb;color:#fff;font-weight:700;font-size:16px;align-items:center;justify-content:center;flex-shrink:0;margin-top:2px">${i + 1}</span>
        <h2 id="${slugify(section.h2)}" style="font-size:20px;font-weight:700;margin:0;line-height:1.3">${escapeHtml(section.h2)}</h2>
      </div>
      ${sectionContent}
      ${listHTML}
    </section>
    ${adAfter}`;
    } else if (layoutType === 'cost') {
      // Cost layout: data-focused section with subtle accent
      sectionsHTML += `
    <section class="article-section" style="margin-bottom:36px">
      <h2 id="${slugify(section.h2)}" style="margin-top:36px;padding-bottom:8px;border-bottom:2px solid #e8f5ef">${escapeHtml(section.h2)}</h2>
      ${sectionContent}
      ${listHTML}
    </section>
    ${calcAfter}${i !== 1 ? adAfter : ''}`;
    } else {
      // Standard layout
      sectionsHTML += `
    <section class="article-section" style="margin-bottom:36px">
      <h2 id="${slugify(section.h2)}" style="margin-top:36px">${escapeHtml(section.h2)}</h2>
      ${sectionContent}
      ${listHTML}
    </section>
    ${adAfter}`;
    }
  });

  const faqHTML = faq.filter(item => item.question && item.answer).map(item => `
    <div class="faq-item">
      <h3 class="faq-question">${escapeHtml(item.question)}</h3>
      <div class="faq-answer">
        <p>${escapeHtml(item.answer)}</p>
      </div>
    </div>`).join('');

  return {
    html: `
<article class="article" itemscope itemtype="https://schema.org/Article">
  <header class="article-header">
    <div class="article-breadcrumb">
      <a href="/">Home</a>${categorySlug ? ` › <a href="/category/${categorySlug}">${escapeHtml(articleData.category)}</a>` : ''} › <span>${escapeHtml(title)}</span>
    </div>
    <div class="article-title" itemprop="headline">${escapeHtml(title)}</div>
    <div class="article-meta">
      <div class="article-author" itemprop="author" itemscope itemtype="https://schema.org/Person">
        <a href="/author/${author.avatar}/" style="flex-shrink:0; display:block;">
          <img src="/images/author-${author.avatar}.jpg" alt="${author.name}" class="author-avatar" loading="lazy" decoding="async"
            width="48" height="48" style="width:48px;height:48px;border-radius:50%;object-fit:cover;object-position:center;" onerror="this.style.display='none'" />
        </a>
        <div class="author-info">
          <a href="/author/${author.avatar}" style="text-decoration:none; color:inherit;" itemprop="url">
            <span class="author-name" itemprop="name">${author.name}</span>
          </a>
          <span class="author-title">${author.title}</span>
        </div>
      </div>
      <time class="article-date" itemprop="datePublished" datetime="${datePublished}">
        ${new Date(datePublished).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
      </time>
      <span class="article-reading-time" style="font-size:13px;color:#888;">${readingTime} min read</span>
    </div>
    ${(process.env.ADSENSE_ID||process.env.EZOIC_SITE_ID)?adUnit('inline'):''}
  </header>

  ${articleData.image ? `
  <div class="article-hero-image" style="margin:-4px 0 28px;border-radius:6px;overflow:hidden;line-height:0;">
    <img src="${escapeHtml(articleData.image)}"
      alt="${escapeHtml(title)}"
      width="800" height="450"
      loading="eager"
      fetchpriority="high"
      style="width:100%;height:auto;max-height:450px;object-fit:cover;display:block;"
      onerror="this.parentElement.style.display='none'" />
  </div>` : ''}

  <div class="article-layout">
    <div class="article-content" itemprop="articleBody">

      <!-- Quick Answer — immediate value above the fold -->
      ${articleData.quickAnswer ? `
      <div class="quick-answer-box" style="margin:0 0 28px;padding:18px 22px 18px 26px;border-left:4px solid #1a5c3a;background:#f0f9f4;border-radius:0 6px 6px 0;">
        <p class="qa-label" style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#1a5c3a;margin:0 0 8px;">Quick Answer</p>
        <p class="qa-text" style="font-size:17px;line-height:1.65;color:#1a1a1a;margin:0;font-weight:500;">${escapeHtml(articleData.quickAnswer)}</p>
      </div>` : ''}

      <!-- Key Takeaways — featured snippet bait -->
      ${articleData.keyTakeaways?.length ? `
      <div class="key-takeaways" style="background:#f0faf0;border:1px solid #c3e6c3;border-left:4px solid #27ae60;border-radius:4px;padding:20px 24px;margin-bottom:24px;">
        <h2 style="font-family:'Merriweather',Georgia,serif;font-size:16px;font-weight:700;color:#1a5c2a;margin-bottom:12px;display:flex;align-items:center;gap:8px;">
          ✓ Key Takeaways
        </h2>
        <ul style="list-style:none;padding:0;margin:0;">
          ${articleData.keyTakeaways.map(t => `<li style="font-size:15px;line-height:1.7;padding:4px 0 4px 20px;position:relative;color:#1a1a1a;"><span style="position:absolute;left:0;color:#27ae60;font-weight:700;">✓</span>${t}</li>`).join('')}
        </ul>
      </div>` : ''}

      <div class="article-intro" style="margin:20px 0 24px;">
        <p class="intro-text">${intro}</p>
      </div>

      ${howtoHeaderHTML}
      ${costSummaryHTML}
      ${tocHTML}
      ${comparisonTableHTML}

      ${sectionsHTML}

      ${expertTip ? `
      <div class="expert-tip-box" style="margin:28px 0;padding:20px 24px;background:#fff8e1;border-left:4px solid #f39c12;border-radius:4px;">
        <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#f39c12;margin-bottom:8px;">Expert Tip</div>
        <p style="font-size:15px;line-height:1.75;color:#333;margin:0;">${expertTip}</p>
        <div style="font-size:13px;color:#888;margin-top:10px;">— ${escapeHtml(author.name)}, ${escapeHtml(author.title)}</div>
      </div>` : ''}

      <div class="article-author-note">
        <blockquote class="author-experience">
          <p>${authorNote}</p>
          <cite>— ${author.name}, ${author.title}</cite>
        </blockquote>
      </div>

      <section class="article-faq faq-wrap" style="margin-top:40px;padding-top:32px;border-top:2px solid #e0e0e0;">
        <h2>Frequently Asked Questions</h2>
        ${faqHTML}
      </section>

      ${AD_UNIT_INLINE}

      <section class="article-conclusion">
        <h2>The Bottom Line</h2>
        ${conclusion.split('\n\n').map(p => `<p>${p}</p>`).join('')}
      </section>

      <!-- Content discovery widget (Taboola/MGID — injected by their script) -->
      <div id="taboola-below-article-thumbnails"></div>

      ${citations?.length ? `
      <section class="article-citations" style="margin-top:28px;padding:18px 20px;background:#f9f9f9;border-left:3px solid #ddd;border-radius:4px;">
        <h3 style="font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:#777;margin-bottom:12px;">Sources & References</h3>
        <ol style="margin:0;padding-left:20px;">
          ${citations.map(c => `
          <li style="font-size:13px;color:#555;line-height:1.6;margin-bottom:8px;">
            ${escapeHtml(c.claim)} —
            <a href="${escapeHtml(c.url)}" target="_blank" rel="nofollow noopener noreferrer"
               style="color:#c0392b;text-decoration:none;font-weight:600;">${escapeHtml(c.source)}</a>
          </li>`).join('')}
        </ol>
      </section>` : ''}

      <!-- Related Articles widget — internal linking + engagement -->
      ${(() => {
        const related = (relatedArticles || [])
          .filter(a => a.slug !== slug && a.title)
          .sort((a, b) => {
            // Prefer same category, then fallback to any
            const aCat = (a.category || '').toLowerCase() === (articleData.category || '').toLowerCase() ? -1 : 1;
            const bCat = (b.category || '').toLowerCase() === (articleData.category || '').toLowerCase() ? -1 : 1;
            if (aCat !== bCat) return aCat - bCat;
            return Math.random() - 0.5;
          })
          .slice(0, 3);
        if (!related.length) return '';
        const cards = related.map(a => `
          <a href="/${a.slug}/" class="related-card" style="display:block;text-decoration:none;background:#fff;border:1px solid #e8e8e8;border-radius:6px;overflow:hidden;transition:box-shadow .15s;" onmouseover="this.style.boxShadow='0 4px 12px rgba(0,0,0,.1)'" onmouseout="this.style.boxShadow='none'">
            ${a.image ? `<img src="${escapeHtml(a.image)}" alt="${escapeHtml(a.title)}" loading="lazy" style="width:100%;height:140px;object-fit:cover;display:block;" onerror="this.style.display='none'" />` : `<div style="height:6px;background:#c0392b;"></div>`}
            <div style="padding:14px 16px;">
              <p style="font-size:14px;font-weight:600;color:#1a1a2e;line-height:1.4;margin:0 0 6px;">${escapeHtml(a.title)}</p>
              ${a.excerpt ? `<p style="font-size:12px;color:#888;line-height:1.5;margin:0;">${escapeHtml((a.excerpt || '').slice(0, 90))}…</p>` : ''}
            </div>
          </a>`).join('');
        return `
      <section style="margin:36px 0 28px;">
        <h3 style="font-size:14px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#888;margin:0 0 16px;padding-bottom:8px;border-bottom:1px solid #eee;">Related Articles</h3>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:16px;">
          ${cards}
        </div>
      </section>`;
      })()}

      <!-- Social share buttons -->
      ${(() => {
        const articleUrl = encodeURIComponent(`${siteUrl}/${slug}/`);
        const articleTitle = encodeURIComponent(title);
        const btnStyle = 'display:inline-flex;align-items:center;padding:7px 16px;border-radius:3px;font-size:13px;font-weight:600;text-decoration:none;color:#fff;';
        return `<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin:28px 0;padding:16px 0;border-top:1px solid #eee;border-bottom:1px solid #eee;">
        <span style="font-size:13px;font-weight:700;color:#555;margin-right:4px;">Share:</span>
        <a href="https://twitter.com/intent/tweet?url=${articleUrl}&text=${articleTitle}" target="_blank" rel="noopener noreferrer" style="${btnStyle}background:#000;">&#x58; Post</a>
        <a href="https://www.facebook.com/sharer/sharer.php?u=${articleUrl}" target="_blank" rel="noopener noreferrer" style="${btnStyle}background:#1877f2;">Facebook</a>
        <a href="https://www.linkedin.com/sharing/share-offsite/?url=${articleUrl}" target="_blank" rel="noopener noreferrer" style="${btnStyle}background:#0a66c2;">LinkedIn</a>
        <a href="https://wa.me/?text=${articleTitle}%20${articleUrl}" target="_blank" rel="noopener noreferrer" style="${btnStyle}background:#25d366;">WhatsApp</a>
      </div>`;
      })()}

      <!-- About the Author box — E-E-A-T signal -->
      <div class="author-bio-box" style="display:flex;gap:20px;align-items:flex-start;background:#f8f9fa;border:1px solid #e8e8e8;border-radius:6px;padding:24px;margin:32px 0;" itemscope itemtype="https://schema.org/Person">
        <a href="/author/${author.avatar}/" style="flex-shrink:0;display:block;">
          <img src="/images/author-${author.avatar}.jpg" alt="${escapeHtml(author.name)}"
            width="80" height="80"
            style="width:80px;height:80px;border-radius:50%;object-fit:cover;object-position:center;border:2px solid #eee;"
            loading="lazy" decoding="async"
            onerror="this.style.display='none'" />
        </a>
        <div>
          <p style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#999;margin:0 0 4px;">Written by</p>
          <a href="/author/${author.avatar}/" style="font-size:17px;font-weight:700;color:#1a1a2e;text-decoration:none;" itemprop="name">${escapeHtml(author.name)}</a>
          <p style="font-size:13px;color:#888;margin:4px 0 10px;" itemprop="jobTitle">${escapeHtml(author.title)}</p>
          <p style="font-size:14px;line-height:1.65;color:#444;margin:0 0 10px;">${escapeHtml((author.bio || '').slice(0, 220))}${(author.bio || '').length > 220 ? '...' : ''}</p>
          <a href="/author/${author.avatar}/" style="font-size:13px;color:#c0392b;text-decoration:none;font-weight:600;">See all articles &rarr;</a>
        </div>
      </div>

      <!-- Was this helpful? — engagement signal for Google -->
      <div class="helpful-widget" style="margin:28px 0;padding:20px 24px;background:#f8f9fa;border:1px solid #e8e8e8;border-radius:6px;text-align:center;" data-slug="${slug}">
        <p style="font-size:15px;font-weight:600;color:#333;margin:0 0 14px;">Was this article helpful?</p>
        <div style="display:flex;justify-content:center;gap:12px;">
          <button onclick="submitFeedback('${slug}','yes',this)" style="padding:8px 24px;border-radius:4px;border:2px solid #27ae60;background:#fff;color:#27ae60;font-size:14px;font-weight:600;cursor:pointer;">
            👍 Yes
          </button>
          <button onclick="submitFeedback('${slug}','no',this)" style="padding:8px 24px;border-radius:4px;border:2px solid #e74c3c;background:#fff;color:#e74c3c;font-size:14px;font-weight:600;cursor:pointer;">
            👎 No
          </button>
        </div>
        <p class="helpful-thanks" style="display:none;font-size:14px;color:#27ae60;margin:10px 0 0;font-weight:600;">Thanks for your feedback!</p>
      </div>
      <script>
      function submitFeedback(slug,vote,btn){
        var w=btn.closest('.helpful-widget');
        fetch('/api/feedback',{method:'POST',headers:{'Content-Type':'application/json'},
          body:JSON.stringify({slug:slug,vote:vote,site:location.hostname})})
          .catch(function(){});
        w.querySelectorAll('button').forEach(function(b){b.disabled=true;b.style.opacity='0.4';});
        w.querySelector('.helpful-thanks').style.display='block';
      }
      </script>

      <!-- Last updated + editorial note -->
      <div style="margin-top:24px;padding-top:16px;border-top:1px solid #eee;display:flex;align-items:center;gap:12px;flex-wrap:wrap;">
        <span style="font-size:12px;color:#999;">
          <strong style="color:#666;">Last reviewed:</strong> ${dateFormatted}
        </span>
        <span style="font-size:12px;color:#999;">·</span>
        <a href="/editorial-process" style="font-size:12px;color:#c0392b;text-decoration:none;font-weight:600;">
          How we ensure accuracy →
        </a>
      </div>
    </div>

    <aside class="article-sidebar">
      ${AD_UNIT_SIDEBAR}
      <div class="sidebar-related">
        <h3>You May Also Like</h3>
        <div id="related-articles" data-keyword="${escapeHtml(keyword)}"></div>
      </div>
      ${AD_UNIT_SIDEBAR}
      <div class="nl-box" style="margin-top:8px">
        <h3 style="margin-bottom:4px">Get Expert Tips Weekly</h3>
        <p style="font-size:12px;color:rgba(255,255,255,.8);margin-bottom:12px;line-height:1.5">Join 12,000+ homeowners who get our cost guides every week.</p>
        <form class="nl-form newsletter-form">
          <input type="email" placeholder="your@email.com" style="width:100%;padding:11px 14px;border:none;border-radius:3px;margin-bottom:10px;font-size:14px;box-sizing:border-box"/>
          <button type="submit" style="width:100%;padding:12px;font-weight:700;font-size:15px;border:none;border-radius:3px;cursor:pointer;letter-spacing:.5px">Get Free Tips →</button>
        </form>
      </div>
      ${AD_UNIT_SIDEBAR}
    </aside>
  </div>
</article>`,

    schemas: [articleSchema, faqSchema, breadcrumb, ...(howToSchema ? [howToSchema] : [])],
    metaDescription,
    wordCount
  };
}

function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function slugify(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function countWords(text) {
  return text.trim().split(/\s+/).length;
}
