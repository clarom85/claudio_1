/**
 * build-parentcare-page.js
 * Genera /find-care/, /find-care/privacy/, /find-care/terms/ su medicarepriceguide.com
 * usando il template echo del sito + il modulo parentcare.
 *
 * Uso:
 *   node packages/vps/src/build-parentcare-page.js --site-id 11
 *   node packages/vps/src/build-parentcare-page.js --domain medicarepriceguide.com
 */

import 'dotenv/config';
import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { sql } from '@content-network/db';
import { renderQuizPageBody, renderParentCarePrivacy, renderParentCareTerms } from '@content-network/parentcare';
import { purgeCache } from './cloudflare.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..', '..', '..');
const TEMPLATES_DIR = join(ROOT, 'templates');
const WWW_ROOT = process.env.WWW_ROOT || '/var/www';

function esc(str = '') {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

async function loadSite({ siteId, domain }) {
  if (siteId) {
    const r = await sql`SELECT s.id, s.domain, s.template, s.ga4_measurement_id, n.slug AS niche_slug FROM sites s JOIN niches n ON n.id = s.niche_id WHERE s.id = ${siteId}`;
    if (r.length) return r[0];
  }
  if (domain) {
    const r = await sql`SELECT s.id, s.domain, s.template, s.ga4_measurement_id, n.slug AS niche_slug FROM sites s JOIN niches n ON n.id = s.niche_id WHERE s.domain = ${domain}`;
    if (r.length) return r[0];
  }
  // Fallback for fully manual: target medicarepriceguide hardcoded
  return {
    id: 11,
    domain: domain || 'medicarepriceguide.com',
    template: 'echo',
    ga4_measurement_id: process.env.GA4_MEASUREMENT_ID || '',
    niche_slug: 'senior-care-medicare',
  };
}

function siteNameFromDomain(d) {
  const parts = d.replace(/\.(com|net|org|io)$/, '').split(/[-.]/).filter(Boolean);
  return parts.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

async function buildAndWrite() {
  const args = process.argv.slice(2);
  const siteId = parseInt(args.find(a => a.startsWith('--site-id='))?.split('=')[1] || args[args.indexOf('--site-id')+1]) || null;
  const domain = args.find(a => a.startsWith('--domain='))?.split('=')[1] || args[args.indexOf('--domain')+1] || null;

  const site = await loadSite({ siteId, domain });
  const siteName = siteNameFromDomain(site.domain);
  const siteUrl = `https://${site.domain}`;

  console.log(`Building /find-care/ for ${site.domain} (template: ${site.template})...`);

  // Load template renderer
  const tplPath = `${TEMPLATES_DIR}/${site.template}/src/layout.js`;
  const tplUrl = new URL(`file://${tplPath.replace(/\\/g,'/')}`);
  const { renderBase, renderHeader, renderFooter } = await import(tplUrl.href);

  const adsenseId = process.env.ADSENSE_ID || '';
  const ga4Id = site.ga4_measurement_id || process.env.GA4_MEASUREMENT_ID || '';

  // Build siteConfig matching the echo renderHeader/Footer expectations
  const siteCfg = {
    name: siteName,
    url: siteUrl,
    template: site.template,
    adsenseId,
    ga4MeasurementId: ga4Id,
    mgidSiteId: process.env.MGID_SITE_ID || '',
    categories: [], // We don't render these on the standalone page
    color: '#c4622d',
    niche: site.niche_slug,
    authorName: 'ParentCare Finder',
    authorTitle: 'Senior Care Information',
    authorAvatar: 'parentcare',
  };

  // ── 1. /find-care/ — main quiz landing
  {
    const quizBody = renderQuizPageBody({ siteName: site.domain, apiUrl: '/api/parentcare/submit' });
    const body = `${renderHeader(siteCfg)}${quizBody}${renderFooter(siteCfg)}`;

    const breadcrumb = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type':'ListItem', position:1, name:'Home', item: `${siteUrl}/` },
        { '@type':'ListItem', position:2, name:'Find Care', item: `${siteUrl}/find-care/` }
      ]
    };
    const webPageSchema = {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: 'ParentCare Finder — Local Senior Care Options',
      description: "Take a 2-minute care assessment. We'll match you with trusted local senior care providers based on your loved one's needs.",
      url: `${siteUrl}/find-care/`,
      provider: { '@type':'Organization', name:'Vireon Media', url: siteUrl }
    };

    const html = renderBase({
      title: 'ParentCare Finder — Find Local Care for an Aging Parent',
      description: "Worried about an aging parent? Take our free 2-minute care assessment and compare local senior care options — home care, assisted living, memory care.",
      slug: 'find-care',
      siteName,
      siteUrl,
      schemas: [breadcrumb, webPageSchema],
      body,
      adsenseId,
      ga4MeasurementId: ga4Id,
      noindex: false,
    });

    const outDir = join(WWW_ROOT, site.domain, 'find-care');
    mkdirSync(outDir, { recursive: true });
    writeFileSync(join(outDir, 'index.html'), html, 'utf-8');
    console.log(`  ✓ /find-care/index.html (${(html.length/1024).toFixed(1)} KB)`);
  }

  // ── 2. /find-care/privacy/ — ParentCare-specific privacy
  {
    const privacy = renderParentCarePrivacy();
    const body = `${renderHeader(siteCfg)}<main class="site-main"><div class="wrap">${privacy.body}</div></main>${renderFooter(siteCfg)}`;
    const html = renderBase({
      title: privacy.title,
      description: privacy.description,
      slug: 'find-care/privacy',
      siteName,
      siteUrl,
      body,
      adsenseId,
      ga4MeasurementId: ga4Id,
      noindex: false,
    });
    const outDir = join(WWW_ROOT, site.domain, 'find-care', 'privacy');
    mkdirSync(outDir, { recursive: true });
    writeFileSync(join(outDir, 'index.html'), html, 'utf-8');
    console.log(`  ✓ /find-care/privacy/index.html`);
  }

  // ── 3. /find-care/terms/ — ParentCare-specific terms
  {
    const terms = renderParentCareTerms();
    const body = `${renderHeader(siteCfg)}<main class="site-main"><div class="wrap">${terms.body}</div></main>${renderFooter(siteCfg)}`;
    const html = renderBase({
      title: terms.title,
      description: terms.description,
      slug: 'find-care/terms',
      siteName,
      siteUrl,
      body,
      adsenseId,
      ga4MeasurementId: ga4Id,
      noindex: false,
    });
    const outDir = join(WWW_ROOT, site.domain, 'find-care', 'terms');
    mkdirSync(outDir, { recursive: true });
    writeFileSync(join(outDir, 'index.html'), html, 'utf-8');
    console.log(`  ✓ /find-care/terms/index.html`);
  }

  // ── Cloudflare purge
  if (process.env.CLOUDFLARE_API_TOKEN) {
    try {
      await purgeCache(site.domain);
      console.log(`  ✓ Cloudflare cache purged`);
    } catch (e) {
      console.warn(`  ⚠ CF purge failed: ${e.message}`);
    }
  }

  console.log(`\nDone. Visit: ${siteUrl}/find-care/`);
  process.exit(0);
}

buildAndWrite().catch(err => {
  console.error('Build failed:', err);
  process.exit(1);
});
