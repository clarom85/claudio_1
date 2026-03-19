/**
 * Filtra e classifica le keyword per qualità SEO
 * - Rimuove duplicati e varianti troppo simili
 * - Classifica intent
 * - Prioritizza long-tail (3-8 parole)
 * - Deduplica cross-sito per evitare cannibalizzazione
 */

const INFORMATIONAL_SIGNALS = [
  'how', 'what', 'why', 'when', 'where', 'which', 'guide', 'tips',
  'explained', 'meaning', 'definition', 'examples', 'ways to', 'steps'
];

const COMMERCIAL_SIGNALS = [
  'best', 'top', 'review', 'vs', 'compare', 'alternative', 'cheap',
  'affordable', 'worth it', 'pros and cons', 'should i buy'
];

const TRANSACTIONAL_SIGNALS = [
  'buy', 'price', 'cost', 'hire', 'near me', 'service', 'quote',
  'estimate', 'how much does', 'average cost'
];

export function classifyIntent(keyword) {
  const kw = keyword.toLowerCase();
  if (TRANSACTIONAL_SIGNALS.some(s => kw.includes(s))) return 'transactional';
  if (COMMERCIAL_SIGNALS.some(s => kw.includes(s))) return 'commercial';
  if (INFORMATIONAL_SIGNALS.some(s => kw.includes(s))) return 'informational';
  return 'informational';
}

export function filterKeywords(keywords) {
  const seen = new Set();
  const filtered = [];

  for (const kw of keywords) {
    const normalized = kw.toLowerCase().trim();

    // Rimuovi troppo corti o troppo lunghi
    const wordCount = normalized.split(/\s+/).length;
    if (wordCount < 3 || wordCount > 10) continue;
    if (normalized.length < 15 || normalized.length > 120) continue;

    // Rimuovi caratteri strani
    if (/[^\w\s'-]/.test(normalized)) continue;

    // Deduplicazione fuzzy semplice (normalizza spazi multipli)
    const key = normalized.replace(/\s+/g, ' ');
    if (seen.has(key)) continue;
    seen.add(key);

    filtered.push({
      keyword: key,
      intent: classifyIntent(key),
      wordCount
    });
  }

  // Sort: preferisci long-tail 4-7 parole
  return filtered.sort((a, b) => {
    const aScore = a.wordCount >= 4 && a.wordCount <= 7 ? 1 : 0;
    const bScore = b.wordCount >= 4 && b.wordCount <= 7 ? 1 : 0;
    return bScore - aScore;
  });
}

export function deduplicateAcrossSites(keywords, existingKeywords) {
  const existing = new Set(existingKeywords.map(k => k.toLowerCase().trim()));
  return keywords.filter(k => !existing.has(k.keyword.toLowerCase().trim()));
}
