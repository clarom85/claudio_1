/**
 * Scheduler — gira ogni ora via cron
 * Pubblica articoli accodati e triggera la generazione di nuovi
 *
 * Cron: 0 * * * * (ogni ora)
 * Usage: node packages/scheduler/src/index.js
 */
import 'dotenv/config';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import fse from 'fs-extra';
import {
  getDueItems, updateQueueItem, updateArticleStatus,
  getSitesByStatus, getUnusedKeywords, sql
} from '@content-network/db';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '../../..');
const SITES_DIR = join(ROOT, 'sites');

const ARTICLES_PER_DAY = parseInt(process.env.ARTICLES_PER_DAY || '50');
const BATCH_SIZE = Math.ceil(ARTICLES_PER_DAY / 24); // distribuiti in 24 ore

async function run() {
  const now = new Date();
  console.log(`\n⏰ Scheduler run: ${now.toISOString()}`);

  // 1. Pubblica articoli accodati
  await publishDueArticles();

  // 2. Se siamo a inizio giornata (00:xx), genera nuovi articoli
  if (now.getHours() === 0) {
    await triggerDailyGeneration();
  }

  // 3. Rebuild siti con nuovi articoli
  await rebuildLiveSites();

  console.log('✅ Scheduler run complete\n');
  process.exit(0);
}

async function publishDueArticles() {
  const dueItems = await getDueItems(BATCH_SIZE);
  if (dueItems.length === 0) {
    console.log('  No articles due for publishing');
    return;
  }

  console.log(`  Publishing ${dueItems.length} articles...`);

  for (const item of dueItems) {
    try {
      await updateQueueItem(item.id, 'processing');
      await updateArticleStatus(item.article_id, 'published');
      await updateQueueItem(item.id, 'done');
      console.log(`  ✅ Published: ${item.title?.slice(0, 50)}`);
    } catch (err) {
      await updateQueueItem(item.id, 'failed', err.message);
      console.log(`  ❌ Failed: ${err.message}`);
    }
  }
}

async function triggerDailyGeneration() {
  console.log('  🌅 Daily generation trigger...');

  const liveSites = await getSitesByStatus('live');
  for (const site of liveSites) {
    // Verifica se il sito ha abbastanza keywords in coda
    const unusedKws = await getUnusedKeywords(site.niche_id, 1);
    if (unusedKws.length < ARTICLES_PER_DAY) {
      console.log(`  ⚠️  Site ${site.domain}: low keywords, running keyword engine...`);
      try {
        const nicheSlug = await getNicheSlug(site.niche_id);
        execSync(`node packages/keyword-engine/src/index.js --niche ${nicheSlug}`, {
          cwd: ROOT, stdio: 'pipe', timeout: 120000
        });
      } catch (e) {
        console.log(`  ❌ Keyword engine failed: ${e.message}`);
      }
    }

    // Genera articoli per oggi
    console.log(`  ✍️  Generating articles for ${site.domain}...`);
    try {
      execSync(
        `node packages/content-engine/src/index.js --site-id ${site.id} --count ${ARTICLES_PER_DAY}`,
        { cwd: ROOT, stdio: 'pipe', timeout: 300000 }
      );
    } catch (e) {
      console.log(`  ❌ Content engine failed for ${site.domain}: ${e.message}`);
    }
  }
}

async function rebuildLiveSites() {
  // Trova siti con articoli pubblicati di recente che necessitano rebuild
  const sitesNeedingRebuild = await sql`
    SELECT DISTINCT s.id, s.domain, s.cf_project_name, s.niche_id
    FROM sites s
    JOIN articles a ON a.site_id = s.id
    WHERE s.status = 'live'
      AND a.status = 'published'
      AND a.published_at > NOW() - INTERVAL '2 hours'
  `;

  if (sitesNeedingRebuild.length === 0) return;

  console.log(`  🔨 Rebuilding ${sitesNeedingRebuild.length} sites...`);

  for (const site of sitesNeedingRebuild) {
    const siteDir = join(SITES_DIR, site.domain);
    if (!await fse.pathExists(siteDir)) continue;

    try {
      // Aggiorna articles.json con gli ultimi pubblicati
      const { getArticlesBySite } = await import('@content-network/db');
      const articles = await getArticlesBySite(site.id, 500);
      await updateArticlesJson(siteDir, articles);

      // Rebuild
      execSync('npm run build', { cwd: siteDir, stdio: 'pipe', timeout: 120000 });

      // Re-deploy
      const { uploadDeploy } = await import('@content-network/site-spawner/src/cloudflare.js');
      await uploadDeploy(site.cf_project_name, join(siteDir, 'dist'));

      console.log(`  ✅ Rebuilt: ${site.domain}`);
    } catch (err) {
      console.log(`  ❌ Rebuild failed for ${site.domain}: ${err.message}`);
    }
  }
}

async function updateArticlesJson(siteDir, articles) {
  const contentDir = join(siteDir, 'src/content');
  await fse.ensureDir(contentDir);

  const data = articles
    .filter(a => a.status === 'published')
    .map(a => ({
      slug: a.slug,
      title: a.title,
      metaDescription: a.meta_description,
      excerpt: (a.meta_description || '').slice(0, 120) + '...',
      content: a.content,
      schemas: a.schema_markup,
      tags: [],
      author: 'Editorial Team',
      category: 'Guide',
      date: a.published_at || a.created_at,
      wordCount: a.word_count
    }));

  await fse.writeJSON(join(contentDir, 'articles.json'), data, { spaces: 0 });
}

async function getNicheSlug(nicheId) {
  const [row] = await sql`SELECT slug FROM niches WHERE id = ${nicheId}`;
  return row?.slug;
}

run().catch(err => {
  console.error('Scheduler error:', err);
  process.exit(1);
});
