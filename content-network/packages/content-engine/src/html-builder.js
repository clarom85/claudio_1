/**
 * Converte il JSON generato da Claude in HTML semantico
 * Ottimizzato per SEO e ad placement
 */

import { buildArticleSchema, buildFAQSchema, buildBreadcrumbSchema } from './schema.js';

// Inserisce ads inline — usa classi CSS del template (.ad .ad-inline)
const AD_UNIT_INLINE = `<div class="ad ad-inline">
  <ins class="adsbygoogle" style="display:block;text-align:center" data-ad-format="fluid" data-ad-layout="in-article"></ins>
</div>`;

const AD_UNIT_SIDEBAR = `<div class="ad ad-sidebar">
  <ins class="adsbygoogle" style="display:block" data-ad-format="rectangle"></ins>
</div>`;

export function buildArticleHTML(articleData, { author, siteName, siteUrl, slug, keyword }) {
  const { title, metaDescription, intro, sections, faq, conclusion, authorNote, tags, citations } = articleData;

  const datePublished = new Date().toISOString();
  const dateFormatted = new Date(datePublished).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  const articleSchema = buildArticleSchema({
    title, description: metaDescription, slug, author,
    siteName, siteUrl, datePublished, imageSlug: slug
  });

  const faqSchema = buildFAQSchema(faq);

  const categorySlug = articleData.category
    ? articleData.category.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    : null;

  const breadcrumbItems = [{ name: 'Home', path: '/' }];
  if (categorySlug && articleData.category) {
    breadcrumbItems.push({ name: articleData.category, path: `/category/${categorySlug}` });
  }
  breadcrumbItems.push({ name: title, path: `/${slug}` });

  const breadcrumb = buildBreadcrumbSchema(breadcrumbItems, siteUrl);

  let sectionsHTML = '';
  sections.forEach((section, i) => {
    // Ad after every section
    const adAfter = AD_UNIT_INLINE;

    let listHTML = '';
    if (section.hasList && section.listItems?.length) {
      listHTML = `<ul class="article-list">${section.listItems.map(item => `<li>${item}</li>`).join('')}</ul>`;
    }

    sectionsHTML += `
    <section class="article-section">
      <h2>${escapeHtml(section.h2)}</h2>
      ${section.content.split('\n\n').map(p => `<p>${p}</p>`).join('')}
      ${listHTML}
    </section>
    ${adAfter}`;
  });

  const faqHTML = faq.map(item => `
    <div class="faq-item" itemscope itemprop="mainEntity" itemtype="https://schema.org/Question">
      <h3 class="faq-question" itemprop="name">${escapeHtml(item.question)}</h3>
      <div class="faq-answer" itemscope itemprop="acceptedAnswer" itemtype="https://schema.org/Answer">
        <p itemprop="text">${escapeHtml(item.answer)}</p>
      </div>
    </div>`).join('');

  const tagsHTML = tags.map(tag =>
    `<a href="/tag/${slugify(tag)}" class="tag">${escapeHtml(tag)}</a>`
  ).join('');

  return {
    html: `
<article class="article" itemscope itemtype="https://schema.org/Article">
  <header class="article-header">
    <div class="article-breadcrumb">
      <a href="/">Home</a>${categorySlug ? ` › <a href="/category/${categorySlug}">${escapeHtml(articleData.category)}</a>` : ''} › <span>${escapeHtml(title)}</span>
    </div>
    <h1 class="article-title" itemprop="headline">${escapeHtml(title)}</h1>
    <div class="article-meta">
      <div class="article-author" itemprop="author" itemscope itemtype="https://schema.org/Person">
        <a href="/author/${author.avatar}" style="flex-shrink:0; display:block;">
          <img src="/authors/${author.avatar}.jpg" alt="${author.name}" class="author-avatar" loading="lazy"
            width="48" height="48" onerror="this.src='/authors/${author.avatar}.webp'" />
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
    </div>
    <div class="ad-unit ad-unit--leaderboard" data-ad-slot="top-leaderboard">
      <ins class="adsbygoogle" data-ad-format="leaderboard"></ins>
    </div>
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

      <!-- Key Takeaways — featured snippet bait -->
      ${articleData.keyTakeaways?.length ? `
      <div class="key-takeaways" style="background:#f0faf0;border:1px solid #c3e6c3;border-left:4px solid #27ae60;border-radius:4px;padding:20px 24px;margin-bottom:24px;">
        <h2 style="font-family:'Merriweather',Georgia,serif;font-size:16px;font-weight:700;color:#1a5c2a;margin-bottom:12px;display:flex;align-items:center;gap:8px;">
          ✓ Key Takeaways
        </h2>
        <ul style="list-style:none;padding:0;margin:0;">
          ${articleData.keyTakeaways.map(t => `<li style="font-size:15px;line-height:1.7;padding:4px 0 4px 20px;position:relative;color:#1a1a1a;"><span style="position:absolute;left:0;color:#27ae60;font-weight:700;">✓</span>${escapeHtml(t)}</li>`).join('')}
        </ul>
      </div>` : ''}

      <div class="article-intro">
        <p class="intro-text">${escapeHtml(intro)}</p>
      </div>

      ${AD_UNIT_INLINE}

      ${sectionsHTML}

      <div class="article-author-note">
        <blockquote class="author-experience">
          <p>${escapeHtml(authorNote)}</p>
          <cite>— ${author.name}, ${author.title}</cite>
        </blockquote>
      </div>

      ${AD_UNIT_INLINE}

      <section class="article-faq" itemscope itemtype="https://schema.org/FAQPage">
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

      <div class="article-tags">
        <span class="tags-label">Topics:</span>
        ${tagsHTML}
      </div>

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
      <div class="sidebar-newsletter">
        <h3>Get Expert Tips Weekly</h3>
        <form class="nl-form newsletter-form">
          <input type="email" placeholder="your@email.com" />
          <button type="submit">Subscribe Free</button>
        </form>
      </div>
      ${AD_UNIT_SIDEBAR}
    </aside>
  </div>
</article>`,

    schemas: [articleSchema, faqSchema, breadcrumb],
    metaDescription,
    wordCount: countWords(intro + sections.map(s => s.content).join(' ') + conclusion)
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
