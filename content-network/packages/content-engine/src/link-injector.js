/**
 * Internal link injector — second pass dopo la generazione di tutti gli articoli.
 * Per ogni articolo, cerca nel testo i titoli/keyword degli altri articoli
 * e aggiunge un link interno la prima volta che la frase appare.
 *
 * Regole base:
 * - Max 3–6 link interni per articolo (scala con word count)
 * - Non linkare l'articolo a se stesso
 * - Solo la prima occorrenza di ogni frase viene linkata
 * - Non modifica testo dentro tag HTML esistenti o heading h1-h4
 *
 * Advanced features:
 * - Inbound cap: MAX_INBOUND — un articolo non può ricevere più di N link in entrata
 * - Anchor reuse cap: MAX_ANCHOR_REUSE — stessa frase non usata più di N volte su tutto il sito
 * - Glossary auto-linking: injectGlossaryLinks() — linka termini del glossario a /glossary/[slug]/
 * - Skip headings: nessun link iniettato dentro h1-h4
 *
 * Bidirectional cluster linking (injectPillarSatelliteLinks):
 * - Satellite → Pillar: ogni satellite linka al suo pillar (topical hub signal)
 * - Pillar → Satellites: ogni pillar linka ai suoi satellite (distribuisce PageRank)
 * - Corre PRIMA del random pass per garantire copertura strutturale del cluster
 */

const MAX_PILLAR_OUTBOUND = 5;
const MAX_INBOUND         = 8;  // max inbound links per article across entire site
const MAX_ANCHOR_REUSE    = 3;  // max times same anchor text phrase used site-wide
const MAX_GLOSSARY_LINKS  = 3;  // max glossary term links per article

/**
 * @param {Array<{slug: string, title: string, content: string, wordCount?: number, tags?: string[]}>} articles
 * @returns {Array} — stessi articoli con `.content` aggiornato
 */
export function injectInternalLinks(articles) {
  if (!articles?.length) return articles;

  // Count inbound links per slug
  const inboundCount = new Map(articles.map(a => [a.slug, 0]));
  // Track anchor text reuse across entire site
  const anchorUsage = new Map();

  // Costruisci indice: per ogni articolo, i suoi anchor text candidati
  const linkTargets = articles.map(a => ({
    slug: a.slug,
    phrases: buildPhrases(a.title, a.tags)
  }));

  const updated = [];

  for (const article of articles) {
    let content = article.content;
    let linksAdded = 0;
    const usedSlugs = new Set();

    // Max links scales with article length: 1 per ~300 words, min 3, max 6
    const wordCount = article.wordCount || estimateWordCount(content);
    const maxLinks = Math.min(6, Math.max(3, Math.floor(wordCount / 300)));

    // Prioritise orphan targets (0 inbound links) — they need links most
    const shuffled = [...linkTargets].sort((a, b) => {
      const aInbound = inboundCount.get(a.slug) || 0;
      const bInbound = inboundCount.get(b.slug) || 0;
      const aOrphan = aInbound === 0 ? -1 : 1;
      const bOrphan = bInbound === 0 ? -1 : 1;
      if (aOrphan !== bOrphan) return aOrphan - bOrphan;
      return Math.random() - 0.5; // random within same priority tier
    });

    for (const target of shuffled) {
      if (linksAdded >= maxLinks) break;
      if (target.slug === article.slug) continue;        // no self-link
      if (usedSlugs.has(target.slug)) continue;
      // Inbound cap: skip targets already heavily linked
      if ((inboundCount.get(target.slug) || 0) >= MAX_INBOUND) continue;

      for (const phrase of target.phrases) {
        if (phrase.length < 12) continue;
        // Anchor reuse cap: avoid over-optimization of same anchor text
        if ((anchorUsage.get(phrase.toLowerCase()) || 0) >= MAX_ANCHOR_REUSE) continue;

        const result = injectLink(content, phrase, target.slug);
        if (result.injected) {
          content = result.content;
          usedSlugs.add(target.slug);
          inboundCount.set(target.slug, (inboundCount.get(target.slug) || 0) + 1);
          anchorUsage.set(phrase.toLowerCase(), (anchorUsage.get(phrase.toLowerCase()) || 0) + 1);
          linksAdded++;
          break; // una frase per target
        }
      }
    }

    updated.push({ ...article, content });
  }

  return updated;
}

