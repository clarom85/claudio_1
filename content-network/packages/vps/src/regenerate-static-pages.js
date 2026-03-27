/**
 * regenerate-static-pages.js — Rigenera le pagine statiche per siti esistenti.
 * Uso: node packages/vps/src/regenerate-static-pages.js --site-id 5
 *      node packages/vps/src/regenerate-static-pages.js --all
 */
import 'dotenv/config';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { sql } from '@content-network/db';
import { NICHE_METHODOLOGY, DEFAULT_METHODOLOGY, renderMethodologyBody } from '@content-network/site-spawner/src/niche-methodology.js';
import { AUTHOR_PERSONAS } from '@content-network/content-engine/src/prompts.js';

const WWW_ROOT = process.env.WWW_ROOT || '/var/www';

function htmlEsc(str = '') {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function simplePageWrapper(title, description, content, site, { noindex = false, canonical = '', ogImage = '' } = {}) {
  const effectiveOgImage = ogImage || `${site.url}/images/og-default.jpg`;
  const ga4Id = process.env.GA4_MEASUREMENT_ID || '';
  const gscKeys = (process.env.GOOGLE_SITE_VERIFICATION || '').split(',').map(s => s.trim()).filter(Boolean);
  const ga4Script = ga4Id ? `
  <script async src="https://www.googletagmanager.com/gtag/js?id=${ga4Id}"></script>
  <script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${ga4Id}',{anonymize_ip:true});</script>` : '';
  const robots = noindex ? 'noindex, follow' : 'index, follow, max-image-preview:large';

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
<main style="padding:20px 0;min-height:60vh">${content}</main>
<footer style="background:#1a1a2e;color:rgba(255,255,255,.6);text-align:center;padding:20px;font-size:13px">
  <p>&copy; ${new Date().getFullYear()} ${site.name} &middot; <a href="/privacy/" style="color:rgba(255,255,255,.5)">Privacy</a> &middot; <a href="/terms/" style="color:rgba(255,255,255,.5)">Terms</a></p>
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

async function regenerateStaticPages(site) {
  const siteName = site.domain.split('.')[0].replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  const siteUrl = `https://${site.domain}`;
  const siteConfig = { name: siteName, url: siteUrl, domain: site.domain };

  const pages = buildPages(siteName, site.domain, siteUrl);

  // Contact page — indexable, detailed
  pages['contact/index.html'] = buildContactPage(siteName, site.domain);

  // Add niche-specific methodology page
  const nicheSlug = site.niche_slug || '';
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
    const html = simplePageWrapper(page.title, page.description, page.body, siteConfig, { noindex: page.noindex || false, canonical });
    writeFileSync(join(WWW_ROOT, site.domain, path), html, 'utf-8');
  }

  // Reviewer page — only for YMYL niches that have a reviewer
  const author = AUTHOR_PERSONAS[nicheSlug];
  if (author?.reviewer && author?.ymyl) {
    const rev = buildReviewerPage(author.reviewer, author, siteName, siteUrl, site.domain);
    const revDir = join(WWW_ROOT, site.domain, 'author', rev.slug);
    mkdirSync(revDir, { recursive: true });
    const canonical = `${siteUrl}/author/${rev.slug}/`;
    const html = simplePageWrapper(rev.title, rev.description, rev.body, siteConfig, { noindex: false, canonical });
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
    simplePageWrapper('Page Not Found', `The page you're looking for doesn't exist — ${siteName}`, notFoundBody, siteConfig, { noindex: true }),
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
    ? await sql`SELECT s.id, s.domain, n.slug as niche_slug FROM sites s JOIN niches n ON n.id = s.niche_id WHERE s.status != 'inactive' ORDER BY s.id`
    : await sql`SELECT s.id, s.domain, n.slug as niche_slug FROM sites s JOIN niches n ON n.id = s.niche_id WHERE s.id = ${siteId}`;

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
