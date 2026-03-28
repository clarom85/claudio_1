/**
 * backfill-author-bios.js — One-time script to generate and persist longBio
 * for existing sites that were spawned before the api/author.json persistence fix.
 *
 * Uso: node packages/vps/src/backfill-author-bios.js
 */
import 'dotenv/config';
import { existsSync } from 'fs';
import { join } from 'path';
import { sql } from '@content-network/db';
import { generateAuthors } from '@content-network/content-engine/src/author-generator.js';

const WWW_ROOT = process.env.WWW_ROOT || '/var/www';

async function run() {
  const sites = await sql`
    SELECT s.id, s.domain, n.slug as niche_slug
    FROM sites s JOIN niches n ON n.id = s.niche_id
    WHERE s.status != 'inactive'
    ORDER BY s.id
  `;

  console.log(`\nGenerating longBio for ${sites.length} site(s)...\n`);

  for (const site of sites) {
    const authorJsonPath = join(WWW_ROOT, site.domain, 'api', 'author.json');
    if (existsSync(authorJsonPath)) {
      console.log(`✅ ${site.domain} — already has api/author.json, skipping`);
      continue;
    }

    console.log(`📝 ${site.domain} (${site.niche_slug})`);
    try {
      const destDir = join(WWW_ROOT, site.domain);
      await generateAuthors(site.niche_slug, { destDir, isVps: true });
      console.log(`  ✅ Saved api/author.json\n`);
    } catch (err) {
      console.error(`  ❌ ${site.domain}: ${err.message}\n`);
    }
  }

  console.log('Done. Run: node packages/vps/src/regenerate-author-pages.js --all');
  process.exit(0);
}

run().catch(err => { console.error(err); process.exit(1); });
