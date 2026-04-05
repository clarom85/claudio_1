/**
 * author-utils.js — shared author detection logic
 * Used by: rerender-articles.js, regenerate-homepage.js, scheduler/src/index.js
 */
import { AUTHOR_PERSONAS, ADDITIONAL_AUTHORS } from './prompts.js';

/**
 * Detects the actual author from the baked-in content HTML.
 * Falls back to primary AUTHOR_PERSONAS if not detectable.
 */
export function detectArticleAuthor(content, nicheSlug) {
  const primary = AUTHOR_PERSONAS[nicheSlug] || AUTHOR_PERSONAS['home-improvement-costs'];
  if (!content) return primary;
  const extras = ADDITIONAL_AUTHORS[nicheSlug] || [];
  // Try avatar image URL (new-format articles: /images/author-{slug}.jpg)
  const match = content.match(/author-([a-z][a-z0-9-]+)\.jpg/);
  if (match) {
    const avatarSlug = match[1];
    if (primary.avatar === avatarSlug) return primary;
    const found = extras.find(a => a.avatar === avatarSlug);
    if (found) return found;
  }
  // Fallback: detect by author name in content (old articles with pravatar.cc URLs)
  for (const extra of extras) {
    if (content.includes(extra.name)) return extra;
  }
  return primary;
}
