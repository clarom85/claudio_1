/**
 * Article generator — chiama Claude API e genera articolo completo
 */
import Anthropic from '@anthropic-ai/sdk';
import { buildArticlePrompt } from './prompts.js';
import { buildArticleHTML } from './html-builder.js';
import { AUTHOR_PERSONAS } from './prompts.js';
import { fetchArticleImage } from './image-fetcher.js';
import { fetchLiveData, formatLiveDataBlock } from './data-fetcher.js';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

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

  const prompt = buildArticlePrompt(keyword, niche, { liveDataBlock });
  const author = AUTHOR_PERSONAS[niche.slug] || AUTHOR_PERSONAS['home-improvement-costs'];

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await throttle();

      const message = await client.messages.create({
        model: 'claude-haiku-4-5-20251001', // Haiku: veloce + economico per bulk content
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

      // Valida campi obbligatori
      const required = ['title', 'metaDescription', 'intro', 'sections', 'faq', 'conclusion'];
      const missing = required.filter(f => !articleData[f]);
      if (missing.length) {
        console.warn(`  Missing fields: ${missing.join(', ')} (attempt ${attempt})`);
        if (attempt === retries) throw new Error(`Missing required fields: ${missing.join(', ')}`);
        continue;
      }

      // Build HTML
      const slug = slugify(keyword);
      const { html, schemas, metaDescription, wordCount } = buildArticleHTML(articleData, {
        author,
        siteName: site.domain.replace(/\..+$/, '').replace(/-/g, ' '),
        siteUrl: `https://${site.domain}`,
        slug,
        keyword,
        relatedArticles: existingArticles
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