/**
 * Inject links from article body text to glossary term pages (/glossary/[slug]/).
 * - Max MAX_GLOSSARY_LINKS links per article
 * - Longest terms matched first (avoids partial matches)
 * - Skips headings and existing anchors (idempotent)
 * - Distinct dotted underline style to visually differentiate from article-to-article links
 *
 * @param {Array<{slug: string, content: string}>} articles
 * @param {Array<{term: string, slug: string}>} glossaryTerms — from GLOSSARY_TERMS[nicheSlug]
 * @returns {Array} updated articles
 */
export function injectGlossaryLinks(articles, glossaryTerms) {
  if (!glossaryTerms?.length || !articles?.length) return articles;

  // Sort longest-first: match "laminate flooring" before "flooring"
  const sortedTerms = [...glossaryTerms].sort((a, b) => b.term.length - a.term.length);

  return articles.map(article => {
    let content = article.content;
    let linksAdded = 0;

    // Count already-existing glossary links toward cap (idempotency)
    for (const gterm of sortedTerms) {
      if (content.includes(`/glossary/${gterm.slug}/`)) linksAdded++;
    }
    if (linksAdded >= MAX_GLOSSARY_LINKS) return article;

    for (const gterm of sortedTerms) {
      if (linksAdded >= MAX_GLOSSARY_LINKS) break;
      if (content.includes(`/glossary/${gterm.slug}/`)) continue; // already linked

      const result = injectGlossaryLink(content, gterm.term, gterm.slug);
      if (result.injected) {
        content = result.content;
        linksAdded++;
      }
    }

    return { ...article, content };
  });
}

function estimateWordCount(html) {
  return (html || '').replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
}

/**
 * Costruisce le frasi anchor candidate da titolo e tags.
 * Ordinate dalla più lunga alla più corta (match più precisi prima).
 */
function buildPhrases(title, tags = []) {
  const phrases = new Set();
  phrases.add(title);

  const words = title.split(/\s+/);

  if (words.length > 4) {
    phrases.add(words.slice(1).join(' '));
    phrases.add(words.slice(0, -1).join(' '));
  }

  const stripped = title
    .replace(/\b(average|typical|cost(s)?|price(s)?|how much|what does|guide to|complete guide|in \w+|near me|\d{4})\b/gi, '')
    .replace(/\s+/g, ' ').trim();
  if (stripped.length >= 15 && stripped !== title) {
    phrases.add(stripped);
  }

  for (const tag of (tags || [])) {
    if (tag.length >= 12) phrases.add(tag);
  }

  return [...phrases]
    .filter(p => p.length >= 12)
    .sort((a, b) => b.length - a.length);
}

/**
 * Inietta un link interno nella prima occorrenza di `phrase` in `content`.
 * Skips: inside existing <a> tags, inside h1-h4 headings, inside HTML attributes.
 * Idempotente.
 */
function injectLink(content, phrase, slug) {
  const parts = content.split(/(<[^>]+>)/);
  let injected = false;
  let insideAnchor = false;
  let insideHeading = false;

  const result = parts.map(part => {
    if (injected) return part;

    if (part.startsWith('<')) {
      if (/^<a[\s>]/i.test(part))    insideAnchor = true;
      if (/^<\/a>/i.test(part))      insideAnchor = false;
      if (/^<h[1-4][\s>]/i.test(part)) insideHeading = true;
      if (/^<\/h[1-4]>/i.test(part))   insideHeading = false;
      return part;
    }

    if (insideAnchor || insideHeading) return part;

    const regex = new RegExp(`(${escapeRegex(phrase)})`, 'i');
    if (regex.test(part)) {
      injected = true;
      return part.replace(regex, `<a href="/${slug}/" style="color:inherit;text-decoration:underline;text-underline-offset:2px;">$1</a>`);
    }
    return part;
  });

  return { content: result.join(''), injected };
}

