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
  // Interrogative / modal (no topic meaning)
  'how', 'much', 'what', 'why', 'when', 'where', 'which', 'who',
  'can', 'not', 'no', 'all', 'any', 'just', 'well',
  // Decorative title words: non cambiano il topic di fondo
  'guide', 'overview', 'breakdown', 'explained', 'basics', 'intro',
  // Quantifier qualifiers: "average X" same topic as "X"
  'average', 'typical', 'usual', 'standard',
  // Generic containers: "hvac system" = "hvac"
  'system', 'type', 'types',
  // Cost/price intent qualifiers: "roof repair cost" same topic as "how much to repair a roof"
  'cost', 'costs', 'price', 'prices', 'pricing', 'rate', 'rates',
  'estimate', 'estimates', 'fee', 'fees', 'charge', 'charges',
  'quote', 'quotes',
]);

// Synonym normalization: varianti lessicali dello stesso concetto → forma canonica
// Applicata PRIMA dello stemming in topicFingerprint
// Aggiungere qui i sinonimi rilevanti per ogni nuova niche
const TOPIC_SYNONYMS = {
  // ── Home improvement ─────────────────────────────────────────
  'remodel':      'renovation',
  'remodeling':   'renovation',
  'remodeled':    'renovation',
  'renovate':     'renovation',
  'renovating':   'renovation',
  'renovated':    'renovation',
  'replace':      'replacement',
  'replacing':    'replacement',
  'install':      'installation',
  'installing':   'installation',
  'installed':    'installation',
  'repair':       'fix',
  'repairing':    'fix',
  'repaired':     'fix',

  // ── Insurance ────────────────────────────────────────────────
  // health/medical → stessa copertura sanitaria
  'medical':      'health',
  // car/auto/vehicle → stessa assicurazione auto
  'auto':         'car',
  'vehicle':      'car',
  'automobile':   'car',
  // home/homeowner/homeowners/house → stessa assicurazione casa
  'homeowner':    'home',
  'homeowners':   'home',
  'house':        'home',
  'property':     'home',
  // renters/renter → stesso prodotto
  'renter':       'renters',
  // life insurance variants
  'term':         'term',   // term vs whole è distinzione reale — NON normalizzare
  // policy/plan/coverage → stessa cosa generica
  'policy':       'plan',
  'coverage':     'plan',
  'policies':     'plan',

  // ── Generic cross-niche ──────────────────────────────────────
  'cheap':        'affordable',
  'cheapest':     'affordable',
  'inexpensive':  'affordable',
  'low-cost':     'affordable',
};

