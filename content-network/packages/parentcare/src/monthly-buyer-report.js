/**
 * monthly-buyer-report.js
 *
 * For each active buyer, computes last-month stats and sends a clean
 * HTML email summary (the "1-page PDF" replacement: same content, but
 * delivered as an email any provider can read on phone or print).
 *
 * Usage:
 *   node packages/parentcare/src/monthly-buyer-report.js                # last full month
 *   node packages/parentcare/src/monthly-buyer-report.js --month=2026-04 # specific month
 *   node packages/parentcare/src/monthly-buyer-report.js --dry-run       # print, don't send
 *   node packages/parentcare/src/monthly-buyer-report.js --buyer-id=1    # one buyer only
 *
 * Cron suggestion (1st of each month, 09:00 EST):
 *   0 14 1 * * node packages/parentcare/src/monthly-buyer-report.js
 */

import 'dotenv/config';
import { sql } from '@content-network/db';
import { sendEmail } from './mailer.js';
import { labelFor } from './quiz-config.js';

const TERRA = '#c4622d';
const SAGE = '#5a7a5a';
const WARM = '#3d2b1f';
const CREAM = '#faf6f1';
const FROM = process.env.ALERT_EMAIL_FROM
  ? `ParentCare Finder <${process.env.ALERT_EMAIL_FROM}>`
  : 'ParentCare Finder <onboarding@resend.dev>';
const REPLY_TO = process.env.PARENTCARE_REPLY_TO || 'vireonmediaadv@gmail.com';

function fmtPhone(d) {
  d = String(d || '').replace(/\D/g, '');
  if (d.length === 10) return `(${d.slice(0,3)}) ${d.slice(3,6)}-${d.slice(6)}`;
  return d || '—';
}
function esc(s = '') {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function monthRange(monthArg) {
  // monthArg = "2026-04" or null (= last month)
  let y, m;
  if (monthArg && /^\d{4}-\d{2}$/.test(monthArg)) {
    [y, m] = monthArg.split('-').map(Number);
  } else {
    const now = new Date();
    y = now.getUTCFullYear();
    m = now.getUTCMonth(); // last month
    if (m === 0) { y--; m = 12; } // January → previous year December
  }
  const start = new Date(Date.UTC(y, m - 1, 1));
  const end = new Date(Date.UTC(y, m, 1));
  const label = start.toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });
  return { start, end, label };
}

