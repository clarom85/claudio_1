/**
 * Keyword Engine — entry point
 * Dato il slug di una nicchia, genera e salva centinaia di long-tail keywords
 *
 * Usage: node packages/keyword-engine/src/index.js --niche home-improvement-costs
 */
import 'dotenv/config';
import { expandAllSeeds } from './autocomplete.js';
import { expandAllExtended } from './autocomplete-extended.js';
import { getPAAKeywords } from './paa.js';
import { getTrendingForNiche } from './trends.js';
import { getRedditKeywords } from './reddit.js';
import { filterKeywords, deduplicateAcrossSites } from './filter.js';
import { clusterKeywords, logClusterStats } from './cluster.js';
import { getNicheBySlug, bulkInsertKeywords, getExpansionSeeds, sql } from '@content-network/db';

async function run() {
  const args = process.argv.slice(2);
  const nicheArg = args.find(a => a.startsWith('--niche='))?.split('=')[1]
    || args[args.indexOf('--niche') + 1];
  // --expand: aggiunge keyword pillar già nel DB come seed aggiuntivi
  const expand = args.includes('--expand');

  if (!nicheArg) {
    console.error('Usage: node index.js --niche <niche-slug> [--expand]');
    console.error('Available: home-improvement-costs | pet-care-by-breed | software-error-fixes | diet-specific-recipes | small-town-tourism');
    process.exit(1);
  }

  const niche = await getNicheBySlug(nicheArg);
  if (!niche) {
    console.error(`Niche "${nicheArg}" not found. Run db:migrate first.`);
    process.exit(1);
  }

  console.log(`\n🔍 Keyword Engine — Niche: ${niche.name}`);

  // Seed expansion: aggiunge pillar keywords già nel DB come seed aggiuntivi
  // Evita di rieseguire sempre le stesse query sui seed originali
  let seeds = [...niche.seed_keywords];
  if (expand) {
    const extraSeeds = await getExpansionSeeds(niche.id, 15);
    if (extraSeeds.length) {
      seeds = [...new Set([...seeds, ...extraSeeds])];
      console.log(`Seeds (expanded): ${seeds.join(', ')}`);
    } else {
      console.log(`Seeds: ${seeds.join(', ')} (no expansion seeds found yet)`);
    }
  } else {
    console.log(`Seeds: ${seeds.join(', ')}`);
  }
  console.log();

  const allRaw = [];

  // 1. Google Autocomplete (principale fonte)
  console.log('📡 Google Autocomplete expansion...');
  const autocomplete = await expandAllSeeds(seeds, {
    lang: niche.language,
    country: niche.country.toLowerCase(),
    delay: 350
  });
  console.log(`   → ${autocomplete.length} suggestions`);
  allRaw.push(...autocomplete);

  // 2. People Also Ask
  console.log('❓ People Also Ask...');
  const paa = await getPAAKeywords(autocomplete.slice(0, 30), {
    language: niche.language,
    region: niche.country.toLowerCase()
  });
  console.log(`   → ${paa.length} PAA questions`);
  allRaw.push(...paa);

  // 3. Google Trends
  console.log('📈 Google Trends...');
  const trending = await getTrendingForNiche(seeds);
  console.log(`   → ${trending.length} trending queries`);
  allRaw.push(...trending);

  // 4. Reddit
  console.log('🤖 Reddit mining...');
  const reddit = await getRedditKeywords(niche.slug);
  console.log(`   → ${reddit.length} Reddit-derived keywords`);
  allRaw.push(...reddit);

  // 5. YouTube + Bing + Amazon + Quora (long-tail esteso)
  console.log('🎯 Extended sources (YouTube, Bing, Amazon, Quora)...');
  const extended = await expandAllExtended(seeds);
  console.log(`   → ${extended.length} extended suggestions`);
  allRaw.push(...extended);

  // Filter + classify
  console.log('\n🧹 Filtering and classifying...');
  const filtered = filterKeywords(allRaw);

  // Dedup contro keywords già nel DB per questa nicchia
  const existing = await sql`SELECT keyword FROM keywords WHERE niche_id = ${niche.id}`;
  const deduped = deduplicateAcrossSites(filtered, existing.map(r => r.keyword));

  console.log(`✅ ${deduped.length} unique quality keywords ready`);

  // Cluster keywords per topical authority
  console.log('\n🗂️  Clustering keywords...');
  const clustered = clusterKeywords(
    deduped.map(k => k.keyword),
    niche.slug,
    seeds
  );
  logClusterStats(clustered);

  // Build lookup map keyword → cluster info
  const clusterMap = new Map(clustered.map(c => [c.keyword, c]));

  // Save to DB with cluster metadata
  await bulkInsertKeywords(deduped.map(k => {
    const cluster = clusterMap.get(k.keyword) || {};
    return {
      nicheId: niche.id,
      keyword: k.keyword,
      source: 'mixed',
      intent: k.intent,
      clusterSlug: cluster.clusterSlug || null,
      isPillar: cluster.isPillar || false,
    };
  }));

  // Summary
  const intentCounts = deduped.reduce((acc, k) => {
    acc[k.intent] = (acc[k.intent] || 0) + 1;
    return acc;
  }, {});

  console.log('\n📊 Intent breakdown:');
  Object.entries(intentCounts).forEach(([intent, count]) => {
    console.log(`   ${intent}: ${count}`);
  });

  console.log(`\n✅ Done! ${deduped.length} keywords saved for "${niche.name}"`);
  process.exit(0);
}

run().catch(err => {
  console.error('Keyword engine error:', err);
  process.exit(1);
});
