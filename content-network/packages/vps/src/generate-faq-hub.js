/**
 * generate-faq-hub.js — Genera /faq/ hub page aggregando i FAQ degli articoli per topic.
 * Legge schema_markup JSON-LD dagli articoli, estrae FAQPage entries, le raggruppa per categoria.
 * Uso: node packages/vps/src/generate-faq-hub.js --site-id 5
 *      node packages/vps/src/generate-faq-hub.js --all
 */
import 'dotenv/config';
import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { sql } from '@content-network/db';

const WWW_ROOT = process.env.WWW_ROOT || '/var/www';

// Rough topic classifier based on slug keywords
const TOPIC_RULES = [
  { test: /bathroom|bath|shower|toilet/i,   label: 'Bathroom Remodeling' },
  { test: /kitchen|countertop|cabinet/i,     label: 'Kitchen Renovation' },
  { test: /deck|pergola|patio|porch/i,       label: 'Deck & Outdoor' },
  { test: /roof|shingle|ridge|gutter/i,      label: 'Roof Replacement' },
  { test: /hvac|furnace|ac\b|air.*cond/i,   label: 'HVAC & Heating' },
  { test: /floor|flooring|hardwood|laminate|lvp|carpet/i, label: 'Flooring' },
  { test: /insur|premium|deductible|policy|coverage|life.*insur|auto.*insur|health.*insur/i, label: 'Insurance' },
  { test: /auto|car.*insur|vehicle/i,        label: 'Auto Insurance' },
  { test: /health|medical|medicare/i,         label: 'Health Insurance' },
  { test: /home.*insur|homeowner/i,           label: 'Home Insurance' },
  { test: /life.*insur|whole.*life|term.*life/i, label: 'Life Insurance' },
];

function classifyTopic(title, slug) {
  const text = `${title} ${slug}`;
  for (const rule of TOPIC_RULES) {
    if (rule.test.test(text)) return rule.label;
  }
  return 'General';
}

