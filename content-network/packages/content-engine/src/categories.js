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
  ],
  'personal-finance': [
    { slug: 'budgeting', name: 'Budgeting', re: /budget|spend|track|50.30|zero.?based/ },
    { slug: 'saving', name: 'Saving Money', re: /sav(e|ing)|high.?yield|emergency.?fund|hys[ae]/ },
    { slug: 'investing', name: 'Investing', re: /invest|stock|etf|index.fund|401k|ira|portfolio/ },
    { slug: 'debt-payoff', name: 'Debt Payoff', re: /debt|pay.?off|avalanche|snowball|loan/ },
    { slug: 'retirement', name: 'Retirement', re: /retire|pension|roth|401k|social.?security/ },
    { slug: 'side-income', name: 'Side Income', re: /side.?hustle|passive.?income|earn.?extra|freelan/ },
  ],
  'insurance-guide': [
    { slug: 'car-insurance', name: 'Car Insurance', re: /car.?insur|auto.?insur|vehicle.?insur/ },
    { slug: 'health-insurance', name: 'Health Insurance', re: /health.?insur|medical.?insur|hmo|ppo|deductible/ },
    { slug: 'life-insurance', name: 'Life Insurance', re: /life.?insur|term.?life|whole.?life|death.?benefit/ },
    { slug: 'home-insurance', name: 'Home Insurance', re: /home.?insur|homeowner|dwelling/ },
    { slug: 'renters-insurance', name: "Renters Insurance", re: /rent(er|ing).?insur/ },
    { slug: 'other-insurance', name: 'Other Insurance', re: /travel.?insur|pet.?insur|disability|umbrella|liability/ },
  ],
  'legal-advice': [
    { slug: 'wills-trusts', name: 'Wills & Trusts', re: /will\b|trust\b|estate.?plan|beneficiary|probate/ },
    { slug: 'landlord-tenant', name: 'Landlord & Tenant', re: /landlord|tenant|renter.?right|evict|lease/ },
    { slug: 'employment-law', name: 'Employment Law', re: /employ|wrongful|terminat|discriminat|workplace|wage/ },
    { slug: 'family-law', name: 'Family Law', re: /divorc|custody|child.?support|alimony|marriage/ },
    { slug: 'small-claims', name: 'Small Claims', re: /small.?claim|sue\b|lawsuit|court/ },
    { slug: 'contracts', name: 'Contracts', re: /contract|agreement|sign|legal.?document|nda/ },
  ],
  'real-estate-investing': [
    { slug: 'rental-property', name: 'Rental Property', re: /rental|rent\b|landlord|cash.?flow|tenant/ },
    { slug: 'house-hacking', name: 'House Hacking', re: /house.?hack|duplex|multi.?family|adu|basement.?unit/ },
    { slug: 'reits', name: 'REITs', re: /reit|real.?estate.?invest.?trust/ },
    { slug: 'flipping', name: 'Fix & Flip', re: /flip|rehab|distressed|fixer/ },
    { slug: 'financing', name: 'Financing', re: /mortgage|loan|down.?payment|hard.?money|dscr/ },
    { slug: 'market-analysis', name: 'Market Analysis', re: /market|appreciation|cap.?rate|roi|analysis/ },
  ],
  'health-symptoms': [
    { slug: 'heart-health', name: 'Heart Health', re: /heart|chest.?pain|blood.?pressure|cholesterol|cardiovasc/ },
    { slug: 'digestive', name: 'Digestive Health', re: /digest|stomach|bloat|ibs|acid.?reflux|gut/ },
    { slug: 'hormonal', name: 'Hormonal Health', re: /thyroid|hormon|testosterone|estrogen|pcos|menopause/ },
    { slug: 'pain-symptoms', name: 'Pain & Fatigue', re: /pain|fatigue|tired|chronic|fibromyal|headache/ },
    { slug: 'mental-symptoms', name: 'Mental Health Symptoms', re: /anxiety|depress|panic|stress|burnout|mental/ },
    { slug: 'sleep', name: 'Sleep Issues', re: /sleep|insomnia|apnea|rest|tired/ },
  ],
  'credit-cards-banking': [
    { slug: 'cash-back', name: 'Cash Back Cards', re: /cash.?back|rewards.?card|flat.?rate/ },
    { slug: 'travel-cards', name: 'Travel Cards', re: /travel.?card|airline|miles|points|lounge/ },
    { slug: 'credit-score', name: 'Credit Score', re: /credit.?score|fico|credit.?report|build.?credit/ },
    { slug: 'balance-transfer', name: 'Balance Transfer', re: /balance.?transfer|0%|zero.?apr|pay.?off.?card/ },
    { slug: 'banking', name: 'Banking', re: /bank|checking|savings.?account|high.?yield|online.?bank/ },
    { slug: 'credit-basics', name: 'Credit Basics', re: /credit.?limit|utilization|hard.?inquiry|credit.?history/ },
  ],
  'weight-loss-fitness': [
    { slug: 'weight-loss', name: 'Weight Loss', re: /weight.?loss|lose.?weight|fat.?loss|calorie.?deficit/ },
    { slug: 'strength-training', name: 'Strength Training', re: /strength|weight.?lift|resistance|muscle|barbell|dumbbell/ },
    { slug: 'cardio', name: 'Cardio & HIIT', re: /cardio|hiit|running|cycling|aerobic/ },
    { slug: 'nutrition', name: 'Nutrition', re: /protein|macro|nutrition|diet\b|calorie|meal.?plan/ },
    { slug: 'home-workouts', name: 'Home Workouts', re: /home.?workout|at.?home|bodyweight|no.?gym/ },
    { slug: 'motivation', name: 'Motivation & Habits', re: /motivat|habit|plateau|consistency|mindset/ },
  ],
  'automotive-guide': [
    { slug: 'car-buying', name: 'Car Buying', re: /buy.?car|new.?car|used.?car|negotiat|dealer|finance.?car/ },
    { slug: 'maintenance', name: 'Maintenance', re: /oil.?change|maintenance|service|tune.?up|filter/ },
    { slug: 'repairs', name: 'Repairs', re: /repair|brake|engine|transmission|cost.?fix/ },
    { slug: 'car-insurance', name: 'Car Insurance', re: /car.?insur|auto.?insur|premium|coverage/ },
    { slug: 'electric-vehicles', name: 'Electric Vehicles', re: /electric|ev\b|tesla|hybrid|charging/ },
    { slug: 'tires-wheels', name: 'Tires & Wheels', re: /tire|wheel|rotation|alignment|rim/ },
  ],
  'online-education': [
    { slug: 'coding', name: 'Coding & Programming', re: /cod(e|ing)|program|python|javascript|bootcamp/ },
    { slug: 'certifications', name: 'Certifications', re: /certif|google|aws|comptia|pmp|coursera/ },
    { slug: 'college-degrees', name: 'Online Degrees', re: /degree|college|university|bachelor|master/ },
    { slug: 'skills-courses', name: 'Skills & Courses', re: /course|skill|udemy|linkedin.learn|masterclass/ },
    { slug: 'career-development', name: 'Career Development', re: /career|job|promot|salary|interview|linkedin/ },
    { slug: 'free-learning', name: 'Free Learning', re: /free|open.?source|youtube|khan|mit.?open/ },
  ],
  'cybersecurity-privacy': [
    { slug: 'password-security', name: 'Password Security', re: /password|manager|lastpass|1password|bitwarden/ },
    { slug: 'phishing', name: 'Phishing & Scams', re: /phish|scam|fraud|social.?engineer|email.?attack/ },
    { slug: 'vpn-privacy', name: 'VPN & Privacy', re: /vpn|privacy|anon|tracking|data.?collect/ },
    { slug: 'device-security', name: 'Device Security', re: /antivirus|malware|ransomware|device|endpoint/ },
    { slug: 'wifi-network', name: 'WiFi & Network', re: /wifi|network|router|firewall|home.?network/ },
    { slug: 'identity-theft', name: 'Identity Theft', re: /identity.?theft|data.?breach|credit.?freeze|ssn/ },
  ],
  'mental-health-wellness': [
    { slug: 'anxiety', name: 'Anxiety', re: /anxiety|anxious|panic|worry|ocd/ },
    { slug: 'depression', name: 'Depression', re: /depress|sad(ness)?|low.?mood|dysthymia/ },
    { slug: 'sleep-wellness', name: 'Sleep & Rest', re: /sleep|insomnia|rest|circadian|bedtime/ },
    { slug: 'stress', name: 'Stress Management', re: /stress|burnout|overwhelm|cortisol/ },
    { slug: 'therapy', name: 'Therapy & Treatment', re: /therapy|therapist|cbt|counseling|psychiatr/ },
    { slug: 'self-care', name: 'Self-Care & Mindfulness', re: /self.?care|mindful|meditat|gratitude|journaling/ },
  ],
  'home-security-systems': [
    { slug: 'cameras', name: 'Security Cameras', re: /camera|ring|arlo|nest.?cam|outdoor.?camera/ },
    { slug: 'alarm-systems', name: 'Alarm Systems', re: /alarm|adt|simplisafe|vivint|monitored/ },
    { slug: 'smart-locks', name: 'Smart Locks', re: /smart.?lock|keypad|deadbolt|schlage|august/ },
    { slug: 'diy-security', name: 'DIY Security', re: /diy|self.?install|no.?monthly|self.?monitor/ },
    { slug: 'professional-monitoring', name: 'Professional Monitoring', re: /professional|monitor|24.?7|contract|monthly.?fee/ },
    { slug: 'video-doorbells', name: 'Video Doorbells', re: /doorbell|video.?door|ring.?door|nest.?door/ },
  ],
  'solar-energy': [
    { slug: 'solar-panels', name: 'Solar Panels', re: /solar.?panel|photovolt|monocrystalline|watt/ },
    { slug: 'costs-savings', name: 'Costs & Savings', re: /cost|price|saving|roi|payback|electric.?bill/ },
    { slug: 'battery-storage', name: 'Battery Storage', re: /battery|storage|powerwall|backup|tesla.?energy/ },
    { slug: 'installation', name: 'Installation', re: /install|roof.?solar|mount|permit|contractor/ },
    { slug: 'incentives', name: 'Incentives & Tax Credits', re: /incentive|tax.?credit|rebate|federal|itc/ },
    { slug: 'solar-companies', name: 'Solar Companies', re: /company|provider|sunrun|sunpower|enphase|review/ },
  ],
  'senior-care-medicare': [
    { slug: 'medicare', name: 'Medicare', re: /medicare|part.?[ab]|supplement|medigap|advantage/ },
    { slug: 'assisted-living', name: 'Assisted Living', re: /assisted.?living|memory.?care|nursing.?home|facility/ },
    { slug: 'in-home-care', name: 'In-Home Care', re: /in.?home|home.?care|caregiver|aide|home.?health/ },
    { slug: 'costs', name: 'Senior Care Costs', re: /cost|pay|afford|medicaid|long.?term.?care/ },
    { slug: 'dementia-care', name: 'Dementia & Alzheimer\'s', re: /dementia|alzheimer|cognitive|memory/ },
    { slug: 'retirement-planning', name: 'Retirement Planning', re: /retire|social.?security|pension|rmd|ira/ },
  ],
  'business-startup': [
    { slug: 'business-ideas', name: 'Business Ideas', re: /idea|niche|side.?business|startup.?idea|opportunity/ },
    { slug: 'legal-setup', name: 'Legal Setup', re: /llc|incorporat|sole.?prop|ein|register|legal/ },
    { slug: 'funding', name: 'Funding & Finance', re: /fund|grant|loan|investor|bootstrap|capital/ },
    { slug: 'marketing', name: 'Marketing', re: /market|seo|social.?media|advertis|branding|customer/ },
    { slug: 'operations', name: 'Operations', re: /operat|process|tool|software|automat|system/ },
    { slug: 'freelancing', name: 'Freelancing', re: /freelan|client|rate|contract|upwork|fiverr/ },
  ],
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
