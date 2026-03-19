/**
 * Google Trends — identifica keyword trending nella nicchia
 * Usa google-trends-api (wrapper non ufficiale, free)
 */
import googleTrends from 'google-trends-api';

export async function getTrendingKeywords(seedKeyword, { geo = 'US', timeframe = 'today 3-m' } = {}) {
  try {
    const result = await googleTrends.relatedQueries({
      keyword: seedKeyword,
      geo,
      startTime: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
    });

    const data = JSON.parse(result);
    const queries = data?.default?.rankedList || [];
    const keywords = [];

    for (const list of queries) {
      for (const item of (list.rankedKeyword || [])) {
        if (item.query && item.value > 20) { // solo quelli con trend score > 20
          keywords.push(item.query);
        }
      }
    }

    return [...new Set(keywords)];
  } catch {
    return [];
  }
}

export async function getTrendingForNiche(seeds, options = {}) {
  const all = new Set();
  for (const seed of seeds.slice(0, 3)) { // max 3 per non fare rate limit
    const trending = await getTrendingKeywords(seed, options);
    trending.forEach(k => all.add(k));
    await new Promise(r => setTimeout(r, 1000));
  }
  return [...all];
}
