/**
 * generate-glossary.js — Genera /glossary/ index + /glossary/[slug]/ per ogni termine.
 * Aggiunge URL al sitemap.xml + corregge eventuali domini errati (IP vs dominio).
 * Uso: node packages/vps/src/generate-glossary.js --site-id 5
 *      node packages/vps/src/generate-glossary.js --all
 */
import 'dotenv/config';
import { writeFileSync, mkdirSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { sql } from '@content-network/db';
import { GLOSSARY_TERMS } from '@content-network/content-engine/src/glossary-terms.js';
import { buildPageHeader, buildPageFooter } from './page-header.js';

const WWW_ROOT = process.env.WWW_ROOT || '/var/www';

function htmlEsc(str = '') {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

const DARK_TEMPLATES = new Set(['nexus', 'vortex']);

function simplePageWrapper(title, description, content, siteConfig, opts = {}) {
  const { noindex = false, canonical = '', template = '' } = opts;
  const wrappedContent = DARK_TEMPLATES.has(template)
    ? `<div style="background:#fff;color:#1a1a1a;border-radius:8px;padding:32px 24px;margin:32px auto;max-width:1000px;box-shadow:0 2px 16px rgba(0,0,0,.18)">${content}</div>`
    : content;
  const effectiveOgImage = `${siteConfig.url}/images/og-default.jpg`;
  const ga4Id = siteConfig.ga4MeasurementId || '';
  const gscKeys = (process.env.GOOGLE_SITE_VERIFICATION || '').split(',').map(s => s.trim()).filter(Boolean);
  const adsenseId = siteConfig.adsenseId || '';
  const ga4Script = ga4Id ? `
  <script async src="https://www.googletagmanager.com/gtag/js?id=${ga4Id}"></script>
  <script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${ga4Id}',{anonymize_ip:true});</script>` : '';
  const adsenseScript = adsenseId ? `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseId}" crossorigin="anonymous"></script>` : '';
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
${adsenseScript}
${ga4Script}
</head><body>
${buildPageHeader(siteConfig)}
<main style="padding:20px 0;min-height:60vh">${wrappedContent}</main>
${buildPageFooter(siteConfig)}
</body></html>`;
}

function buildGlossaryIndex(terms, nicheName, siteConfig) {
  const byLetter = {};
  for (const t of terms) {
    const l = t.letter.toUpperCase();
    if (!byLetter[l]) byLetter[l] = [];
    byLetter[l].push(t);
  }
  const letters = Object.keys(byLetter).sort();

  const letterNav = letters.map(l =>
    `<a href="#letter-${l}" style="display:inline-block;padding:5px 12px;margin:3px;background:#f0f0f0;border-radius:4px;text-decoration:none;color:#1a1a1a;font-size:14px;font-weight:700">${l}</a>`
  ).join('');

  const sections = letters.map(l => `
    <div id="letter-${l}" style="margin-bottom:44px">
      <h2 style="font-size:26px;font-weight:700;margin:0 0 16px;padding-bottom:10px;border-bottom:2px solid #e8e8e8;color:#1a1a1a">${l}</h2>
      <dl style="margin:0">
        ${byLetter[l].map(t => `
        <div style="padding:14px 0;border-bottom:1px solid #f0f0f0">
          <dt style="font-weight:700;font-size:16px">
            <a href="/glossary/${t.slug}/" style="color:#1a1a1a;text-decoration:none">${htmlEsc(t.term)}</a>
          </dt>
          <dd style="margin:6px 0 0;font-size:15px;color:#555;line-height:1.65">${htmlEsc(t.shortDef)}</dd>
        </div>`).join('')}
      </dl>
    </div>`).join('');

  const schemaJson = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'DefinedTermSet',
    'name': `Glossary of ${nicheName} Terms`,
    'url': `${siteConfig.url}/glossary/`,
    'hasDefinedTerm': terms.map(t => ({
      '@type': 'DefinedTerm',
      'name': t.term,
      'description': t.shortDef,
      'url': `${siteConfig.url}/glossary/${t.slug}/`
    }))
  });

  return `
  <script type="application/ld+json">${schemaJson}</script>
  <div style="max-width:800px;margin:40px auto;padding:0 20px;color:#1a1a1a">
    <nav style="margin-bottom:16px;font-size:13px;color:#999">
      <a href="/" style="color:#999;text-decoration:none">Home</a> ›
      <span>Glossary</span>
    </nav>
    <h1 style="font-size:clamp(24px,4vw,36px);font-weight:700;margin:0 0 12px;color:#1a1a1a">
      ${htmlEsc(nicheName)} Glossary
    </h1>
    <p style="font-size:16px;color:#555;line-height:1.7;margin:0 0 32px">
      A complete reference of key terms, concepts, and industry jargon to help you understand estimates, quotes, and contracts. ${terms.length} terms defined in plain English.
    </p>
    <div style="margin-bottom:40px;padding:16px 20px;background:#f8f8f8;border-radius:6px;line-height:2.2">
      ${letterNav}
    </div>
    ${sections}
    <p style="font-size:13px;color:#aaa;margin-top:40px">
      ${terms.length} terms · Updated ${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
    </p>
  </div>`;
}

function buildTermPage(term, allTerms, nicheName, siteConfig) {
  const related = (term.related || [])
    .map(slug => allTerms.find(t => t.slug === slug))
    .filter(Boolean);

  const schemaJson = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'DefinedTerm',
    'name': term.term,
    'description': term.shortDef,
    'inDefinedTermSet': {
      '@type': 'DefinedTermSet',
      'name': `Glossary of ${nicheName} Terms`,
      'url': `${siteConfig.url}/glossary/`
    }
  });

  // Convert double newlines to paragraph breaks
  const fullDefHtml = htmlEsc(term.fullDef)
    .split('\n\n')
    .map(p => `<p style="font-size:16px;line-height:1.85;margin:0 0 20px;color:#333">${p.replace(/\n/g, ' ')}</p>`)
    .join('');

  return `
  <script type="application/ld+json">${schemaJson}</script>
  <div style="max-width:800px;margin:40px auto;padding:0 20px;color:#1a1a1a">
    <nav style="margin-bottom:16px;font-size:13px;color:#999">
      <a href="/" style="color:#999;text-decoration:none">Home</a> ›
      <a href="/glossary/" style="color:#999;text-decoration:none">Glossary</a> ›
      <span style="color:#555">${htmlEsc(term.term)}</span>
    </nav>

    <h1 style="font-size:clamp(22px,4vw,34px);font-weight:700;margin:0 0 16px;color:#1a1a1a">${htmlEsc(term.term)}</h1>

    <div style="background:#f8f9fa;border-left:4px solid #2980b9;border-radius:0 6px 6px 0;padding:16px 20px;margin-bottom:28px">
      <p style="font-size:16px;font-weight:600;margin:0;color:#333;line-height:1.6">${htmlEsc(term.shortDef)}</p>
    </div>

    <div style="margin-bottom:28px">${fullDefHtml}</div>

    ${term.example ? `
    <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:6px;padding:18px 22px;margin-bottom:28px">
      <p style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#92400e;margin:0 0 8px">Real-World Example</p>
      <p style="font-size:15px;line-height:1.7;margin:0;color:#78350f;font-style:italic">${htmlEsc(term.example)}</p>
    </div>` : ''}

    ${related.length ? `
    <div style="margin-top:32px;padding-top:24px;border-top:2px solid #e8e8e8">
      <h2 style="font-size:16px;font-weight:700;margin:0 0 14px;color:#1a1a1a">Related Terms</h2>
      <div style="display:flex;flex-wrap:wrap;gap:8px">
        ${related.map(r => `<a href="/glossary/${r.slug}/" style="display:inline-block;padding:6px 16px;background:#f0f0f0;border-radius:20px;text-decoration:none;color:#1a1a1a;font-size:14px;font-weight:500;transition:background .15s">${htmlEsc(r.term)}</a>`).join('')}
      </div>
    </div>` : ''}

    <div style="margin-top:44px;padding-top:20px;border-top:1px solid #e8e8e8;font-size:13px;color:#999">
      <a href="/glossary/" style="color:#2980b9;text-decoration:none;font-weight:600">← Full ${htmlEsc(nicheName)} Glossary</a>
    </div>
  </div>`;
}

/**
 * Exported function for site-spawner integration.
 * @param {object} opts - { domain, nicheSlug, nicheName, ga4MeasurementId }
 */
export function generateGlossaryForSite({ domain, nicheSlug, nicheName, ga4MeasurementId = '', template = '' }) {
  const terms = GLOSSARY_TERMS[nicheSlug];
  if (!terms?.length) return 0;

  const domainParts = domain.replace(/\.(com|net|org|io)$/, '').split(/[-.]/).filter(Boolean);
  const siteName = domainParts.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  const siteConfig = { name: siteName, url: `https://${domain}`, ga4MeasurementId, adsenseId: process.env.ADSENSE_ID || '' };
  const resolvedNicheName = nicheName || nicheSlug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  const siteDir = join(WWW_ROOT, domain);
  const glossaryRoot = join(siteDir, 'glossary');
  mkdirSync(glossaryRoot, { recursive: true });

  const indexHtml = simplePageWrapper(
    `${resolvedNicheName} Glossary`,
    `Complete glossary of ${resolvedNicheName.toLowerCase()} terms. ${terms.length} key concepts explained in plain English.`,
    buildGlossaryIndex(terms, resolvedNicheName, siteConfig),
    siteConfig,
    { noindex: false, canonical: `${siteConfig.url}/glossary/`, template }
  );
  writeFileSync(join(glossaryRoot, 'index.html'), indexHtml, 'utf-8');

  for (const term of terms) {
    const termDir = join(glossaryRoot, term.slug);
    mkdirSync(termDir, { recursive: true });
    writeFileSync(
      join(termDir, 'index.html'),
      simplePageWrapper(
        `${term.term}: Definition & Meaning`,
        `${term.shortDef.slice(0, 140)} Full definition with real-world examples.`,
        buildTermPage(term, terms, resolvedNicheName, siteConfig),
        siteConfig,
        { noindex: false, canonical: `${siteConfig.url}/glossary/${term.slug}/`, template }
      ),
      'utf-8'
    );
  }

  // Update sitemap
  const sitemapPath = join(siteDir, 'sitemap.xml');
  if (existsSync(sitemapPath)) {
    let sitemap = readFileSync(sitemapPath, 'utf-8');
    sitemap = sitemap.replace(/https:\/\/\d+\.\d+\.\d+\.\d+\//g, `https://${domain}/`);
    sitemap = sitemap.replace(/[ \t]*<url>\s*<loc>https:\/\/[^<]+\/glossary\/[^<]*<\/loc>[\s\S]*?<\/url>\n?/g, '');
    const indexEntry = `  <url>\n    <loc>${siteConfig.url}/glossary/</loc>\n    <changefreq>monthly</changefreq>\n    <priority>0.6</priority>\n  </url>`;
    const termEntries = terms.map(t => `  <url>\n    <loc>${siteConfig.url}/glossary/${t.slug}/</loc>\n    <changefreq>monthly</changefreq>\n    <priority>0.5</priority>\n  </url>`).join('\n');
    sitemap = sitemap.replace('</urlset>', `${indexEntry}\n${termEntries}\n</urlset>`);
    writeFileSync(sitemapPath, sitemap, 'utf-8');
  }

  return terms.length;
}

async function run() {
  const args = process.argv.slice(2);
  const all = args.includes('--all');
  const siteId = parseInt(args.find(a => a.startsWith('--site-id='))?.split('=')[1]
    || args[args.indexOf('--site-id') + 1]);

  if (!all && !siteId) {
    console.error('Uso: node generate-glossary.js --site-id <id>  oppure  --all');
    process.exit(1);
  }

  const sites = all
    ? await sql`SELECT s.id, s.domain, s.template, s.ga4_measurement_id, n.slug AS niche_slug, n.name AS niche_name FROM sites s JOIN niches n ON n.id = s.niche_id WHERE s.status != 'inactive' ORDER BY s.id`
    : await sql`SELECT s.id, s.domain, s.template, s.ga4_measurement_id, n.slug AS niche_slug, n.name AS niche_name FROM sites s JOIN niches n ON n.id = s.niche_id WHERE s.id = ${siteId}`;

  if (!sites.length) { console.error('Nessun sito trovato'); process.exit(1); }

  console.log(`\nGenerating glossary for ${sites.length} site(s)...\n`);

  for (const site of sites) {
    const terms = GLOSSARY_TERMS[site.niche_slug];
    if (!terms?.length) {
      console.log(`  SKIP ${site.domain} — no glossary terms for "${site.niche_slug}"`);
      continue;
    }

    const domainParts = site.domain.replace(/\.(com|net|org|io)$/, '').split(/[-.]/).filter(Boolean);
    const siteName = domainParts.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    const siteConfig = {
      name: siteName,
      url: `https://${site.domain}`,
      ga4MeasurementId: site.ga4_measurement_id || '',
      adsenseId: process.env.ADSENSE_ID || '',
    };

    const nicheName = site.niche_name
      || site.niche_slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

    const siteDir = join(WWW_ROOT, site.domain);
    const glossaryRoot = join(siteDir, 'glossary');
    mkdirSync(glossaryRoot, { recursive: true });

    // Glossary index
    const indexContent = buildGlossaryIndex(terms, nicheName, siteConfig);
    const indexHtml = simplePageWrapper(
      `${nicheName} Glossary`,
      `Complete glossary of ${nicheName.toLowerCase()} terms and definitions. ${terms.length} key concepts explained in plain English for homeowners, buyers, and consumers.`,
      indexContent,
      siteConfig,
      { noindex: false, canonical: `${siteConfig.url}/glossary/`, template: site.template || '' }
    );
    writeFileSync(join(glossaryRoot, 'index.html'), indexHtml, 'utf-8');

    // Individual term pages
    for (const term of terms) {
      const termDir = join(glossaryRoot, term.slug);
      mkdirSync(termDir, { recursive: true });
      const termContent = buildTermPage(term, terms, nicheName, siteConfig);
      const termHtml = simplePageWrapper(
        `${term.term}: Definition & Meaning`,
        `${term.shortDef.slice(0, 140)} Full definition with real-world examples.`,
        termContent,
        siteConfig,
        { noindex: false, canonical: `${siteConfig.url}/glossary/${term.slug}/`, template: site.template || '' }
      );
      writeFileSync(join(termDir, 'index.html'), termHtml, 'utf-8');
    }

    // Update sitemap: fix wrong domains + add glossary URLs
    const sitemapPath = join(siteDir, 'sitemap.xml');
    if (existsSync(sitemapPath)) {
      let sitemap = readFileSync(sitemapPath, 'utf-8');
      // Fix any IP-based URLs (happens when site was first generated with wrong siteUrl)
      sitemap = sitemap.replace(/https:\/\/\d+\.\d+\.\d+\.\d+\//g, `https://${site.domain}/`);
      // Remove any existing glossary entries to avoid duplicates on re-run
      sitemap = sitemap.replace(/[ \t]*<url>\s*<loc>https:\/\/[^<]+\/glossary\/[^<]*<\/loc>[\s\S]*?<\/url>\n?/g, '');
      // Add glossary index + all term entries
      const indexEntry = `  <url>
    <loc>${siteConfig.url}/glossary/</loc>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`;
      const termEntries = terms.map(t => `  <url>
    <loc>${siteConfig.url}/glossary/${t.slug}/</loc>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>`).join('\n');
      sitemap = sitemap.replace('</urlset>', `${indexEntry}\n${termEntries}\n</urlset>`);
      writeFileSync(sitemapPath, sitemap, 'utf-8');
      console.log(`  OK  ${site.domain} — ${terms.length} terms + sitemap updated (domain fix applied)`);
    } else {
      console.log(`  OK  ${site.domain} — ${terms.length} terms (no sitemap found)`);
    }
  }

  console.log('\nDone.');
  process.exit(0);
}

if (process.argv[1]?.includes('generate-glossary')) {
  run().catch(err => { console.error(err); process.exit(1); });
}
