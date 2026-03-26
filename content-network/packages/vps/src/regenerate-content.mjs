/**
 * regenerate-content.mjs — Rigenera il content HTML degli articoli pubblicati
 * tramite Claude API + relink pass automatico.
 * Uso: node packages/vps/src/regenerate-content.mjs --site-id 5
 */
import 'dotenv/config';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { sql } from '@content-network/db';
import { generateArticle } from '@content-network/content-engine/src/generator.js';
import { injectInternalLinks, injectPillarSatelliteLinks } from '@content-network/content-engine/src/link-injector.js';

const WWW_ROOT = process.env.WWW_ROOT || '/var/www';

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

// ── Relink pass automatico ────────────────────────────────────────────────────
if (ok > 0) {
  console.log(`\n🔗 Relink pass su ${site.domain}...`);

  const allArticles = await sql`
    SELECT a.id, a.slug, a.title, a.content, a.meta_description, a.schema_markup,
           COALESCE(a.tags, '{}') as tags,
           k.cluster_slug, k.is_pillar
    FROM articles a
    LEFT JOIN keywords k ON a.keyword_id = k.id
    WHERE a.site_id = ${siteId} AND a.status = 'published'
    ORDER BY a.published_at ASC
  `;

  if (allArticles.length >= 2) {
    const input = allArticles.map(a => ({
      id: a.id, slug: a.slug, title: a.title,
      content: a.content || '',
      tags: a.tags || [],
      cluster_slug: a.cluster_slug || null,
      is_pillar: a.is_pillar || false,
      metaDescription: a.meta_description,
      schemas: a.schema_markup,
    }));

    const relinked = injectInternalLinks(injectPillarSatelliteLinks(input));
    let linked = 0;

    for (let i = 0; i < relinked.length; i++) {
      if (relinked[i].content === input[i].content) continue;
      await sql`UPDATE articles SET content = ${relinked[i].content}, updated_at = NOW() WHERE id = ${input[i].id}`;
      const indexFile = join(WWW_ROOT, site.domain, relinked[i].slug, 'index.html');
      if (existsSync(indexFile)) {
        const html = readFileSync(indexFile, 'utf-8');
        const newHtml = html.replace(
          /(<div[^>]*itemprop="articleBody"[^>]*>)([\s\S]*?)(<\/div>\s*<aside)/,
          (_, open, _old, close) => `${open}${relinked[i].content}${close}`
        );
        if (newHtml !== html) writeFileSync(indexFile, newHtml, 'utf-8');
      }
      linked++;
    }
    console.log(`  ✅ ${linked} articoli aggiornati con link interni`);
  } else {
    console.log(`  ℹ️  Articoli insufficienti per cross-linking`);
  }
}

process.exit(0);
