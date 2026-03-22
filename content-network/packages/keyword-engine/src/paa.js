/**
 * People Also Ask — SerpAPI (primary) + Google scraper fallback
 *
 * SerpAPI restituisce `related_questions` nelle SERP organiche,
 * quindi riusiamo la stessa API key già usata dal ranking tracker.
 * Zero costo aggiuntivo rispetto al piano SerpAPI già attivo.
 *
 * Env: SERPAPI_KEY — se assente, usa scraping Google come fallback
 */

const SERPAPI_KEY = process.env.SERPAPI_KEY;
const sleep = ms => new Promise(r => setTimeout(r, ms));

// ── SerpAPI ───────────────────────────────────────────────────
async function fetchPAAviaSerpApi(query, language = 'en', region = 'us') {
  const params = new URLSearchParams({
    engine: 'google',
    q: query,
    api_key: SERPAPI_KEY,
    hl: language,
    gl: region,
    num: '10'
  });

  const res = await fetch(`https://serpapi.com/search.json?${params}`, {
    signal: AbortSignal.timeout(10000)
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`SerpAPI error ${res.status}: ${err}`);
  }

  const data = await res.json();
  return (data.related_questions || []).map(q => q.question).filter(Boolean);
}

// ── Google scraper fallback ───────────────────────────────────
async function fetchPAAFromGoogle(keyword) {
  const encoded = encodeURIComponent(keyword);
  const url = `https://www.google.com/search?q=${encoded}&hl=en&gl=us`;

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept': 'text/html'
      },
      signal: AbortSignal.timeout(8000)
    });

    if (!res.ok) return [];
    const html = await res.text();

    const questions = [];
    const paaRegex = /data-q="([^"]+)"/g;
    let match;
    while ((match = paaRegex.exec(html)) !== null) {
      const q = match[1].replace(/&amp;/g, '&').replace(/&#39;/g, "'");
      if (q.length > 10 && q.length < 200) questions.push(q);
    }

    if (questions.length === 0) {
      const altRegex = /"([^"]{20,150})\?"/g;
      while ((match = altRegex.exec(html)) !== null) {
        const q = match[1] + '?';
        if (/^(what|how|why|when|where|which|can|should|is|are|do|does)/i.test(q)) {
          questions.push(q);
        }
      }
    }

    return [...new Set(questions)].slice(0, 10);
  } catch {
    return [];
  }
}

// ── Public API ────────────────────────────────────────────────

/**
 * Get PAA questions for a list of keywords.
 * Uses SerpAPI if SERPAPI_KEY is set, otherwise scrapes Google.
 *
 * @param {string[]} keywords
 * @param {object} opts
 * @param {string} opts.language - e.g. 'en'
 * @param {string} opts.region   - e.g. 'us'
 * @returns {string[]} PAA questions
 */
export async function getPAAKeywords(keywords, { language = 'en', region = 'us' } = {}) {
  const allPAA = new Set();

  if (SERPAPI_KEY) {
    // SerpAPI: ogni chiamata include related_questions senza costo extra
    // Limitiamo a 10 seed per non bruciare quota (100 ricerche/mese free)
    const sample = keywords.slice(0, 10);
    console.log(`  [PAA] SerpAPI — querying ${sample.length} keywords`);

    for (const kw of sample) {
      try {
        const questions = await fetchPAAviaSerpApi(kw, language, region);
        questions.forEach(q => allPAA.add(q));
        await sleep(300);
      } catch (e) {
        console.warn(`  [PAA] SerpAPI failed for "${kw}": ${e.message}`);
      }
    }
  } else {
    // Fallback: scrape Google (fragile, usa sparingly)
    console.log('  [PAA] No SERPAPI_KEY — falling back to Google scraping');
    const sample = keywords.filter((_, i) => i % 5 === 0).slice(0, 20);

    for (const kw of sample) {
      const questions = await fetchPAAFromGoogle(kw);
      questions.forEach(q => allPAA.add(q));
      await sleep(2000);
    }
  }

  return [...allPAA];
}
