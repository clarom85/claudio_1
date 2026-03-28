/**
 * link-digest.js
 *
 * Invia email ogni giorno alle 12:00 UTC con lo stato del sistema
 * di internal linking per ogni sito:
 *  - Totale link interni iniettati (site-wide)
 *  - Articoli orfani (0 inbound links)
 *  - Distribuzione link per articolo
 *  - Top 5 articoli per inbound links
 *  - Articoli senza outbound links (nessun link ad altri articoli)
 *
 * Run manuale: node packages/vps/src/link-digest.js
 * Scheduler:   ogni giorno alle 12:xx UTC
 */
import 'dotenv/config';
import { sql } from '@content-network/db';

async function buildLinkStats(site, articles) {
  if (!articles.length) return null;

  const slugSet = new Set(articles.map(a => a.slug));

  // Build outbound map: slug → [slugs it links to]
  const outbound = new Map(); // slug → Set of slugs linked
  const inbound  = new Map(); // slug → count of articles linking to it

  for (const a of articles) {
    outbound.set(a.slug, new Set());
    inbound.set(a.slug, 0);
  }

  // Parse internal links from HTML content
  // Match href="/slug" or href="/slug/"
  const hrefRe = /href="\/([^/"#?]+)\/?"/g;

  for (const a of articles) {
    const content = a.content || '';
    let match;
    while ((match = hrefRe.exec(content)) !== null) {
      const linkedSlug = match[1];
      if (linkedSlug && slugSet.has(linkedSlug) && linkedSlug !== a.slug) {
        outbound.get(a.slug).add(linkedSlug);
        inbound.set(linkedSlug, (inbound.get(linkedSlug) || 0) + 1);
      }
    }
  }

  const totalLinks   = [...outbound.values()].reduce((s, set) => s + set.size, 0);
  const orphans      = articles.filter(a => (inbound.get(a.slug) || 0) === 0);
  const noOutbound   = articles.filter(a => outbound.get(a.slug).size === 0);
  const avgOut       = articles.length ? (totalLinks / articles.length).toFixed(1) : 0;

  // Top 5 by inbound
  const top5 = [...inbound.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([slug, count]) => {
      const art = articles.find(a => a.slug === slug);
      return { slug, title: art?.title || slug, count };
    });

  return {
    domain: site.domain,
    totalArticles: articles.length,
    totalLinks,
    avgOut: parseFloat(avgOut),
    orphanCount: orphans.length,
    noOutboundCount: noOutbound.length,
    top5,
    orphans: orphans.slice(0, 8).map(a => ({ slug: a.slug, title: a.title })),
    noOutbound: noOutbound.slice(0, 5).map(a => ({ slug: a.slug, title: a.title }))
  };
}

