/**
 * People Also Ask scraper
 * Usa SerpAPI free alternative: scraping diretto di Google
 * con parsing del JSON embedded nella pagina
 */

async function fetchPAA(keyword) {
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

    // Estrai le domande PAA dal markup
    const questions = [];
    const paaRegex = /data-q="([^"]+)"/g;
    let match;
    while ((match = paaRegex.exec(html)) !== null) {
      const q = match[1].replace(/&amp;/g, '&').replace(/&#39;/g, "'");
      if (q.length > 10 && q.length < 200) {
        questions.push(q);
      }
    }

    // Fallback: cerca pattern di domande nel testo
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

export async function getPAAKeywords(keywords, delay = 2000) {
  const allPAA = new Set();

  // PAA su sample delle keywords (ogni 5a) per non fare troppe richieste
  const sample = keywords.filter((_, i) => i % 5 === 0).slice(0, 20);

  for (const kw of sample) {
    const questions = await fetchPAA(kw);
    questions.forEach(q => allPAA.add(q));
    await new Promise(r => setTimeout(r, delay));
  }

  return [...allPAA];
}
