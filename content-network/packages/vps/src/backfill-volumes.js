/**
 * backfill-volumes.js — Score search volume per keyword senza dati.
 *
 * Carica tutte le keyword unused con volume_scored=false (o search_volume null)
 * e le scorizza via Keywords Everywhere (primary) o DataForSEO (fallback).
 *
 * Uso:
 *   node packages/vps/src/backfill-volumes.js --niche <slug>
 *   node packages/vps/src/backfill-volumes.js --all
 */
import 'dotenv/config';
import { sql, bulkUpdateKeywordVolumes } from '@content-network/db';
import { fetchSearchVolumes } from '@content-network/keyword-engine/src/volume-scorer.js';

const args = process.argv.slice(2);
const all = args.includes('--all');
const nicheArg = args.find(a => a.startsWith('--niche='))?.split('=')[1]
  || (args.includes('--niche') ? args[args.indexOf('--niche') + 1] : null);

if (!all && !nicheArg) {
  console.error('Uso: node backfill-volumes.js --niche <slug>  oppure  --all');
  process.exit(1);
}

async function scoreNiche(niche) {
  // Carica tutte le keyword unused senza volume
  const unscored = await sql`
    SELECT id, keyword FROM keywords
    WHERE niche_id = ${niche.id}
      AND used = false
      AND (volume_scored = false OR volume_scored IS NULL OR search_volume IS NULL)
    ORDER BY id
  `;

  if (!unscored.length) {
    console.log(`  ${niche.slug}: nessuna keyword da scorizzare`);
    return 0;
  }

  console.log(`  ${niche.slug}: ${unscored.length} keyword da scorizzare...`);

  const volumeMap = await fetchSearchVolumes(unscored.map(k => k.keyword), {
    language: 'en',
    country: 'us',
  });

  if (!volumeMap.size) {
    console.log(`  ${niche.slug}: nessun dato ricevuto (provider non configurato?)`);
    return 0;
  }

  const updates = unscored
    .filter(k => volumeMap.has(k.keyword.toLowerCase()))
    .map(k => {
      const v = volumeMap.get(k.keyword.toLowerCase());
      return { keyword: k.keyword, nicheId: niche.id, ...v };
    });

  await bulkUpdateKeywordVolumes(updates);

  // Marca come volume_scored=true anche quelle che hanno ricevuto vol=0
  // (evita di ri-scorizzarle ogni volta)
  const allIds = unscored.map(k => k.id);
  for (let i = 0; i < allIds.length; i += 500) {
    const chunk = allIds.slice(i, i + 500);
    await sql`UPDATE keywords SET volume_scored = true WHERE id = ANY(${chunk})`;
  }

  const withVol = updates.filter(u => u.searchVolume > 0).length;
  console.log(`  ✅ ${niche.slug}: ${updates.length} scorizzate, ${withVol} con volume > 0`);
  return updates.length;
}

async function run() {
  let niches;
  if (nicheArg) {
    niches = await sql`SELECT id, slug FROM niches WHERE slug = ${nicheArg}`;
    if (!niches.length) { console.error(`Niche non trovata: ${nicheArg}`); process.exit(1); }
  } else {
    niches = await sql`
      SELECT DISTINCT n.id, n.slug FROM niches n
      JOIN sites s ON s.niche_id = n.id WHERE s.status = 'live'
    `;
  }

  console.log(`\n📊 Volume backfill — ${niches.length} niche\n`);

  let total = 0;
  for (const niche of niches) {
    total += await scoreNiche(niche);
  }

  console.log(`\n✅ Done — ${total} keyword scorizzate`);
  process.exit(0);
}

run().catch(err => { console.error(err); process.exit(1); });
