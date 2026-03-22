/**
 * Competitor H2/H3 Scraper
 * Per ogni seed keyword:
 * 1. Prende le top 3 URL organiche da Google SERP
 * 2. Scarica ogni pagina
 * 3. Estrae i titoli H2/H3 come nuove keyword candidate
 *
 * Queste heading sono già validate da chi è in prima pagina su Google.
 */

const sleep = ms => new Promise(r => setTimeout(r, ms));

const SKIP_DOMAINS = [
  'google.com', 'youtube.com', 'facebook.com', 'twitter.com',
  'instagram.com', 'amazon.com', 'wikipedia.org', 'reddit.com',
  'pinterest.com', 'linkedin.com', 'yelp.com',
];

// ── Step 1: estrai URL organiche da SERP Google ───────────────
async function getTopUrls(query, limit = 3) {
  const url = `https://www.google.com/search?q=${encodeURIComponent(query)}&hl=en&gl=us&num=10`;
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

    const urls = new Set();

    // Pattern 1: /url?q=https://... (Google redirect links)
    const pattern1 = [...html.matchAll(/\/url\?q=(https?:\/\/[^&"]+)/g)];
    for (const m of pattern1) {
      try {
        const decoded = decodeURIComponent(m[1]);
        const domain = new URL(decoded).hostname.replace('www.', '');
        if (!SKIP_DOMAINS.some(d => domain.includes(d))) {
          urls.add(decoded);
        }
      } catch { /* skip malformed */ }
    }

    // Pattern 2: href="https://..." nei risultati organici
    const pattern2 = [...html.matchAll(/href="(https?:\/\/[^"]{20,200})"/g)];
    for (const m of pattern2) {
      try {
        const u = new URL(m[1]);
        const domain = u.hostname.replace('www.', '');
        if (!SKIP_DOMAINS.some(d => domain.includes(d)) && !m[1].includes('google')) {
          urls.add(m[1]);
        }
      } catch { /* skip */ }
    }

    return [...urls].slice(0, limit);
  } catch {
    return [];
  }
}

// ── Step 2: estrai H2/H3 da una pagina ───────────────────────
async function extractHeadings(pageUrl) {
  try {
    const res = await fetch(pageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html',
        'Accept-Language': 'en-US,en;q=0.9'
      },
      signal: AbortSignal.timeout(6000)
    });

    if (!res.ok) return [];

    // Limita dimensione pagina (max 300KB per non processare pagine enormi)
    const contentLength = parseInt(res.headers.get('content-length') || '0');
    if (contentLength > 300000) return [];

    const html = await res.text();
    const headings = [];

    // Estrai H2
    const h2matches = [...html.matchAll(/<h2[^>]*>([^<]{10,100})<\/h2>/gi)];
    for (const m of h2matches) {
      headings.push(m[1].replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ').trim());
    }

    // Estrai H3
    const h3matches = [...html.matchAll(/<h3[^>]*>([^<]{10,100})<\/h3>/gi)];
    for (const m of h3matches) {
      headings.push(m[1].replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ').trim());
    }

    return headings
      .filter(h => {
        const words = h.split(/\s+/).length;
        return words >= 3 && words <= 10 && !/[<>{}[\]]/.test(h);
      })
      .slice(0, 12);
  } catch {
    return [];
  }
}

// ── API pubblica ──────────────────────────────────────────────

/**
 * Per ogni seed, prende le top URL organiche e ne estrae H2/H3.
 * Limita a 3 seed e 3 URL per seed per non sovraccaricare Google.
 *
 * @param {string[]} seeds
 * @returns {string[]} heading keywords raw
 */
export async function scrapeCompetitorHeadings(seeds) {
  const allHeadings = new Set();

  // Massimo 3 seed per run — qualità > quantità, e non spammare Google
  const sample = seeds.slice(0, 3);

  for (const seed of sample) {
    console.log(`  [Competitor] Scraping top results for: "${seed}"`);

    const urls = await getTopUrls(seed, 3);
    console.log(`    → ${urls.length} URLs found`);
    await sleep(1500);

    for (const url of urls) {
      const headings = await extractHeadings(url);
      headings.forEach(h => allHeadings.add(h));
      console.log(`    → ${headings.length} headings from ${new URL(url).hostname}`);
      await sleep(1000);
    }

    await sleep(2000); // pausa tra seed
  }

  return [...allHeadings];
}
