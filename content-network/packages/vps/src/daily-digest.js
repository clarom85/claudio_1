/**
 * daily-digest.js
 *
 * Invia email ogni giorno alle 09:00 UTC con:
 *  - Articoli pubblicati nelle ultime 24 ore (per sito)
 *  - Articoli in coda per OGGI (publish_queue, status pending)
 *  - Stato dead day per ogni sito
 *  - Totale articoli pubblicati per sito
 *
 * Run manuale: node packages/vps/src/daily-digest.js
 * Scheduler:   ogni giorno alle 09:xx UTC
 */
import 'dotenv/config';
import { sql } from '@content-network/db';
import { isDeadDay, getDailyArticleLimit } from '@content-network/content-engine/src/publishing-schedule.js';

async function run() {
  const now = new Date();
  const since = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  // EST = UTC-5 (no DST) — fine giornata EST = fine giornata + 5h UTC
  const endOfDayEst = new Date(now);
  endOfDayEst.setUTCHours(23 + 5, 59, 59, 999); // 23:59 EST = 04:59 UTC domani

  const [published, upcoming, sites, totalCounts] = await Promise.all([
    // Articoli pubblicati nelle ultime 24h
    sql`
      SELECT a.title, a.slug, a.word_count, a.image, a.published_at, s.domain
      FROM articles a
      JOIN sites s ON a.site_id = s.id
      WHERE a.status = 'published'
        AND a.published_at >= ${since.toISOString()}
      ORDER BY s.domain, a.published_at DESC
    `,
    // Articoli in coda per oggi (non ancora pubblicati) — solo siti live
    sql`
      SELECT pq.scheduled_for, pq.status, a.title, a.word_count, s.domain, s.id as site_id
      FROM publish_queue pq
      JOIN articles a ON pq.article_id = a.id
      JOIN sites s ON pq.site_id = s.id
      WHERE pq.scheduled_for >= ${now.toISOString()}
        AND pq.scheduled_for <= ${endOfDayEst.toISOString()}
        AND pq.status IN ('pending', 'scheduled')
        AND s.status = 'live'
      ORDER BY s.domain, pq.scheduled_for
    `,
    // Info siti attivi
    sql`SELECT id, domain, created_at FROM sites WHERE status != 'inactive' ORDER BY id`,
    // Totale articoli pubblicati per sito
    sql`
      SELECT site_id, COUNT(*) as total
      FROM articles
      WHERE status = 'published'
      GROUP BY site_id
    `,
  ]);

  const totalMap = {};
  for (const r of totalCounts) totalMap[r.site_id] = parseInt(r.total);

  const dateStr = now.toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  const html = buildHtml(published, upcoming, sites, totalMap, dateStr, now);
  const pubCount = published.length;
  const upCount = upcoming.length;
  const subject = `📰 Daily Digest — ${pubCount} pubblicat${pubCount !== 1 ? 'i' : 'o'} ieri · ${upCount} in coda oggi (${now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})`;

  await sendEmail(subject, html);
  console.log(`[digest] Sent — ${pubCount} published, ${upCount} upcoming`);
}

