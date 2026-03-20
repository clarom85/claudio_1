import { neon } from '@neondatabase/serverless';
import 'dotenv/config';

const sql = neon(process.env.DATABASE_URL);

export { sql };

// ── Sites ────────────────────────────────────────────────────
export async function createSite({ nicheId, domain, cfProjectName, template, weekNumber }) {
  const [site] = await sql`
    INSERT INTO sites (niche_id, domain, cf_project_name, template, week_number)
    VALUES (${nicheId}, ${domain}, ${cfProjectName}, ${template}, ${weekNumber})
    RETURNING *
  `;
  return site;
}

export async function updateSiteStatus(siteId, status, cfDeployUrl = null) {
  await sql`
    UPDATE sites SET status = ${status}, cf_deploy_url = ${cfDeployUrl}
    WHERE id = ${siteId}
  `;
}

export async function getSitesByStatus(status) {
  return sql`SELECT * FROM sites WHERE status = ${status}`;
}

// ── Niches ───────────────────────────────────────────────────
export async function getNiches() {
  return sql`SELECT * FROM niches WHERE active = TRUE`;
}

export async function getNicheBySlug(slug) {
  const [niche] = await sql`SELECT * FROM niches WHERE slug = ${slug}`;
  return niche;
}

export async function insertNiche({ slug, name, seedKeywords, template, language = 'en', country = 'US' }) {
  const [niche] = await sql`
    INSERT INTO niches (slug, name, seed_keywords, template, language, country)
    VALUES (${slug}, ${name}, ${seedKeywords}, ${template}, ${language}, ${country})
    ON CONFLICT (slug) DO UPDATE SET seed_keywords = EXCLUDED.seed_keywords
    RETURNING *
  `;
  return niche;
}

// ── Keywords ─────────────────────────────────────────────────
export async function bulkInsertKeywords(keywords) {
  if (!keywords.length) return;
  const chunkSize = 100;
  let inserted = 0;
  for (let i = 0; i < keywords.length; i += chunkSize) {
    const chunk = keywords.slice(i, i + chunkSize);
    await sql`
      INSERT INTO keywords (niche_id, keyword, source, intent, cluster_slug, is_pillar)
      SELECT * FROM UNNEST(
        ${chunk.map(k => k.nicheId)}::int[],
        ${chunk.map(k => k.keyword)}::text[],
        ${chunk.map(k => k.source)}::text[],
        ${chunk.map(k => k.intent || 'informational')}::text[],
        ${chunk.map(k => k.clusterSlug || null)}::text[],
        ${chunk.map(k => k.isPillar || false)}::bool[]
      ) AS t(niche_id, keyword, source, intent, cluster_slug, is_pillar)
      ON CONFLICT (niche_id, keyword) DO NOTHING
    `;
    inserted += chunk.length;
  }
  return inserted;
}

export async function getUnusedKeywords(nicheId, limit = 60) {
  // Pillars prima — garantisce che ogni cluster abbia la pagina principale
  // prima di generare i satelliti. Dentro ogni gruppo, ordine casuale.
  return sql`
    SELECT * FROM keywords
    WHERE niche_id = ${nicheId} AND used = FALSE
    ORDER BY is_pillar DESC NULLS LAST, RANDOM()
    LIMIT ${limit}
  `;
}

export async function markKeywordUsed(keywordId) {
  await sql`UPDATE keywords SET used = TRUE WHERE id = ${keywordId}`;
}

// ── Articles ─────────────────────────────────────────────────
export async function insertArticle({ siteId, keywordId, slug, title, metaDescription, content, wordCount, schemaMarkup }) {
  const [article] = await sql`
    INSERT INTO articles (site_id, keyword_id, slug, title, meta_description, content, word_count, schema_markup)
    VALUES (${siteId}, ${keywordId}, ${slug}, ${title}, ${metaDescription}, ${content}, ${wordCount}, ${JSON.stringify(schemaMarkup || [])})
    ON CONFLICT (site_id, slug) DO NOTHING
    RETURNING *
  `;
  return article;
}

export async function updateArticleStatus(articleId, status) {
  await sql`UPDATE articles SET status = ${status}, published_at = NOW() WHERE id = ${articleId}`;
}

export async function getArticlesBySite(siteId, limit = 100) {
  return sql`
    SELECT a.*, k.keyword FROM articles a
    JOIN keywords k ON a.keyword_id = k.id
    WHERE a.site_id = ${siteId}
    ORDER BY a.created_at DESC
    LIMIT ${limit}
  `;
}

// ── Publish Queue ────────────────────────────────────────────
export async function enqueueArticle(articleId, siteId, scheduledFor) {
  await sql`
    INSERT INTO publish_queue (article_id, site_id, scheduled_for)
    VALUES (${articleId}, ${siteId}, ${scheduledFor})
    ON CONFLICT DO NOTHING
  `;
}

export async function getDueItems(limit = 10) {
  return sql`
    SELECT q.*, a.title, a.slug, s.cf_project_name, s.domain
    FROM publish_queue q
    JOIN articles a ON q.article_id = a.id
    JOIN sites s ON q.site_id = s.id
    WHERE q.status = 'pending' AND q.scheduled_for <= NOW()
    ORDER BY q.scheduled_for ASC
    LIMIT ${limit}
  `;
}

export async function updateQueueItem(id, status, error = null) {
  await sql`
    UPDATE publish_queue
    SET status = ${status}, error = ${error}, attempts = attempts + 1
    WHERE id = ${id}
  `;
}
