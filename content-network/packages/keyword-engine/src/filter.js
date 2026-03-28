/**
 * Filtra e classifica le keyword per qualità SEO
 * - Rimuove duplicati e varianti troppo simili
 * - Classifica intent
 * - Prioritizza long-tail (3-8 parole)
 * - Deduplica cross-sito per evitare cannibalizzazione
 * - Intent dedup: evita articoli su topic identici con phrasing diverso
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

// Intent prefixes to strip before fingerprinting (order: longest first)
const INTENT_PREFIXES = [
  'how much does it cost to', 'how much does a', 'how much do', 'how much is',
  'how much does', 'what is the average cost of', 'what is the cost of',
  'what is the average', 'average cost to', 'average cost of', 'average price of',
  'best way to', 'how to', 'what is a', 'what are the', 'what is',
  'why does', 'why do', 'why is', 'when to', 'when should',
  'which is the best', 'which is better', 'which', 'where to', 'where can',
  'guide to', 'tips for', 'steps to', 'ways to', 'cost to', 'cost of',
  'price of', 'price to',
];

const STOP_WORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
  'of', 'with', 'by', 'from', 'up', 'about', 'into', 'through', 'during',
  'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had',
  'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might',
  'i', 'my', 'your', 'it', 'its', 'this', 'that', 'these', 'those',
  'get', 'use', 'make', 'need', 'want', 'like', 'vs', 'per',
  // Decorative title words: non cambiano il topic di fondo
  'guide', 'overview', 'breakdown', 'explained', 'basics', 'intro',
]);

/**
 * Returns a canonical topic fingerprint for a keyword.
 * Strips intent prefixes + stop words + stems remaining terms → sorted join.
 * Two keywords with the same fingerprint target the same underlying topic.
 */
export function topicFingerprint(keyword) {
  let kw = keyword.toLowerCase().trim();
  // Strip longest-matching intent prefix
  for (const prefix of INTENT_PREFIXES) {
    if (kw.startsWith(prefix + ' ')) {
      kw = kw.slice(prefix.length + 1);
      break;
    }
  }
  const words = kw.split(/\s+/)
    .filter(w => w.length > 2 && !STOP_WORDS.has(w))
    .map(stem);
  return words.sort().join(' ');
}

// Keywords con anni obsoleti (es. "best X 2022") vengono scartate.
// Soglia: anni <= anno corrente - 2 (mantieni anno scorso e anno corrente).
const CURRENT_YEAR = new Date().getFullYear();

// Patterns that indicate off-topic, non-US, or non-real-world keywords
const OFF_TOPIC_PATTERNS = [
  /\bbloxburg\b/i,          // Roblox game
  /\broblox\b/i,            // game
  /\bminecraft\b/i,         // game
  /\bnetherlands\b/i,       // non-US geo
  /\buk prices?\b/i,        // non-US market
  /\bpound sterling\b/i,    // non-USD currency
  /\baustralia(n)?\b/i,     // non-US geo (unless keyword is explicitly AU)
  /\bcanada(ian)?\b/i,      // non-US geo (unless keyword is explicitly CA)
  /[^\x00-\x7F]/,           // non-ASCII / non-English characters
];

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

    // Rimuovi keywords off-topic o non-US
    if (OFF_TOPIC_PATTERNS.some(p => p.test(normalized))) continue;

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
  const sorted = filtered.sort((a, b) => {
    const aScore = a.wordCount >= 4 && a.wordCount <= 7 ? 1 : 0;
    const bScore = b.wordCount >= 4 && b.wordCount <= 7 ? 1 : 0;
    return bScore - aScore;
  });

  // Intent dedup: within the same intent class, keep only one keyword per topic fingerprint.
  // This prevents generating two articles on "cost to repair roof" vs "average roof repair price".
  const seenFingerprints = new Map(); // fingerprint+intent → first keyword seen
  return sorted.filter(item => {
    const fp = topicFingerprint(item.keyword);
    const key = `${item.intent}::${fp}`;
    if (seenFingerprints.has(key)) return false;
    seenFingerprints.set(key, item.keyword);
    return true;
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
 * Jaccard threshold 0.65 = 65% parole in comune → scartata.
 * Topic fingerprint dedup: stessa intent class + stesso fingerprint → scartata.
 * Previene cannibalizzazione SEO tra articoli quasi identici.
 */
export function deduplicateAcrossSites(keywords, existingKeywords, threshold = 0.55) {
  const existingNorm = existingKeywords.map(k => k.toLowerCase().trim());
  const existingSet = new Set(existingNorm);
  // Pre-build fingerprint set for existing keywords keyed by intent::fingerprint
  const existingFingerprints = new Set(
    existingNorm.map(k => `${classifyIntent(k)}::${topicFingerprint(k)}`)
  );

  return keywords.filter(k => {
    const kw = k.keyword.toLowerCase().trim();
    if (existingSet.has(kw)) return false;

    // Intent-based topic dedup against DB
    const fp = `${k.intent || classifyIntent(kw)}::${topicFingerprint(kw)}`;
    if (existingFingerprints.has(fp)) return false;

    // Jaccard similarity check
    for (const ex of existingNorm) {
      if (jaccardSimilarity(kw, ex) >= threshold) return false;
    }
    return true;
  });
}
