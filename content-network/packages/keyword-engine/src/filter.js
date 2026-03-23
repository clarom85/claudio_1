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

// Keywords con anni obsoleti (es. "best X 2022") vengono scartate.
// Soglia: anni <= anno corrente - 2 (mantieni anno scorso e anno corrente).
const CURRENT_YEAR = new Date().getFullYear();

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

    // Scarta keywords con anni obsoleti (es. "2022", "2023" nel 2026 → skip)
    const yearMatch = normalized.match(/\b(20\d{2})\b/);
    if (yearMatch && parseInt(yearMatch[1]) <= CURRENT_YEAR - 2) continue;

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

/**
 * Similarità Jaccard tra due stringhe di testo.
 * Score 0.0 (nessuna parola in comune) → 1.0 (identici).
 */
function stem(w) { return w.replace(/(?<=\w{3})(ing|tion|ment|ness|ful|less|er|es|s)$/i, ''); }
function jaccardSimilarity(a, b) {
  const setA = new Set(a.split(/\s+/).map(stem));
  const setB = new Set(b.split(/\s+/).map(stem));
  const intersection = [...setA].filter(w => setB.has(w)).length;
  const union = new Set([...setA, ...setB]).size;
  return union === 0 ? 0 : intersection / union;
}

/**
 * Rimuove keywords troppo simili a quelle già nel DB.
 * Jaccard threshold 0.75 = 75% parole in comune → scartata.
 * Previene cannibalizzazione SEO tra articoli quasi identici.
 */
export function deduplicateAcrossSites(keywords, existingKeywords, threshold = 0.65) {
  const existingNorm = existingKeywords.map(k => k.toLowerCase().trim());
  const existingSet = new Set(existingNorm);

  return keywords.filter(k => {
    const kw = k.keyword.toLowerCase().trim();
    if (existingSet.has(kw)) return false;
    for (const ex of existingNorm) {
      if (jaccardSimilarity(kw, ex) >= threshold) return false;
    }
    return true;
  });
}
