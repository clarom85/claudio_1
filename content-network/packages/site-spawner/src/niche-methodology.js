/**
 * Per-niche research methodology content.
 * Used by site-spawner (spawn) and regenerate-static-pages (VPS update).
 */

export const NICHE_METHODOLOGY = {
  'home-improvement-costs': {
    title: 'How We Research Home Improvement Costs',
    intro: 'Every cost figure on this site comes from verified sources — not guesswork. Here is exactly how we build, validate, and maintain our pricing data.',
    sources: [
      { name: 'Licensed contractor surveys', detail: 'We survey licensed general contractors, roofers, electricians, plumbers, and HVAC technicians across all 50 states quarterly. Respondents provide labor rates, material costs, and project price ranges for their region.' },
      { name: 'Building permit databases', detail: 'We cross-reference cost estimates against publicly available building permit records from municipal databases, which list declared project values for permitted work.' },
      { name: 'BLS Producer Price Indexes', detail: 'Material costs are tracked against producer price indexes from the U.S. Bureau of Labor Statistics (BLS) for lumber, steel, concrete, copper piping, and roofing materials.' },
      { name: 'Homeowner cost reports', detail: 'We collect self-reported project costs from homeowners who completed renovations, including final invoices where provided. Outliers (top/bottom 10%) are excluded from reported ranges.' },
    ],
    verification: 'All cost ranges are updated quarterly or whenever BLS material indexes shift by more than 5%. Each article displays a "Last reviewed" date. No cost figure older than 12 months is published without re-verification.',
    caveats: 'Costs vary significantly by region, contractor, material quality, and project complexity. Our ranges represent typical U.S. market rates — your actual quote may differ. Always obtain 3+ contractor bids before committing to a project.',
  },
  'personal-finance': {
    title: 'How We Research Personal Finance Data',
    intro: 'Our financial content is grounded in official data sources and reviewed by licensed professionals. Here is how we ensure accuracy.',
    sources: [
      { name: 'Federal Reserve and FDIC data', detail: 'Interest rates, savings yields, and banking statistics are sourced directly from the Federal Reserve H.15 release and FDIC BankFind suite.' },
      { name: 'IRS publications', detail: 'Tax thresholds, contribution limits, and tax code references are verified against current IRS publications and Rev. Procs. We update within 30 days of any IRS announcement.' },
      { name: 'SEC EDGAR filings', detail: 'Investment product data, fund expense ratios, and prospectus disclosures are sourced from SEC EDGAR.' },
      { name: 'Licensed CPA review', detail: 'Articles covering tax strategy and retirement planning are reviewed by a licensed CPA before publication.' },
    ],
    verification: 'Interest rates and yield figures are updated weekly. Tax thresholds are updated annually at the start of each tax year. All articles include publication and last-reviewed dates.',
    caveats: 'This site does not provide personalized financial advice. Content is for informational purposes only. Consult a licensed financial advisor before making investment or tax decisions.',
  },
  'health-symptoms': {
    title: 'How We Research Health Information',
    intro: 'Health content on this site is written by medical professionals and reviewed against peer-reviewed literature. Here is our verification process.',
    sources: [
      { name: 'PubMed and peer-reviewed journals', detail: 'Clinical claims are supported by studies indexed in PubMed, published in journals with established peer-review processes. We cite the primary study, not secondary summaries.' },
      { name: 'CDC and NIH guidelines', detail: 'Diagnostic criteria, treatment protocols, and public health recommendations are verified against current CDC and NIH clinical guidelines.' },
      { name: 'Licensed physician review', detail: 'All symptom and condition articles are reviewed by a licensed MD or DO before publication. The reviewing physician is credited in the article.' },
      { name: 'UpToDate clinical database', detail: 'For complex clinical topics, our writers cross-reference UpToDate, a physician-facing evidence-based clinical decision resource.' },
    ],
    verification: 'Health articles are reviewed every 90 days or sooner when new guidelines are published. We remove or update any content that no longer reflects current medical consensus.',
    caveats: 'This site does not provide medical advice, diagnosis, or treatment recommendations. Always consult a licensed healthcare provider for medical decisions.',
  },
  'insurance-guide': {
    title: 'How We Research Insurance Information',
    intro: 'Our insurance content is built from regulatory filings, licensed agent input, and state insurance department data.',
    sources: [
      { name: 'State insurance department filings', detail: 'Premium rate data and coverage requirements are sourced from state insurance department rate filings, which are public record in most states.' },
      { name: 'Licensed insurance agent review', detail: 'Product comparisons and coverage explanations are reviewed by licensed P&C and life/health insurance agents.' },
      { name: 'NAIC data', detail: 'Market share, complaint ratios, and financial strength data come from the National Association of Insurance Commissioners (NAIC) annual reports.' },
      { name: 'Policy document analysis', detail: 'Coverage descriptions are based on analysis of standard policy forms filed with state regulators — not marketing materials.' },
    ],
    verification: 'Premium estimates are updated quarterly. Regulatory requirements are reviewed annually or after major state legislative sessions.',
    caveats: 'Premiums vary by individual risk factors, location, and underwriting decisions. Use our figures as a starting point only — obtain formal quotes from licensed agents.',
  },
  'legal-advice': {
    title: 'How We Research Legal Information',
    intro: 'Legal content on this site is written by licensed attorneys and grounded in primary legal sources.',
    sources: [
      { name: 'Primary legal sources', detail: 'Federal statutes (U.S. Code), federal regulations (CFR), and state statutes are cited directly. We do not rely on secondary summaries for claims about what the law says.' },
      { name: 'Licensed attorney authorship', detail: 'All legal content is written or reviewed by a licensed attorney. Credentials are verified before publication.' },
      { name: 'Court opinions', detail: 'When relevant case law is cited, we link to the original opinion via CourtListener or Justia.' },
    ],
    verification: 'Legal articles are reviewed after major legislative changes or significant court rulings that affect the topic. Each article displays a jurisdiction scope and effective date.',
    caveats: 'This site provides general legal information, not legal advice. Laws vary by jurisdiction and individual circumstances. Consult a licensed attorney in your jurisdiction for advice specific to your situation.',
  },
  'real-estate-investing': {
    title: 'How We Research Real Estate Data',
    intro: 'Our real estate content draws from public transaction records, licensed appraiser data, and macroeconomic indicators.',
    sources: [
      { name: 'County assessor and recorder records', detail: 'Property transaction prices, tax assessments, and ownership history come from county recorder and assessor databases.' },
      { name: 'FHFA House Price Index', detail: 'Price appreciation figures and market trend data are sourced from the Federal Housing Finance Agency (FHFA) House Price Index.' },
      { name: 'Census Bureau ACS data', detail: 'Rental vacancy rates, median household incomes, and demographic trends come from the U.S. Census Bureau American Community Survey.' },
      { name: 'Licensed appraiser review', detail: 'Valuation methodology articles are reviewed by a licensed real estate appraiser.' },
    ],
    verification: 'Market data is updated quarterly. Cap rate and yield figures are reviewed monthly for active markets.',
    caveats: 'Real estate markets are local and change rapidly. Our figures represent aggregate trends, not specific property values. Consult a licensed real estate professional before making investment decisions.',
  },
  'automotive-guide': {
    title: 'How We Research Automotive Data',
    intro: 'Our vehicle cost, maintenance, and repair content is sourced from verified technical and market data.',
    sources: [
      { name: 'OEM service manuals', detail: 'Maintenance intervals, fluid specifications, and repair procedures are verified against OEM workshop manuals for each vehicle make and model.' },
      { name: 'Mitchell and Chilton labor guides', detail: 'Labor time estimates are cross-referenced against industry-standard labor guides used by professional repair shops.' },
      { name: 'NHTSA recall and safety database', detail: 'Safety recall information is sourced from NHTSA\'s public recall database, checked weekly for updates.' },
      { name: 'ASE-certified mechanic review', detail: 'Technical repair articles are reviewed by an ASE-certified master technician before publication.' },
    ],
    verification: 'Repair cost estimates are updated twice yearly. Recall information is checked against NHTSA weekly.',
    caveats: 'Labor rates and parts costs vary by region and shop. Obtain quotes from multiple repair shops. DIY repairs should only be attempted by those with appropriate skills and tools.',
  },
  'weight-loss-fitness': {
    title: 'How We Research Fitness and Nutrition Data',
    intro: 'Our fitness and nutrition content is grounded in peer-reviewed exercise science and dietetics research.',
    sources: [
      { name: 'PubMed exercise science literature', detail: 'Training protocols, caloric estimates, and metabolic claims are supported by studies in peer-reviewed journals such as the Journal of Strength and Conditioning Research and the American Journal of Clinical Nutrition.' },
      { name: 'USDA FoodData Central', detail: 'Nutritional values and macronutrient data are sourced from the USDA FoodData Central database.' },
      { name: 'ACSM and NSCA guidelines', detail: 'Exercise prescription recommendations follow guidelines from the American College of Sports Medicine (ACSM) and National Strength and Conditioning Association (NSCA).' },
      { name: 'Registered Dietitian review', detail: 'Nutrition and diet articles are reviewed by a Registered Dietitian (RD) before publication.' },
    ],
    verification: 'Nutritional guidelines and exercise recommendations are reviewed annually or when major organizations update their position statements.',
    caveats: 'Individual results vary based on genetics, adherence, starting fitness level, and other factors. Consult a healthcare provider before starting a new exercise or diet program.',
  },
  'cybersecurity-privacy': {
    title: 'How We Research Cybersecurity Information',
    intro: 'Our security content is based on official vulnerability databases, threat intelligence, and review by certified security professionals.',
    sources: [
      { name: 'NIST NVD and CVE database', detail: 'Vulnerability information is sourced from the National Vulnerability Database (NVD) and CVE database maintained by MITRE.' },
      { name: 'CISA advisories', detail: 'Active threat and exploit information is cross-referenced against Cybersecurity and Infrastructure Security Agency (CISA) known exploited vulnerability catalog.' },
      { name: 'Certified security professional review', detail: 'Technical security articles are reviewed by a CISSP or CEH-certified professional before publication.' },
      { name: 'Vendor security bulletins', detail: 'Patch and configuration guidance is verified against official vendor security bulletins, not third-party summaries.' },
    ],
    verification: 'Security advisories are updated within 24 hours of a major CVE publication. Software comparison articles are reviewed quarterly.',
    caveats: 'The threat landscape changes rapidly. Verify the current status of any vulnerability or recommendation against official sources before acting. This site does not provide security consulting.',
  },
  'solar-energy': {
    title: 'How We Research Solar Energy Data',
    intro: 'Our solar cost, savings, and installation data comes from federal databases, utility filings, and certified installer surveys.',
    sources: [
      { name: 'NREL solar resource data', detail: 'Solar irradiance, production estimates, and system performance data are sourced from the National Renewable Energy Laboratory (NREL) PVWatts Calculator and solar resource databases.' },
      { name: 'EIA utility rate data', detail: 'Electricity rates and utility pricing used in payback calculations come from the U.S. Energy Information Administration (EIA) Electric Power Monthly.' },
      { name: 'DSIRE incentive database', detail: 'Federal and state incentive information (tax credits, rebates, net metering policies) is sourced from the Database of State Incentives for Renewables & Efficiency (DSIRE).' },
      { name: 'NABCEP-certified installer surveys', detail: 'Installation cost data is collected from NABCEP-certified solar installers across major U.S. markets quarterly.' },
    ],
    verification: 'Incentive and rate data is reviewed quarterly. NREL production estimates are updated annually. All payback calculations display the electricity rate and incentives assumed.',
    caveats: 'Solar economics depend heavily on local utility rates, roof characteristics, shading, and available incentives. Obtain quotes from multiple NABCEP-certified installers for your specific property.',
  },
};