function buildHtml(published, upcoming, sites, totalMap, dateStr, now) {
  // ── Sezione: Pubblicati ieri ──────────────────────────────────────
  const pubBySite = {};
  for (const a of published) {
    if (!pubBySite[a.domain]) pubBySite[a.domain] = [];
    pubBySite[a.domain].push(a);
  }

  const pubBlocks = Object.entries(pubBySite).map(([domain, arts]) => {
    const rows = arts.map(a => {
      const time = new Date(a.published_at).toLocaleTimeString('en-US', {
        hour: '2-digit', minute: '2-digit', timeZone: 'America/New_York'
      });
      const wc = a.word_count ? `${a.word_count.toLocaleString()} w` : '—';
      const img = a.image ? '📷' : '⬜';
      const url = `https://${domain}/${a.slug}/`;
      return `<tr style="border-bottom:1px solid #f0f0f0">
        <td style="padding:7px 10px;font-size:13px"><a href="${url}" style="color:#2c3e50;text-decoration:none;font-weight:500">${a.title}</a></td>
        <td style="padding:7px 10px;font-size:12px;color:#888;white-space:nowrap">${wc}</td>
        <td style="padding:7px 10px;font-size:13px;text-align:center">${img}</td>
        <td style="padding:7px 10px;font-size:12px;color:#aaa;white-space:nowrap">${time} EST</td>
      </tr>`;
    }).join('');

    return `<div style="margin-bottom:20px">
      <h3 style="color:#2980b9;font-size:14px;margin:0 0 6px;border-bottom:2px solid #e8f4fd;padding-bottom:5px">
        🌐 ${domain} — ${arts.length} articol${arts.length !== 1 ? 'i' : 'o'}
      </h3>
      <table style="width:100%;border-collapse:collapse">
        <thead><tr style="background:#f9f9f9">
          <th style="padding:5px 10px;text-align:left;font-size:11px;color:#999;font-weight:600">TITOLO</th>
          <th style="padding:5px 10px;text-align:left;font-size:11px;color:#999;font-weight:600">PAROLE</th>
          <th style="padding:5px 10px;text-align:center;font-size:11px;color:#999;font-weight:600">IMG</th>
          <th style="padding:5px 10px;text-align:left;font-size:11px;color:#999;font-weight:600">ORA</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
  }).join('');

  const pubSection = published.length > 0
    ? `<div style="margin-bottom:32px">
        <h2 style="color:#2c3e50;font-size:16px;margin:0 0 12px;padding-bottom:8px;border-bottom:3px solid #2c3e50">
          ✅ Pubblicati ieri — ${published.length} articol${published.length !== 1 ? 'i' : 'o'}
        </h2>
        ${pubBlocks}
      </div>`
    : `<div style="margin-bottom:32px;padding:16px;background:#fff8f0;border-left:4px solid #e67e22;border-radius:2px">
        <strong style="color:#e67e22">⚠️ 0 articoli pubblicati nelle ultime 24h</strong>
        <p style="margin:6px 0 0;font-size:13px;color:#666">Possibili cause: dead day, pool keyword esaurito, errori scheduler.</p>
      </div>`;

  // ── Sezione: In coda oggi ─────────────────────────────────────────
  const upBySite = {};
  for (const a of upcoming) {
    if (!upBySite[a.domain]) upBySite[a.domain] = [];
    upBySite[a.domain].push(a);
  }

  let upSection;
  if (upcoming.length > 0) {
    const upBlocks = Object.entries(upBySite).map(([domain, arts]) => {
      const rows = arts.map(a => {
        const time = new Date(a.scheduled_for).toLocaleTimeString('en-US', {
          hour: '2-digit', minute: '2-digit', timeZone: 'America/New_York'
        });
        const wc = a.word_count ? `${a.word_count.toLocaleString()} w` : '—';
        return `<tr style="border-bottom:1px solid #f0f0f0">
          <td style="padding:7px 10px;font-size:13px;color:#2c3e50;font-weight:500">${a.title}</td>
          <td style="padding:7px 10px;font-size:12px;color:#888;white-space:nowrap">${wc}</td>
          <td style="padding:7px 10px;font-size:12px;color:#27ae60;font-weight:600;white-space:nowrap">🕐 ${time} EST</td>
        </tr>`;
      }).join('');

      return `<div style="margin-bottom:16px">
        <h3 style="color:#27ae60;font-size:14px;margin:0 0 6px;border-bottom:2px solid #d5f5e3;padding-bottom:5px">
          🌐 ${domain} — ${arts.length} in coda
        </h3>
        <table style="width:100%;border-collapse:collapse">
          <thead><tr style="background:#f9f9f9">
            <th style="padding:5px 10px;text-align:left;font-size:11px;color:#999;font-weight:600">TITOLO</th>
            <th style="padding:5px 10px;text-align:left;font-size:11px;color:#999;font-weight:600">PAROLE</th>
            <th style="padding:5px 10px;text-align:left;font-size:11px;color:#999;font-weight:600">ORARIO</th>
          </tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>`;
    }).join('');

    upSection = `<div style="margin-bottom:32px">
      <h2 style="color:#27ae60;font-size:16px;margin:0 0 12px;padding-bottom:8px;border-bottom:3px solid #27ae60">
        🕐 In coda oggi — ${upcoming.length} articol${upcoming.length !== 1 ? 'i' : 'o'}
      </h2>
      ${upBlocks}
    </div>`;
  } else {
    upSection = `<div style="margin-bottom:32px;padding:12px 16px;background:#fafafa;border-left:4px solid #bdc3c7;border-radius:2px">
      <strong style="color:#7f8c8d">📭 Nessun articolo in coda per oggi</strong>
      <p style="margin:4px 0 0;font-size:12px;color:#aaa">Gli articoli vengono generati e accodati durante la finestra EST 08:00–20:00.</p>
    </div>`;
  }

  // ── Sezione: Stato siti ───────────────────────────────────────────
  const siteRows = sites.map(s => {
    const dead = isDeadDay(s.id, s.created_at, now);
    const { count: target, label, ageDays } = getDailyArticleLimit(s.created_at, now);
    const total = totalMap[s.id] || 0;
    const todayPub = pubBySite[s.domain]?.length || 0;
    const todayUp = upBySite[s.domain]?.length || 0;
    const deadBadge = dead
      ? '<span style="background:#e74c3c;color:#fff;font-size:10px;padding:2px 7px;border-radius:10px;font-weight:700">DEAD DAY</span>'
      : '<span style="background:#27ae60;color:#fff;font-size:10px;padding:2px 7px;border-radius:10px;font-weight:700">ATTIVO</span>';
    return `<tr style="border-bottom:1px solid #f0f0f0">
      <td style="padding:8px 10px;font-size:13px;font-weight:600;color:#2c3e50">${s.domain}</td>
      <td style="padding:8px 10px;font-size:12px;color:#666">${ageDays}gg · ${label}</td>
      <td style="padding:8px 10px;font-size:13px;text-align:center">${deadBadge}</td>
      <td style="padding:8px 10px;font-size:12px;color:#888;text-align:center">${dead ? '—' : target + '/giorno'}</td>
      <td style="padding:8px 10px;font-size:12px;color:#555;text-align:center">${todayPub} pub · ${todayUp} in coda</td>
      <td style="padding:8px 10px;font-size:12px;color:#aaa;text-align:right">${total} totali</td>
    </tr>`;
  }).join('');

  const statusSection = `<div style="margin-bottom:24px">
    <h2 style="color:#2c3e50;font-size:16px;margin:0 0 12px;padding-bottom:8px;border-bottom:3px solid #2c3e50">
      📊 Stato siti
    </h2>
    <table style="width:100%;border-collapse:collapse">
      <thead><tr style="background:#f9f9f9">
        <th style="padding:6px 10px;text-align:left;font-size:11px;color:#999;font-weight:600">SITO</th>
        <th style="padding:6px 10px;text-align:left;font-size:11px;color:#999;font-weight:600">ETÀ / FASE</th>
        <th style="padding:6px 10px;text-align:center;font-size:11px;color:#999;font-weight:600">OGGI</th>
        <th style="padding:6px 10px;text-align:center;font-size:11px;color:#999;font-weight:600">TARGET</th>
        <th style="padding:6px 10px;text-align:center;font-size:11px;color:#999;font-weight:600">PUBBLICAZIONI</th>
        <th style="padding:6px 10px;text-align:right;font-size:11px;color:#999;font-weight:600">TOTALE</th>
      </tr></thead>
      <tbody>${siteRows}</tbody>
    </table>
  </div>`;

  return `<div style="font-family:Arial,sans-serif;max-width:720px;margin:0 auto;padding:20px">
  <h2 style="color:#2c3e50;margin-bottom:2px">📰 Daily Digest — Content Network</h2>
  <p style="color:#888;font-size:13px;margin-top:0 0 24px">${dateStr}</p>

  ${statusSection}
  ${upSection}
  ${pubSection}

  <div style="background:#f0f7ff;border-left:3px solid #3498db;padding:10px 14px;border-radius:2px;margin-top:8px">
    <p style="margin:0;font-size:12px;color:#555">
      📷 = immagine presente &nbsp;|&nbsp; ⬜ = senza immagine &nbsp;|&nbsp;
      Orari in EST (UTC-5) &nbsp;|&nbsp; Gli articoli in coda vengono generati durante la finestra EST 08:00–20:00
    </p>
  </div>
  <p style="color:#ccc;font-size:11px;margin-top:16px">${now.toISOString()} — Content Network</p>
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
