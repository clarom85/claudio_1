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

// Massimo articoli per cluster (1 pillar + N satellite per topic).
// Le keyword geo (con nome stato USA) sono escluse dal limite — ogni stato è un articolo unico.
const MAX_PER_CLUSTER = 3;

const GEO_PATTERN = /\b(Alabama|Alaska|Arizona|Arkansas|California|Colorado|Connecticut|Delaware|Florida|Georgia|Hawaii|Idaho|Illinois|Indiana|Iowa|Kansas|Kentucky|Louisiana|Maine|Maryland|Massachusetts|Michigan|Minnesota|Mississippi|Missouri|Montana|Nebraska|Nevada|New Hampshire|New Jersey|New Mexico|New York|North Carolina|North Dakota|Ohio|Oklahoma|Oregon|Pennsylvania|Rhode Island|South Carolina|South Dakota|Tennessee|Texas|Utah|Vermont|Virginia|Washington|West Virginia|Wisconsin|Wyoming)\b/i;

export async function getUnusedKeywords(nicheId, limit = 60) {
  // Limita max MAX_PER_CLUSTER articoli per cluster considerando sia unused che già pubblicati.
  // "already_published" conta gli articoli già esistenti per ogni cluster_slug.
  // Le geo-keyword (nome stato US nella keyword) sono esenti dal limite → cluster proprio.
  // Le keyword senza cluster sono trattate individualmente.
  return sql`
    WITH published_per_cluster AS (
      SELECT k.cluster_slug, COUNT(*) AS already_published
      FROM keywords k
      JOIN articles a ON a.keyword_id = k.id
      WHERE k.niche_id = ${nicheId}
        AND k.cluster_slug IS NOT NULL
        AND k.keyword !~* ${GEO_PATTERN.source}
        AND a.status IN ('published', 'draft')
      GROUP BY k.cluster_slug
    ),
    ranked AS (
      SELECT k.*,
        COALESCE(p.already_published, 0) AS already_published,
        ROW_NUMBER() OVER (
          PARTITION BY CASE
            WHEN k.cluster_slug IS NULL THEN k.keyword
            WHEN k.keyword ~* ${GEO_PATTERN.source} THEN k.keyword
            ELSE k.cluster_slug
          END
          ORDER BY k.is_pillar DESC NULLS LAST, k.search_volume DESC NULLS LAST, RANDOM()
        ) AS rn
      FROM keywords k
      LEFT JOIN published_per_cluster p ON p.cluster_slug = k.cluster_slug
      WHERE k.niche_id = ${nicheId} AND k.used = FALSE
    )
    SELECT * FROM ranked
    WHERE (rn + already_published) <= ${MAX_PER_CLUSTER}
    ORDER BY is_pillar DESC NULLS LAST, search_volume DESC NULLS LAST, RANDOM()
    LIMIT ${limit}
  `;
}

export async function bulkUpdateKeywordVolumes(updates) {
  // updates: [{keyword, nicheId, searchVolume, cpc, difficulty}]
  if (!updates.length) return;
  const chunkSize = 200;
  for (let i = 0; i < updates.length; i += chunkSize) {
    const chunk = updates.slice(i, i + chunkSize);
    for (const u of chunk) {
      await sql`
        UPDATE keywords
        SET search_volume = ${u.searchVolume},
            cpc           = ${u.cpc},
            difficulty    = ${u.difficulty},
            volume_scored = TRUE
        WHERE niche_id = ${u.nicheId}
          AND LOWER(keyword) = LOWER(${u.keyword})
      `;
    }
  }
}

export async function markKeywordUsed(keywordId) {
  await sql`UPDATE keywords SET used = TRUE WHERE id = ${keywordId}`;
}

export async function getUnusedKeywordCount(nicheId) {
  const [row] = await sql`
    SELECT COUNT(*) as count FROM keywords
    WHERE niche_id = ${nicheId} AND used = FALSE
  `;
  return parseInt(row.count);
}

// Ritorna keyword pillar già nel DB da usare come seed aggiuntivi per l'espansione.
// Prende le più recenti (aggiunte nell'ultimo run) per massimizzare la varietà.
export async function getExpansionSeeds(nicheId, limit = 15) {
  const rows = await sql`
    SELECT keyword FROM keywords
    WHERE niche_id = ${nicheId}
      AND is_pillar = TRUE
    ORDER BY created_at DESC
    LIMIT ${limit}
  `;
  return rows.map(r => r.keyword);
}

// ── Articles ─────────────────────────────────────────────────
export async function insertArticle({ siteId, keywordId, slug, title, metaDescription, content, wordCount, schemaMarkup, tags = [] }) {
  const [article] = await sql`
    INSERT INTO articles (site_id, keyword_id, slug, title, meta_description, content, word_count, schema_markup, tags)
    VALUES (${siteId}, ${keywordId}, ${slug}, ${title}, ${metaDescription}, ${content}, ${wordCount}, ${JSON.stringify(schemaMarkup || [])}, ${tags})
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

// ── GSC submission ───────────────────────────────────────────
export async function markArticlesGscSubmitted(articleIds) {
  if (!articleIds.length) return;
  await sql`
    UPDATE articles SET gsc_submitted_at = NOW()
    WHERE id = ANY(${articleIds}::int[])
  `;
}

export async function getUnsubmittedArticles(siteId) {
  return sql`
    SELECT id, slug, published_at, status
    FROM articles
    WHERE site_id = ${siteId}
      AND status = 'published'
      AND gsc_submitted_at IS NULL
    ORDER BY published_at DESC
    LIMIT 50
  `;
}

// ── Rankings ─────────────────────────────────────────────────
export async function getLatestRankings(siteId) {
  return sql`
    SELECT DISTINCT ON (article_id)
      article_id, keyword, position, checked_at
    FROM rankings
    WHERE site_id = ${siteId}
    ORDER BY article_id, checked_at DESC
  `;
}

// ── A/B template ─────────────────────────────────────────────
export async function getTemplatePerformance() {
  return sql`
    SELECT s.template, s.ab_variant,
      COUNT(DISTINCT a.id) FILTER (WHERE a.status = 'published') as articles_published,
      ROUND(AVG(r.position) FILTER (WHERE r.position IS NOT NULL), 1) as avg_ranking
    FROM sites s
    LEFT JOIN articles a ON a.site_id = s.id
    LEFT JOIN rankings r ON r.site_id = s.id
    WHERE s.status = 'live'
    GROUP BY s.template, s.ab_variant
    ORDER BY avg_ranking ASC NULLS LAST
  `;
}