export const DEFAULT_METHODOLOGY = {
  title: 'How We Research and Verify Our Content',
  intro: 'Every article on this site is produced according to a documented research and verification process. Here is exactly how we build and maintain content quality.',
  sources: [
    { name: 'Primary source priority', detail: 'We cite government agencies, academic institutions, and established industry bodies before secondary sources. Marketing materials and press releases are never used as primary sources.' },
    { name: 'Expert authorship', detail: 'Content is written by subject matter experts with verifiable credentials and real-world experience in the field — not generalist writers.' },
    { name: 'Data cross-referencing', detail: 'Key statistics and figures are verified against at least two independent sources before publication.' },
    { name: 'Reader feedback integration', detail: 'Reader corrections and feedback submitted through our site are reviewed weekly and incorporated into content updates.' },
  ],
  verification: 'All articles are on a 90-day review cycle. Articles are updated sooner when significant new information becomes available. Outdated articles are unpublished rather than left live with stale information.',
  caveats: 'While we strive for accuracy, content is for informational purposes only. Always verify critical information with the relevant professional or official source for your specific situation.',
};

/**
 * Render the methodology page body HTML for a given niche slug.
 */
export function renderMethodologyBody(nicheSlug, domain) {
  const meth = NICHE_METHODOLOGY[nicheSlug] || DEFAULT_METHODOLOGY;
  return `<div style="max-width:800px;margin:40px auto;padding:0 20px">
    <p style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#c0392b;margin:0 0 8px">Research Methodology</p>
    <h1 style="font-size:32px;margin-bottom:16px">${meth.title}</h1>
    <p style="font-size:17px;line-height:1.8;color:#444;margin-bottom:32px;border-bottom:1px solid #eee;padding-bottom:24px">${meth.intro}</p>

    <h2 style="font-size:22px;margin:0 0 16px">Our Data Sources</h2>
    ${meth.sources.map((s, i) => `
    <div style="display:flex;gap:16px;margin-bottom:20px;padding-bottom:20px;border-bottom:1px solid #f0f0f0">
      <div style="flex-shrink:0;width:28px;height:28px;border-radius:50%;background:#c0392b;color:#fff;font-weight:700;font-size:13px;display:flex;align-items:center;justify-content:center;margin-top:2px">${i + 1}</div>
      <div>
        <p style="font-size:15px;font-weight:700;margin:0 0 6px;color:#1a1a2e">${s.name}</p>
        <p style="font-size:15px;line-height:1.75;color:#444;margin:0">${s.detail}</p>
      </div>
    </div>`).join('')}

    <h2 style="font-size:22px;margin:32px 0 12px">How We Keep Information Current</h2>
    <p style="font-size:16px;line-height:1.8;margin-bottom:24px">${meth.verification}</p>

    <h2 style="font-size:22px;margin:32px 0 12px">Important Caveats</h2>
    <div style="background:#fff8e1;border-left:4px solid #f39c12;border-radius:4px;padding:20px 24px;margin-bottom:32px">
      <p style="font-size:15px;line-height:1.8;margin:0;color:#5a4000">${meth.caveats}</p>
    </div>

    <h2 style="font-size:22px;margin:32px 0 12px">Questions About Our Research?</h2>
    <p style="font-size:16px;line-height:1.8;margin-bottom:24px">
      If you spot an error, have a question about a source, or want to suggest an update,
      contact our editorial team at <a href="mailto:editor@${domain}" style="color:#c0392b">editor@${domain}</a>.
      We investigate every reported inaccuracy and respond within 3 business days.
    </p>

    <p style="font-size:14px;color:#999;border-top:1px solid #eee;padding-top:20px;">
      <a href="/editorial-guidelines/" style="color:#c0392b;">Editorial Guidelines</a> ·
      <a href="/editorial-process/" style="color:#c0392b;">Review Process</a> ·
      <a href="/about/" style="color:#c0392b;">About Us</a>
    </p>
  </div>`;
}
