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

      // Pre-generation anti-cannibalization check (zero API cost)
      const canniCheck = checkKeywordCannibalization(kw.keyword, existingSlugs, existingTitles);
      if (canniCheck.skip) {
        await markKeywordUsed(kw.id);
        skipped++;
        console.log(`⚠️  SKIP (pre-gen: ${canniCheck.reason})`);
        continue;
      }

      const article = await generateArticle(kw.keyword, niche, site, 3, sitePublicDir);

      // Dedup: salta se slug già esiste
      if (existingSlugs.has(article.slug)) {
        await markKeywordUsed(kw.id);
        skipped++;
        console.log(`⚠️  SKIP (slug duplicate: ${article.slug})`);
        continue;
      }

      // Dedup: salta se titolo troppo simile a uno già esistente (Jaccard ≥ 0.55, normalizzato)
      const newTitle = article.title.toLowerCase();
      const dupTitle = existingTitles.find(t => jaccardSimilarity(newTitle, t) >= 0.55);
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
 * Normalizza un titolo per il confronto topic-semantico:
 * 1. Prende solo il titolo principale (prima del colon/dash)
 * 2. Rimuove anni (2024, 2025, 2026…)
 * 3. Rimuove parole "rumore" puramente decorative (complete, ultimate, real…)
 * 4. Rimuove stop words
 * 5. Stemma le parole rimanenti (doppio-pass per "-ations" → "-ation" → stem)
 * 6. Ritorna Set di token normalizzati
 */
function normalizeTitleTokens(title) {
  const STOP = new Set([
    'a','an','the','and','or','but','in','on','at','to','for','of','with','by',
    'from','is','are','was','were','be','been','have','has','do','does','did',
    'will','would','could','should','i','my','your','it','its','this','that',
    'vs','per','not','no','all','any','how','what','why','when','where','which',
    'who','get','can','much','does',
  ]);
  // Solo parole puramente decorative che non aggiungono significato al topic
  const NOISE = new Set([
    'complete','honest','ultimate','comprehensive','expert','full','detailed',
    'updated','new','fast','quick','simple','easy','actual','typical','true',
    'total','every','real','breakdown',
  ]);
  function stem(w) {
    return w.replace(/(?<=\w{3})(ing|tion|ment|ness|er|es|s)$/i, '');
  }
  function stemDouble(w) {
    const s = stem(w);
    return s !== w ? stem(s) : s; // secondo pass per "renovations" → "renovation" → "renovat"
  }
  // Prendi solo la parte prima del colon o em-dash (il sottotitolo aggiunge rumore)
  let t = title.toLowerCase().split(/\s*[:\u2014\u2013]\s*/)[0];
  // Rimuovi anni e punteggiatura
  t = t.replace(/\b20\d{2}\b/g, '').replace(/[^\w\s]/g, ' ');
  const tokens = t.split(/\s+/)
    .map(w => w.trim())
    .filter(w => w.length > 2 && !STOP.has(w) && !NOISE.has(w))
    .map(stemDouble);
  return new Set(tokens);
}

/**
 * Jaccard similarity tra due titoli di articoli.
 * Usa normalizzazione semantica (strip sottotitolo, noise words, stop words, stem).
 * Ritorna valore 0–1. Usato per dedup titoli.
 */
function jaccardSimilarity(a, b) {
  const setA = normalizeTitleTokens(a);
  const setB = normalizeTitleTokens(b);
  if (setA.size === 0 || setB.size === 0) return 0;
  const intersection = [...setA].filter(w => setB.has(w)).length;
  const union = new Set([...setA, ...setB]).size;
  return union === 0 ? 0 : intersection / union;
}

/**
 * Token geografici US — usati per rilevare e limitare geo-varianti della stessa keyword.
 * Permettiamo max 2 geo-varianti per stesso core topic.
 */
const US_GEO_TOKENS = new Set([
  'alabama','alaska','arizona','arkansas','california','colorado','connecticut',
  'delaware','florida','georgia','hawaii','idaho','illinois','indiana','iowa',
  'kansas','kentucky','louisiana','maine','maryland','massachusetts','michigan',
  'minnesota','mississippi','missouri','montana','nebraska','nevada',
  'new hampshire','new jersey','new mexico','new york','north carolina',
  'north dakota','ohio','oklahoma','oregon','pennsylvania','rhode island',
  'south carolina','south dakota','tennessee','texas','utah','vermont',
  'virginia','washington','west virginia','wisconsin','wyoming',
  'nyc','la','chicago','houston','phoenix','dallas','san antonio','san diego',
  'san jose','austin','jacksonville','fort worth','columbus','charlotte',
  'indianapolis','san francisco','seattle','denver','boston','nashville',
  'memphis','miami','atlanta','new orleans','portland','las vegas','tucson',
]);

/**
 * Rimuove token geografici US da una stringa keyword.
 * Ritorna il "core topic" senza geo-specificità.
 */
function stripGeoFromKeyword(kw) {
  const tokens = kw.toLowerCase().split(/\s+/);
  const stripped = tokens.filter(t => !US_GEO_TOKENS.has(t)).join(' ').trim();
  return stripped || kw;
}

/**
 * Controllo pre-generazione: verifica se una keyword causerebbe cannibalizzazione
 * senza consumare API call. 3 livelli di check:
 * 1. Slug predetto già esistente
 * 2. Jaccard keyword vs titoli esistenti ≥ 0.50
 * 3. Geo-variant cap: max 2 varianti geo per core topic
 *
 * @returns {{ skip: boolean, reason?: string }}
 */
function checkKeywordCannibalization(keyword, existingSlugs, existingTitles) {
  const kw = keyword.toLowerCase();

  // Level 1: predicted slug collision (free, no API)
  const predictedSlug = kw.replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  if (existingSlugs.has(predictedSlug)) {
    return { skip: true, reason: `predicted slug already exists: ${predictedSlug}` };
  }

  // Level 2: keyword Jaccard vs existing titles (threshold 0.50 — stricter than post-gen 0.55)
  const kwDup = existingTitles.find(t => jaccardSimilarity(kw, t) >= 0.50);
  if (kwDup) {
    return { skip: true, reason: `keyword too similar to existing title: "${kwDup}"` };
  }

  // Level 3: geo-variant cap — max 2 geo-variants of same core topic
  const kwCore = stripGeoFromKeyword(kw);
  if (kwCore !== kw) {
    const geoVariantCount = existingTitles.filter(t => {
      const tCore = stripGeoFromKeyword(t);
      if (tCore === t) return false; // not a geo variant, skip
      return jaccardSimilarity(kwCore, tCore) >= 0.60;
    }).length;
    if (geoVariantCount >= 2) {
      return { skip: true, reason: `geo-variant cap (${geoVariantCount} variants already exist for core: "${kwCore}")` };
    }
  }

  return { skip: false };
}

run().catch(err => {
  console.error('Content engine error:', err);
  process.exit(1);
});