function buildHtml(statsArr, dateStr) {
  const siteBlocks = statsArr.map(s => {
    const healthScore = Math.round(
      100 - (s.orphanCount / s.totalArticles * 40) - (s.noOutboundCount / s.totalArticles * 30)
    );
    const healthColor = healthScore >= 80 ? '#27ae60' : healthScore >= 60 ? '#f39c12' : '#e74c3c';

    const top5Rows = s.top5.map((a, i) => `
      <tr style="border-bottom:1px solid #f0f0f0">
        <td style="padding:6px 10px;font-size:12px;color:#bbb;text-align:center">${i + 1}</td>
        <td style="padding:6px 10px;font-size:13px">
          <a href="https://${s.domain}/${a.slug}/" style="color:#2c3e50;text-decoration:none">${a.title}</a>
        </td>
        <td style="padding:6px 10px;font-size:13px;font-weight:600;color:#2980b9;text-align:center">${a.count}</td>
      </tr>`).join('');

    const orphanList = s.orphans.length
      ? s.orphans.map(a =>
          `<li style="font-size:12px;color:#555;margin-bottom:4px">
            <a href="https://${s.domain}/${a.slug}/" style="color:#e74c3c;text-decoration:none">${a.title}</a>
          </li>`).join('')
      : '<li style="font-size:12px;color:#27ae60">Nessun articolo orfano ✓</li>';

    const noOutList = s.noOutbound.length
      ? s.noOutbound.map(a =>
          `<li style="font-size:12px;color:#555;margin-bottom:4px">
            <a href="https://${s.domain}/${a.slug}/" style="color:#e67e22;text-decoration:none">${a.title}</a>
          </li>`).join('')
      : '<li style="font-size:12px;color:#27ae60">Tutti gli articoli hanno link outbound ✓</li>';

    return `
<div style="margin-bottom:32px;background:white;border-radius:4px;border:1px solid #eee;overflow:hidden">
  <div style="background:#1a1a2e;padding:14px 20px;display:flex;justify-content:space-between;align-items:center">
    <h3 style="color:white;margin:0;font-size:15px">🌐 ${s.domain}</h3>
    <span style="background:${healthColor};color:white;font-size:12px;font-weight:700;padding:4px 10px;border-radius:12px">
      Link Health: ${healthScore}%
    </span>
  </div>

  <!-- KPI row -->
  <div style="display:grid;grid-template-columns:repeat(4,1fr);border-bottom:1px solid #f0f0f0">
    ${[
      ['Total Links', s.totalLinks, '#2980b9'],
      ['Avg Out/Article', s.avgOut, '#8e44ad'],
      ['Orphan Articles', s.orphanCount, s.orphanCount > 0 ? '#e74c3c' : '#27ae60'],
      ['No Outbound', s.noOutboundCount, s.noOutboundCount > 0 ? '#e67e22' : '#27ae60'],
    ].map(([label, val, color]) => `
      <div style="padding:16px 12px;text-align:center;border-right:1px solid #f0f0f0">
        <div style="font-size:24px;font-weight:800;color:${color}">${val}</div>
        <div style="font-size:11px;color:#999;margin-top:4px;text-transform:uppercase;letter-spacing:0.5px">${label}</div>
      </div>`).join('')}
  </div>

  <div style="display:grid;grid-template-columns:1fr 1fr;gap:0">
    <!-- Top 5 inbound -->
    <div style="padding:16px 20px;border-right:1px solid #f0f0f0">
      <h4 style="font-size:12px;text-transform:uppercase;letter-spacing:0.5px;color:#999;margin:0 0 10px">
        Top 5 per Inbound Links
      </h4>
      <table style="width:100%;border-collapse:collapse">
        <thead>
          <tr style="background:#f9f9f9">
            <th style="padding:5px 10px;font-size:11px;color:#999;width:30px">#</th>
            <th style="padding:5px 10px;font-size:11px;color:#999;text-align:left">Articolo</th>
            <th style="padding:5px 10px;font-size:11px;color:#999">↓ In</th>
          </tr>
        </thead>
        <tbody>${top5Rows}</tbody>
      </table>
    </div>

    <!-- Alerts -->
    <div style="padding:16px 20px">
      <h4 style="font-size:12px;text-transform:uppercase;letter-spacing:0.5px;color:#e74c3c;margin:0 0 8px">
        ⚠ Articoli Orfani (0 inbound)
      </h4>
      <ul style="margin:0 0 16px;padding-left:16px">${orphanList}</ul>

      <h4 style="font-size:12px;text-transform:uppercase;letter-spacing:0.5px;color:#e67e22;margin:0 0 8px">
        ⚠ Senza Link Outbound
      </h4>
      <ul style="margin:0;padding-left:16px">${noOutList}</ul>
    </div>
  </div>
</div>`;
  }).join('');

  return `
<div style="font-family:Arial,sans-serif;max-width:760px;margin:0 auto;padding:20px">
  <h2 style="color:#2c3e50;margin-bottom:4px">🔗 Internal Link Digest</h2>
  <p style="color:#666;font-size:13px;margin-top:0">${dateStr} — stato del sistema di linking interno</p>

  ${siteBlocks}

  <div style="background:#f0f7ff;border-left:3px solid #3498db;padding:10px 14px;border-radius:2px;margin-top:4px">
    <p style="margin:0;font-size:12px;color:#555">
      <strong>Come migliorare:</strong><br>
      Articoli orfani → il re-linker notturno proverà ad aggiungerli automaticamente al prossimo ciclo.<br>
      Se un articolo rimane orfano per 3+ giorni, considerare di aggiungere link manuali o espandere il contenuto per aumentare la superficie di match.
    </p>
  </div>

  <p style="color:#ccc;font-size:11px;margin-top:20px">${new Date().toISOString()} — Content Network</p>
</div>`;
}

async function run() {
  const sites = await sql`
    SELECT s.id, s.domain
    FROM sites s
    WHERE s.status = 'live'
    ORDER BY s.id
  `;

  if (!sites.length) {
    console.log('[link-digest] No live sites');
    return;
  }

  const statsArr = [];

  for (const site of sites) {
    const articles = await sql`
      SELECT slug, title, content
      FROM articles
      WHERE site_id = ${site.id} AND status = 'published'
      ORDER BY published_at DESC
    `;

    const stats = await buildLinkStats(site, articles);
    if (stats) statsArr.push(stats);
  }

  if (!statsArr.length) {
    console.log('[link-digest] No data');
    return;
  }

  const dateStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  const totalLinks = statsArr.reduce((s, x) => s + x.totalLinks, 0);
  const totalOrphans = statsArr.reduce((s, x) => s + x.orphanCount, 0);

  const html = buildHtml(statsArr, dateStr);
  const subject = `🔗 Link Digest — ${totalLinks} link interni, ${totalOrphans} orfani (${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})`;

  await sendEmail(subject, html);
  console.log(`[link-digest] Sent — ${statsArr.map(s => s.domain + ': ' + s.totalLinks + ' links, ' + s.orphanCount + ' orphans').join(' | ')}`);
}

async function sendEmail(subject, html) {
  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  const TO = process.env.ALERT_EMAIL_TO;
  const FROM = process.env.ALERT_EMAIL_FROM || 'onboarding@resend.dev';

  if (!RESEND_API_KEY || !TO) {
    console.log('[link-digest] No email config — skipping');
    return;
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from: FROM, to: [TO], subject, html }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Resend error: ${err}`);
  }
}

run().catch(err => {
  console.error('link-digest error:', err.message);
  process.exit(1);
});