function htmlEsc(str = '') {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function simplePageWrapper(title, description, content, siteConfig, opts = {}) {
  const { noindex = false, canonical = '' } = opts;
  const effectiveOgImage = `${siteConfig.url}/images/og-default.jpg`;
  const ga4Id = siteConfig.ga4MeasurementId || '';
  const gscKeys = (process.env.GOOGLE_SITE_VERIFICATION || '').split(',').map(s => s.trim()).filter(Boolean);
  const ga4Script = ga4Id ? `
  <script async src="https://www.googletagmanager.com/gtag/js?id=${ga4Id}"></script>
  <script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${ga4Id}',{anonymize_ip:true});</script>` : '';
  const robots = noindex ? 'noindex, follow' : 'index, follow, max-image-preview:large';

  return `<!DOCTYPE html><html lang="en"><head>
<meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<meta name="robots" content="${robots}"/>
${gscKeys.map(k => `<meta name="google-site-verification" content="${k}"/>`).join('\n')}
<title>${htmlEsc(title)} | ${htmlEsc(siteConfig.name)}</title>
<meta name="description" content="${htmlEsc(description)}"/>
${canonical ? `<link rel="canonical" href="${canonical}"/>` : ''}
<meta property="og:title" content="${htmlEsc(title)}"/>
<meta property="og:description" content="${htmlEsc(description)}"/>
<meta property="og:type" content="website"/>
<meta property="og:site_name" content="${htmlEsc(siteConfig.name)}"/>
${canonical ? `<meta property="og:url" content="${canonical}"/>` : ''}
<meta property="og:image" content="${effectiveOgImage}"/>
<meta name="twitter:card" content="summary_large_image"/>
<link rel="preconnect" href="https://pagead2.googlesyndication.com"/>
<link rel="icon" type="image/svg+xml" href="/favicon.svg"/>
<link rel="stylesheet" href="/assets/style.v2.css"/>
${ga4Script}
<style>
  .faq-topic{margin-bottom:40px}
  .faq-topic-title{font-size:20px;font-weight:700;margin:0 0 16px;padding-bottom:10px;border-bottom:2px solid #e8e8e8;color:#1a1a1a}
  .faq-item{padding:14px 0;border-bottom:1px solid #f0f0f0}
  .faq-item:last-child{border:none}
  .faq-q{font-size:15px;font-weight:600;color:#1a1a1a;margin:0 0 8px;cursor:pointer;list-style:none}
  .faq-q::before{content:"Q: ";color:#999;font-weight:400}
  .faq-a{font-size:14px;line-height:1.75;color:#555;margin:0;padding-left:28px}
  .faq-source{font-size:12px;color:#aaa;margin-top:8px;padding-left:28px}
  .faq-source a{color:#aaa;text-decoration:none}
  .faq-source a:hover{text-decoration:underline}
  .topic-nav{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:36px}
  .topic-nav a{display:inline-block;padding:6px 14px;background:#f0f0f0;border-radius:4px;text-decoration:none;color:#1a1a1a;font-size:13px;font-weight:600}
</style>
</head><body>
<header style="background:#1a1a2e;padding:14px 20px;display:flex;align-items:center;gap:16px">
  <a href="/" style="color:#fff;text-decoration:none;font-size:20px;font-weight:800">${htmlEsc(siteConfig.name)}</a>
  <nav style="margin-left:auto;font-size:13px;display:flex;gap:16px">
    <a href="/glossary/" style="color:rgba(255,255,255,.7);text-decoration:none">Glossary</a>
    <a href="/tools/" style="color:rgba(255,255,255,.7);text-decoration:none">Calculator</a>
  </nav>
</header>
<main style="padding:0;min-height:60vh;background:#fff;color:#1a1a1a"><div style="max-width:900px;margin:0 auto;padding:28px 20px">${content}</div></main>
<footer style="background:#1a1a2e;color:rgba(255,255,255,.6);text-align:center;padding:20px;font-size:13px">
  <p>&copy; ${new Date().getFullYear()} ${htmlEsc(siteConfig.name)} &middot;
     <a href="/privacy/" style="color:rgba(255,255,255,.5)">Privacy</a> &middot;
     <a href="/terms/" style="color:rgba(255,255,255,.5)">Terms</a> &middot;
     <a href="/faq/" style="color:rgba(255,255,255,.5)">FAQ</a>
  </p>
</footer>
</body></html>`;
}

async function run() {
  const args = process.argv.slice(2);
  const all = args.includes('--all');
  const siteId = parseInt(args.find(a => a.startsWith('--site-id='))?.split('=')[1]
    || args[args.indexOf('--site-id') + 1]);

  if (!all && !siteId) {
    console.error('Uso: node generate-faq-hub.js --site-id <id>  oppure  --all');
    process.exit(1);
  }

  const sites = all
    ? await sql`SELECT s.id, s.domain, s.ga4_measurement_id, n.name AS niche_name FROM sites s JOIN niches n ON n.id = s.niche_id WHERE s.status != 'inactive' ORDER BY s.id`
    : await sql`SELECT s.id, s.domain, s.ga4_measurement_id, n.name AS niche_name FROM sites s JOIN niches n ON n.id = s.niche_id WHERE s.id = ${siteId}`;

  if (!sites.length) { console.error('Nessun sito trovato'); process.exit(1); }

  console.log(`\nGenerating FAQ hubs for ${sites.length} site(s)...\n`);

  for (const site of sites) {
    // Fetch articles with FAQPage schema
    const articles = await sql`
      SELECT a.slug, a.title, a.schema_markup
      FROM articles a
      WHERE a.site_id = ${site.id}
        AND a.status = 'published'
        AND a.schema_markup IS NOT NULL
        AND a.schema_markup::text LIKE '%FAQPage%'
      ORDER BY a.title
    `;

    if (!articles.length) {
      console.log(`  SKIP ${site.domain} — no articles with FAQ schema`);
      continue;
    }

    const domainParts = site.domain.replace(/\.(com|net|org|io)$/, '').split(/[-.]/).filter(Boolean);
    const siteName = domainParts.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    const siteConfig = {
      name: siteName,
      url: `https://${site.domain}`,
      ga4MeasurementId: site.ga4_measurement_id || '',
    };

    // Extract Q&A pairs from each article
    const topicMap = {}; // label -> [{ title, slug, qa: [{q, a}] }]
    let totalQa = 0;

    for (const article of articles) {
      let schemas;
      try {
        schemas = typeof article.schema_markup === 'string'
          ? JSON.parse(article.schema_markup)
          : article.schema_markup;
      } catch { continue; }

      const faqSchema = Array.isArray(schemas)
        ? schemas.find(s => s['@type'] === 'FAQPage')
        : schemas['@type'] === 'FAQPage' ? schemas : null;

      if (!faqSchema?.mainEntity?.length) continue;

      const qa = faqSchema.mainEntity
        .filter(q => q['@type'] === 'Question' && q.name && q.acceptedAnswer?.text)
        .map(q => ({
          q: q.name,
          a: q.acceptedAnswer.text.replace(/<[^>]+>/g, '').slice(0, 400)
        }))
        .slice(0, 4); // max 4 Q&As per article in the hub

      if (!qa.length) continue;

      const topic = classifyTopic(article.title, article.slug);
      if (!topicMap[topic]) topicMap[topic] = [];
      topicMap[topic].push({ title: article.title, slug: article.slug, qa });
      totalQa += qa.length;
    }

    if (!totalQa) {
      console.log(`  SKIP ${site.domain} — no valid Q&A pairs found`);
      continue;
    }

    // Build FAQ hub page
    const topics = Object.keys(topicMap).sort();

    // FAQPage JSON-LD (all Q&As for rich results)
    const allQa = [];
    for (const topic of topics) {
      for (const art of topicMap[topic]) {
        for (const item of art.qa) {
          allQa.push({
            '@type': 'Question',
            'name': item.q,
            'acceptedAnswer': { '@type': 'Answer', 'text': item.a }
          });
        }
      }
    }
    const schemaJson = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      'mainEntity': allQa
    });

    const topicNav = topics.map(t =>
      `<a href="#topic-${t.toLowerCase().replace(/[^a-z0-9]+/g, '-')}">${htmlEsc(t)}</a>`
    ).join('');

    const topicSections = topics.map(topic => {
      const anchorId = `topic-${topic.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
      const items = topicMap[topic];
      const qaHtml = items.map(art => `
        <div style="margin-bottom:20px">
          <p style="font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:#999;margin:0 0 10px">
            From: <a href="/${art.slug}/" style="color:#2980b9;text-decoration:none">${htmlEsc(art.title)}</a>
          </p>
          ${art.qa.map(item => `
          <div class="faq-item">
            <p class="faq-q">${htmlEsc(item.q)}</p>
            <p class="faq-a">${htmlEsc(item.a)}${item.a.length >= 400 ? '…' : ''}</p>
          </div>`).join('')}
        </div>`).join('');

      return `
      <div id="${anchorId}" class="faq-topic">
        <h2 class="faq-topic-title">${htmlEsc(topic)}</h2>
        ${qaHtml}
      </div>`;
    }).join('');

    const content = `
    <script type="application/ld+json">${schemaJson}</script>
    <div style="max-width:800px;margin:40px auto;padding:0 20px;color:#1a1a1a">
      <nav style="margin-bottom:16px;font-size:13px;color:#999">
        <a href="/" style="color:#999;text-decoration:none">Home</a> ›
        <span>Frequently Asked Questions</span>
      </nav>
      <h1 style="font-size:clamp(24px,4vw,36px);font-weight:700;margin:0 0 12px;color:#1a1a1a">
        Frequently Asked Questions
      </h1>
      <p style="font-size:16px;color:#555;line-height:1.7;margin:0 0 32px">
        Answers to the most common questions about ${siteConfig.name.toLowerCase()} — organized by topic.
        ${totalQa} questions answered.
      </p>
      <nav class="topic-nav" aria-label="Jump to topic">${topicNav}</nav>
      ${topicSections}
      <div style="margin-top:40px;padding:16px 20px;background:#f8f9fa;border-radius:6px;font-size:14px;color:#555">
        <strong>Can't find your answer?</strong>
        Browse our full articles or <a href="/contact/" style="color:#2980b9">contact us</a>.
        ${site.niche_name?.toLowerCase().includes('insur')
          ? ' For personal insurance advice, consult a licensed professional in your state.'
          : ''}
      </div>
    </div>`;

    const siteDir = join(WWW_ROOT, site.domain);
    const faqDir = join(siteDir, 'faq');
    mkdirSync(faqDir, { recursive: true });

    const faqHtml = simplePageWrapper(
      'Frequently Asked Questions',
      `Answers to the most common ${site.niche_name?.toLowerCase() || ''} questions, organized by topic. ${totalQa} Q&As.`,
      content,
      siteConfig,
      { noindex: false, canonical: `${siteConfig.url}/faq/` }
    );
    writeFileSync(join(faqDir, 'index.html'), faqHtml, 'utf-8');

    // Update sitemap
    const sitemapPath = join(siteDir, 'sitemap.xml');
    if (existsSync(sitemapPath)) {
      let sitemap = readFileSync(sitemapPath, 'utf-8');
      sitemap = sitemap.replace(/\s*<url>\s*<loc>https:\/\/[^<]+\/faq\/[^<]*<\/loc>[\s\S]*?<\/url>/g, '');
      const faqEntry = `  <url>
    <loc>${siteConfig.url}/faq/</loc>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`;
      sitemap = sitemap.replace('</urlset>', `${faqEntry}\n</urlset>`);
      writeFileSync(sitemapPath, sitemap, 'utf-8');
    }

    console.log(`  OK  ${site.domain} — ${totalQa} Q&As across ${topics.length} topics (${articles.length} articles)`);
  }

  console.log('\nDone.');
  process.exit(0);
}

run().catch(err => { console.error(err); process.exit(1); });
