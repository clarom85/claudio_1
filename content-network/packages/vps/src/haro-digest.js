/**
 * haro-digest.js — Weekly HARO / journalist outreach digest
 *
 * Inviato ogni domenica alle 13:xx UTC.
 * Legge la tabella journalist_outreach e genera un report settimanale:
 *   - Richieste viste / rilevanti / email inviate / backlink ricevuti
 *   - Breakdown per fonte e per nicchia
 *   - Top pitch inviati questa settimana
 *   - Pitch in attesa di risposta (inviati, link non ancora ricevuto)
 *
 * Uso manuale:
 *   node packages/vps/src/haro-digest.js
 *   node packages/vps/src/haro-digest.js --weeks 2   # ultimi 14 giorni
 */
import 'dotenv/config';
import { sql } from '@content-network/db';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM           = process.env.ALERT_EMAIL_FROM;
const TO             = process.env.ALERT_EMAIL_TO;

const weeksArg = (() => {
  const i = process.argv.indexOf('--weeks');
  return i >= 0 ? (parseInt(process.argv[i + 1]) || 1) : 1;
})();
const DAYS = weeksArg * 7;

async function sendEmail(subject, html) {
  if (!RESEND_API_KEY || !FROM || !TO) {
    console.log('Email env not configured — printing to stdout only.');
    return false;
  }
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: FROM, to: TO, subject, html }),
  });
  return res.ok;
}

function pct(num, den) {
  if (!den) return '—';
  return `${Math.round((num / den) * 100)}%`;
}

function row(cells) {
  return `<tr>${cells.map(c => `<td style="padding:6px 10px;border-bottom:1px solid #eee">${c}</td>`).join('')}</tr>`;
}

function th(cells) {
  return `<tr>${cells.map(c => `<th style="padding:6px 10px;background:#f5f5f5;text-align:left;font-size:12px;text-transform:uppercase;letter-spacing:.5px">${c}</th>`).join('')}</tr>`;
}

