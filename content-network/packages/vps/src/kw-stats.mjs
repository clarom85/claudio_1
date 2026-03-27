import "dotenv/config";
import { sql } from "@content-network/db";

const liveStr = "live";
const sites = await sql`SELECT id, domain FROM sites WHERE status=${liveStr}`;
for (const site of sites) {
  const [tot] = await sql`SELECT COUNT(*) as c FROM keywords WHERE site_id=${site.id}`;
  const [unu] = await sql`SELECT COUNT(*) as c FROM keywords WHERE site_id=${site.id} AND used=false`;
  console.log(site.domain + ": total=" + tot.c + " unused=" + unu.c);
  const s = await sql`SELECT keyword, search_volume FROM keywords WHERE site_id=${site.id} AND used=false ORDER BY search_volume DESC NULLS LAST LIMIT 8`;
  s.forEach(k => console.log("  vol:" + (k.search_volume || "?") + " -- " + k.keyword));
}
const dupes = await sql`SELECT keyword, COUNT(*) as cnt FROM keywords WHERE used=false GROUP BY keyword HAVING COUNT(*) > 1 LIMIT 10`;
console.log("\nDuplicate unused keywords (exact match): " + dupes.length);
dupes.forEach(d => console.log(" x" + d.cnt + " " + d.keyword));
const artSlugs = await sql`SELECT slug FROM articles WHERE status='published'`;
const slugSet = new Set(artSlugs.map(a => a.slug));
const kwAll = await sql`SELECT keyword FROM keywords WHERE used=false`;
let conflicts = 0;
for (const k of kwAll) {
  const predicted = k.keyword.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  if (slugSet.has(predicted)) conflicts++;
}
console.log("Keywords with predicted slug = published article: " + conflicts);
process.exit(0);
