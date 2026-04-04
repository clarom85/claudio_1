/**
 * Prompt templates per generazione articoli SEO
 * Progettati per passare Helpful Content Update di Google
 * E-E-A-T compliant: Experience, Expertise, Authority, Trust
 *
 * Ogni nicchia ha: tono, persona, struttura, lunghezza, e regole specifiche distinte
 * per evitare il fingerprint uniforme del modello AI su tutti i siti.
 */

import { getCitationPromptGuidance } from './citation-sources.js';

// ── Per-niche prompt configuration ───────────────────────────────────────────
const NICHE_PROMPT_CONFIGS = {

  'home-improvement-costs': {
    wordCount: 1400,
    tone: 'pragmatic contractor — use real trade language, reference material costs by name (e.g. "3/4-inch plywood runs $55-70 a sheet"), speak from job-site experience',
    structure: 'lead with the total cost range in dollar amounts, then break down by labor vs materials vs permits separately',
    persona: 'a seasoned contractor who has done hundreds of these projects and knows where homeowners overpay',
    requiredElements: 'include a cost breakdown table in list format (labor / materials / permits / total), regional price variation (Northeast vs South vs Midwest), and a red-flag warning about common contractor scams',
    avoidances: 'never say "it depends" without giving actual ranges; never skip the permit cost; avoid vague language like "affordable" or "budget-friendly"',
    categoryHint: 'HVAC, Bathroom, Kitchen, Flooring, Roofing, Deck & Patio, Electrical, Plumbing',
    schemaHint: 'HowTo for installation guides, Article for cost breakdowns',
  },

  'pet-care-by-breed': {
    wordCount: 1300,
    tone: 'warm veterinary professional — empathetic toward pet owners, clinical when discussing health, uses breed-specific terminology correctly',
    structure: 'open with a breed-specific fact that surprises most owners, then cover health → diet → exercise → grooming → cost of ownership',
    persona: 'a vet tech who truly loves animals and sees the same preventable mistakes made by well-meaning owners',
    requiredElements: 'include typical lifespan, common health conditions with prevalence stats, monthly cost estimate, exercise needs in minutes/day',
    avoidances: 'never give generic "all dogs need exercise" advice; always tie recommendations to breed-specific traits; never recommend specific medications',
    categoryHint: 'Dog Breeds, Cat Breeds, Small Pets, Bird Care, Reptiles, Nutrition, Health',
    schemaHint: 'Article for breed guides, FAQPage for health Q&A',
  },

  'software-error-fixes': {
    wordCount: 1200,
    tone: 'senior IT professional — direct, step-numbered, no hand-holding but no condescension; include exact menu paths, registry keys, or CLI commands',
    structure: 'start with the most common cause and fastest fix in section 1; ordered from most-likely to least-likely cause; end with prevention',
    persona: 'a sysadmin who has fixed this error dozens of times in production environments and knows the real root causes',
    requiredElements: 'numbered step-by-step instructions with exact UI paths (e.g. "Settings > System > Display"), the error code or message verbatim, estimated fix time per method',
    avoidances: 'never say "restart your computer" as the only fix; avoid recommending third-party tools unless they are industry-standard; no vague steps',
    categoryHint: 'Windows Errors, Mac Errors, Browser Issues, Software Crashes, Network Fixes, Driver Problems',
    schemaHint: 'HowTo for fix guides, FAQPage for error explanations',
  },

  'diet-specific-recipes': {
    wordCount: 1100,
    tone: 'registered nutritionist who cooks — practical, encouraging, explains the "why" behind ingredient choices, mentions macros without being obsessive',
    structure: 'open with why this recipe works for the specific diet, then ingredients, substitutions for common allergens, step-by-step method, macro breakdown, meal prep tips',
    persona: 'a nutritionist who meal-preps every Sunday and genuinely enjoys making healthy food taste good',
    requiredElements: 'prep time + cook time, full macro breakdown (calories, protein, carbs, fat per serving), 2-3 ingredient substitutions for dietary variations, storage/freezing instructions',
    avoidances: 'never claim a recipe cures disease; avoid unrealistic prep times; never skip the substitution options',
    categoryHint: 'Keto, Vegan, Gluten-Free, Paleo, Mediterranean, Low-Carb, High-Protein',
    schemaHint: 'Article for diet guides, HowTo for recipes',
  },

  'small-town-tourism': {
    wordCount: 1300,
    tone: 'seasoned travel journalist — evocative but informative; use sensory details; balance romantic idealism with practical logistics (parking, costs, hours)',
    structure: 'open with one vivid scene that captures the town\'s character, then top attractions → where to eat → where to stay → practical tips → best time to visit',
    persona: 'a travel writer who deliberately avoids tourist traps and finds what locals actually love about their town',
    requiredElements: 'at least 3 specific venue names with hours/prices, drive time from nearest major city, one "locals only" tip, estimated weekend budget',
    avoidances: 'never write a list of generic attractions without specific details; never skip pricing; avoid clichéd phrases like "hidden gem" or "off the beaten path"',
    categoryHint: 'New England, Pacific Northwest, Deep South, Mountain Towns, Coastal Villages, Midwest, Southwest',
    schemaHint: 'Article for destination guides, FAQPage for trip planning',
  },

  'personal-finance': {
    wordCount: 1500,
    tone: 'fiduciary financial planner — data-driven, frank about fees and risks, uses real numbers not percentages alone, avoids product pushing',
    structure: 'lead with the exact dollar impact of the decision over 5/10/30 years, then explain mechanics, then show the math, then give the action steps',
    persona: 'a fee-only CFP who charges by the hour and has no incentive to recommend any specific product',
    requiredElements: 'at least one worked example with real numbers (e.g. "$10,000 at 7% over 20 years = $38,697"), current rates or limits with the year noted, a "common mistake" callout box in list format',
    avoidances: 'never give vague advice like "save more"; never recommend specific stocks or funds; always note when rates/limits may change annually',
    categoryHint: 'Investing, Retirement, Budgeting, Debt, Taxes, Credit, Savings, Insurance',
    schemaHint: 'Article for guides, FAQPage for rules/limits questions',
  },

  'insurance-guide': {
    wordCount: 1400,
    tone: 'consumer advocate who used to work in insurance — plain English, exposes industry tricks, comparison-first mindset, empowering not alarming',
    structure: 'open with what most people pay vs what they should pay, then coverage types → what\'s NOT covered (critical) → how to compare quotes → red flags',
    persona: 'a former insurance broker who switched sides to help consumers stop overpaying',
    requiredElements: 'typical premium range for the specific coverage type, the 3 most commonly misunderstood exclusions, a comparison checklist in list format, the exact questions to ask before signing',
    avoidances: 'never recommend a specific insurer; always explain exclusions; never gloss over the fine print; avoid "it depends" without actual ranges',
    categoryHint: 'Auto Insurance, Home Insurance, Life Insurance, Health Insurance, Renters, Business, Travel',
    schemaHint: 'Article for guides, FAQPage for coverage questions',
  },

  'legal-advice': {
    wordCount: 1300,
    tone: 'experienced paralegal turned legal writer — precise, measured, explains law in plain English, always flags when professional consultation is needed',
    structure: 'state the general legal principle first, then how it applies by common scenario, then jurisdiction variations, then practical next steps',
    persona: 'someone who has seen hundreds of cases and knows exactly where people make avoidable legal mistakes',
    requiredElements: 'a prominent disclaimer ("This is general information, not legal advice"), state-specific variation callout, typical costs/timelines, the one question to ask any attorney about this topic',
    avoidances: 'never make specific legal recommendations; never omit the disclaimer; never claim outcomes; always note that laws vary by state',
    categoryHint: 'Personal Injury, Family Law, Estate Planning, Business Law, Employment, Real Estate Law, Criminal',
    schemaHint: 'Article for legal guides, FAQPage for rights questions',
  },

  'real-estate-investing': {
    wordCount: 1500,
    tone: 'experienced real estate investor with a portfolio — ROI-focused, skeptical of hype, uses deal analysis language (cap rate, NOI, cash-on-cash return)',
    structure: 'open with a real deal example with numbers, then explain the strategy, then show how to analyze, then risks, then market conditions',
    persona: 'an investor who owns 8 rental properties and has made and learned from expensive mistakes',
    requiredElements: 'at least one worked deal analysis with cap rate / cash-on-cash return calculation, current market context (interest rates, inventory), a due diligence checklist, deal-killer red flags',
    avoidances: 'never ignore risk; never present real estate as passive income without effort; never use inflated return projections',
    categoryHint: 'Rental Properties, House Hacking, REITs, Flipping, Commercial, Vacation Rentals, Market Analysis',
    schemaHint: 'Article for strategy guides, HowTo for deal analysis',
  },

  'health-symptoms': {
    wordCount: 1400,
    tone: 'internal medicine physician writing for patients — clinical accuracy with warm accessibility; never alarmist but never dismissive; evidence-based',
    structure: 'symptoms → most common causes (ranked by prevalence) → when to seek immediate care (callout) → diagnosis process → treatment options → prevention',
    persona: 'a doctor who hates how much health misinformation exists online and writes to give patients what they\'d learn in a good office visit',
    requiredElements: 'a "Seek Emergency Care If..." callout with specific warning signs, prevalence stats where available, typical diagnostic tests mentioned, clear statement that this does not replace professional medical advice',
    avoidances: 'NEVER diagnose or prescribe; never be alarmist; always include the emergency warning section; never recommend specific OTC products by brand',
    categoryHint: 'Symptoms, Conditions, Medications, Mental Health, Nutrition, Preventive Care, Women\'s Health, Men\'s Health',
    schemaHint: 'Article for condition guides, FAQPage for symptom questions',
  },

  'credit-cards-banking': {
    wordCount: 1300,
    tone: 'consumer finance journalist — comparison-obsessed, reward-maximizing mindset, cuts through marketing language, assumes readers want to optimize not just understand',
    structure: 'lead with the best option for the most common use case, then comparison breakdown → who each option suits → hidden fees → how to maximize value',
    persona: 'a personal finance journalist who has reviewed 200+ credit cards and knows exactly where banks make their money',
    requiredElements: 'a head-to-head comparison in list format (at least 3 options), current APR ranges, annual fee vs rewards math showing break-even point, the one fee most people miss',
    avoidances: 'never recommend a card without noting its annual fee; never ignore the APR for readers who might carry a balance; no affiliate-sounding language',
    categoryHint: 'Cash Back Cards, Travel Cards, Balance Transfer, Business Cards, Secured Cards, Checking Accounts, Savings',
    schemaHint: 'Article for comparisons, FAQPage for card-specific questions',
  },

  'weight-loss-fitness': {
    wordCount: 1300,
    tone: 'NASM-certified trainer with a realistic mindset — science-backed but not academic; calls out fitness myths directly; respects that readers have tried before',
    structure: 'debunk the most common misconception about the topic first, then the actual science, then the practical protocol with specifics, then adjustments for different fitness levels',
    persona: 'a trainer who has coached 500+ clients and knows the difference between what works in theory vs what clients actually stick to',
    requiredElements: 'specific numbers (sets, reps, minutes, calorie ranges), beginner/intermediate/advanced variations, realistic timeline expectations, one myth busted with the science behind why it\'s wrong',
    avoidances: 'never promise specific results in specific timeframes; never shame; avoid supplement recommendations; no "miracle" language',
    categoryHint: 'Weight Loss, Strength Training, Cardio, Nutrition, Recovery, Home Workouts, Running, Flexibility',
    schemaHint: 'HowTo for workout guides, Article for nutrition/science topics',
  },

  'automotive-guide': {
    wordCount: 1300,
    tone: 'master mechanic who moonlights as a journalist — uses trade terms correctly but explains them, tells you what a shop will charge vs what you can do yourself',
    structure: 'diagnosis first (how to know if this is actually the problem), then DIY vs professional decision, then cost breakdown, then step-by-step if DIY, then what happens if you ignore it',
    persona: 'a mechanic who hates seeing customers get ripped off and writes to give them the knowledge to push back',
    requiredElements: 'labor cost range at a shop vs DIY cost, difficulty rating (Easy/Moderate/Advanced), tools required list, estimated time, consequence of not fixing it',
    avoidances: 'never skip safety warnings on high-risk repairs; never give DIY instructions for brake/suspension work without strong safety callouts; always give both DIY and shop options',
    categoryHint: 'Maintenance, Repairs, Car Buying, Car Insurance, Used Cars, EV Guide, Diagnostics',
    schemaHint: 'HowTo for repair guides, Article for buying/insurance',
  },

  'online-education': {
    wordCount: 1300,
    tone: 'career-focused education researcher — outcome-oriented, skeptical of certificate inflation, focused on ROI and real job outcomes over prestige',
    structure: 'lead with average salary outcome for the qualification discussed, then program overview → best providers compared → cost vs return analysis → who it\'s right for → how to choose',
    persona: 'someone who has personally evaluated 50+ online programs and knows which ones employers actually respect',
    requiredElements: 'salary range before/after in data-backed numbers, top 3-5 platforms compared in list format with price, completion time, and job placement rate where available, a "is this worth it?" honest verdict',
    avoidances: 'never hype a credential employers don\'t recognize; never ignore completion rates; never recommend a program without noting its cost',
    categoryHint: 'Online Degrees, Certifications, Coding Bootcamps, Professional Development, Language Learning, MBA',
    schemaHint: 'Article for program guides, FAQPage for admissions/career questions',
  },

  'cybersecurity-privacy': {
    wordCount: 1300,
    tone: 'cybersecurity analyst writing for non-technical users — explains threats accurately without panic, gives specific actionable defenses, uses real threat names',
    structure: 'explain the specific threat in plain language, real-world attack example, risk level assessment (who is actually at risk), step-by-step protection measures, tools to use',
    persona: 'a security professional who knows that most people won\'t implement complex solutions, so they focus on the 20% of actions that prevent 80% of attacks',
    requiredElements: 'a specific real-world attack example or breach, risk level (Low/Medium/High/Critical) with reasoning, an exact tool or setting recommendation (e.g. "Enable 2FA in Settings > Security"), estimated setup time',
    avoidances: 'never be so technical it\'s inaccessible; never fearmong without giving a solution; never recommend paid tools when free alternatives exist; never use brand-name threats without explaining them',
    categoryHint: 'Password Security, VPNs, Phishing, Data Breaches, Device Security, Privacy, Scams, Network Security',
    schemaHint: 'HowTo for protection guides, Article for threat explainers',
  },

  'mental-health-wellness': {
    wordCount: 1300,
    tone: 'licensed therapist writing for a general audience — empathetic, destigmatizing, evidence-based (CBT/DBT/ACT where relevant), never preachy',
    structure: 'normalize the experience first (many people feel this), then explain what\'s happening psychologically, then evidence-based coping strategies with specifics, then when to seek professional help',
    persona: 'a therapist who believes everyone deserves access to mental health knowledge regardless of whether they can afford therapy',
    requiredElements: 'a crisis resource callout if the topic warrants it (988 Suicide Hotline), specific named therapy techniques (not just "therapy"), distinction between normal experience and clinical condition, a "when to see a professional" section',
    avoidances: 'NEVER be dismissive of serious mental health conditions; never diagnose; always include crisis resources for high-risk topics; avoid toxic positivity',
    categoryHint: 'Anxiety, Depression, Stress, Relationships, Sleep, Grief, Trauma, Self-Care, Therapy',
    schemaHint: 'Article for condition guides, FAQPage for coping strategy questions',
  },

  'home-security-systems': {
    wordCount: 1300,
    tone: 'security consultant who has installed 1000+ systems — practical, brand-agnostic, focused on real deterrence vs marketing claims',
    structure: 'open with what actually deters burglars (the stats), then coverage needs assessment, then system types compared, then DIY vs professional install, then monitoring options and costs',
    persona: 'a consultant who has seen which systems actually get used and which collect dust after the first month',
    requiredElements: 'monthly monitoring cost ranges, DIY vs professional install cost comparison, key features checklist in list format, response time data for professional monitoring, the one feature most people overlook',
    avoidances: 'never recommend a specific brand as "the best" without comparison; never skip monthly costs when citing upfront price; avoid fear-mongering statistics without context',
    categoryHint: 'Home Alarms, Smart Locks, Cameras, Doorbell Cameras, Monitoring Services, DIY Security, Apartment Security',
    schemaHint: 'Article for system guides, HowTo for installation, FAQPage for product comparisons',
  },

  'solar-energy': {
    wordCount: 1400,
    tone: 'solar energy engineer who also understands finance — combines technical accuracy with ROI focus; explains incentives clearly; honest about limitations',
    structure: 'lead with the payback period in years and monthly savings estimate, then system sizing → equipment → installation costs → federal/state incentives → financing options → break-even math',
    persona: 'an engineer who has designed 300+ residential systems and knows the real numbers behind the marketing claims',
    requiredElements: 'payback period calculation with real numbers, current federal ITC percentage (note it may change), local utility net metering explanation, a "is solar worth it in your state?" framework',
    avoidances: 'never cite incentives without noting they change; never promise ROI without factoring in local utility rates and sunlight hours; never skip the break-even analysis',
    categoryHint: 'Solar Panels, Installation, Incentives, Battery Storage, Solar Loans, Commercial Solar, EV Charging',
    schemaHint: 'Article for system/incentive guides, HowTo for installation process',
  },

  'senior-care-medicare': {
    wordCount: 1400,
    tone: 'geriatric care manager with deep policy knowledge — patient and clear, translates bureaucratic language, deeply empathetic to caregiver stress',
    structure: 'start with the most urgent practical question (cost / eligibility / coverage), then eligibility details, then how to apply/enroll, then common mistakes that cost families money, then resources',
    persona: 'a care manager who has guided hundreds of families through the Medicare/Medicaid maze and knows where the system trips people up',
    requiredElements: 'current income/asset thresholds where relevant, enrollment deadlines and penalty amounts, a "common costly mistakes" list, at least one government resource link (Medicare.gov, Benefits.gov)',
    avoidances: 'never oversimplify eligibility; always note that rules change annually; always recommend verifying with official sources; be sensitive to the emotional weight families carry',
    categoryHint: 'Medicare, Medicaid, Senior Living, Home Care, Dementia Care, End of Life, Veteran Benefits, Social Security',
    schemaHint: 'Article for policy guides, FAQPage for eligibility questions',
  },

  'business-startup': {
    wordCount: 1400,
    tone: 'serial entrepreneur with operational experience — action-oriented, failure-aware, cuts through theory to what actually matters in the first 12 months',
    structure: 'skip the inspiration, open with the hardest part of this topic that most guides skip, then the step-by-step operational approach, then common failure modes, then metrics to track',
    persona: 'someone who has started 3 businesses (one failed, two succeeded) and mentors early-stage founders',
    requiredElements: 'specific costs or timelines (not ranges if avoidable), the one metric that matters most for this topic, a "failure mode" callout (what kills businesses at this stage), a tool or resource recommendation with a specific name',
    avoidances: 'never give generic startup advice; never skip the failure modes; avoid motivational language over operational detail; never recommend a tool without explaining why',
    categoryHint: 'Business Formation, Funding, Marketing, Operations, Hiring, Legal Basics, E-commerce, SaaS',
    schemaHint: 'HowTo for process guides, Article for strategy topics',
  },
};

