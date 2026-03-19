/**
 * Reddit keyword mining
 * Usa Reddit JSON API (completamente free, no auth necessario)
 * Cerca titoli dei post in subreddit rilevanti → long-tail naturali
 */

const NICHE_SUBREDDITS = {
  'home-improvement-costs': ['HomeImprovement', 'DIY', 'Renovations', 'HomeOwners'],
  'pet-care-by-breed': ['dogs', 'cats', 'petadvice', 'AskVet'],
  'software-error-fixes': ['techsupport', 'Windows11', 'sysadmin', 'pchelp'],
  'diet-specific-recipes': ['ketorecipes', 'veganrecipes', 'glutenfree', 'MealPrepSunday'],
  'small-town-tourism': ['solotravel', 'travel', 'AskAmericans', 'roadtrip']
};

async function fetchSubredditPosts(subreddit, limit = 100) {
  const url = `https://www.reddit.com/r/${subreddit}/top.json?limit=${limit}&t=month`;
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'ContentResearchBot/1.0'
      },
      signal: AbortSignal.timeout(8000)
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data?.data?.children?.map(c => c.data.title) || [];
  } catch {
    return [];
  }
}

function titleToKeyword(title) {
  // Rimuovi punteggiatura eccessiva, normalizza
  return title
    .replace(/[?!]/g, '')
    .replace(/[^a-zA-Z0-9\s'-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
    .slice(0, 100);
}

function isGoodKeyword(kw) {
  const words = kw.split(' ');
  return words.length >= 3 && words.length <= 12 && kw.length > 15;
}

export async function getRedditKeywords(nicheSlug) {
  const subreddits = NICHE_SUBREDDITS[nicheSlug] || [];
  const keywords = new Set();

  for (const sub of subreddits) {
    const posts = await fetchSubredditPosts(sub);
    posts
      .map(titleToKeyword)
      .filter(isGoodKeyword)
      .forEach(k => keywords.add(k));
    await new Promise(r => setTimeout(r, 500));
  }

  return [...keywords];
}
