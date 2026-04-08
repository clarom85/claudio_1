/**
 * Content Engine — batch article generator
 * Usage: node packages/content-engine/src/index.js --site-id 1 --count 50
 */
import 'dotenv/config';
import { generateArticle } from './generator.js';
import { injectInternalLinks } from './link-injector.js';
import { getPublishTime, logScheduleInfo } from './publishing-schedule.js';
import { topicFingerprint } from '../../keyword-engine/src/filter.js';
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

  // Carica slug, titoli e keyword sorgente già esistenti — usati per dedup
  // Escludi articoli rimossi (status='removed') per non bloccare keyword legittime
  const existingArticles = await sql`
    SELECT a.slug, a.title, k.keyword AS src_kw
    FROM articles a
    LEFT JOIN keywords k ON a.keyword_id = k.id
    WHERE a.site_id = ${siteId} AND a.status != 'removed'
  `;
  const existingSlugs = new Set(existingArticles.map(a => a.slug));
  const existingTitles = existingArticles.map(a => a.title.toLowerCase());
  // Fingerprint delle keyword sorgente già pubblicate — per semantic dedup
  const existingSrcFingerprints = existingArticles
    .filter(a => a.src_kw)
    .map(a => topicFingerprint(a.src_kw))
    .filter(fp => fp.length > 0);

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
      const canniCheck = checkKeywordCannibalization(kw.keyword, existingSlugs, existingTitles, existingSrcFingerprints);
      if (canniCheck.skip) {
        await markKeywordUsed(kw.id);
        skipped++;
        console.log(`⚠️  SKIP (pre-gen: ${canniCheck.reason})`);
        continue;
      }

      const article = await generateArticle(kw, niche, site, 5, sitePublicDir);

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
      if (err.message?.startsWith('BLOCKED:')) {
        // Keyword off-topic/geo — mark used so it's never retried, but don't count as failure
        await markKeywordUsed(kw.id);
        skipped++;
        console.log(`🚫 ${err.message}`);
      } else {
        failed++;
        console.log(`❌ ${err.message}`);
      }
    }
  }
  if (skipped > 0) console.log(`\n  Skipped ${skipped} (duplicates + blocked)`);

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
        date: article.date,
        tokensIn: article.tokensIn || 0,
        tokensOut: article.tokensOut || 0,
        modelUsed: article.modelUsed || null,
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
 * Token geografici US — usati per rilevare geo-varianti della stessa keyword.
 * Permette articoli state-by-state senza flaggarli come duplicati.
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
 * Trova il primo token geo US in un titolo (controlla prima multi-word).
 * Ritorna il token geo trovato o null.
 */
function findGeoToken(title) {
  const lower = title.toLowerCase();
  // Controlla prima i token più lunghi (es. "north carolina" prima di "carolina")
  const sorted = [...US_GEO_TOKENS].sort((a, b) => b.length - a.length);
  for (const geo of sorted) {
    if (lower.includes(geo)) return geo;
  }
  return null;
}

/**
 * Jaccard similarity tra due titoli di articoli.
 * Usa normalizzazione semantica (strip sottotitolo, noise words, stop words, stem).
 * Geo-aware: titoli che targetizzano stati/città US diversi non sono mai duplicati.
 * Ritorna valore 0–1. Usato per dedup titoli.
 */
