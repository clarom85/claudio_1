/**
 * fix-api-files.js — Rigenera api/articles.json e api/trending.json
 * per tutti i siti live, usando i soli articoli del sito (evita contaminazione da altri siti).
 * Uso: node packages/vps/src/fix-api-files.js
 */
import 'dotenv/config';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { sql } from '@content-network/db';
import { classifyArticle } from '@content-network/content-engine/src/categories.js';

const WWW_ROOT = process.env.WWW_ROOT || '/var/www';

async function run() {
  const sites = await sql`
    SELECT s.id, s.domain, n.slug AS niche_slug, n.name AS niche_name
    FROM sites s
    JOIN niches n ON n.id = s.niche_id
    WHERE s.status = 'live'
    ORDER BY s.id
  `;

  for (const site of sites) {
    const articles = await sql`
      SELECT a.slug, a.title, a.meta_description, a.tags, a.image, k.keyword
      FROM articles a
      JOIN keywords k ON a.keyword_id = k.id
      WHERE a.site_id = ${site.id}
        AND a.status = 'published'
      ORDER BY a.published_at DESC
    `;

    const lite = articles.map(a => {
      const cat = classifyArticle(site.niche_slug, a.keyword || '', a.title);
      return {
        slug:         a.slug,
        title:        a.title,
        excerpt:      (a.meta_description || '').slice(0, 120),
        tags:         a.tags || [],
        category:     cat.name,
        categorySlug: cat.slug,
        image:        a.image || ''
      };
    });

    const apiDir = join(WWW_ROOT, site.domain, 'api');
    mkdirSync(apiDir, { recursive: true });
    writeFileSync(join(apiDir, 'articles.json'),  JSON.stringify(lite),              'utf-8');
    writeFileSync(join(apiDir, 'trending.json'),  JSON.stringify(lite.slice(0, 8)), 'utf-8');

    console.log(`OK  ${site.domain} — ${lite.length} articles`);
    lite.slice(0, 3).forEach(a => console.log(`    [${a.categorySlug}] ${a.title.slice(0, 60)}`));
  }

  process.exit(0);
}

run().catch(err => { console.error(err); process.exit(1); });
