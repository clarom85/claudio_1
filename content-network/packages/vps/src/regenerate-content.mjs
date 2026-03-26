/**
 * regenerate-content.mjs — Rigenera il content HTML degli articoli pubblicati
 * tramite Claude API. Usare solo quando il content è corrotto/mancante.
 * Uso: node packages/vps/src/regenerate-content.mjs --site-id 5
 */
import 'dotenv/config';
import { sql } from '@content-network/db';
import { generateArticle } from '@content-network/content-engine/src/generator.js';

const args = process.argv.slice(2);
const siteId = parseInt(args.find(a => a.startsWith('--site-id='))?.split('=')[1]
  || args[args.indexOf('--site-id') + 1]);

if (!siteId) { console.error('Uso: node regenerate-content.mjs --site-id <id>'); process.exit(1); }

const [site] = await sql`
  SELECT s.*, n.slug as niche_slug, n.name as niche_name, n.seed_keywords
  FROM sites s JOIN niches n ON s.niche_id = n.id
  WHERE s.id = ${siteId}
`;
if (!site) { console.error(`Site ${siteId} non trovato`); process.exit(1); }

const niche = { id: site.niche_id, slug: site.niche_slug, name: site.niche_name, seed_keywords: site.seed_keywords };

// Articoli pubblicati con content vuoto/rotto (0 paragrafi)
const articles = await sql`
  SELECT a.id, a.slug, a.title, a.image, k.keyword
  FROM articles a
  JOIN keywords k ON a.keyword_id = k.id
  WHERE a.site_id = ${siteId} AND a.status = 'published'
  AND (a.content IS NULL OR a.content NOT LIKE '%</p>%')
  ORDER BY a.id
`;

console.log(`\n🔄 Rigenerando content per ${articles.length} articoli corrotti su ${site.domain}\n`);
let ok = 0, fail = 0;

for (const a of articles) {
  try {
    process.stdout.write(`  → ${a.slug}... `);
    const generated = await generateArticle(a.keyword, niche, site, 3, null, []);
    if (!generated?.content) throw new Error('content vuoto dal generator');

    await sql`UPDATE articles SET content = ${generated.content} WHERE id = ${a.id}`;
    process.stdout.write(`✅\n`);
    ok++;
  } catch (err) {
    process.stdout.write(`❌ ${err.message}\n`);
    fail++;
  }
}

console.log(`\nCompletato: ${ok} ok, ${fail} falliti`);
process.exit(0);
