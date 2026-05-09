// ============================================================
// Lead-gen CTA banner — cross-link articolo → funnel leadgen-engine
//
// Mappa nicchia → vertical leadgen + copy del banner.
// Il banner viene renderizzato in fondo agli articoli (prima dei
// related articles) solo se la nicchia ha una mappatura attiva.
//
// Disattivabile globalmente via env LEADGEN_CTA_DISABLED=1.
// ============================================================

const LEADGEN_BASE_URL = process.env.LEADGEN_FUNNEL_BASE_URL || 'https://leadgen.trackitwhen.com';

const NICHE_TO_VERTICAL = {
  'home-improvement-costs': {
    vertical: 'home-services',
    headline: 'Get matched with vetted local contractors',
    subhead: 'Free quotes from top-rated pros — no obligation.',
    cta: 'GET MY QUOTES'
  },
  'insurance-guide': {
    vertical: 'auto-insurance',
    headline: 'Compare auto insurance quotes in 60 seconds',
    subhead: 'Drivers in your ZIP can save up to $987/yr.',
    cta: 'GET MY QUOTES'
  },
  'solar-energy': {
    vertical: 'solar',
    headline: 'See if solar makes sense for your home',
    subhead: 'Compare quotes from vetted installers in your area.',
    cta: 'GET MY QUOTE'
  },
  'legal-advice': {
    vertical: 'mass-tort',
    headline: 'See if you qualify for compensation',
    subhead: 'Free claim evaluation — no fee unless you win.',
    cta: 'EVALUATE MY CLAIM'
  },
  'senior-care-medicare': {
    vertical: 'medicare-advantage',
    headline: 'Compare Medicare plans in your area',
    subhead: 'Free comparison from licensed agents.',
    cta: 'COMPARE PLANS'
  }
};

export function getLeadGenConfig(nicheSlug) {
  if (process.env.LEADGEN_CTA_DISABLED === '1') return null;
  return NICHE_TO_VERTICAL[nicheSlug] || null;
}

export function buildLeadGenCtaHTML(nicheSlug, { source = 'organic_article' } = {}) {
  const cfg = getLeadGenConfig(nicheSlug);
  if (!cfg) return '';

  const url = `${LEADGEN_BASE_URL}/funnels/${cfg.vertical}?utm_source=${encodeURIComponent(source)}&utm_medium=article_cta&utm_campaign=${encodeURIComponent(nicheSlug)}`;

  return `<aside class="leadgen-cta" style="background:linear-gradient(135deg,#1a1a2e 0%,#3b5bdb 100%);color:#fff;border-radius:10px;padding:28px 30px;margin:36px 0;text-align:center;box-shadow:0 6px 20px rgba(59,91,219,.25)">
  <p style="font-size:11px;letter-spacing:2px;text-transform:uppercase;opacity:.75;margin:0 0 10px">Match in 60 seconds</p>
  <h3 style="font-size:22px;font-weight:700;margin:0 0 10px;line-height:1.25">${escapeHtml(cfg.headline)}</h3>
  <p style="font-size:15px;opacity:.92;margin:0 0 20px;line-height:1.5">${escapeHtml(cfg.subhead)}</p>
  <a href="${url}" rel="nofollow noopener" target="_blank" style="display:inline-block;background:#fff;color:#1a1a2e;padding:13px 36px;border-radius:6px;font-weight:700;font-size:15px;text-decoration:none;box-shadow:0 2px 10px rgba(0,0,0,.15)">${escapeHtml(cfg.cta)} →</a>
</aside>`;
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
