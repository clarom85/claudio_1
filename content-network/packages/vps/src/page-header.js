/**
 * page-header.js — shared header/footer for standalone VPS pages
 * Used by: generate-glossary, generate-cost-tracker, generate-data-pages,
 *          generate-faq-hub, regenerate-static-pages, setup-additional-authors
 */

function htmlEsc(s) {
  return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

export function buildPageHeader(siteConfig) {
  const cats = (siteConfig.categories||[]).slice(0,4);
  const catLinks = cats.map(c =>
    `<a href="/category/${c.slug}/" style="color:rgba(255,255,255,.7);text-decoration:none;font-size:13px">${htmlEsc(c.name)}</a>`
  ).join('');
  const toolLink = siteConfig.toolSlug
    ? `<a href="/tools/${siteConfig.toolSlug}/" style="color:#f5a623;text-decoration:none;font-size:13px;font-weight:700">${htmlEsc(siteConfig.toolLabel||'Free Calculator')}</a>`
    : '';
  return `<header style="background:#1a1a2e;padding:14px 20px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px">
  <a href="/" style="color:#fff;text-decoration:none;font-size:20px;font-weight:800">${htmlEsc(siteConfig.name)}</a>
  <nav style="font-size:13px;display:flex;gap:16px;flex-wrap:wrap;align-items:center">
    ${catLinks}${toolLink}
  </nav>
</header>`;
}

export function buildPageFooter(siteConfig) {
  return `<footer style="background:#1a1a2e;color:rgba(255,255,255,.6);text-align:center;padding:20px;font-size:13px">
  <p>&copy; ${new Date().getFullYear()} ${htmlEsc(siteConfig.name)} &middot;
     <a href="/about/" style="color:rgba(255,255,255,.5)">About</a> &middot;
     <a href="/privacy/" style="color:rgba(255,255,255,.5)">Privacy</a> &middot;
     <a href="/terms/" style="color:rgba(255,255,255,.5)">Terms</a> &middot;
     <a href="/contact/" style="color:rgba(255,255,255,.5)">Contact</a></p>
</footer>`;
}
