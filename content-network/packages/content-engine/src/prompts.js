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
export function buildArticlePrompt(keyword, niche, options = {}) {
  const cfg = NICHE_PROMPT_CONFIGS[niche.slug] || DEFAULT_NICHE_CONFIG;
  const wordCount = options.targetWordCount || getVariedWordCount(cfg.wordCount);
  const liveDataBlock = options.liveDataBlock || '';

  return `You are ${cfg.persona}, writing for a ${niche.name} publication.

ARTICLE TOPIC: "${keyword}"

TONE & VOICE:
${cfg.tone}

STRUCTURE GUIDANCE:
${cfg.structure}

REQUIRED ELEMENTS (every article must include):
${cfg.requiredElements}

WHAT TO AVOID:
${cfg.avoidances}
${liveDataBlock}
WORD COUNT: ${wordCount}–${wordCount + 300} words

OUTPUT FORMAT (return valid JSON only, no markdown wrapper):
{
  "title": "compelling H1 title (50-65 chars, includes keyword naturally)",
  "metaDescription": "compelling meta description (150-160 chars, includes keyword, has CTA)",
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
  "authorNote": "2-3 sentences in first person from direct professional experience — specific anecdote or observation that ONLY someone with real hands-on experience would know. Reference a real situation, client type, or pattern seen repeatedly. Not generic. Example style: 'I've seen this mistake on nearly every job where the homeowner went with the lowest bid — and it always costs more to fix than doing it right the first time.'",
  "expertTip": "1 concise tip (1-2 sentences) that represents insider knowledge — something a professional would tell a friend but that most articles miss. Prefixed naturally with the author's perspective.",
  "keyTakeaways": ["specific takeaway 1", "specific takeaway 2", "specific takeaway 3"],
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "category": "best-fit category for this article (options: ${cfg.categoryHint})",
  "schemaType": "Article or HowTo — use HowTo for step-by-step guides (hint: ${cfg.schemaHint})",
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
