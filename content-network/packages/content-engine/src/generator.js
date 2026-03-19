/**
 * Article generator — chiama Claude API e genera articolo completo
 */
import Anthropic from '@anthropic-ai/sdk';
import { buildArticlePrompt } from './prompts.js';
import { buildArticleHTML } from './html-builder.js';
import { AUTHOR_PERSONAS } from './prompts.js';

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

export async function generateArticle(keyword, niche, site, retries = 3) {
  const prompt = buildArticlePrompt(keyword, niche);
  const author = AUTHOR_PERSONAS[niche.slug] || AUTHOR_PERSONAS['home-improvement-costs'];

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await throttle();

      const message = await client.messages.create({
        model: 'claude-haiku-4-5-20251001', // Haiku: veloce + economico per bulk content
        max_tokens: 4096,
        messages: [{ role: 'user', content: prompt }]
      });

      const rawContent = message.content[0].text;

      // Parse JSON response
      let articleData;
      try {
        // Estrai JSON anche se c'è testo prima/dopo
        const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error('No JSON found in response');
        articleData = JSON.parse(jsonMatch[0]);
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
        keyword
      });

      return {
        slug,
        title: articleData.title,
        metaDescription,
        content: html,
        wordCount,
        schemaMarkup: schemas,
        tags: articleData.tags || []
      };

    } catch (err) {
      console.warn(`  Generation attempt ${attempt} failed:`, err.message);
      if (attempt === retries) throw err;
      await new Promise(r => setTimeout(r, 2000 * attempt));
    }
  }
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
