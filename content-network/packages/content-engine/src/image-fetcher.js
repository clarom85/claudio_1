/**
 * Image fetcher — scarica immagine da Pexels API per ogni articolo
 * Richiede: PEXELS_API_KEY in .env
 * Salva: /images/{slug}.jpg nella directory pubblica del sito
 *
 * Unicità: traccia gli ID foto già usati in images/.pexels-used.json
 * → ogni sito non ripete mai la stessa foto Pexels, anche tra run separati.
 */

import { createWriteStream, mkdirSync, existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { pipeline } from 'stream/promises';
import { spawnSync } from 'child_process';

const PEXELS_API = 'https://api.pexels.com/v1/search';
const PEXELS_KEY = process.env.PEXELS_API_KEY;
const USED_IDS_FILE = '.pexels-used.json';

// ─── Niche-aware visual topic map ────────────────────────────────────────────
// Maps keyword patterns → visually descriptive Pexels queries.
// Each entry: { pattern: RegExp, query: string }
// Ordered from most specific to most generic.
const NICHE_TOPICS = {
  'home-improvement-costs': [
    { re: /hvac|air.?condition|furnace|heating|cooling|heat.?pump/i,   q: 'HVAC technician air conditioning unit outdoor installation' },
    { re: /roof|shingle|gutter|flashing/i,                             q: 'roofer roof repair shingles contractor' },
    { re: /kitchen/i,                                                   q: 'kitchen renovation remodel modern interior countertop' },
    { re: /bathroom|shower|tub|toilet/i,                               q: 'bathroom renovation tiles remodel interior' },
    { re: /hardwood|laminate|vinyl.?floor|flooring/i,                  q: 'hardwood floor installation worker planks' },
    { re: /tile|ceramic|grout/i,                                        q: 'tile installation floor worker ceramic' },
    { re: /carpet/i,                                                    q: 'carpet installation living room flooring' },
    { re: /deck|patio|pergola/i,                                        q: 'wooden deck backyard construction builder' },
    { re: /porch|veranda/i,                                             q: 'front porch house exterior wood' },
    { re: /window/i,                                                    q: 'window installation home replacement worker' },
    { re: /door|entry/i,                                                q: 'front door installation home exterior' },
    { re: /plumb|pipe|water.?heat|drain|sewer/i,                       q: 'plumber pipe repair under sink' },
    { re: /electric|wir|panel|outlet/i,                                q: 'electrician electrical panel wiring home' },
    { re: /paint|wall|interior/i,                                       q: 'house painting interior wall roller' },
    { re: /landscap|lawn|garden|sod/i,                                 q: 'landscaping garden lawn care backyard' },
    { re: /solar|panel/i,                                               q: 'solar panels rooftop installation worker' },
    { re: /insulation|attic/i,                                          q: 'home insulation attic installation worker' },
    { re: /driveway|concrete|asphalt|pavement/i,                       q: 'driveway concrete asphalt residential' },
    { re: /fence/i,                                                     q: 'wood fence installation backyard' },
    { re: /basement|foundation/i,                                       q: 'basement renovation interior concrete foundation' },
    { re: /stair|step/i,                                                q: 'staircase wood home interior renovation' },
    { re: /siding|exterior/i,                                           q: 'house siding exterior renovation contractor' },
  ],
  'solar-energy': [
    { re: /battery|storage/i,     q: 'solar battery energy storage home' },
    { re: /panel|install/i,       q: 'solar panels rooftop installation worker' },
    { re: /inverter/i,            q: 'solar inverter electrical equipment' },
    { re: /tax.?credit|incentive|rebate/i, q: 'solar energy home savings electricity bill' },
    { re: /off.?grid/i,           q: 'off grid solar cabin rural energy' },
  ],
  'home-security-systems': [
    { re: /camera|cctv|surveillance/i, q: 'security camera outdoor home surveillance' },
    { re: /alarm|sensor/i,             q: 'home alarm system door sensor security' },
    { re: /door.?bell|ring/i,          q: 'smart doorbell camera front door' },
    { re: /smart.?lock/i,              q: 'smart lock keypad door home security' },
  ],
  'pet-care-by-breed': [
    { re: /dog|puppy|canine/i,         q: 'dog puppy happy pet outdoor' },
    { re: /cat|kitten|feline/i,        q: 'cat kitten cute pet home' },
    { re: /vet|veterinar/i,            q: 'veterinarian dog cat exam clinic' },
    { re: /groom/i,                    q: 'dog grooming bath professional' },
    { re: /train/i,                    q: 'dog training obedience owner outdoor' },
    { re: /food|diet|nutrition/i,      q: 'pet food dog cat bowl' },
  ],
  'software-error-fixes': [
    { re: /window|pc|computer/i,       q: 'computer screen error fix desk' },
    { re: /mac|apple/i,                q: 'macbook laptop screen desk office' },
    { re: /phone|android|iphone/i,     q: 'smartphone screen close up hand' },
    { re: /network|wifi|internet/i,    q: 'router network cable internet connection' },
    { re: /server|cloud/i,             q: 'server rack data center cloud' },
  ],
  'diet-specific-recipes': [
    { re: /keto|low.?carb/i,           q: 'keto low carb healthy food meat vegetables' },
    { re: /vegan|plant.?based/i,       q: 'vegan plant based healthy food vegetables bowl' },
    { re: /gluten.?free/i,             q: 'gluten free healthy baking food kitchen' },
    { re: /mediterranean/i,            q: 'mediterranean food healthy fresh salad olive oil' },
    { re: /intermittent.?fast/i,       q: 'healthy meal prep containers food' },
    { re: /recipe|cook|meal/i,         q: 'cooking kitchen healthy food preparation' },
  ],
  'small-town-tourism': [
    { re: /hotel|inn|lodge|stay/i,     q: 'cozy small town inn hotel exterior' },
    { re: /restaur|eat|dine|food/i,    q: 'small town restaurant diner street' },
    { re: /hike|trail|outdoor/i,       q: 'hiking trail nature landscape outdoor' },
    { re: /historic|museum|heritage/i, q: 'historic town main street architecture' },
    { re: /festival|event/i,           q: 'small town festival street outdoor event' },
  ],
  'personal-finance': [
    { re: /invest|stock|portfolio/i,   q: 'investment financial chart stock market' },
    { re: /budget|save|saving/i,       q: 'budget savings money jar coins' },
    { re: /debt|loan|credit/i,         q: 'debt loan credit card financial stress' },
    { re: /retire|401k|pension/i,      q: 'retirement planning savings senior couple' },
    { re: /tax/i,                      q: 'tax filing form finance document desk' },
  ],
  'insurance-guide': [
    { re: /health/i,                   q: 'health insurance medical stethoscope document' },
    { re: /car|auto|vehicle/i,         q: 'car insurance vehicle accident road' },
    { re: /home|house/i,               q: 'home insurance house protect family' },
    { re: /life/i,                     q: 'life insurance family protection senior' },
  ],
  'real-estate-investing': [
    { re: /rental|rent/i,              q: 'rental property house real estate investment' },
    { re: /flip|renovate/i,            q: 'house flip renovation before after' },
    { re: /commercial/i,               q: 'commercial building real estate downtown' },
    { re: /mortgage|financ/i,          q: 'mortgage loan real estate document signing' },
  ],
  'health-symptoms': [
    { re: /back.?pain|spine/i,         q: 'back pain physical therapy person stretching' },
    { re: /headache|migraine/i,        q: 'headache migraine person head pain' },
    { re: /sleep|insomnia/i,           q: 'sleep insomnia person bed tired' },
    { re: /stress|anxiety/i,           q: 'stress anxiety mental health person calm' },
    { re: /diet|weight|nutrition/i,    q: 'healthy diet nutrition vegetables meal' },
  ],
  'weight-loss-fitness': [
    { re: /gym|workout|exercise/i,     q: 'gym workout exercise fitness training' },
    { re: /run|cardio/i,               q: 'running cardio outdoor fitness person' },
    { re: /diet|meal|eat/i,            q: 'healthy meal prep diet nutrition fitness' },
    { re: /yoga|stretch/i,             q: 'yoga stretching flexibility fitness mat' },
  ],
  'automotive-guide': [
    { re: /engine|oil|fluid/i,         q: 'car engine mechanic oil change garage' },
    { re: /tire|wheel|brake/i,         q: 'car tire wheel brake mechanic shop' },
    { re: /buy|sell|used/i,            q: 'car dealership buying selling used vehicle' },
    { re: /repair|fix/i,               q: 'car repair mechanic garage auto shop' },
  ],
  'cybersecurity-privacy': [
    { re: /hack|breach|attack/i,       q: 'cybersecurity hacker computer security breach' },
    { re: /vpn|privacy/i,              q: 'VPN privacy internet security laptop' },
    { re: /password|account/i,         q: 'password security login account digital' },
    { re: /antivirus|malware/i,        q: 'antivirus software computer security protection' },
  ],
  'mental-health-wellness': [
    { re: /therapy|therapist/i,        q: 'therapy session counselor mental health office' },
    { re: /anxiety|stress/i,           q: 'anxiety stress mental health person calm nature' },
    { re: /depress/i,                  q: 'depression mental health support person' },
    { re: /meditat|mindful/i,          q: 'meditation mindfulness peaceful person nature' },
  ],
  'senior-care-medicare': [
    { re: /medicare|medicaid/i,        q: 'senior healthcare medicare elderly doctor' },
    { re: /nursing|care.?home|assisted/i, q: 'nursing home assisted living senior care' },
    { re: /elder|senior|aging/i,       q: 'senior elderly person happy active outdoor' },
  ],
};

// Fallback queries per niche when no topic pattern matches
const NICHE_FALLBACKS = {
  'home-improvement-costs':    'home renovation construction worker tools',
  'solar-energy':              'solar panels rooftop energy home',
  'home-security-systems':     'home security camera system protection',
  'pet-care-by-breed':         'pet dog cat happy healthy',
  'software-error-fixes':      'computer screen laptop technology desk',
  'diet-specific-recipes':     'healthy food cooking kitchen meal',
  'small-town-tourism':        'small town main street travel destination',
  'personal-finance':          'personal finance money planning desk',
  'insurance-guide':           'insurance protection document family',
  'real-estate-investing':     'real estate house investment property',
  'health-symptoms':           'health wellness doctor patient medical',
  'credit-cards-banking':      'credit card banking finance payment',
  'weight-loss-fitness':       'fitness workout healthy lifestyle',
  'automotive-guide':          'car vehicle automotive mechanic',
  'online-education':          'online learning education laptop student',
  'cybersecurity-privacy':     'cybersecurity digital security laptop',
  'mental-health-wellness':    'mental health wellness peaceful nature',
  'legal-advice':              'legal advice lawyer document office',
  'business-startup':          'business startup entrepreneur office team',
  'senior-care-medicare':      'senior elderly care healthy active',
};

// ─── Query builder ────────────────────────────────────────────────────────────

/**
 * Builds an ordered list of Pexels search queries to try (specific → generic).
 * @param {string} keyword    - Raw article keyword
 * @param {string} title      - Article title (may be richer than keyword)
 * @param {string} nicheSlug  - Niche slug for topic mapping
 * @returns {string[]}        - Queries to try in order
 */
function buildQueries(keyword, title, nicheSlug) {
  const queries = [];
  const text = `${keyword} ${title || ''}`.toLowerCase();

  // 1. Try niche-specific topic match on keyword + title
  const nicheTopics = NICHE_TOPICS[nicheSlug] || [];
  for (const { re, q } of nicheTopics) {
    if (re.test(text)) {
      queries.push(q);
      break; // first match wins — most specific
    }
  }

  // 2. Cleaned-up keyword phrase (strip intent words, keep visual subject)
  const cleaned = cleanKeyword(keyword);
  if (cleaned && cleaned !== queries[0]) queries.push(cleaned);

  // 3. Niche-level fallback
  const nicheFallback = NICHE_FALLBACKS[nicheSlug];
  if (nicheFallback) queries.push(nicheFallback);

  // 4. Universal last resort
  queries.push('professional work tools equipment');

  return [...new Set(queries)]; // deduplicate while preserving order
}

/**
 * Strips intent/filler words from a keyword, keeping the visual noun phrase.
 * e.g. "how much does it cost to replace an HVAC system" → "HVAC system replace"
 */
function cleanKeyword(keyword) {
  return keyword
    .replace(/\bhow (much|to|do|does|long|often)\b/gi, '')
    .replace(/\bwhat (is|are|does)\b/gi, '')
    .replace(/\b(the |a |an |my |your )\b/gi, '')
    .replace(/\bcost(s)?\b/gi, '')
    .replace(/\bprice(s)?\b/gi, '')
    .replace(/\bnear me\b/gi, '')
    .replace(/\bin \d{4}\b/gi, '')
    .replace(/\b\d{4,5}\b/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 60);
}

// ─── Pexels fetch helpers ─────────────────────────────────────────────────────

function loadUsedIds(imagesDir) {
  const filePath = join(imagesDir, USED_IDS_FILE);
  if (!existsSync(filePath)) return new Set();
  try {
    return new Set(JSON.parse(readFileSync(filePath, 'utf-8')).ids || []);
  } catch {
    return new Set();
  }
}

function saveUsedId(imagesDir, photoId) {
  const filePath = join(imagesDir, USED_IDS_FILE);
  const usedIds = loadUsedIds(imagesDir);
  usedIds.add(photoId);
  writeFileSync(filePath, JSON.stringify({ ids: [...usedIds] }), 'utf-8');
}

/**
 * Post-processes a downloaded JPEG:
 * 1. Strips EXIF metadata with jpegoptim (if available)
 * 2. Generates a WebP version with cwebp (if available) — nginx serves it to browsers that support it
 * Both steps fail silently if the tools are not installed (local dev safe).
 */
function postProcessImage(filePath) {
  // Strip EXIF metadata (privacy + minor size saving)
  try {
    spawnSync('jpegoptim', ['--strip-all', '--quiet', filePath], { timeout: 10000 });
  } catch { /* not installed */ }

  // Generate WebP — nginx serves this automatically via content negotiation
  try {
    const webpPath = filePath.replace(/\.jpg$/i, '.webp');
    spawnSync('cwebp', ['-q', '82', '-quiet', filePath, '-o', webpPath], { timeout: 15000 });
  } catch { /* not installed */ }
}

async function searchPexels(query, usedIds, pages = 2) {
  for (let page = 1; page <= pages; page++) {
    const res = await fetch(
      `${PEXELS_API}?query=${encodeURIComponent(query)}&per_page=15&page=${page}&orientation=landscape`,
      { headers: { Authorization: PEXELS_KEY } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.photos?.length) break;
    const photo = data.photos.find(p => !usedIds.has(p.id));
    if (photo) return photo;
  }
  return null;
}

// ─── Main export ──────────────────────────────────────────────────────────────

/**
 * Cerca e scarica un'immagine pertinente e unica da Pexels.
 * @param {string} keyword   - Keyword dell'articolo
 * @param {string} slug      - Slug dell'articolo (nome file)
 * @param {string} destDir   - Directory pubblica del sito (es. /var/www/miosito.com)
 * @param {object} opts      - { nicheSlug, title }
 * @returns {string|null}    - Path relativo HTML (es. /images/slug.jpg) o null
 */
export async function fetchArticleImage(keyword, slug, destDir, { nicheSlug = '', title = '' } = {}) {
  if (!PEXELS_KEY) {
    console.warn('  [image] PEXELS_API_KEY not set, skipping');
    return null;
  }

  const imagesDir = join(destDir, 'images');
  if (!existsSync(imagesDir)) mkdirSync(imagesDir, { recursive: true });

  const usedIds = loadUsedIds(imagesDir);
  const queries = buildQueries(keyword, title, nicheSlug);

  console.log(`  [image] Queries: ${queries.map((q, i) => `${i + 1}."${q}"`).join(' → ')}`);

  for (const query of queries) {
    try {
      const photo = await searchPexels(query, usedIds);
      if (!photo) continue;

      const destPath = join(imagesDir, `${slug}.jpg`);
      const imgRes = await fetch(photo.src.large);
      if (!imgRes.ok) continue;

      await pipeline(imgRes.body, createWriteStream(destPath));
      saveUsedId(imagesDir, photo.id);

      // Strip EXIF + generate WebP variant for content negotiation
      postProcessImage(destPath);

      console.log(`  [image] Saved /images/${slug}.jpg (Pexels #${photo.id}, query: "${query}")`);
      return `/images/${slug}.jpg`;

    } catch (err) {
      console.warn(`  [image] Error for query "${query}": ${err.message}`);
    }
  }

  console.warn(`  [image] No image found for keyword: "${keyword}"`);
  return null;
}
