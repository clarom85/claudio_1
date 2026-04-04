/**
 * Site Spawner — VPS edition
 * Crea directory nginx, virtual host, CSS, pagine statiche
 * Niente Astro, niente build. HTML generato direttamente.
 *
 * Usage: node packages/site-spawner/src/index.js --niche home-improvement-costs --domain homecosthub.com
 */
import 'dotenv/config';
import { writeFileSync, mkdirSync, copyFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import {
  getNicheBySlug, createSite, updateSiteStatus,
  getArticlesBySite, sql
} from '@content-network/db';
import {
  createSiteDirectory, createNginxConfig, reloadNginx,
  generateRobotsTxt, generateAdsTxt, generateSitemap, writeSiteFile, enableSSL
} from '@content-network/vps';
import { setupDomain as cfSetupDomain, purgeCache as cfPurgeCache } from '@content-network/vps/src/cloudflare.js';
import { AUTHOR_PERSONAS, ADDITIONAL_AUTHORS } from '@content-network/content-engine/src/prompts.js';
import { generateAuthors } from '@content-network/content-engine/src/author-generator.js';
import { setupAdditionalAuthor } from '@content-network/vps/src/setup-additional-authors.js';
import { getCategoriesForNiche } from '@content-network/content-engine/src/categories.js';
import { TOOL_CONFIGS } from '@content-network/content-engine/src/tools/tool-configs.js';
import { generateToolPage, generateToolBody } from '@content-network/content-engine/src/tools/tool-generator.js';
import { getAllCategoryIntros } from '@content-network/content-engine/src/category-intros.js';
import { NICHE_METHODOLOGY, DEFAULT_METHODOLOGY, renderMethodologyBody } from './niche-methodology.js';
import { generateGlossaryForSite } from '@content-network/vps/src/generate-glossary.js';
import { generateCostTrackerForSite } from '@content-network/vps/src/generate-cost-tracker.js';
import { generateDataPagesForSite } from '@content-network/vps/src/generate-data-pages.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '../../..');
const TEMPLATES_DIR = join(ROOT, 'templates');
const WWW_ROOT = process.env.WWW_ROOT || '/var/www';

const TEMPLATES = ['pulse', 'tribune', 'nexus', 'echo', 'vortex'];

function getTemplateForWeek(weekNumber, siteIndex) {
  const global = (weekNumber - 1) * 10 + siteIndex;
  return TEMPLATES[Math.floor(global / 10) % TEMPLATES.length];
}

async function run() {
  const args = process.argv.slice(2);
  const nicheSlug = args.find(a => a.startsWith('--niche='))?.split('=')[1]
    || args[args.indexOf('--niche') + 1];
  const domain = args.find(a => a.startsWith('--domain='))?.split('=')[1]
    || args[args.indexOf('--domain') + 1];

  if (!nicheSlug || !domain) {
    console.error('Usage: node index.js --niche <slug> --domain <domain.com>');
    process.exit(1);
  }

  const niche = await getNicheBySlug(nicheSlug);
  if (!niche) { console.error('Niche not found. Run db:migrate first.'); process.exit(1); }

  const weekNumber = getWeekNumber();
  const [{ count }] = await sql`SELECT COUNT(*) as count FROM sites WHERE week_number = ${weekNumber}`;

  // A/B template: se --template specificato usa quello, altrimenti assegna round-robin
  // con leggera randomizzazione per distribuzione uniforme tra tutti i template
  const templateArg = args.find(a => a.startsWith('--template='))?.split('=')[1]
    || args[args.indexOf('--template') + 1];
  const template = templateArg && TEMPLATES.includes(templateArg)
    ? templateArg
    : getTemplateForWeek(weekNumber, parseInt(count));

  // ab_variant = 'A' se template corrisponde a quello di default per la nicchia, 'B' altrimenti
  const abVariant = template === niche.template ? 'A' : 'B';

  const author = AUTHOR_PERSONAS[nicheSlug] || AUTHOR_PERSONAS['home-improvement-costs'];

  console.log(`\n🚀 Site Spawner (VPS)`);
  console.log(`Domain:   ${domain}`);
  console.log(`Niche:    ${niche.name}`);
  console.log(`Template: ${template}`);
  console.log(`Author:   ${author.name}\n`);

  // 1. DB record
  const site = await createSite({
    nicheId: niche.id, domain,
    cfProjectName: domain.replace(/\./g, '-'),
    template, weekNumber
  });

  // Salva ab_variant
  await sql`UPDATE sites SET ab_variant = ${abVariant} WHERE id = ${site.id}`;
  console.log(`A/B Variant: ${abVariant} (template: ${template} vs niche default: ${niche.template})`);

  const siteConfig = {
    id: site.id, domain,
    name: generateSiteName(domain),
    url: `https://${domain}`,
    template,
    authorName: author.name,
    authorTitle: author.title,
    authorBio: author.bio,
    authorAvatar: author.avatar,
    adsenseId: process.env.ADSENSE_ID || '',
    nicheSlug,
    categories: getCategoriesForNiche(niche.slug).slice(0, 7)
  };

  try {
    // 2. Crea directory
    console.log('📁 Creating site directory...');
    createSiteDirectory(domain);

    // 3. CSS dal template
    console.log(`🎨 Writing CSS (template: ${template})...`);
    const { CSS } = await import(`${TEMPLATES_DIR}/${template}/src/layout.js`);
    writeSiteFile(domain, 'assets/style.v2.css', CSS);

    // 4. Favicon SVG bicolore + og:image default
    writeFaviconSVG(domain, siteConfig.name, template);
    writePlaceholderImage(domain, siteConfig.name);

    // 5. robots.txt + ads.txt
    generateRobotsTxt(domain);
    generateAdsTxt(domain, process.env.ADSENSE_ID, process.env.EZOIC_SITE_ID);

    // 6. API endpoints JSON (vuoti inizialmente)
    writeApiFiles(domain, [], niche);

    // 7. Pagine statiche (About, Privacy, Contact, Terms, 404)
    console.log('📄 Generating static pages...');
    await generateStaticPages(domain, siteConfig, template);

    // 7b. Glossary pages (se ci sono termini per la nicchia)
    try {
      const termCount = generateGlossaryForSite({
        domain,
        nicheSlug,
        nicheName: niche.name,
        ga4MeasurementId: siteConfig.ga4MeasurementId || '',
        template,
      });
      if (termCount) console.log(`  ✅ Glossary: ${termCount} terms at /glossary/`);
    } catch (err) {
      console.warn(`  ⚠️  Glossary generation failed (non-blocking): ${err.message}`);
    }

    // 7c. Cost tracker page (if price_snapshots data exists for this niche)
    try {
      const dataPoints = await generateCostTrackerForSite({
        domain,
        nicheSlug,
        nicheName: niche.name,
        ga4MeasurementId: siteConfig.ga4MeasurementId || '',
      });
      if (dataPoints) console.log(`  ✅ Cost Tracker: /cost-tracker/ (${dataPoints} data points)`);
    } catch (err) {
      console.warn(`  ⚠️  Cost tracker generation failed (non-blocking): ${err.message}`);
    }

    // 7c.5. Data pages (FRED economic data — requires FRED_API_KEY)
    try {
      const dataPageCount = await generateDataPagesForSite({
        domain,
        nicheSlug,
        nicheName: niche.name,
        ga4MeasurementId: siteConfig.ga4MeasurementId || '',
      });
      if (dataPageCount) console.log(`  ✅ Data page: /data/ generated`);
    } catch (err) {
      console.warn(`  ⚠️  Data page generation failed (non-blocking): ${err.message}`);
    }

    // 7d. Pagina autore — genera bio lunga + scarica foto
    console.log('👤 Generating author profile...');
    try {
      const sitePublicDir = join(WWW_ROOT, domain);
      const authors = await generateAuthors(nicheSlug, { destDir: sitePublicDir, isVps: true });
      if (authors?.length) {
        await generateAuthorPage(domain, authors[0], siteConfig, template);
        siteConfig.authorData = authors[0]; // salva per usare nella about page
      }
    } catch (err) {
      console.warn(`  ⚠️  Author generation failed (non-blocking): ${err.message}`);
    }

    // 7d.5 — Autori aggiuntivi (immagini Pexels + pagine /author/)
    const extraAuthors = ADDITIONAL_AUTHORS[nicheSlug] || [];
    if (extraAuthors.length > 0) {
      console.log(`👥 Setting up ${extraAuthors.length} additional author(s)...`);
      const extraSiteConfig = { name: siteConfig.name, url: siteConfig.url };
      for (const extraAuthor of extraAuthors) {
        try {
          await setupAdditionalAuthor(extraAuthor, domain, extraSiteConfig, { force: true });
        } catch (err) {
          console.warn(`  ⚠️  Additional author setup failed for ${extraAuthor.name} (non-blocking): ${err.message}`);
        }
      }
    }

    // 7e. Interactive tool page per la nicchia
    const toolConfig = TOOL_CONFIGS[nicheSlug];
    if (toolConfig) {
      console.log(`🔧 Generating interactive tool: ${toolConfig.title}...`);
      try {
        await generateToolFile(domain, toolConfig, siteConfig);
        console.log(`  ✅ Tool: /tools/${toolConfig.slug}/`);
      } catch (err) {
        console.warn(`  ⚠️  Tool generation failed (non-blocking): ${err.message}`);
      }
    }

    // 7f. Category pages con intro text
    console.log('📂 Generating category pages...');
    const categories = getCategoriesForNiche(nicheSlug);
    const categoryIntros = getAllCategoryIntros(nicheSlug);
    for (const cat of categories) {
      generateCategoryPage(domain, cat, categoryIntros[cat.slug], siteConfig);
    }
    console.log(`  ✅ ${categories.length} category pages generated`);

    // 8. Homepage con articoli (vuota inizialmente)
    await generateHomePage(domain, [], siteConfig, template);

    // 9. nginx virtual host
    console.log('⚙️  Configuring nginx...');
    createNginxConfig(domain);
    const reloaded = reloadNginx();
    if (!reloaded) console.warn('  ⚠️  nginx reload failed — check manually');

    // 10. Cloudflare setup (DNS + CDN + SSL + settings)
    const serverIp = process.env.SERVER_IP || '178.104.17.161';
    let nameservers = [];
    if (process.env.CLOUDFLARE_API_TOKEN) {
      try {
        const cf = await cfSetupDomain(domain, serverIp);
        nameservers = cf.nameservers;
        // Con Cloudflare proxy attivo, SSL è gestito da CF — Certbot opzionale
        await updateSiteStatus(site.id, 'live', `https://${domain}`);
      } catch (err) {
        console.warn(`  ⚠️  Cloudflare setup failed (non-blocking): ${err.message}`);
        await updateSiteStatus(site.id, 'live', `http://${domain}`);
      }
    } else {
      // Fallback: SSL manuale con Certbot
      const certbotEmail = process.env.CERTBOT_EMAIL;
      if (certbotEmail) {
        console.log('🔒 Enabling SSL with Certbot...');
        enableSSL(domain, certbotEmail);
      }
      await updateSiteStatus(site.id, 'live', certbotEmail ? `https://${domain}` : `http://${domain}`);
      console.log(`  ℹ️  Set CLOUDFLARE_API_TOKEN in .env for automatic CDN + SSL`);
    }

    // 11. Sitemap completa
    const primarySlug = siteConfig.authorData ? siteConfig.authorData.avatar : (author.avatar || null);
    const extraAuthors = ADDITIONAL_AUTHORS[nicheSlug] || [];
    const authorSlugs = [...(primarySlug ? [primarySlug] : []), ...extraAuthors.map(a => a.avatar)];
    generateSitemap(domain, [], {
      categories,
      authorSlugs,
      toolSlug: toolConfig?.slug || null
    });

    console.log(`\n✅ Site ready: https://${domain}`);
    console.log(`\n📋 Next steps:`);
    if (nameservers.length) {
      console.log(`  1. Set nameservers at your registrar:`);
      nameservers.forEach(ns => console.log(`     → ${ns}`));
      console.log(`  2. Generate keywords: npm run keyword -- --niche ${nicheSlug}`);
      console.log(`  3. Generate content:  npm run content -- --site-id ${site.id} --count 50`);
    } else {
      console.log(`  1. Point DNS A record: ${domain} → ${serverIp}`);
      console.log(`  2. Generate keywords: npm run keyword -- --niche ${nicheSlug}`);
      console.log(`  3. Generate content:  npm run content -- --site-id ${site.id} --count 50`);
    }

  } catch (err) {
    await updateSiteStatus(site.id, 'failed');
    console.error('❌ Spawn failed:', err);
    process.exit(1);
  }

  process.exit(0);
}

const _NICHE_METHODOLOGY_DELETED_IMPORT_FROM_NICHE_METHODOLOGY_JS = {
  'home-improvement-costs': {
    title: 'How We Research Home Improvement Costs',
    intro: 'Every cost figure on this site comes from verified sources — not guesswork. Here is exactly how we build, validate, and maintain our pricing data.',
    sources: [
      { name: 'Licensed contractor surveys', detail: 'We survey licensed general contractors, roofers, electricians, plumbers, and HVAC technicians across all 50 states quarterly. Respondents provide labor rates, material costs, and project price ranges for their region.' },
      { name: 'Building permit databases', detail: 'We cross-reference cost estimates against publicly available building permit records from municipal databases, which list declared project values for permitted work.' },
      { name: 'Material price indexes', detail: 'Material costs are tracked against producer price indexes from the U.S. Bureau of Labor Statistics (BLS) for lumber, steel, concrete, copper piping, and roofing materials.' },
      { name: 'Homeowner cost reports', detail: 'We collect self-reported project costs from homeowners who completed renovations, including final invoices where provided. Outliers (top/bottom 10%) are excluded.' },
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
      { name: 'RepairPal and Mitchell labor guides', detail: 'Labor time estimates are cross-referenced against industry-standard labor guides used by professional repair shops.' },
      { name: 'NHTSA recall and safety database', detail: 'Safety recall information is sourced from NHTSA\'s public recall database.' },
      { name: 'ASE-certified mechanic review', detail: 'Technical repair articles are reviewed by an ASE-certified master technician before publication.' },
    ],
    verification: 'Repair cost estimates are updated twice yearly. Recall information is checked against NHTSA weekly.',
    caveats: 'Labor rates and parts costs vary by region and shop. Obtain quotes from multiple repair shops. DIY repairs should only be attempted by those with appropriate skills and tools.',
  },
};

// Default methodology — now imported from ./niche-methodology.js (kept here for reference only)
const _DEFAULT_METHODOLOGY_UNUSED = {
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

// ── YMYL Disclaimer builder ───────────────────────────────────────────────────
// Returns niche-adapted full legal disclaimer body for YMYL sites.
function buildYmylDisclaimerBody(nicheSlug, domain, siteName) {
  // Niche-type classification
  const isInsurance   = nicheSlug === 'insurance-guide';
  const isLegal       = nicheSlug === 'legal-advice';
  const isMedical     = ['health-symptoms','mental-health-wellness','senior-care-medicare'].includes(nicheSlug);
  const isFinancial   = ['credit-cards-banking','real-estate-investing','personal-finance'].includes(nicheSlug);

  // Niche-specific copy blocks
  const alertText = isInsurance
    ? 'Insurance Information Disclosure — The content on this site is for educational purposes only and does not constitute insurance advice. Always consult a licensed insurance professional before making coverage decisions.'
    : isLegal
    ? 'Legal Information Disclosure — The content on this site is for general informational purposes only and does not constitute legal advice. Always consult a licensed attorney for advice specific to your situation.'
    : isMedical
    ? 'Health Information Disclosure — The content on this site is for general informational purposes only and does not constitute medical advice. Always consult a licensed healthcare professional for advice specific to your health condition.'
    : isFinancial
    ? 'Financial Information Disclosure — The content on this site is for general informational purposes only and does not constitute financial or investment advice. Always consult a licensed financial advisor before making financial decisions.'
    : 'Informational Disclosure — The content on this site is for general informational purposes only and does not constitute professional advice. Always consult a qualified professional for advice specific to your situation.';

  const section1Title = isInsurance ? '1. Not Insurance Advice'
    : isLegal ? '1. Not Legal Advice'
    : isMedical ? '1. Not Medical Advice'
    : isFinancial ? '1. Not Financial Advice'
    : '1. Not Professional Advice';

  const section1Body = isInsurance
    ? `The content published on ${siteName} — including articles, guides, cost estimates, comparisons, and calculator outputs — is provided for <strong>general educational purposes only</strong>. Nothing on this site constitutes insurance advice, and nothing creates an insurance advisor-client relationship between you and ${siteName} or any of its contributors.`
    : isLegal
    ? `The content published on ${siteName} — including articles, guides, and analysis — is provided for <strong>general informational purposes only</strong>. Nothing on this site constitutes legal advice, and nothing creates an attorney-client relationship between you and ${siteName} or any of its contributors.`
    : isMedical
    ? `The content published on ${siteName} — including articles, guides, and symptom information — is provided for <strong>general educational purposes only</strong>. Nothing on this site constitutes medical advice, and nothing creates a doctor-patient relationship between you and ${siteName} or any of its contributors.`
    : isFinancial
    ? `The content published on ${siteName} — including articles, guides, rate comparisons, and calculator outputs — is provided for <strong>general educational purposes only</strong>. Nothing on this site constitutes financial or investment advice, and nothing creates an advisor-client relationship between you and ${siteName} or any of its contributors.`
    : `The content published on ${siteName} is provided for <strong>general informational purposes only</strong>. Nothing on this site constitutes professional advice.`;

  const section2Title = isInsurance ? '2. No Licensed Professional Relationship'
    : isLegal ? '2. No Attorney-Client Relationship'
    : isMedical ? '2. No Doctor-Patient Relationship'
    : isFinancial ? '2. No Advisor-Client Relationship'
    : '2. No Professional Relationship';

  const section2Body = isInsurance
    ? `${siteName} is not a licensed insurance company, agency, or brokerage. Our editors and contributors are not licensed insurance agents or brokers. Information shared on this site does not take into account your personal financial situation, health history, state of residence, or specific coverage needs.`
    : isLegal
    ? `${siteName} is not a law firm and does not provide legal representation. Information shared on this site does not take into account your specific jurisdiction, facts, or legal circumstances. Do not rely on this site as a substitute for professional legal counsel.`
    : isMedical
    ? `${siteName} is not a medical provider and does not provide diagnoses or treatment recommendations. Information shared on this site does not take into account your personal health history, medications, or specific medical conditions. If you are experiencing a medical emergency, call 911 immediately.`
    : isFinancial
    ? `${siteName} is not a registered investment advisor, broker-dealer, or financial planner. Information shared on this site does not take into account your personal financial situation, risk tolerance, tax status, or investment objectives.`
    : `${siteName} does not provide professional advisory services. Information shared on this site does not take into account your personal circumstances.`;

  const section3Title = isInsurance ? '3. Premium and Price Estimates'
    : isFinancial ? '3. Rate and Return Estimates'
    : '3. Cost and Price Estimates';

  const section3Body = isInsurance
    ? `Any insurance premium estimates, average cost figures, or price ranges presented on this site are based on publicly available data, industry surveys, and third-party research. Actual premiums vary significantly based on your age, health status, claims history, coverage amount, deductible, state of residence, and the specific insurer. Estimates should not be treated as quotes.`
    : isFinancial
    ? `Any rate estimates, return projections, or cost figures presented on this site are based on publicly available data, industry averages, and third-party research. Actual rates and returns vary based on market conditions, credit profile, investment strategy, and other individual factors. Estimates should not be treated as guaranteed figures.`
    : `Any cost estimates, price ranges, or average figures presented on this site are based on publicly available data, industry research, and third-party sources. Actual costs vary significantly based on your location, specific circumstances, and market conditions.`;

  const professionalLink = isInsurance
    ? `<a href="https://www.naic.org/consumer_home.htm" rel="nofollow noopener noreferrer" target="_blank" style="color:#c0392b;font-weight:600">NAIC Consumer Insurance Resources</a>`
    : isLegal
    ? `<a href="https://www.americanbar.org/groups/legal_services/flh-home/" rel="nofollow noopener noreferrer" target="_blank" style="color:#c0392b;font-weight:600">ABA Legal Help Resources</a>`
    : isMedical
    ? `<a href="https://www.nih.gov/health-information" rel="nofollow noopener noreferrer" target="_blank" style="color:#c0392b;font-weight:600">NIH Health Information</a>`
    : isFinancial
    ? `<a href="https://www.finra.org/investors" rel="nofollow noopener noreferrer" target="_blank" style="color:#c0392b;font-weight:600">FINRA Investor Resources</a>`
    : `a qualified professional in your area`;

  const professionalCallout = isInsurance
    ? `Before purchasing, canceling, or changing any insurance policy, consult a licensed insurance agent or broker in your state. You can find licensed professionals and verify credentials through your state's Department of Insurance or the ${professionalLink}.`
    : isLegal
    ? `Before taking any legal action or signing any legal document, consult a licensed attorney in your jurisdiction. You can find legal aid and licensed attorneys through the ${professionalLink}.`
    : isMedical
    ? `Before making any health decisions, consult a licensed healthcare professional. For authoritative health information, visit the ${professionalLink}.`
    : isFinancial
    ? `Before making investment, credit, or financial planning decisions, consult a licensed financial advisor. You can verify advisor credentials through the ${professionalLink}.`
    : `Before making important decisions based on this content, consult a qualified professional relevant to your situation.`;

  return `<div style="max-width:800px;margin:40px auto;padding:0 20px;color:#1a1a1a;font-family:Arial,sans-serif">

  <h1 style="font-size:32px;font-weight:700;margin-bottom:8px">Disclaimer</h1>
  <p style="color:#666;font-size:13px;margin-bottom:28px">Last updated: ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>

  <div style="background:#fff8e1;border-left:4px solid #f39c12;padding:16px 20px;border-radius:4px;margin-bottom:32px">
    <p style="margin:0;font-size:15px;line-height:1.7;color:#7d4e00"><strong>&#9888; Important Notice:</strong> ${alertText}</p>
  </div>

  <h2 style="font-size:22px;font-weight:700;margin:32px 0 12px">${section1Title}</h2>
  <p style="font-size:16px;line-height:1.8;margin-bottom:16px">${section1Body}</p>

  <h2 style="font-size:22px;font-weight:700;margin:32px 0 12px">${section2Title}</h2>
  <p style="font-size:16px;line-height:1.8;margin-bottom:16px">${section2Body}</p>

  <h2 style="font-size:22px;font-weight:700;margin:32px 0 12px">${section3Title}</h2>
  <p style="font-size:16px;line-height:1.8;margin-bottom:16px">${section3Body}</p>

  <h2 style="font-size:22px;font-weight:700;margin:32px 0 12px">4. State-by-State and Geographic Variation</h2>
  <p style="font-size:16px;line-height:1.8;margin-bottom:16px">Laws, regulations, costs, and professional requirements vary significantly by state and locality. Content on ${siteName} is written for a general US audience and may not reflect the specific rules, rates, or resources available in your state. Always verify information with local or state-specific sources.</p>

  <h2 style="font-size:22px;font-weight:700;margin:32px 0 12px">5. Accuracy and Currency of Information</h2>
  <p style="font-size:16px;line-height:1.8;margin-bottom:16px">We make every effort to ensure the accuracy and timeliness of information published on ${siteName}. However, the regulatory landscape, market conditions, and professional standards change frequently. We cannot guarantee that all content is current, complete, or accurate at the time you read it. The "Last Reviewed" date shown on each article indicates when the content was last verified.</p>

  <h2 style="font-size:22px;font-weight:700;margin:32px 0 12px">6. References to Third-Party Companies and Products</h2>
  <p style="font-size:16px;line-height:1.8;margin-bottom:16px">Any references to specific companies, products, services, or brands are for illustrative and comparison purposes only. ${siteName} does not endorse any specific company or product. Company information, ratings, and offerings change frequently — always verify directly with the provider before making a decision.</p>

  <h2 style="font-size:22px;font-weight:700;margin:32px 0 12px">7. Affiliate and Advertising Disclosure</h2>
  <p style="font-size:16px;line-height:1.8;margin-bottom:16px">${siteName} may earn a commission when you click links to third-party products or services. This affiliate relationship does not influence our editorial decisions, content, or rankings. We are committed to editorial independence. Sponsored content, when present, is clearly labeled. This disclosure is made in accordance with the <a href="https://www.ftc.gov/business-guidance/resources/disclosures-how-make-effective-disclosures-digital-advertising" rel="nofollow noopener noreferrer" target="_blank" style="color:#c0392b">FTC guidelines on endorsements and testimonials</a>.</p>

  <h2 style="font-size:22px;font-weight:700;margin:32px 0 12px">8. Calculator and Tool Disclaimer</h2>
  <p style="font-size:16px;line-height:1.8;margin-bottom:16px">Interactive calculators and tools on this site are provided for illustrative purposes only. Outputs are estimates based on the inputs you provide and general market data. They do not account for all variables relevant to your specific situation and should not be used as the sole basis for any financial, coverage, or professional decision.</p>

  <h2 style="font-size:22px;font-weight:700;margin:32px 0 12px">9. Third-Party Links</h2>
  <p style="font-size:16px;line-height:1.8;margin-bottom:16px">${siteName} may link to third-party websites for additional information or resources. We do not control the content of external sites and are not responsible for their accuracy, privacy practices, or availability. Links are provided as a convenience and do not constitute an endorsement of the linked site or its content.</p>

  <h2 style="font-size:22px;font-weight:700;margin:32px 0 12px">10. Limitation of Liability</h2>
  <p style="font-size:16px;line-height:1.8;margin-bottom:16px">To the fullest extent permitted by applicable law, ${siteName}, its editors, contributors, and affiliates shall not be liable for any direct, indirect, incidental, special, consequential, or punitive damages arising from your use of, or reliance on, any content, tool, or resource on this site. Your use of this site is entirely at your own risk.</p>

  <h2 style="font-size:22px;font-weight:700;margin:32px 0 12px">11. Consult a Licensed Professional</h2>
  <p style="font-size:16px;line-height:1.8;margin-bottom:16px">${professionalCallout}</p>
  <div style="background:#e8f4fd;border-left:4px solid #3498db;padding:14px 18px;border-radius:4px;margin-bottom:24px">
    <p style="margin:0;font-size:14px;line-height:1.7;color:#1a4f72"><strong>Need help finding a professional?</strong> Use the link above to find a licensed professional in your area. Never make major decisions based solely on information found online.</p>
  </div>

  <h2 style="font-size:22px;font-weight:700;margin:32px 0 12px">12. Contact</h2>
  <p style="font-size:16px;line-height:1.8;margin-bottom:8px">Questions about this Disclaimer? Contact our editorial team:</p>
  <p style="font-size:16px;line-height:1.8">&#128231; <a href="mailto:legal@${domain}" style="color:#c0392b">legal@${domain}</a></p>

</div>`;
}

async function generateStaticPages(domain, siteConfig, template) {
  const { renderBase } = await import(`${TEMPLATES_DIR}/${template}/src/layout.js`);
  const siteName = siteConfig.name;

  const pages = {
    'about/index.html': {
      title: 'About Us',
      noindex: false,
      description: `Learn about ${siteName}, our editorial mission, and the experts behind our content.`,
      body: `<div style="max-width:800px;margin:40px auto;padding:0 20px">
        <h1 style="font-size:32px;margin-bottom:20px">About ${siteName}</h1>
        <p style="font-size:16px;line-height:1.8;margin-bottom:16px">
          ${siteName} was founded on a simple premise: people deserve access to clear,
          expert-level information without having to wade through vague, generic content.
          We publish in-depth guides written by verified subject matter experts with
          real-world experience — not generalists writing about everything.
        </p>
        <p style="font-size:16px;line-height:1.8;margin-bottom:16px">
          Every article on this site goes through our editorial review process before
          publication and is updated regularly to reflect current data, costs, and best practices.
        </p>

        <h2 style="font-size:22px;margin:28px 0 12px">Our Editorial Mission</h2>
        <p style="font-size:16px;line-height:1.8;margin-bottom:16px">
          We are not a content farm. We do not publish articles to rank for keywords —
          we publish articles because real people have real questions that deserve
          substantive, accurate answers. Our editorial team reviews every piece for
          factual accuracy, source quality, and practical value before it goes live.
        </p>

        <h2 style="font-size:22px;margin:28px 0 12px">How We Ensure Accuracy</h2>
        <ul style="font-size:16px;line-height:1.8;margin-bottom:16px;padding-left:24px;">
          <li style="margin-bottom:8px;">Every article is written by a vetted expert in the relevant field</li>
          <li style="margin-bottom:8px;">Claims are supported by citations from government agencies, academic institutions, and established industry bodies</li>
          <li style="margin-bottom:8px;">Articles are reviewed and updated at least every 90 days</li>
          <li style="margin-bottom:8px;">We do not accept sponsored content or payment to influence editorial decisions</li>
          <li style="margin-bottom:8px;">Reader feedback is monitored and incorporated into content updates</li>
        </ul>

        <h2 style="font-size:22px;margin:28px 0 12px">Meet Our Lead Expert</h2>
        <p style="font-size:16px;line-height:1.8;margin-bottom:8px;font-weight:600;">${siteConfig.authorName} — ${siteConfig.authorTitle}</p>
        <p style="font-size:16px;line-height:1.8;margin-bottom:16px">${siteConfig.authorBio}</p>

        <h2 style="font-size:22px;margin:28px 0 12px">Contact Us</h2>
        <p style="font-size:16px;line-height:1.8">
          Have a question, correction, or feedback? We read every message.
          Reach us at <a href="mailto:editor@${domain}" style="color:#c0392b;">editor@${domain}</a>
        </p>
        <p style="font-size:14px;color:#999;margin-top:24px;">
          <a href="/editorial-guidelines/" style="color:#c0392b;">Editorial Guidelines</a> ·
          <a href="/editorial-process/" style="color:#c0392b;">Our Review Process</a>
        </p>
      </div>`
    },
    'privacy/index.html': {
      title: 'Privacy Policy',
      noindex: false,
      description: `Privacy Policy for ${domain} — how we collect, use, and protect your personal information.`,
      body: `<div style="max-width:820px;margin:48px auto;padding:0 20px;color:#1a1a1a">
        <h1 style="font-size:34px;font-weight:700;margin-bottom:8px">Privacy Policy</h1>
        <p style="color:#666;font-size:14px;margin-bottom:8px">Last updated: ${new Date().toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'})}</p>
        <p style="font-size:16px;line-height:1.85;margin-bottom:28px">This Privacy Policy describes how <strong>${siteName}</strong> ("we", "us", "our"), accessible at <strong>${domain}</strong>, collects, uses, discloses, and protects personal information about visitors ("you"). Please read this policy carefully. If you do not agree, please stop using the site.</p>

        <div style="background:#f8f9fa;border:1px solid #e8e8e8;border-radius:6px;padding:18px 22px;margin-bottom:36px">
          <p style="font-size:13px;color:#555;margin:0;line-height:1.7"><strong>Quick summary:</strong> We collect standard analytics data to improve the site. We serve ads through Google AdSense and MGID. We use Cloudflare for security. We do <strong>not</strong> sell your personal data. You can opt out of personalized advertising at any time.</p>
        </div>

        <h2 style="font-size:22px;font-weight:700;margin:36px 0 14px;padding-bottom:10px;border-bottom:2px solid #e8e8e8">1. Data Controller</h2>
        <p style="font-size:16px;line-height:1.85;margin-bottom:16px">The data controller responsible for your personal information is the operator of <strong>${domain}</strong>. For privacy-related questions or requests, contact us at:</p>
        <p style="font-size:16px;line-height:1.85;margin-bottom:16px"><a href="mailto:privacy@${domain}" style="color:#c0392b">privacy@${domain}</a></p>
        <p style="font-size:15px;line-height:1.7;margin-bottom:16px;color:#555">We aim to respond to all privacy requests within <strong>30 days</strong> (or within the statutory period required by applicable law, whichever is shorter).</p>

        <h2 style="font-size:22px;font-weight:700;margin:36px 0 14px;padding-bottom:10px;border-bottom:2px solid #e8e8e8">2. Information We Collect</h2>
        <h3 style="font-size:18px;font-weight:700;margin:20px 0 10px">2.1 Information Collected Automatically</h3>
        <ul style="font-size:16px;line-height:1.85;margin-bottom:16px;padding-left:24px">
          <li style="margin-bottom:8px"><strong>Log data:</strong> IP address (truncated/anonymized), browser type and version, operating system, device type</li>
          <li style="margin-bottom:8px"><strong>Usage data:</strong> pages visited, time on page, scroll depth, exit page, referring URL</li>
          <li style="margin-bottom:8px"><strong>Technical data:</strong> screen resolution, language preference, timezone</li>
          <li style="margin-bottom:8px"><strong>Interaction data:</strong> clicks on links, use of interactive tools (calculators), article feedback votes</li>
          <li style="margin-bottom:8px"><strong>Cookie data:</strong> see Section 5 for full details</li>
        </ul>
        <h3 style="font-size:18px;font-weight:700;margin:20px 0 10px">2.2 Information You Provide Voluntarily</h3>
        <ul style="font-size:16px;line-height:1.85;margin-bottom:16px;padding-left:24px">
          <li style="margin-bottom:8px"><strong>Email address</strong> &mdash; if you subscribe to our newsletter or editorial updates</li>
          <li style="margin-bottom:8px"><strong>Name and message</strong> &mdash; if you contact us via email</li>
          <li style="margin-bottom:8px"><strong>Article feedback</strong> &mdash; thumbs up/down votes (anonymous; not linked to any account)</li>
        </ul>
        <p style="font-size:15px;line-height:1.7;margin-bottom:16px;color:#555">We do <strong>not</strong> operate user accounts, collect payment information, or require registration to access any content.</p>

        <h2 style="font-size:22px;font-weight:700;margin:36px 0 14px;padding-bottom:10px;border-bottom:2px solid #e8e8e8">3. Legal Basis for Processing (GDPR)</h2>
        <p style="font-size:16px;line-height:1.85;margin-bottom:12px">For visitors in the EEA, UK, or Switzerland, we process personal data under the following legal bases (GDPR Article 6):</p>
        <div style="overflow-x:auto;margin-bottom:20px">
          <table style="width:100%;border-collapse:collapse;font-size:14px">
            <thead><tr style="background:#f8f9fa"><th style="padding:10px 12px;text-align:left;border:1px solid #ddd">Purpose</th><th style="padding:10px 12px;text-align:left;border:1px solid #ddd">Legal Basis</th></tr></thead>
            <tbody>
              <tr><td style="padding:9px 12px;border:1px solid #ddd">Analytics (site improvement)</td><td style="padding:9px 12px;border:1px solid #ddd">Legitimate interest (Art. 6(1)(f))</td></tr>
              <tr style="background:#f9f9f9"><td style="padding:9px 12px;border:1px solid #ddd">Personalized advertising</td><td style="padding:9px 12px;border:1px solid #ddd">Consent (Art. 6(1)(a)) &mdash; only after cookie consent</td></tr>
              <tr><td style="padding:9px 12px;border:1px solid #ddd">Newsletter / email updates</td><td style="padding:9px 12px;border:1px solid #ddd">Consent (Art. 6(1)(a)) &mdash; opt-in only</td></tr>
              <tr style="background:#f9f9f9"><td style="padding:9px 12px;border:1px solid #ddd">Responding to inquiries</td><td style="padding:9px 12px;border:1px solid #ddd">Contract / legitimate interest (Art. 6(1)(b)(f))</td></tr>
              <tr><td style="padding:9px 12px;border:1px solid #ddd">Security &amp; fraud prevention</td><td style="padding:9px 12px;border:1px solid #ddd">Legitimate interest (Art. 6(1)(f))</td></tr>
              <tr style="background:#f9f9f9"><td style="padding:9px 12px;border:1px solid #ddd">Legal compliance</td><td style="padding:9px 12px;border:1px solid #ddd">Legal obligation (Art. 6(1)(c))</td></tr>
            </tbody>
          </table>
        </div>

        <h2 style="font-size:22px;font-weight:700;margin:36px 0 14px;padding-bottom:10px;border-bottom:2px solid #e8e8e8">4. How We Use Your Information</h2>
        <ul style="font-size:16px;line-height:1.85;margin-bottom:16px;padding-left:24px">
          <li style="margin-bottom:8px">Operate and maintain the website</li>
          <li style="margin-bottom:8px">Analyze traffic patterns and improve content quality</li>
          <li style="margin-bottom:8px">Serve relevant advertisements via Google AdSense and MGID</li>
          <li style="margin-bottom:8px">Send newsletters and editorial updates (subscribers only)</li>
          <li style="margin-bottom:8px">Respond to your inquiries</li>
          <li style="margin-bottom:8px">Detect and prevent abuse, spam, or security threats</li>
          <li style="margin-bottom:8px">Comply with legal obligations</li>
          <li style="margin-bottom:8px">Aggregate anonymous statistics for content planning</li>
        </ul>
        <p style="font-size:15px;line-height:1.7;margin-bottom:16px;color:#555">We do <strong>not</strong> use your data for automated decision-making or profiling that produces legal effects on you.</p>

        <h2 style="font-size:22px;font-weight:700;margin:36px 0 14px;padding-bottom:10px;border-bottom:2px solid #e8e8e8">5. Cookies &amp; Tracking Technologies</h2>
        <p style="font-size:16px;line-height:1.85;margin-bottom:12px">We use cookies and similar technologies. You can manage preferences via your browser settings or by withdrawing consent through our cookie banner.</p>
        <div style="overflow-x:auto;margin-bottom:16px">
          <table style="width:100%;border-collapse:collapse;font-size:13px">
            <thead><tr style="background:#f8f9fa"><th style="padding:9px 10px;text-align:left;border:1px solid #ddd;min-width:140px">Cookie / Provider</th><th style="padding:9px 10px;text-align:left;border:1px solid #ddd">Category</th><th style="padding:9px 10px;text-align:left;border:1px solid #ddd;min-width:200px">Purpose</th><th style="padding:9px 10px;text-align:left;border:1px solid #ddd">Duration</th></tr></thead>
            <tbody>
              <tr><td style="padding:8px 10px;border:1px solid #ddd"><code>cookie_consent</code></td><td style="padding:8px 10px;border:1px solid #ddd">Essential</td><td style="padding:8px 10px;border:1px solid #ddd">Stores your cookie consent choice</td><td style="padding:8px 10px;border:1px solid #ddd">1 year</td></tr>
              <tr style="background:#f9f9f9"><td style="padding:8px 10px;border:1px solid #ddd">Google Analytics (_ga, _gid, _ga_*)</td><td style="padding:8px 10px;border:1px solid #ddd">Analytics</td><td style="padding:8px 10px;border:1px solid #ddd">Tracks page views, sessions, and user behavior (anonymized)</td><td style="padding:8px 10px;border:1px solid #ddd">_ga: 2 yrs; _gid: 24 hrs</td></tr>
              <tr><td style="padding:8px 10px;border:1px solid #ddd">Google AdSense (__gads, __gpi)</td><td style="padding:8px 10px;border:1px solid #ddd">Advertising</td><td style="padding:8px 10px;border:1px solid #ddd">Delivers personalized or contextual ads; frequency capping</td><td style="padding:8px 10px;border:1px solid #ddd">Up to 2 years</td></tr>
              <tr style="background:#f9f9f9"><td style="padding:8px 10px;border:1px solid #ddd">MGID (mgid_*)</td><td style="padding:8px 10px;border:1px solid #ddd">Advertising</td><td style="padding:8px 10px;border:1px solid #ddd">Native content recommendations; audience segmentation</td><td style="padding:8px 10px;border:1px solid #ddd">Up to 1 year</td></tr>
              <tr><td style="padding:8px 10px;border:1px solid #ddd">Cloudflare (__cf_bm, _cfuvid)</td><td style="padding:8px 10px;border:1px solid #ddd">Security</td><td style="padding:8px 10px;border:1px solid #ddd">Bot management, DDoS protection, security challenges</td><td style="padding:8px 10px;border:1px solid #ddd">30 min &ndash; session</td></tr>
            </tbody>
          </table>
        </div>
        <p style="font-size:15px;line-height:1.7;margin-bottom:16px;color:#555">Advertising cookies are only set <strong>after you accept</strong> our cookie consent banner. Essential and security cookies do not require consent as they are necessary for basic site functionality.</p>

        <h2 style="font-size:22px;font-weight:700;margin:36px 0 14px;padding-bottom:10px;border-bottom:2px solid #e8e8e8">6. Google Analytics 4</h2>
        <p style="font-size:16px;line-height:1.85;margin-bottom:16px">We use <strong>Google Analytics 4 (GA4)</strong> to understand how visitors use our site. IP anonymization is enabled &mdash; your full IP address is never stored. Data is retained for <strong>14 months</strong> then auto-deleted. Google is certified under the EU-US Data Privacy Framework.</p>
        <p style="font-size:16px;line-height:1.85;margin-bottom:16px">Opt out via the <a href="https://tools.google.com/dlpage/gaoptout" style="color:#c0392b" rel="noopener noreferrer">Google Analytics Opt-out Browser Add-on</a>. Reference: <a href="https://policies.google.com/privacy" style="color:#c0392b" rel="noopener noreferrer">Google Privacy Policy</a>.</p>

        <h2 style="font-size:22px;font-weight:700;margin:36px 0 14px;padding-bottom:10px;border-bottom:2px solid #e8e8e8">7. Google AdSense &amp; Advertising</h2>
        <p style="font-size:16px;line-height:1.85;margin-bottom:16px">We participate in <strong>Google AdSense</strong>. Google may use cookies to serve ads based on your interests and prior visits. We also participate in <strong>affiliate marketing programs</strong> &mdash; affiliate relationships are disclosed and do not influence editorial content.</p>
        <p style="font-size:16px;line-height:1.85;margin-bottom:12px">Opt out of personalized advertising:</p>
        <ul style="font-size:16px;line-height:1.85;margin-bottom:16px;padding-left:24px">
          <li style="margin-bottom:6px"><a href="https://www.google.com/settings/ads" style="color:#c0392b" rel="noopener noreferrer">Google Ad Settings</a></li>
          <li style="margin-bottom:6px"><a href="https://www.aboutads.info/choices/" style="color:#c0392b" rel="noopener noreferrer">Digital Advertising Alliance opt-out</a></li>
          <li style="margin-bottom:6px"><a href="https://www.youronlinechoices.eu/" style="color:#c0392b" rel="noopener noreferrer">EDAA opt-out (EU)</a></li>
          <li style="margin-bottom:6px"><a href="https://optout.networkadvertising.org/" style="color:#c0392b" rel="noopener noreferrer">NAI opt-out tool</a></li>
        </ul>

        <h2 style="font-size:22px;font-weight:700;margin:36px 0 14px;padding-bottom:10px;border-bottom:2px solid #e8e8e8">8. MGID Native Advertising</h2>
        <p style="font-size:16px;line-height:1.85;margin-bottom:16px">We use <strong>MGID</strong>, a native advertising platform, to display sponsored content recommendations. MGID may set cookies to deliver relevant content and measure ad performance. MGID is an IAB member. Opt out at <a href="https://www.mgid.com/privacy-policy" style="color:#c0392b" rel="noopener noreferrer">mgid.com/privacy-policy</a>.</p>

        <h2 style="font-size:22px;font-weight:700;margin:36px 0 14px;padding-bottom:10px;border-bottom:2px solid #e8e8e8">9. Cloudflare</h2>
        <p style="font-size:16px;line-height:1.85;margin-bottom:16px">Our website is served through <strong>Cloudflare</strong> for CDN, DDoS protection, bot mitigation, and performance. Traffic passing through Cloudflare's network may include your IP address and request headers for security purposes. Cloudflare acts as a data processor under our Data Processing Addendum. Details: <a href="https://www.cloudflare.com/privacypolicy/" style="color:#c0392b" rel="noopener noreferrer">cloudflare.com/privacypolicy</a>.</p>

        <h2 style="font-size:22px;font-weight:700;margin:36px 0 14px;padding-bottom:10px;border-bottom:2px solid #e8e8e8">10. Third-Party Services</h2>
        <div style="overflow-x:auto;margin-bottom:20px">
          <table style="width:100%;border-collapse:collapse;font-size:14px">
            <thead><tr style="background:#f8f9fa"><th style="padding:9px 12px;text-align:left;border:1px solid #ddd">Service</th><th style="padding:9px 12px;text-align:left;border:1px solid #ddd">Purpose</th><th style="padding:9px 12px;text-align:left;border:1px solid #ddd">Data Processed</th><th style="padding:9px 12px;text-align:left;border:1px solid #ddd">Privacy Policy</th></tr></thead>
            <tbody>
              <tr><td style="padding:8px 12px;border:1px solid #ddd">Google Analytics 4</td><td style="padding:8px 12px;border:1px solid #ddd">Analytics</td><td style="padding:8px 12px;border:1px solid #ddd">Anonymized usage data</td><td style="padding:8px 12px;border:1px solid #ddd"><a href="https://policies.google.com/privacy" style="color:#c0392b" rel="noopener">policies.google.com</a></td></tr>
              <tr style="background:#f9f9f9"><td style="padding:8px 12px;border:1px solid #ddd">Google AdSense</td><td style="padding:8px 12px;border:1px solid #ddd">Display advertising</td><td style="padding:8px 12px;border:1px solid #ddd">Browsing behavior, cookies</td><td style="padding:8px 12px;border:1px solid #ddd"><a href="https://policies.google.com/technologies/ads" style="color:#c0392b" rel="noopener">policies.google.com</a></td></tr>
              <tr><td style="padding:8px 12px;border:1px solid #ddd">MGID</td><td style="padding:8px 12px;border:1px solid #ddd">Native advertising</td><td style="padding:8px 12px;border:1px solid #ddd">Browsing behavior, cookies</td><td style="padding:8px 12px;border:1px solid #ddd"><a href="https://www.mgid.com/privacy-policy" style="color:#c0392b" rel="noopener">mgid.com</a></td></tr>
              <tr style="background:#f9f9f9"><td style="padding:8px 12px;border:1px solid #ddd">Cloudflare</td><td style="padding:8px 12px;border:1px solid #ddd">CDN &amp; Security</td><td style="padding:8px 12px;border:1px solid #ddd">IP address, request metadata</td><td style="padding:8px 12px;border:1px solid #ddd"><a href="https://www.cloudflare.com/privacypolicy/" style="color:#c0392b" rel="noopener">cloudflare.com</a></td></tr>
              <tr><td style="padding:8px 12px;border:1px solid #ddd">Pexels</td><td style="padding:8px 12px;border:1px solid #ddd">Stock photography</td><td style="padding:8px 12px;border:1px solid #ddd">Images downloaded &amp; self-hosted (not via Pexels CDN)</td><td style="padding:8px 12px;border:1px solid #ddd"><a href="https://www.pexels.com/privacy-policy/" style="color:#c0392b" rel="noopener">pexels.com</a></td></tr>
            </tbody>
          </table>
        </div>

        <h2 style="font-size:22px;font-weight:700;margin:36px 0 14px;padding-bottom:10px;border-bottom:2px solid #e8e8e8">11. Data Retention</h2>
        <div style="overflow-x:auto;margin-bottom:20px">
          <table style="width:100%;border-collapse:collapse;font-size:14px">
            <thead><tr style="background:#f8f9fa"><th style="padding:9px 12px;text-align:left;border:1px solid #ddd">Data Type</th><th style="padding:9px 12px;text-align:left;border:1px solid #ddd">Retention Period</th></tr></thead>
            <tbody>
              <tr><td style="padding:8px 12px;border:1px solid #ddd">Google Analytics data</td><td style="padding:8px 12px;border:1px solid #ddd">14 months (GA4 default, then auto-deleted)</td></tr>
              <tr style="background:#f9f9f9"><td style="padding:8px 12px;border:1px solid #ddd">Email subscriber data</td><td style="padding:8px 12px;border:1px solid #ddd">Until you unsubscribe; deleted within 30 days of request</td></tr>
              <tr><td style="padding:8px 12px;border:1px solid #ddd">Contact form inquiries</td><td style="padding:8px 12px;border:1px solid #ddd">12 months from last communication</td></tr>
              <tr style="background:#f9f9f9"><td style="padding:8px 12px;border:1px solid #ddd">Anonymous feedback votes</td><td style="padding:8px 12px;border:1px solid #ddd">Indefinite (no personal data linked)</td></tr>
              <tr><td style="padding:8px 12px;border:1px solid #ddd">Server access logs</td><td style="padding:8px 12px;border:1px solid #ddd">30 days (Cloudflare); 7 days (nginx)</td></tr>
              <tr style="background:#f9f9f9"><td style="padding:8px 12px;border:1px solid #ddd">Cookie consent preference</td><td style="padding:8px 12px;border:1px solid #ddd">1 year (stored in your browser)</td></tr>
            </tbody>
          </table>
        </div>

        <h2 style="font-size:22px;font-weight:700;margin:36px 0 14px;padding-bottom:10px;border-bottom:2px solid #e8e8e8">12. Your GDPR Rights (EEA / UK)</h2>
        <ul style="font-size:16px;line-height:1.85;margin-bottom:16px;padding-left:24px">
          <li style="margin-bottom:10px"><strong>Right of access (Art. 15):</strong> Request a copy of personal data we hold about you.</li>
          <li style="margin-bottom:10px"><strong>Right to rectification (Art. 16):</strong> Request correction of inaccurate or incomplete data.</li>
          <li style="margin-bottom:10px"><strong>Right to erasure (Art. 17):</strong> Request deletion of your personal data where there is no compelling reason to retain it.</li>
          <li style="margin-bottom:10px"><strong>Right to restriction (Art. 18):</strong> Request that we limit how we process your data while a dispute is resolved.</li>
          <li style="margin-bottom:10px"><strong>Right to data portability (Art. 20):</strong> Receive your data in a structured, machine-readable format.</li>
          <li style="margin-bottom:10px"><strong>Right to object (Art. 21):</strong> Object to processing based on legitimate interests, including direct marketing.</li>
          <li style="margin-bottom:10px"><strong>Right to withdraw consent (Art. 7(3)):</strong> Withdraw consent at any time without affecting prior processing.</li>
        </ul>
        <p style="font-size:16px;line-height:1.85;margin-bottom:16px">To exercise these rights, email <a href="mailto:privacy@${domain}" style="color:#c0392b">privacy@${domain}</a>. We will respond within 30 days. You also have the right to lodge a complaint with your local data protection authority (e.g., the ICO in the UK).</p>

        <h2 style="font-size:22px;font-weight:700;margin:36px 0 14px;padding-bottom:10px;border-bottom:2px solid #e8e8e8">13. California Privacy Rights (CCPA / CPRA)</h2>
        <ul style="font-size:16px;line-height:1.85;margin-bottom:16px;padding-left:24px">
          <li style="margin-bottom:8px"><strong>Right to know:</strong> Request disclosure of personal information collected in the past 12 months.</li>
          <li style="margin-bottom:8px"><strong>Right to delete:</strong> Request deletion of personal information (subject to exceptions).</li>
          <li style="margin-bottom:8px"><strong>Right to correct:</strong> Request correction of inaccurate personal information.</li>
          <li style="margin-bottom:8px"><strong>Right to opt-out of sale or sharing:</strong> We do <strong>not</strong> sell personal information.</li>
          <li style="margin-bottom:8px"><strong>Right to non-discrimination:</strong> Exercising your rights will not result in discriminatory treatment.</li>
        </ul>
        <p style="font-size:16px;line-height:1.85;margin-bottom:12px"><strong>Categories of personal information collected (CCPA disclosure):</strong> Identifiers (anonymized IP, cookie IDs); Internet / network activity (pages visited, interactions); Inferences drawn by ad networks (not by us directly).</p>
        <p style="font-size:16px;line-height:1.85;margin-bottom:16px">To exercise California rights, email <a href="mailto:privacy@${domain}" style="color:#c0392b">privacy@${domain}</a>.</p>

        <h2 style="font-size:22px;font-weight:700;margin:36px 0 14px;padding-bottom:10px;border-bottom:2px solid #e8e8e8">14. Do Not Sell My Personal Information</h2>
        <p style="font-size:16px;line-height:1.85;margin-bottom:16px">We do <strong>not</strong> sell personal information to third parties. Third-party advertising networks (Google AdSense, MGID) may use cookie data for targeted advertising per their own privacy policies &mdash; governed by your cookie consent and by the opt-out tools in Sections 7 and 8.</p>

        <h2 style="font-size:22px;font-weight:700;margin:36px 0 14px;padding-bottom:10px;border-bottom:2px solid #e8e8e8">15. International Data Transfers</h2>
        <p style="font-size:16px;line-height:1.85;margin-bottom:16px">Our website and some service providers are based in the United States. If you are in the EEA, UK, or another jurisdiction with data transfer restrictions, your data may be transferred to and processed in the US. We rely on the <strong>EU-US Data Privacy Framework</strong> (Google is certified) and <strong>Standard Contractual Clauses (SCCs)</strong> where applicable.</p>

        <h2 style="font-size:22px;font-weight:700;margin:36px 0 14px;padding-bottom:10px;border-bottom:2px solid #e8e8e8">16. Children's Privacy (COPPA)</h2>
        <p style="font-size:16px;line-height:1.85;margin-bottom:16px">Our website is not directed to children under 13 (or under 16 in the EEA). We do not knowingly collect personal information from minors. If you believe we have inadvertently collected information from a child, contact us at <a href="mailto:privacy@${domain}" style="color:#c0392b">privacy@${domain}</a> and we will delete it promptly.</p>

        <h2 style="font-size:22px;font-weight:700;margin:36px 0 14px;padding-bottom:10px;border-bottom:2px solid #e8e8e8">17. Security</h2>
        <ul style="font-size:16px;line-height:1.85;margin-bottom:16px;padding-left:24px">
          <li style="margin-bottom:8px"><strong>HTTPS/TLS encryption</strong> &mdash; all data in transit is encrypted</li>
          <li style="margin-bottom:8px"><strong>Cloudflare protection</strong> &mdash; DDoS mitigation, bot detection, WAF</li>
          <li style="margin-bottom:8px"><strong>Access controls</strong> &mdash; administrative access limited to authorized personnel</li>
          <li style="margin-bottom:8px"><strong>Regular security updates</strong> &mdash; server software kept up to date</li>
        </ul>
        <p style="font-size:15px;line-height:1.7;margin-bottom:16px;color:#555">No Internet transmission is 100% secure. In the event of a data breach affecting your rights, we will notify affected individuals and relevant authorities as required by law.</p>

        <h2 style="font-size:22px;font-weight:700;margin:36px 0 14px;padding-bottom:10px;border-bottom:2px solid #e8e8e8">18. Third-Party Links</h2>
        <p style="font-size:16px;line-height:1.85;margin-bottom:16px">Our articles contain links to third-party websites for reference. We are not responsible for the privacy practices of those sites. This Privacy Policy applies only to <strong>${domain}</strong>.</p>

        <h2 style="font-size:22px;font-weight:700;margin:36px 0 14px;padding-bottom:10px;border-bottom:2px solid #e8e8e8">19. Changes to This Policy</h2>
        <p style="font-size:16px;line-height:1.85;margin-bottom:16px">We may update this policy to reflect changes in our practices or legal requirements. Material changes will be reflected in an updated "Last updated" date. Continued use of the website after changes are posted constitutes your acknowledgment of the updated policy.</p>

        <h2 style="font-size:22px;font-weight:700;margin:36px 0 14px;padding-bottom:10px;border-bottom:2px solid #e8e8e8">20. Contact &amp; Data Protection Inquiries</h2>
        <div style="background:#f8f9fa;border:1px solid #e8e8e8;border-radius:6px;padding:20px 24px;margin-bottom:20px">
          <p style="font-size:15px;line-height:1.7;margin:0 0 8px"><strong>Privacy requests &amp; data rights:</strong> <a href="mailto:privacy@${domain}" style="color:#c0392b">privacy@${domain}</a></p>
          <p style="font-size:15px;line-height:1.7;margin:0 0 8px"><strong>General contact:</strong> <a href="mailto:contact@${domain}" style="color:#c0392b">contact@${domain}</a></p>
          <p style="font-size:15px;line-height:1.7;margin:0"><strong>Website:</strong> <a href="https://${domain}" style="color:#c0392b">${domain}</a></p>
        </div>
        <p style="font-size:15px;line-height:1.7;color:#555">If you are in the EU/UK and are unsatisfied with our response, you have the right to lodge a complaint with your local supervisory authority (e.g., <a href="https://ico.org.uk" style="color:#c0392b" rel="noopener noreferrer">ICO</a> in the UK).</p>
      </div>`
    },
    'terms/index.html': {
      title: 'Terms of Service',
      noindex: true,
      description: `Terms of service for ${domain}`,
      body: `<div style="max-width:800px;margin:40px auto;padding:0 20px">
        <h1 style="font-size:32px;margin-bottom:8px">Terms of Service</h1>
        <p style="color:#999;margin-bottom:32px">Last updated: ${new Date().toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'})}</p>

        <p style="font-size:16px;line-height:1.8;margin-bottom:24px">These Terms of Service ("Terms") govern your access to and use of ${domain} (the "Site"), operated by ${siteName}. By accessing or using the Site, you agree to be bound by these Terms. If you do not agree, please do not use the Site.</p>

        <h2 style="font-size:22px;margin:32px 0 12px">1. Acceptance of Terms</h2>
        <p style="font-size:16px;line-height:1.8;margin-bottom:16px">By accessing ${domain}, you confirm that you are at least 13 years of age, have read and understood these Terms, and agree to be bound by them. We reserve the right to modify these Terms at any time. Continued use of the Site after changes constitutes acceptance of the updated Terms.</p>

        <h2 style="font-size:22px;margin:32px 0 12px">2. Use of the Site</h2>
        <p style="font-size:16px;line-height:1.8;margin-bottom:16px">You may use the Site for lawful purposes only. You agree not to:</p>
        <ul style="font-size:16px;line-height:1.8;margin-bottom:16px;padding-left:24px">
          <li style="margin-bottom:8px">Use the Site in any way that violates applicable laws or regulations</li>
          <li style="margin-bottom:8px">Scrape, crawl, or harvest content from the Site in bulk without written permission</li>
          <li style="margin-bottom:8px">Reproduce, republish, or redistribute our content without attribution and a link back to the original</li>
          <li style="margin-bottom:8px">Attempt to gain unauthorized access to any part of the Site or its servers</li>
          <li style="margin-bottom:8px">Transmit malware, viruses, or any harmful code</li>
          <li style="margin-bottom:8px">Use automated tools to interact with the Site in a way that disrupts normal operation</li>
        </ul>

        <h2 style="font-size:22px;margin:32px 0 12px">3. Intellectual Property</h2>
        <p style="font-size:16px;line-height:1.8;margin-bottom:16px">All content on ${domain}, including but not limited to text, images, graphics, logos, and editorial content, is the property of ${siteName} and is protected by applicable copyright, trademark, and intellectual property laws.</p>
        <p style="font-size:16px;line-height:1.8;margin-bottom:16px">You may share individual articles for non-commercial purposes provided you clearly attribute ${siteName} and include a hyperlink to the original article. Commercial reproduction or republication without express written permission is prohibited.</p>

        <h2 style="font-size:22px;margin:32px 0 12px">4. Disclaimer of Warranties</h2>
        <p style="font-size:16px;line-height:1.8;margin-bottom:16px">The content on ${domain} is provided for general informational purposes only. While we strive to ensure accuracy and timeliness, we make no representations or warranties of any kind, express or implied, about:</p>
        <ul style="font-size:16px;line-height:1.8;margin-bottom:16px;padding-left:24px">
          <li style="margin-bottom:8px">The completeness, accuracy, or reliability of any content</li>
          <li style="margin-bottom:8px">The fitness of any content for a particular purpose</li>
          <li style="margin-bottom:8px">The availability or uninterrupted access to the Site</li>
          <li style="margin-bottom:8px">That the Site is free from viruses or other harmful components</li>
        </ul>
        <p style="font-size:16px;line-height:1.8;margin-bottom:16px"><strong>Nothing on this Site constitutes professional advice</strong> — including legal, financial, medical, or construction advice. Always consult a qualified professional before making decisions based on information found on this Site.</p>

        <h2 style="font-size:22px;margin:32px 0 12px">5. Limitation of Liability</h2>
        <p style="font-size:16px;line-height:1.8;margin-bottom:16px">To the fullest extent permitted by law, ${siteName} shall not be liable for any direct, indirect, incidental, special, consequential, or punitive damages arising from your use of or inability to use the Site or its content, even if we have been advised of the possibility of such damages.</p>

        <h2 style="font-size:22px;margin:32px 0 12px">6. Third-Party Links</h2>
        <p style="font-size:16px;line-height:1.8;margin-bottom:16px">The Site may contain links to third-party websites. These links are provided for your convenience only. We have no control over the content of those sites and accept no responsibility for them or for any loss or damage that may arise from your use of them.</p>

        <h2 style="font-size:22px;margin:32px 0 12px">7. Advertising and Affiliate Relationships</h2>
        <p style="font-size:16px;line-height:1.8;margin-bottom:16px">The Site displays advertising served by Google AdSense and may participate in affiliate marketing programs. When you click on affiliate links, we may earn a commission at no additional cost to you. Advertising relationships do not influence our editorial content or recommendations.</p>

        <h2 style="font-size:22px;margin:32px 0 12px">8. Email Newsletter</h2>
        <p style="font-size:16px;line-height:1.8;margin-bottom:16px">If you subscribe to our email newsletter, you agree to receive periodic editorial content from us. You may unsubscribe at any time by clicking the unsubscribe link in any email. We will not share your email address with third parties for marketing purposes.</p>

        <h2 style="font-size:22px;margin:32px 0 12px">9. Privacy</h2>
        <p style="font-size:16px;line-height:1.8;margin-bottom:16px">Your use of the Site is also governed by our <a href="/privacy/" style="color:#c0392b">Privacy Policy</a>, which is incorporated into these Terms by reference.</p>

        <h2 style="font-size:22px;margin:32px 0 12px">10. Indemnification</h2>
        <p style="font-size:16px;line-height:1.8;margin-bottom:16px">You agree to indemnify and hold harmless ${siteName}, its editors, contributors, and affiliates from any claim, liability, damage, or expense (including reasonable legal fees) arising from your use of the Site or violation of these Terms.</p>

        <h2 style="font-size:22px;margin:32px 0 12px">11. Governing Law</h2>
        <p style="font-size:16px;line-height:1.8;margin-bottom:16px">These Terms shall be governed by and construed in accordance with applicable law. Any disputes arising under these Terms shall be subject to the exclusive jurisdiction of the competent courts.</p>

        <h2 style="font-size:22px;margin:32px 0 12px">12. Contact Us</h2>
        <p style="font-size:16px;line-height:1.8;margin-bottom:8px">Questions about these Terms? Contact us:</p>
        <p style="font-size:16px;line-height:1.8">📧 <a href="mailto:legal@${domain}" style="color:#c0392b">legal@${domain}</a></p>
      </div>`
    },
    'disclaimer/index.html': (() => {
      const author = AUTHOR_PERSONAS[siteConfig.nicheSlug] || {};
      const isYmyl = author.ymyl === true;
      return {
        title: 'Disclaimer',
        noindex: !isYmyl,   // YMYL sites: disclaimer indexed (AdSense/trust signal)
        description: isYmyl
          ? `Legal disclaimer for ${siteName} — not professional advice, affiliate disclosure, limitation of liability.`
          : `Disclaimer for ${domain}`,
        body: isYmyl
          ? buildYmylDisclaimerBody(siteConfig.nicheSlug, domain, siteName)
          : `<div style="max-width:800px;margin:40px auto;padding:0 20px">
        <h1 style="font-size:32px;margin-bottom:16px">Disclaimer</h1>
        <p style="font-size:16px;line-height:1.8;margin-bottom:16px">The information provided on ${siteName} is for general informational purposes only. While we strive to keep information accurate and up-to-date, we make no representations or warranties of any kind, express or implied, about the completeness, accuracy, reliability, or suitability of the information, products, services, or related graphics contained on this site for any purpose.</p>
        <p style="font-size:16px;line-height:1.8;margin-bottom:16px">Any reliance you place on such information is therefore strictly at your own risk. In no event will we be liable for any loss or damage including without limitation, indirect or consequential loss or damage, or any loss or damage whatsoever arising from loss of data or profits arising out of, or in connection with, the use of this site.</p>
        <p style="font-size:16px;line-height:1.8">We may earn commissions from affiliate links on this site. This does not affect our editorial independence or the integrity of our content. Contact: <a href="mailto:legal@${domain}" style="color:#c0392b">legal@${domain}</a></p>
      </div>`
      };
    })(),
    'contact/index.html': {
      title: 'Contact Us',
      noindex: false,
      description: `Contact the ${siteName} editorial team — corrections, questions, feedback, and advertising inquiries.`,
      body: `<div style="max-width:640px;margin:48px auto;padding:0 20px;color:#1a1a1a">
        <h1 style="font-size:32px;font-weight:700;margin-bottom:8px">Contact Us</h1>
        <p style="color:#666;font-size:14px;margin-bottom:32px">We read every message and aim to respond within 2 business days.</p>
        <div style="display:grid;gap:16px;margin-bottom:40px">
          <div style="background:#f8f9fa;border:1px solid #e8e8e8;border-radius:6px;padding:20px 24px">
            <h2 style="font-size:16px;font-weight:700;margin:0 0 6px">Editorial Questions &amp; Corrections</h2>
            <p style="font-size:14px;line-height:1.7;color:#555;margin:0 0 10px">Found an error or want to challenge a claim?</p>
            <a href="mailto:editor@${domain}" style="font-size:14px;font-weight:600;color:#c0392b">editor@${domain}</a>
          </div>
          <div style="background:#f8f9fa;border:1px solid #e8e8e8;border-radius:6px;padding:20px 24px">
            <h2 style="font-size:16px;font-weight:700;margin:0 0 6px">General Inquiries</h2>
            <p style="font-size:14px;line-height:1.7;color:#555;margin:0 0 10px">Feedback, topic suggestions, or anything else.</p>
            <a href="mailto:contact@${domain}" style="font-size:14px;font-weight:600;color:#c0392b">contact@${domain}</a>
          </div>
          <div style="background:#f8f9fa;border:1px solid #e8e8e8;border-radius:6px;padding:20px 24px">
            <h2 style="font-size:16px;font-weight:700;margin:0 0 6px">Advertising &amp; Partnerships</h2>
            <p style="font-size:14px;line-height:1.7;color:#555;margin:0 0 10px">Display advertising and sponsorship inquiries.</p>
            <a href="mailto:ads@${domain}" style="font-size:14px;font-weight:600;color:#c0392b">ads@${domain}</a>
          </div>
        </div>
        <p style="font-size:14px;color:#666"><a href="/about/" style="color:#c0392b">About Us</a> &middot; <a href="/editorial-process/" style="color:#c0392b">Editorial Standards</a></p>
      </div>`
    },
    'advertise/index.html': {
      title: 'Advertise With Us',
      noindex: true,
      description: `Advertising opportunities on ${siteName}`,
      body: `<div style="max-width:700px;margin:40px auto;padding:0 20px">
        <h1 style="font-size:32px;margin-bottom:16px">Advertise With Us</h1>
        <p style="font-size:16px;line-height:1.8;margin-bottom:16px">${siteName} reaches a highly targeted audience interested in ${siteName.toLowerCase()}. We offer display advertising, sponsored content, and affiliate partnerships.</p>
        <p style="font-size:16px">Contact us: <a href="mailto:ads@${domain}">ads@${domain}</a></p>
      </div>`
    },
    'editorial-guidelines/index.html': {
      title: 'Editorial Guidelines',
      noindex: false,
      description: `How ${siteName} creates, reviews, and updates content — our editorial standards and practices.`,
      body: `<div style="max-width:800px;margin:40px auto;padding:0 20px">
        <h1 style="font-size:32px;margin-bottom:8px">Editorial Guidelines</h1>
        <p style="color:#999;margin-bottom:28px">Last updated: ${new Date().toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'})}</p>

        <p style="font-size:16px;line-height:1.8;margin-bottom:24px">
          These guidelines govern every piece of content published on ${siteName}.
          They exist to protect our readers from inaccurate, misleading, or low-quality information.
        </p>

        <h2 style="font-size:22px;margin:28px 0 12px">Who Creates Our Content</h2>
        <p style="font-size:16px;line-height:1.8;margin-bottom:16px">
          All primary content on ${siteName} is produced by subject matter experts with verified credentials
          in their respective fields. We do not hire generalist writers to cover topics outside their expertise.
          Contributors are required to disclose conflicts of interest and follow our sourcing requirements.
        </p>

        <h2 style="font-size:22px;margin:28px 0 12px">Source Standards</h2>
        <ul style="font-size:16px;line-height:1.8;margin-bottom:16px;padding-left:24px;">
          <li style="margin-bottom:8px;">Primary sources: government agencies (.gov), academic journals, official industry bodies</li>
          <li style="margin-bottom:8px;">Secondary sources: established news organizations with editorial standards</li>
          <li style="margin-bottom:8px;">Anecdotal claims must be clearly labeled as such</li>
          <li style="margin-bottom:8px;">Statistics must include the original study, date, and sample size where available</li>
          <li style="margin-bottom:8px;">We do not cite press releases as independent evidence</li>
        </ul>

        <h2 style="font-size:22px;margin:28px 0 12px">Corrections Policy</h2>
        <p style="font-size:16px;line-height:1.8;margin-bottom:16px">
          When errors are brought to our attention, we correct them promptly and transparently.
          Significant corrections are noted at the top of the affected article with a date.
          Minor corrections (typos, formatting) are fixed without notation.
          To report an error, email <a href="mailto:editor@${domain}" style="color:#c0392b;">editor@${domain}</a>.
        </p>

        <h2 style="font-size:22px;margin:28px 0 12px">Sponsored Content & Advertising</h2>
        <p style="font-size:16px;line-height:1.8;margin-bottom:16px">
          Advertising revenue supports our editorial operation, but advertisers have no influence over
          editorial decisions. We clearly label any sponsored content as "Sponsored" or "Advertisement."
          Affiliate links are disclosed in articles where they appear.
          Our editorial team operates independently from our commercial team.
        </p>

        <h2 style="font-size:22px;margin:28px 0 12px">Update & Review Schedule</h2>
        <p style="font-size:16px;line-height:1.8;margin-bottom:16px">
          All articles are reviewed at minimum every 90 days. Time-sensitive topics (pricing,
          regulations, medical guidance) are reviewed more frequently. Articles that contain
          outdated information are updated or removed. Each article displays its last-reviewed date.
        </p>

        <h2 style="font-size:22px;margin:28px 0 12px">Independence Statement</h2>
        <p style="font-size:16px;line-height:1.8;margin-bottom:24px">
          ${siteName} operates as an independent publication. We are not owned by or affiliated with
          any company whose products we review or recommend. Our editorial positions are determined
          solely by evidence and expert judgment.
        </p>

        <p style="font-size:14px;color:#999;border-top:1px solid #eee;padding-top:20px;">
          Questions about these guidelines? Contact <a href="mailto:editor@${domain}" style="color:#c0392b;">editor@${domain}</a> ·
          <a href="/about/" style="color:#c0392b;">About Us</a> ·
          <a href="/editorial-process/" style="color:#c0392b;">Our Review Process</a>
        </p>
      </div>`
    },
    'editorial-process/index.html': {
      title: 'Our Editorial Review Process',
      noindex: false,
      description: `How every article on ${siteName} is researched, written, fact-checked, and kept up to date.`,
      body: `<div style="max-width:820px;margin:48px auto;padding:0 20px;color:#1a1a1a">
        <div style="border-left:4px solid #c0392b;padding-left:20px;margin-bottom:36px">
          <h1 style="font-size:36px;font-weight:700;line-height:1.2;margin-bottom:8px">Our Editorial Review Process</h1>
          <p style="color:#666;font-size:14px;margin:0">Last updated: ${new Date().toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'})} &middot; By the ${siteName} Editorial Team</p>
        </div>
        <div style="background:#f8f9fa;border:1px solid #e8e8e8;border-radius:6px;padding:24px 28px;margin-bottom:40px">
          <p style="font-size:17px;line-height:1.85;margin:0;font-style:italic;color:#333">
            Every article published on ${siteName} goes through a structured, six-step process designed to ensure accuracy, depth, and genuine usefulness for readers. We do not publish to fill space — we publish only when we have something accurate and actionable to say.
          </p>
        </div>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-bottom:48px">
          <div style="text-align:center;padding:20px;background:#fff;border:1px solid #e8e8e8;border-radius:6px">
            <div style="font-size:32px;font-weight:900;color:#c0392b;margin-bottom:4px">100%</div>
            <div style="font-size:13px;color:#666">Expert-reviewed</div>
          </div>
          <div style="text-align:center;padding:20px;background:#fff;border:1px solid #e8e8e8;border-radius:6px">
            <div style="font-size:32px;font-weight:900;color:#c0392b;margin-bottom:4px">90-day</div>
            <div style="font-size:13px;color:#666">Update cycle</div>
          </div>
          <div style="text-align:center;padding:20px;background:#fff;border:1px solid #e8e8e8;border-radius:6px">
            <div style="font-size:32px;font-weight:900;color:#c0392b;margin-bottom:4px">Primary</div>
            <div style="font-size:13px;color:#666">Sources only</div>
          </div>
        </div>
        <h2 style="font-size:24px;font-weight:700;margin:40px 0 16px;padding-bottom:10px;border-bottom:2px solid #e8e8e8">Step 1 — Topic Selection</h2>
        <p style="font-size:16px;line-height:1.85;margin-bottom:16px">Topics are selected based on three criteria: demonstrated reader demand (via search data and reader questions), gaps in existing coverage quality, and the ability of our specialists to add measurable value. We specifically prioritize questions that real people ask but existing content answers poorly — with vague generalizations, outdated statistics, or no actionable guidance.</p>
        <p style="font-size:16px;line-height:1.85;margin-bottom:16px">If the best answer to a question already exists on the internet and we cannot meaningfully improve on it, we do not publish.</p>
        <h2 style="font-size:24px;font-weight:700;margin:40px 0 16px;padding-bottom:10px;border-bottom:2px solid #e8e8e8">Step 2 — Expert Assignment</h2>
        <p style="font-size:16px;line-height:1.85;margin-bottom:16px">Each topic is assigned to the contributor whose professional background most directly qualifies them to cover it. We do not assign general-topic writers to specialized subjects. Contributors are required to disclose any financial interest, sponsorship, or relationship that could influence their coverage before assignment begins.</p>
        <h2 style="font-size:24px;font-weight:700;margin:40px 0 16px;padding-bottom:10px;border-bottom:2px solid #e8e8e8">Step 3 — Research &amp; Primary Sources</h2>
        <p style="font-size:16px;line-height:1.85;margin-bottom:16px">All factual claims must be sourced to a primary or high-quality secondary source before drafting begins. Acceptable primary sources include government databases, peer-reviewed research, official industry standards, and direct professional experience documented with specifics.</p>
        <p style="font-size:16px;line-height:1.85;margin-bottom:16px">We do not accept other aggregator websites, AI-generated content, or unsourced blog posts as sources. If a claim cannot be sourced, it is not published.</p>
        <h2 style="font-size:24px;font-weight:700;margin:40px 0 16px;padding-bottom:10px;border-bottom:2px solid #e8e8e8">Step 4 — Editorial Review</h2>
        <p style="font-size:16px;line-height:1.85;margin-bottom:16px">Every draft goes through a multi-point editorial review. Editors verify:</p>
        <ul style="font-size:16px;line-height:1.85;margin-bottom:20px;padding-left:28px">
          <li style="margin-bottom:10px"><strong>Factual accuracy</strong> — every claim verified against its cited source</li>
          <li style="margin-bottom:10px"><strong>Source quality</strong> — credibility standards met, publication date checked for currency</li>
          <li style="margin-bottom:10px"><strong>Completeness</strong> — does the article directly answer the reader's question?</li>
          <li style="margin-bottom:10px"><strong>Clarity</strong> — accessible to a general reader without sacrificing accuracy</li>
          <li style="margin-bottom:10px"><strong>Conflicts of interest</strong> — all commercial relationships disclosed</li>
          <li style="margin-bottom:10px"><strong>Actionability</strong> — does the reader leave with something useful?</li>
        </ul>
        <h2 style="font-size:24px;font-weight:700;margin:40px 0 16px;padding-bottom:10px;border-bottom:2px solid #e8e8e8">Step 5 — Publication Standards</h2>
        <p style="font-size:16px;line-height:1.85;margin-bottom:16px">Published articles include a clear byline with the contributor's credentials, publication date, and last-reviewed date. All affiliate relationships or sponsored content are disclosed at the top of the article. We maintain strict separation between editorial content and commercial content.</p>
        <h2 style="font-size:24px;font-weight:700;margin:40px 0 16px;padding-bottom:10px;border-bottom:2px solid #e8e8e8">Step 6 — Ongoing Maintenance</h2>
        <p style="font-size:16px;line-height:1.85;margin-bottom:16px">Every published article is on a 90-day review cycle. When significant changes occur — a regulatory update, new research, major market shift — we update sooner. Articles that cannot be updated to remain accurate are unpublished rather than left live with outdated information.</p>
        <p style="font-size:16px;line-height:1.85;margin-bottom:16px">Reader feedback submitted through our "Was this helpful?" widget is reviewed weekly and informs content updates and new topics.</p>
        <div style="background:#f8f9fa;border:1px solid #e8e8e8;border-radius:6px;padding:24px 28px;margin-top:48px">
          <h3 style="font-size:18px;font-weight:700;margin-bottom:12px">Questions about our process?</h3>
          <p style="font-size:15px;line-height:1.7;margin-bottom:12px;color:#444">If you see something that does not look right, or have a question about a specific article's sourcing, contact our editorial team.</p>
          <p style="font-size:14px;color:#666;margin:0">
            <a href="/about/" style="color:#c0392b">About Us</a> &middot;
            <a href="/contact/" style="color:#c0392b">Contact</a> &middot;
            Email: <a href="mailto:editor@${domain}" style="color:#c0392b">editor@${domain}</a>
          </p>
        </div>
      </div>`
    },
  };

  // Add niche-specific methodology page (content from ./niche-methodology.js)
  const _meth = NICHE_METHODOLOGY[siteConfig.nicheSlug] || DEFAULT_METHODOLOGY;
  pages['methodology/index.html'] = {
    title: _meth.title,
    noindex: false,
    description: _meth.intro.slice(0, 155),
    body: renderMethodologyBody(siteConfig.nicheSlug, domain)
  };

  for (const [path, page] of Object.entries(pages)) {
    const dir = join(WWW_ROOT, domain, path.replace('/index.html', ''));
    mkdirSync(dir, { recursive: true });
    const canonical = `${siteConfig.url}/${path.replace('index.html', '')}`;
    const html = simplePageWrapper(page.title, page.description, page.body, siteConfig, { noindex: page.noindex || false, canonical });
    writeFileSync(join(WWW_ROOT, domain, path), html, 'utf-8');
  }

  // 404 page — must live at root level (nginx: error_page 404 /404.html)
  const notFoundBody = `
<div style="max-width:600px;margin:80px auto;padding:0 20px;text-align:center;">
  <div style="font-size:80px;font-weight:900;color:#e8e8e8;line-height:1;margin-bottom:16px;">404</div>
  <h1 style="font-family:Georgia,serif;font-size:28px;font-weight:700;color:#1a1a2e;margin-bottom:12px;">Page Not Found</h1>
  <p style="font-size:16px;line-height:1.7;color:#666;margin-bottom:32px;">
    The page you're looking for doesn't exist or may have been moved.
    Here are some helpful links instead:
  </p>
  <div style="display:flex;flex-wrap:wrap;gap:12px;justify-content:center;margin-bottom:40px;">
    <a href="/" style="display:inline-block;background:#c0392b;color:white;padding:11px 22px;border-radius:5px;text-decoration:none;font-size:15px;font-weight:700;">← Back to Home</a>
    <a href="/tools/${siteConfig.toolSlug ? siteConfig.toolSlug + '/' : ''}" style="display:inline-block;background:#1a1a2e;color:white;padding:11px 22px;border-radius:5px;text-decoration:none;font-size:15px;font-weight:700;">Free Calculator</a>
  </div>
  <div style="border-top:1px solid #eee;padding-top:28px;">
    <p style="font-size:14px;font-weight:700;color:#1a1a2e;margin-bottom:12px;">Browse by Category</p>
    <div style="display:flex;flex-wrap:wrap;gap:8px;justify-content:center;" id="notfound-cats"></div>
  </div>
</div>
<script>
  fetch('/api/categories.json').then(r=>r.json()).then(cats=>{
    const el=document.getElementById('notfound-cats');
    if(!el||!cats?.length)return;
    el.innerHTML=cats.slice(0,6).map(c=>\`<a href="/category/\${c.slug}/" style="display:inline-block;background:#f4f4f0;color:#333;padding:6px 14px;border-radius:20px;text-decoration:none;font-size:13px;font-weight:600;">\${c.name}</a>\`).join('');
  }).catch(()=>{});
</script>`;

  writeFileSync(join(WWW_ROOT, domain, '404.html'),
    simplePageWrapper('Page Not Found', `The page you're looking for doesn't exist — ${siteName}`, notFoundBody, siteConfig, { noindex: true }),
    'utf-8');
}

async function generateHomePage(domain, articles, siteConfig, template) {
  const { renderHomePage } = await import(`${TEMPLATES_DIR}/${template}/src/layout.js`);
  const html = renderHomePage(articles, siteConfig);
  writeFileSync(join(WWW_ROOT, domain, 'index.html'), html, 'utf-8');
}

function writeApiFiles(domain, articles, niche) {
  const apiDir = join(WWW_ROOT, domain, 'api');
  mkdirSync(apiDir, { recursive: true });

  const lite = articles.map(a => ({ slug: a.slug, title: a.title, excerpt: a.excerpt || '', tags: a.tags || [], category: a.category || 'Guide' }));
  writeFileSync(join(apiDir, 'articles.json'), JSON.stringify(lite), 'utf-8');
  writeFileSync(join(apiDir, 'trending.json'), JSON.stringify(lite.slice(0, 8)), 'utf-8');

  // Pre-populate with niche sub-categories so nav shows from day 1
  const nicheCats = getCategoriesForNiche(niche.slug);
  const cats = nicheCats.length ? nicheCats : [{ name: niche.name, slug: niche.slug }];
  writeFileSync(join(apiDir, 'categories.json'), JSON.stringify(cats), 'utf-8');
}

async function generateAuthorPage(domain, author, siteConfig, template) {
  const { renderBase } = await import(`${TEMPLATES_DIR}/${template}/src/layout.js`);
  const siteName = siteConfig.name;

  // Paragrafi della bio lunga
  const bioParagraphs = (author.longBio || author.shortBio)
    .split(/\n\n|\n/)
    .filter(p => p.trim().length > 30)
    .map(p => `<p style="font-size:16px;line-height:1.9;margin-bottom:22px;color:#333">${p.trim()}</p>`)
    .join('');

  const socialLinks = author.socialLinks
    ? Object.entries(author.socialLinks)
        .filter(([, url]) => url)
        .map(([net, url]) => `<a href="${url}" target="_blank" rel="noopener noreferrer"
          style="display:inline-block;background:#1a1a2e;color:white;padding:8px 16px;border-radius:4px;text-decoration:none;font-size:13px;font-weight:600;margin-right:8px;margin-bottom:8px;">${net.charAt(0).toUpperCase() + net.slice(1)}</a>`)
        .join('')
    : '';

  const body = `
<style>
.author-bio-grid{display:grid;grid-template-columns:1fr 280px;gap:32px;align-items:start}
@media(max-width:700px){
  .author-bio-grid{grid-template-columns:1fr}
  .author-hero-flex{flex-direction:column;align-items:center;text-align:center;padding:24px!important}
  .author-hero-flex img{width:120px!important;height:120px!important}
  .author-hero-flex .author-short-bio{text-align:left}
}
</style>
<div style="max-width:900px;margin:32px auto;padding:0 20px">
  <!-- Hero -->
  <div style="background:white;border-radius:4px;box-shadow:0 2px 8px rgba(0,0,0,0.1);overflow:hidden;margin-bottom:36px;color:#1a1a2e">
    <div style="height:4px;background:#c0392b;"></div>
    <div class="author-hero-flex" style="padding:40px;display:flex;gap:36px;align-items:flex-start;flex-wrap:wrap;">
      <img src="/images/author-${author.avatar}.jpg"
        alt="${author.name}"
        onerror="this.style.display='none'"
        style="width:160px;height:160px;object-fit:cover;object-position:center;border-radius:50%;border:4px solid #f4f4f0;box-shadow:0 4px 16px rgba(0,0,0,0.15);flex-shrink:0;" />
      <div style="flex:1;min-width:220px;">
        <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:#c0392b;margin-bottom:8px;">Expert Contributor</div>
        <h1 style="font-family:Georgia,serif;font-size:clamp(22px,4vw,34px);font-weight:900;color:#1a1a2e;margin-bottom:8px;line-height:1.2;">${author.name}</h1>
        <p style="font-size:15px;font-weight:600;color:#666;margin-bottom:16px;">${author.title}</p>
        <p class="author-short-bio" style="font-size:14px;line-height:1.75;color:#333;border-left:3px solid #c0392b;padding-left:14px;margin-bottom:20px;">${author.shortBio}</p>
        ${socialLinks}
      </div>
    </div>
  </div>

  <!-- Bio lunga -->
  <div class="author-bio-grid">
    <div style="background:white;border-radius:4px;box-shadow:0 2px 8px rgba(0,0,0,0.1);padding:32px;color:#1a1a2e">
      <h2 style="font-family:Georgia,serif;font-size:20px;font-weight:700;color:#1a1a2e;margin-bottom:24px;padding-bottom:12px;border-bottom:2px solid #c0392b;">About ${author.name}</h2>
      ${bioParagraphs}
    </div>
    <aside>
      <div style="background:white;border-radius:4px;box-shadow:0 2px 8px rgba(0,0,0,0.1);padding:24px;border-top:3px solid #c0392b;margin-bottom:20px;color:#1a1a2e">
        <h3 style="font-family:Georgia,serif;font-size:14px;font-weight:700;color:#1a1a2e;margin-bottom:12px;text-transform:uppercase;letter-spacing:0.5px;">Role at ${siteName}</h3>
        <p style="font-size:14px;line-height:1.7;color:#555;">${author.title} — writes and reviews all content in this area to ensure accuracy and real-world relevance.</p>
      </div>
      <div style="background:#1a1a2e;color:white;border-radius:4px;padding:24px;">
        <h3 style="font-size:14px;font-weight:700;margin-bottom:12px;">Editorial Standards</h3>
        <p style="font-size:13px;line-height:1.7;color:rgba(255,255,255,0.75);margin-bottom:16px;">All content is fact-checked and reviewed before publication. We follow strict guidelines for accuracy.</p>
        <a href="/about/" style="color:#c0392b;font-size:13px;font-weight:600;text-decoration:none;">Read our editorial process →</a>
      </div>
    </aside>
  </div>
</div>`;

  const html = simplePageWrapper(`${author.name} — ${author.title}`, author.shortBio, body, siteConfig, { canonical: `${siteConfig.url}/author/${author.avatar}/` });
  const dir = join(WWW_ROOT, domain, 'author', author.avatar);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'index.html'), html, 'utf-8');
  console.log(`  ✅ Author page: /author/${author.avatar}/`);
}

