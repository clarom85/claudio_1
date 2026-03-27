import "dotenv/config";
import { sql } from "@content-network/db";

const liveStr = "live";
const publishedStr = "published";

const sites = await sql`SELECT s.id, s.domain, n.id as niche_id, n.slug as niche_slug FROM sites s JOIN niches n ON s.niche_id=n.id WHERE s.status=${liveStr}`;
for (const site of sites) {
  const [tot] = await sql`SELECT COUNT(*) as c FROM keywords WHERE niche_id=${site.niche_id}`;
  const [unu] = await sql`SELECT COUNT(*) as c FROM keywords WHERE niche_id=${site.niche_id} AND used=false`;
  const [pub] = await sql`SELECT COUNT(*) as c FROM articles WHERE site_id=${site.id} AND status=${publishedStr}`;
  console.log(`\n${site.domain} [${site.niche_slug}]`);
  console.log(`  keywords: ${tot.c} total, ${unu.c} unused | articles published: ${pub.c}`);
  const sample = await sql`SELECT keyword, search_volume FROM keywords WHERE niche_id=${site.niche_id} AND used=false ORDER BY search_volume DESC NULLS LAST LIMIT 8`;
  sample.forEach(k => console.log(`  vol:${k.search_volume || "?"} -- ${k.keyword}`));
}

const dupes = await sql`SELECT keyword, COUNT(*) as cnt FROM keywords WHERE used=false GROUP BY keyword HAVING COUNT(*) > 1 ORDER BY cnt DESC LIMIT 15`;
console.log(`\nDuplicate unused keywords (exact match): ${dupes.length}`);
dupes.forEach(d => console.log(` x${d.cnt} ${d.keyword}`));

const artSlugs = await sql`SELECT slug FROM articles WHERE status=${publishedStr}`;
const slugSet = new Set(artSlugs.map(a => a.slug));
const kwAll = await sql`SELECT keyword FROM keywords WHERE used=false`;
let conflicts = 0;
for (const k of kwAll) {
  const predicted = k.keyword.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  if (slugSet.has(predicted)) conflicts++;
}
console.log(`\nUnused keywords whose predicted slug = already published article: ${conflicts}`);
process.exit(0);
