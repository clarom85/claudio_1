/**
 * generate-favicon.js — Genera favicon.svg bicolore per un sito esistente.
 * Uso: node packages/vps/src/generate-favicon.js --site-id 5
 *      node packages/vps/src/generate-favicon.js --all
 */
import 'dotenv/config';
import { writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { sql } from '@content-network/db';

const WWW_ROOT = process.env.WWW_ROOT || '/var/www';

const FAVICON_COLORS = {
  tribune: ['#1a5c3a', '#c9a84c'],
  pulse:   ['#c0392b', '#1a1a2e'],
  nexus:   ['#7c3aed', '#06b6d4'],
  echo:    ['#c4622d', '#5a7a5a'],
  vortex:  ['#f97316', '#0d9488'],
};

function getDomainInitials(domain, siteName) {
  const name = siteName || domain.split('.')[0].replace(/-/g, ' ');
  const words = name.trim().split(/\s+/);
  return words.length >= 2
    ? (words[0][0] + words[1][0]).toUpperCase()
    : name.slice(0, 2).toUpperCase();
}

function buildFaviconSVG(initials, template) {
  const [bg, bg2] = FAVICON_COLORS[template] || ['#1a1a2e', '#c0392b'];
  const fontSize = initials.length > 1 ? 44 : 56;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <defs><clipPath id="c"><rect width="100" height="100" rx="18"/></clipPath></defs>
  <rect width="100" height="100" rx="18" fill="${bg}"/>
  <rect y="58" width="100" height="42" fill="${bg2}" clip-path="url(#c)"/>
  <text x="50" y="56" text-anchor="middle" dominant-baseline="middle"
        font-family="Arial Black,Impact,sans-serif" font-size="${fontSize}"
        font-weight="900" fill="white" letter-spacing="-1">${initials}</text>
</svg>`;
}

async function run() {
  const args = process.argv.slice(2);
  const all = args.includes('--all');
  const siteId = parseInt(args.find(a => a.startsWith('--site-id='))?.split('=')[1]
    || args[args.indexOf('--site-id') + 1]);

  if (!all && !siteId) {
    console.error('Uso: node generate-favicon.js --site-id <id>  oppure  --all');
    process.exit(1);
  }

  const sites = all
    ? await sql`SELECT id, domain, template FROM sites WHERE status != 'inactive' ORDER BY id`
    : await sql`SELECT id, domain, template FROM sites WHERE id = ${siteId}`;

  if (!sites.length) { console.error('Nessun sito trovato'); process.exit(1); }

  for (const site of sites) {
    const siteName = site.domain.split('.')[0].replace(/-/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
    const initials = getDomainInitials(site.domain, siteName);
    const svg = buildFaviconSVG(initials, site.template);
    writeFileSync(join(WWW_ROOT, site.domain, 'favicon.svg'), svg, 'utf-8');
    console.log(`  OK  ${site.domain} → "${initials}" (${FAVICON_COLORS[site.template]?.[0] || '#1a1a2e'})`);
  }

  console.log('\nFavicon generati. Ricorda di rigenerare il CSS per aggiornare il <head>:');
  console.log('  node packages/vps/src/regenerate-css.js --all');
  process.exit(0);
}

run().catch(err => { console.error(err); process.exit(1); });