function generateCategoryPage(domain, category, introData, siteConfig) {
  const siteName = siteConfig.name;
  const headline = introData?.headline || `${category.name} — Articles & Guides`;
  const introText = (introData?.intro || `Explore our in-depth guides and articles about ${category.name.toLowerCase()}. All content is written by verified experts and reviewed for accuracy.`).replace(/\{\{siteName\}\}/g, siteName);

  const body = `
<div style="max-width:900px;margin:32px auto;padding:0 20px;">
  <!-- Breadcrumb -->
  <nav style="font-size:13px;color:#999;margin-bottom:20px;">
    <a href="/" style="color:#999;">Home</a> › <span style="color:#555;">${category.name}</span>
  </nav>

  <!-- Category hero -->
  <div style="border-bottom:3px solid #c0392b;margin-bottom:28px;padding-bottom:20px;">
    <h1 style="font-family:Georgia,serif;font-size:clamp(22px,4vw,32px);font-weight:900;color:#1a1a2e;margin-bottom:14px;">${headline}</h1>
    <p style="font-size:16px;line-height:1.85;color:#444;max-width:720px;">${introText}</p>
  </div>

  <!-- Articles grid (populated dynamically) -->
  <div id="cat-articles" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:20px;margin-bottom:40px;">
    <p style="color:#aaa;font-size:14px;grid-column:1/-1;">Loading articles...</p>
  </div>

  <!-- Internal tool CTA -->
  <div style="background:#fef5f4;border:1px solid #f5c6c0;border-left:4px solid #c0392b;border-radius:6px;padding:20px 24px;margin-top:32px;">
    <p style="font-size:15px;font-weight:600;color:#1a1a2e;margin-bottom:6px;">Free Planning Tool</p>
    <p style="font-size:14px;color:#555;margin-bottom:12px;">Use our interactive calculator to get an instant, personalized estimate for your project.</p>
    <a href="/tools/${siteConfig.toolSlug ? siteConfig.toolSlug + '/' : ''}" style="display:inline-block;background:#c0392b;color:white;padding:9px 20px;border-radius:5px;text-decoration:none;font-size:14px;font-weight:700;">Try the Calculator →</a>
  </div>
</div>

<script>
  fetch('/api/articles.json')
    .then(r => r.json())
    .then(articles => {
      const cat = '${category.name}'.toLowerCase();
      const filtered = articles.filter(a => a.category && a.category.toLowerCase() === cat);
      const el = document.getElementById('cat-articles');
      if (!filtered.length) { el.innerHTML = '<p style="color:#aaa;font-size:14px;">Articles coming soon.</p>'; return; }
      el.innerHTML = filtered.map(a => \`
        <a href="/\${a.slug}" style="display:block;text-decoration:none;background:white;border:1px solid #eee;border-radius:6px;overflow:hidden;transition:box-shadow .2s;" onmouseover="this.style.boxShadow='0 4px 16px rgba(0,0,0,.1)'" onmouseout="this.style.boxShadow=''">
          <img src="/images/\${a.slug}.jpg" alt="\${a.title}" loading="lazy" style="width:100%;height:160px;object-fit:cover;display:block;" onerror="this.style.display='none'" />
          <div style="padding:14px 16px;">
            <p style="font-size:14px;font-weight:700;color:#1a1a2e;margin:0 0 6px;line-height:1.4;">\${a.title}</p>
            <p style="font-size:13px;color:#666;margin:0;line-height:1.5;">\${(a.excerpt || '').slice(0, 100)}\${a.excerpt?.length > 100 ? '...' : ''}</p>
          </div>
        </a>\`).join('');
    }).catch(() => {
      document.getElementById('cat-articles').innerHTML = '<p style="color:#aaa;font-size:14px;">Articles coming soon.</p>';
    });
</script>`;

  const html = simplePageWrapper(headline, introText.slice(0, 160), body, siteConfig, { canonical: `${siteConfig.url}/category/${category.slug}/` });
  const dir = join(WWW_ROOT, domain, 'category', category.slug);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'index.html'), html, 'utf-8');
}

