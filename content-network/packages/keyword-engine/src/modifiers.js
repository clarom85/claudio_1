/**
 * Modifier Matrix — espansione long-tail zero-costo
 * Combina seed keywords con pattern di modificatori sistematici.
 * Genera centinaia di varianti long-tail senza chiamate API.
 */

const QUESTION_PREFIXES = [
  'how to', 'how much does', 'how long does', 'how often should',
  'what is', 'what are', 'what does', 'what causes',
  'why is', 'why does', 'why would',
  'when to', 'when should', 'when is',
  'where to', 'which is better',
  'can you', 'should you', 'do you need',
  'is it worth', 'is it safe to',
];

const COST_PREFIXES = [
  'cost of', 'price of', 'average cost of', 'how much is',
  'how much to', 'cost to', 'price to',
];

const INTENT_SUFFIXES = [
  'for beginners', 'for seniors', 'for small homes', 'for apartments',
  'on a budget', 'without professional help', 'step by step',
  'pros and cons', 'checklist', 'guide', 'tips', 'mistakes to avoid',
  'near me', 'at home', 'yourself',
];

const QUALIFIERS = [
  'cheap', 'affordable', 'best', 'professional', 'diy',
  'quick', 'easy', 'complete', 'detailed', 'beginners',
];

const COMPARISON_TEMPLATES = [
  '{seed} vs {alt}',
  '{seed} or {alt}',
  'alternatives to {seed}',
  '{seed} alternative',
  '{seed} instead of {alt}',
];

// Coppie di alternative per nicchia-agnostici
const GENERIC_ALTS = ['professional', 'diy', 'hiring someone', 'doing it yourself', 'contractor'];

function expand(seed) {
  const results = new Set();

  // Question prefix + seed
  for (const prefix of QUESTION_PREFIXES) {
    results.add(`${prefix} ${seed}`);
  }

  // Cost prefix + seed
  for (const prefix of COST_PREFIXES) {
    results.add(`${prefix} ${seed}`);
  }

  // Seed + intent suffix
  for (const suffix of INTENT_SUFFIXES) {
    results.add(`${seed} ${suffix}`);
  }

  // Qualifier + seed
  for (const q of QUALIFIERS) {
    results.add(`${q} ${seed}`);
    results.add(`${seed} ${q}`);
  }

  // Comparison templates
  for (const alt of GENERIC_ALTS) {
    if (!seed.includes(alt)) {
      results.add(`${seed} vs ${alt}`);
      results.add(`${seed} or ${alt}`);
    }
  }

  return [...results];
}

/**
 * Espande tutti i seed con il modifier matrix.
 * @param {string[]} seeds
 * @returns {string[]} keyword raw (non filtrate)
 */
export function expandWithModifiers(seeds) {
  const all = new Set();
  for (const seed of seeds) {
    expand(seed).forEach(k => all.add(k));
  }
  return [...all];
}
