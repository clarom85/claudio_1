/**
 * Location Expansion — varianti geografiche per nicchie location-sensitive
 * Solo per nicchie dove la location è rilevante (home improvement, legal, tourism...).
 * Top 25 stati US per volume di ricerca.
 */

const US_STATES = [
  'California', 'Texas', 'Florida', 'New York', 'Pennsylvania',
  'Illinois', 'Ohio', 'Georgia', 'North Carolina', 'Michigan',
  'New Jersey', 'Virginia', 'Washington', 'Arizona', 'Massachusetts',
  'Tennessee', 'Indiana', 'Missouri', 'Maryland', 'Wisconsin',
  'Colorado', 'Minnesota', 'South Carolina', 'Alabama', 'Louisiana'
];

// Nicchie dove le location keywords hanno senso e alto volume
const LOCATION_RELEVANT_NICHES = new Set([
  'home-improvement-costs',
  'small-town-tourism',
  'real-estate-investing',
  'legal-advice',
  'insurance-guide',
  'home-security-systems',
  'solar-energy',
  'senior-care-medicare',
  'automotive-guide',
  'business-startup',
]);

// Template più efficaci per keyword locali
const LOCATION_TEMPLATES = [
  (seed, state) => `${seed} in ${state}`,
  (seed, state) => `${seed} ${state}`,
  (seed, state) => `average ${seed} in ${state}`,
  (seed, state) => `${state} ${seed} guide`,
];

/**
 * Espande i seed con varianti geografiche.
 * Solo per nicchie location-relevant, solo top 25 stati.
 * @param {string[]} seeds
 * @param {string} nicheSlug
 * @returns {string[]}
 */
export function expandWithLocations(seeds, nicheSlug) {
  if (!LOCATION_RELEVANT_NICHES.has(nicheSlug)) return [];

  const results = new Set();

  // Usa solo i primi 3 seed per evitare esplosione combinatoria
  for (const seed of seeds.slice(0, 3)) {
    for (const state of US_STATES) {
      for (const tpl of LOCATION_TEMPLATES) {
        results.add(tpl(seed, state));
      }
    }
  }

  return [...results];
}