async function generateToolFile(domain, toolConfig, siteConfig) {
  const TEMPLATE_COLORS = {
    pulse:   '#c0392b',
    tribune: '#1a3a6b',
    nexus:   '#0d7377',
    echo:    '#4a235a',
    vortex:  '#b7410e',
  };
  const color = TEMPLATE_COLORS[siteConfig.template] || '#c0392b';

  const { renderBase, renderHeader, renderFooter } = await import(
    `../../../templates/${siteConfig.template}/src/layout.js`
  );

  const toolSite = {
    name:             siteConfig.name,
    url:              siteConfig.url,
    template:         siteConfig.template,
    adsenseId:        siteConfig.adsenseId || '',
    ga4MeasurementId: siteConfig.ga4MeasurementId || '',
    categories:       siteConfig.categories || [],
    color,
    niche:            siteConfig.nicheSlug,
  };

  const mainContent = generateToolBody(toolConfig, toolSite);
  const body = renderHeader(toolSite) + mainContent + renderFooter(toolSite);

  const html = renderBase({
    title:            toolConfig.title,
    description:      toolConfig.seoDescription || toolConfig.description,
    slug:             `tools/${toolConfig.slug}`,
    siteName:         siteConfig.name,
    siteUrl:          siteConfig.url,
    body,
    adsenseId:        siteConfig.adsenseId || '',
    ga4MeasurementId: siteConfig.ga4MeasurementId || '',
  });

  const toolDir = join(WWW_ROOT, domain, 'tools', toolConfig.slug);
  mkdirSync(toolDir, { recursive: true });
  writeFileSync(join(toolDir, 'index.html'), html, 'utf-8');
}

