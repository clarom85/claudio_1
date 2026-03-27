/**
 * regenerate-tools.js — Rigenera la pagina /tools/{slug}/ per uno o tutti i siti.
 * Usare dopo aggiornamenti al tool-generator o ai template.
 * Uso: node packages/vps/src/regenerate-tools.js --site-id 5
 *      node packages/vps/src/regenerate-tools.js --all
 */
import 'dotenv/config';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { sql } from '@content-network/db';
import { TOOL_CONFIGS } from '@content-network/content-engine/src/tools/tool-configs.js';
import { generateToolBody } from '@content-network/content-engine/src/tools/tool-generator.js';
import { getCategoriesForNiche } from '@content-network/content-engine/src/categories.js';

const WWW_ROOT = process.env.WWW_ROOT || '/var/www';
const TEMPLATES_DIR = new URL('../../../templates', import.meta.url).pathname;

const TEMPLATE_COLORS = {
  pulse:   '#c0392b',
  tribune: '#1a3a6b',
  nexus:   '#0d7377',
  echo:    '#4a235a',
  vortex:  '#b7410e',
};

async function run() {
  const args = process.argv.slice(2);
  const all = args.includes('--all');
  const siteId = parseInt(args.find(a => a.startsWith('--site-id='))?.split('=')[1]
    || args[args.indexOf('--site-id') + 1]);

  if (!all && !siteId) {
    console.error('Uso: node regenerate-tools.js --site-id <id>  oppure  --all');
    process.exit(1);
  }

  const sites = all
    ? await sql`SELECT s.id, s.domain, s.template, s.ga4_measurement_id, n.slug AS niche_slug FROM sites s JOIN niches n ON n.id = s.niche_id WHERE s.status != 'inactive' ORDER BY s.id`
    : await sql`SELECT s.id, s.domain, s.template, s.ga4_measurement_id, n.slug AS niche_slug FROM sites s JOIN niches n ON n.id = s.niche_id WHERE s.id = ${siteId}`;

  if (!sites.length) { console.error('Nessun sito trovato'); process.exit(1); }

  console.log(`\nRigenerando tool pages per ${sites.length} sito/i...\n`);
  let ok = 0, skip = 0, fail = 0;

  for (const site of sites) {
    const toolConfig = TOOL_CONFIGS[site.niche_slug];
    if (!toolConfig) {
      console.log(`  SKIP ${site.domain} — no tool config for niche "${site.niche_slug}"`);
      skip++;
      continue;
    }

    try {
      const { renderBase, renderHeader, renderFooter } = await import(
        `${TEMPLATES_DIR}/${site.template}/src/layout.js`
      );

      const color = TEMPLATE_COLORS[site.template] || '#c0392b';

      // Derive site name from domain (same logic as site-spawner)
      const domainParts = site.domain.replace(/\.(com|net|org|io)$/, '').split(/[-.]/).filter(Boolean);
      const siteName = domainParts.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

      const toolSite = {
        name:             siteName,
        url:              `https://${site.domain}`,
        template:         site.template,
        adsenseId:        process.env.ADSENSE_ID || '',
        ga4MeasurementId: site.ga4_measurement_id || '',
        mgidSiteId:       site.mgid_site_id || '',
        mgidInArticleId:  site.mgid_in_article_id || '',
        mgidSmartId:      site.mgid_smart_id || '',
        categories:       getCategoriesForNiche(site.niche_slug).slice(0, 7),
        color,
        niche:            site.niche_slug,
      };

      const mainContent = generateToolBody(toolConfig, toolSite);
      const body = renderHeader(toolSite) + mainContent + renderFooter(toolSite);

      const html = renderBase({
        title:            `${toolConfig.title} | ${siteName}`,
        description:      toolConfig.seoDescription || toolConfig.description,
        slug:             `tools/${toolConfig.slug}`,
        siteName:         siteName,
        siteUrl:          `https://${site.domain}`,
        body,
        adsenseId:        process.env.ADSENSE_ID || '',
        ga4MeasurementId: site.ga4_measurement_id || '',
        mgidSiteId:       toolSite.mgidSiteId,
      });

      const toolDir = join(WWW_ROOT, site.domain, 'tools', toolConfig.slug);
      mkdirSync(toolDir, { recursive: true });
      writeFileSync(join(toolDir, 'index.html'), html, 'utf-8');

      console.log(`  OK  ${site.domain} → /tools/${toolConfig.slug}/`);
      ok++;
    } catch (err) {
      console.log(`  ERR ${site.domain}: ${err.message}`);
      fail++;
    }
  }

  console.log(`\nCompletato: ${ok} ok, ${skip} skip, ${fail} falliti`);
  process.exit(0);
}

run().catch(err => { console.error(err); process.exit(1); });
