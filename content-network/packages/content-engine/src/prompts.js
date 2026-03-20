/**
 * Prompt templates per generazione articoli SEO
 * Progettati per passare Helpful Content Update di Google
 * E-E-A-T compliant: Experience, Expertise, Authority, Trust
 *
 * Ogni nicchia ha: tono, persona, struttura, lunghezza, e regole specifiche distinte
 * per evitare il fingerprint uniforme del modello AI su tutti i siti.
 */

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

// ── Main prompt builder ───────────────────────────────────────────────────────
export function buildArticlePrompt(keyword, niche, options = {}) {
  const cfg = NICHE_PROMPT_CONFIGS[niche.slug] || DEFAULT_NICHE_CONFIG;
  const wordCount = options.targetWordCount || cfg.wordCount;

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
  "authorNote": "1 sentence in first person from direct experience — specific, not generic",
  "keyTakeaways": ["specific takeaway 1", "specific takeaway 2", "specific takeaway 3"],
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "category": "best-fit category for this article (options: ${cfg.categoryHint})",
  "schemaType": "Article or HowTo — use HowTo for step-by-step guides (hint: ${cfg.schemaHint})",
  "citations": [
    {
      "claim": "the specific fact or statistic this source supports",
      "source": "Full organization name (e.g. CDC, IRS, Bureau of Labor Statistics)",
      "url": "https://actual-url.gov/specific-page"
    }
  ]
}

