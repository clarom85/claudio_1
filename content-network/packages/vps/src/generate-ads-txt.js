#!/usr/bin/env node
/**
 * generate-ads-txt.js
 * Scrive/aggiorna ads.txt per tutti i siti live (o un sito specifico).
 *
 * Usage:
 *   node packages/vps/src/generate-ads-txt.js
 *   node packages/vps/src/generate-ads-txt.js --domain repairrateguide.com
 *
 * Requires: ADSENSE_ID in .env (e.g. ca-pub-XXXXXXXXXXXXXXXX)
 */

import 'dotenv/config';
import { getSitesByStatus } from '../../db/src/index.js';
import { generateAdsTxt } from './index.js';

const args = process.argv.slice(2);
const domainArg = args.includes('--domain') ? args[args.indexOf('--domain') + 1] : null;

const adsenseId = process.env.ADSENSE_ID || '';
const ezoicId   = process.env.EZOIC_SITE_ID || '';

if (!adsenseId && !ezoicId) {
  console.error('❌  Neither ADSENSE_ID nor EZOIC_SITE_ID is set in .env');
  console.error('   Set ADSENSE_ID=ca-pub-XXXXXXXXXXXXXXXX in /opt/content-network/content-network/.env');
  process.exit(1);
}

const sites = await getSitesByStatus('live');
const targets = domainArg ? sites.filter(s => s.domain === domainArg) : sites;

if (!targets.length) {
  console.error(`No live sites found${domainArg ? ` matching "${domainArg}"` : ''}.`);
  process.exit(1);
}

for (const site of targets) {
  const mgidSiteId = site.mgid_site_id || '';
  generateAdsTxt(site.domain, adsenseId, ezoicId, mgidSiteId);
  const lines = [];
  if (adsenseId)  lines.push(`google.com, ${adsenseId}, DIRECT, f08c47fec0942fa0`);
  if (ezoicId)    lines.push(`ezoic.com, ${ezoicId}, DIRECT`);
  if (mgidSiteId) lines.push(`mgid.com, ${mgidSiteId}, DIRECT, d4c29acad76ce94f`);
  console.log(`✅  ${site.domain}/ads.txt`);
  lines.forEach(l => console.log(`    ${l}`));
}

console.log('\nDone. Verify: curl https://<domain>/ads.txt');
