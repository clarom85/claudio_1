/**
 * Data page configurations — 12 niches with genuine FRED relevance.
 * Each produces a "linkable asset" journalists cite organically.
 *
 * Excluded niches (connection to FRED state-level data too weak to be credible):
 *   software-error-fixes, diet-specific-recipes, weight-loss-fitness,
 *   online-education, cybersecurity-privacy, pet-care-by-breed,
 *   small-town-tourism, solar-energy
 *
 * Series types:
 *   HPI  — FHFA House Price Index ({STATE}STHPI)
 *   PCPI — BEA Per Capita Personal Income ({STATE}PCPI)
 *   UR   — BLS Unemployment Rate ({STATE}UR)
 */

export const US_STATES = [
  ['AL','Alabama'],['AK','Alaska'],['AZ','Arizona'],['AR','Arkansas'],
  ['CA','California'],['CO','Colorado'],['CT','Connecticut'],['DE','Delaware'],
  ['FL','Florida'],['GA','Georgia'],['HI','Hawaii'],['ID','Idaho'],
  ['IL','Illinois'],['IN','Indiana'],['IA','Iowa'],['KS','Kansas'],
  ['KY','Kentucky'],['LA','Louisiana'],['ME','Maine'],['MD','Maryland'],
  ['MA','Massachusetts'],['MI','Michigan'],['MN','Minnesota'],['MS','Mississippi'],
  ['MO','Missouri'],['MT','Montana'],['NE','Nebraska'],['NV','Nevada'],
  ['NH','New Hampshire'],['NJ','New Jersey'],['NM','New Mexico'],['NY','New York'],
  ['NC','North Carolina'],['ND','North Dakota'],['OH','Ohio'],['OK','Oklahoma'],
  ['OR','Oregon'],['PA','Pennsylvania'],['RI','Rhode Island'],['SC','South Carolina'],
  ['SD','South Dakota'],['TN','Tennessee'],['TX','Texas'],['UT','Utah'],
  ['VT','Vermont'],['VA','Virginia'],['WA','Washington'],['WV','West Virginia'],
  ['WI','Wisconsin'],['WY','Wyoming'],
];

