/**
 * cleanup-keyword-pool.js — Pulizia proattiva del pool di keywords.
 *
 * Marca come `used=true` le keywords inutilizzate che verrebbero comunque
 * skippate al momento della generazione, evitando tentativi sprecati.
 *
 * Criteri di cleanup:
 *  1. Slug conflict: predicted-slug uguale a quello di un articolo esistente
 *     (qualsiasi stato: published, removed, redirected, draft)
 *  2. Jaccard ≥ 0.50 vs titoli di articoli pubblicati (stesso check del pre-gen)
 *  3. Topic fingerprint identico a una keyword già usata nella nicchia
 *
 * Uso: node packages/vps/src/cleanup-keyword-pool.js [--niche <slug>] [--dry-run]
 */
import 'dotenv/config';
import { sql } from '@content-network/db';
import { topicFingerprint, classifyIntent } from '@content-network/keyword-engine/src/filter.js';

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const nicheIdx = args.indexOf('--niche');
const nicheFilter = args.find(a => a.startsWith('--niche='))?.split('=')[1]
  || (nicheIdx !== -1 ? args[nicheIdx + 1] : null) || null;

function stem(w) {
  return w.replace(/(?<=\w{3})(ing|tion|ment|ness|ful|less|er|es|s)$/i, '');
}

function jaccardSimilarity(a, b) {
  const setA = new Set(a.toLowerCase().split(/\s+/).map(stem));
  const setB = new Set(b.toLowerCase().split(/\s+/).map(stem));
  const intersection = [...setA].filter(w => setB.has(w)).length;
  const union = new Set([...setA, ...setB]).size;
  return union === 0 ? 0 : intersection / union;
}

function predictSlug(keyword) {
  return keyword.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

async function cleanNiche(niche) {
  console.log(`\n🔍 ${niche.slug} (niche_id=${niche.id})`);

  // Carica articoli di questa nicchia (tutti i siti, tutti gli status)
  const articles = await sql`
    SELECT a.slug, a.title, a.status
    FROM articles a
    JOIN sites s ON a.site_id = s.id
    WHERE s.niche_id = ${niche.id}
  `;
  const allSlugs = new Set(articles.map(a => a.slug));
  const publishedTitles = articles
    .filter(a => a.status === 'published')
    .map(a => a.title.toLowerCase());

  // Carica keywords usate (per fingerprint dedup)
  const usedKws = await sql`
    SELECT keyword FROM keywords
    WHERE niche_id = ${niche.id} AND used = true
  `;
  const usedFingerprints = new Set(
    usedKws.map(k => `${classifyIntent(k.keyword)}::${topicFingerprint(k.keyword)}`)
  );

  // Fingerprints of published article titles — to catch "article exists but keyword phrased differently"
  const articleFingerprints = new Set(
    publishedTitles.map(t => `${classifyIntent(t)}::${topicFingerprint(t)}`)
  );

  // Carica keywords inutilizzate (search_volume per tenere quelle più preziose nell'intra-pool dedup)
  const unused = await sql`
    SELECT id, keyword, search_volume FROM keywords
    WHERE niche_id = ${niche.id} AND used = false
    ORDER BY COALESCE(search_volume, 0) DESC, id ASC
  `;
  console.log(`  Unused: ${unused.length}`);

  const toMark = [];
  const reasons = {};
  // Intra-pool dedup: tracks fingerprints of unused keywords we decided to KEEP
  const keptPoolFingerprints = new Set();

  for (const kw of unused) {
    const kwLower = kw.keyword.toLowerCase();

    // Check 1: slug conflict vs qualsiasi articolo
    const predictedSlug = predictSlug(kwLower);
    if (allSlugs.has(predictedSlug)) {
      toMark.push(kw.id);
      reasons[kw.id] = `slug conflict: ${predictedSlug}`;
      continue;
    }

    // Check 2: Jaccard ≥ 0.50 vs titoli articoli pubblicati
    const tooSimilarTitle = publishedTitles.find(t => jaccardSimilarity(kwLower, t) >= 0.50);
    if (tooSimilarTitle) {
      toMark.push(kw.id);
      reasons[kw.id] = `title similar: "${tooSimilarTitle.slice(0, 60)}"`;
      continue;
    }

    // Check 3: topic fingerprint identico a keyword già usata
    const fp = `${classifyIntent(kwLower)}::${topicFingerprint(kwLower)}`;
    if (usedFingerprints.has(fp)) {
      toMark.push(kw.id);
      reasons[kw.id] = `fingerprint dup (used kw): ${fp}`;
      continue;
    }

    // Check 4: topic fingerprint identico a titolo di articolo pubblicato
    // Cattura casi in cui l'articolo esiste ma il titolo è diverso dalla keyword
    if (articleFingerprints.has(fp)) {
      toMark.push(kw.id);
      reasons[kw.id] = `fingerprint matches published article: ${fp}`;
      continue;
    }

    // Check 5: intra-pool dedup — elimina varianti dello stesso topic nel pool inutilizzato
    // (unused è già ordinato per search_volume DESC → teniamo la keyword più preziosa)
    if (keptPoolFingerprints.has(fp)) {
      toMark.push(kw.id);
      reasons[kw.id] = `intra-pool duplicate: ${fp}`;
      continue;
    }
    keptPoolFingerprints.add(fp);
  }

  console.log(`  To cleanup: ${toMark.length} (${((toMark.length / unused.length) * 100).toFixed(1)}%)`);
  if (toMark.length > 0 && toMark.length <= 10) {
    toMark.forEach(id => {
      const kw = unused.find(k => k.id === id);
      console.log(`    ⚠️  "${kw?.keyword}" → ${reasons[id]}`);
    });
  } else if (toMark.length > 0) {
    // Mostra solo i primi 5
    toMark.slice(0, 5).forEach(id => {
      const kw = unused.find(k => k.id === id);
      console.log(`    ⚠️  "${kw?.keyword}" → ${reasons[id]}`);
    });
    console.log(`    ... e altri ${toMark.length - 5}`);
  }

  if (!dryRun && toMark.length > 0) {
    // Batch update in chunks di 100
    for (let i = 0; i < toMark.length; i += 100) {
      const chunk = toMark.slice(i, i + 100);
      await sql`UPDATE keywords SET used = true WHERE id = ANY(${chunk})`;
    }
    console.log(`  ✅ Marked ${toMark.length} keywords as used`);
  } else if (dryRun && toMark.length > 0) {
    console.log(`  [dry-run] Would mark ${toMark.length} keywords`);
  }

  return { cleaned: toMark.length, remaining: unused.length - toMark.length };
}

async function run() {
  console.log(`\n🧹 Keyword Pool Cleanup${dryRun ? ' [DRY RUN]' : ''}\n`);

  let niches;
  if (nicheFilter) {
    niches = await sql`SELECT id, slug FROM niches WHERE slug = ${nicheFilter}`;
    if (niches.length === 0) { console.error(`Niche not found: ${nicheFilter}`); process.exit(1); }
  } else {
    // Solo nicchie con siti live
    niches = await sql`
      SELECT DISTINCT n.id, n.slug FROM niches n
      JOIN sites s ON s.niche_id = n.id
      WHERE s.status = 'live'
    `;
  }

  let totalCleaned = 0;
  let totalRemaining = 0;

  for (const niche of niches) {
    const result = await cleanNiche(niche);
    totalCleaned += result.cleaned;
    totalRemaining += result.remaining;
  }

  console.log(`\n✅ Total cleaned: ${totalCleaned} | Remaining usable: ${totalRemaining}`);
  process.exit(0);
}

run().catch(err => { console.error(err); process.exit(1); });
