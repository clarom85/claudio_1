/**
 * Converte il JSON generato da Claude in HTML semantico
 * Ottimizzato per SEO e ad placement
 */

import { buildArticleSchema, buildFAQSchema, buildBreadcrumbSchema } from './schema.js';

// Inserisce ads inline ogni N sezioni
const AD_UNIT_INLINE = `<div class="ad-unit ad-unit--inline" data-ad-slot="inline">
  <ins class="adsbygoogle" data-ad-format="fluid" data-ad-layout="in-article"></ins>
</div>`;

const AD_UNIT_SIDEBAR = `<div class="ad-unit ad-unit--sidebar" data-ad-slot="sidebar"></div>`;

export function buildArticleHTML(articleData, { author, siteName, siteUrl, slug, keyword }) {
  const { title, metaDescription, intro, sections, faq, conclusion, authorNote, tags } = articleData;

  const datePublished = new Date().toISOString();

  const articleSchema = buildArticleSchema({
    title, description: metaDescription, slug, author,
    siteName, siteUrl, datePublished
  });

  const faqSchema = buildFAQSchema(faq);

  const breadcrumb = buildBreadcrumbSchema([
    { name: 'Home', path: '/' },
    { name: title, path: `/${slug}` }
  ], siteUrl);

  let sectionsHTML = '';
  sections.forEach((section, i) => {
    // Ad after every 2nd section
    const adAfter = (i + 1) % 2 === 0 ? AD_UNIT_INLINE : '';

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
      <a href="/">Home</a> › <span>${escapeHtml(title)}</span>
    </div>
    <h1 class="article-title" itemprop="headline">${escapeHtml(title)}</h1>
    <div class="article-meta">
      <div class="article-author" itemprop="author" itemscope itemtype="https://schema.org/Person">
        <img src="/authors/${author.avatar}.webp" alt="${author.name}" class="author-avatar" loading="lazy" />
        <div class="author-info">
          <span class="author-name" itemprop="name">${author.name}</span>
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

  <div class="article-layout">
    <div class="article-content" itemprop="articleBody">
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

      <div class="article-tags">
        <span class="tags-label">Topics:</span>
        ${tagsHTML}
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
        <form class="newsletter-form">
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
