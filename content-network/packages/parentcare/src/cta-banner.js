/**
 * Internal article CTA banner for medicarepriceguide.com articles.
 * Drives traffic to /find-care/ — the ParentCare Finder quiz funnel.
 *
 * Different visual identity from the external leadgen-cta (Medicare Advantage)
 * so they can co-exist on the same article without confusion.
 */

function escHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function buildParentCareCtaHTML({ source = 'article' } = {}) {
  const url = `/find-care/?utm_source=${encodeURIComponent(source)}&utm_medium=article_cta&utm_campaign=parentcare`;
  return `<aside class="parentcare-cta" style="background:#faf6f1;border:1px solid #e6dccf;border-left:4px solid #c4622d;border-radius:10px;padding:26px 28px;margin:36px 0;display:flex;gap:22px;align-items:center;flex-wrap:wrap">
  <div style="flex:1;min-width:240px">
    <p style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#c4622d;font-weight:700;margin:0 0 8px">Free 2-minute care assessment</p>
    <h3 style="font-family:'Cormorant Garamond',Georgia,serif;font-weight:500;font-size:24px;line-height:1.25;color:#3d2b1f;margin:0 0 8px">Worried about an aging parent?</h3>
    <p style="font-size:14.5px;color:#7a6a5a;line-height:1.6;margin:0">Compare local home care, assisted living, and memory care options based on your loved one's needs — no pressure, no commitment.</p>
  </div>
  <a href="${url}" style="background:#c4622d;color:#fff;padding:14px 26px;border-radius:8px;font-weight:700;font-size:15px;text-decoration:none;letter-spacing:.3px;white-space:nowrap;flex-shrink:0">${escHtml('Begin Assessment')} →</a>
</aside>`;
}