/**
 * Like injectLink but generates a glossary-specific link with dotted underline.
 */
function injectGlossaryLink(content, term, slug) {
  const parts = content.split(/(<[^>]+>)/);
  let injected = false;
  let insideAnchor = false;
  let insideHeading = false;

  const result = parts.map(part => {
    if (injected) return part;

    if (part.startsWith('<')) {
      if (/^<a[\s>]/i.test(part))    insideAnchor = true;
      if (/^<\/a>/i.test(part))      insideAnchor = false;
      if (/^<h[1-4][\s>]/i.test(part)) insideHeading = true;
      if (/^<\/h[1-4]>/i.test(part))   insideHeading = false;
      return part;
    }

    if (insideAnchor || insideHeading) return part;

    const regex = new RegExp(`(${escapeRegex(term)})`, 'i');
    if (regex.test(part)) {
      injected = true;
      return part.replace(regex, `<a href="/glossary/${slug}/" class="glossary-link" style="color:inherit;text-decoration:underline;text-underline-offset:2px;text-decoration-style:dotted;" title="${term} — see definition">$1</a>`);
    }
    return part;
  });

  return { content: result.join(''), injected };
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Bidirectional pillar-satellite cluster linking.
 *
 * Each article must have: { slug, title, content, cluster_slug, is_pillar }
 *
 * For each cluster:
 *  - Every satellite injects a link to the pillar (if not already present)
 *  - The pillar injects links to up to MAX_PILLAR_OUTBOUND satellites (if not present)
 *
 * Returns the updated articles array (same structure).
 */
export function injectPillarSatelliteLinks(articles) {
  if (!articles?.length) return articles;

  const clusters = new Map(); // cluster_slug → { pillar, satellites[] }
  for (const art of articles) {
    if (!art.cluster_slug) continue;
    if (!clusters.has(art.cluster_slug)) {
      clusters.set(art.cluster_slug, { pillar: null, satellites: [] });
    }
    const c = clusters.get(art.cluster_slug);
    if (art.is_pillar) {
      c.pillar = art;
    } else {
      c.satellites.push(art);
    }
  }

  const bySlug = new Map(articles.map(a => [a.slug, { ...a }]));

  for (const [, cluster] of clusters) {
    const { pillar, satellites } = cluster;
    if (!pillar || satellites.length === 0) continue;

    const pillarPhrases = buildPhrases(pillar.title);

    // 1. Satellite → Pillar
    for (const sat of satellites) {
      const current = bySlug.get(sat.slug);
      if (!current) continue;
      if (current.content.includes(`/${pillar.slug}/`)) continue;

      for (const phrase of pillarPhrases) {
        if (phrase.length < 10) continue;
        const result = injectLink(current.content, phrase, pillar.slug);
        if (result.injected) {
          bySlug.set(sat.slug, { ...current, content: result.content });
          break;
        }
      }
    }

    // 2. Pillar → Satellites (up to MAX_PILLAR_OUTBOUND)
    let pillarLinksAdded = 0;
    const pillarCurrent = bySlug.get(pillar.slug);
    if (!pillarCurrent) continue;

    const shuffledSats = [...satellites].sort(() => Math.random() - 0.5);
    let updatedPillarContent = pillarCurrent.content;

    for (const sat of shuffledSats) {
      if (pillarLinksAdded >= MAX_PILLAR_OUTBOUND) break;
      if (updatedPillarContent.includes(`/${sat.slug}/`)) continue;

      const satPhrases = buildPhrases(sat.title);
      for (const phrase of satPhrases) {
        if (phrase.length < 10) continue;
        const result = injectLink(updatedPillarContent, phrase, sat.slug);
        if (result.injected) {
          updatedPillarContent = result.content;
          pillarLinksAdded++;
          break;
        }
      }
    }

    if (updatedPillarContent !== pillarCurrent.content) {
      bySlug.set(pillar.slug, { ...pillarCurrent, content: updatedPillarContent });
    }
  }

  return articles.map(a => bySlug.get(a.slug) || a);
}
