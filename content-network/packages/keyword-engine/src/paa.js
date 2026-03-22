/**
 * People Also Ask — AlsoAsked API (primary) + Google scraper fallback
 *
 * AlsoAsked API: https://alsoasked.com
 * - $9/month for 500 searches
 * - Returns structured question trees (3 levels deep)
 * - Much more reliable than scraping Google
 *
 * Env: ALSOASKED_API_KEY — if absent, falls back to Google scraping
 */

const ALSOASKED_API_KEY = process.env.ALSOASKED_API_KEY;
const sleep = ms => new Promise(r => setTimeout(r, ms));

// ── AlsoAsked API ─────────────────────────────────────────────
async function fetchAlsoAsked(query, language = 'en', region = 'us') {
  const res = await fetch('https://alsoaskedapi.com/v1/search', {
    method: 'POST',
    headers: {
      'X-Api-Key': ALSOASKED_API_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ queries: [query], language, region, depth: 2, fresh: false }),
    signal: AbortSignal.timeout(15000)
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`AlsoAsked API error ${res.status}: ${err}`);
  }

  const data = await res.json();
  const questions = new Set();

  // Walk the question tree (up to depth 2)
  function walk(nodes) {
    if (!Array.isArray(nodes)) return;
    for (const node of nodes) {
      if (node.question) questions.add(node.question);
      if (node.results) walk(node.results);
    }
  }

  for (const result of (data.results || [])) {
    walk(result.results || []);
  }

  return [...questions];
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
 * Uses AlsoAsked API if ALSOASKED_API_KEY is set, otherwise scrapes Google.
 *
 * @param {string[]} keywords
 * @param {object} opts
 * @param {string} opts.language - e.g. 'en'
 * @param {string} opts.region   - e.g. 'us'
 * @returns {string[]} PAA questions
 */
export async function getPAAKeywords(keywords, { language = 'en', region = 'us' } = {}) {
  const allPAA = new Set();

  if (ALSOASKED_API_KEY) {
    // AlsoAsked: query all seed keywords directly (question trees are rich)
    // Use at most 15 keywords to stay within monthly quota
    const sample = keywords.slice(0, 15);
    console.log(`  [PAA] AlsoAsked API — querying ${sample.length} keywords`);

    for (const kw of sample) {
      try {
        const questions = await fetchAlsoAsked(kw, language, region);
        questions.forEach(q => allPAA.add(q));
        await sleep(500); // AlsoAsked rate limit: generous, but be polite
      } catch (e) {
        console.warn(`  [PAA] AlsoAsked failed for "${kw}": ${e.message}`);
      }
    }
  } else {
    // Fallback: scrape Google (fragile, use sparingly)
    console.log('  [PAA] No ALSOASKED_API_KEY — falling back to Google scraping');
    const sample = keywords.filter((_, i) => i % 5 === 0).slice(0, 20);

    for (const kw of sample) {
      const questions = await fetchPAAFromGoogle(kw);
      questions.forEach(q => allPAA.add(q));
      await sleep(2000);
    }
  }

  return [...allPAA];
}
