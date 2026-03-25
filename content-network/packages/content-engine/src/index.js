/**
 * Content Engine — batch article generator
 * Usage: node packages/content-engine/src/index.js --site-id 1 --count 50
 */
import 'dotenv/config';
import { generateArticle } from './generator.js';
import { injectInternalLinks } from './link-injector.js';
import { getPublishTime, logScheduleInfo } from './publishing-schedule.js';
import {
  getSitesByStatus, getUnusedKeywords, markKeywordUsed,
  insertArticle, enqueueArticle, getNicheBySlug, sql
} from '@content-network/db';
import { purgeCache as cfPurgeCache } from '@content-network/vps/src/cloudflare.js';

async function run() {
  const args = process.argv.slice(2);
  const siteId = parseInt(args.find(a => a.startsWith('--site-id='))?.split('=')[1]
    || args[args.indexOf('--site-id') + 1]);
  const count = parseInt(args.find(a => a.startsWith('--count='))?.split('=')[1]
    || args[args.indexOf('--count') + 1] || '10');

  if (!siteId) {
    console.error('Usage: node index.js --site-id <id> --count <number>');
    process.exit(1);
  }

  const [site] = await sql`
    SELECT s.*, n.slug as niche_slug, n.name as niche_name, n.seed_keywords,
           n.language, n.country
    FROM sites s JOIN niches n ON s.niche_id = n.id
    WHERE s.id = ${siteId}
  `;

  if (!site) {
    console.error(`Site ${siteId} not found`);
    process.exit(1);
  }

  const niche = {
    id: site.niche_id,
    slug: site.niche_slug,
    name: site.niche_name,
    seed_keywords: site.seed_keywords
  };

  console.log(`\n✍️  Content Engine`);
  console.log(`Site: ${site.domain} (${niche.name})`);
  logScheduleInfo(site.created_at, site.id);
  console.log(`Generating: ${count} articles\n`);

  const keywords = await getUnusedKeywords(niche.id, count);

  if (keywords.length === 0) {
    console.error('No unused keywords available. Run keyword engine first.');
    process.exit(1);
  }

  // Carica slug e titoli già esistenti per il sito — usati per dedup
  const existingArticles = await sql`
    SELECT slug, title FROM articles WHERE site_id = ${siteId}
  `;
  const existingSlugs = new Set(existingArticles.map(a => a.slug));
  const existingTitles = existingArticles.map(a => a.title.toLowerCase());

  let success = 0;
  let failed = 0;
  let skipped = 0;
  const generatedArticles = [];

  // Determina la public dir del sito per le immagini
  const WWW_ROOT = process.env.WWW_ROOT || '/var/www';
  const sitePublicDir = process.env.SITE_PUBLIC_DIR || (site.domain ? `${WWW_ROOT}/${site.domain}` : null);

  for (const kw of keywords) {
    try {
      process.stdout.write(`  [${success + failed + skipped + 1}/${keywords.length}] "${kw.keyword}" ... `);

      const article = await generateArticle(kw.keyword, niche, site, 3, sitePublicDir);

      // Dedup: salta se slug già esiste
      if (existingSlugs.has(article.slug)) {
        await markKeywordUsed(kw.id);
        skipped++;
        console.log(`⚠️  SKIP (slug duplicate: ${article.slug})`);
        continue;
      }

      // Dedup: salta se titolo troppo simile a uno già esistente (Jaccard ≥ 0.65)
      const newTitle = article.title.toLowerCase();
      const dupTitle = existingTitles.find(t => jaccardSimilarity(newTitle, t) >= 0.65);
      if (dupTitle) {
        await markKeywordUsed(kw.id);
        skipped++;
        console.log(`⚠️  SKIP (title too similar to: "${dupTitle}")`);
        continue;
      }

      generatedArticles.push({ ...article, keywordId: kw.id });
      existingSlugs.add(article.slug);
      existingTitles.push(newTitle);
      success++;
      console.log(`✅ ${article.wordCount} words${article.image ? ' + image' : ''}`);

    } catch (err) {
      failed++;
      console.log(`❌ ${err.message}`);
    }
  }
  if (skipped > 0) console.log(`\n  Skipped ${skipped} duplicate(s)`);

  // Second pass: inietta link interni tra tutti gli articoli generati
  console.log('\n🔗 Injecting internal links...');
  const linkedArticles = injectInternalLinks(generatedArticles);

  // Salva nel DB e schedula pubblicazione
  for (const article of linkedArticles) {
    try {
      const saved = await insertArticle({
        siteId: site.id,
        keywordId: article.keywordId,
        slug: article.slug,
        title: article.title,
        metaDescription: article.metaDescription,
        content: article.content,
        wordCount: article.wordCount,
        schemaMarkup: article.schemaMarkup,
        tags: article.tags || [],
        image: article.image,
        category: article.category,
        author: article.author,
        excerpt: article.excerpt,
        date: article.date
      });

      if (saved) {
        const scheduledFor = getScheduledTime(linkedArticles.indexOf(article), linkedArticles.length);
        await enqueueArticle(saved.id, site.id, scheduledFor);
        await markKeywordUsed(article.keywordId);
      }
    } catch (err) {
      console.warn(`  DB save failed for "${article.slug}": ${err.message}`);
    }
  }

  console.log(`\n📊 Results: ${success} generated, ${failed} failed`);
  console.log(`Articles queued for gradual publishing (scheduler publishes progressively)`);

  // Purge Cloudflare cache dopo pubblicazione nuovi articoli
  if (process.env.CLOUDFLARE_API_TOKEN && success > 0) {
    try {
      await cfPurgeCache(site.domain);
    } catch (err) {
      console.warn(`  ⚠️  Cache purge failed: ${err.message}`);
    }
  }

  process.exit(0);
}

/**
 * Wrapper — usa publishing-schedule per timestamp organici
 */
function getScheduledTime(index, total) {
  return getPublishTime(index, total);
}

/**
 * Jaccard similarity tra due stringhe (tokenizzate per parole).
 * Ritorna valore 0–1. Usato per dedup titoli.
 */
function jaccardSimilarity(a, b) {
  const setA = new Set(a.split(/\s+/).filter(Boolean));
  const setB = new Set(b.split(/\s+/).filter(Boolean));
  const intersection = [...setA].filter(w => setB.has(w)).length;
  const union = new Set([...setA, ...setB]).size;
  return union === 0 ? 0 : intersection / union;
}

run().catch(err => {
  console.error('Content engine error:', err);
  process.exit(1);
});
