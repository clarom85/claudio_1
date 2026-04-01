/**
 * regenerate-static-pages.js — Rigenera le pagine statiche per siti esistenti.
 * Uso: node packages/vps/src/regenerate-static-pages.js --site-id 5
 *      node packages/vps/src/regenerate-static-pages.js --all
 */
import 'dotenv/config';
import { writeFileSync, mkdirSync, readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { sql } from '@content-network/db';
import { NICHE_METHODOLOGY, DEFAULT_METHODOLOGY, renderMethodologyBody } from '@content-network/site-spawner/src/niche-methodology.js';
import { AUTHOR_PERSONAS, ADDITIONAL_AUTHORS } from '@content-network/content-engine/src/prompts.js';
import { getCategoriesForNiche } from '@content-network/content-engine/src/categories.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..', '..', '..');
const TEMPLATES_DIR = join(ROOT, 'templates');
const WWW_ROOT = process.env.WWW_ROOT || '/var/www';

// Dark templates need content wrapped in a white card to be readable
const DARK_TEMPLATES = new Set(['nexus', 'vortex']);

function htmlEsc(str = '') {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function simplePageWrapper(title, description, content, site, { noindex = false, canonical = '', ogImage = '', template = '' } = {}) {
  const effectiveOgImage = ogImage || `${site.url}/images/og-default.jpg`;
  const ga4Id = process.env.GA4_MEASUREMENT_ID || '';
  const gscKeys = (process.env.GOOGLE_SITE_VERIFICATION || '').split(',').map(s => s.trim()).filter(Boolean);
  const ga4Script = ga4Id ? `
  <script async src="https://www.googletagmanager.com/gtag/js?id=${ga4Id}"></script>
  <script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${ga4Id}',{anonymize_ip:true});</script>` : '';
  const robots = noindex ? 'noindex, follow' : 'index, follow, max-image-preview:large';
  // Wrap content in white card for dark templates so text is readable
  const isDark = DARK_TEMPLATES.has(template);
  const wrappedContent = isDark
    ? `<div style="background:#fff;color:#1a1a1a;border-radius:8px;padding:32px 24px;margin:32px auto;max-width:1000px;box-shadow:0 2px 16px rgba(0,0,0,.18)">${content}</div>`
    : content;

  return `<!DOCTYPE html><html lang="en"><head>
<meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<meta name="robots" content="${robots}"/>
${gscKeys.map(k=>`<meta name="google-site-verification" content="${k}"/>`).join('\n')}
<title>${htmlEsc(title)} | ${htmlEsc(site.name)}</title>
<meta name="description" content="${htmlEsc(description)}"/>
${canonical ? `<link rel="canonical" href="${canonical}"/>` : ''}
<meta property="og:title" content="${htmlEsc(title)}"/>
<meta property="og:description" content="${htmlEsc(description)}"/>
<meta property="og:type" content="website"/>
<meta property="og:site_name" content="${htmlEsc(site.name)}"/>
${canonical ? `<meta property="og:url" content="${canonical}"/>` : ''}
<meta property="og:image" content="${effectiveOgImage}"/>
<meta name="twitter:card" content="summary_large_image"/>
<link rel="preconnect" href="https://pagead2.googlesyndication.com"/>
<link rel="preconnect" href="https://www.googletagmanager.com"/>
<link rel="dns-prefetch" href="https://www.google-analytics.com"/>
<link rel="icon" type="image/svg+xml" href="/favicon.svg"/>
<link rel="stylesheet" href="/assets/style.v2.css"/>
${ga4Script}
</head><body>
<header style="background:#1a1a2e;padding:14px 20px">
  <a href="/" style="color:#fff;text-decoration:none;font-size:22px;font-weight:800">${site.name}</a>
</header>
<main style="padding:20px 0;min-height:60vh">${wrappedContent}</main>
<footer style="background:#1a1a2e;color:rgba(255,255,255,.6);text-align:center;padding:20px;font-size:13px">
  <p>&copy; ${new Date().getFullYear()} ${site.name} &middot; <a href="/privacy/" style="color:rgba(255,255,255,.5)">Privacy</a> &middot; <a href="/terms/" style="color:rgba(255,255,255,.5)">Terms</a> &middot; <a href="/disclaimer/" style="color:rgba(255,255,255,.5)">Disclaimer</a> &middot; <a href="/contact/" style="color:rgba(255,255,255,.5)">Contact</a></p>
</footer>
</body></html>`;
}

function buildContactPage(siteName, domain) {
  return {
    title: 'Contact Us',
    noindex: false,
    description: `Contact the ${siteName} editorial team — corrections, questions, feedback, and advertising inquiries.`,
    body: `<div style="max-width:640px;margin:48px auto;padding:0 20px;color:#1a1a1a">
      <h1 style="font-size:32px;font-weight:700;margin-bottom:8px">Contact Us</h1>
      <p style="color:#666;font-size:14px;margin-bottom:32px">We read every message and aim to respond within 2 business days.</p>

      <div style="display:grid;gap:16px;margin-bottom:40px">
        <div style="background:#f8f9fa;border:1px solid #e8e8e8;border-radius:6px;padding:20px 24px">
          <h2 style="font-size:16px;font-weight:700;margin:0 0 6px;color:#1a1a1a">Editorial Questions &amp; Corrections</h2>
          <p style="font-size:14px;line-height:1.7;color:#555;margin:0 0 10px">Found an error, want to challenge a claim, or have a question about our methodology?</p>
          <a href="mailto:editor@${domain}" style="font-size:14px;font-weight:600;color:#c0392b">editor@${domain}</a>
        </div>
        <div style="background:#f8f9fa;border:1px solid #e8e8e8;border-radius:6px;padding:20px 24px">
          <h2 style="font-size:16px;font-weight:700;margin:0 0 6px;color:#1a1a1a">General &amp; Reader Inquiries</h2>
          <p style="font-size:14px;line-height:1.7;color:#555;margin:0 0 10px">General questions, feedback, topic suggestions, or anything else.</p>
          <a href="mailto:contact@${domain}" style="font-size:14px;font-weight:600;color:#c0392b">contact@${domain}</a>
        </div>
        <div style="background:#f8f9fa;border:1px solid #e8e8e8;border-radius:6px;padding:20px 24px">
          <h2 style="font-size:16px;font-weight:700;margin:0 0 6px;color:#1a1a1a">Advertising &amp; Partnerships</h2>
          <p style="font-size:14px;line-height:1.7;color:#555;margin:0 0 10px">Display advertising, sponsored content, and affiliate partnership inquiries.</p>
          <a href="mailto:ads@${domain}" style="font-size:14px;font-weight:600;color:#c0392b">ads@${domain}</a>
        </div>
      </div>

      <div style="background:#fff3cd;border:1px solid #ffc107;border-radius:6px;padding:16px 20px;margin-bottom:32px">
        <p style="font-size:13px;line-height:1.65;margin:0;color:#856404"><strong>Insurance content note:</strong> We are not a licensed insurance agent, broker, or financial advisor. We cannot provide personal insurance quotes, recommend specific policies, or give advice about your individual coverage situation. For those needs, please contact a licensed insurance professional in your state.</p>
      </div>

      <p style="font-size:14px;color:#666;line-height:1.7">
        <a href="/about/" style="color:#c0392b">About ${siteName}</a> &middot;
        <a href="/editorial-process/" style="color:#c0392b">Editorial Standards</a> &middot;
        <a href="/disclaimer/" style="color:#c0392b">Disclaimer</a>
      </p>
    </div>`
  };
}

function buildReviewerPage(reviewer, author, siteName, siteUrl, domain) {
  const slug = reviewer.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  return {
    slug,
    title: `${reviewer.name} — ${reviewer.title}`,
    noindex: false,
    description: `${reviewer.name}, ${reviewer.title}. ${reviewer.credentials}. Expert reviewer for ${siteName}.`,
    body: `<div style="max-width:800px;margin:40px auto;padding:0 20px;color:#1a1a1a">
      <div style="background:linear-gradient(135deg,#1a1a2e,#2d2d4e);border-radius:8px;padding:32px;margin-bottom:32px;display:flex;gap:24px;align-items:flex-start;flex-wrap:wrap">
        <div style="width:90px;height:90px;background:rgba(255,255,255,.15);border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:32px;font-weight:900;color:#fff">${reviewer.name.charAt(0)}</div>
        <div style="flex:1;min-width:200px">
          <h1 style="font-size:clamp(22px,4vw,30px);font-weight:900;color:#fff;margin:0 0 6px;line-height:1.2">${htmlEsc(reviewer.name)}</h1>
          <p style="font-size:15px;font-weight:600;color:rgba(255,255,255,.8);margin:0 0 10px">${htmlEsc(reviewer.title)}</p>
          <p style="font-size:13px;color:rgba(255,255,255,.65);margin:0;line-height:1.5">${htmlEsc(reviewer.credentials)}</p>
        </div>
      </div>

      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-left:4px solid #16a34a;border-radius:6px;padding:18px 22px;margin-bottom:32px">
        <p style="font-size:14px;font-weight:700;color:#15803d;margin:0 0 6px">Expert Reviewer — ${htmlEsc(siteName)}</p>
        <p style="font-size:14px;line-height:1.7;color:#166534;margin:0">${htmlEsc(reviewer.name)} reviews insurance content on ${htmlEsc(siteName)} for factual accuracy, regulatory compliance, and practical relevance. Every article carrying the "Reviewed by" designation has been read and verified by ${htmlEsc(reviewer.name.split(' ')[0])} before publication.</p>
      </div>

      <h2 style="font-size:20px;font-weight:700;margin:0 0 14px;padding-bottom:10px;border-bottom:2px solid #e8e8e8">Credentials &amp; Background</h2>
      <p style="font-size:16px;line-height:1.85;margin-bottom:20px;color:#333">${htmlEsc(reviewer.credentials).replace(/ · /g, ' &middot; ')}</p>

      <h2 style="font-size:20px;font-weight:700;margin:32px 0 14px;padding-bottom:10px;border-bottom:2px solid #e8e8e8">Review Scope</h2>
      <ul style="font-size:15px;line-height:1.85;padding-left:24px;color:#333;margin-bottom:28px">
        <li style="margin-bottom:8px">Verifying premium estimates against NAIC data and state Department of Insurance rate filings</li>
        <li style="margin-bottom:8px">Confirming coverage definitions align with standard policy language (ISO forms)</li>
        <li style="margin-bottom:8px">Flagging state-specific regulatory variations that affect consumer rights</li>
        <li style="margin-bottom:8px">Ensuring disclaimers and disclosures meet editorial standards for YMYL financial content</li>
        <li style="margin-bottom:8px">Reviewing calculator methodology and output ranges for actuarial reasonableness</li>
      </ul>

      <div style="background:#f8f9fa;border:1px solid #e8e8e8;border-radius:6px;padding:20px 24px;margin-top:32px">
        <p style="font-size:13px;color:#666;margin:0;line-height:1.7">
          Content reviewed by ${htmlEsc(reviewer.name)} is marked with the "Reviewed by" badge in the editorial trust block at the top of each article.
          Last updated: ${today} &middot;
          <a href="/editorial-process/" style="color:#c0392b">Our Editorial Process</a> &middot;
          <a href="/author/${author.avatar}/" style="color:#c0392b">Meet the Author: ${htmlEsc(author.name)}</a>
        </p>
      </div>
    </div>`
  };
}

function buildPages(siteName, domain, siteUrl) {
  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  return {
    'editorial-process/index.html': {
      title: 'Our Editorial Review Process',
      noindex: false,
      description: `How every article on ${siteName} is researched, written, fact-checked, and kept up to date.`,
      body: `<div style="max-width:820px;margin:48px auto;padding:0 20px;color:#1a1a1a">
        <div style="border-left:4px solid #c0392b;padding-left:20px;margin-bottom:36px">
          <h1 style="font-size:36px;font-weight:700;line-height:1.2;margin-bottom:8px">Our Editorial Review Process</h1>
          <p style="color:#666;font-size:14px;margin:0">Last updated: ${today} &middot; By the ${siteName} Editorial Team</p>
        </div>
        <div style="background:#f8f9fa;border:1px solid #e8e8e8;border-radius:6px;padding:24px 28px;margin-bottom:40px">
          <p style="font-size:17px;line-height:1.85;margin:0;font-style:italic;color:#333">
            Every article published on ${siteName} goes through a structured, six-step process designed to ensure accuracy, depth, and genuine usefulness for readers. We do not publish to fill space — we publish only when we have something accurate and actionable to say.
          </p>
        </div>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-bottom:48px">
          <div style="text-align:center;padding:20px;background:#fff;border:1px solid #e8e8e8;border-radius:6px">
            <div style="font-size:32px;font-weight:900;color:#c0392b;margin-bottom:4px">100%</div>
            <div style="font-size:13px;color:#666">Expert-reviewed</div>
          </div>
          <div style="text-align:center;padding:20px;background:#fff;border:1px solid #e8e8e8;border-radius:6px">
            <div style="font-size:32px;font-weight:900;color:#c0392b;margin-bottom:4px">90-day</div>
            <div style="font-size:13px;color:#666">Update cycle</div>
          </div>
          <div style="text-align:center;padding:20px;background:#fff;border:1px solid #e8e8e8;border-radius:6px">
            <div style="font-size:32px;font-weight:900;color:#c0392b;margin-bottom:4px">Primary</div>
            <div style="font-size:13px;color:#666">Sources only</div>
          </div>
        </div>
        <h2 style="font-size:24px;font-weight:700;margin:40px 0 16px;padding-bottom:10px;border-bottom:2px solid #e8e8e8">Step 1 — Topic Selection</h2>
        <p style="font-size:16px;line-height:1.85;margin-bottom:16px">Topics are selected based on three criteria: demonstrated reader demand (via search data and reader questions), gaps in existing coverage quality, and the ability of our specialists to add measurable value. We specifically prioritize questions that real people ask but existing content answers poorly — with vague generalizations, outdated statistics, or no actionable guidance.</p>
        <p style="font-size:16px;line-height:1.85;margin-bottom:16px">If the best answer to a question already exists on the internet and we cannot meaningfully improve on it, we do not publish.</p>
        <h2 style="font-size:24px;font-weight:700;margin:40px 0 16px;padding-bottom:10px;border-bottom:2px solid #e8e8e8">Step 2 — Expert Assignment</h2>
        <p style="font-size:16px;line-height:1.85;margin-bottom:16px">Each topic is assigned to the contributor whose professional background most directly qualifies them to cover it. We do not assign general-topic writers to specialized subjects. Contributors are required to disclose any financial interest, sponsorship, or relationship that could influence their coverage before assignment begins.</p>
        <h2 style="font-size:24px;font-weight:700;margin:40px 0 16px;padding-bottom:10px;border-bottom:2px solid #e8e8e8">Step 3 — Research &amp; Primary Sources</h2>
        <p style="font-size:16px;line-height:1.85;margin-bottom:16px">All factual claims must be sourced to a primary or high-quality secondary source before drafting begins. Acceptable primary sources include government databases, peer-reviewed research, official industry standards, and direct professional experience documented with specifics.</p>
        <p style="font-size:16px;line-height:1.85;margin-bottom:16px">We do not accept other aggregator websites, AI-generated content, or unsourced blog posts as sources. If a claim cannot be sourced, it is not published.</p>
        <h2 style="font-size:24px;font-weight:700;margin:40px 0 16px;padding-bottom:10px;border-bottom:2px solid #e8e8e8">Step 4 — Editorial Review</h2>
        <p style="font-size:16px;line-height:1.85;margin-bottom:16px">Every draft goes through a multi-point editorial review. Editors verify:</p>
        <ul style="font-size:16px;line-height:1.85;margin-bottom:20px;padding-left:28px">
          <li style="margin-bottom:10px"><strong>Factual accuracy</strong> — every claim verified against its cited source</li>
          <li style="margin-bottom:10px"><strong>Source quality</strong> — credibility standards met, publication date checked for currency</li>
          <li style="margin-bottom:10px"><strong>Completeness</strong> — does the article directly answer the reader's question?</li>
          <li style="margin-bottom:10px"><strong>Clarity</strong> — accessible to a general reader without sacrificing accuracy</li>
          <li style="margin-bottom:10px"><strong>Conflicts of interest</strong> — all commercial relationships disclosed</li>
          <li style="margin-bottom:10px"><strong>Actionability</strong> — does the reader leave with something useful?</li>
        </ul>
        <h2 style="font-size:24px;font-weight:700;margin:40px 0 16px;padding-bottom:10px;border-bottom:2px solid #e8e8e8">Step 5 — Publication Standards</h2>
        <p style="font-size:16px;line-height:1.85;margin-bottom:16px">Published articles include a clear byline with the contributor's credentials, publication date, and last-reviewed date. All affiliate relationships or sponsored content are disclosed at the top of the article. We maintain strict separation between editorial content and commercial content.</p>
        <h2 style="font-size:24px;font-weight:700;margin:40px 0 16px;padding-bottom:10px;border-bottom:2px solid #e8e8e8">Step 6 — Ongoing Maintenance</h2>
        <p style="font-size:16px;line-height:1.85;margin-bottom:16px">Every published article is on a 90-day review cycle. When significant changes occur — a regulatory update, new research, major market shift — we update sooner. Articles that cannot be updated to remain accurate are unpublished rather than left live with outdated information.</p>
        <p style="font-size:16px;line-height:1.85;margin-bottom:16px">Reader feedback submitted through our "Was this helpful?" widget is reviewed weekly and informs content updates and new topics.</p>
        <div style="background:#f8f9fa;border:1px solid #e8e8e8;border-radius:6px;padding:24px 28px;margin-top:48px">
          <h3 style="font-size:18px;font-weight:700;margin-bottom:12px">Questions about our process?</h3>
          <p style="font-size:15px;line-height:1.7;margin-bottom:12px;color:#444">If you see something that does not look right, or have a question about a specific article's sourcing, contact our editorial team.</p>
          <p style="font-size:14px;color:#666;margin:0">
            <a href="/about/" style="color:#c0392b">About Us</a> &middot;
            <a href="/contact/" style="color:#c0392b">Contact</a> &middot;
            Email: <a href="mailto:editor@${domain}" style="color:#c0392b">editor@${domain}</a>
          </p>
        </div>
      </div>`
    },

    'editorial-guidelines/index.html': {
      title: 'Editorial Guidelines',
      noindex: false,
      description: `The editorial standards and guidelines governing content on ${siteName}.`,
      body: `<div style="max-width:820px;margin:48px auto;padding:0 20px;color:#1a1a1a">
        <h1 style="font-size:36px;font-weight:700;margin-bottom:8px">Editorial Guidelines</h1>
        <p style="color:#666;font-size:14px;margin-bottom:36px">Last updated: ${today}</p>
        <p style="font-size:16px;line-height:1.85;margin-bottom:20px">${siteName} is committed to publishing content that is accurate, useful, and trustworthy. These guidelines govern everything we publish.</p>
        <h2 style="font-size:22px;font-weight:700;margin:36px 0 14px;border-bottom:2px solid #e8e8e8;padding-bottom:10px">Accuracy First</h2>
        <p style="font-size:16px;line-height:1.85;margin-bottom:16px">Every factual claim requires a verifiable source. We do not publish speculation presented as fact. When data is estimated or projected, we say so explicitly.</p>
        <h2 style="font-size:22px;font-weight:700;margin:36px 0 14px;border-bottom:2px solid #e8e8e8;padding-bottom:10px">Independence</h2>
        <p style="font-size:16px;line-height:1.85;margin-bottom:16px">Editorial decisions are made independently of advertising and commercial relationships. Sponsored content is clearly labeled. We do not accept payment in exchange for editorial coverage.</p>
        <h2 style="font-size:22px;font-weight:700;margin:36px 0 14px;border-bottom:2px solid #e8e8e8;padding-bottom:10px">Corrections Policy</h2>
        <p style="font-size:16px;line-height:1.85;margin-bottom:16px">When we make an error, we correct it promptly and transparently. Corrections are noted at the top of the affected article with the date and nature of the change.</p>
        <h2 style="font-size:22px;font-weight:700;margin:36px 0 14px;border-bottom:2px solid #e8e8e8;padding-bottom:10px">Conflicts of Interest</h2>
        <p style="font-size:16px;line-height:1.85;margin-bottom:16px">Contributors must disclose any financial interest, employment, or relationship that could reasonably influence their coverage. Articles with disclosed conflicts are reviewed by a second editor.</p>
        <p style="font-size:14px;color:#666;margin-top:40px">
          Questions about these guidelines? Contact <a href="mailto:editor@${domain}" style="color:#c0392b;">editor@${domain}</a> &middot;
          <a href="/about/" style="color:#c0392b;">About Us</a> &middot;
          <a href="/editorial-process/" style="color:#c0392b;">Our Review Process</a>
        </p>
      </div>`
    }
  };
}

function buildPrivacyPage(siteName, domain) {
  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const lc = '#c0392b';
  return {
    title: 'Privacy Policy',
    noindex: true,
    description: `Privacy Policy for ${domain} — how we collect, use, and protect your personal information.`,
    body: `<div style="max-width:820px;margin:48px auto;padding:0 20px;color:#1a1a1a">
      <h1 style="font-size:34px;font-weight:700;margin-bottom:8px">Privacy Policy</h1>
      <p style="color:#666;font-size:14px;margin-bottom:8px">Last updated: ${today}</p>
      <p style="font-size:16px;line-height:1.85;margin-bottom:28px">This Privacy Policy describes how <strong>${siteName}</strong> ("we", "us", "our"), accessible at <strong>${domain}</strong>, collects, uses, discloses, and protects personal information about visitors ("you"). Please read this policy carefully. If you do not agree, please stop using the site.</p>

      <div style="background:#f8f9fa;border:1px solid #e8e8e8;border-radius:6px;padding:18px 22px;margin-bottom:36px">
        <p style="font-size:13px;color:#555;margin:0;line-height:1.7"><strong>Quick summary:</strong> We collect standard analytics data to improve the site. We serve ads through Google AdSense and MGID. We use Cloudflare for security. We do <strong>not</strong> sell your personal data. You can opt out of personalized advertising at any time.</p>
      </div>

      <h2 style="font-size:22px;font-weight:700;margin:36px 0 14px;padding-bottom:10px;border-bottom:2px solid #e8e8e8">1. Data Controller</h2>
      <p style="font-size:16px;line-height:1.85;margin-bottom:16px">The data controller responsible for your personal information is the operator of <strong>${domain}</strong>. For privacy-related questions or requests, contact us at:</p>
      <p style="font-size:16px;line-height:1.85;margin-bottom:16px">&#x1f4e7; <a href="mailto:privacy@${domain}" style="color:${lc}">privacy@${domain}</a></p>
      <p style="font-size:15px;line-height:1.7;margin-bottom:16px;color:#555">We aim to respond to all privacy requests within <strong>30 days</strong> (or within the statutory period required by applicable law, whichever is shorter).</p>

      <h2 style="font-size:22px;font-weight:700;margin:36px 0 14px;padding-bottom:10px;border-bottom:2px solid #e8e8e8">2. Information We Collect</h2>
      <h3 style="font-size:18px;font-weight:700;margin:20px 0 10px">2.1 Information Collected Automatically</h3>
      <p style="font-size:16px;line-height:1.85;margin-bottom:12px">When you visit ${domain}, our servers and third-party tools automatically collect:</p>
      <ul style="font-size:16px;line-height:1.85;margin-bottom:16px;padding-left:24px">
        <li style="margin-bottom:8px"><strong>Log data:</strong> IP address (truncated/anonymized), browser type and version, operating system, device type</li>
        <li style="margin-bottom:8px"><strong>Usage data:</strong> pages visited, time on page, scroll depth, exit page, referring URL</li>
        <li style="margin-bottom:8px"><strong>Technical data:</strong> screen resolution, language preference, timezone</li>
        <li style="margin-bottom:8px"><strong>Interaction data:</strong> clicks on links, use of interactive tools (calculators), article feedback votes</li>
        <li style="margin-bottom:8px"><strong>Cookie data:</strong> see Section 5 for full details</li>
      </ul>
      <h3 style="font-size:18px;font-weight:700;margin:20px 0 10px">2.2 Information You Provide Voluntarily</h3>
      <ul style="font-size:16px;line-height:1.85;margin-bottom:16px;padding-left:24px">
        <li style="margin-bottom:8px"><strong>Email address</strong> &mdash; if you subscribe to our newsletter or editorial updates</li>
        <li style="margin-bottom:8px"><strong>Name and message</strong> &mdash; if you contact us via email</li>
        <li style="margin-bottom:8px"><strong>Article feedback</strong> &mdash; thumbs up/down votes (anonymous; not linked to any account)</li>
      </ul>
      <p style="font-size:15px;line-height:1.7;margin-bottom:16px;color:#555">We do <strong>not</strong> operate user accounts, collect payment information, or require registration to access any content.</p>

      <h2 style="font-size:22px;font-weight:700;margin:36px 0 14px;padding-bottom:10px;border-bottom:2px solid #e8e8e8">3. Legal Basis for Processing (GDPR)</h2>
      <p style="font-size:16px;line-height:1.85;margin-bottom:12px">For visitors in the EEA, UK, or Switzerland, we process personal data under the following legal bases (GDPR Article 6):</p>
      <div style="overflow-x:auto;margin-bottom:20px">
        <table style="width:100%;border-collapse:collapse;font-size:14px">
          <thead><tr style="background:#f8f9fa"><th style="padding:10px 12px;text-align:left;border:1px solid #ddd">Purpose</th><th style="padding:10px 12px;text-align:left;border:1px solid #ddd">Legal Basis</th></tr></thead>
          <tbody>
            <tr><td style="padding:9px 12px;border:1px solid #ddd">Analytics (site improvement)</td><td style="padding:9px 12px;border:1px solid #ddd">Legitimate interest (Art. 6(1)(f))</td></tr>
            <tr style="background:#f9f9f9"><td style="padding:9px 12px;border:1px solid #ddd">Personalized advertising</td><td style="padding:9px 12px;border:1px solid #ddd">Consent (Art. 6(1)(a)) &mdash; only after cookie consent</td></tr>
            <tr><td style="padding:9px 12px;border:1px solid #ddd">Newsletter / email updates</td><td style="padding:9px 12px;border:1px solid #ddd">Consent (Art. 6(1)(a)) &mdash; opt-in only</td></tr>
            <tr style="background:#f9f9f9"><td style="padding:9px 12px;border:1px solid #ddd">Responding to inquiries</td><td style="padding:9px 12px;border:1px solid #ddd">Contract / legitimate interest (Art. 6(1)(b)(f))</td></tr>
            <tr><td style="padding:9px 12px;border:1px solid #ddd">Security &amp; fraud prevention</td><td style="padding:9px 12px;border:1px solid #ddd">Legitimate interest (Art. 6(1)(f))</td></tr>
            <tr style="background:#f9f9f9"><td style="padding:9px 12px;border:1px solid #ddd">Legal compliance</td><td style="padding:9px 12px;border:1px solid #ddd">Legal obligation (Art. 6(1)(c))</td></tr>
          </tbody>
        </table>
      </div>

      <h2 style="font-size:22px;font-weight:700;margin:36px 0 14px;padding-bottom:10px;border-bottom:2px solid #e8e8e8">4. How We Use Your Information</h2>
      <ul style="font-size:16px;line-height:1.85;margin-bottom:16px;padding-left:24px">
        <li style="margin-bottom:8px">Operate and maintain the website</li>
        <li style="margin-bottom:8px">Analyze traffic patterns and improve content quality</li>
        <li style="margin-bottom:8px">Serve relevant advertisements via Google AdSense and MGID</li>
        <li style="margin-bottom:8px">Send newsletters and editorial updates (subscribers only)</li>
        <li style="margin-bottom:8px">Respond to your inquiries</li>
        <li style="margin-bottom:8px">Detect and prevent abuse, spam, or security threats</li>
        <li style="margin-bottom:8px">Comply with legal obligations</li>
        <li style="margin-bottom:8px">Aggregate anonymous statistics for content planning</li>
      </ul>
      <p style="font-size:15px;line-height:1.7;margin-bottom:16px;color:#555">We do <strong>not</strong> use your data for automated decision-making or profiling that produces legal effects on you.</p>

      <h2 style="font-size:22px;font-weight:700;margin:36px 0 14px;padding-bottom:10px;border-bottom:2px solid #e8e8e8">5. Cookies &amp; Tracking Technologies</h2>
      <p style="font-size:16px;line-height:1.85;margin-bottom:12px">We use cookies and similar technologies. You can manage preferences at any time via your browser settings or by withdrawing consent through our cookie banner.</p>
      <div style="overflow-x:auto;margin-bottom:16px">
        <table style="width:100%;border-collapse:collapse;font-size:13px">
          <thead><tr style="background:#f8f9fa"><th style="padding:9px 10px;text-align:left;border:1px solid #ddd;min-width:140px">Cookie / Provider</th><th style="padding:9px 10px;text-align:left;border:1px solid #ddd">Category</th><th style="padding:9px 10px;text-align:left;border:1px solid #ddd;min-width:200px">Purpose</th><th style="padding:9px 10px;text-align:left;border:1px solid #ddd">Duration</th></tr></thead>
          <tbody>
            <tr><td style="padding:8px 10px;border:1px solid #ddd"><code>cookie_consent</code></td><td style="padding:8px 10px;border:1px solid #ddd">Essential</td><td style="padding:8px 10px;border:1px solid #ddd">Stores your cookie consent choice</td><td style="padding:8px 10px;border:1px solid #ddd">1 year</td></tr>
            <tr style="background:#f9f9f9"><td style="padding:8px 10px;border:1px solid #ddd">Google Analytics (_ga, _gid, _ga_*)</td><td style="padding:8px 10px;border:1px solid #ddd">Analytics</td><td style="padding:8px 10px;border:1px solid #ddd">Tracks page views, sessions, and user behavior (anonymized)</td><td style="padding:8px 10px;border:1px solid #ddd">_ga: 2 yrs; _gid: 24 hrs</td></tr>
            <tr><td style="padding:8px 10px;border:1px solid #ddd">Google AdSense (__gads, __gpi)</td><td style="padding:8px 10px;border:1px solid #ddd">Advertising</td><td style="padding:8px 10px;border:1px solid #ddd">Delivers personalized or contextual ads; frequency capping</td><td style="padding:8px 10px;border:1px solid #ddd">Up to 2 years</td></tr>
            <tr style="background:#f9f9f9"><td style="padding:8px 10px;border:1px solid #ddd">MGID (mgid_*)</td><td style="padding:8px 10px;border:1px solid #ddd">Advertising</td><td style="padding:8px 10px;border:1px solid #ddd">Native content recommendations; audience segmentation</td><td style="padding:8px 10px;border:1px solid #ddd">Up to 1 year</td></tr>
            <tr><td style="padding:8px 10px;border:1px solid #ddd">Cloudflare (__cf_bm, _cfuvid)</td><td style="padding:8px 10px;border:1px solid #ddd">Security</td><td style="padding:8px 10px;border:1px solid #ddd">Bot management, DDoS protection, security challenges</td><td style="padding:8px 10px;border:1px solid #ddd">30 min &ndash; session</td></tr>
          </tbody>
        </table>
      </div>
      <p style="font-size:15px;line-height:1.7;margin-bottom:16px;color:#555">Advertising cookies are only set <strong>after you accept</strong> our cookie consent banner. Essential and security cookies do not require consent as they are necessary for basic site functionality.</p>

      <h2 style="font-size:22px;font-weight:700;margin:36px 0 14px;padding-bottom:10px;border-bottom:2px solid #e8e8e8">6. Google Analytics 4</h2>
      <p style="font-size:16px;line-height:1.85;margin-bottom:16px">We use <strong>Google Analytics 4 (GA4)</strong> to understand how visitors use our site. GA4 collects anonymized behavioral data. IP anonymization is enabled &mdash; your full IP address is never stored by Google Analytics on our behalf.</p>
      <p style="font-size:16px;line-height:1.85;margin-bottom:16px">Google processes data on servers in the United States. Google is certified under the EU-US Data Privacy Framework. Analytics data is retained for <strong>14 months</strong> then auto-deleted.</p>
      <p style="font-size:16px;line-height:1.85;margin-bottom:16px">Opt out via the <a href="https://tools.google.com/dlpage/gaoptout" style="color:${lc}" rel="noopener noreferrer">Google Analytics Opt-out Browser Add-on</a>. Reference: <a href="https://policies.google.com/privacy" style="color:${lc}" rel="noopener noreferrer">Google Privacy Policy</a>.</p>

      <h2 style="font-size:22px;font-weight:700;margin:36px 0 14px;padding-bottom:10px;border-bottom:2px solid #e8e8e8">7. Google AdSense &amp; Advertising</h2>
      <p style="font-size:16px;line-height:1.85;margin-bottom:16px">We participate in <strong>Google AdSense</strong>. Google may use cookies to serve ads based on your interests and prior visits to our site or other sites. We also participate in <strong>affiliate marketing programs</strong> &mdash; affiliate links are disclosed and do not influence editorial content.</p>
      <p style="font-size:16px;line-height:1.85;margin-bottom:12px">Opt out of personalized advertising:</p>
      <ul style="font-size:16px;line-height:1.85;margin-bottom:16px;padding-left:24px">
        <li style="margin-bottom:6px"><a href="https://www.google.com/settings/ads" style="color:${lc}" rel="noopener noreferrer">Google Ad Settings</a></li>
        <li style="margin-bottom:6px"><a href="https://www.aboutads.info/choices/" style="color:${lc}" rel="noopener noreferrer">Digital Advertising Alliance opt-out</a></li>
        <li style="margin-bottom:6px"><a href="https://www.youronlinechoices.eu/" style="color:${lc}" rel="noopener noreferrer">EDAA opt-out (EU)</a></li>
        <li style="margin-bottom:6px"><a href="https://optout.networkadvertising.org/" style="color:${lc}" rel="noopener noreferrer">NAI opt-out tool</a></li>
      </ul>

      <h2 style="font-size:22px;font-weight:700;margin:36px 0 14px;padding-bottom:10px;border-bottom:2px solid #e8e8e8">8. MGID Native Advertising</h2>
      <p style="font-size:16px;line-height:1.85;margin-bottom:16px">We use <strong>MGID</strong>, a native advertising platform, to display sponsored content recommendations. MGID may set cookies to deliver relevant content and measure ad performance. MGID is an IAB member. Opt out at <a href="https://www.mgid.com/privacy-policy" style="color:${lc}" rel="noopener noreferrer">mgid.com/privacy-policy</a>.</p>

      <h2 style="font-size:22px;font-weight:700;margin:36px 0 14px;padding-bottom:10px;border-bottom:2px solid #e8e8e8">9. Cloudflare</h2>
      <p style="font-size:16px;line-height:1.85;margin-bottom:16px">Our website is served through <strong>Cloudflare</strong> for CDN, DDoS protection, bot mitigation, and performance. Traffic passing through Cloudflare's network may include your IP address and request headers for security purposes. Cloudflare acts as a data processor under our Data Processing Addendum. Details: <a href="https://www.cloudflare.com/privacypolicy/" style="color:${lc}" rel="noopener noreferrer">cloudflare.com/privacypolicy</a>.</p>

      <h2 style="font-size:22px;font-weight:700;margin:36px 0 14px;padding-bottom:10px;border-bottom:2px solid #e8e8e8">10. Third-Party Services</h2>
      <div style="overflow-x:auto;margin-bottom:20px">
        <table style="width:100%;border-collapse:collapse;font-size:14px">
          <thead><tr style="background:#f8f9fa"><th style="padding:9px 12px;text-align:left;border:1px solid #ddd">Service</th><th style="padding:9px 12px;text-align:left;border:1px solid #ddd">Purpose</th><th style="padding:9px 12px;text-align:left;border:1px solid #ddd">Data Processed</th><th style="padding:9px 12px;text-align:left;border:1px solid #ddd">Privacy Policy</th></tr></thead>
          <tbody>
            <tr><td style="padding:8px 12px;border:1px solid #ddd">Google Analytics 4</td><td style="padding:8px 12px;border:1px solid #ddd">Analytics</td><td style="padding:8px 12px;border:1px solid #ddd">Anonymized usage data</td><td style="padding:8px 12px;border:1px solid #ddd"><a href="https://policies.google.com/privacy" style="color:${lc}" rel="noopener">policies.google.com</a></td></tr>
            <tr style="background:#f9f9f9"><td style="padding:8px 12px;border:1px solid #ddd">Google AdSense</td><td style="padding:8px 12px;border:1px solid #ddd">Display advertising</td><td style="padding:8px 12px;border:1px solid #ddd">Browsing behavior, cookies</td><td style="padding:8px 12px;border:1px solid #ddd"><a href="https://policies.google.com/technologies/ads" style="color:${lc}" rel="noopener">policies.google.com</a></td></tr>
            <tr><td style="padding:8px 12px;border:1px solid #ddd">MGID</td><td style="padding:8px 12px;border:1px solid #ddd">Native advertising</td><td style="padding:8px 12px;border:1px solid #ddd">Browsing behavior, cookies</td><td style="padding:8px 12px;border:1px solid #ddd"><a href="https://www.mgid.com/privacy-policy" style="color:${lc}" rel="noopener">mgid.com</a></td></tr>
            <tr style="background:#f9f9f9"><td style="padding:8px 12px;border:1px solid #ddd">Cloudflare</td><td style="padding:8px 12px;border:1px solid #ddd">CDN &amp; Security</td><td style="padding:8px 12px;border:1px solid #ddd">IP address, request metadata</td><td style="padding:8px 12px;border:1px solid #ddd"><a href="https://www.cloudflare.com/privacypolicy/" style="color:${lc}" rel="noopener">cloudflare.com</a></td></tr>
            <tr><td style="padding:8px 12px;border:1px solid #ddd">Pexels</td><td style="padding:8px 12px;border:1px solid #ddd">Stock photography</td><td style="padding:8px 12px;border:1px solid #ddd">Images downloaded &amp; self-hosted (not via Pexels CDN)</td><td style="padding:8px 12px;border:1px solid #ddd"><a href="https://www.pexels.com/privacy-policy/" style="color:${lc}" rel="noopener">pexels.com</a></td></tr>
          </tbody>
        </table>
      </div>

      <h2 style="font-size:22px;font-weight:700;margin:36px 0 14px;padding-bottom:10px;border-bottom:2px solid #e8e8e8">11. Data Retention</h2>
      <div style="overflow-x:auto;margin-bottom:20px">
        <table style="width:100%;border-collapse:collapse;font-size:14px">
          <thead><tr style="background:#f8f9fa"><th style="padding:9px 12px;text-align:left;border:1px solid #ddd">Data Type</th><th style="padding:9px 12px;text-align:left;border:1px solid #ddd">Retention Period</th></tr></thead>
          <tbody>
            <tr><td style="padding:8px 12px;border:1px solid #ddd">Google Analytics data</td><td style="padding:8px 12px;border:1px solid #ddd">14 months (GA4 default, then auto-deleted)</td></tr>
            <tr style="background:#f9f9f9"><td style="padding:8px 12px;border:1px solid #ddd">Email subscriber data</td><td style="padding:8px 12px;border:1px solid #ddd">Until you unsubscribe; deleted within 30 days of request</td></tr>
            <tr><td style="padding:8px 12px;border:1px solid #ddd">Contact form inquiries</td><td style="padding:8px 12px;border:1px solid #ddd">12 months from last communication</td></tr>
            <tr style="background:#f9f9f9"><td style="padding:8px 12px;border:1px solid #ddd">Anonymous feedback votes</td><td style="padding:8px 12px;border:1px solid #ddd">Indefinite (no personal data linked)</td></tr>
            <tr><td style="padding:8px 12px;border:1px solid #ddd">Server access logs</td><td style="padding:8px 12px;border:1px solid #ddd">30 days (Cloudflare); 7 days (nginx)</td></tr>
            <tr style="background:#f9f9f9"><td style="padding:8px 12px;border:1px solid #ddd">Cookie consent preference</td><td style="padding:8px 12px;border:1px solid #ddd">1 year (stored in your browser)</td></tr>
          </tbody>
        </table>
      </div>

      <h2 style="font-size:22px;font-weight:700;margin:36px 0 14px;padding-bottom:10px;border-bottom:2px solid #e8e8e8">12. Your GDPR Rights (EEA / UK)</h2>
      <p style="font-size:16px;line-height:1.85;margin-bottom:12px">If you are in the EEA, UK, or Switzerland, you have the following rights under GDPR:</p>
      <ul style="font-size:16px;line-height:1.85;margin-bottom:16px;padding-left:24px">
        <li style="margin-bottom:10px"><strong>Right of access (Art. 15):</strong> Request a copy of personal data we hold about you.</li>
        <li style="margin-bottom:10px"><strong>Right to rectification (Art. 16):</strong> Request correction of inaccurate or incomplete data.</li>
        <li style="margin-bottom:10px"><strong>Right to erasure (Art. 17):</strong> Request deletion of your personal data where there is no compelling reason to retain it.</li>
        <li style="margin-bottom:10px"><strong>Right to restriction (Art. 18):</strong> Request that we limit how we process your data while a dispute is resolved.</li>
        <li style="margin-bottom:10px"><strong>Right to data portability (Art. 20):</strong> Receive your data in a structured, machine-readable format.</li>
        <li style="margin-bottom:10px"><strong>Right to object (Art. 21):</strong> Object to processing based on legitimate interests, including direct marketing.</li>
        <li style="margin-bottom:10px"><strong>Right to withdraw consent (Art. 7(3)):</strong> Withdraw consent at any time without affecting the lawfulness of prior processing.</li>
      </ul>
      <p style="font-size:16px;line-height:1.85;margin-bottom:16px">To exercise these rights, email <a href="mailto:privacy@${domain}" style="color:${lc}">privacy@${domain}</a>. We will respond within 30 days. You also have the right to lodge a complaint with your local data protection authority (e.g., the ICO in the UK, or your national DPA in the EU).</p>

      <h2 style="font-size:22px;font-weight:700;margin:36px 0 14px;padding-bottom:10px;border-bottom:2px solid #e8e8e8">13. California Privacy Rights (CCPA / CPRA)</h2>
      <p style="font-size:16px;line-height:1.85;margin-bottom:12px">California residents have the following rights under CCPA and CPRA:</p>
      <ul style="font-size:16px;line-height:1.85;margin-bottom:16px;padding-left:24px">
        <li style="margin-bottom:8px"><strong>Right to know:</strong> Request disclosure of personal information collected about you in the past 12 months.</li>
        <li style="margin-bottom:8px"><strong>Right to delete:</strong> Request deletion of personal information (subject to exceptions).</li>
        <li style="margin-bottom:8px"><strong>Right to correct:</strong> Request correction of inaccurate personal information.</li>
        <li style="margin-bottom:8px"><strong>Right to opt-out of sale or sharing:</strong> We do <strong>not</strong> sell personal information.</li>
        <li style="margin-bottom:8px"><strong>Right to non-discrimination:</strong> Exercising your rights will not result in discriminatory treatment.</li>
      </ul>
      <p style="font-size:16px;line-height:1.85;margin-bottom:12px"><strong>Categories of personal information collected (CCPA disclosure):</strong></p>
      <ul style="font-size:16px;line-height:1.85;margin-bottom:16px;padding-left:24px">
        <li style="margin-bottom:6px">Identifiers (anonymized IP address, cookie IDs)</li>
        <li style="margin-bottom:6px">Internet / network activity (pages visited, interactions)</li>
        <li style="margin-bottom:6px">Inferences drawn by ad networks (not by us directly)</li>
      </ul>
      <p style="font-size:16px;line-height:1.85;margin-bottom:16px">To exercise California rights, email <a href="mailto:privacy@${domain}" style="color:${lc}">privacy@${domain}</a>.</p>

      <h2 style="font-size:22px;font-weight:700;margin:36px 0 14px;padding-bottom:10px;border-bottom:2px solid #e8e8e8">14. Do Not Sell My Personal Information</h2>
      <p style="font-size:16px;line-height:1.85;margin-bottom:16px">We do <strong>not</strong> sell personal information to third parties. Third-party advertising networks may use cookie data for targeted advertising per their own privacy policies &mdash; governed by your cookie consent and by the opt-out tools in Sections 7 and 8 above.</p>

      <h2 style="font-size:22px;font-weight:700;margin:36px 0 14px;padding-bottom:10px;border-bottom:2px solid #e8e8e8">15. International Data Transfers</h2>
      <p style="font-size:16px;line-height:1.85;margin-bottom:16px">Our website and some service providers are based in the United States. If you are in the EEA, UK, or another jurisdiction with data transfer restrictions, your data may be transferred to and processed in the US. We rely on the <strong>EU-US Data Privacy Framework</strong> (Google is certified) and <strong>Standard Contractual Clauses (SCCs)</strong> where applicable.</p>

      <h2 style="font-size:22px;font-weight:700;margin:36px 0 14px;padding-bottom:10px;border-bottom:2px solid #e8e8e8">16. Children's Privacy (COPPA)</h2>
      <p style="font-size:16px;line-height:1.85;margin-bottom:16px">Our website is not directed to children under 13 (or under 16 in the EEA). We do not knowingly collect personal information from minors. If you believe we have inadvertently collected information from a child, contact us at <a href="mailto:privacy@${domain}" style="color:${lc}">privacy@${domain}</a> and we will delete it promptly.</p>

      <h2 style="font-size:22px;font-weight:700;margin:36px 0 14px;padding-bottom:10px;border-bottom:2px solid #e8e8e8">17. Security</h2>
      <p style="font-size:16px;line-height:1.85;margin-bottom:16px">We implement appropriate technical and organizational security measures:</p>
      <ul style="font-size:16px;line-height:1.85;margin-bottom:16px;padding-left:24px">
        <li style="margin-bottom:8px"><strong>HTTPS/TLS encryption</strong> &mdash; all data in transit is encrypted</li>
        <li style="margin-bottom:8px"><strong>Cloudflare protection</strong> &mdash; DDoS mitigation, bot detection, WAF</li>
        <li style="margin-bottom:8px"><strong>Access controls</strong> &mdash; administrative access limited to authorized personnel</li>
        <li style="margin-bottom:8px"><strong>Regular security updates</strong> &mdash; server software kept up to date</li>
      </ul>
      <p style="font-size:15px;line-height:1.7;margin-bottom:16px;color:#555">No Internet transmission is 100% secure. In the event of a data breach affecting your rights, we will notify affected individuals and relevant authorities as required by law.</p>

      <h2 style="font-size:22px;font-weight:700;margin:36px 0 14px;padding-bottom:10px;border-bottom:2px solid #e8e8e8">18. Third-Party Links</h2>
      <p style="font-size:16px;line-height:1.85;margin-bottom:16px">Our articles contain links to third-party websites for reference. We are not responsible for the privacy practices of those sites. This Privacy Policy applies only to <strong>${domain}</strong>. We encourage you to review the privacy policy of any external site you visit.</p>

      <h2 style="font-size:22px;font-weight:700;margin:36px 0 14px;padding-bottom:10px;border-bottom:2px solid #e8e8e8">19. Changes to This Policy</h2>
      <p style="font-size:16px;line-height:1.85;margin-bottom:16px">We may update this policy to reflect changes in our practices or legal requirements. Material changes will be reflected in an updated "Last updated" date at the top of this page. Continued use of the website after changes are posted constitutes your acknowledgment of the updated policy.</p>

      <h2 style="font-size:22px;font-weight:700;margin:36px 0 14px;padding-bottom:10px;border-bottom:2px solid #e8e8e8">20. Contact &amp; Data Protection Inquiries</h2>
      <div style="background:#f8f9fa;border:1px solid #e8e8e8;border-radius:6px;padding:20px 24px;margin-bottom:20px">
        <p style="font-size:15px;line-height:1.7;margin:0 0 8px"><strong>Privacy requests &amp; data rights:</strong> <a href="mailto:privacy@${domain}" style="color:${lc}">privacy@${domain}</a></p>
        <p style="font-size:15px;line-height:1.7;margin:0 0 8px"><strong>General contact:</strong> <a href="mailto:contact@${domain}" style="color:${lc}">contact@${domain}</a></p>
        <p style="font-size:15px;line-height:1.7;margin:0"><strong>Website:</strong> <a href="https://${domain}" style="color:${lc}">${domain}</a></p>
      </div>
      <p style="font-size:15px;line-height:1.7;color:#555">If you are in the EU/UK and are unsatisfied with our response, you have the right to lodge a complaint with your local supervisory authority (e.g., <a href="https://ico.org.uk" style="color:${lc}" rel="noopener noreferrer">ICO</a> in the UK).</p>
    </div>`
  };
}

function buildAboutPage(siteName, domain, nicheSlug) {
  const lead = AUTHOR_PERSONAS[nicheSlug];
  const additionals = ADDITIONAL_AUTHORS[nicheSlug] || [];
  const allAuthors = [];
  if (lead) allAuthors.push({ name: lead.name, title: lead.title, bio: lead.bio });
  additionals.forEach(a => allAuthors.push({ name: a.name, title: a.title, bio: a.bio }));

  const authorCards = allAuthors.map(a => `
    <div style="display:flex;gap:20px;padding:20px 0;border-bottom:1px solid #f0f0f0">
      <div style="flex:1">
        <p style="font-size:17px;font-weight:700;margin:0 0 4px;color:#1a1a1a">${htmlEsc(a.name)}</p>
        <p style="font-size:13px;font-weight:600;color:#c0392b;margin:0 0 10px;text-transform:uppercase;letter-spacing:.04em">${htmlEsc(a.title)}</p>
        <p style="font-size:15px;line-height:1.75;color:#444;margin:0">${htmlEsc(a.bio)}</p>
      </div>
    </div>`).join('');

  return {
    title: 'About Us',
    noindex: false,
    description: `Learn about ${siteName}, our editorial mission, and the experts behind our content.`,
    body: `<div style="max-width:800px;margin:40px auto;padding:0 20px;color:#1a1a1a">
      <h1 style="font-size:32px;font-weight:700;margin-bottom:20px">About ${htmlEsc(siteName)}</h1>
      <p style="font-size:16px;line-height:1.8;margin-bottom:16px">
        ${htmlEsc(siteName)} was founded on a simple premise: people deserve access to clear,
        expert-level information without having to wade through vague, generic content.
        We publish in-depth guides written by verified subject matter experts with
        real-world experience — not generalists writing about everything.
      </p>
      <p style="font-size:16px;line-height:1.8;margin-bottom:24px">
        Every article on this site goes through our editorial review process before
        publication and is updated regularly to reflect current data, costs, and best practices.
      </p>

      <h2 style="font-size:22px;font-weight:700;margin:32px 0 12px;padding-bottom:10px;border-bottom:2px solid #e8e8e8">Our Editorial Mission</h2>
      <p style="font-size:16px;line-height:1.8;margin-bottom:16px">
        We publish articles because real people have real questions that deserve
        substantive, accurate answers. Our editorial team reviews every piece for
        factual accuracy, source quality, and practical value before it goes live.
        We do not accept sponsored content or payment to influence editorial decisions.
      </p>

      <h2 style="font-size:22px;font-weight:700;margin:32px 0 12px;padding-bottom:10px;border-bottom:2px solid #e8e8e8">How We Ensure Accuracy</h2>
      <ul style="font-size:16px;line-height:1.8;margin-bottom:16px;padding-left:24px">
        <li style="margin-bottom:8px">Every article is written by a vetted expert in the relevant field</li>
        <li style="margin-bottom:8px">Claims are supported by citations from government agencies, academic institutions, and established industry bodies</li>
        <li style="margin-bottom:8px">Articles are reviewed and updated at least every 90 days</li>
        <li style="margin-bottom:8px">We do not accept sponsored content or payment to influence editorial decisions</li>
      </ul>

      ${allAuthors.length ? `
      <h2 style="font-size:22px;font-weight:700;margin:32px 0 12px;padding-bottom:10px;border-bottom:2px solid #e8e8e8">Meet Our Contributors</h2>
      ${authorCards}` : ''}

      <div style="margin-top:32px;padding:16px 20px;background:#f8f9fa;border-radius:6px;font-size:14px;color:#555">
        Questions? Reach us at <a href="mailto:editor@${domain}" style="color:#c0392b">editor@${domain}</a> &middot;
        <a href="/editorial-guidelines/" style="color:#c0392b">Editorial Guidelines</a> &middot;
        <a href="/editorial-process/" style="color:#c0392b">Review Process</a> &middot;
        <a href="/disclaimer/" style="color:#c0392b">Disclaimer</a>
      </div>
    </div>`
  };
}

async function regenerateStaticPages(site) {
  const siteName = site.domain.split('.')[0].replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  const siteUrl = `https://${site.domain}`;
  const siteConfig = { name: siteName, url: siteUrl, domain: site.domain };

  const pages = buildPages(siteName, site.domain, siteUrl);

  // Contact page — indexable, detailed
  pages['contact/index.html'] = buildContactPage(siteName, site.domain);

  // Privacy page — comprehensive GDPR/CCPA/COPPA
  pages['privacy/index.html'] = buildPrivacyPage(siteName, site.domain);

  // Add niche-specific methodology page
  const nicheSlug = site.niche_slug || '';

  // About page — lists all contributors, indexed for E-E-A-T
  pages['about/index.html'] = buildAboutPage(siteName, site.domain, nicheSlug);
  const methMeta = NICHE_METHODOLOGY[nicheSlug] || DEFAULT_METHODOLOGY;
  pages['methodology/index.html'] = {
    title: methMeta.title,
    noindex: false,
    description: methMeta.intro.slice(0, 155),
    body: renderMethodologyBody(nicheSlug, site.domain)
  };

  for (const [path, page] of Object.entries(pages)) {
    const dir = join(WWW_ROOT, site.domain, path.replace('/index.html', ''));
    mkdirSync(dir, { recursive: true });
    const canonical = `${siteUrl}/${path.replace('index.html', '')}`;
    const html = simplePageWrapper(page.title, page.description, page.body, siteConfig, { noindex: page.noindex || false, canonical, template: site.template || '' });
    writeFileSync(join(WWW_ROOT, site.domain, path), html, 'utf-8');
  }

  // Reviewer page — only for YMYL niches that have a reviewer
  const author = AUTHOR_PERSONAS[nicheSlug];
  if (author?.reviewer && author?.ymyl) {
    const rev = buildReviewerPage(author.reviewer, author, siteName, siteUrl, site.domain);
    const revDir = join(WWW_ROOT, site.domain, 'author', rev.slug);
    mkdirSync(revDir, { recursive: true });
    const canonical = `${siteUrl}/author/${rev.slug}/`;
    const html = simplePageWrapper(rev.title, rev.description, rev.body, siteConfig, { noindex: false, canonical, template: site.template || '' });
    writeFileSync(join(revDir, 'index.html'), html, 'utf-8');
  }

  // 404 page — must live at root level (nginx: error_page 404 /404.html)
  const notFoundBody = `
<div style="max-width:600px;margin:80px auto;padding:0 20px;text-align:center;">
  <div style="font-size:80px;font-weight:900;color:#e8e8e8;line-height:1;margin-bottom:16px;">404</div>
  <h1 style="font-family:Georgia,serif;font-size:28px;font-weight:700;color:#1a1a2e;margin-bottom:12px;">Page Not Found</h1>
  <p style="font-size:16px;line-height:1.7;color:#666;margin-bottom:32px;">
    The page you're looking for doesn't exist or may have been moved.
    Here are some helpful links instead:
  </p>
  <div style="display:flex;flex-wrap:wrap;gap:12px;justify-content:center;margin-bottom:40px;">
    <a href="/" style="display:inline-block;background:#1a1a2e;color:white;padding:11px 22px;border-radius:5px;text-decoration:none;font-size:15px;font-weight:700;">← Back to Home</a>
  </div>
  <div style="border-top:1px solid #eee;padding-top:28px;">
    <p style="font-size:14px;font-weight:700;color:#1a1a2e;margin-bottom:12px;">Browse by Category</p>
    <div style="display:flex;flex-wrap:wrap;gap:8px;justify-content:center;" id="notfound-cats"></div>
  </div>
</div>
<script>
  fetch('/api/categories.json').then(r=>r.json()).then(cats=>{
    const el=document.getElementById('notfound-cats');
    if(!el||!cats?.length)return;
    el.innerHTML=cats.slice(0,6).map(c=>\`<a href="/category/\${c.slug}/" style="display:inline-block;background:#f4f4f0;color:#333;padding:6px 14px;border-radius:20px;text-decoration:none;font-size:13px;font-weight:600;">\${c.name}</a>\`).join('');
  }).catch(()=>{});
</script>`;
  writeFileSync(join(WWW_ROOT, site.domain, '404.html'),
    simplePageWrapper('Page Not Found', `The page you're looking for doesn't exist — ${siteName}`, notFoundBody, siteConfig, { noindex: true, template: site.template || '' }),
    'utf-8');
}

async function run() {
  const args = process.argv.slice(2);
  const all = args.includes('--all');
  const siteId = parseInt(args.find(a => a.startsWith('--site-id='))?.split('=')[1]
    || args[args.indexOf('--site-id') + 1]);

  if (!all && !siteId) {
    console.error('Uso: node regenerate-static-pages.js --site-id <id>  oppure  --all');
    process.exit(1);
  }

  const sites = all
    ? await sql`SELECT s.id, s.domain, s.template, n.slug as niche_slug FROM sites s JOIN niches n ON n.id = s.niche_id WHERE s.status != 'inactive' ORDER BY s.id`
    : await sql`SELECT s.id, s.domain, s.template, n.slug as niche_slug FROM sites s JOIN niches n ON n.id = s.niche_id WHERE s.id = ${siteId}`;

  if (!sites.length) { console.error('Nessun sito trovato'); process.exit(1); }

  console.log(`Rigenerando pagine statiche per ${sites.length} sito/i...\n`);
  let ok = 0, fail = 0;

  for (const site of sites) {
    try {
      await regenerateStaticPages(site);
      console.log(`  OK  ${site.domain}`);
      ok++;
    } catch (err) {
      console.error(`  ERR ${site.domain}: ${err.message}`);
      fail++;
    }
  }

  console.log(`\nCompletato: ${ok} ok, ${fail} falliti`);
  process.exit(0);
}

run().catch(err => { console.error(err); process.exit(1); });