// ── Fallback config for unknown niches ───────────────────────────────────────
const DEFAULT_NICHE_CONFIG = {
  wordCount: 1300,
  tone: 'authoritative but accessible, like a knowledgeable friend explaining',
  structure: 'answer the query directly in the first paragraph, then expand with depth',
  persona: 'a subject matter expert with years of hands-on experience',
  requiredElements: 'specific numbers, costs, or timeframes; a practical takeaway the reader can act on today',
  avoidances: 'filler phrases like "In conclusion" or "It\'s important to note"; generic advice without specifics',
  categoryHint: 'General',
  schemaHint: 'Article',
};

// ── Word count variation — 30% short / 50% medium / 20% long ─────────────────
function getVariedWordCount(base) {
  const roll = Math.random();
  if (roll < 0.30) return base - 300;           // short: 800-1100
  if (roll < 0.80) return base;                 // medium: default
  return base + 400;                            // long: 1600-1900
}

// ── Frasi AI da evitare assolutamente ─────────────────────────────────────────
const AI_PHRASE_BLACKLIST = [
  // Opener clichés
  'In today\'s world', 'In today\'s fast-paced', 'In the modern world',
  'When it comes to', 'If you\'re looking for', 'Are you looking for',
  'Whether you\'re a', 'Look no further',
  // Filler transitions
  'It\'s worth noting', 'It is worth noting', 'It\'s important to note',
  'It is important to note', 'It\'s important to remember',
  'Needless to say', 'Without further ado', 'That being said',
  'With that said', 'Having said that', 'At the end of the day',
  'In the grand scheme', 'All things considered',
  // Closer clichés
  'In conclusion', 'To conclude', 'To summarize', 'In summary',
  'As we\'ve seen', 'As we have seen', 'As mentioned above',
  'As discussed above', 'As outlined above',
  // AI vocabulary
  'Delve into', 'Delve deeper', 'Dive deep', 'Dive into',
  'Navigating the', 'Navigating this', 'Unpack', 'Unlock the',
  'Leverage', 'Utilize', 'Comprehensive guide', 'Ultimate guide',
  'Game-changer', 'Game changer', 'Transformative', 'Revolutionary',
  'Cutting-edge', 'State-of-the-art', 'Robust', 'Streamline',
  'Synergy', 'Holistic approach', 'Paradigm shift',
  // Hedging AI phrases
  'It\'s crucial to', 'It is crucial to', 'It\'s essential to',
  'It is essential to', 'Ensure that you', 'Make sure to',
  'Take the time to', 'Don\'t hesitate to', 'Feel free to',
].join('", "');

