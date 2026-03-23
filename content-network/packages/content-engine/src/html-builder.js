/**
 * Converte il JSON generato da Claude in HTML semantico
 * Ottimizzato per SEO e ad placement
 */

import { buildArticleSchema, buildFAQSchema, buildBreadcrumbSchema, buildHowToSchema } from './schema.js';

// Ad unit helper — Ezoic placeholders if EZOIC_SITE_ID is set, else AdSense <ins>
// Ezoic IDs: 102 = in-article, 103 = in-article-2, 104 = sidebar (configure in Ezoic dashboard)
function adUnit(type) {
  const ezoicId = process.env.EZOIC_SITE_ID || '';
  if (ezoicId) {
    const ids = { inline: 102, inline2: 103, sidebar: 104 };
    const minH = type === 'sidebar' ? 250 : 280;
    return `<div id="ezoic-pub-ad-placeholder-${ids[type] || 102}" style="min-height:${minH}px"></div>`;
  }
  if (type === 'sidebar') {
    return `<div class="ad ad-sidebar" style="min-height:250px"><ins class="adsbygoogle" style="display:block" data-ad-format="rectangle"></ins></div>`;
  }
  return `<div class="ad ad-inline" style="min-height:280px"><ins class="adsbygoogle" style="display:block;text-align:center" data-ad-format="fluid" data-ad-layout="in-article"></ins></div>`;
}

const AD_UNIT_INLINE = adUnit('inline');
const AD_UNIT_SIDEBAR = adUnit('sidebar');

export function buildArticleHTML(articleData, { author, siteName, siteUrl, slug, keyword }) {
  const { title, metaDescription, intro, sections, faq, conclusion, authorNote, expertTip, tags, citations } = articleData;

  const datePublished = new Date().toISOString();
  const dateFormatted = new Date(datePublished).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const wordCount = countWords(intro + sections.map(s => s.content).join(' ') + conclusion);
  const readingTime = Math.max(1, Math.ceil(wordCount / 230));

  const articleSchema = buildArticleSchema({
    title, description: metaDescription, slug, author,
    siteName, siteUrl, datePublished, dateModified: datePublished, imageSlug: slug,
    wordCount
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
    breadcrumbItems.push({ name: articleData.category, path: `/category/${categorySlug}` });
  }
  breadcrumbItems.push({ name: title, path: `/${slug}` });

  const breadcrumb = buildBreadcrumbSchema(breadcrumbItems, siteUrl);

  // Table of Contents (only for articles with 3+ sections)
  const tocHTML = sections.length >= 3 ? `
  <nav style="background:#f0f4ff;border:1px solid #d0d9ff;border-left:4px solid #3b5bdb;border-radius:4px;padding:18px 22px;margin:0 0 28px;">
    <p style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#3b5bdb;margin:0 0 10px;">In This Article</p>
    <ol style="margin:0;padding-left:18px;">
      ${sections.map(s => `<li style="margin-bottom:5px;"><a href="#${slugify(s.h2)}" style="color:#3b5bdb;text-decoration:none;font-size:14px;line-height:1.5;">${escapeHtml(s.h2)}</a></li>`).join('')}
    </ol>
  </nav>` : '';

  // Max 2 inline ads inside sections: only after section index 1 and 3 (2nd and 4th)
  // Use different Ezoic placeholder IDs (102 vs 103) to avoid duplicate IDs on page
  let sectionsHTML = '';
  sections.forEach((section, i) => {
    const adAfter = i === 1 ? adUnit('inline') : i === 3 ? adUnit('inline2') : '';

    let listHTML = '';
    if (section.hasList && section.listItems?.length) {
      listHTML = `<ul class="art-list">${section.listItems.map(item => `<li>${item}</li>`).join('')}</ul>`;
    }

    sectionsHTML += `
    <section class="article-section">
      <h2 id="${slugify(section.h2)}">${escapeHtml(section.h2)}</h2>
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
        <a href="/author/${author.avatar}/" style="flex-shrink:0; display:block;">
          <img src="/images/author-${author.avatar}.jpg" alt="${author.name}" class="author-avatar" loading="lazy" decoding="async"
            width="48" height="48" style="width:48px;height:48px;border-radius:50%;object-fit:cover;object-position:top;" onerror="this.style.display='none'" />
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
    <div class="ad ad-leader" style="min-height:90px" data-ad-slot="top-leaderboard">
      <ins class="adsbygoogle" style="display:block" data-ad-format="leaderboard"></ins>
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

      ${tocHTML}

      ${AD_UNIT_INLINE}

      ${sectionsHTML}

      ${expertTip ? `
      <div class="expert-tip-box" style="margin:28px 0;padding:20px 24px;background:#fff8e1;border-left:4px solid #f39c12;border-radius:4px;">
        <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#f39c12;margin-bottom:8px;">Expert Tip</div>
        <p style="font-size:15px;line-height:1.75;color:#333;margin:0;">${escapeHtml(expertTip)}</p>
        <div style="font-size:13px;color:#888;margin-top:10px;">— ${escapeHtml(author.name)}, ${escapeHtml(author.title)}</div>
      </div>` : ''}

      <div class="article-author-note">
        <blockquote class="author-experience">
          <p>${escapeHtml(authorNote)}</p>
          <cite>— ${author.name}, ${author.title}</cite>
        </blockquote>
      </div>

      <section class="article-faq faq-wrap" itemscope itemtype="https://schema.org/FAQPage" style="margin-top:40px;padding-top:32px;border-top:2px solid #e0e0e0;">
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
            style="width:80px;height:80px;border-radius:50%;object-fit:cover;object-position:top;border:2px solid #eee;"
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
