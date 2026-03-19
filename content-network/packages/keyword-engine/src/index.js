/**
 * Keyword Engine — entry point
 * Dato il slug di una nicchia, genera e salva centinaia di long-tail keywords
 *
 * Usage: node packages/keyword-engine/src/index.js --niche home-improvement-costs
 */
import 'dotenv/config';
import { expandAllSeeds } from './autocomplete.js';
import { getPAAKeywords } from './paa.js';
import { getTrendingForNiche } from './trends.js';
import { getRedditKeywords } from './reddit.js';
import { filterKeywords, deduplicateAcrossSites } from './filter.js';
import { getNicheBySlug, bulkInsertKeywords, sql } from '@content-network/db';

async function run() {
  const args = process.argv.slice(2);
  const nicheArg = args.find(a => a.startsWith('--niche='))?.split('=')[1]
    || args[args.indexOf('--niche') + 1];

  if (!nicheArg) {
    console.error('Usage: node index.js --niche <niche-slug>');
    console.error('Available: home-improvement-costs | pet-care-by-breed | software-error-fixes | diet-specific-recipes | small-town-tourism');
    process.exit(1);
  }

  const niche = await getNicheBySlug(nicheArg);
  if (!niche) {
    console.error(`Niche "${nicheArg}" not found. Run db:migrate first.`);
    process.exit(1);
  }

  console.log(`\n🔍 Keyword Engine — Niche: ${niche.name}`);
  console.log(`Seeds: ${niche.seed_keywords.join(', ')}\n`);

  const allRaw = [];

  // 1. Google Autocomplete (principale fonte)
  console.log('📡 Google Autocomplete expansion...');
  const autocomplete = await expandAllSeeds(niche.seed_keywords, {
    lang: niche.language,
    country: niche.country.toLowerCase(),
    delay: 350
  });
  console.log(`   → ${autocomplete.length} suggestions`);
  allRaw.push(...autocomplete);

  // 2. People Also Ask
  console.log('❓ People Also Ask...');
  const paa = await getPAAKeywords(autocomplete.slice(0, 30));
  console.log(`   → ${paa.length} PAA questions`);
  allRaw.push(...paa);

  // 3. Google Trends
  console.log('📈 Google Trends...');
  const trending = await getTrendingForNiche(niche.seed_keywords);
  console.log(`   → ${trending.length} trending queries`);
  allRaw.push(...trending);

  // 4. Reddit
  console.log('🤖 Reddit mining...');
  const reddit = await getRedditKeywords(niche.slug);
  console.log(`   → ${reddit.length} Reddit-derived keywords`);
  allRaw.push(...reddit);

  // Filter + classify
  console.log('\n🧹 Filtering and classifying...');
  const filtered = filterKeywords(allRaw);

  // Dedup contro keywords già nel DB per questa nicchia
  const existing = await sql`SELECT keyword FROM keywords WHERE niche_id = ${niche.id}`;
  const deduped = deduplicateAcrossSites(filtered, existing.map(r => r.keyword));

  console.log(`✅ ${deduped.length} unique quality keywords ready`);

  // Save to DB
  await bulkInsertKeywords(deduped.map(k => ({
    nicheId: niche.id,
    keyword: k.keyword,
    source: 'mixed',
    intent: k.intent
  })));

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
