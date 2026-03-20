/**
 * Category page intro text — per nicchia/categoria
 * Testo pre-scritto (non serve Claude API, zero costo, istantaneo).
 * Sostituisce {{siteName}} al momento della generazione.
 * Target: 100-140 parole — abbastanza per evitare thin content, non troppo da oscurare gli articoli.
 */

const INTROS = {
  'home-improvement-costs': {
    'hvac': {
      headline: 'HVAC & Heating Cost Guides',
      intro: `Heating and cooling account for nearly half of most homes' energy bills — making HVAC one of the biggest home improvement investments you'll face. At {{siteName}}, our HVAC cost guides are researched with input from licensed contractors across the US to give you realistic, region-specific price ranges. Whether you're replacing a central air system, installing a heat pump, or just comparing furnace brands, you'll find straightforward breakdowns of what labor, equipment, and permits actually cost — with no fluff or sales pressure.`,
    },
    'bathroom': {
      headline: 'Bathroom Remodel Cost Guides',
      intro: `A bathroom remodel can range from a $3,000 cosmetic refresh to a $30,000+ full gut renovation — and knowing which factors drive that difference is the key to budgeting correctly. {{siteName}}'s bathroom cost guides break down prices by scope, fixture quality, and region, drawing on contractor data and real homeowner project costs. From walk-in shower conversions to full primary bath renovations, our guides help you set realistic expectations before you call a single contractor.`,
    },
    'kitchen': {
      headline: 'Kitchen Remodel Cost Guides',
      intro: `The kitchen is the most expensive room to remodel — and the one with the highest return on investment. {{siteName}} covers the full cost spectrum of kitchen renovations, from cabinet refacing and countertop replacements to complete layout changes with new plumbing and electrical. Our guides include real cost data by project size and material grade, so you can see what a mid-range kitchen upgrade actually costs versus a high-end renovation before committing to a budget.`,
    },
    'flooring': {
      headline: 'Flooring Installation Cost Guides',
      intro: `Flooring costs vary dramatically by material — from $2/sq ft for basic vinyl plank to $20+/sq ft for premium hardwood or tile. {{siteName}}'s flooring guides help you compare installation costs across every major material: hardwood, LVP, laminate, tile, carpet, and more. Each guide includes labor rates by region, subfloor prep costs, and the hidden expenses most contractors don't quote upfront, so your final bill doesn't come as a surprise.`,
    },
    'deck-patio': {
      headline: 'Deck & Patio Build Cost Guides',
      intro: `A well-built deck or patio adds real living space and strong resale value — but costs can swing wildly based on size, materials, and local permit requirements. {{siteName}}'s deck and patio cost guides cover composite vs. pressure-treated lumber, concrete vs. paver patios, pergola additions, and the permit costs you'll face by region. Whether you're budgeting a basic ground-level deck or a multi-level outdoor living area, our guides give you the numbers contractors expect to charge.`,
    },
    'roofing': {
      headline: 'Roof Replacement Cost Guides',
      intro: `Roof replacement is one of the largest and most urgent home expenses a homeowner faces. Costs depend on your roof size, pitch, material choice, and local labor rates — and quotes from different contractors can vary by thousands of dollars. {{siteName}}'s roofing cost guides break down per-square pricing for asphalt shingles, metal roofing, tile, and flat roofs, plus what to expect for tear-off, decking repairs, and permits, so you can evaluate contractor quotes with confidence.`,
    },
    'windows-doors': {
      headline: 'Window & Door Replacement Cost Guides',
      intro: `New windows and doors improve energy efficiency, security, and curb appeal — but installation costs vary significantly by window type, frame material, and the complexity of the opening. {{siteName}}'s window and door cost guides cover replacement windows, new construction installs, sliding glass doors, entry doors, and garage doors. Each guide includes per-unit labor and material costs, energy efficiency ROI data, and what to watch for when comparing contractor quotes.`,
    },
    'painting': {
      headline: 'Interior & Exterior Painting Cost Guides',
      intro: `Professional painting is one of the fastest ways to transform a home — and one of the most price-variable services contractors offer. Labor rates, paint quality, surface prep, and room count all affect your final bill significantly. {{siteName}}'s painting cost guides cover interior room painting, full house exterior projects, cabinet painting, and specialty finishes. We break down what painters charge per square foot, per room, and per project type so you can budget accurately and spot inflated quotes.`,
    },
    'plumbing': {
      headline: 'Plumbing Cost Guides',
      intro: `Plumbing repairs and replacements carry some of the widest cost ranges of any home service — a minor fix can cost $150 while a full repipe can exceed $15,000. {{siteName}}'s plumbing cost guides cover water heater replacement, pipe repair, drain cleaning, fixture installation, and whole-home repiping. Our guides include flat-rate vs. hourly pricing comparisons, emergency vs. scheduled service cost differences, and the red flags that signal a contractor is overcharging.`,
    },
    'electrical': {
      headline: 'Electrical Work Cost Guides',
      intro: `Electrical work is non-negotiable territory for licensed professionals — and costs reflect both the skill required and the safety liability involved. {{siteName}}'s electrical cost guides cover panel upgrades, EV charger installation, outlet and wiring work, whole-home rewiring, and generator hookups. We include permit costs, typical hourly rates by region, and the questions you should always ask an electrician before signing any estimate.`,
    },
  },

  'pet-care-by-breed': {
    'dogs': {
      headline: 'Dog Care Guides by Breed',
      intro: `Every dog breed comes with its own set of care needs, health risks, and lifetime costs — and understanding those specifics before you bring a dog home can save you thousands in unexpected vet bills. {{siteName}}'s dog breed guides cover grooming requirements, exercise needs, common health conditions, and annual ownership costs for the most popular breeds. Whether you're choosing between a Labrador and a Golden Retriever or trying to understand what owning a French Bulldog really costs, our guides give you the full picture.`,
    },
    'cats': {
      headline: 'Cat Care Guides by Breed',
      intro: `Cats are often described as low-maintenance pets, but breed matters more than most people realize. A Persian's grooming needs and a Maine Coon's medical costs are very different from those of a domestic shorthair. {{siteName}}'s cat breed guides break down care requirements, personality traits, common health problems, and annual ownership costs so you can find a cat that matches your lifestyle and budget — and care for them properly once they're home.`,
    },
    'birds': {
      headline: 'Bird Care Guides',
      intro: `Birds are intelligent, social, and often surprisingly long-lived — a parrot can be a 50-year commitment. {{siteName}}'s bird care guides cover diet, cage requirements, socialization needs, vet costs, and the species-specific challenges of the most popular pet birds. Whether you're considering a parakeet, a cockatiel, or an African Grey parrot, our guides help you understand exactly what responsible bird ownership involves before you make a decades-long commitment.`,
    },
    'small-pets': {
      headline: 'Small Pet Care Guides',
      intro: `Rabbits, hamsters, guinea pigs, and ferrets might be small, but their care needs are more complex than most people expect. {{siteName}}'s small pet guides cover habitat setup, diet, handling, common health issues, and the real annual costs of caring for each species. If you're choosing a first pet for a child or adding a small animal to your home, our guides will help you set up the right environment and avoid the most common care mistakes.`,
    },
    'fish': {
      headline: 'Fish & Aquarium Care Guides',
      intro: `Fishkeeping looks simple from the outside, but water chemistry, tank cycling, and species compatibility make it a surprisingly technical hobby. {{siteName}}'s fish and aquarium guides cover setup costs, filtration, stocking, feeding, and the most common reasons fish die in new tanks. From beginner-friendly betta bowls to fully planted community tanks, our guides help you avoid the expensive trial-and-error phase that catches most new fishkeepers off guard.`,
    },
  },

  'software-error-fixes': {
    'windows': {
      headline: 'Windows Error Fix Guides',
      intro: `Windows errors range from minor annoyances to system-stopping failures — and knowing which fixes actually work versus which waste your time is the difference between a 10-minute resolution and a full reinstall. {{siteName}}'s Windows error guides cover the most common crash codes, update failures, driver conflicts, and performance issues affecting Windows 10 and Windows 11. Each guide is written by a certified systems engineer with step-by-step instructions in plain English, tested on real hardware before publication.`,
    },
    'mac': {
      headline: 'Mac & iOS Error Fix Guides',
      intro: `Apple's ecosystem is known for reliability, but macOS and iOS errors still occur — and when they do, Apple's support documentation can be frustratingly vague. {{siteName}}'s Mac and iOS troubleshooting guides cover startup issues, app crashes, update failures, connectivity problems, and the common errors that follow major macOS version upgrades. Our step-by-step fixes are written for real users, not IT professionals, with clear instructions that don't require Terminal expertise.`,
    },
    'browsers': {
      headline: 'Web Browser Error Fix Guides',
      intro: `Browser errors — from ERR_CONNECTION_REFUSED to video playback failures — affect productivity more than almost any other software issue. {{siteName}}'s browser troubleshooting guides cover Chrome, Firefox, Safari, and Edge, addressing the most common errors users search for every day. Whether it's a stubborn extension conflict, a certificate error, or a browser that simply won't load pages, our guides provide the fastest verified path to a working browser.`,
    },
    'office': {
      headline: 'Microsoft Office Error Fix Guides',
      intro: `Office errors at the wrong moment can derail deadlines and cost hours of work. {{siteName}}'s Microsoft Office troubleshooting guides address the most disruptive errors in Word, Excel, Outlook, and PowerPoint — including file corruption, activation failures, crashing on open, and sync issues with OneDrive. Our fixes are tested on both Microsoft 365 subscription versions and standalone Office installations, with solutions for home users and enterprise environments.`,
    },
    'android': {
      headline: 'Android Error Fix Guides',
      intro: `Android's open ecosystem means more flexibility — and more ways for things to go wrong. {{siteName}}'s Android troubleshooting guides cover the most common issues across Samsung Galaxy, Google Pixel, and other Android devices: apps crashing, system freezes, connectivity failures, battery drain, and update problems. Each guide includes fixes that work without root access, along with escalation steps for issues that require a factory reset or manufacturer support.`,
    },
    'gaming': {
      headline: 'Gaming Error Fix Guides',
      intro: `Gaming errors — from Steam connection failures to game crashes mid-session — are some of the most frustrating tech problems users face. {{siteName}}'s gaming troubleshooting guides cover Steam, Xbox, PlayStation, and common PC gaming errors with fixes that are fast and actually verified to work. Whether it's a DirectX error, a driver conflict causing crashes, or an online connection issue blocking you from a multiplayer session, our guides get you back in the game with minimal downtime.`,
    },
  },

  'diet-specific-recipes': {
    'keto': {
      headline: 'Keto Recipes & Diet Guides',
      intro: `The ketogenic diet eliminates nearly all carbohydrates to push the body into a fat-burning metabolic state — but making it sustainable requires more than just avoiding bread. {{siteName}}'s keto recipe collection focuses on practical, genuinely satisfying meals that keep net carbs under 20g without making you feel like you're constantly missing out. Each recipe includes a full macro breakdown, prep time, and substitution options, developed by our nutrition specialist with years of experience helping clients stick with keto long-term.`,
    },
    'vegan': {
      headline: 'Vegan & Plant-Based Recipes',
      intro: `A well-planned vegan diet is one of the most nutritionally complete eating patterns available — but "well-planned" is the key phrase. {{siteName}}'s vegan recipe guides focus on meals that are protein-adequate, genuinely satisfying, and practical for everyday cooking — not just salads and smoothie bowls. Every recipe includes full nutritional information, notes on key nutrients to watch (B12, iron, omega-3s), and realistic prep times for weeknight cooking.`,
    },
    'gluten-free': {
      headline: 'Gluten-Free Recipes & Guides',
      intro: `Cooking gluten-free successfully goes beyond swapping regular flour for a GF alternative — cross-contamination risks, hidden gluten in processed foods, and the baking science behind wheat-free recipes all require specific knowledge. {{siteName}}'s gluten-free recipe guides are developed for people with celiac disease and gluten sensitivity alike, with clear labeling for certified GF ingredients and step-by-step techniques that produce results as good as their wheat-based counterparts.`,
    },
    'paleo': {
      headline: 'Paleo Recipes & Diet Guides',
      intro: `The paleo diet eliminates grains, legumes, dairy, and processed foods in favor of the whole foods humans evolved eating — but translating that principle into practical, enjoyable everyday meals takes creativity. {{siteName}}'s paleo recipe collection includes quick weeknight dinners, meal-prep friendly lunches, and weekend cooking projects that don't compromise on flavor. Each recipe is verified against strict paleo guidelines, with notes on common ingredients people mistakenly assume are paleo-compliant.`,
    },
    'mediterranean': {
      headline: 'Mediterranean Diet Recipes',
      intro: `The Mediterranean diet consistently ranks as the world's healthiest eating pattern — and unlike most "diets," it's built around abundance rather than restriction. Olive oil, fish, legumes, vegetables, whole grains, and moderate amounts of wine form the foundation. {{siteName}}'s Mediterranean recipe guides translate this research-backed eating style into approachable everyday meals, with a focus on the flavors of Southern Europe and the practical reality of cooking for a North American household.`,
    },
    'low-carb': {
      headline: 'Low-Carb Recipes & Guides',
      intro: `Low-carb eating doesn't mean zero-carb — and finding that sustainable middle ground between standard and ketogenic eating is where most people get the best long-term results. {{siteName}}'s low-carb recipe guides target 50-100g of net carbs per day, a level that supports weight management and blood sugar control without the strict tracking that keto requires. Recipes focus on real food, realistic prep times, and meals the whole family can eat — not just the person watching their carbs.`,
    },
    'intermittent-fasting': {
      headline: 'Intermittent Fasting Guides & Recipes',
      intro: `Intermittent fasting is less about what you eat and more about when — but what you eat during your eating window makes or breaks your results. {{siteName}}'s intermittent fasting guides cover the most popular protocols (16:8, 5:2, OMAD) with practical advice on breaking fasts without spiking insulin, managing hunger during fasting windows, and building eating-window meals that actually keep you full. We also address the specific nutritional considerations for women, athletes, and people over 50.`,
    },
  },

  'small-town-tourism': {
    'weekend-trips': {
      headline: 'Weekend Trip Guides',
      intro: `The best weekend trips aren't the ones you see on every travel blog — they're the ones that feel like genuine discoveries. {{siteName}}'s weekend trip guides cover small towns and destinations that reward the traveler willing to venture past the obvious tourist trails. Each guide includes where to stay, what to eat, the specific things worth your time, and a realistic budget breakdown, so you can plan a memorable two-day escape without the guesswork or the inflated travel magazine prices.`,
    },
    'hidden-gems': {
      headline: 'Hidden Gem Destination Guides',
      intro: `Hidden gems get discovered — that's the nature of travel. But the towns on {{siteName}}'s hidden gems list still have that quality that makes travel feel special: the sense that you've found something before the crowds. Our guides focus on destinations that haven't yet been overrun, the local businesses worth supporting, and the experiences you simply can't have in a major city. We update these guides regularly to reflect which towns are changing and which still feel genuinely off the beaten path.`,
    },
    'food-drink': {
      headline: 'Food & Drink Guides for Small Towns',
      intro: `Small towns punch well above their weight when it comes to food — farm-to-table before it was fashionable, local breweries built by people who actually live there, diners that have been serving the same perfect pie for 40 years. {{siteName}}'s food and drink guides focus on the restaurants, breweries, wineries, and coffee shops in small towns that are worth making a detour for. We skip the chain restaurants and the tourist traps, focusing only on places with genuine local character.`,
    },
    'outdoor': {
      headline: 'Outdoor & Nature Guides',
      intro: `Small towns are often the best base camps for outdoor adventures — closer to the trailhead, cheaper to stay, and free from the congestion that plagues popular national park gateway towns. {{siteName}}'s outdoor guides cover hiking, kayaking, cycling, and nature exploration accessible from small-town starting points, with practical details on trail difficulty, gear requirements, seasonal conditions, and the local outfitters worth using. Whether you're a serious hiker or just looking for a scenic morning walk, our guides help you find the right outdoor experience.`,
    },
    'history': {
      headline: 'History & Culture Guides',
      intro: `America's small towns are living history — from Civil War battlefields and gold rush remnants to immigrant communities that shaped entire industries. {{siteName}}'s history and culture guides go beyond the roadside historical marker to explore the stories, museums, and preserved places that make a town's past genuinely interesting. Each guide is researched with local historical societies and longtime residents to capture context and detail that Wikipedia entries simply don't have.`,
    },
    'accommodation': {
      headline: 'Where to Stay — Small Town Accommodation Guides',
      intro: `Where you stay shapes the entire experience of a small-town trip. The right inn, B&B, or vacation rental puts you in the middle of town within walking distance of everything — the wrong choice leaves you isolated in a highway motel. {{siteName}}'s accommodation guides for small towns focus on lodging options with genuine character: historic inns, owner-operated B&Bs, well-located vacation rentals, and the occasional boutique hotel that gets the atmosphere exactly right. We include honest price ranges and what to expect at each type of property.`,
    },
  },
};

/**
 * Get intro for a specific niche + category.
 * Returns null if not found (caller falls back to generic).
 */
export function getCategoryIntro(nicheSlug, categorySlug) {
  return INTROS[nicheSlug]?.[categorySlug] || null;
}

/**
 * All intros for a niche — used during spawn to pre-generate all category pages.
 */
export function getAllCategoryIntros(nicheSlug) {
  return INTROS[nicheSlug] || {};
}
