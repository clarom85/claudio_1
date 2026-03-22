/**
 * Internal Link Graph Analyzer
 *
 * Analizza la struttura dei link interni per ogni sito:
 * - Costruisce grafo orientato degli articoli
 * - Identifica pillar articles con pochi link in ingresso
 * - Identifica articoli "orfani" (0 link in ingresso)
 * - Calcola PageRank semplificato
 * - Restituisce raccomandazioni per migliorare topical authority
 *
 * Chiamato dallo scheduler ogni domenica dopo il re-linking pass.
 */

import { sql } from '@content-network/db';

/**
 * Estrae tutti gli href interni da un HTML di articolo.
 * Considera solo link relativi tipo /slug/ o /slug
 */
function extractInternalLinks(html, domain) {
  const links = [];
  // Cerca href="/slug/" o href="https://domain/slug/"
  const re = /href="(?:https?:\/\/[^/]*)?\/([^"#?]+)\/?"/g;
  let m;
  while ((m = re.exec(html)) !== null) {
    const slug = m[1].replace(/\/$/, '').split('/').pop();
    if (slug && !slug.includes('.') && slug !== '') {
      links.push(slug);
    }
  }
  return [...new Set(links)];
}

/**
 * Analizza il grafo di link interni per un sito.
 *
 * @param {Object} site - { id, domain }
 * @returns {Object} report con problemi e raccomandazioni
 */
export async function analyzeLinkGraph(site) {
  const articles = await sql`
    SELECT a.id, a.slug, a.title, a.content,
           k.keyword, k.is_pillar, k.cluster_slug
    FROM articles a
    JOIN keywords k ON a.keyword_id = k.id
    WHERE a.site_id = ${site.id}
      AND a.status = 'published'
  `;

  if (articles.length < 3) {
    return { site: site.domain, skipped: true, reason: 'Not enough articles' };
  }

  // Indice slug → articolo
  const bySlug = new Map(articles.map(a => [a.slug, a]));

  // Costruisci grafo: inbound[slug] = Set di slug che puntano a questo
  const inbound = new Map(articles.map(a => [a.slug, new Set()]));
  const outbound = new Map(articles.map(a => [a.slug, new Set()]));

  for (const article of articles) {
    const links = extractInternalLinks(article.content || '', site.domain);
    for (const targetSlug of links) {
      if (bySlug.has(targetSlug) && targetSlug !== article.slug) {
        outbound.get(article.slug)?.add(targetSlug);
        inbound.get(targetSlug)?.add(article.slug);
      }
    }
  }

  // PageRank semplificato (10 iterazioni)
  const pr = new Map(articles.map(a => [a.slug, 1.0]));
  const d = 0.85;
  for (let iter = 0; iter < 10; iter++) {
    for (const article of articles) {
      const slug = article.slug;
      let rank = (1 - d);
      for (const from of inbound.get(slug) || []) {
        const fromOut = outbound.get(from)?.size || 1;
        rank += d * (pr.get(from) / fromOut);
      }
      pr.set(slug, rank);
    }
  }

  // Identifica problemi
  const orphans = [];         // 0 link in ingresso
  const underlinkedPillars = []; // pillar con < 3 link in ingresso
  const overlinked = [];      // articoli con > 10 link in uscita (spam links)

  for (const article of articles) {
    const inboundCount = inbound.get(article.slug)?.size || 0;
    const outboundCount = outbound.get(article.slug)?.size || 0;

    if (inboundCount === 0) {
      orphans.push({ slug: article.slug, title: article.title });
    }
    if (article.is_pillar && inboundCount < 3) {
      underlinkedPillars.push({
        slug: article.slug,
        title: article.title,
        cluster: article.cluster_slug,
        inboundCount,
        pageRank: Math.round(pr.get(article.slug) * 100) / 100
      });
    }
    if (outboundCount > 10) {
      overlinked.push({ slug: article.slug, title: article.title, outboundCount });
    }
  }

  // Top 5 per PageRank
  const topByRank = [...pr.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([slug, rank]) => ({
      slug,
      title: bySlug.get(slug)?.title,
      rank: Math.round(rank * 100) / 100,
      inbound: inbound.get(slug)?.size || 0
    }));

  const report = {
    site: site.domain,
    totalArticles: articles.length,
    totalLinks: [...outbound.values()].reduce((sum, s) => sum + s.size, 0),
    orphans: orphans.slice(0, 10),
    orphanCount: orphans.length,
    underlinkedPillars,
    overlinked,
    topByPageRank: topByRank,
    health: orphans.length === 0 && underlinkedPillars.length === 0 ? 'good' : 'needs_attention'
  };

  return report;
}

/**
 * Lancia analisi per tutti i siti live e logga il report.
 */
export async function runLinkGraphAnalysis(liveSites) {
  const reports = [];

  for (const site of liveSites) {
    try {
      const report = await analyzeLinkGraph(site);
      reports.push(report);

      if (report.skipped) {
        console.log(`  [LinkGraph] ${site.domain}: skipped (${report.reason})`);
        continue;
      }

      console.log(`  [LinkGraph] ${site.domain}: ${report.totalArticles} articles, ${report.totalLinks} links`);
      if (report.orphanCount > 0) {
        console.log(`    ⚠️  ${report.orphanCount} orphan articles (no inbound links)`);
      }
      if (report.underlinkedPillars.length > 0) {
        console.log(`    ⚠️  ${report.underlinkedPillars.length} underlinked pillars:`);
        report.underlinkedPillars.forEach(p =>
          console.log(`       - "${p.title}" (${p.inboundCount} inbound, PR: ${p.pageRank})`)
        );
      }
      if (report.health === 'good') {
        console.log(`    ✅ Link graph healthy`);
      }
    } catch (e) {
      console.warn(`  [LinkGraph] Error for ${site.domain}: ${e.message}`);
    }
  }

  return reports;
}
