/**
 * Content Engine — batch article generator
 * Usage: node packages/content-engine/src/index.js --site-id 1 --count 50
 */
import 'dotenv/config';
import { generateArticle } from './generator.js';
import {
  getSitesByStatus, getUnusedKeywords, markKeywordUsed,
  insertArticle, enqueueArticle, getNicheBySlug, sql
} from '@content-network/db';

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
  console.log(`Generating: ${count} articles\n`);

  const keywords = await getUnusedKeywords(niche.id, count);

  if (keywords.length === 0) {
    console.error('No unused keywords available. Run keyword engine first.');
    process.exit(1);
  }

  let success = 0;
  let failed = 0;

  for (const kw of keywords) {
    try {
      process.stdout.write(`  [${success + failed + 1}/${keywords.length}] "${kw.keyword}" ... `);

      const article = await generateArticle(kw.keyword, niche, site);

      const saved = await insertArticle({
        siteId: site.id,
        keywordId: kw.id,
        slug: article.slug,
        title: article.title,
        metaDescription: article.metaDescription,
        content: article.content,
        wordCount: article.wordCount,
        schemaMarkup: article.schemaMarkup
      });

      if (saved) {
        // Schedula pubblicazione distribuita (non pubblicare tutto subito)
        const scheduledFor = getScheduledTime(success, count);
        await enqueueArticle(saved.id, site.id, scheduledFor);
        await markKeywordUsed(kw.id);
        success++;
        console.log(`✅ ${article.wordCount} words`);
      }

    } catch (err) {
      failed++;
      console.log(`❌ ${err.message}`);
    }
  }

  console.log(`\n📊 Results: ${success} generated, ${failed} failed`);
  console.log(`Articles queued for gradual publishing (max 50/day)`);
  process.exit(0);
}

/**
 * Distribuisce gli articoli nel tempo per sembrare pubblicazione organica
 * Non pubblicare tutto in un colpo: Google penalizza burst anomali
 */
function getScheduledTime(index, total) {
  const now = new Date();
  const ARTICLES_PER_HOUR = 3;
  const delayMs = (index / ARTICLES_PER_HOUR) * 60 * 60 * 1000;
  return new Date(now.getTime() + delayMs);
}

run().catch(err => {
  console.error('Content engine error:', err);
  process.exit(1);
});