/**
 * Returns a canonical topic fingerprint for a keyword.
 * Strips intent prefixes + stop words + numbers + synonyms + stems → sorted join.
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
    .filter(w => w.length > 2 && !STOP_WORDS.has(w) && !/^\d+$/.test(w)) // strip numbers (anni nel titolo)
    .map(w => stem(TOPIC_SYNONYMS[w] || w)); // normalizza sinonimi prima di stemmare
  return words.sort().join(' ');
}

// Keywords con anni obsoleti (es. "best X 2022") vengono scartate.
// Soglia: anni <= anno corrente - 2 (mantieni anno scorso e anno corrente).
const CURRENT_YEAR = new Date().getFullYear();

// Patterns that indicate off-topic, non-US, or non-real-world keywords
export const OFF_TOPIC_PATTERNS = [
  // Games
  /\bbloxburg\b/i,
  /\broblox\b/i,
  /\bminecraft\b/i,
  /\bfortnite\b/i,
  // Non-US geos (countries)
  /\bnetherlands\b/i,
  /\baustralia(n)?\b/i,
  /\bcolorbond\b/i,
  /\bcanada(ian)?\b/i,
  /\bontario\b/i,
  /\bquebec\b/i,
  /\balberta\b/i,
  /\bbritish columbia\b/i,
  /\bsaskatchewan\b/i,
  /\bmanitoba\b/i,
  /\bgerman(y)?\b/i,
  /\bfrance\b/i,
  /\bfrench\b/i,
  /\bitaly\b/i,
  /\bitalian\b/i,
  /\bjapan(ese)?\b/i,
  /\bindia(n)?\b/i,
  /\bpakistan(i)?\b/i,
  /\bkenya(n)?\b/i,
  /\bnigeria(n)?\b/i,
  /\bchina\b/i,
  /\bchinese\b/i,
  /\bbrazil(ian)?\b/i,
  /\bphilippines?\b/i,
  /\bsouth africa(n)?\b/i,
  // Non-US geos (UK + Europe market signals)
  /\b(uk|united kingdom)\b/i,
  /\bpound sterling\b/i,
  /\bgbp\b/i,
  /\beur(os?)?\b/i,
  /\bbritish\b/i,
  /\bengland\b/i,
  /\bscotland\b/i,
  /\bwales\b/i,
  /\bireland\b/i,
  // Famous non-residential landmarks (not relevant to home improvement)
  /\bempire state building\b/i,
  /\beiffel tower\b/i,
  /\bburj khalifa\b/i,
  /\bcolosseum\b/i,
  /\bwhite house\b/i,
  /\bpentagon\b/i,
  /\bvatican\b/i,
  /\bbig ben\b/i,
  /\bbuckingham palace\b/i,
  /\bobservation deck\b/i,
  // UK-specific materials / terms
  /\bchipboard\b/i,
  /\bscreed\b/i,
  /\bskirting board\b/i,
  /\bdouble glazing\b/i,
  // Metric-only keywords (non-US pricing)
  /per square metre\b/i,
  /per m[²2]\b/i,
  /\bsquare metre(s)?\b/i,
  // Automotive (car body, not home)
  /\bcar roof\b/i,
  /\broof rack\b/i,
  /\bauto body\b/i,
  /\bconvertible top\b/i,
  /\bcar hood\b/i,
  /\bwindshield\b/i,
  // Travel / tourism (not home improvement)
  /\bhotel\b/i,
  /\bflight(s)?\b/i,
  /\bairport\b/i,
  /\btourist\b/i,
  /\bvacation package\b/i,
  /\btheme park\b/i,
  // Car brands (irrelevant to home improvement / insurance niches)
  // Remove these patterns if an automotive niche is ever added
  /\bbmw\b/i,
  /\bmercedes\b/i,
  /\bvolkswagen\b/i,
  /\btoyota\b/i,
  /\bhonda\b/i,
  /\bnissan\b/i,
  /\bhyundai\b/i,
  /\bporsche\b/i,
  /\blexus\b/i,
  /\bsubaru\b/i,
  /\bmazda\b/i,
  /\bkia\b/i,
  /\bjeep\b/i,
  /\bdodge\b/i,
  /\bchevrolet\b/i,
  /\bchevy\b/i,
  // Non-ASCII / non-English characters
  /[^\x00-\x7F]/,
  // German words
  /\bvergleich\b/i,
  /\bkosten\b/i,
  /\bversicherung\b/i,
  /\bversicherungen\b/i,
  /\bkrankenversicherung\b/i,
  /\bpreis\b/i,
  /\banbieter\b/i,
  /\bbillig\b/i,
  /\bkaufen\b/i,
  /\brechner\b/i,
  // French words
  /\bassurance\b/i,
  /\bdevis\b/i,
  /\bmutuelle\b/i,
  /\bcomparatif\b/i,
  /\bmeilleur\b/i,
  /\bprix\b/i,
  /\bpas cher\b/i,
  // Spanish words
  /\bseguro(s)?\b/i,
  /\bprecio(s)?\b/i,
  /\bcomparar\b/i,
  /\bbarato\b/i,
  /\bcobertura\b/i,
  /\bcotizacion\b/i,
  // Single-letter brand pattern (e.g. "k and k insurance")
  /^\w and \w /i,
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