export const DATA_SERIES = {
  // ── FRED series (state prefix + suffix) ──────────────────────────────────
  HPI: {
    buildId: state => `${state}STHPI`,
    label: 'House Price Index',
    unit: '',
    source: 'Federal Housing Finance Agency (FHFA) via FRED',
    sourceUrl: 'https://fred.stlouisfed.org',
    notes: 'Index value — higher = stronger housing market. Quarterly, not seasonally adjusted.',
    formatValue: v => v.toFixed(1),
    rawFormat: v => v,
  },
  PCPI: {
    buildId: state => `${state}PCPI`,
    label: 'Per Capita Personal Income',
    unit: '$',
    source: 'Bureau of Economic Analysis (BEA) via FRED',
    sourceUrl: 'https://fred.stlouisfed.org',
    notes: 'Annual estimate. Includes wages, salaries, proprietors income, and transfer payments.',
    formatValue: v => `$${Math.round(v).toLocaleString()}`,
    rawFormat: v => Math.round(v),
  },
  UR: {
    buildId: state => `${state}UR`,
    label: 'Unemployment Rate',
    unit: '%',
    source: 'Bureau of Labor Statistics (BLS) via FRED',
    sourceUrl: 'https://fred.stlouisfed.org',
    notes: 'Monthly, seasonally adjusted. Percentage of labor force.',
    formatValue: v => `${v.toFixed(1)}%`,
    rawFormat: v => v,
  },

  // ── EIA (Energy Information Administration) ───────────────────────────────
  EIA_ELEC: {
    label: 'Avg Residential Electricity Price',
    unit: '¢/kWh',
    source: 'U.S. Energy Information Administration (EIA)',
    sourceUrl: 'https://www.eia.gov/electricity/state/',
    notes: 'Monthly retail electricity price for residential customers (cents per kWh). Higher price = stronger solar ROI.',
    formatValue: v => `${v.toFixed(2)}¢/kWh`,
    rawFormat: v => v,
  },

  // ── CDC BRFSS (no API key required) ──────────────────────────────────────
  CDC_OBESITY: {
    label: 'Adult Obesity Rate',
    unit: '%',
    source: 'CDC Behavioral Risk Factor Surveillance System (BRFSS)',
    sourceUrl: 'https://www.cdc.gov/brfss/',
    notes: 'Percent of adults aged 18+ with BMI ≥ 30. Annual telephone survey of 400,000+ US adults.',
    formatValue: v => `${v.toFixed(1)}%`,
    rawFormat: v => v,
  },
  CDC_VEGGIES: {
    label: 'Adults Not Meeting Vegetable Intake Guidelines',
    unit: '%',
    source: 'CDC Behavioral Risk Factor Surveillance System (BRFSS)',
    sourceUrl: 'https://www.cdc.gov/brfss/',
    notes: 'Percent of adults consuming vegetables less than once daily. Annual survey.',
    formatValue: v => `${v.toFixed(1)}%`,
    rawFormat: v => v,
  },

  // ── College Scorecard (api.data.gov, key required) ────────────────────────
  SCORECARD_EARN: {
    label: 'Median Earnings 4 Years After Graduation',
    unit: '$',
    source: 'U.S. Department of Education College Scorecard',
    sourceUrl: 'https://collegescorecard.ed.gov',
    notes: 'Median earnings of former students working and not enrolled 4 years after graduation. State average across all Title IV institutions.',
    formatValue: v => `$${Math.round(v).toLocaleString()}`,
    rawFormat: v => Math.round(v),
  },

  // ── NPS (National Park Service, key required) ────────────────────────────
  NPS_PARKS: {
    label: 'NPS-Managed Sites',
    unit: '',
    source: 'National Park Service (NPS)',
    sourceUrl: 'https://www.nps.gov',
    notes: 'Total number of National Park Service-managed parks, monuments, recreation areas, and historic sites per state.',
    formatValue: v => v.toString(),
    rawFormat: v => v,
  },
};