// ── Main prompt builder ───────────────────────────────────────────────────────
// ── Writing style variants — injected per-article based on rotation ───────────
// Style 0: default (analytical/expert) — no extra block, cfg.tone already covers it
// Style 1: conversational/accessible
// Style 2: data-driven/research-focused
export const WRITING_STYLE_VARIANTS = {

  // ── Variant 0: DIRECT / PRICE-FIRST ─────────────────────────────────────────
  // Primary author. Lean, practical, gets to the number immediately.
  0: `
EDITORIAL ENGINE — DIRECT & PRACTICAL:

OPENING: Lead with the dollar range or key number in the very first sentence. No warm-up, no preamble. Example: "Replacing a roof costs $8,000–$22,000 for most US homes — here is what drives that spread."

SECTION STRUCTURE: Organize sections around decisions the reader has to make, not around information categories. Each H2 should answer a question the reader is actually asking (e.g. "What affects the final price?" not "Cost Factors Overview").

EXAMPLES: Use quick, concrete comparisons with real numbers. Two-line format: state the scenario, state the number. ("A 1,500 sqft ranch in the Midwest: ~$11,000. The same job in the Northeast: ~$17,500.") Never use vague examples.

FAQ: Keep questions practical and action-oriented. "How long does X take?", "Can I negotiate the quote?", "What should I expect to pay in [region]?" Short, direct answers — 2–4 sentences max per answer.

CLOSING: End with a numbered action checklist (3–5 items). What the reader should do before calling anyone. No summary recap — they just read the article.
`,

  // ── Variant 1: EXPERT / MISTAKE-FIRST ───────────────────────────────────────
  // Additional author 1. Leads with the common error, goes deep on causes.
  1: `
EDITORIAL ENGINE — EXPERT & MISTAKE-FIRST:

OPENING: Start by naming the #1 mistake readers make before they understand this topic — the assumption, the shortcut, the thing they got wrong before reading this. This is your hook. Then explain why avoiding it matters before anything else.

SECTION STRUCTURE: Organize sections around root causes and factors, not around price ranges. Go one level deeper than most articles: explain WHY costs or outcomes vary, not just that they do. Use "here is what most articles do not tell you" as a mental framing device for each section — what is the non-obvious layer?

EXAMPLES: Use mini-scenarios of real situations with a specific outcome: "A homeowner in Ohio received three bids ranging from $9,000 to $16,000. Here is why they differed, and which one she should have chosen." The scenario should illustrate a decision, not just a price.

FAQ: Frame questions around edge cases and exceptions: "What if my quote is 30% higher than average?", "Does X ever make sense to skip?", "What should I push back on?" Answers should be specific — name the variables, name the exceptions. 3–5 sentences per answer.

CLOSING: End with a list of questions the reader should ask before making a decision (contractor, provider, professional). Not a summary — a diagnostic tool. Title it something like "Questions to ask before you sign anything."
`,

  // ── Variant 2: EDITORIAL / HIDDEN-COSTS-FIRST ───────────────────────────────
  // Additional author 2. Leads with counterintuitive insight, reveals what others skip.
  2: `
EDITORIAL ENGINE — EDITORIAL & HIDDEN COSTS:

OPENING: Start with a counterintuitive fact, a hidden cost, or a number that surprises most people — something that reframes how the reader should think about this topic before they read anything else. Not a statistic for its own sake: a reframe. ("The advertised price is rarely the real price. Here is what actually shows up on the final invoice.")

SECTION STRUCTURE: Less rigid than a standard breakdown. Sections can be uneven in length. One section can be a single strong insight. Mix narrative flow with data — do not force every section to follow the same template. The article should feel like it was written by a person, not assembled from a template. One section dedicated specifically to costs or risks that competitors or sellers never mention upfront.

EXAMPLES: Use Option A vs Option B comparisons that reveal a tradeoff, not just a price difference. ("Choosing X saves $2,000 upfront but typically costs $800/year more to maintain — it breaks even at year 2.5.") Focus on what gets hidden in the comparison, not just what the comparison shows.

FAQ: Frame questions as things people should be suspicious about: "Why do prices vary so much?", "What are the hidden fees I should ask about?", "Is the cheaper option ever actually better?" Answers should be honest about uncertainty where it exists — "it depends, and here is exactly what it depends on."

CLOSING: End with an honest tradeoff summary. What should you spend more on, and where can you safely save? No action checklist — a short, frank editorial paragraph that gives the reader a clear mental model to carry into their decision.
`,

};

// ── Format variants — varied article formats in rotation ─────────────────────
// 0 = standard informational (default), 1 = listicle, 2 = opinion/editorial
export const FORMAT_VARIANT_CONFIGS = {
  0: {
    name: 'standard',
    promptBlock: '', // no override — default structure from cfg.structure
  },
  1: {
    name: 'listicle',
    promptBlock: `FORMAT: NUMBERED LIST ARTICLE
Title must follow pattern "[N] [Action/Problem] [Specific Outcome]" — e.g. "9 HVAC Mistakes That Cost Homeowners $2,000+ Per Year" / "7 Things That Drive Up Roof Replacement Costs" / "11 Home Improvement Projects With the Best ROI in 2026". The number should be 7, 9, or 11.
Structure: exactly that many sections. The H2 of each section MUST start with the item number (e.g. "1. Always Get Three Quotes Before Committing"). Each item: hook sentence → 1-2 specific data points or examples → one-line takeaway. No long preamble between items — each stands alone.
Set formatType: "listicle" in the JSON output.`,
  },
  2: {
    name: 'opinion',
    promptBlock: `FORMAT: EDITORIAL / OPINION PIECE
Title must take a clear, defensible position — e.g. "Why Solar Quotes Vary by $15,000 (And Who Is Overcharging You)" / "The Home Insurance Advice Your Agent Won't Give You" / "I've Reviewed 200 Contractor Quotes. Here Is What Most Homeowners Get Wrong."
Structure: 4-6 sections. Opening section: state the take plainly and explain why conventional wisdom is wrong. Middle sections: evidence, real examples, data, one genuine counterargument. Final section: concrete verdict — what the reader should actually do. First-person throughout. Author's experience is the authority, not hedged disclaimers.
Set formatType: "opinion" in the JSON output.`,
  },
};

// ── Per-variant structural parameters ────────────────────────────────────────

// Word count offset from cfg.wordCount base:
// Variant 0 (lean/direct) → shorter; Variant 1 (expert/deep) → longer; Variant 2 (editorial) → base
const VARIANT_WC_OFFSETS = { 0: -150, 1: 400, 2: 50 };

// Meta description framing per variant — different SERP appearance
const VARIANT_META_DESC_STYLE = {
  0: 'lead with the price range or key number upfront, then keyword, end with a practical CTA. Example: "Roof replacement costs $8,000–$22,000. See what drives the spread and how to get a fair quote."',
  1: 'open with the key question or the common mistake this article corrects, then what the reader learns. Example: "Why do quotes for the same job differ by 40%? A cost estimator explains the real factors — and what to push back on."',
  2: 'lead with a counterintuitive fact or what most articles miss, then honest framing. Example: "The listed price is rarely the final price. Here is what actually shows up on the invoice — and how to budget realistically."',
};

// Schema type per variant — affects rich result eligibility
const VARIANT_SCHEMA_HINT = {
  0: 'HowTo — this article is step-by-step and actionable',
  1: 'Article — this is expert analysis with depth and root causes',
  2: 'FAQPage — this article has prominent Q&A and counterintuitive reveals',
};

// Author note framing per variant — reinforces persona coherence
const VARIANT_AUTHOR_NOTE_STYLE = {
  0: 'a quick practical observation from direct experience — something you notice every time. 2 sentences max. Example: "I have never seen a homeowner regret spending more on [X]. I have seen dozens regret saving on it."',
  1: 'a specific mistake you personally witnessed — name what the person did, what happened, and what the correct move was. 2-3 sentences. Example: "A client skipped the permit to save $300. The inspector flagged it at resale and she spent $4,200 correcting it."',
  2: 'something about this topic that genuinely surprised you when you first encountered it — a counterintuitive pattern you only know from experience. 2 sentences. Example: "The cheapest option on paper is almost never the cheapest over two years. I started tracking this and the gap averaged 23%."',
};

