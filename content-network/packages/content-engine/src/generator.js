/**
 * Article generator — chiama Claude API e genera articolo completo
 */
import Anthropic from '@anthropic-ai/sdk';
import { buildArticlePrompt, AUTHOR_PERSONAS, ADDITIONAL_AUTHORS } from './prompts.js';
import { buildArticleHTML } from './html-builder.js';
import { fetchArticleImage } from './image-fetcher.js';
import { fetchLiveData, formatLiveDataBlock } from './data-fetcher.js';
import { sanitizeCitations } from './citation-sources.js';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ── Author / style / model rotation ──────────────────────────────────────────

/**
 * Deterministic variant index 0|1|2 based on cluster_slug (or keyword id).
 * Cluster-coherent: all articles in the same cluster get the same author + style.
 */
function computeVariant(keyword) {
  const key = keyword.cluster_slug || String(keyword.id);
  const hash = [...key].reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return hash % 3;
}

/**
 * Returns the author object for this niche + variant.
 * Variant 0  → primary author (AUTHOR_PERSONAS[slug])
 * Variant 1/2 → ADDITIONAL_AUTHORS[slug][0/1] if defined, else primary
 */
function selectAuthor(nicheSlug, variantIdx) {
  const primary = AUTHOR_PERSONAS[nicheSlug] || AUTHOR_PERSONAS['home-improvement-costs'];
  if (variantIdx === 0) return primary;
  const extras = ADDITIONAL_AUTHORS[nicheSlug];
  if (extras && extras[variantIdx - 1]) return extras[variantIdx - 1];
  return primary; // fallback for niches without ADDITIONAL_AUTHORS defined
}

/**
 * Selects the generation model.
 * Sonnet: pillar articles, high-volume keywords (>=1500), all YMYL niches
 * Haiku: everything else (geo-variants, low-volume satellites)
 */
function selectModel(keyword, nichePersona) {
  const isYmyl    = nichePersona?.ymyl === true;
  const isPillar  = keyword.is_pillar === true;
  const highVol   = (keyword.search_volume || 0) >= 1500;
  if (isYmyl || isPillar || highVol) return 'claude-sonnet-4-6';
  return 'claude-haiku-4-5-20251001';
}

// Rate limiter semplice: max 50 req/min (well under API limits)
let lastCall = 0;
const MIN_INTERVAL = 1200; // ms

async function throttle() {
  const now = Date.now();
  const wait = MIN_INTERVAL - (now - lastCall);
  if (wait > 0) await new Promise(r => setTimeout(r, wait));
  lastCall = Date.now();
}

export async function generateArticle(keyword, niche, site, retries = 3, sitePublicDir = null, existingArticles = []) {
  // Fetch live data for this niche (cached 24h, fails silently if no API key)
  const liveDataPoints = await fetchLiveData(niche.slug);
  const liveDataBlock = formatLiveDataBlock(liveDataPoints);
  if (liveDataPoints.length) {
    console.log(`  [data] Injecting ${liveDataPoints.length} live data points for ${niche.slug}`);
  }

  const nichePersona = AUTHOR_PERSONAS[niche.slug] || AUTHOR_PERSONAS['home-improvement-costs'];
  const variantIdx   = computeVariant(keyword);
  const author       = selectAuthor(niche.slug, variantIdx);
  const model        = selectModel(keyword, nichePersona);
  const prompt       = buildArticlePrompt(keyword, niche, {
    liveDataBlock,
    styleVariant: variantIdx,
    authorPersona: variantIdx > 0 ? author.promptPersona : null,
  });

  console.log(`  [variant] author=${author.name} style=${variantIdx} model=${model.includes('sonnet') ? 'sonnet' : 'haiku'}`);

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await throttle();

      const message = await client.messages.create({
        model,
        max_tokens: 8192,
        messages: [{ role: 'user', content: prompt }]
      });

      const rawContent = message.content[0].text;

      // Parse JSON response
      let articleData;
      try {
        const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error('No JSON found in response');
        let jsonStr = jsonMatch[0];
        try {
          articleData = JSON.parse(jsonStr);
        } catch (parseErr) {
          console.warn(`  JSON parse failed (attempt ${attempt}):`, parseErr.message);
          const repaired = repairTruncatedJSON(jsonStr);
          try {
            articleData = JSON.parse(repaired);
            console.warn(`  JSON repaired OK`);
          } catch {
            if (attempt === retries) throw parseErr;
            continue;
          }
        }
      } catch (parseErr) {
        console.warn(`  JSON parse failed (attempt ${attempt}):`, parseErr.message);
        if (attempt === retries) throw parseErr;
        continue;
      }

      // Sanifica citation URLs: rimpiazza URL inventati con URL verificati dalla whitelist
      if (articleData.citations) {
        articleData.citations = sanitizeCitations(articleData.citations);
      }

      // Valida campi obbligatori
      const required = ['title', 'metaDescription', 'intro', 'sections', 'faq', 'conclusion'];
      const missing = required.filter(f => !articleData[f]);
      if (missing.length) {
        console.warn(`  Missing fields: ${missing.join(', ')} (attempt ${attempt})`);
        if (attempt === retries) throw new Error(`Missing required fields: ${missing.join(', ')}`);
        continue;
      }

      // Valida che il titolo non sia troncato
      if (/\.\.\.$/.test(articleData.title) || articleData.title.length < 15) {
        console.warn(`  Truncated/invalid title: "${articleData.title}" (attempt ${attempt})`);
        if (attempt === retries) throw new Error(`Truncated title: ${articleData.title}`);
        continue;
      }

      // Valida che il titolo non contenga anni vecchi (es. 2024 nel 2026)
      const CY = new Date().getFullYear();
      const titleYearMatch = articleData.title.match(/\b(20\d{2})\b/);
      if (titleYearMatch && parseInt(titleYearMatch[1]) < CY) {
        console.warn(`  Stale year in title: "${articleData.title}" (attempt ${attempt})`);
        if (attempt === retries) {
          // Fallback: fix year in title rather than failing completely
          articleData.title = articleData.title.replace(/\b(20\d{2})\b/g, String(CY));
          console.warn(`  Fixed stale year in title → "${articleData.title}"`);
        } else {
          continue;
        }
      }

      // Fix stale year in metaDescription (no retry needed — just fix in place)
      if (articleData.metaDescription) {
        articleData.metaDescription = articleData.metaDescription.replace(/\b(20\d{2})\b/g, y => parseInt(y) < CY ? String(CY) : y);
      }

      // Post-generation review pass — second Claude call on lightweight metadata only
      await reviewAndFixArticle(articleData, keyword, CY);

      // Build HTML
      const slug = slugify(keyword);
      const { html, schemas, metaDescription, wordCount } = buildArticleHTML(articleData, {
        author,
        siteName: site.domain.replace(/\..+$/, '').replace(/-/g, ' '),
        siteUrl: `https://${site.domain}`,
        slug,
        keyword,
        relatedArticles: existingArticles,
        toolSlug: site.toolSlug || ''
      });

      // Fetch image from Pexels if a public directory is provided
      let image = null;
      if (sitePublicDir) {
        image = await fetchArticleImage(keyword, slug, sitePublicDir, {
          nicheSlug: niche.slug,
          title: articleData.title || '',
        });
      }

      return {
        slug,
        title: articleData.title,
        metaDescription: metaDescription.slice(0, 160),
        content: html,
        wordCount,
        schemaMarkup: schemas,
        tags: articleData.tags || [],
        image,
        category: articleData.category || niche.name,
        author: author.name,
        excerpt: articleData.intro?.slice(0, 160) || metaDescription,
        date: new Date().toISOString()
      };

    } catch (err) {
      console.warn(`  Generation attempt ${attempt} failed:`, err.message);
      if (attempt === retries) throw err;
      await new Promise(r => setTimeout(r, 2000 * attempt));
    }
  }
}

