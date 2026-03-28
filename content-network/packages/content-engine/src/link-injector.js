/**
 * Internal link injector — second pass dopo la generazione di tutti gli articoli.
 * Per ogni articolo, cerca nel testo i titoli/keyword degli altri articoli
 * e aggiunge un link interno la prima volta che la frase appare.
 *
 * Regole:
 * - Max 3 link interni per articolo
 * - Non linkare l'articolo a se stesso
 * - Solo la prima occorrenza di ogni frase viene linkata
 * - Non modifica testo dentro tag HTML esistenti
 *
 * Bidirectional cluster linking (injectPillarSatelliteLinks):
 * - Satellite → Pillar: ogni satellite linka al suo pillar (topical hub signal)
 * - Pillar → Satellites: ogni pillar linka ai suoi satellite (distribute PageRank)
 * - Corre PRIMA del random pass per garantire copertura strutturale del cluster
 */

/**
 * @param {Array<{slug: string, title: string, content: string, wordCount?: number, tags?: string[]}>} articles
 * @returns {Array} — stessi articoli con `.content` aggiornato
 */
export function injectInternalLinks(articles) {
  if (!articles?.length) return articles;

  // Count inbound links per slug so we can prioritise orphans
  const inboundCount = new Map(articles.map(a => [a.slug, 0]));

  // Costruisci indice: per ogni articolo, i suoi anchor text candidati
  const linkTargets = articles.map(a => ({
    slug: a.slug,
    phrases: buildPhrases(a.title, a.tags)
  }));

  const updated = articles.map(article => {
    let content = article.content;
    let linksAdded = 0;
    const usedSlugs = new Set();

    // Max links scales with article length: 1 per ~300 words, min 3, max 6
    const wordCount = article.wordCount || estimateWordCount(content);
    const maxLinks = Math.min(6, Math.max(3, Math.floor(wordCount / 300)));

    // Prioritise orphan targets (0 inbound links) — they need links most
    const shuffled = [...linkTargets].sort((a, b) => {
      const aOrphan = (inboundCount.get(a.slug) || 0) === 0 ? -1 : 1;
      const bOrphan = (inboundCount.get(b.slug) || 0) === 0 ? -1 : 1;
      if (aOrphan !== bOrphan) return aOrphan - bOrphan;
      return Math.random() - 0.5; // random within same priority tier
    });

    for (const target of shuffled) {
      if (linksAdded >= maxLinks) break;
      if (target.slug === article.slug) continue; // no self-link
      if (usedSlugs.has(target.slug)) continue;

      for (const phrase of target.phrases) {
        if (phrase.length < 15) continue; // frasi troppo corte → falsi positivi

        // Cerca la frase nel testo visibile (non dentro attributi HTML)
        const result = injectLink(content, phrase, target.slug);
        if (result.injected) {
          content = result.content;
          usedSlugs.add(target.slug);
          inboundCount.set(target.slug, (inboundCount.get(target.slug) || 0) + 1);
          linksAdded++;
          break; // una frase per target
        }
      }
    }

    return { ...article, content };
  });

  return updated;
}

function estimateWordCount(html) {
  return (html || '').replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
}

/**
 * Costruisce le frasi anchor candidate da titolo e tags.
 * Ordinate dalla più lunga alla più corta (match più precisi prima).
 * Produce varianti naturali per evitare anchor text identici su ogni link.
 */
function buildPhrases(title, tags = []) {
  const phrases = new Set();
  phrases.add(title);

  const words = title.split(/\s+/);

  // Sottostringhe del titolo (skip prima parola, skip ultima parola)
  if (words.length > 4) {
    phrases.add(words.slice(1).join(' '));
    phrases.add(words.slice(0, -1).join(' '));
  }

  // Rimuovi le parole di costo/tipo comuni per ottenere il core topic
  // es. "Average Cost to Install Laminate Flooring" → "laminate flooring installation"
  const stripped = title
    .replace(/\b(average|typical|cost(s)?|price(s)?|how much|what does|guide to|complete guide|in \w+|near me|\d{4})\b/gi, '')
    .replace(/\s+/g, ' ').trim();
  if (stripped.length >= 15 && stripped !== title) {
    phrases.add(stripped);
  }

  // Tags come anchor text alternativo
  for (const tag of (tags || [])) {
    if (tag.length >= 15) phrases.add(tag);
  }

  return [...phrases]
    .filter(p => p.length >= 12)
    .sort((a, b) => b.length - a.length);
}

/**
 * Inietta un link interno nella prima occorrenza di `phrase` in `content`,
 * evitando occorrenze già dentro tag HTML o dentro <a> esistenti.
 * Idempotente: eseguire più volte non duplica i link.
 */
function injectLink(content, phrase, slug) {
  const parts = content.split(/(<[^>]+>)/);
  let injected = false;
  let insideAnchor = false;

  const result = parts.map(part => {
    if (injected) return part;

    if (part.startsWith('<')) {
      // Traccia apertura/chiusura tag <a> per non linkare dentro anchor esistenti
      if (/^<a[\s>]/i.test(part))  insideAnchor = true;
      if (/^<\/a>/i.test(part))    insideAnchor = false;
      return part;
    }

    // Testo dentro un <a> esistente → skip (idempotenza)
    if (insideAnchor) return part;

    const regex = new RegExp(`(${escapeRegex(phrase)})`, 'i');
    if (regex.test(part)) {
      injected = true;
      return part.replace(regex, `<a href="/${slug}" style="color:inherit;text-decoration:underline;text-underline-offset:2px;">$1</a>`);
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
const MAX_PILLAR_OUTBOUND = 5;

export function injectPillarSatelliteLinks(articles) {
  if (!articles?.length) return articles;

  // Group by cluster_slug — skip articles with no cluster
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

  // Work on a mutable copy keyed by slug
  const bySlug = new Map(articles.map(a => [a.slug, { ...a }]));

  for (const [, cluster] of clusters) {
    const { pillar, satellites } = cluster;
    if (!pillar || satellites.length === 0) continue;

    const pillarPhrases = buildPhrases(pillar.title);

    // 1. Satellite → Pillar: ensure each satellite links to the pillar
    for (const sat of satellites) {
      const current = bySlug.get(sat.slug);
      if (!current) continue;
      // Skip if a link to the pillar already exists
      if (current.content.includes(`/${pillar.slug}`)) continue;

      for (const phrase of pillarPhrases) {
        if (phrase.length < 10) continue;
        const result = injectLink(current.content, phrase, pillar.slug);
        if (result.injected) {
          bySlug.set(sat.slug, { ...current, content: result.content });
          break;
        }
      }
    }

    // 2. Pillar → Satellites: inject links to satellites (up to MAX_PILLAR_OUTBOUND)
    let pillarLinksAdded = 0;
    const pillarCurrent = bySlug.get(pillar.slug);
    if (!pillarCurrent) continue;

    // Shuffle satellites for variety across weekly runs
    const shuffledSats = [...satellites].sort(() => Math.random() - 0.5);
    let updatedPillarContent = pillarCurrent.content;

    for (const sat of shuffledSats) {
      if (pillarLinksAdded >= MAX_PILLAR_OUTBOUND) break;
      // Skip if already linked
      if (updatedPillarContent.includes(`/${sat.slug}`)) continue;

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

  // Return in original order
  return articles.map(a => bySlug.get(a.slug) || a);
}