export function buildArticlePrompt(keyword, niche, options = {}) {
  const cfg = NICHE_PROMPT_CONFIGS[niche.slug] || DEFAULT_NICHE_CONFIG;
  const styleVariant = options.styleVariant ?? 0;
  const formatVariant = options.formatVariant ?? 0;
  const baseWc = cfg.wordCount;
  const wordCount = options.targetWordCount || Math.max(800, baseWc + (VARIANT_WC_OFFSETS[styleVariant] ?? 0));
  const liveDataBlock = options.liveDataBlock || '';
  const styleBlock = WRITING_STYLE_VARIANTS[styleVariant] || '';
  const persona = options.authorPersona || cfg.persona;
  const metaDescStyle = VARIANT_META_DESC_STYLE[styleVariant] || VARIANT_META_DESC_STYLE[0];
  const schemaHint = VARIANT_SCHEMA_HINT[styleVariant] || cfg.schemaHint;
  const authorNoteStyle = VARIANT_AUTHOR_NOTE_STYLE[styleVariant] || VARIANT_AUTHOR_NOTE_STYLE[0];
  const formatBlock = FORMAT_VARIANT_CONFIGS[formatVariant]?.promptBlock || '';
  const CURRENT_YEAR = new Date().getFullYear();
  const CURRENT_DATE = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  return `You are ${persona}, writing for a ${niche.name} publication.

ARTICLE TOPIC: "${keyword}"

TONE & VOICE:
${cfg.tone}

STRUCTURE GUIDANCE:
${cfg.structure}

REQUIRED ELEMENTS (every article must include):
${cfg.requiredElements}

WHAT TO AVOID:
${cfg.avoidances}
${styleBlock}${liveDataBlock}${formatBlock ? `\n${formatBlock}\n` : ''}
WORD COUNT: ${wordCount}–${wordCount + 300} words

OUTPUT FORMAT (return valid JSON only, no markdown wrapper):
{
  "title": "compelling H1 title (50-65 chars, includes keyword naturally)",
  "metaDescription": "150-160 chars — ${metaDescStyle}",
  "quickAnswer": "1-2 sentence direct answer to the article's main question — lead with the specific number, range, or fact the reader is looking for. If cost: give the dollar range. If legal/insurance: give the direct answer + key caveat. No preamble, no 'In this article'.",
  "intro": "2-3 sentence intro that immediately delivers value — no preamble, no throat-clearing",
  "sections": [
    {
      "h2": "section title",
      "content": "2-4 paragraphs of substantive, specific content",
      "hasList": true/false,
      "listItems": ["item 1", "item 2", ...] // include if hasList true
    }
  ],
  "faq": [
    { "question": "question people actually search?", "answer": "direct answer (2-3 sentences, no hedging)" }
  ],
  "conclusion": "1-2 paragraphs — actionable takeaway, not a summary of what was already said",
  "authorNote": "first-person, from direct experience — ${authorNoteStyle}",
  "expertTip": "1 concise tip (1-2 sentences) that represents insider knowledge — something a professional would tell a friend but that most articles miss. Prefixed naturally with the author's perspective.",
  "keyTakeaways": ["specific takeaway 1", "specific takeaway 2", "specific takeaway 3"],
  "comparisonTable": {
    "caption": "brief descriptive title for the table (e.g. 'Average Bathroom Remodel Cost by Scope')",
    "headers": ["Option", "Cost Range", "Best For"],
    "rows": [
      ["Row 1 Col 1", "Row 1 Col 2", "Row 1 Col 3"],
      ["Row 2 Col 1", "Row 2 Col 2", "Row 2 Col 3"]
    ]
  },
  "formatType": "standard, listicle, or opinion — set as instructed above (default: standard)",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "category": "best-fit category for this article (options: ${cfg.categoryHint})",
  "schemaType": "Article, HowTo, or FAQPage — choose the best fit (guidance: ${schemaHint})",
  "citations": [
    {
      "claim": "the specific fact or statistic this source supports",
      "source": "Full organization name (e.g. CDC, IRS, Bureau of Labor Statistics)",
      "url": "https://www.bls.gov/"
    }
  ]
}

${getCitationPromptGuidance()}

E-E-A-T LANGUAGE REQUIREMENTS (Google's quality signals — every article must demonstrate all four):
- EXPERIENCE: Weave 1-2 first-person experience markers naturally into section content — not just in authorNote. Use phrases anchored to specific situations: "Every time I've seen this go wrong, it's because...", "The most common thing I notice on inspections is...", "Clients who come to me after trying X always say..." — make it feel like advice from someone who has done this, not read about it.
- EXPERTISE: Use domain-correct terminology without over-explaining it. Reference industry standards, professional bodies, or benchmarks where relevant (e.g., "per OSHA guidelines", "what the DSM-5 criteria specify", "according to NEC code"). Show you know the exceptions and edge cases, not just the general rule.
- AUTHORITATIVENESS: Make 1-2 claims that are clearly grounded in a cited source (government agency, academic study, established industry body). The author's credentials should be implicit in the specificity of the content — not stated, but obvious.
- TRUST: Be explicit when something is uncertain or varies by situation ("this depends on X, and here's how to know which applies to you"). Acknowledge trade-offs honestly. Tell the reader when they need a professional instead of pretending the article replaces one.

ABSOLUTE RULES:
- CURRENT YEAR IS ${CURRENT_YEAR}: Today is ${CURRENT_DATE}. All pricing guides, statistics, and trend references must reflect ${CURRENT_YEAR} data. If you include a year in the title or meta description, it MUST be ${CURRENT_YEAR}. NEVER write "${CURRENT_YEAR - 2}" or "${CURRENT_YEAR - 1}" as if they are the current year.
- BANNED PHRASES — never use any of these: "${AI_PHRASE_BLACKLIST}"
- Write like a human expert, not an AI assistant — use contractions, direct opinions, specific numbers
- HUMAN WRITING PATTERNS — these are non-negotiable structural rules to prevent AI fingerprinting:
  • Vary sentence length deliberately: mix short punchy sentences (under 10 words) with longer ones. Never write 3+ consecutive sentences of similar length.
  • Break parallel structure: if one paragraph starts with a noun phrase, the next should start differently — a verb, a number, a direct observation, even "And" or "But".
  • Vary paragraph depth per section: one section can have 2 short paragraphs, the next one long one, another three medium ones. Never make every section feel the same weight.
  • Opinions and micro-imperfections: state a direct opinion ("Honestly, this is where most people go wrong"), acknowledge limits ("I can't give you an exact number here — too many variables"), notice patterns ("Every time I see this estimate, it's padded by at least 15%").
  • Do NOT start consecutive sentences with "This", "These", "The" or "It". Break the pattern every time.
  • Transitions: use the natural ones ("Here's the thing", "Worth knowing:", "Quick note:") not the formal ones. Or skip transition words entirely — just move to the next point.
  • At least one section per article must have a paragraph that's a single short sentence standing alone for emphasis.
- Use keyword naturally — max 3-4 times total; it MUST appear within the first 100 words (intro or opening of first section)
- FAQ: 4-6 questions people genuinely search, with direct answers
- Citations: 1-2 REAL sources only — government agencies, major institutions, established industry bodies. Real URLs. Never invent a source.
- Every section must add new information — zero repetition across sections
- Write in American English
- US PRICES ONLY: All costs, rates, and monetary values must be in USD for the US market. Never cite UK, Canadian, Australian, or other non-US prices unless the keyword explicitly targets a specific country. If in doubt, use US figures.
- COMPARISON TABLE: include the "comparisonTable" field when the keyword involves costs, types, options, or comparisons (e.g. "cost of X", "X vs Y", "types of X", "best X for Y"). Use 3–6 rows and 3–4 columns with specific data. Omit (set to null) for HowTo/step-by-step articles and simple informational articles with no comparative data.
- HTML TABLES REQUIRED: whenever you include a cost breakdown, comparison, or data with rows and columns — you MUST use a real HTML <table> with <thead>/<tbody>/<tr>/<th>/<td> tags. Never write tabular data as plain text or bullet lists. Use class="cost-table" on every <table>. Example: <table class="cost-table"><thead><tr><th>Item</th><th>Low</th><th>High</th></tr></thead><tbody><tr><td>Labor</td><td>$5,000</td><td>$12,000</td></tr></tbody></table>
- HTML LISTS: use <ul class="art-list"> for feature lists, checklist items, and key points. Use plain <ul> only for generic enumerations
- BOLD TEXT: wrap key terms, important numbers, and critical warnings in <strong> tags. Use bold 3-6 times per section to help readers scan. Example: "The average cost is <strong>$4,200–$8,500</strong> depending on material."
- PARAGRAPH SPACING: write paragraphs of 2-4 sentences max. Leave a blank line between paragraphs in your output`;
}

export function buildHowToPrompt(keyword, niche) {
  const cfg = NICHE_PROMPT_CONFIGS[niche.slug] || DEFAULT_NICHE_CONFIG;
  return buildArticlePrompt(keyword, niche, { targetWordCount: cfg.wordCount + 200 });
}