ABSOLUTE RULES:
- No filler openers: never start with "In today's world", "When it comes to", "If you're looking for"
- No filler closers: never use "In conclusion", "As we've seen", "It's important to note"
- Use keyword naturally — max 3-4 times total
- FAQ: 4-6 questions people genuinely search, with direct answers
- Citations: 1-2 REAL sources only — government agencies, major institutions, established industry bodies. Real URLs. Never invent a source.
- Every section must add new information — zero repetition across sections
- Write in American English`;
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
    avatar: 'james-crawford'
  },
  'pet-care-by-breed': {
    name: 'Dr. Sarah Mitchell',
    title: 'Veterinary Behaviorist',
    bio: 'Dr. Mitchell is a certified veterinary behaviorist with 12 years of clinical experience specializing in breed-specific health and behavioral needs. She consults for rescue organizations and writes to close the gap between what vets know and what owners hear.',
    avatar: 'sarah-mitchell'
  },
  'software-error-fixes': {
    name: 'Alex Torres',
    title: 'Senior Systems Engineer',
    bio: 'Alex has 11 years in enterprise IT support and systems engineering, holding CompTIA and Microsoft certifications. He has diagnosed and resolved thousands of software issues across Fortune 500 environments and consumer devices alike.',
    avatar: 'alex-torres'
  },
  'diet-specific-recipes': {
    name: 'Emma Rodriguez',
    title: 'Registered Nutritionist & Recipe Developer',
    bio: 'Emma is a registered nutritionist with 8 years of clinical and culinary experience. She develops diet-specific recipes for clients managing chronic conditions and has contributed to three published nutrition cookbooks.',
    avatar: 'emma-rodriguez'
  },
  'small-town-tourism': {
    name: 'Marcus Webb',
    title: 'Travel Journalist',
    bio: 'Marcus has visited and written about over 300 small towns across North America and Europe for major travel publications. He specializes in the kind of travel that reveals local character rather than polished tourist facades.',
    avatar: 'marcus-webb'
  },
  'personal-finance': {
    name: 'Michael Chen',
    title: 'Certified Financial Planner (CFP)',
    bio: 'Michael is a fee-only CFP with 14 years of experience helping individuals and families build wealth. He has no product affiliations and writes to give readers the same frank advice he gives paying clients.',
    avatar: 'michael-chen'
  },
  'insurance-guide': {
    name: 'Linda Torres',
    title: 'Licensed Insurance Broker & Consumer Advocate',
    bio: 'Linda spent 12 years as a licensed broker before switching to consumer advocacy. She has reviewed thousands of policies and now helps readers understand what their coverage actually covers — and what it does not.',
    avatar: 'linda-torres'
  },
  'legal-advice': {
    name: 'David Kim',
    title: 'Paralegal & Legal Content Specialist',
    bio: 'David is a certified paralegal with 10 years of experience across family law, personal injury, and business litigation. He writes to translate legal complexity into plain English that empowers people to make informed decisions.',
    avatar: 'david-kim'
  },
  'real-estate-investing': {
    name: 'Robert Nash',
    title: 'Real Estate Investor & Licensed Agent',
    bio: 'Robert has been investing in real estate for 18 years and holds a real estate license in three states. His current portfolio includes single-family rentals, a small commercial property, and two short-term rentals.',
    avatar: 'robert-nash'
  },
  'health-symptoms': {
    name: 'Dr. Patricia Moore',
    title: 'Internal Medicine Physician',
    bio: 'Dr. Moore is a board-certified internal medicine physician with 16 years of clinical practice. She writes to give patients the clear, evidence-based information they deserve — the kind that often gets cut short in a 15-minute appointment.',
    avatar: 'patricia-moore'
  },
  'credit-cards-banking': {
    name: 'Jennifer Walsh',
    title: 'Consumer Finance Journalist',
    bio: 'Jennifer has covered personal finance and banking for 9 years, reviewing over 200 credit cards, bank accounts, and financial products. She approaches every comparison with one question: who does this actually benefit?',
    avatar: 'jennifer-walsh'
  },
  'weight-loss-fitness': {
    name: 'Coach Tyler Brooks',
    title: 'NASM-Certified Personal Trainer',
    bio: 'Tyler is an NASM-certified trainer with 11 years of coaching experience and over 500 clients. He specializes in debunking fitness myths and building sustainable programs for people who have tried and failed before.',
    avatar: 'tyler-brooks'
  },
  'automotive-guide': {
    name: 'Frank Russo',
    title: 'ASE Master Technician & Auto Journalist',
    bio: 'Frank is an ASE-certified master technician with 20 years in professional auto repair. He started writing after too many customers came in having been quoted three times the fair price elsewhere.',
    avatar: 'frank-russo'
  },
  'online-education': {
    name: 'Amanda Lee',
    title: 'EdTech Researcher & Career Coach',
    bio: 'Amanda has spent 8 years evaluating online education programs and coaching career changers. She has personally reviewed over 60 platforms and works only with programs that demonstrate real employer recognition.',
    avatar: 'amanda-lee'
  },
  'cybersecurity-privacy': {
    name: 'Sam Okonkwo',
    title: 'Cybersecurity Analyst (CISSP)',
    bio: 'Sam is a CISSP-certified security analyst with 9 years of experience in threat intelligence and incident response. He writes to give ordinary people the 20% of security knowledge that prevents 80% of attacks.',
    avatar: 'sam-okonkwo'
  },
  'mental-health-wellness': {
    name: 'Dr. Rachel Green',
    title: 'Licensed Clinical Psychologist',
    bio: 'Dr. Green is a licensed clinical psychologist with 13 years of practice specializing in anxiety, depression, and trauma. She writes to make evidence-based mental health knowledge accessible to everyone, not just those who can afford therapy.',
    avatar: 'rachel-green'
  },
  'home-security-systems': {
    name: 'Mike Patterson',
    title: 'Security Systems Consultant',
    bio: 'Mike has designed and installed over 1,200 residential security systems across 15 years in the industry. He now consults independently, which means he can tell you what actually works without being tied to any brand.',
    avatar: 'mike-patterson'
  },
  'solar-energy': {
    name: 'Carlos Rivera',
    title: 'Solar Energy Engineer & Consultant',
    bio: 'Carlos is a licensed solar energy engineer who has designed more than 350 residential and commercial installations. He specializes in cutting through the marketing noise to show homeowners what solar actually costs and saves.',
    avatar: 'carlos-rivera'
  },
  'senior-care-medicare': {
    name: 'Nancy Williams',
    title: 'Geriatric Care Manager (CMC)',
    bio: 'Nancy is a Certified Care Manager with 17 years of experience guiding families through Medicare, Medicaid, and senior care decisions. She has helped hundreds of families avoid costly enrollment mistakes and find benefits they didn\'t know existed.',
    avatar: 'nancy-williams'
  },
  'business-startup': {
    name: 'Dana Cooper',
    title: 'Serial Entrepreneur & Business Mentor',
    bio: 'Dana has founded three companies over 14 years — one failed, two succeeded. She now mentors early-stage founders and writes to share the operational realities that most startup content glosses over.',
    avatar: 'dana-cooper'
  },
};