function buildReportHtml({ buyer, period, stats, leads }) {
  const rowsHtml = leads.length ? leads.map(l => {
    const respColor = l.response === 'accepted' ? SAGE : l.response === 'rejected' ? '#a8521f' : '#888';
    const respLabel = l.response === 'accepted'
      ? (((l.notes || '').toLowerCase().includes('tour')) ? 'Tour booked' : 'Good')
      : l.response === 'rejected' ? 'Bad fit'
      : l.response === 'no_response' ? 'No answer'
      : 'Pending';
    return `<tr>
      <td style="padding:8px 10px;border-bottom:1px solid #f0e8de;font-size:12px;color:#7a6a5a;white-space:nowrap">${esc(new Date(l.routed_at).toLocaleDateString('en-US',{month:'short',day:'numeric'}))}</td>
      <td style="padding:8px 10px;border-bottom:1px solid #f0e8de;font-size:13px"><strong>${esc(l.name || '—')}</strong> · <span style="color:#7a6a5a">${esc(l.zip || '')}</span></td>
      <td style="padding:8px 10px;border-bottom:1px solid #f0e8de;font-size:12px;color:#7a6a5a">${esc(labelFor('urgency', l.urgency))} · ${esc(labelFor('level_help', l.level_help))}</td>
      <td style="padding:8px 10px;border-bottom:1px solid #f0e8de;font-size:13px;color:${respColor};font-weight:600">${esc(respLabel)}</td>
    </tr>`;
  }).join('') : `<tr><td colspan="4" style="padding:24px;text-align:center;color:#aaa;font-size:13px">No leads delivered in this period.</td></tr>`;

  const invoiceTotal = stats.billable * Number(buyer.price_per_lead || 50);
  const invoiceText = buyer.pilot && stats.pilotConsumed > 0
    ? `${stats.billable} billable lead(s) × $${Number(buyer.price_per_lead).toFixed(0)} = <strong>$${invoiceTotal.toFixed(2)}</strong> &middot; <span style="color:${SAGE}">${stats.pilotConsumed} free pilot lead(s) included</span>`
    : `${stats.billable} billable lead(s) × $${Number(buyer.price_per_lead).toFixed(0)} = <strong>$${invoiceTotal.toFixed(2)}</strong>`;

  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:${CREAM};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:${WARM}">
<div style="max-width:640px;margin:0 auto;padding:24px 16px">
  <div style="background:#fff;border-radius:10px;border:1px solid #e6dccf;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,.06)">
    <div style="background:${WARM};color:#fff;padding:24px 28px">
      <div style="font-size:11px;letter-spacing:2px;text-transform:uppercase;opacity:.7;margin-bottom:4px">ParentCare Finder · Monthly Report</div>
      <h1 style="font-family:Georgia,serif;font-weight:500;font-size:24px;margin:0">${esc(buyer.name)}</h1>
      <p style="font-size:13px;color:rgba(255,255,255,.8);margin:6px 0 0">${esc(period.label)}</p>
    </div>

    <div style="padding:24px 28px">
      <p style="font-size:14px;line-height:1.7;margin:0 0 18px;color:${WARM}">
        Hi ${esc(buyer.contact_name || buyer.name)},<br><br>
        Here is your ParentCare Finder summary for <strong>${esc(period.label)}</strong>.
      </p>

      <div style="display:flex;gap:10px;flex-wrap:wrap;margin:20px 0">
        <div style="flex:1;min-width:120px;background:${CREAM};border:1px solid #e6dccf;border-radius:8px;padding:14px;text-align:center">
          <div style="font-size:28px;font-weight:700;color:${TERRA};line-height:1">${stats.total}</div>
          <div style="font-size:11px;letter-spacing:1px;color:#7a6a5a;text-transform:uppercase;margin-top:4px">Delivered</div>
        </div>
        <div style="flex:1;min-width:120px;background:${CREAM};border:1px solid #e6dccf;border-radius:8px;padding:14px;text-align:center">
          <div style="font-size:28px;font-weight:700;color:${SAGE};line-height:1">${stats.good}</div>
          <div style="font-size:11px;letter-spacing:1px;color:#7a6a5a;text-transform:uppercase;margin-top:4px">Good</div>
        </div>
        <div style="flex:1;min-width:120px;background:${CREAM};border:1px solid #e6dccf;border-radius:8px;padding:14px;text-align:center">
          <div style="font-size:28px;font-weight:700;color:#456845;line-height:1">${stats.tour}</div>
          <div style="font-size:11px;letter-spacing:1px;color:#7a6a5a;text-transform:uppercase;margin-top:4px">Tours</div>
        </div>
        <div style="flex:1;min-width:120px;background:${CREAM};border:1px solid #e6dccf;border-radius:8px;padding:14px;text-align:center">
          <div style="font-size:28px;font-weight:700;color:#a8521f;line-height:1">${stats.bad}</div>
          <div style="font-size:11px;letter-spacing:1px;color:#7a6a5a;text-transform:uppercase;margin-top:4px">Bad fit</div>
        </div>
        <div style="flex:1;min-width:120px;background:${CREAM};border:1px solid #e6dccf;border-radius:8px;padding:14px;text-align:center">
          <div style="font-size:28px;font-weight:700;color:#888;line-height:1">${stats.pending}</div>
          <div style="font-size:11px;letter-spacing:1px;color:#7a6a5a;text-transform:uppercase;margin-top:4px">Pending</div>
        </div>
      </div>

      <div style="background:${CREAM};border-left:3px solid ${TERRA};padding:14px 18px;margin:24px 0;border-radius:4px">
        <div style="font-size:11px;letter-spacing:1.5px;color:${TERRA};text-transform:uppercase;font-weight:700;margin-bottom:6px">Invoice this period</div>
        <p style="font-size:14px;line-height:1.6;margin:0">${invoiceText}</p>
        ${invoiceTotal > 0 ? `<p style="font-size:11px;color:#7a6a5a;margin:8px 0 0">Payable to Vireon Media. Invoice link or wire details follow in a separate email.</p>` : ''}
      </div>

      <h3 style="font-size:14px;letter-spacing:1px;text-transform:uppercase;color:#7a6a5a;font-weight:700;margin:28px 0 10px">Lead detail</h3>
      <table cellpadding="0" cellspacing="0" border="0" style="width:100%;border-collapse:collapse">
        <thead>
          <tr style="background:#f5ecdf">
            <th style="padding:8px 10px;text-align:left;font-size:11px;letter-spacing:.5px;text-transform:uppercase;color:#7a6a5a;font-weight:600">Date</th>
            <th style="padding:8px 10px;text-align:left;font-size:11px;letter-spacing:.5px;text-transform:uppercase;color:#7a6a5a;font-weight:600">Family</th>
            <th style="padding:8px 10px;text-align:left;font-size:11px;letter-spacing:.5px;text-transform:uppercase;color:#7a6a5a;font-weight:600">Need</th>
            <th style="padding:8px 10px;text-align:left;font-size:11px;letter-spacing:.5px;text-transform:uppercase;color:#7a6a5a;font-weight:600">Outcome</th>
          </tr>
        </thead>
        <tbody>${rowsHtml}</tbody>
      </table>

      ${buyer.auth_token ? `<div style="text-align:center;margin:32px 0 12px">
        <a href="https://medicarepriceguide.com/buyer-portal?token=${buyer.auth_token}" style="background:${TERRA};color:#fff;padding:13px 26px;border-radius:6px;font-weight:700;font-size:14px;text-decoration:none;display:inline-block">Open Lead Portal &rarr;</a>
      </div>` : ''}

      <p style="font-size:12px;color:#7a6a5a;line-height:1.7;margin:32px 0 0;border-top:1px solid #f0e8de;padding-top:16px">
        Reply to this email with any questions, billing corrections, or to update your ZIP coverage. We aim to respond within 24 hours.<br><br>
        <strong>Want fewer or different leads?</strong> Just tell us what's working and what isn't. We adjust the routing every month based on your feedback.
      </p>
    </div>
  </div>
  <p style="font-size:11px;color:#aaa;text-align:center;margin:18px 0 0">
    ParentCare Finder &middot; a Vireon Media property &middot; <a href="mailto:partners@medicarepriceguide.com" style="color:#aaa">partners@medicarepriceguide.com</a>
  </p>
</div>
</body></html>`;
}

function buildReportText({ buyer, period, stats, leads }) {
  const invoiceTotal = stats.billable * Number(buyer.price_per_lead || 50);
  return [
    `ParentCare Finder — Monthly Report`,
    `${buyer.name} · ${period.label}`,
    `─────────────────────────────────────`,
    ``,
    `Total delivered:  ${stats.total}`,
    `Good leads:       ${stats.good}`,
    `Tours booked:     ${stats.tour}`,
    `Bad fit:          ${stats.bad}`,
    `No answer:        ${stats.noanswer}`,
    `Pending feedback: ${stats.pending}`,
    ``,
    `Invoice: ${stats.billable} billable × $${Number(buyer.price_per_lead).toFixed(0)} = $${invoiceTotal.toFixed(2)}`,
    buyer.pilot ? `Free pilot leads included: ${stats.pilotConsumed}` : '',
    ``,
    `Lead detail:`,
    leads.length ? leads.map(l => `  ${new Date(l.routed_at).toLocaleDateString('en-US')} — ${l.name || '—'} (${l.zip}) — ${l.response || 'pending'}`).join('\n') : '  (no leads in this period)',
    ``,
    `Reply to this email with questions or feedback.`,
    ``,
    `ParentCare Finder · partners@medicarepriceguide.com`,
  ].filter(Boolean).join('\n');
}

async function processBuyer(buyer, period, dryRun = false) {
  const routings = await sql`
    SELECT r.id, r.routed_at, r.buyer_response AS response, r.price_paid, r.notes,
           l.name, l.zip, l.urgency, l.level_help, l.location_now, l.payment, l.tier
    FROM parentcare_routing r
    JOIN parentcare_leads l ON l.id = r.lead_id
    WHERE r.buyer_id = ${buyer.id}
      AND r.routed_at >= ${period.start.toISOString()}
      AND r.routed_at <  ${period.end.toISOString()}
    ORDER BY r.routed_at ASC
  `;

  const stats = {
    total: routings.length,
    good: routings.filter(r => r.response === 'accepted').length,
    bad: routings.filter(r => r.response === 'rejected').length,
    noanswer: routings.filter(r => r.response === 'no_response').length,
    pending: routings.filter(r => !r.response || r.response === 'pending').length,
    tour: routings.filter(r => r.response === 'accepted' && (r.notes || '').toLowerCase().includes('tour')).length,
    pilotConsumed: routings.filter(r => Number(r.price_paid || 0) === 0 && r.response === 'accepted').length,
    billable: routings.filter(r => r.response === 'accepted' && Number(r.price_paid || 0) > 0).length,
  };

  if (stats.total === 0 && !dryRun) {
    console.log(`  · ${buyer.name}: 0 leads — skip email`);
    return { skipped: true };
  }

  const html = buildReportHtml({ buyer, period, stats, leads: routings });
  const text = buildReportText({ buyer, period, stats, leads: routings });
  const subject = `${buyer.name} — ${period.label} report (${stats.total} lead${stats.total===1?'':'s'})`;

  if (dryRun) {
    console.log(`\n=== DRY RUN: ${buyer.name} ===`);
    console.log(text);
    return { dryRun: true };
  }

  const result = await sendEmail({
    from: FROM,
    to: buyer.email,
    replyTo: REPLY_TO,
    subject, html, text,
  });
  if (!result.ok) {
    console.error(`  ✗ ${buyer.name}: ${result.error || 'send failed'}`);
    return { error: true };
  }
  console.log(`  ✓ ${buyer.name}: report sent (${stats.total} leads, $${(stats.billable*Number(buyer.price_per_lead)).toFixed(2)} invoice)`);
  return { ok: true };
}

async function run() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const monthArg = args.find(a => a.startsWith('--month='))?.split('=')[1] || null;
  const buyerIdArg = parseInt(args.find(a => a.startsWith('--buyer-id='))?.split('=')[1]) || null;

  const period = monthRange(monthArg);
  console.log(`\nMonthly buyer report — ${period.label}${dryRun ? ' [DRY RUN]' : ''}\n`);

  const buyers = buyerIdArg
    ? await sql`SELECT * FROM parentcare_buyers WHERE id = ${buyerIdArg}`
    : await sql`SELECT * FROM parentcare_buyers WHERE active = TRUE ORDER BY id`;

  if (!buyers.length) {
    console.log('No active buyers.');
    process.exit(0);
  }

  let sent = 0, skipped = 0, failed = 0;
  for (const b of buyers) {
    const r = await processBuyer(b, period, dryRun);
    if (r.ok) sent++;
    else if (r.skipped) skipped++;
    else if (r.error) failed++;
  }

  console.log(`\nDone — sent=${sent}, skipped=${skipped}, failed=${failed}`);
  process.exit(failed > 0 ? 1 : 0);
}

run().catch(err => { console.error(err); process.exit(1); });
