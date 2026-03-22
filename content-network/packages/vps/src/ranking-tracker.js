/**
 * Ranking Tracker — controlla posizioni Google degli articoli
 *
 * Usa SerpAPI per ottenere posizioni organiche.
 * I risultati vengono salvati nella tabella `rankings` per trend analysis.
 *
 * Env vars:
 *   SERPAPI_KEY=your_serpapi_key   (da serpapi.com — 100 ricerche/mese gratis)
 *
 * Viene chiamato dallo scheduler ogni domenica alle 04:xx.
 * Per ogni sito live, controlla le top keywords degli articoli pubblicati.
 */

import { sql } from '@content-network/db';

const SERPAPI_KEY = process.env.SERPAPI_KEY;
const DELAY_MS = 2000; // 2s tra richieste per non superare rate limit

/**
 * Controlla la posizione di un singolo URL/keyword su Google.
 * Restituisce la posizione (1-100) o null se non trovato.
 */
async function checkRanking(keyword, targetDomain) {
  if (!SERPAPI_KEY) return null;

  try {
    const params = new URLSearchParams({
      engine: 'google',
      q: keyword,
      api_key: SERPAPI_KEY,
      num: '100',
      gl: 'us',
      hl: 'en',
      no_cache: 'true'
    });

    const res = await fetch(`https://serpapi.com/search?${params}`);
    if (!res.ok) throw new Error(`SerpAPI error: ${res.status}`);

    const data = await res.json();
    const results = data.organic_results || [];

    for (const r of results) {
      if (r.link && r.link.includes(targetDomain)) {
        return r.position;
      }
    }
    return null; // non in top 100
  } catch (e) {
    console.warn(`[Ranking] Error checking "${keyword}": ${e.message}`);
    return null;
  }
}

/**
 * Traccia i ranking per tutti gli articoli di un sito.
 * Controlla max 20 articoli per sito (i più recenti) per contenere costi API.
 *
 * @param {Object} site - { id, domain }
 * @returns {{ checked: number, ranked: number, avgPosition: number|null }}
 */
export async function trackSiteRankings(site) {
  const result = { checked: 0, ranked: 0, avgPosition: null };

  if (!SERPAPI_KEY) {
    console.log('[Ranking] No SERPAPI_KEY — skipping ranking check');
    return result;
  }

  // Prendi articoli pubblicati con la loro keyword
  const articles = await sql`
    SELECT a.id, a.slug, a.title, k.keyword
    FROM articles a
    JOIN keywords k ON a.keyword_id = k.id
    WHERE a.site_id = ${site.id}
      AND a.status = 'published'
    ORDER BY a.published_at DESC
    LIMIT 20
  `;

  if (!articles.length) return result;

  const positions = [];

  for (const article of articles) {
    const keyword = article.keyword || article.title;
    const position = await checkRanking(keyword, site.domain);

    // Salva in DB
    await sql`
      INSERT INTO rankings (site_id, article_id, keyword, position, url, checked_at)
      VALUES (
        ${site.id},
        ${article.id},
        ${keyword},
        ${position},
        ${`https://${site.domain}/${article.slug}/`},
        NOW()
      )
    `;

    result.checked++;
    if (position !== null) {
      result.ranked++;
      positions.push(position);
    }

    await new Promise(r => setTimeout(r, DELAY_MS));
  }

  if (positions.length) {
    result.avgPosition = Math.round(positions.reduce((a, b) => a + b, 0) / positions.length);
  }

  console.log(`[Ranking] ${site.domain}: ${result.ranked}/${result.checked} ranked, avg pos: ${result.avgPosition ?? 'N/A'}`);
  return result;
}

/**
 * Restituisce gli articoli con ranking < minPosition (basso ranking → da migliorare).
 * Prende l'ultima lettura per ogni articolo.
 */
export async function getLowRankingArticles(siteId, maxPosition = 20, limit = 5) {
  return sql`
    SELECT DISTINCT ON (r.article_id)
      r.article_id, r.keyword, r.position, r.url,
      a.slug, a.title, a.content, a.meta_description
    FROM rankings r
    JOIN articles a ON r.article_id = a.id
    WHERE r.site_id = ${siteId}
      AND r.position IS NOT NULL
      AND r.position > ${maxPosition}
      AND r.position <= 50
    ORDER BY r.article_id, r.checked_at DESC
    LIMIT ${limit}
  `;
}

/**
 * Restituisce trend ranking per un articolo (ultime 10 letture).
 */
export async function getRankingTrend(articleId) {
  return sql`
    SELECT position, checked_at
    FROM rankings
    WHERE article_id = ${articleId}
      AND position IS NOT NULL
    ORDER BY checked_at DESC
    LIMIT 10
  `;
}
