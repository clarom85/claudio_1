/**
 * Image fetcher — scarica immagine da Pexels API per ogni articolo
 * Richiede: PEXELS_API_KEY in .env
 * Salva: /images/{slug}.jpg nella directory pubblica del sito
 *
 * Unicità: traccia gli ID foto già usati in images/.pexels-used.json
 * → ogni sito non ripete mai la stessa foto Pexels, anche tra run separati.
 */

import { mkdirSync, existsSync, readFileSync, writeFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { spawnSync } from 'child_process';
import { createHash } from 'crypto';

const PEXELS_API = 'https://api.pexels.com/v1/search';
const PEXELS_KEY = process.env.PEXELS_API_KEY;
const USED_IDS_FILE = '.pexels-used.json';
const POLLINATIONS_BASE = 'https://image.pollinations.ai/prompt';
const POLLINATIONS_TIMEOUT_MS = 35000;

// ─── Pollinations prompt builder ──────────────────────────────────────────────
// Pattern → detailed photorealistic prompt for Pollinations/Flux.
// More descriptive than Pexels queries: full sentences, lighting, composition.

const POLLINATIONS_TOPICS = {
  'home-improvement-costs': [
    { re: /hvac|air.?condition|furnace|heating|cooling|heat.?pump/i,
      p: 'a professional HVAC technician in work uniform installing a modern outdoor central air conditioning unit beside a suburban American home, tools laid out on lawn, bright sunny day' },
    { re: /roof|shingle|gutter|flashing/i,
      p: 'a professional roofer wearing a safety harness carefully replacing dark asphalt shingles on a residential home roof, blue sky background, American suburb, ladder visible' },
    { re: /kitchen/i,
      p: 'a beautifully renovated modern American kitchen with white quartz countertops, subway tile backsplash, stainless steel appliances, open shelving, warm natural light through large window' },
    { re: /bathroom|shower|tub|toilet/i,
      p: 'a newly renovated master bathroom featuring a walk-in shower with glass door, modern floating vanity, white porcelain tiles, brushed nickel fixtures, soft warm lighting' },
    { re: /hardwood|laminate|vinyl.?floor|flooring/i,
      p: 'a professional flooring installer laying solid hardwood planks in a bright suburban living room, tools and spare boards nearby, natural light from windows' },
    { re: /tile|ceramic|grout/i,
      p: 'a tile installer carefully laying ceramic floor tiles in a home renovation project, tile spacers visible, professional tools on site, clean well-lit workspace' },
    { re: /carpet/i,
      p: 'a professional carpet installer stretching and fitting plush carpet in a bright living room, knee kicker tool visible, fresh clean installation' },
    { re: /deck|patio|pergola/i,
      p: 'a newly built composite wood deck in a suburban backyard, outdoor furniture arranged on it, green lawn, sunny afternoon, American neighborhood' },
    { re: /window/i,
      p: 'a window installation professional fitting a new energy-efficient double-pane window in a suburban home exterior, caulk gun and tools nearby, bright daylight' },
    { re: /door|entry/i,
      p: 'a contractor installing a new solid wood front door on a suburban American home, hardware and tools visible, clean professional work setting' },
    { re: /plumb|pipe|water.?heat|drain|sewer/i,
      p: 'a licensed plumber in work clothes fixing copper pipes under a kitchen sink, organized tools on floor, well-lit residential workspace' },
    { re: /electric|wir|panel|outlet/i,
      p: 'a licensed electrician wearing safety glasses working on a residential electrical panel, wiring organized, bright garage setting, professional equipment' },
    { re: /paint|wall/i,
      p: 'a professional house painter rolling fresh white paint on bright interior walls of a modern living room, plastic drop cloth protecting hardwood floors' },
    { re: /landscap|lawn|garden|sod/i,
      p: 'professional landscapers installing fresh sod in a suburban front yard, green lawn being laid, sunny day, American neighborhood street in background' },
    { re: /insulation|attic/i,
      p: 'a home insulation contractor installing fiberglass batt insulation in an attic space, protective gear and mask worn, professional installation equipment' },
    { re: /driveway|concrete|asphalt/i,
      p: 'workers pouring and finishing fresh concrete for a residential driveway, trowels and tools visible, suburban home in background, sunny day' },
    { re: /fence/i,
      p: 'a contractor installing a new cedar wood privacy fence in a suburban backyard, posts being set, professional tools visible, green grass lawn' },
    { re: /basement|foundation/i,
      p: 'a newly renovated basement interior with fresh drywall, recessed lighting, LVP flooring, clean and bright finished living space' },
    { re: /siding|exterior/i,
      p: 'workers installing new vinyl siding on a suburban American home exterior, scaffolding setup, fresh clean installation in progress, sunny day' },
    { re: /stair|step/i,
      p: 'a carpenter installing new hardwood stair treads and white risers on a residential staircase, tools visible, bright interior setting' },
  ],
  'solar-energy': [
    { re: /battery|storage/i,
      p: 'a modern home energy storage battery system mounted on a garage wall beside a solar inverter, clean suburban garage, professional installation' },
    { re: /panel|install/i,
      p: 'solar installation workers mounting monocrystalline solar panels on a residential rooftop, sunny day, suburban neighborhood, safety equipment worn' },
    { re: /inverter/i,
      p: 'a close-up of a modern solar inverter mounted on a home exterior wall, wiring connected, clean professional installation, residential setting' },
    { re: /tax.?credit|incentive|rebate|saving/i,
      p: 'a happy homeowner couple reviewing solar energy savings on a tablet outside their home with solar panels visible on roof, sunny day' },
    { re: /off.?grid/i,
      p: 'an off-grid solar cabin in a rural forest setting with solar panels on roof, batteries visible through window, sustainable living setup' },
  ],
  'home-security-systems': [
    { re: /camera|cctv|surveillance/i,
      p: 'a modern outdoor security camera mounted on the corner of a suburban home exterior, night-vision dome camera, clean installation, residential setting' },
    { re: /alarm|sensor/i,
      p: 'a smart home alarm panel mounted on interior wall near front door, touchscreen interface, motion sensor visible, modern home interior' },
    { re: /door.?bell|ring/i,
      p: 'a smart video doorbell camera installed beside a front door of an American suburban home, illuminated button, clean installation' },
    { re: /smart.?lock/i,
      p: 'a modern smart keypad door lock installed on a home front door, illuminated number pad, sleek contemporary design' },
  ],
  'pet-care-by-breed': [
    { re: /dog|puppy|canine/i,
      p: 'a happy golden retriever dog playing in a sunny suburban backyard, green grass, natural outdoor lighting, joyful and healthy appearance' },
    { re: /cat|kitten|feline/i,
      p: 'a beautiful domestic cat sitting on a sunny windowsill looking outside, warm natural light, clean home interior, relaxed and healthy' },
    { re: /vet|veterinar/i,
      p: 'a friendly veterinarian in white coat gently examining a dog on an exam table in a bright modern veterinary clinic' },
    { re: /groom/i,
      p: 'a professional dog groomer carefully brushing a fluffy golden doodle dog on a grooming table, bright professional grooming salon' },
    { re: /food|diet|nutrition/i,
      p: 'healthy premium dog food in a ceramic bowl beside a water bowl on clean kitchen floor, natural lighting, fresh ingredients visible' },
  ],
  'personal-finance': [
    { re: /invest|stock|portfolio/i,
      p: 'a professional investor reviewing financial charts and investment portfolio on dual monitors at a clean modern desk, natural office lighting' },
    { re: /budget|save|saving/i,
      p: 'a person organizing finances with a budget spreadsheet on laptop, coins and bills on desk, calculator nearby, bright home office' },
    { re: /debt|loan|credit/i,
      p: 'a person carefully reviewing financial documents and loan papers at a kitchen table, organized paperwork, focused expression, natural lighting' },
    { re: /retire|401k|pension/i,
      p: 'a happy senior couple reviewing retirement savings documents on a tablet on their front porch, relaxed and financially secure expressions' },
    { re: /tax/i,
      p: 'organized tax documents, a calculator, and a laptop with tax software on a clean home office desk, professional and orderly' },
  ],
  'insurance-guide': [
    { re: /health/i,
      p: 'a doctor and patient reviewing health insurance documents in a bright modern medical office, stethoscope on desk, professional setting' },
    { re: /car|auto|vehicle/i,
      p: 'a car insurance agent and driver reviewing auto policy documents beside a vehicle in a parking lot, sunny day, professional interaction' },
    { re: /home|house/i,
      p: 'a home insurance agent reviewing policy documents with a homeowner outside their suburban home, professional and friendly interaction' },
    { re: /life/i,
      p: 'a financial advisor discussing life insurance with a young family at a kitchen table, documents and tablet visible, warm home setting' },
  ],
  'real-estate-investing': [
    { re: /rental|rent/i,
      p: 'a real estate investor standing in front of a well-maintained rental property home, clipboard in hand, sunny day, suburban neighborhood' },
    { re: /flip|renovate/i,
      p: 'a renovated house exterior showing dramatic before-and-after transformation, fresh paint, new landscaping, bright sunny day' },
    { re: /commercial/i,
      p: 'a modern commercial real estate building in a downtown district, glass facade, professional signage, business district setting' },
    { re: /mortgage|financ/i,
      p: 'a real estate agent and couple signing mortgage documents at a desk, keys on table, bright modern office, celebration atmosphere' },
  ],
  'health-symptoms': [
    { re: /back.?pain|spine/i,
      p: 'a physical therapist helping a patient with back stretching exercises in a bright modern rehabilitation clinic, professional equipment visible' },
    { re: /headache|migraine/i,
      p: 'a person sitting at a desk holding their temples with eyes closed, soft home lighting, showing mild discomfort, relatable setting' },
    { re: /sleep|insomnia/i,
      p: 'a person lying awake in bed in a dark room, alarm clock showing 3am, moonlight through window, relatable sleep struggle scene' },
    { re: /stress|anxiety/i,
      p: 'a person practicing deep breathing at a park bench, eyes closed, peaceful nature setting, soft natural morning light, calm atmosphere' },
  ],
  'weight-loss-fitness': [
    { re: /gym|workout|exercise/i,
      p: 'a person doing a determined workout in a modern gym, free weights rack in background, bright overhead lighting, athletic wear, focused expression' },
    { re: /run|cardio/i,
      p: 'a runner on a suburban trail path in morning light, athletic gear, motion captured, trees in background, healthy lifestyle' },
    { re: /diet|meal|eat/i,
      p: 'a healthy meal prep spread with colorful vegetables, grilled chicken, brown rice in glass containers, bright kitchen countertop, organized nutrition' },
    { re: /yoga|stretch/i,
      p: 'a person doing a yoga warrior pose on a mat in a bright airy studio, natural light from large windows, peaceful focused expression' },
  ],
  'automotive-guide': [
    { re: /engine|oil|fluid/i,
      p: 'a mechanic in work overalls checking engine oil level in a car engine bay, organized garage workshop, professional tools visible' },
    { re: /tire|wheel|brake/i,
      p: 'an auto technician mounting a tire on a vehicle wheel balancer in a professional auto shop, bright workshop lighting' },
    { re: /buy|sell|used/i,
      p: 'a salesperson and couple examining a used car at a dealership lot, car hood open, inspecting engine, sunny day' },
    { re: /repair|fix/i,
      p: 'a professional mechanic underneath a vehicle on a hydraulic lift in a modern auto repair shop, organized tool cabinet visible' },
  ],
  'cybersecurity-privacy': [
    { re: /hack|breach|attack/i,
      p: 'a cybersecurity professional analyzing threat data on multiple monitors in a dark operations center, code and network diagrams visible' },
    { re: /vpn|privacy/i,
      p: 'a person using a laptop with a VPN shield graphic on screen, home office setting, focused on digital privacy, natural lighting' },
    { re: /password|account/i,
      p: 'a close-up of hands typing a secure password on a laptop keyboard, login screen visible, home office environment, focused security context' },
    { re: /antivirus|malware/i,
      p: 'a laptop screen showing antivirus security software scanning results, green shield indicator, home desk setting, protection concept' },
  ],
  'mental-health-wellness': [
    { re: /therapy|therapist/i,
      p: 'a supportive therapy session with a counselor and patient talking in a warm comfortable office, plants, soft lighting, professional but welcoming' },
    { re: /anxiety|stress/i,
      p: 'a person sitting cross-legged on a grass field with eyes closed, practicing mindfulness breathing, soft golden afternoon light, peaceful nature setting' },
    { re: /depress/i,
      p: 'a person receiving a comforting supportive hand on shoulder from a friend outdoors, warm light, hope and support concept, subtle and tasteful' },
    { re: /meditat|mindful/i,
      p: 'a person meditating in a serene home setting with morning light, seated on a cushion, calm peaceful expression, minimalist interior' },
  ],
  'senior-care-medicare': [
    { re: /medicare|medicaid/i,
      p: 'a senior patient and a friendly doctor reviewing Medicare insurance documents in a bright modern medical office, professional and reassuring atmosphere' },
    { re: /nursing|care.?home|assisted/i,
      p: 'a bright modern assisted living facility common room with comfortable furniture, elderly residents engaged in activities, caring staff visible' },
    { re: /elder|senior|aging/i,
      p: 'a happy active senior couple walking in a sunny park, smiling and healthy, casual clothing, green trees in background, vitality and wellness' },
  ],
  'legal-advice': [
    { re: /lawyer|attorney/i,
      p: 'a professional attorney at a clean desk reviewing legal documents, law books in background, modern law office, confident professional appearance' },
    { re: /lawsuit|court/i,
      p: 'a courthouse exterior with marble columns and steps, American justice architecture, clear blue sky, authoritative and professional' },
    { re: /contract|document/i,
      p: 'two professionals reviewing and signing a legal contract at a conference table, pens and documents organized, bright modern office' },
    { re: /accident|injury/i,
      p: 'a personal injury attorney consulting with a client in a professional office setting, documents on desk, empathetic professional interaction' },
  ],
  'business-startup': [
    { re: /fund|invest|capital/i,
      p: 'entrepreneurs presenting a business pitch to investors in a modern conference room, presentation on screen, engaged audience, professional startup setting' },
    { re: /team|hire|employee/i,
      p: 'a diverse startup team collaborating around a whiteboard in a modern open office, sticky notes and diagrams, creative energetic atmosphere' },
    { re: /market|brand|logo/i,
      p: 'a marketing team reviewing brand strategy documents and design mockups on a conference table, laptops and mood boards visible' },
    { re: /launch|product/i,
      p: 'an entrepreneur excitedly launching a new product, laptop open showing a website going live, modern home office, celebratory moment' },
  ],
};

const POLLINATIONS_FALLBACKS = {
  'home-improvement-costs':    'professional home renovation contractors working on a suburban American home, tools and equipment visible, sunny day',
  'solar-energy':              'solar panels installed on a residential rooftop with a blue sky background, clean energy concept',
  'home-security-systems':     'a modern smart home security system with cameras and alarm panel, suburban home setting',
  'pet-care-by-breed':         'a happy healthy pet dog playing outdoors in a sunny suburban backyard',
  'software-error-fixes':      'a person focused on fixing a computer issue at a clean modern desk setup, multiple monitors',
  'diet-specific-recipes':     'a colorful healthy meal spread with fresh vegetables and nutritious food on a kitchen counter',
  'small-town-tourism':        'a charming main street of a small American town with shops and restaurants, sunny day',
  'personal-finance':          'a person reviewing personal finance documents and budget on a laptop at a clean home office desk',
  'insurance-guide':           'a professional insurance agent reviewing policy documents with clients in a modern office',
  'real-estate-investing':     'a real estate investor reviewing property investment documents beside a suburban rental home',
  'health-symptoms':           'a friendly doctor consulting with a patient in a bright modern medical clinic',
  'credit-cards-banking':      'a person reviewing banking and credit card statements on a laptop at a clean desk',
  'weight-loss-fitness':       'a person exercising outdoors on a trail in athletic gear, healthy active lifestyle',
  'automotive-guide':          'a professional mechanic working on a vehicle in a clean modern auto repair shop',
  'online-education':          'a student learning online on a laptop at a bright home desk, notes and books nearby',
  'cybersecurity-privacy':     'a cybersecurity professional working on multiple monitors in a modern secure operations environment',
  'mental-health-wellness':    'a person in a peaceful mindfulness moment outdoors in nature, calm and serene atmosphere',
  'legal-advice':              'a professional attorney reviewing legal documents at a modern law office desk',
  'business-startup':          'a startup team collaborating in a modern bright co-working office space',
  'senior-care-medicare':      'happy active senior adults enjoying activities outdoors in a sunny community setting',
};

function buildPollinationsPrompt(keyword, title, nicheSlug) {
  const text = `${keyword} ${title || ''}`.toLowerCase();
  const topics = POLLINATIONS_TOPICS[nicheSlug] || [];

  let subject = null;
  for (const { re, p } of topics) {
    if (re.test(text)) { subject = p; break; }
  }
  if (!subject) subject = POLLINATIONS_FALLBACKS[nicheSlug] || `professional ${cleanKeyword(keyword)} scene, realistic setting`;

  return `${subject}, photorealistic editorial photography, sharp focus, high resolution, natural lighting, no text overlays, no watermarks, no logos, no CGI look`;
}

async function fetchFromPollinations(keyword, title, slug, nicheSlug, imagesDir) {
  const prompt = buildPollinationsPrompt(keyword, title, nicheSlug);
  // Use hash of slug as seed → deterministic but unique per article
  const seed = parseInt(createHash('md5').update(slug).digest('hex').slice(0, 8), 16) % 999999;
  const url = `${POLLINATIONS_BASE}/${encodeURIComponent(prompt)}?width=1200&height=630&nologo=true&seed=${seed}&model=flux`;

  console.log(`  [image] Pollinations prompt: "${prompt.slice(0, 80)}..."`);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), POLLINATIONS_TIMEOUT_MS);

  try {
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('image')) throw new Error(`Unexpected content-type: ${contentType}`);

    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 10000) throw new Error('Image too small — likely an error response');

    const destPath = join(imagesDir, `${slug}.jpg`);
    writeFileSync(destPath, buf);
    postProcessImage(destPath);
    console.log(`  [image] Saved /images/${slug}.jpg (Pollinations)`);
    return `/images/${slug}.jpg`;
  } catch (err) {
    clearTimeout(timer);
    console.warn(`  [image] Pollinations failed: ${err.message}`);
    return null;
  }
}

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
 * Computes MD5 hash of a Buffer.
 */
