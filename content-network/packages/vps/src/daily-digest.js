/**
 * daily-digest.js
 *
 * Invia email ogni giorno alle 09:00 UTC con gli articoli pubblicati
 * nelle ultime 24 ore, raggruppati per sito.
 * Utile per supervisionare qualità titoli, volume pubblicato, errori.
 *
 * Run manuale: node packages/vps/src/daily-digest.js
 * Scheduler:   ogni giorno alle 09:xx UTC
 */
import 'dotenv/config';
import { sql } from '@content-network/db';

async function run() {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000); // ultime 24h

  const articles = await sql`
    SELECT
      a.title,
      a.slug,
      a.word_count,
      a.image,
      a.published_at,
      s.domain
    FROM articles a
    JOIN sites s ON a.site_id = s.id
    WHERE a.status = 'published'
      AND a.published_at >= ${since.toISOString()}
    ORDER BY s.domain, a.published_at DESC
  `;

  const dateStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  if (articles.length === 0) {
    await sendEmail(
      `📰 Daily Digest — 0 articoli pubblicati (${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})`,
      buildZeroHtml(dateStr)
    );
    console.log('[digest] 0 articles published — alert sent');
    return;
  }

  // Group by domain
  const bySite = {};
  for (const a of articles) {
    if (!bySite[a.domain]) bySite[a.domain] = [];
    bySite[a.domain].push(a);
  }

  const html = buildHtml(bySite, articles.length, dateStr);
  const subject = `📰 Daily Digest — ${articles.length} articol${articles.length !== 1 ? 'i' : 'o'} pubblicat${articles.length !== 1 ? 'i' : 'o'} (${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})`;

  await sendEmail(subject, html);
  console.log(`[digest] Sent — ${articles.length} articles across ${Object.keys(bySite).length} sites`);
}

function buildHtml(bySite, total, dateStr) {
  const siteBlocks = Object.entries(bySite).map(([domain, arts]) => {
    const rows = arts.map(a => {
      const time = new Date(a.published_at).toLocaleTimeString('en-US', {
        hour: '2-digit', minute: '2-digit', timeZone: 'America/New_York'
      });
      const wc = a.word_count ? `${a.word_count.toLocaleString()} words` : '—';
      const img = a.image ? '📷' : '⬜';
      const url = `https://${domain}/${a.slug}/`;
      return `
        <tr style="border-bottom:1px solid #f0f0f0">
          <td style="padding:8px 10px;font-size:13px">
            <a href="${url}" style="color:#2c3e50;text-decoration:none;font-weight:500">${a.title}</a>
          </td>
          <td style="padding:8px 10px;font-size:12px;color:#888;white-space:nowrap">${wc}</td>
          <td style="padding:8px 10px;font-size:13px;text-align:center">${img}</td>
          <td style="padding:8px 10px;font-size:12px;color:#aaa;white-space:nowrap">${time} EST</td>
        </tr>`;
    }).join('');

    return `
      <div style="margin-bottom:28px">
        <h3 style="color:#2980b9;font-size:14px;margin:0 0 8px;border-bottom:2px solid #e8f4fd;padding-bottom:6px">
          🌐 ${domain} — ${arts.length} articol${arts.length !== 1 ? 'i' : 'o'}
        </h3>
        <table style="width:100%;border-collapse:collapse">
          <thead>
            <tr style="background:#f9f9f9">
              <th style="padding:6px 10px;text-align:left;font-size:11px;color:#999;font-weight:600">TITOLO</th>
              <th style="padding:6px 10px;text-align:left;font-size:11px;color:#999;font-weight:600">PAROLE</th>
              <th style="padding:6px 10px;text-align:center;font-size:11px;color:#999;font-weight:600">IMG</th>
              <th style="padding:6px 10px;text-align:left;font-size:11px;color:#999;font-weight:600">ORA</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>`;
  }).join('');

  return `
<div style="font-family:Arial,sans-serif;max-width:700px;margin:0 auto;padding:20px">
  <h2 style="color:#2c3e50;margin-bottom:4px">📰 Daily Digest</h2>
  <p style="color:#666;font-size:13px;margin-top:0">${dateStr} — ${total} articol${total !== 1 ? 'i' : 'o'} pubblicat${total !== 1 ? 'i' : 'o'} nelle ultime 24h</p>

  ${siteBlocks}

  <div style="background:#f0f7ff;border-left:3px solid #3498db;padding:10px 14px;border-radius:2px;margin-top:8px">
    <p style="margin:0;font-size:12px;color:#555">
      📷 = immagine presente &nbsp;|&nbsp; ⬜ = senza immagine (nessun match Pexels/Unsplash/fal.ai)<br>
      Titoli cliccabili — aprono direttamente l'articolo live.
    </p>
  </div>

  <p style="color:#ccc;font-size:11px;margin-top:20px">${new Date().toISOString()} — Content Network</p>
</div>`;
}

function buildZeroHtml(dateStr) {
  return `
<div style="font-family:Arial,sans-serif;max-width:700px;margin:0 auto;padding:20px">
  <h2 style="color:#c0392b;margin-bottom:4px">⚠️ Daily Digest — 0 articoli pubblicati</h2>
  <p style="color:#666;font-size:13px;margin-top:0">${dateStr}</p>
  <p style="color:#444;font-size:14px">
    Nessun articolo è stato pubblicato nelle ultime 24 ore.<br>
    Possibili cause: scheduler fermo, pool keyword esaurito, errori di generazione.
  </p>
  <p style="font-size:13px;color:#888">
    Controlla: <code>pm2 logs content-scheduler --lines 50</code>
  </p>
  <p style="color:#ccc;font-size:11px;margin-top:20px">${new Date().toISOString()} — Content Network</p>
</div>`;
}

async function sendEmail(subject, html) {
  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  const TO = process.env.ALERT_EMAIL_TO;
  const FROM = process.env.ALERT_EMAIL_FROM || 'onboarding@resend.dev';

  if (!RESEND_API_KEY || !TO) {
    console.log('[digest] No email config — skipping');
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
  console.error('daily-digest error:', err.message);
  process.exit(1);
});
