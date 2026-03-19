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
