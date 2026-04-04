/**
 * regenerate-news-sitemap.js — Rigenera /news-sitemap.xml per tutti i siti o un sito specifico.
 * Contiene solo articoli degli ultimi 2 giorni nel formato Google News sitemap.
 * Uso: node packages/vps/src/regenerate-news-sitemap.js [--all | --site-id 5]
 */
import 'dotenv/config';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { sql } from '@content-network/db';
import { purgeCache } from './cloudflare.js';

const WWW_ROOT = process.env.WWW_ROOT || '/var/www';

function escXml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function buildNewsSitemap(domain, articles, siteName) {
  const entries = articles.map(a => {
    const pubDate = new Date(a.published_at || a.created_at).toISOString();
    const imageUrl = a.image
      ? (a.image.startsWith('http') ? a.image : `https://${domain}${a.image}`)
      : `https://${domain}/images/${a.slug}.jpg`;
    return `  <url>
    <loc>https://${escXml(domain)}/${escXml(a.slug)}/</loc>
    <news:news>
      <news:publication>
        <news:name>${escXml(siteName)}</news:name>
        <news:language>en</news:language>
      </news:publication>
      <news:publication_date>${pubDate}</news:publication_date>
      <news:title>${escXml(a.title)}</news:title>
    </news:news>
    <image:image>
      <image:loc>${escXml(imageUrl)}</image:loc>
      <image:title>${escXml(a.title)}</image:title>
    </image:image>
  </url>`;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${entries}
</urlset>`;
}

async function regenerateForSite(site) {
  const siteName = site.domain.split('.')[0].replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  const articles = await sql`
    SELECT slug, title, image, published_at, created_at
    FROM articles
    WHERE site_id = ${site.id}
      AND status = 'published'
      AND (published_at > NOW() - INTERVAL '2 days' OR created_at > NOW() - INTERVAL '2 days')
    ORDER BY COALESCE(published_at, created_at) DESC
  `;

  const xml = buildNewsSitemap(site.domain, articles, siteName);
  const destDir = join(WWW_ROOT, site.domain);
  mkdirSync(destDir, { recursive: true });
  writeFileSync(join(destDir, 'news-sitemap.xml'), xml, 'utf-8');
  console.log(`  ✅ ${site.domain}: ${articles.length} articles → news-sitemap.xml`);
}

async function run() {
  const args = process.argv.slice(2);
  const all = args.includes('--all');
  const siteIdArg = parseInt(args.find(a => a.startsWith('--site-id='))?.split('=')[1]
    || args[args.indexOf('--site-id') + 1]);

  let sites;
  if (all) {
    sites = await sql`SELECT id, domain FROM sites WHERE status = 'live' ORDER BY id`;
  } else if (siteIdArg) {
    sites = await sql`SELECT id, domain FROM sites WHERE id = ${siteIdArg}`;
    if (!sites.length) { console.error(`Site ${siteIdArg} non trovato`); process.exit(1); }
  } else {
    console.error('Uso: node regenerate-news-sitemap.js [--all | --site-id <id>]');
    process.exit(1);
  }

  console.log(`\n📰 Regenerating news-sitemap.xml for ${sites.length} site(s)\n`);
  for (const site of sites) {
    try {
      await regenerateForSite(site);
    } catch (err) {
      console.error(`  ❌ ${site.domain}: ${err.message}`);
    }
  }

  if (process.env.CLOUDFLARE_API_TOKEN) {
    for (const site of sites) {
      await purgeCache(site.domain).catch(e => console.warn(`  ⚠ CF ${site.domain}: ${e.message}`));
    }
    console.log('\nCF cache purgata ✓');
  }
  process.exit(0);
}

run().catch(err => { console.error(err); process.exit(1); });