async function run() {
  console.log(`\n📰 HARO Digest — last ${DAYS} day(s)\n`);

  // ── Check table exists ────────────────────────────────────────────────────
  const tableCheck = await sql`
    SELECT EXISTS (
      SELECT FROM information_schema.tables
      WHERE table_name = 'journalist_outreach'
    ) AS exists
  `;
  if (!tableCheck[0]?.exists) {
    console.log('journalist_outreach table does not exist yet — skipping digest.');
    process.exit(0);
  }

  // ── Top-level counts ──────────────────────────────────────────────────────
  const [totals] = await sql`
    SELECT
      COUNT(*)                                         AS total_seen,
      COUNT(*) FILTER (WHERE relevance_score >= 7)    AS relevant,
      COUNT(*) FILTER (WHERE response_sent = true)    AS emails_sent,
      COUNT(*) FILTER (WHERE link_received  = true)   AS links_received
    FROM journalist_outreach
    WHERE created_at >= NOW() - (${DAYS} || ' days')::INTERVAL
  `;

  // ── Breakdown by source ───────────────────────────────────────────────────
  const bySource = await sql`
    SELECT
      source,
      COUNT(*)                                         AS total,
      COUNT(*) FILTER (WHERE relevance_score >= 7)    AS relevant,
      COUNT(*) FILTER (WHERE response_sent = true)    AS sent
    FROM journalist_outreach
    WHERE created_at >= NOW() - (${DAYS} || ' days')::INTERVAL
    GROUP BY source
    ORDER BY total DESC
  `;

  // ── Breakdown by niche ────────────────────────────────────────────────────
  const byNiche = await sql`
    SELECT
      COALESCE(niche_slug, 'unmatched')                AS niche,
      COUNT(*)                                         AS total,
      COUNT(*) FILTER (WHERE relevance_score >= 7)    AS relevant,
      COUNT(*) FILTER (WHERE response_sent = true)    AS sent,
      COUNT(*) FILTER (WHERE link_received  = true)   AS links
    FROM journalist_outreach
    WHERE created_at >= NOW() - (${DAYS} || ' days')::INTERVAL
    GROUP BY niche_slug
    ORDER BY relevant DESC
  `;

  // ── Top pitches sent this week ────────────────────────────────────────────
  const topPitches = await sql`
    SELECT
      request_title,
      source,
      niche_slug,
      relevance_score,
      journalist_email,
      response_sent_at
    FROM journalist_outreach
    WHERE response_sent = true
      AND created_at >= NOW() - (${DAYS} || ' days')::INTERVAL
    ORDER BY relevance_score DESC, response_sent_at DESC
    LIMIT 10
  `;

  // ── Awaiting link (sent > 7 days ago, no link yet) ────────────────────────
  const awaitingLink = await sql`
    SELECT
      request_title,
      journalist_email,
      journalist_name,
      niche_slug,
      response_sent_at
    FROM journalist_outreach
    WHERE response_sent = true
      AND link_received = false
      AND response_sent_at < NOW() - INTERVAL '7 days'
    ORDER BY response_sent_at DESC
    LIMIT 15
  `;

  // ── All-time totals ───────────────────────────────────────────────────────
  const [allTime] = await sql`
    SELECT
      COUNT(*)                                         AS total_seen,
      COUNT(*) FILTER (WHERE response_sent = true)    AS emails_sent,
      COUNT(*) FILTER (WHERE link_received  = true)   AS links_received
    FROM journalist_outreach
  `;

  // ── Console summary ───────────────────────────────────────────────────────
  console.log(`Period: last ${DAYS} days`);
  console.log(`Requests seen:  ${totals.total_seen}`);
  console.log(`Relevant (≥7):  ${totals.relevant}`);
  console.log(`Emails sent:    ${totals.emails_sent}`);
  console.log(`Links received: ${totals.links_received}`);
  console.log(`\nAll-time: ${allTime.emails_sent} pitches → ${allTime.links_received} backlinks`);

  if (!RESEND_API_KEY) { process.exit(0); }

  // ── Build HTML email ──────────────────────────────────────────────────────
  const periodLabel = DAYS === 7 ? 'This Week' : `Last ${DAYS} Days`;
  const convRate = pct(parseInt(totals.links_received), parseInt(totals.emails_sent));

  const sourcesRows = bySource.map(r =>
    row([r.source, r.total, r.relevant, r.sent])
  ).join('');

  const nicheRows = byNiche.map(r =>
    row([r.niche, r.total, r.relevant, r.sent, r.links])
  ).join('');

  const pitchRows = topPitches.length
    ? topPitches.map(p => row([
        `<span style="font-size:13px">${(p.request_title || '').substring(0, 80)}</span>`,
        p.source,
        p.niche_slug || '—',
        `<strong>${p.relevance_score}/10</strong>`,
        p.journalist_email || '—',
      ])).join('')
    : `<tr><td colspan="5" style="padding:10px;color:#999">No pitches sent this period</td></tr>`;

  const awaitRows = awaitingLink.length
    ? awaitingLink.map(r => row([
        `<span style="font-size:13px">${(r.request_title || '').substring(0, 80)}</span>`,
        r.journalist_email || '—',
        r.niche_slug || '—',
        r.response_sent_at ? new Date(r.response_sent_at).toLocaleDateString('en-US') : '—',
      ])).join('')
    : `<tr><td colspan="4" style="padding:10px;color:#999">None pending</td></tr>`;

  const html = `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;max-width:700px;margin:0 auto;padding:20px;color:#222">
<h2 style="color:#1a1a2e;border-bottom:3px solid #c0392b;padding-bottom:8px">📰 HARO Digest — ${periodLabel}</h2>

<table style="width:100%;border-collapse:collapse;margin-bottom:24px">
  <tr>
    <td style="text-align:center;padding:16px;background:#f9f9f9;border-radius:4px">
      <div style="font-size:28px;font-weight:700;color:#1a1a2e">${totals.total_seen}</div>
      <div style="font-size:12px;color:#666;text-transform:uppercase;letter-spacing:.5px">Requests Seen</div>
    </td>
    <td style="text-align:center;padding:16px;background:#f9f9f9;border-radius:4px">
      <div style="font-size:28px;font-weight:700;color:#e67e22">${totals.relevant}</div>
      <div style="font-size:12px;color:#666;text-transform:uppercase;letter-spacing:.5px">Relevant (≥7/10)</div>
    </td>
    <td style="text-align:center;padding:16px;background:#f9f9f9;border-radius:4px">
      <div style="font-size:28px;font-weight:700;color:#2980b9">${totals.emails_sent}</div>
      <div style="font-size:12px;color:#666;text-transform:uppercase;letter-spacing:.5px">Pitches Sent</div>
    </td>
    <td style="text-align:center;padding:16px;background:#f9f9f9;border-radius:4px">
      <div style="font-size:28px;font-weight:700;color:#27ae60">${totals.links_received}</div>
      <div style="font-size:12px;color:#666;text-transform:uppercase;letter-spacing:.5px">Backlinks Received</div>
    </td>
  </tr>
</table>

<p style="color:#555;font-size:14px">
  Pitch → backlink conversion this period: <strong>${convRate}</strong> &nbsp;|&nbsp;
  All-time: <strong>${allTime.emails_sent}</strong> pitches → <strong>${allTime.links_received}</strong> backlinks
</p>

<h3 style="color:#1a1a2e;margin-top:24px">By Source</h3>
<table style="width:100%;border-collapse:collapse">
  ${th(['Source', 'Total', 'Relevant', 'Sent'])}
  ${sourcesRows || '<tr><td colspan="4" style="padding:10px;color:#999">No data</td></tr>'}
</table>

<h3 style="color:#1a1a2e;margin-top:24px">By Niche</h3>
<table style="width:100%;border-collapse:collapse">
  ${th(['Niche', 'Total', 'Relevant', 'Sent', 'Links'])}
  ${nicheRows || '<tr><td colspan="5" style="padding:10px;color:#999">No data</td></tr>'}
</table>

<h3 style="color:#1a1a2e;margin-top:24px">Top Pitches Sent ${periodLabel}</h3>
<table style="width:100%;border-collapse:collapse">
  ${th(['Request', 'Source', 'Niche', 'Score', 'Journalist Email'])}
  ${pitchRows}
</table>

<h3 style="color:#1a1a2e;margin-top:24px">⏳ Awaiting Backlink (sent >7 days ago)</h3>
<p style="font-size:13px;color:#666">These pitches were sent but no backlink marked yet. Follow up or mark as received:<br>
<code style="background:#f5f5f5;padding:2px 6px">UPDATE journalist_outreach SET link_received=true WHERE journalist_email='...';</code></p>
<table style="width:100%;border-collapse:collapse">
  ${th(['Request', 'Journalist Email', 'Niche', 'Sent Date'])}
  ${awaitRows}
</table>

<hr style="margin:32px 0;border:none;border-top:1px solid #eee"/>
<p style="font-size:12px;color:#999">Content Network HARO Agent &middot; Runs every 6h &middot; Digest every Sunday 13:xx UTC</p>
</body></html>`;

  const subject = `HARO Digest ${periodLabel}: ${totals.emails_sent} pitches, ${totals.links_received} backlinks`;
  const ok = await sendEmail(subject, html);
  console.log(ok ? '✅ Digest email sent' : '❌ Email send failed');
  process.exit(0);
}

run().catch(err => { console.error(err); process.exit(1); });