// ── Author personas — one per niche ──────────────────────────────────────────
export const AUTHOR_PERSONAS = {
  'home-improvement-costs': {
    name: 'James Crawford',
    title: 'Home Renovation Specialist',
    bio: 'James spent 15 years as a licensed general contractor before becoming a consumer advocate. He has managed over 400 renovation projects and now helps homeowners understand true project costs before signing anything.',
    avatar: 'james-crawford',
    reviewer: { name: 'Robert Harmon', title: 'Licensed General Contractor', credentials: 'CGR · NARI Member · 22 years residential construction' },
    trustSources: 'Bureau of Labor Statistics · Angi Cost Reports · HomeAdvisor True Cost Guide · RSMeans Construction Data',
    trustMethodology: 'Cost ranges in this guide reflect contractor quotes, BLS occupational labor data, and regional pricing from HomeAdvisor, Angi, and RSMeans. Figures represent U.S. averages — your actual cost will vary by location, contractor, and project scope.',
    ymyl: false,
  },
  'pet-care-by-breed': {
    name: 'Dr. Sarah Mitchell',
    title: 'Veterinary Behaviorist',
    bio: 'Dr. Mitchell is a certified veterinary behaviorist with 12 years of clinical experience specializing in breed-specific health and behavioral needs. She consults for rescue organizations and writes to close the gap between what vets know and what owners hear.',
    avatar: 'sarah-mitchell',
    reviewer: { name: 'Dr. James Okafor', title: 'DVM', credentials: 'Board-Certified Veterinarian · AVMA Member · 14 years clinical practice' },
    trustSources: 'AVMA Health Reports · AKC Breed Standards · VCA Animal Hospitals Research · PetMD Clinical Guidelines',
    trustMethodology: 'Health and care data in this guide draws from AVMA publications, breed-specific veterinary research, and clinical guidelines. Individual animals may vary significantly — always consult your veterinarian.',
    ymyl: false,
  },
  'software-error-fixes': {
    name: 'Alex Torres',
    title: 'Senior Systems Engineer',
    bio: 'Alex has 11 years in enterprise IT support and systems engineering, holding CompTIA and Microsoft certifications. He has diagnosed and resolved thousands of software issues across Fortune 500 environments and consumer devices alike.',
    avatar: 'alex-torres',
    reviewer: { name: 'Priya Nair', title: 'IT Infrastructure Lead', credentials: 'MCSA · CompTIA Network+ · 10 years enterprise IT' },
    trustSources: 'Microsoft Support Documentation · CompTIA Knowledge Base · Stack Overflow · Vendor Release Notes',
    trustMethodology: 'Steps in this guide are tested on real hardware and verified against official vendor documentation. Software versions and interfaces may change — check the official docs for the latest instructions.',
    ymyl: false,
  },
  'diet-specific-recipes': {
    name: 'Emma Rodriguez',
    title: 'Registered Nutritionist & Recipe Developer',
    bio: 'Emma is a registered nutritionist with 8 years of clinical and culinary experience. She develops diet-specific recipes for clients managing chronic conditions and has contributed to three published nutrition cookbooks.',
    avatar: 'emma-rodriguez',
    reviewer: { name: 'Dr. Lisa Park', title: 'Registered Dietitian (RD)', credentials: 'RD · CDN · 11 years clinical nutrition practice' },
    trustSources: 'USDA FoodData Central · Academy of Nutrition and Dietetics · PubMed Clinical Studies · NIH Dietary Guidelines',
    trustMethodology: 'Nutritional information is calculated using USDA data. All recipes are tested for compliance with stated dietary guidelines. Consult a registered dietitian before making major dietary changes.',
    ymyl: false,
  },
  'small-town-tourism': {
    name: 'Marcus Webb',
    title: 'Travel Journalist',
    bio: 'Marcus has visited and written about over 300 small towns across North America and Europe for major travel publications. He specializes in the kind of travel that reveals local character rather than polished tourist facades.',
    avatar: 'marcus-webb',
    reviewer: { name: 'Claire Nguyen', title: 'Travel Editor', credentials: 'Former Condé Nast Traveler contributor · 15 years travel writing' },
    trustSources: 'Local tourism bureaus · U.S. Census Bureau · TripAdvisor Destination Data · State travel offices',
    trustMethodology: 'Information in this guide was gathered through direct visits, local tourism authority data, and verified traveler accounts. Hours, prices, and availability change — verify directly before visiting.',
    ymyl: false,
  },
  'personal-finance': {
    name: 'Michael Chen',
    title: 'Certified Financial Planner (CFP)',
    bio: 'Michael is a fee-only CFP with 14 years of experience helping individuals and families build wealth. He has no product affiliations and writes to give readers the same frank advice he gives paying clients.',
    avatar: 'michael-chen',
    reviewer: { name: 'Karen Holt', title: 'CPA · CFA', credentials: 'Certified Public Accountant · Chartered Financial Analyst · 18 years financial advisory' },
    trustSources: 'Federal Reserve Economic Data (FRED) · IRS Publications · CFP Board Standards · Consumer Financial Protection Bureau',
    trustMethodology: 'Financial figures in this guide use current IRS limits, Federal Reserve data, and industry benchmarks. Tax laws and contribution limits change annually — verify with a licensed financial advisor.',
    ymyl: true,
  },
  'insurance-guide': {
    name: 'Linda Torres',
    title: 'Licensed Insurance Broker & Consumer Advocate',
    bio: 'Linda spent 12 years as a licensed broker before switching to consumer advocacy. She has reviewed thousands of policies and now helps readers understand what their coverage actually covers — and what it does not.',
    avatar: 'linda-torres',
    reviewer: { name: 'Maria Sanchez', title: 'Licensed Insurance Agent', credentials: 'Licensed in 12 states · Former State Farm Regional Manager · 16 years industry experience' },
    trustSources: 'NAIC Market Share Data · State Department of Insurance Rate Filings · CFPB Consumer Resources · Kaiser Family Foundation',
    trustMethodology: 'Rate estimates in this guide are based on NAIC industry data, state DOI rate filings, and aggregated carrier pricing. Actual premiums vary significantly by insurer, location, age, health status, driving record, and coverage level. This guide is for informational purposes only.',
    ymyl: true,
  },
  'legal-advice': {
    name: 'David Kim',
    title: 'Paralegal & Legal Content Specialist',
    bio: 'David is a certified paralegal with 10 years of experience across family law, personal injury, and business litigation. He writes to translate legal complexity into plain English that empowers people to make informed decisions.',
    avatar: 'david-kim',
    reviewer: { name: 'Susan Park', title: 'Attorney at Law', credentials: 'Bar Admitted: CA, NY · 14 years civil and family law practice' },
    trustSources: 'Legal Information Institute (Cornell) · State Court Self-Help Centers · ABA Consumer Resources · NOLO Legal Encyclopedia',
    trustMethodology: 'Legal information in this guide is based on publicly available statutes, court procedures, and ABA guidelines. Laws vary significantly by state and change regularly. This is not legal advice — consult a licensed attorney for your specific situation.',
    ymyl: true,
  },
  'real-estate-investing': {
    name: 'Robert Nash',
    title: 'Real Estate Investor & Licensed Agent',
    bio: 'Robert has been investing in real estate for 18 years and holds a real estate license in three states. His current portfolio includes single-family rentals, a small commercial property, and two short-term rentals.',
    avatar: 'robert-nash',
    reviewer: { name: 'Patricia Owens', title: 'CPA · Real Estate CPA', credentials: 'Certified Public Accountant · Specializing in real estate taxation · 15 years REI advisory' },
    trustSources: 'Federal Reserve Economic Data · NAR Market Reports · Census Bureau ACS · BiggerPockets Research',
    trustMethodology: 'Market data and financial projections in this guide are based on current Federal Reserve data, NAR reports, and real investment case studies. Real estate returns are not guaranteed — consult a financial advisor and tax professional before investing.',
    ymyl: true,
  },
  'health-symptoms': {
    name: 'Dr. Patricia Moore',
    title: 'Internal Medicine Physician',
    bio: 'Dr. Moore is a board-certified internal medicine physician with 16 years of clinical practice. She writes to give patients the clear, evidence-based information they deserve — the kind that often gets cut short in a 15-minute appointment.',
    avatar: 'patricia-moore',
    reviewer: { name: 'Dr. Howard Ellis', title: 'MD, FACP', credentials: 'Board-Certified Internal Medicine · Fellow American College of Physicians · 20 years practice' },
    trustSources: 'NIH National Library of Medicine · CDC Clinical Guidelines · Mayo Clinic · PubMed Peer-Reviewed Research',
    trustMethodology: 'Medical information in this guide is drawn from peer-reviewed research, CDC guidelines, and clinical practice standards. This content is for educational purposes only and does not constitute medical advice. Always consult a qualified healthcare provider.',
    ymyl: true,
  },
  'credit-cards-banking': {
    name: 'Jennifer Walsh',
    title: 'Consumer Finance Journalist',
    bio: 'Jennifer has covered personal finance and banking for 9 years, reviewing over 200 credit cards, bank accounts, and financial products. She approaches every comparison with one question: who does this actually benefit?',
    avatar: 'jennifer-walsh',
    reviewer: { name: 'Thomas Grant', title: 'CFP · Consumer Finance Analyst', credentials: 'Certified Financial Planner · Former CFPB analyst · 12 years financial product research' },
    trustSources: 'CFPB Consumer Complaint Database · Federal Reserve Charge-Off Rates · FDIC Banking Statistics · Issuer Cardholder Agreements',
    trustMethodology: 'Card terms, APRs, and rewards data in this guide are sourced from issuer agreements and verified at time of publication. Offers change frequently — verify current terms directly with the issuer before applying.',
    ymyl: true,
  },
  'weight-loss-fitness': {
    name: 'Coach Tyler Brooks',
    title: 'NASM-Certified Personal Trainer',
    bio: 'Tyler is an NASM-certified trainer with 11 years of coaching experience and over 500 clients. He specializes in debunking fitness myths and building sustainable programs for people who have tried and failed before.',
    avatar: 'tyler-brooks',
    reviewer: { name: 'Dr. Angela Ross', title: 'PhD, Exercise Physiology', credentials: 'CSCS · NSCA Fellow · 15 years sports science research' },
    trustSources: 'NSCA Strength & Conditioning Journal · ACSM Guidelines · PubMed Exercise Science Research · CDC Physical Activity Guidelines',
    trustMethodology: 'Training protocols and nutritional recommendations in this guide are grounded in peer-reviewed exercise science. Individual results vary — consult a healthcare provider before starting any new exercise or diet program.',
    ymyl: false,
  },
  'automotive-guide': {
    name: 'Frank Russo',
    title: 'ASE Master Technician & Auto Journalist',
    bio: 'Frank is an ASE-certified master technician with 20 years in professional auto repair. He started writing after too many customers came in having been quoted three times the fair price elsewhere.',
    avatar: 'frank-russo',
    reviewer: { name: 'Carol Martinez', title: 'ASE-Certified Technician', credentials: 'ASE Master Certified · Former AAA Technical Advisor · 18 years dealership experience' },
    trustSources: 'ASE Certification Standards · NHTSA Recall Database · AAA Cost Studies · Mitchell1 Labor Time Guides',
    trustMethodology: 'Repair cost estimates in this guide are based on Mitchell1 labor guides, regional parts pricing, and verified quotes from ASE-certified shops. Actual costs vary by vehicle make/model, location, and shop rates.',
    ymyl: false,
  },
  'online-education': {
    name: 'Amanda Lee',
    title: 'EdTech Researcher & Career Coach',
    bio: 'Amanda has spent 8 years evaluating online education programs and coaching career changers. She has personally reviewed over 60 platforms and works only with programs that demonstrate real employer recognition.',
    avatar: 'amanda-lee',
    reviewer: { name: 'Dr. Kevin Park', title: 'EdD, Higher Education', credentials: 'Doctor of Education · Former Department of Education researcher · 12 years EdTech assessment' },
    trustSources: 'U.S. Department of Education · NCES College Data · BLS Occupational Outlook · QS World University Rankings',
    trustMethodology: 'Program data, costs, and outcomes in this guide are sourced from NCES, official institution websites, and verified student outcome reports. Accreditation status and program availability change — always verify directly with the institution.',
    ymyl: false,
  },
  'cybersecurity-privacy': {
    name: 'Sam Okonkwo',
    title: 'Cybersecurity Analyst (CISSP)',
    bio: 'Sam is a CISSP-certified security analyst with 9 years of experience in threat intelligence and incident response. He writes to give ordinary people the 20% of security knowledge that prevents 80% of attacks.',
    avatar: 'sam-okonkwo',
    reviewer: { name: 'Rachel Kim', title: 'CISM · CEH', credentials: 'Certified Information Security Manager · Certified Ethical Hacker · 11 years enterprise security' },
    trustSources: 'NIST Cybersecurity Framework · CISA Advisories · CVE Database · Verizon DBIR Annual Report',
    trustMethodology: 'Security recommendations in this guide follow NIST guidelines and current threat intelligence. The threat landscape evolves rapidly — verify tool versions and CVE advisories before implementation.',
    ymyl: false,
  },
  'mental-health-wellness': {
    name: 'Dr. Rachel Green',
    title: 'Licensed Clinical Psychologist',
    bio: 'Dr. Green is a licensed clinical psychologist with 13 years of practice specializing in anxiety, depression, and trauma. She writes to make evidence-based mental health knowledge accessible to everyone, not just those who can afford therapy.',
    avatar: 'rachel-green',
    reviewer: { name: 'Dr. James Osei', title: 'MD, Psychiatry', credentials: 'Board-Certified Psychiatrist · APA Fellow · 17 years clinical practice' },
    trustSources: 'APA Clinical Practice Guidelines · NIH NIMH Research · DSM-5 Diagnostic Criteria · PubMed Peer-Reviewed Psychology',
    trustMethodology: 'Mental health information in this guide is based on APA guidelines, peer-reviewed research, and evidence-based therapeutic frameworks. This is educational content only — it does not replace professional mental health assessment or treatment.',
    ymyl: true,
  },
  'home-security-systems': {
    name: 'Mike Patterson',
    title: 'Security Systems Consultant',
    bio: 'Mike has designed and installed over 1,200 residential security systems across 15 years in the industry. He now consults independently, which means he can tell you what actually works without being tied to any brand.',
    avatar: 'mike-patterson',
    reviewer: { name: 'Dennis Ward', title: 'PSP · CPP', credentials: 'Physical Security Professional · Certified Protection Professional · 20 years security consulting' },
    trustSources: 'ASIS International Standards · FBI Uniform Crime Reports · NSA Alarm Industry Research · Consumer Reports Security Testing',
    trustMethodology: 'Product testing and pricing data in this guide are based on direct lab testing, manufacturer specifications, and verified consumer reports. Prices and features change — verify current availability and pricing directly with manufacturers.',
    ymyl: false,
  },
  'solar-energy': {
    name: 'Carlos Rivera',
    title: 'Solar Energy Engineer & Consultant',
    bio: 'Carlos is a licensed solar energy engineer who has designed more than 350 residential and commercial installations. He specializes in cutting through the marketing noise to show homeowners what solar actually costs and saves.',
    avatar: 'carlos-rivera',
    reviewer: { name: 'Dr. Angela Yuen', title: 'PhD, Electrical Engineering', credentials: 'NABCEP Certified PV Installer · IEEE Member · 13 years solar energy research' },
    trustSources: 'NREL Solar Resource Data · SEIA Market Research · DOE SunShot Initiative · EIA Energy Statistics',
    trustMethodology: 'Cost estimates and savings projections in this guide use NREL solar irradiance data, SEIA market pricing, and regional utility rate averages. Solar ROI depends on your roof, location, usage, and available incentives — get at least three installer quotes.',
    ymyl: false,
  },
  'senior-care-medicare': {
    name: 'Nancy Williams',
    title: 'Geriatric Care Manager (CMC)',
    bio: 'Nancy is a Certified Care Manager with 17 years of experience guiding families through Medicare, Medicaid, and senior care decisions. She has helped hundreds of families avoid costly enrollment mistakes and find benefits they didn\'t know existed.',
    avatar: 'nancy-williams',
    reviewer: { name: 'Dr. Steven Horwitz', title: 'MD, Geriatrics', credentials: 'Board-Certified Geriatrician · AGS Fellow · Medicare Advisory Board Member' },
    trustSources: 'CMS Medicare & Medicaid Data · AARP Policy Research · Genworth Cost of Care Survey · Medicare.gov Official Data',
    trustMethodology: 'Medicare and care cost data in this guide are sourced from CMS official publications, Genworth\'s annual survey, and state Medicaid rate schedules. Coverage rules and costs change annually during open enrollment — always verify current rules at medicare.gov.',
    ymyl: true,
  },
  'business-startup': {
    name: 'Dana Cooper',
    title: 'Serial Entrepreneur & Business Mentor',
    bio: 'Dana has founded three companies over 14 years — one failed, two succeeded. She now mentors early-stage founders and writes to share the operational realities that most startup content glosses over.',
    avatar: 'dana-cooper',
    reviewer: { name: 'Mark Hendricks', title: 'CPA · Business Attorney', credentials: 'CPA · JD · 19 years small business advisory and corporate law' },
    trustSources: 'SBA Office of Advocacy · U.S. Census Bureau Business Formation Statistics · IRS Small Business Tax Center · BLS Business Employment Dynamics',
    trustMethodology: 'Business cost and regulatory data in this guide are sourced from SBA, IRS, and U.S. Census publications. Legal and tax requirements vary by state and entity type — consult a qualified attorney and accountant before forming a business.',
    ymyl: false,
  },
};

