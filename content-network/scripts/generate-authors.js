/**
 * Author generation script — one-shot per sito
 *
 * Usage:
 *   node scripts/generate-authors.js --niche home-improvement-costs --site-dir /opt/content-network/sites/pulse
 *
 * Produce:
 *   {site-dir}/src/content/authors.json     — dati autori per Astro
 *   {site-dir}/public/authors/{avatar}.jpg  — foto profilo scaricata da Pexels
 *
 * Env richiesto: ANTHROPIC_API_KEY, PEXELS_API_KEY (opzionale ma consigliato)
 */

import 'dotenv/config';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { generateAuthors } from '../packages/content-engine/src/author-generator.js';

async function run() {
  const args = process.argv.slice(2);

  const nicheSlug = args.find(a => a.startsWith('--niche='))?.split('=')[1]
    || args[args.indexOf('--niche') + 1];

  const siteDir = args.find(a => a.startsWith('--site-dir='))?.split('=')[1]
    || args[args.indexOf('--site-dir') + 1];

  if (!nicheSlug || !siteDir) {
    console.error('Usage: node generate-authors.js --niche <slug> --site-dir <path>');
    console.error('Example: node generate-authors.js --niche home-improvement-costs --site-dir ./sites/home-improvement-costs');
    process.exit(1);
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('Missing ANTHROPIC_API_KEY in .env');
    process.exit(1);
  }

  console.log(`\n🖊️  Author Generator`);
  console.log(`Niche:    ${nicheSlug}`);
  console.log(`Site dir: ${siteDir}`);
  if (!process.env.PEXELS_API_KEY) {
    console.warn('⚠️  PEXELS_API_KEY not set — author photos will be skipped');
  }

  // Genera autori
  const authors = await generateAuthors(nicheSlug, siteDir);

  // Salva authors.json nel content dir di Astro
  const contentDir = join(siteDir, 'src', 'content');
  if (!existsSync(contentDir)) mkdirSync(contentDir, { recursive: true });

  const outputPath = join(contentDir, 'authors.json');
  writeFileSync(outputPath, JSON.stringify(authors, null, 2));
  console.log(`\n✅ Saved: ${outputPath}`);
  console.log(`\nAuthors generated:`);
  authors.forEach(a => {
    console.log(`  • ${a.name} (${a.title}) → /author/${a.slug}`);
  });

  console.log('\nNext steps:');
  console.log('  1. cd into site dir and run: npm run build');
  console.log('  2. The /author/{slug} pages will be available after build');
}

run().catch(err => {
  console.error('Author generator error:', err);
  process.exit(1);
});
