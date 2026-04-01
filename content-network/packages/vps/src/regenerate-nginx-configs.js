/**
 * regenerate-nginx-configs.js — Rigenera le config nginx da createNginxConfig()
 * per tutti i siti attivi, preservando i custom 301 redirect esistenti.
 * Uso: node packages/vps/src/regenerate-nginx-configs.js --site-id 5
 *      node packages/vps/src/regenerate-nginx-configs.js --all
 *
 * Da eseguire dopo ogni modifica a createNginxConfig() in packages/vps/src/index.js
 * così i siti esistenti ricevono il fix senza perdere i custom redirect.
 */
import 'dotenv/config';
import { readFileSync, existsSync } from 'fs';
import { execSync } from 'child_process';
import { join } from 'path';
import { sql } from '@content-network/db';
import { createNginxConfig, reloadNginx } from './index.js';

const NGINX_AVAILABLE = '/etc/nginx/sites-available';

/**
 * Estrae i custom 301 redirect da un config nginx esistente.
 * Cerca righe del tipo: location = /slug/ { return 301 /other-slug/; }
 * che non fanno parte del template base.
 */
function extractCustomRedirects(configPath) {
  if (!existsSync(configPath)) return '';
  const content = readFileSync(configPath, 'utf-8');

  // Prima cerca tra i marker se presenti (config già rigenerata)
  const markerMatch = content.match(/# BEGIN CUSTOM REDIRECTS\n([\s\S]*?)# END CUSTOM REDIRECTS/);
  if (markerMatch) {
    return markerMatch[1].trim();
  }

  // Fallback: estrai tutte le righe con custom slug 301 (vecchi config senza marker)
  const lines = content.split('\n');
  const redirectLines = lines.filter(line => {
    const t = line.trim();
    return t.startsWith('location = /') && t.includes('return 301') && !t.includes('$request_uri');
  });
  return redirectLines.map(l => l.trim()).join('\n');
}

async function run() {
  const args = process.argv.slice(2);
  const all = args.includes('--all');
  const siteId = parseInt(args.find(a => a.startsWith('--site-id='))?.split('=')[1]
    || args[args.indexOf('--site-id') + 1]);

  if (!all && !siteId) {
    console.error('Uso: node regenerate-nginx-configs.js --site-id <id>  oppure  --all');
    process.exit(1);
  }

  const sites = all
    ? await sql`SELECT id, domain FROM sites WHERE status != 'inactive' ORDER BY id`
    : await sql`SELECT id, domain FROM sites WHERE id = ${siteId}`;

  if (!sites.length) { console.error('Nessun sito trovato'); process.exit(1); }

  console.log(`\nRigenerando nginx config per ${sites.length} sito/i...\n`);

  let ok = 0, skipped = 0;
  for (const site of sites) {
    const configPath = join(NGINX_AVAILABLE, site.domain);

    // Leggi custom redirect prima di sovrascrivere
    const customRedirects = extractCustomRedirects(configPath);
    if (customRedirects) {
      console.log(`  ${site.domain}: trovati ${customRedirects.split('\n').filter(Boolean).length} custom redirect`);
    }

    try {
      // createNginxConfig scrive in sites-available e crea symlink se non esiste
      createNginxConfig(site.domain, customRedirects);
      console.log(`  OK  ${site.domain}`);
      ok++;
    } catch (err) {
      console.error(`  ERR ${site.domain}: ${err.message}`);
      skipped++;
    }
  }

  // Valida e ricarica nginx
  try {
    execSync('nginx -t', { stdio: 'pipe' });
    reloadNginx();
    console.log('\nNginx ricaricato.');
  } catch (err) {
    console.error('\nERRORE nginx -t:', err.stderr?.toString() || err.message);
    console.error('Config NON ricaricata — controlla manualmente.');
    process.exit(1);
  }

  console.log(`\nCompletato: ${ok} ok, ${skipped} falliti`);
  process.exit(0);
}

run().catch(err => { console.error(err); process.exit(1); });