/**
 * Post-generation review pass: sends lightweight metadata to Claude Haiku for a second check.
 * Only reviews title, metaDescription, H2s, FAQ questions — NOT the full body (saves tokens).
 * Fixes issues in-place on articleData. Fails silently if API call fails.
 * Cost: ~$0.0007/article.
 */
async function reviewAndFixArticle(articleData, keyword, CY) {
  const metadata = {
    title: articleData.title,
    metaDescription: articleData.metaDescription,
    h2s: (articleData.sections || []).map(s => s.h2),
    faqQuestions: (articleData.faq || []).map(f => f.question),
  };

  const reviewPrompt = `You are a quality reviewer for SEO articles. Inspect this metadata and fix any issues.

KEYWORD: "${keyword}"
CURRENT YEAR: ${CY}

METADATA:
${JSON.stringify(metadata, null, 2)}

RULES TO ENFORCE:
1. Any year < ${CY} in any field → replace with ${CY}
2. Title must not end with "..." and must be 40-70 chars; if broken, rewrite it from the keyword
3. No non-US market references (Netherlands, UK prices, Canada, Australia) unless the keyword explicitly targets that country
4. All fields must be topically consistent with the keyword

Return ONLY valid JSON, no markdown:
{
  "pass": true,
  "fixes": {
    "title": null,
    "metaDescription": null,
    "h2s": null,
    "faqQuestions": null
  }
}
Set "pass": false and fill in corrected values when issues are found. Use null for fields that need no change.`;

  try {
    await throttle();
    const msg = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      messages: [{ role: 'user', content: reviewPrompt }],
    });
    const jsonMatch = msg.content[0].text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return;
    const review = JSON.parse(jsonMatch[0]);

    if (!review.pass && review.fixes) {
      const f = review.fixes;
      if (f.title)          { articleData.title = f.title; console.warn(`  [review] title fixed → "${f.title}"`); }
      if (f.metaDescription)  articleData.metaDescription = f.metaDescription;
      if (Array.isArray(f.h2s))
        f.h2s.forEach((h, i) => { if (h && articleData.sections?.[i]) articleData.sections[i].h2 = h; });
      if (Array.isArray(f.faqQuestions))
        f.faqQuestions.forEach((q, i) => { if (q && articleData.faq?.[i]) articleData.faq[i].question = q; });
      console.log(`  [review] ⚠ Issues fixed`);
    } else {
      console.log(`  [review] ✓ Passed`);
    }
  } catch (err) {
    console.warn(`  [review] Skipped (${err.message})`);
  }
}

function repairTruncatedJSON(str) {
  // Remove trailing incomplete comma
  str = str.replace(/,\s*$/, '');
  // Close any open string that was truncated
  const quoteCount = (str.match(/(?<!\\)"/g) || []).length;
  if (quoteCount % 2 !== 0) str += '"';
  // Count and close open brackets/braces
  let braces = 0, brackets = 0, inString = false, i = 0;
  while (i < str.length) {
    const ch = str[i];
    if (ch === '\\' && inString) { i += 2; continue; }
    if (ch === '"') { inString = !inString; i++; continue; }
    if (!inString) {
      if (ch === '{') braces++;
      else if (ch === '}') braces--;
      else if (ch === '[') brackets++;
      else if (ch === ']') brackets--;
    }
    i++;
  }
  while (brackets > 0) { str += ']'; brackets--; }
  while (braces > 0) { str += '}'; braces--; }
  return str;
}

function slugify(str) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
}