function writeFaviconSVG(domain, siteName = '', template = 'tribune') {
  // Colori primario/secondario per ogni template
  const FAVICON_COLORS = {
    tribune: ['#1a5c3a', '#c9a84c'],
    pulse:   ['#c0392b', '#1a1a2e'],
    nexus:   ['#7c3aed', '#06b6d4'],
    echo:    ['#c4622d', '#5a7a5a'],
    vortex:  ['#f97316', '#0d9488'],
  };
  const [bg, bg2] = FAVICON_COLORS[template] || ['#1a1a2e', '#c0392b'];

  // Iniziali: prima lettera di ogni parola se nome multi-parola, altrimenti 2 chars
  const words = siteName.trim().split(/\s+/);
  const initials = words.length >= 2
    ? (words[0][0] + words[1][0]).toUpperCase()
    : siteName.slice(0, 2).toUpperCase();

  const fontSize = initials.length > 1 ? 44 : 56;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <defs><clipPath id="c"><rect width="100" height="100" rx="18"/></clipPath></defs>
  <rect width="100" height="100" rx="18" fill="${bg}"/>
  <rect y="58" width="100" height="42" fill="${bg2}" clip-path="url(#c)"/>
  <text x="50" y="56" text-anchor="middle" dominant-baseline="middle"
        font-family="Arial Black,Impact,sans-serif" font-size="${fontSize}"
        font-weight="900" fill="white" letter-spacing="-1">${initials}</text>
</svg>`;

  writeFileSync(join(WWW_ROOT, domain, 'favicon.svg'), svg, 'utf-8');
  // favicon.ico minimalista (browser fallback) — redirect a SVG via meta se non esiste ICO
  if (!existsSync(join(WWW_ROOT, domain, 'favicon.ico'))) {
    writeFileSync(join(WWW_ROOT, domain, 'favicon.ico'), '', 'utf-8');
  }
  console.log(`  Favicon: /favicon.svg (${initials}, ${bg}/${bg2})`);
}

function writePlaceholderImage(domain, siteName = '') {
  // SVG placeholder — no external dependency
  const placeholder = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" viewBox="0 0 800 450">
    <rect width="800" height="450" fill="#e8e8e8"/>
    <text x="400" y="225" text-anchor="middle" fill="#aaa" font-size="24" font-family="sans-serif">Image</text>
  </svg>`;
  writeFileSync(join(WWW_ROOT, domain, 'images/placeholder.webp'), placeholder, 'utf-8');

  // og-default.jpg — 1200x630 branded SVG, used as og:image fallback for non-article pages.
  // Real social crawlers prefer JPG/PNG; replace with an actual image once available via Pexels.
  const label = siteName || domain;
  const ogDefault = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
    <rect width="1200" height="630" fill="#1a1a2e"/>
    <rect x="0" y="0" width="8" height="630" fill="#c0392b"/>
    <text x="80" y="290" font-family="Georgia,serif" font-size="52" font-weight="bold" fill="#ffffff">${label}</text>
    <text x="80" y="360" font-family="sans-serif" font-size="24" fill="rgba(255,255,255,0.6)">Expert Guides &amp; How-To Articles</text>
  </svg>`;
  writeFileSync(join(WWW_ROOT, domain, 'images/og-default.jpg'), ogDefault, 'utf-8');
}

function simplePageWrapper(title, description, content, site, { noindex = false, canonical = '', ogImage = '' } = {}) {
  const effectiveOgImage = ogImage || `${site.url}/images/og-default.jpg`;
  const ga4Id = process.env.GA4_MEASUREMENT_ID || '';
  const gscKeys = (process.env.GOOGLE_SITE_VERIFICATION || '').split(',').map(s => s.trim()).filter(Boolean);
  const ga4Script = ga4Id ? `
  <script async src="https://www.googletagmanager.com/gtag/js?id=${ga4Id}"></script>
  <script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${ga4Id}',{anonymize_ip:true});</script>` : '';
  const robots = noindex ? 'noindex, follow' : 'index, follow, max-image-preview:large';

  return `<!DOCTYPE html><html lang="en"><head>
<meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<meta name="robots" content="${robots}"/>
${gscKeys.map(k=>`<meta name="google-site-verification" content="${k}"/>`).join('\n')}
<title>${htmlEsc(title)} | ${htmlEsc(site.name)}</title>
<meta name="description" content="${htmlEsc(description)}"/>
${canonical ? `<link rel="canonical" href="${canonical}"/>` : ''}
<meta property="og:title" content="${htmlEsc(title)}"/>
<meta property="og:description" content="${htmlEsc(description)}"/>
<meta property="og:type" content="website"/>
<meta property="og:site_name" content="${htmlEsc(site.name)}"/>
${canonical ? `<meta property="og:url" content="${canonical}"/>` : ''}
<meta property="og:image" content="${effectiveOgImage}"/>
<meta name="twitter:card" content="summary_large_image"/>
<link rel="preconnect" href="https://pagead2.googlesyndication.com"/>
<link rel="preconnect" href="https://www.googletagmanager.com"/>
<link rel="dns-prefetch" href="https://www.google-analytics.com"/>
<link rel="stylesheet" href="/assets/style.v2.css"/>
${ga4Script}
</head><body>
<header style="background:#1a1a2e;padding:14px 20px">
  <a href="/" style="color:#fff;text-decoration:none;font-size:22px;font-weight:800">${site.name}</a>
</header>
<main style="padding:20px 0;min-height:60vh">${content}</main>
<footer style="background:#1a1a2e;color:rgba(255,255,255,.6);text-align:center;padding:20px;font-size:13px">
  <p>&copy; ${new Date().getFullYear()} ${site.name} &middot; <a href="/privacy/" style="color:rgba(255,255,255,.5)">Privacy</a> &middot; <a href="/terms/" style="color:rgba(255,255,255,.5)">Terms</a></p>
</footer>
</body></html>`;
}

function htmlEsc(str = '') {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function generateSiteName(domain) {
  const base = domain.split('.')[0];
  return base.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

function getWeekNumber() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  return Math.ceil(((now - start) / 86400000 + start.getDay() + 1) / 7);
}

run().catch(err => { console.error(err); process.exit(1); });