export const DATA_PAGE_CONFIGS = {

  // ── HPI-based (housing/real-estate niches) ────────────────────────────────

  'home-improvement-costs': {
    slug: 'home-construction-costs-by-state',
    pageTitle: `Home Construction Cost Index by State (${new Date().getFullYear()})`,
    h1: 'Home Construction Cost Index by State',
    metaDescription: `State-by-state House Price Index (HPI) data — the primary indicator of home renovation cost levels across all 50 US states. Source: FHFA via FRED.`,
    seriesType: 'HPI',
    tableIntro: 'States with higher House Price Index values typically see higher costs for renovation materials, labor, and contractor services. Use this table to compare relative home improvement cost factors by state.',
    methodology: 'The Federal Housing Finance Agency (FHFA) House Price Index (HPI) measures the movement of single-family house prices. It is based on transactions involving conforming conventional mortgages purchased or securitized by Fannie Mae or Freddie Mac. The HPI is a weighted, repeat-sales index — meaning it measures average price changes in repeat sales or refinancings on the same properties. Higher index values correlate with higher renovation contractor rates, material costs, and permit fees in that state.',
    citationText: 'Home construction cost data by state',
  },

  'real-estate-investing': {
    slug: 'real-estate-price-index-by-state',
    pageTitle: `Real Estate Price Index by State (${new Date().getFullYear()})`,
    h1: 'FHFA House Price Index by State — Real Estate Market Data',
    metaDescription: `FHFA House Price Index for all 50 US states — essential data for real estate investors evaluating market strength and appreciation potential.`,
    seriesType: 'HPI',
    tableIntro: 'The FHFA HPI measures house price appreciation on a state level. States with rapidly rising indexes signal strong appreciation potential. Investors use this to identify markets with strong price growth momentum before committing capital.',
    methodology: 'The FHFA House Price Index uses repeat-sales methodology to measure house price appreciation. Data comes from conforming conventional mortgage transactions purchased or securitized by Fannie Mae or Freddie Mac. Published quarterly and covering all 50 states. Real estate investors use HPI trends to identify markets with momentum, price ceilings, and relative value.',
    citationText: 'Real estate price appreciation data by state',
  },

  'home-security-systems': {
    slug: 'home-values-by-state',
    pageTitle: `Home Values by State — Security Investment Reference (${new Date().getFullYear()})`,
    h1: 'House Price Index by State — Home Value Reference',
    metaDescription: `FHFA House Price Index data for all 50 states. Higher-value homes warrant greater security investment. Compare home values across the US.`,
    seriesType: 'HPI',
    tableIntro: 'Home value directly determines the appropriate level of security investment. Homes in high-HPI states carry greater asset value that justifies more comprehensive security system installations, professional monitoring, and smart home integration.',
    methodology: 'The FHFA House Price Index (HPI) tracks single-family house price changes across all 50 US states, published quarterly. It uses repeat-sales data from conforming conventional mortgage transactions. Higher HPI values indicate stronger markets where homes carry greater replacement value, justifying investment in professional security monitoring, smart locks, cameras, and alarm systems.',
    citationText: 'Home value data by state for security planning',
  },

  // ── PCPI-based (finance/professional services niches) ────────────────────

  'personal-finance': {
    slug: 'per-capita-income-by-state',
    pageTitle: `Per Capita Personal Income by State (${new Date().getFullYear()})`,
    h1: 'Per Capita Personal Income by State',
    metaDescription: `Bureau of Economic Analysis per capita personal income data for all 50 US states. Essential reference for personal finance planning, budgeting, and savings benchmarking.`,
    seriesType: 'PCPI',
    tableIntro: 'Per capita personal income varies significantly across states — from below $45,000 to over $90,000 annually. This data directly affects realistic budgeting targets, savings rates, retirement projections, and financial benchmarking for individuals and households.',
    methodology: 'Per Capita Personal Income is calculated by the Bureau of Economic Analysis (BEA) and published annually. It represents total personal income for a state divided by its total midyear population. The income measure includes wages and salaries, supplements to wages and salaries, proprietors income, rental income, personal dividend income, personal interest income, and government social benefits minus personal current taxes.',
    citationText: 'Per capita personal income data by state',
  },

  'insurance-guide': {
    slug: 'insurance-affordability-by-state',
    pageTitle: `Insurance Affordability by State (${new Date().getFullYear()})`,
    h1: 'Per Capita Income by State — Insurance Cost Reference',
    metaDescription: `State per capita income data from the BEA to compare insurance premium affordability across all 50 US states. Higher-income states absorb higher premiums.`,
    seriesType: 'PCPI',
    tableIntro: 'Insurance premium affordability is directly tied to local income levels. A $2,000 annual homeowners insurance premium represents a very different burden in a state averaging $45,000 per capita vs. one averaging $75,000. Use this data to contextualize insurance costs in your state.',
    methodology: 'Per Capita Personal Income data from the Bureau of Economic Analysis (BEA) published via FRED. Insurance pricing models factor in regional income levels, property values, and litigation environments. States with higher per capita income typically have higher insurance premiums, but the premium-to-income ratio determines actual affordability.',
    citationText: 'Income-adjusted insurance affordability data by state',
  },

  'legal-advice': {
    slug: 'legal-costs-by-state',
    pageTitle: `Attorney Hourly Rates & Legal Costs by State (${new Date().getFullYear()})`,
    h1: 'Per Capita Income by State — Legal Fee Reference',
    metaDescription: `State per capita income data from the BEA to compare attorney costs and legal service affordability across all 50 US states.`,
    seriesType: 'PCPI',
    tableIntro: 'Attorney hourly rates and legal service costs are priced to local market conditions, which track closely with per capita income. Understanding income levels by state helps set expectations for legal costs before engaging an attorney.',
    methodology: 'Per Capita Personal Income from the Bureau of Economic Analysis (BEA) is the standard proxy for legal service costs. Studies by the National Legal Aid & Defender Association and the American Bar Foundation consistently show that attorney hourly rates in a market correlate with the median household income of that market — typically ranging from 3x to 5x median hourly wages.',
    citationText: 'Legal cost factors by state based on income data',
  },

  'health-symptoms': {
    slug: 'healthcare-affordability-by-state',
    pageTitle: `Healthcare Affordability by State (${new Date().getFullYear()})`,
    h1: 'Per Capita Income by State — Healthcare Cost Comparison',
    metaDescription: `BEA state income data to assess healthcare out-of-pocket cost burdens across all 50 US states. Lower-income states face proportionally higher medical cost burdens.`,
    seriesType: 'PCPI',
    tableIntro: 'Out-of-pocket healthcare costs consume a larger share of income in lower-income states. This index helps patients understand the relative healthcare cost burden in their state and plan for medical expenses accordingly.',
    methodology: 'Per Capita Personal Income data from the Bureau of Economic Analysis (BEA). The Commonwealth Fund and Kaiser Family Foundation research consistently shows that healthcare affordability burdens are highest in lower-income states, where medical costs represent a larger share of household income. This data contextualizes out-of-pocket healthcare spending relative to state economic conditions.',
    citationText: 'Healthcare affordability index by state',
  },

  'credit-cards-banking': {
    slug: 'credit-access-by-state',
    pageTitle: `Credit Access & Income by State (${new Date().getFullYear()})`,
    h1: 'Per Capita Personal Income by State — Credit & Banking Reference',
    metaDescription: `State per capita income data from the BEA — key reference for credit card limits, banking rates, and financial product eligibility across all 50 US states.`,
    seriesType: 'PCPI',
    tableIntro: 'Credit card limits, loan approval rates, and premium banking product eligibility all correlate with state income levels. Higher-income states have consumers with stronger credit profiles, enabling access to better financial products and lower APRs.',
    methodology: 'Per Capita Personal Income from the Bureau of Economic Analysis (BEA). The Federal Reserve\'s Survey of Consumer Finances shows credit access and utilization vary significantly by income level. States with higher per capita income have higher median credit scores, lower default rates, and greater access to premium credit products with better reward programs.',
    citationText: 'Income and credit access data by state',
  },

  'mental-health-wellness': {
    slug: 'therapy-costs-by-state',
    pageTitle: `Therapy & Mental Health Costs by State (${new Date().getFullYear()})`,
    h1: 'Per Capita Income by State — Therapy Cost Comparison',
    metaDescription: `BEA state income data to compare therapist and counseling costs across all 50 US states. Higher-income states have significantly higher therapy session rates.`,
    seriesType: 'PCPI',
    tableIntro: 'Therapist hourly rates vary from $75 to $300+ depending on your state, and track closely with local per capita income levels. Mental health professionals price services based on what the local market can bear.',
    methodology: 'Per Capita Personal Income from the Bureau of Economic Analysis (BEA). The American Psychological Association reports that therapist fees are closely tied to local cost of living and income levels. States with higher per capita income have higher average therapy session costs, but may also have more therapists accepting insurance and sliding-scale fees.',
    citationText: 'Mental health service costs by state',
  },

  'senior-care-medicare': {
    slug: 'senior-care-costs-by-state',
    pageTitle: `Nursing Home & Senior Care Costs by State (${new Date().getFullYear()})`,
    h1: 'Per Capita Income by State — Senior Care Affordability Index',
    metaDescription: `BEA state income data helping families compare nursing home and assisted living affordability across all 50 US states.`,
    seriesType: 'PCPI',
    tableIntro: 'Assisted living and nursing home costs are closely linked to regional income and labor costs. States with higher per capita income have significantly higher senior care facility rates — sometimes 2-3x the cost of lower-income states.',
    methodology: 'Per Capita Personal Income from the Bureau of Economic Analysis (BEA). Genworth\'s Cost of Care Survey consistently shows senior care facility costs track with regional labor costs and per capita income. A private nursing home room averages $108,000/year nationally but ranges from under $70,000 in lower-income states to over $160,000 in the highest-cost states.',
    citationText: 'Senior care cost index by state',
  },

  'business-startup': {
    slug: 'business-startup-costs-by-state',
    pageTitle: `Business Startup Cost Index by State (${new Date().getFullYear()})`,
    h1: 'Per Capita Income by State — Startup Cost & Labor Reference',
    metaDescription: `BEA state income data to compare business startup costs, labor rates, and commercial real estate affordability across all 50 US states.`,
    seriesType: 'PCPI',
    tableIntro: 'Startup costs — commercial rent, employee wages, professional services — all correlate with state per capita income. Understanding local income levels helps entrepreneurs forecast operating costs before choosing where to launch.',
    methodology: 'Per Capita Personal Income from the Bureau of Economic Analysis (BEA). The Kauffman Foundation\'s State of Entrepreneurship reports confirm that business formation costs, including commercial rents and minimum wage floors, are directly tied to regional income levels. This data helps founders make data-informed decisions about business location.',
    citationText: 'Business startup cost index by state',
  },

  // ── EIA-based ─────────────────────────────────────────────────────────────

  'solar-energy': {
    slug: 'electricity-rates-by-state',
    pageTitle: `Residential Electricity Rates by State (${new Date().getFullYear()})`,
    h1: 'Average Residential Electricity Rates by State',
    metaDescription: `EIA monthly residential electricity prices for all 50 US states. Higher electricity rates mean faster solar panel payback and better ROI.`,
    seriesType: 'EIA_ELEC',
    tableIntro: 'Solar panel ROI depends directly on your local electricity rate — the higher you pay per kWh, the faster your system pays for itself. This EIA data shows which states offer the strongest financial case for going solar.',
    methodology: 'Residential electricity price data from the U.S. Energy Information Administration (EIA) monthly Electric Power Monthly report. Values represent the average retail price paid by residential customers in cents per kilowatt-hour (¢/kWh), inclusive of all rates, riders, and taxes. States with higher electricity rates typically see solar payback periods 30-50% shorter than the national average.',
    citationText: 'Residential electricity rate data by state',
  },

  // ── CDC BRFSS-based ───────────────────────────────────────────────────────

  'weight-loss-fitness': {
    slug: 'obesity-rates-by-state',
    pageTitle: `Adult Obesity Rates by State (${new Date().getFullYear()})`,
    h1: 'Adult Obesity Rate by State — CDC BRFSS Data',
    metaDescription: `CDC BRFSS data showing adult obesity rates across all 50 US states. See which states have the highest and lowest rates of obesity.`,
    seriesType: 'CDC_OBESITY',
    tableIntro: 'Adult obesity rates vary dramatically by state — from under 25% in the lowest states to over 40% in the highest. This CDC surveillance data identifies where weight management resources are most needed and helps contextualize local fitness market demand.',
    methodology: 'Data from the CDC Behavioral Risk Factor Surveillance System (BRFSS), an annual telephone survey of more than 400,000 US adults. Obesity is defined as a Body Mass Index (BMI) of 30.0 or higher based on self-reported height and weight. The BRFSS is the world\'s largest continuously conducted health survey system and is the gold standard for state-level health behavioral data.',
    citationText: 'Adult obesity rate data by state from CDC BRFSS',
  },

  'diet-specific-recipes': {
    slug: 'vegetable-consumption-by-state',
    pageTitle: `Vegetable Consumption Rates by State (${new Date().getFullYear()})`,
    h1: 'Adults Not Meeting Vegetable Intake Guidelines — by State',
    metaDescription: `CDC BRFSS data showing the percentage of adults consuming vegetables less than once daily across all 50 US states.`,
    seriesType: 'CDC_VEGGIES',
    tableIntro: 'The percentage of adults who fail to eat vegetables even once per day varies significantly by state — a direct indicator of where dietary education and accessible healthy recipes are most needed.',
    methodology: 'Data from the CDC Behavioral Risk Factor Surveillance System (BRFSS). Respondents were asked how many times per day, week, or month they ate vegetables (not counting salads). Adults consuming vegetables less than once daily are considered below minimum dietary guidelines. The CDC defines the recommended intake as at least 2.5 cups of vegetables daily for adults.',
    citationText: 'Vegetable consumption compliance data by state from CDC BRFSS',
  },

  // ── College Scorecard-based ───────────────────────────────────────────────

  'online-education': {
    slug: 'college-earnings-by-state',
    pageTitle: `College Graduate Earnings by State (${new Date().getFullYear()})`,
    h1: 'Median Post-College Earnings by State',
    metaDescription: `US Department of Education College Scorecard data — median earnings of graduates 4 years after completing their degree, by state. Compare education ROI across all 50 states.`,
    seriesType: 'SCORECARD_EARN',
    tableIntro: 'The financial return on a college degree varies significantly by state. This Department of Education data shows median earnings 4 years after graduation, helping prospective students evaluate where online and in-person degrees deliver the strongest ROI.',
    methodology: 'Data from the US Department of Education College Scorecard (collegescorecard.ed.gov). The earnings metric represents the median annual earnings of former students who received federal financial aid and were working (not enrolled) approximately 4 years after completing their degree program. Values are aggregated across all Title IV-eligible institutions within each state. Data is based on federal tax records matched to student enrollment records.',
    citationText: 'Post-college earnings data by state from US Department of Education',
  },

  // ── NPS-based ─────────────────────────────────────────────────────────────

  'small-town-tourism': {
    slug: 'national-parks-by-state',
    pageTitle: `National Parks & Recreation Sites by State (${new Date().getFullYear()})`,
    h1: 'National Park Service Sites by State',
    metaDescription: `Complete count of NPS-managed national parks, monuments, recreation areas, and historic sites for every US state. Source: National Park Service.`,
    seriesType: 'NPS_PARKS',
    tableIntro: 'States with more NPS-managed sites offer greater variety for small-town road trips and nature tourism. From national parks to historic battlefields to scenic rivers, this data maps where America\'s public outdoor recreation is concentrated.',
    methodology: 'Data from the National Park Service (NPS) official parks API. Counts include all NPS-managed designations: National Parks, National Monuments, National Recreation Areas, National Historic Sites, National Seashores, National Lakeshores, National Parkways, National Trails, and National Preserves. A site that spans multiple states is counted for each state it covers.',
    citationText: 'NPS park and recreation site count by state',
  },

  // ── UR-based ──────────────────────────────────────────────────────────────

  'automotive-guide': {
    slug: 'auto-market-by-state',
    pageTitle: `Auto Market Conditions by State (${new Date().getFullYear()})`,
    h1: 'Unemployment Rate by State — Auto Purchase Index',
    metaDescription: `BLS state unemployment rate data — a key indicator of consumer confidence and new vehicle purchase rates across all 50 US states.`,
    seriesType: 'UR',
    tableIntro: 'New vehicle sales correlate inversely with unemployment rates. States with lower unemployment have stronger consumer confidence, making car purchases more accessible. Dealers in low-unemployment states also tend to have less negotiating flexibility.',
    methodology: 'State unemployment rates from the Bureau of Labor Statistics (BLS) via FRED, published monthly (seasonally adjusted). The University of Michigan Consumer Sentiment Index and auto industry research consistently show vehicle purchase intentions rise when unemployment falls below 4% and drop when it exceeds 6%. This data serves as a leading indicator for auto market conditions by state.',
    citationText: 'Auto market conditions by state based on unemployment data',
  },

};
