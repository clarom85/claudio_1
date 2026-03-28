/**
 * relink-all.js — Forza un relink pass completo su tutti i siti live.
 * Usa le ultime regole del link-injector (inclusa soglia 12 chars).
 *
 * Uso: node packages/vps/src/relink-all.js
 */
import 'dotenv/config';
import { sql } from '@content-network/db';
import { injectInternalLinks, injectPillarSatelliteLinks } from '@content-network/content-engine/src/link-injector.js';

async function relinkSite(site) {
  const articles = await sql`
    SELECT a.id, a.slug, a.title, a.content,
           COALESCE(a.tags, '{}') as tags,
           k.cluster_slug, k.is_pillar
    FROM articles a
    LEFT JOIN keywords k ON a.keyword_id = k.id
    WHERE a.site_id = ${site.id} AND a.status = 'published'
    ORDER BY a.published_at ASC
  `;

  if (articles.length < 2) {
    console.log(`  ${site.domain}: only ${articles.length} article(s), skipping`);
    return 0;
  }

  const input = articles.map(a => ({
    id: a.id,
    slug: a.slug,
    title: a.title,
    content: a.content || '',
    tags: a.tags || [],
    cluster_slug: a.cluster_slug || null,
    is_pillar: a.is_pillar || false,
  }));

  const clusterLinked = injectPillarSatelliteLinks(input);
  const relinked      = injectInternalLinks(clusterLinked);

  let updated = 0;
  for (let i = 0; i < relinked.length; i++) {
    if (relinked[i].content === input[i].content) continue;
    await sql`UPDATE articles SET content = ${relinked[i].content}, updated_at = NOW() WHERE id = ${input[i].id}`;
    updated++;
  }

  console.log(`  ✅ ${site.domain}: ${updated}/${articles.length} articles updated`);
  return updated;
}

async function run() {
  const sites = await sql`
    SELECT s.id, s.domain FROM sites s WHERE s.status = 'live' ORDER BY s.id
  `;

  console.log(`\nRelinking ${sites.length} site(s)...\n`);
  let total = 0;
  for (const site of sites) {
    total += await relinkSite(site);
  }
  console.log(`\nDone — ${total} articles updated`);
  process.exit(0);
}

run().catch(err => { console.error(err); process.exit(1); });