function jaccardSimilarity(a, b) {
  // Geo-aware: articoli su stati/città US diversi non sono duplicati
  const geoA = findGeoToken(a);
  const geoB = findGeoToken(b);
  if (geoA && geoB && geoA !== geoB) return 0;

  const setA = normalizeTitleTokens(a);
  const setB = normalizeTitleTokens(b);
  if (setA.size === 0 || setB.size === 0) return 0;
  const intersection = [...setA].filter(w => setB.has(w)).length;
  const union = new Set([...setA, ...setB]).size;
  return union === 0 ? 0 : intersection / union;
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
function checkKeywordCannibalization(keyword, existingSlugs, existingTitles, existingSrcFingerprints = []) {
  const kw = keyword.toLowerCase();

  // Level 1: predicted slug collision (free, no API)
  const predictedSlug = kw.replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  if (existingSlugs.has(predictedSlug)) {
    return { skip: true, reason: `predicted slug already exists: ${predictedSlug}` };
  }

  // Level 2: keyword Jaccard vs existing titles (threshold 0.62 — near-exact duplicates only)
  const kwDup = existingTitles.find(t => jaccardSimilarity(kw, t) >= 0.62);
  if (kwDup) {
    return { skip: true, reason: `keyword too similar to existing title: "${kwDup}"` };
  }

  // Level 2.25: topic fingerprint of keyword vs fingerprints of existing TITLES.
  // Catches cases where keyword and existing title address the same topic with different phrasing.
  // E.g. "term vs whole life insurance for seniors" → same topic as "whole life insurance: true costs".
  // Uses lower threshold (0.52) than Level 2.5 to catch title-level overlaps pre-generation.
  // Only fires if existingTitles is populated (avoids false positives on brand-new sites).
  if (existingTitles.length >= 3) {
    const kwFpT = topicFingerprint(kw);
    if (kwFpT.length > 0) {
      const kwTokT = new Set(kwFpT.split(' ').filter(Boolean));
      for (const title of existingTitles) {
        const tFp = topicFingerprint(title);
        if (!tFp) continue;
        const tTok = new Set(tFp.split(' ').filter(Boolean));
        if (tTok.size < 2) continue;
        const inter = [...kwTokT].filter(t => tTok.has(t)).length;
        const union = new Set([...kwTokT, ...tTok]).size;
        if (union === 0) continue;
        if (inter / union >= 0.52) {
          return { skip: true, reason: `title fingerprint overlap: "${title.slice(0, 60)}"` };
        }
      }
    }
  }

  // Level 2.5: topic fingerprint check against source keywords of published articles.
  // Confronta la keyword stripped (senza stop words, con sinonimi) contro le keyword sorgente
  // degli articoli già pubblicati. Cattura duplicati semantici che Jaccard non rileva.
  // Es: "hvac repair cost calculator" fp=[calcul,fix,hvac] ⊆ [calcul,fix,hvac] di articolo esistente.
  if (existingSrcFingerprints.length > 0) {
    const kwFp = topicFingerprint(kw);
    if (kwFp.length > 0) {
      const kwTokens = new Set(kwFp.split(' ').filter(Boolean));
      for (const exFp of existingSrcFingerprints) {
        if (!exFp) continue;
        const exTokens = new Set(exFp.split(' ').filter(Boolean));
        if (exTokens.size === 0 || kwTokens.size === 0) continue;
        // Jaccard sui fingerprint (più semantico del Jaccard sul testo grezzo)
        const intersection = [...kwTokens].filter(t => exTokens.has(t)).length;
        const union = new Set([...kwTokens, ...exTokens]).size;
        const fpJaccard = intersection / union;
        if (fpJaccard >= 0.70) {
          return { skip: true, reason: `topic fingerprint overlap (${(fpJaccard * 100).toFixed(0)}%) with published keyword: "${exFp}"` };
        }
        // Subset check: se i token della keyword nuova sono tutti contenuti in quelli esistenti
        // (la nuova è una specializzazione della già pubblicata) → skip
        if (kwTokens.size >= 2 && [...kwTokens].every(t => exTokens.has(t))) {
          return { skip: true, reason: `keyword fingerprint subset of published: "${exFp}"` };
        }
      }
    }
  }

  // Level 3: geo-variant cap — max 8 geo-variants of same core topic
  // (insurance/home-improvement need state-by-state coverage: 50 states, cap must be generous)
  const kwCore = stripGeoFromKeyword(kw);
  if (kwCore !== kw) {
    const geoVariantCount = existingTitles.filter(t => {
      const tCore = stripGeoFromKeyword(t);
      if (tCore === t) return false; // not a geo variant, skip
      return jaccardSimilarity(kwCore, tCore) >= 0.60;
    }).length;
    if (geoVariantCount >= 8) {
      return { skip: true, reason: `geo-variant cap (${geoVariantCount} variants already exist for core: "${kwCore}")` };
    }
  }

  return { skip: false };
}

run().catch(err => {
  console.error('Content engine error:', err);
  process.exit(1);
});