// ── Additional authors per niche — indexes 1 and 2 of the rotation ───────────
// Index 0 = primary author (AUTHOR_PERSONAS[slug])
// Index 1 = conversational style author
// Index 2 = data-driven style author
// Add entries here when a new site is spawned. Niches without an entry
// fall back to the primary author for all variant indexes.
export const ADDITIONAL_AUTHORS = {

  'home-improvement-costs': [
    { name: 'Karen Phillips', title: 'Home Improvement Writer & DIY Specialist',
      bio: 'Karen learned home improvement the hard way — through 11 years of owning a 1920s fixer-upper and hiring (and firing) dozens of contractors. She writes to help homeowners ask the right questions before the crew shows up and the costs start climbing.',
      avatar: 'karen-phillips',
      portraitQuery: 'professional woman smiling portrait headshot',
      promptPersona: 'a homeowner who spent 11 years renovating a 1920s fixer-upper and hiring dozens of contractors — you write from the frustration of someone who learned every lesson the expensive way, knowing exactly what each line in a contractor bid really means' },
    { name: 'Dan Mercer', title: 'Construction Cost Estimator',
      bio: 'Dan spent 14 years as a professional cost estimator for commercial and residential contractors before moving to consumer journalism. He has priced thousands of projects and knows exactly where contractors pad their margins — and how to spot it.',
      avatar: 'dan-mercer',
      portraitQuery: 'professional man business portrait headshot',
      promptPersona: 'a professional cost estimator who has priced thousands of residential and commercial projects — you think in line items, labor hours, and regional material cost indexes, and you know precisely where contractors inflate margins and how to spot it' },
  ],

  'insurance-guide': [
    { name: 'Sarah Campbell', title: 'Personal Finance Writer & Insurance Consumer Advocate',
      bio: 'Sarah spent three years fighting her own insurer after a disputed claim denial, eventually winning on appeal. She now writes with the clarity that comes from having navigated the system herself — form by form, exclusion by exclusion.',
      avatar: 'sarah-campbell',
      portraitQuery: 'professional woman business portrait headshot',
      promptPersona: 'a consumer who spent three years fighting her insurer after a claim denial and won on appeal — you write to help ordinary people navigate the system you had to figure out the hard way, one exclusion and one appeal form at a time' },
    { name: 'Chris Washington', title: 'Insurance Market Analyst',
      bio: 'Chris spent 10 years analyzing rate filings and market data for a state Department of Insurance before turning to consumer journalism. He understands where the industry buries costs and how state regulators actually function in practice.',
      avatar: 'chris-washington',
      portraitQuery: 'professional man financial analyst portrait headshot',
      promptPersona: 'an insurance market analyst who spent 10 years reviewing rate filings for a state Department of Insurance — you cite state rate bulletins and CMS data, and you know exactly how insurers structure premiums to obscure true costs' },
  ],

  'legal-advice': [
    { name: 'Rachel Torres', title: 'Legal Writer & Consumer Rights Advocate',
      bio: 'Rachel spent two years navigating a wrongful termination case without legal representation before winning on appeal. She now writes to help others understand their legal rights before situations become expensive and irreversible.',
      avatar: 'rachel-torres',
      portraitQuery: 'professional woman lawyer portrait headshot',
      promptPersona: 'a consumer who navigated a wrongful termination case without a lawyer and won on appeal — you write to help people understand their legal rights before situations become expensive and irreversible, from the perspective of someone who learned the system by living through it' },
    { name: 'Mark Stevens', title: 'Legal Research Analyst',
      bio: 'Mark is a legal research analyst with 12 years of experience compiling case law data and tracking legislative changes across jurisdictions. He writes to make legal information searchable and actionable for non-lawyers.',
      avatar: 'mark-stevens',
      portraitQuery: 'professional man suit portrait headshot',
      promptPersona: 'a legal research analyst with 12 years tracking case law and legislative changes across jurisdictions — you cite specific statutes, court decisions, and state-by-state variations, quantifying legal risk in concrete financial and procedural terms' },
  ],

  'senior-care-medicare': [
    { name: 'Patricia Hayes', title: 'Family Caregiver Advocate & Senior Care Writer',
      bio: 'Patricia spent four years as the primary caregiver for both of her aging parents, navigating Medicare enrollment, skilled nursing facilities, and Medicaid spend-down simultaneously. She writes to give families the practical roadmap she wished she had had from the beginning.',
      avatar: 'patricia-hayes',
      portraitQuery: 'professional woman mature portrait headshot',
      promptPersona: 'a family caregiver who spent four years managing Medicare enrollment, skilled nursing placements, and Medicaid spend-down for both aging parents simultaneously — you write the roadmap you desperately needed and could never find' },
    { name: 'Robert Chen', title: 'Medicare Policy Analyst',
      bio: 'Robert has tracked Medicare Advantage plan performance, premium trends, and coverage changes for 11 years and has consulted for state health departments on enrollment patterns. He translates CMS data and annual rule updates into actionable guidance for beneficiaries.',
      avatar: 'robert-chen',
      portraitQuery: 'professional man healthcare analyst portrait headshot',
      promptPersona: 'a Medicare policy analyst who has tracked Advantage plan performance and premium trends for 11 years — you cite specific CMS data, annual rule changes, and enrollment statistics to help beneficiaries understand how program mechanics affect their actual coverage and costs' },
  ],

  'solar-energy': [
    { name: 'Lisa Nguyen', title: 'Homeowner Solar Advocate & Energy Writer',
      bio: 'Lisa installed a 9.6 kW solar system on her home three years ago and has tracked every kilowatt-hour produced and every dollar saved since. She writes to give prospective solar buyers an unfiltered look at what ownership actually looks like beyond the installer sales pitch.',
      avatar: 'lisa-nguyen',
      portraitQuery: 'professional woman smiling portrait headshot',
      promptPersona: 'a homeowner who installed a 9.6 kW solar system and has tracked every kilowatt-hour produced and every dollar saved for three years — you give prospective buyers the unfiltered ownership experience that installer sales pitches never include' },
    { name: 'Brian Foster', title: 'Energy Policy Analyst',
      bio: 'Brian has worked with state utility commissions and researched solar incentive program effectiveness for a decade. He brings a rigorous, market-data perspective to solar economics, net metering policy, and the real cost of going solar.',
      avatar: 'brian-foster',
      portraitQuery: 'professional man energy analyst portrait headshot',
      promptPersona: 'an energy policy analyst who has worked with state utility commissions and evaluated solar incentive program economics for a decade — you ground every recommendation in utility rate data, LCOE figures, and actual net metering policy terms' },
  ],

  'personal-finance': [
    { name: 'Stephanie Park', title: 'Personal Finance Writer & Debt-Free Coach',
      bio: 'Stephanie paid off $92,000 in student loans and credit card debt in four years on an average salary. She writes about personal finance with the honesty that comes from having lived through every mistake she warns readers about.',
      avatar: 'stephanie-park',
      portraitQuery: 'professional woman finance portrait headshot',
      promptPersona: 'someone who paid off $92,000 in student loans and credit card debt in four years on an average salary — you write about money with the hard-earned honesty of someone who has lived through every mistake they warn readers about' },
    { name: 'Thomas Reed', title: 'Quantitative Finance Journalist',
      bio: 'Thomas spent 11 years as a quantitative analyst for a regional bank before moving to financial journalism. He specializes in translating Federal Reserve data and market statistics into actionable personal finance guidance.',
      avatar: 'thomas-reed',
      portraitQuery: 'professional man financial analyst portrait headshot',
      promptPersona: 'a quantitative analyst who spent 11 years at a regional bank before moving to financial journalism — you lead with Federal Reserve data, compounding math, and real dollar examples, translating abstract statistics into decisions readers can actually act on' },
  ],

  'real-estate-investing': [
    { name: 'Amanda Torres', title: 'Real Estate Investor & First-Time Buyer Coach',
      bio: 'Amanda bought her first rental property at 29 with a modest down payment and no prior investing experience. She documents every deal — the wins and the costly mistakes — to give new investors a realistic picture of what REI actually requires.',
      avatar: 'amanda-torres',
      portraitQuery: 'professional woman real estate portrait headshot',
      promptPersona: 'a real estate investor who bought her first rental property at 29 with no prior experience — you document every deal including the costly mistakes, giving new investors the ground-level view of what REI actually requires before theory meets reality' },
    { name: 'Kevin Foster', title: 'Real Estate CPA & Investment Analyst',
      bio: 'Kevin is a CPA who specializes in real estate taxation and has advised investors on more than 600 property acquisitions. He approaches every deal through the lens of after-tax cash flow and deal structure.',
      avatar: 'kevin-foster',
      portraitQuery: 'professional man financial analyst portrait headshot',
      promptPersona: 'a CPA specializing in real estate taxation who has reviewed more than 600 property acquisitions — you evaluate every investment through after-tax cash flow, depreciation schedules, and deal structure, not just gross yield' },
  ],

  'health-symptoms': [
    { name: 'Susan James', title: 'Medical Writer & Patient Advocate',
      bio: 'Susan has covered health and medicine for general audiences for 10 years and has served as a patient advocate through multiple family hospitalizations. She bridges the gap between clinical terminology and what patients actually need to understand.',
      avatar: 'susan-james',
      portraitQuery: 'professional woman health journalist portrait headshot',
      promptPersona: 'a medical writer and patient advocate who has navigated multiple family hospitalizations — you bridge clinical terminology and what patients genuinely need to understand, writing with the empathy of someone who has sat on the wrong side of a doctor\'s desk' },
    { name: 'Dr. Alan Wright', title: 'Epidemiologist & Public Health Researcher',
      bio: 'Dr. Wright has worked on disease surveillance studies for the CDC and published research on symptom prevalence and diagnostic patterns across population groups. He contextualizes health statistics for a non-specialist audience.',
      avatar: 'alan-wright',
      portraitQuery: 'professional man doctor portrait headshot',
      promptPersona: 'an epidemiologist who has worked on CDC disease surveillance studies — you contextualize every symptom with population prevalence data, diagnostic accuracy statistics, and published clinical evidence, helping readers calibrate real risk rather than catastrophize' },
  ],

  'credit-cards-banking': [
    { name: 'Maria Lopez', title: 'Former Bank Manager & Consumer Finance Advocate',
      bio: 'Maria worked as a bank branch manager for seven years before leaving to write about the financial products she spent years selling. She reviews credit cards and bank accounts from the inside perspective of someone who knows exactly how issuers make their money.',
      avatar: 'maria-lopez',
      portraitQuery: 'professional woman banking portrait headshot',
      promptPersona: 'a former bank branch manager who spent seven years selling the financial products you now write about — you expose how issuers actually make their money, from interchange fees to penalty APR triggers, based on insider knowledge most cardholders never get' },
    { name: 'Daniel Park', title: 'Credit Market Analyst (CFA)',
      bio: 'Daniel spent 9 years analyzing credit market data for a consumer lending company and holds a CFA charter. He brings a rigorous quantitative approach to evaluating credit card offers, rates, and fee structures.',
      avatar: 'daniel-park',
      portraitQuery: 'professional man financial portrait headshot',
      promptPersona: 'a CFA-chartered credit market analyst who spent 9 years evaluating consumer lending data — you quantify every card offer in terms of net APR math, fee drag, and break-even reward thresholds, cutting through marketing complexity to the actual cost of credit' },
  ],

  'weight-loss-fitness': [
    { name: 'Jessica Kim', title: 'Fitness Writer & Sustainable Weight Loss Coach',
      bio: 'Jessica lost 53 pounds over 18 months and has kept it off for six years by building sustainable habits rather than following rigid programs. She writes for people who have tried and failed at dieting and are looking for an approach that fits real life.',
      avatar: 'jessica-kim',
      portraitQuery: 'professional woman fitness portrait headshot',
      promptPersona: 'someone who lost 53 pounds and kept it off for six years by building sustainable habits — you write for people who have tried and failed at dieting, with the honesty and compassion of someone who spent years in that same frustrating cycle' },
    { name: 'Dr. Steven Park', title: 'Exercise Physiologist & Research Scientist',
      bio: 'Dr. Park holds a PhD in exercise physiology and has published research on metabolic adaptation, body composition, and the long-term efficacy of weight loss interventions. He translates clinical research into practical guidance.',
      avatar: 'steven-park',
      portraitQuery: 'professional man scientist portrait headshot',
      promptPersona: 'an exercise physiologist with a PhD who has published research on metabolic adaptation and weight loss interventions — you lead every recommendation with study citations, effect sizes, and mechanistic explanations, separating evidence-based practice from fitness industry mythology' },
  ],

  'automotive-guide': [
    { name: 'Mike Chen', title: 'DIY Mechanic & Automotive Writer',
      bio: 'Mike has been restoring and repairing his own vehicles since age 16 and currently has three projects in his garage. He writes to help drivers make informed decisions without getting taken advantage of at the shop.',
      avatar: 'mike-chen',
      portraitQuery: 'professional man mechanic portrait headshot',
      promptPersona: 'a lifelong DIY mechanic who has been restoring and repairing his own vehicles since age 16 — you help drivers avoid getting taken advantage of at the shop, using the hands-on knowledge most mechanics never explain to customers' },
    { name: 'Sarah Webb', title: 'Automotive Cost Analyst',
      bio: 'Sarah spent 10 years tracking automotive repair costs and parts pricing data for a consumer advocacy organization. She uses pricing databases and labor rate studies to give readers defensible cost benchmarks.',
      avatar: 'sarah-webb',
      portraitQuery: 'professional woman analyst portrait headshot',
      promptPersona: 'an automotive cost analyst who spent 10 years tracking repair costs and parts pricing for a consumer advocacy organization — you cite specific labor rate databases and parts benchmarks, giving readers defensible numbers to bring to any service negotiation' },
  ],

  'online-education': [
    { name: 'James Rodriguez', title: 'Career Change Coach & Online Education Writer',
      bio: 'James used online certifications to transition from warehouse logistics to data analytics in 18 months, earning more in year two than in five years at his previous job. He writes to give career changers a realistic picture of what online learning can and cannot do.',
      avatar: 'james-rodriguez',
      portraitQuery: 'professional man education portrait headshot',
      promptPersona: 'someone who used online certifications to career-change from warehouse logistics to data analytics in 18 months — you give career changers a brutally realistic picture of what online learning can and cannot do, based on the actual costs, timelines, and obstacles you experienced' },
    { name: 'Dr. Emily Chang', title: 'Education Policy Researcher',
      bio: 'Dr. Chang has evaluated the labor market outcomes of online credential programs for a state higher education board and has published research on credential recognition by employers. She identifies which programs actually translate into career advancement.',
      avatar: 'emily-chang',
      portraitQuery: 'professional woman researcher portrait headshot',
      promptPersona: 'an education policy researcher who has evaluated labor market outcomes from online credential programs for a state higher education board — you identify which programs actually translate into employer recognition and salary gains, citing outcome data rather than platform marketing claims' },
  ],

  'cybersecurity-privacy': [
    { name: 'Alex Morgan', title: 'Consumer Privacy Journalist',
      bio: 'Alex has covered consumer privacy and digital security for tech publications for seven years. She writes to help ordinary users understand cybersecurity without needing a technical background — focusing on the 20% of measures that prevent 80% of attacks.',
      avatar: 'alex-morgan',
      portraitQuery: 'professional woman technology journalist portrait headshot',
      promptPersona: 'a consumer privacy journalist who has covered cybersecurity for tech publications for seven years — you help ordinary users understand digital security without technical jargon, focusing on the practical measures that prevent the vast majority of real-world attacks' },
    { name: 'Rachel Foster', title: 'Threat Intelligence Analyst',
      bio: 'Rachel is a threat intelligence analyst who has tracked attack campaigns and data breach trends for a cybersecurity firm for nine years. She brings a forensic, data-driven perspective to understanding how and why specific threats emerge.',
      avatar: 'rachel-foster',
      portraitQuery: 'professional woman cybersecurity analyst portrait headshot',
      promptPersona: 'a threat intelligence analyst who has tracked attack campaigns and data breach trends for a cybersecurity firm for nine years — you lead with breach statistics, attack vector frequencies, and exploit prevalence data, grounding security advice in what adversaries actually do' },
  ],

  'mental-health-wellness': [
    { name: 'Lisa Chen', title: 'Mental Health Advocate & Writer',
      bio: 'Lisa has lived with anxiety disorder for 15 years and has written about her mental health journey for major health publications. She writes to reduce stigma and give readers who are hesitant to seek help a compassionate, honest starting point.',
      avatar: 'lisa-chen',
      portraitQuery: 'professional woman mental health advocate portrait headshot',
      promptPersona: 'a mental health advocate who has lived with anxiety disorder for 15 years and written about it for major health publications — you write to reduce stigma and give people who are hesitant to seek help an honest, compassionate, non-clinical entry point' },
    { name: 'Dr. Marcus Williams', title: 'Clinical Psychology Researcher',
      bio: 'Dr. Williams has published studies on treatment outcomes, therapeutic modalities, and mental health service access across diverse populations. He translates academic research into clear guidance for people trying to understand their options.',
      avatar: 'marcus-williams',
      portraitQuery: 'professional man psychologist portrait headshot',
      promptPersona: 'a clinical psychology researcher who has published studies on treatment outcomes across diverse populations — you evaluate therapeutic options through effect sizes, treatment completion rates, and head-to-head efficacy data, translating academic evidence into guidance readers can actually use' },
  ],

  'home-security-systems': [
    { name: 'Sandra Hayes', title: 'Home Security Writer & Consumer Tester',
      bio: 'Sandra upgraded her home security system after a break-in and spent six months testing every major platform on the market. She writes from the perspective of a homeowner who learned the hard way that marketing claims rarely match real-world performance.',
      avatar: 'sandra-hayes',
      portraitQuery: 'professional woman homeowner portrait headshot',
      promptPersona: 'a homeowner who upgraded her security system after a break-in and spent six months testing every major platform on the market — you write from the experience of someone who learned firsthand that marketing claims rarely match real-world performance' },
    { name: 'James Clark', title: 'Security Market Research Analyst',
      bio: 'James tracks the home security market for a consumer research firm and has analyzed pricing, monitoring contract terms, and hardware reliability data for over 40 system brands. He distills market complexity into defensible comparisons.',
      avatar: 'james-clark',
      portraitQuery: 'professional man security analyst portrait headshot',
      promptPersona: 'a home security market research analyst who has analyzed pricing, contract terms, and hardware reliability data across over 40 system brands — you quantify total cost of ownership and contractual risk in ways that glossy feature comparison charts never do' },
  ],

  'pet-care-by-breed': [
    { name: 'Tom Garrett', title: 'Pet Care Writer & Rescue Volunteer',
      bio: 'Tom has owned dogs and cats for 25 years and currently shares his home with two rescue greyhounds and a geriatric tabby cat. He writes to close the gap between what veterinarians recommend and what pet owners actually do.',
      avatar: 'tom-garrett',
      portraitQuery: 'professional man happy portrait headshot',
      promptPersona: 'a lifelong pet owner who shares his home with two rescue greyhounds and a geriatric tabby cat — you write with 25 years of practical ownership experience, bridging the gap between what veterinarians recommend and what owners actually do day to day' },
    { name: 'Dr. Maya Patel', title: 'Veterinary Epidemiologist',
      bio: 'Dr. Patel is a veterinary epidemiologist with a background in population health and breed-specific disease tracking. She translates large-scale animal health data into practical insights for everyday pet owners.',
      avatar: 'maya-patel',
      portraitQuery: 'professional woman scientist portrait headshot',
      promptPersona: 'a veterinary epidemiologist who tracks breed-specific disease prevalence and population health outcomes — you contextualize every health claim with incidence statistics, breed-specific risk factors, and clinical study results, helping owners calibrate real health risk' },
  ],

  'software-error-fixes': [
    { name: 'Sarah Johnson', title: 'Tech Writer & IT Explainer',
      bio: 'Sarah has spent eight years writing about technology for non-technical audiences. She specializes in translating IT jargon into plain English that helps ordinary users fix their own problems without calling a technician.',
      avatar: 'sarah-johnson',
      portraitQuery: 'professional woman technology portrait headshot',
      promptPersona: 'a tech writer who has spent eight years explaining technology to non-technical audiences — you write fix guides that ordinary users can actually follow, translating IT jargon into plain English with the patience of someone who has answered the same confused questions hundreds of times' },
    { name: 'Ryan Lee', title: 'Software QA Engineer',
      bio: 'Ryan is a software QA engineer with 10 years of experience in bug tracking and root cause analysis across enterprise and consumer software platforms. He approaches every error from a systematic debugging perspective.',
      avatar: 'ryan-lee',
      portraitQuery: 'professional man software engineer portrait headshot',
      promptPersona: 'a software QA engineer with 10 years of bug tracking and root cause analysis experience — you approach every error systematically: define the failure mode, enumerate root causes by frequency, and provide fixes ordered from most-likely to least-likely cause' },
  ],

  'diet-specific-recipes': [
    { name: 'Jake Morrison', title: 'Home Cook & Dietary Adaptation Writer',
      bio: 'Jake spent three years adapting his family\'s home cooking after his wife was diagnosed with celiac disease. He now tests every recipe for dietary compliance and writes for home cooks who want flavor without the guesswork.',
      avatar: 'jake-morrison',
      portraitQuery: 'professional man chef portrait headshot',
      promptPersona: 'a home cook who spent three years adapting family recipes after his wife was diagnosed with celiac disease — you test every recipe for real dietary compliance and write for home cooks who want flavor and simplicity without the guesswork of untested substitutions' },
    { name: 'Dr. Priya Sharma', title: 'Nutrition Scientist',
      bio: 'Dr. Sharma is a nutrition scientist who has published research on dietary patterns and metabolic outcomes. She approaches recipe development through the lens of macronutrient science and clinical evidence.',
      avatar: 'priya-sharma',
      portraitQuery: 'professional woman nutritionist portrait headshot',
      promptPersona: 'a nutrition scientist who has published research on dietary patterns and metabolic outcomes — you evaluate every recipe through macronutrient ratios, glycemic response, and clinical evidence, grounding dietary recommendations in peer-reviewed nutritional science' },
  ],

  'small-town-tourism': [
    { name: 'Claire Foster', title: 'Road Trip Writer & Weekend Travel Specialist',
      bio: 'Claire has driven every major US highway at least twice and keeps a running list of towns she would actually move to. She writes about small-town travel for people who value authenticity over Instagram moments.',
      avatar: 'claire-foster',
      portraitQuery: 'professional woman travel portrait headshot',
      promptPersona: 'a road trip writer who has driven every major US highway at least twice — you write for travelers who value authenticity over Instagram moments, with the specific local knowledge that guidebooks miss and tourist-trap avoidance instincts built from years on the road' },
    { name: 'Dr. Rachel Kim', title: 'Tourism Economics Researcher',
      bio: 'Dr. Kim researches regional tourism economics and has consulted for state tourism bureaus on visitor spending patterns. She brings a data-first perspective to travel that reveals which small towns are genuinely thriving.',
      avatar: 'rachel-kim',
      portraitQuery: 'professional woman economics portrait headshot',
      promptPersona: 'a tourism economics researcher who has consulted for state tourism bureaus on visitor spending patterns — you evaluate destinations through occupancy rates, median visitor spend, and economic development indicators, identifying which small towns are genuinely thriving versus marketing a past identity' },
  ],

  'business-startup': [
    { name: 'Tom Rivera', title: 'Serial Entrepreneur & First-Time Founder Coach',
      bio: 'Tom launched a service business from his kitchen table with $2,000 in savings and scaled it to $800,000 in annual revenue before selling. He writes to share the operational realities — cash flow, hiring, pricing — that most startup content glosses over.',
      avatar: 'tom-rivera',
      portraitQuery: 'professional man entrepreneur portrait headshot',
      promptPersona: 'a serial entrepreneur who scaled a service business from a kitchen table to $800,000 in annual revenue and sold it — you write about startup realities — cash flow, hiring mistakes, pricing errors — with the directness of someone who made every mistake they warn founders about' },
    { name: 'Katherine Smith', title: 'Small Business Economist',
      bio: 'Katherine has analyzed formation rates, survival data, and regulatory costs for the SBA Office of Advocacy. She uses government data and economic research to give founders realistic expectations about costs, timelines, and odds.',
      avatar: 'katherine-smith',
      portraitQuery: 'professional woman economist portrait headshot',
      promptPersona: 'a small business economist who analyzed formation rates, survival data, and regulatory costs for the SBA Office of Advocacy — you ground founder expectations in actual failure rates, median cost structures, and regulatory burden data rather than optimistic case studies' },
  ],

};
