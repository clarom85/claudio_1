import { neon } from '@neondatabase/serverless';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import 'dotenv/config';

const __dirname = dirname(fileURLToPath(import.meta.url));
const sql = neon(process.env.DATABASE_URL);

async function migrate() {
  console.log('Running migrations...');
  const schema = readFileSync(join(__dirname, 'schema.sql'), 'utf-8');

  // Neon non accetta multiple statements in una query — esegui uno per uno
  const statements = schema
    .split(';')
    .map(s => {
      // Rimuovi righe che sono solo commenti dall'inizio
      return s.split('\n')
        .filter(line => !line.trim().startsWith('--'))
        .join('\n')
        .trim();
    })
    .filter(s => s.length > 0);

  for (const statement of statements) {
    await sql(statement + ';');
  }
  console.log('Schema applied.');

  // Seed nicchie iniziali
  await seedNiches();
  console.log('Niches seeded.');
}

async function seedNiches() {
  const niches = [
    {
      slug: 'home-improvement-costs',
      name: 'Home Improvement Costs',
      template: 'pulse',
      seedKeywords: [
        'cost to remodel bathroom', 'how much to replace roof',
        'kitchen renovation cost', 'cost to install flooring',
        'hvac replacement cost', 'cost to build deck'
      ]
    },
    {
      slug: 'pet-care-by-breed',
      name: 'Pet Care by Breed',
      template: 'tribune',
      seedKeywords: [
        'golden retriever health problems', 'german shepherd diet',
        'french bulldog breathing issues', 'labrador exercise needs',
        'siamese cat behavior', 'beagle training tips'
      ]
    },
    {
      slug: 'software-error-fixes',
      name: 'Software Error Fixes',
      template: 'nexus',
      seedKeywords: [
        'windows 11 error fix', 'discord not working', 'chrome not loading',
        'excel formula error', 'outlook not sending email',
        'zoom audio not working'
      ]
    },
    {
      slug: 'diet-specific-recipes',
      name: 'Diet Specific Recipes',
      template: 'echo',
      seedKeywords: [
        'keto dinner no dairy', 'vegan high protein meals',
        'gluten free pasta recipes', 'low sodium dinner ideas',
        'paleo breakfast ideas', 'diabetic friendly desserts'
      ]
    },
    {
      slug: 'small-town-tourism',
      name: 'Small Town Tourism',
      template: 'vortex',
      seedKeywords: [
        'things to do in small towns', 'hidden gem towns usa',
        'weekend getaway small towns', 'best small towns to visit',
        'charming small towns europe', 'small town restaurants guide'
      ]
    },
    {
      slug: 'personal-finance',
      name: 'Personal Finance',
      template: 'pulse',
      seedKeywords: [
        'how to save money fast', 'best high yield savings account',
        'how to pay off debt', 'emergency fund how much',
        'budget for beginners', 'how to invest 1000 dollars'
      ]
    },
    {
      slug: 'insurance-guide',
      name: 'Insurance Guide',
      template: 'tribune',
      seedKeywords: [
        'cheapest car insurance', 'health insurance for self employed',
        'life insurance how much do i need', 'home insurance what does it cover',
        'renters insurance worth it', 'term vs whole life insurance'
      ]
    },
    {
      slug: 'legal-advice',
      name: 'Legal Advice',
      template: 'tribune',
      seedKeywords: [
        'how to write a will', 'landlord tenant rights',
        'small claims court how to file', 'how to dispute a charge',
        'employment rights wrongful termination', 'divorce process steps'
      ]
    },
    {
      slug: 'real-estate-investing',
      name: 'Real Estate Investing',
      template: 'echo',
      seedKeywords: [
        'how to start investing in real estate', 'rental property cash flow',
        'house hacking strategy', 'real estate vs stocks',
        'how to buy investment property', 'short term rental profitability'
      ]
    },
    {
      slug: 'health-symptoms',
      name: 'Health Symptoms',
      template: 'pulse',
      seedKeywords: [
        'chest pain when to worry', 'fatigue causes in women',
        'high blood pressure symptoms', 'anxiety symptoms physical',
        'vitamin d deficiency signs', 'thyroid symptoms in women'
      ]
    },
    {
      slug: 'credit-cards-banking',
      name: 'Credit Cards & Banking',
      template: 'nexus',
      seedKeywords: [
        'best cash back credit card', 'how to improve credit score fast',
        'balance transfer credit card', 'credit card vs debit card',
        'how to build credit from scratch', 'best travel rewards card'
      ]
    },
    {
      slug: 'weight-loss-fitness',
      name: 'Weight Loss & Fitness',
      template: 'echo',
      seedKeywords: [
        'how to lose belly fat', 'intermittent fasting for beginners',
        'strength training at home', 'how many calories to lose weight',
        'best exercises for weight loss', 'why am i not losing weight'
      ]
    },
    {
      slug: 'automotive-guide',
      name: 'Automotive Guide',
      template: 'vortex',
      seedKeywords: [
        'how to negotiate car price', 'check engine light causes',
        'when to replace brake pads', 'best first car for teenager',
        'car maintenance schedule', 'how to buy used car from dealer'
      ]
    },
    {
      slug: 'online-education',
      name: 'Online Education',
      template: 'nexus',
      seedKeywords: [
        'best online coding bootcamp', 'google certification worth it',
        'free online courses with certificates', 'coursera vs udemy',
        'how to learn programming for free', 'best data science courses online'
      ]
    },
    {
      slug: 'cybersecurity-privacy',
      name: 'Cybersecurity & Privacy',
      template: 'nexus',
      seedKeywords: [
        'best password manager', 'how to tell if email is phishing',
        'vpn worth it', 'how to secure home wifi',
        'identity theft what to do', 'two factor authentication setup'
      ]
    },
    {
      slug: 'mental-health-wellness',
      name: 'Mental Health & Wellness',
      template: 'echo',
      seedKeywords: [
        'how to deal with anxiety', 'signs of depression in adults',
        'how to improve sleep quality', 'burnout symptoms and recovery',
        'mindfulness for beginners', 'how to stop overthinking'
      ]
    },
    {
      slug: 'home-security-systems',
      name: 'Home Security Systems',
      template: 'tribune',
      seedKeywords: [
        'best home security system', 'ring vs adt comparison',
        'diy home security setup', 'home alarm system cost',
        'best outdoor security cameras', 'smart lock reviews'
      ]
    },
    {
      slug: 'solar-energy',
      name: 'Solar Energy',
      template: 'vortex',
      seedKeywords: [
        'solar panels cost for home', 'solar panel payback period',
        'best solar companies', 'solar battery storage worth it',
        'how do solar panels work', 'solar tax credit 2024'
      ]
    },
    {
      slug: 'senior-care-medicare',
      name: 'Senior Care & Medicare',
      template: 'tribune',
      seedKeywords: [
        'medicare vs medicaid difference', 'best medicare supplement plans',
        'assisted living cost by state', 'how to care for aging parent',
        'medicare enrollment deadlines', 'long term care insurance worth it'
      ]
    },
    {
      slug: 'business-startup',
      name: 'Business Startup',
      template: 'pulse',
      seedKeywords: [
        'how to start a business with no money', 'llc vs sole proprietorship',
        'best small business ideas', 'how to write a business plan',
        'small business grants', 'how to get first client freelance'
      ]
    }
  ];

  for (const n of niches) {
    await sql`
      INSERT INTO niches (slug, name, seed_keywords, template)
      VALUES (${n.slug}, ${n.name}, ${n.seedKeywords}, ${n.template})
      ON CONFLICT (slug) DO NOTHING
    `;
  }
}

migrate().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
