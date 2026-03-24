/**
 * regenerate-css.js — Riscrive style.css dal template corrente per un sito.
 * Usare dopo aggiornamenti ai template per applicare i nuovi stili senza re-spawning.
 * Uso: node packages/vps/src/regenerate-css.js --site-id 5
 *      node packages/vps/src/regenerate-css.js --all
 */
import 'dotenv/config';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { sql } from '@content-network/db';

const WWW_ROOT = process.env.WWW_ROOT || '/var/www';
const TEMPLATES_DIR = new URL('../../../templates', import.meta.url).pathname;

async function run() {
  const args = process.argv.slice(2);
  const all = args.includes('--all');
  const siteId = parseInt(args.find(a => a.startsWith('--site-id='))?.split('=')[1]
    || args[args.indexOf('--site-id') + 1]);

  if (!all && !siteId) {
    console.error('Uso: node regenerate-css.js --site-id <id>  oppure  --all');
    process.exit(1);
  }

  const sites = all
    ? await sql`SELECT id, domain, template FROM sites WHERE status != 'inactive' ORDER BY id`
    : await sql`SELECT id, domain, template FROM sites WHERE id = ${siteId}`;

  if (!sites.length) { console.error('Nessun sito trovato'); process.exit(1); }

  console.log(`\nRigenerando CSS per ${sites.length} sito/i...\n`);
  let ok = 0, fail = 0;

  for (const site of sites) {
    try {
      const { CSS } = await import(`${TEMPLATES_DIR}/${site.template}/src/layout.js`);
      const assetsDir = join(WWW_ROOT, site.domain, 'assets');
      mkdirSync(assetsDir, { recursive: true });
      writeFileSync(join(assetsDir, 'style.v2.css'), CSS, 'utf-8');
      console.log(`  OK  ${site.domain} (${site.template})`);
      ok++;
    } catch (err) {
      console.log(`  ERR ${site.domain}: ${err.message}`);
      fail++;
    }
  }

  console.log(`\nCompletato: ${ok} ok, ${fail} falliti`);
  process.exit(0);
}

run().catch(err => { console.error(err); process.exit(1); });