function md5(buf) {
  return createHash('md5').update(buf).digest('hex');
}

/**
 * Scans all article JPEGs in imagesDir and returns a Set of their MD5 hashes.
 * This is the primary dedup mechanism — works even if .pexels-used.json is missing.
 * Excludes author photos, og-default, and placeholder (non-article images).
 */
function loadExistingMd5s(imagesDir) {
  const set = new Set();
  try {
    const SKIP = /^(author-|og-default|placeholder)/;
    const files = readdirSync(imagesDir).filter(f => f.endsWith('.jpg') && !SKIP.test(f));
    for (const f of files) {
      try { set.add(md5(readFileSync(join(imagesDir, f)))); } catch { /* skip unreadable */ }
    }
  } catch { /* dir doesn't exist yet */ }
  return set;
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
  const imagesDir = join(destDir, 'images');
  if (!existsSync(imagesDir)) mkdirSync(imagesDir, { recursive: true });

  // 1. Try Pexels first (primary — reliable stock photos)
  if (PEXELS_KEY) {
    const usedIds = loadUsedIds(imagesDir);
    const existingMd5s = loadExistingMd5s(imagesDir);
    const queries = buildQueries(keyword, title, nicheSlug);

    console.log(`  [image] Pexels queries: ${queries.map((q, i) => `${i + 1}."${q}"`).join(' → ')}`);

    for (const query of queries) {
      try {
        const photo = await searchPexels(query, usedIds);
        if (!photo) continue;

        const imgRes = await fetch(photo.src.large);
        if (!imgRes.ok) continue;

        const imgBuf = Buffer.from(await imgRes.arrayBuffer());
        const imgMd5 = md5(imgBuf);
        if (existingMd5s.has(imgMd5)) {
          console.log(`  [image] MD5 collision for Pexels #${photo.id} — trying next`);
          usedIds.add(photo.id);
          continue;
        }

        const destPath = join(imagesDir, `${slug}.jpg`);
        writeFileSync(destPath, imgBuf);
        existingMd5s.add(imgMd5);
        saveUsedId(imagesDir, photo.id);
        postProcessImage(destPath);

        console.log(`  [image] Saved /images/${slug}.jpg (Pexels #${photo.id}, query: "${query}")`);
        return `/images/${slug}.jpg`;

      } catch (err) {
        console.warn(`  [image] Pexels error for query "${query}": ${err.message}`);
      }
    }
  }

  // 2. Fallback: Pollinations AI-generated image
  const pollinationsResult = await fetchFromPollinations(keyword, title, slug, nicheSlug, imagesDir);
  if (pollinationsResult) return pollinationsResult;

  console.warn(`  [image] No image found for keyword: "${keyword}"`);
  return null;
}
