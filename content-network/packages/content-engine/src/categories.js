/**
 * Article category classifier — per-niche taxonomy
 * Classifica ogni articolo in una sub-categoria basandosi su keyword + titolo
 */

const RULES = {
  'home-improvement-costs': [
    { slug: 'hvac', name: 'HVAC & Heating', re: /hvac|furnace|ac\b|air.?condit|heating|cooling|heat.?pump/ },
    { slug: 'bathroom', name: 'Bathroom', re: /bathroom|bath\b/ },
    { slug: 'kitchen', name: 'Kitchen', re: /kitchen/ },
    { slug: 'flooring', name: 'Flooring', re: /floor|lvp|vinyl|carpet|hardwood|laminate|tile/ },
    { slug: 'deck-patio', name: 'Deck & Patio', re: /\bdeck\b|patio|pergola/ },
    { slug: 'roofing', name: 'Roofing', re: /\broof/ },
    { slug: 'windows-doors', name: 'Windows & Doors', re: /\bwindow\b|\bdoor\b/ },
    { slug: 'painting', name: 'Painting', re: /\bpaint/ },
    { slug: 'plumbing', name: 'Plumbing', re: /plumb|pipe|water.heater|drain/ },
    { slug: 'electrical', name: 'Electrical', re: /electric|wiring|panel|outlet/ },
  ],
  'pet-care-by-breed': [
    { slug: 'dogs', name: 'Dogs', re: /\bdog\b|puppy|canine|retriever|labrador|beagle|poodle|shepherd/ },
    { slug: 'cats', name: 'Cats', re: /\bcat\b|kitten|feline|siamese|persian|tabby/ },
    { slug: 'birds', name: 'Birds', re: /\bbird\b|parrot|parakeet|canary|cockatiel/ },
    { slug: 'small-pets', name: 'Small Pets', re: /rabbit|hamster|guinea|ferret|gerbil/ },
    { slug: 'fish', name: 'Fish & Aquarium', re: /\bfish\b|aquarium|goldfish|betta|tropical/ },
  ],
  'software-error-fixes': [
    { slug: 'windows', name: 'Windows', re: /windows|win\s*1[01]/ },
    { slug: 'mac', name: 'Mac & iOS', re: /\bmac\b|macos|ios|iphone|ipad/ },
    { slug: 'browsers', name: 'Web & Browsers', re: /browser|chrome|firefox|safari|edge/ },
    { slug: 'office', name: 'Office & Apps', re: /office|excel|word|outlook|powerpoint/ },
    { slug: 'android', name: 'Android', re: /android|samsung|pixel/ },
    { slug: 'gaming', name: 'Gaming', re: /steam|xbox|playstation|game\b/ },
  ],
  'diet-specific-recipes': [
    { slug: 'keto', name: 'Keto', re: /keto/ },
    { slug: 'vegan', name: 'Vegan', re: /vegan|plant.?based/ },
    { slug: 'gluten-free', name: 'Gluten-Free', re: /gluten/ },
    { slug: 'paleo', name: 'Paleo', re: /paleo/ },
    { slug: 'mediterranean', name: 'Mediterranean', re: /mediterr/ },
    { slug: 'low-carb', name: 'Low Carb', re: /low.?carb|low carb/ },
    { slug: 'intermittent-fasting', name: 'Intermittent Fasting', re: /fasting|if diet/ },
  ],
  'small-town-tourism': [
    { slug: 'weekend-trips', name: 'Weekend Trips', re: /weekend|day.?trip/ },
    { slug: 'hidden-gems', name: 'Hidden Gems', re: /hidden|secret|underrated/ },
    { slug: 'food-drink', name: 'Food & Drink', re: /restaurant|food|brewery|winery|coffee/ },
    { slug: 'outdoor', name: 'Outdoor & Nature', re: /hiking|outdoor|nature|park|trail/ },
    { slug: 'history', name: 'History & Culture', re: /history|museum|cultural|heritage/ },
    { slug: 'accommodation', name: 'Where to Stay', re: /hotel|inn|b&b|airbnb|stay/ },
  ]
};

/**
 * Classifica un articolo → { name, slug }
 */
export function classifyArticle(nicheSlug, keyword = '', title = '') {
  const rules = RULES[nicheSlug] || [];
  const text = (keyword + ' ' + title).toLowerCase();
  for (const rule of rules) {
    if (rule.re.test(text)) return { name: rule.name, slug: rule.slug };
  }
  // Fallback: prima regola della nicchia o nome nicchia
  if (rules.length) return { name: rules[0].name, slug: rules[0].slug };
  const name = nicheSlug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  return { name, slug: nicheSlug };
}

/**
 * Restituisce tutte le categorie di una nicchia (per pre-popolare nav/api)
 */
export function getCategoriesForNiche(nicheSlug) {
  return (RULES[nicheSlug] || []).map(r => ({ name: r.name, slug: r.slug }));
}
