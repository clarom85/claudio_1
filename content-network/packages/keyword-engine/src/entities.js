/**
 * Entity Lists — espansione semantica per nicchia
 * Ogni nicchia ha entità proprie (razze, diete, software, ecc.)
 * che moltiplicano i seed senza API calls.
 */

const ENTITY_LISTS = {
  'pet-care-by-breed': [
    // Dog breeds
    'golden retriever', 'labrador retriever', 'french bulldog', 'german shepherd',
    'poodle', 'bulldog', 'beagle', 'rottweiler', 'yorkshire terrier', 'dachshund',
    'siberian husky', 'great dane', 'doberman', 'shih tzu', 'boxer', 'chihuahua',
    'border collie', 'australian shepherd', 'cocker spaniel', 'maltese',
    // Cat breeds
    'persian cat', 'maine coon', 'siamese cat', 'ragdoll cat', 'bengal cat',
    'british shorthair', 'abyssinian', 'scottish fold', 'sphynx cat', 'russian blue',
    // Other pets
    'guinea pig', 'hamster', 'rabbit', 'parrot', 'leopard gecko', 'bearded dragon',
  ],

  'diet-specific-recipes': [
    'keto', 'paleo', 'vegan', 'vegetarian', 'gluten-free', 'dairy-free',
    'whole30', 'mediterranean', 'low-carb', 'high-protein', 'anti-inflammatory',
    'carnivore diet', 'intermittent fasting', 'low-fodmap', 'raw food',
    'sugar-free', 'nut-free', 'soy-free', 'egg-free', 'plant-based',
  ],

  'software-error-fixes': [
    'Windows 11', 'Windows 10', 'macOS', 'Ubuntu', 'Chrome', 'Firefox', 'Edge',
    'Microsoft Excel', 'Microsoft Word', 'Outlook', 'Teams', 'OneDrive',
    'Zoom', 'Slack', 'VS Code', 'Python', 'Node.js', 'Java', 'Android', 'iPhone',
    'Adobe Photoshop', 'Adobe Acrobat', 'QuickBooks', 'WordPress', 'MySQL',
  ],

  'small-town-tourism': [
    'Vermont', 'Maine', 'New Hampshire', 'Appalachian', 'Blue Ridge Mountains',
    'Ozarks', 'Smoky Mountains', 'Pacific Northwest', 'Hill Country Texas',
    'Finger Lakes', 'Catskills', 'Cape Cod', 'Door County', 'Napa Valley',
    'Sedona', 'Asheville', 'Savannah', 'Galena', 'Stowe', 'Bar Harbor',
  ],

  'home-improvement-costs': [
    'kitchen', 'bathroom', 'basement', 'attic', 'garage', 'deck', 'patio',
    'roof', 'flooring', 'windows', 'doors', 'siding', 'driveway', 'fence',
    'HVAC', 'plumbing', 'electrical', 'insulation', 'painting', 'landscaping',
  ],

  'real-estate-investing': [
    'single family home', 'multi-family', 'duplex', 'triplex', 'apartment complex',
    'commercial real estate', 'REITs', 'house flipping', 'rental property',
    'Airbnb', 'short-term rental', 'fix and flip', 'buy and hold',
    'real estate syndication', 'foreclosure', 'wholesale real estate',
  ],

  'personal-finance': [
    'emergency fund', 'index funds', 'ETFs', 'Roth IRA', '401k', 'HSA',
    'high-yield savings', 'dividend stocks', 'treasury bonds', 'CD rates',
    'debt snowball', 'debt avalanche', 'FIRE movement', 'side hustle',
    'passive income', 'budgeting', 'net worth',
  ],

  'insurance-guide': [
    'term life insurance', 'whole life insurance', 'universal life',
    'health insurance', 'auto insurance', 'homeowners insurance', 'renters insurance',
    'disability insurance', 'long-term care', 'umbrella policy',
    'Medicare supplement', 'dental insurance', 'pet insurance', 'flood insurance',
  ],

  'legal-advice': [
    'estate planning', 'will and testament', 'living trust', 'power of attorney',
    'DUI', 'personal injury', 'workers compensation', 'wrongful termination',
    'divorce', 'child custody', 'bankruptcy', 'LLC formation', 'small claims court',
    'landlord tenant', 'immigration', 'social security disability',
  ],

  'health-symptoms': [
    'anxiety', 'depression', 'diabetes', 'high blood pressure', 'arthritis',
    'thyroid', 'ADHD', 'IBS', 'acid reflux', 'migraine', 'chronic fatigue',
    'fibromyalgia', 'sleep apnea', 'vitamin D deficiency', 'anemia',
    'eczema', 'psoriasis', 'PCOS', 'menopause', 'gout',
  ],

  'credit-cards-banking': [
    'cash back credit card', 'travel rewards card', 'balance transfer',
    'secured credit card', 'business credit card', 'student credit card',
    'no annual fee', 'Chase Sapphire', 'Amex Platinum', 'Capital One Venture',
    'high-yield savings', 'online banking', 'credit union',
  ],

  'weight-loss-fitness': [
    'HIIT', 'strength training', 'cardio', 'yoga', 'pilates', 'CrossFit',
    'running', 'cycling', 'swimming', 'intermittent fasting', 'calorie deficit',
    'macro tracking', 'meal prep', 'protein powder', 'creatine', 'pre-workout',
  ],

  'automotive-guide': [
    'Toyota Camry', 'Honda Accord', 'Ford F-150', 'Chevrolet Silverado',
    'Tesla Model 3', 'Honda CR-V', 'Toyota RAV4', 'BMW 3 Series',
    'oil change', 'brake replacement', 'tire rotation', 'transmission',
    'catalytic converter', 'alternator', 'car insurance', 'extended warranty',
  ],

  'online-education': [
    'Coursera', 'Udemy', 'edX', 'Khan Academy', 'LinkedIn Learning',
    'Google certificates', 'AWS certification', 'PMP certification',
    'bootcamp', 'online MBA', 'community college online', 'self-paced',
    'Python course', 'data science', 'web development', 'digital marketing',
  ],

  'cybersecurity-privacy': [
    'VPN', 'password manager', 'two-factor authentication', 'antivirus',
    'firewall', 'phishing', 'ransomware', 'data breach', 'dark web',
    'NordVPN', 'ExpressVPN', 'Bitwarden', '1Password', 'LastPass',
    'identity theft', 'endpoint security', 'zero trust',
  ],

  'mental-health-wellness': [
    'anxiety disorder', 'panic attacks', 'depression treatment', 'therapy',
    'CBT', 'mindfulness', 'meditation', 'PTSD', 'OCD', 'eating disorder',
    'BetterHelp', 'Talkspace', 'online therapy', 'psychiatrist vs therapist',
    'antidepressants', 'burnout', 'seasonal affective disorder',
  ],

  'home-security-systems': [
    'Ring', 'ADT', 'SimpliSafe', 'Vivint', 'Nest', 'Arlo', 'Wyze',
    'smart doorbell', 'security camera', 'motion sensor', 'alarm system',
    'smart lock', 'video doorbell', 'home automation', 'Z-Wave', 'Zigbee',
  ],

  'solar-energy': [
    'solar panels', 'solar battery', 'Tesla Powerwall', 'net metering',
    'solar tax credit', 'ITC', 'monocrystalline', 'polycrystalline',
    'SunPower', 'LG Solar', 'Enphase', 'SolarEdge', 'off-grid solar',
    'rooftop solar', 'community solar', 'solar lease vs buy',
  ],

  'senior-care-medicare': [
    'Medicare Part A', 'Medicare Part B', 'Medicare Advantage', 'Medigap',
    'assisted living', 'memory care', 'nursing home', 'home health aide',
    'AARP', 'Social Security', 'long-term care insurance',
    'dementia care', "Alzheimer's", 'senior living communities',
  ],

  'business-startup': [
    'LLC', 'S-Corp', 'C-Corp', 'sole proprietorship', 'EIN',
    'business plan', 'pitch deck', 'venture capital', 'angel investor',
    'SBA loan', 'crowdfunding', 'Shopify', 'dropshipping', 'Amazon FBA',
    'franchise', 'business license', 'trademark', 'business credit',
  ],
};

/**
 * Espande i seed con le entità specifiche della nicchia.
 * Combina ogni seed con ogni entità → varianti long-tail mirate.
 * @param {string[]} seeds
 * @param {string} nicheSlug
 * @returns {string[]}
 */
export function expandWithEntities(seeds, nicheSlug) {
  const entities = ENTITY_LISTS[nicheSlug];
  if (!entities?.length) return [];

  const results = new Set();

  for (const seed of seeds) {
    for (const entity of entities) {
      // "[entity] [seed]" e "[seed] for [entity]"
      results.add(`${entity} ${seed}`);
      results.add(`${seed} for ${entity}`);
    }
  }

  // Anche le entità da sole come seed di base (senza combinazione)
  entities.forEach(e => results.add(e));

  return [...results];
}
