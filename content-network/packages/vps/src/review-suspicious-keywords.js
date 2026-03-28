/**
 * review-suspicious-keywords.js
 *
 * Scansiona il pool keyword, esclude automaticamente le sospette,
 * e invia email di notifica con il riepilogo di cosa è stato rimosso.
 *
 * L'utente può rispondere in chat per ripristinare qualsiasi keyword.
 *
 * Run manuale: node packages/vps/src/review-suspicious-keywords.js
 * Run dry:     node packages/vps/src/review-suspicious-keywords.js --dry-run
 * Scheduler:   domenica alle 11:xx (dopo GSC cleanup)
 */
import 'dotenv/config';
import { sql } from '@content-network/db';

const DRY_RUN = process.argv.includes('--dry-run');

// ── Regole: auto-exclude vs notify-only ──────────────────────────────────────
//
// auto: true  → keyword viene marcata used=true automaticamente
// auto: false → viene inclusa nell'email come FYI ma NON esclusa
//               (es. stale year: il review pass la corregge comunque)

const FLAG_RULES = [
  {
    reason: 'Non-US geo: Australia',
    auto: true,
    test: kw => /\baustrali(a|an|ans)?\b/i.test(kw),
  },
  {
    reason: 'Non-US geo: Canada',
    auto: true,
    test: kw => /\bcanad(a|ian|ians)?\b/i.test(kw),
  },
  {
    reason: 'Non-US geo: Netherlands',
    auto: true,
    test: kw => /\bnetherlands\b/i.test(kw),
  },
  {
    reason: 'Non-US geo: UK/British/Ireland',
    auto: true,
    test: kw => /\b(united kingdom|british|england|scotland|wales|ireland)\b/i.test(kw),
  },
  {
    reason: 'Non-US product: conservatory',
    auto: true,
    test: kw => /\bconservator(y|ies)\b/i.test(kw),
  },
  {
    reason: 'Non-US currency: pound/sterling',
    auto: true,
    test: kw => /\b(pound sterling|gbp)\b/i.test(kw),
  },
  {
    reason: 'Non-US healthcare: NHS/BUPA',
    auto: true,
    test: kw => /\b(nhs|bupa)\b/i.test(kw),
  },
  {
    reason: 'Off-topic: gaming',
    auto: true,
    test: kw => /\b(bloxburg|roblox|minecraft|fortnite|sims)\b/i.test(kw),
  },
  {
    reason: 'Non-ASCII characters',
    auto: true,
    test: kw => /[^\x00-\x7F]/.test(kw),
  },
  {
    reason: 'Too short (<3 words)',
    auto: true,
    test: kw => kw.trim().split(/\s+/).length < 3,
  },
  {
    // Stale year: NOT auto-excluded — review pass fixes the year in the title
    reason: 'Stale year (FYI — review pass will fix)',
    auto: false,
    test: kw => {
      const CY = new Date().getFullYear();
      const m = kw.match(/\b(202\d)\b/);
      return m && parseInt(m[1]) < CY;
    },
  },
];

function flagKeyword(keyword) {
  for (const rule of FLAG_RULES) {
    if (rule.test(keyword)) return { reason: rule.reason, auto: rule.auto };
  }
  return null;
}

// ── Email via Resend ──────────────────────────────────────────────────────────

async function sendNotificationEmail(excluded, notified) {
  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  const TO = process.env.ALERT_EMAIL_TO;
  const FROM = process.env.ALERT_EMAIL_FROM || 'onboarding@resend.dev';

  if (!RESEND_API_KEY || !TO) {
    console.log('[review] No email config — skipping email');
    return;
  }

  function buildTable(items, color) {
    if (!items.length) return '<p style="color:#888;font-size:13px">Nessuna.</p>';
    const rows = items.map(k => `
      <tr style="border-bottom:1px solid #eee">
        <td style="padding:5px 10px;font-family:monospace;font-size:12px;color:#777">${k.id}</td>
        <td style="padding:5px 10px;font-size:12px;color:#888">${k.site}</td>
        <td style="padding:5px 10px">${k.keyword}</td>
        <td style="padding:5px 10px;font-size:12px;color:${color}">${k.reason}</td>
      </tr>`).join('');
    return `<table style="width:100%;border-collapse:collapse;font-size:13px">
      <thead><tr style="background:#f5f5f5">
        <th style="padding:6px 10px;text-align:left;font-size:11px;color:#999">ID</th>
        <th style="padding:6px 10px;text-align:left;font-size:11px;color:#999">SITO</th>
        <th style="padding:6px 10px;text-align:left;font-size:11px;color:#999">KEYWORD</th>
        <th style="padding:6px 10px;text-align:left;font-size:11px;color:#999">MOTIVO</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>`;
  }

  const totalAction = excluded.length + notified.length;
  const dateStr = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const html = `
<div style="font-family:Arial,sans-serif;max-width:700px;margin:0 auto;padding:20px">
  <h2 style="color:#2c3e50;margin-bottom:4px">🧹 Keyword Pool — Report Settimanale</h2>
  <p style="color:#666;font-size:13px;margin-top:0">${dateStr}</p>

  ${excluded.length > 0 ? `
  <h3 style="color:#c0392b;font-size:14px;margin-bottom:8px">❌ Escluse automaticamente (${excluded.length})</h3>
  ${buildTable(excluded, '#c0392b')}
  <p style="font-size:12px;color:#888;margin-top:6px">Per ripristinarne qualcuna, rispondi in chat: "Ripristina keyword ID: 123, 456"</p>
  ` : '<p style="color:#27ae60">✅ Nessuna keyword esclusa questa settimana.</p>'}

  ${notified.length > 0 ? `
  <h3 style="color:#e67e22;font-size:14px;margin:20px 0 8px">⚠️ FYI — Non escluse, ma monitorate (${notified.length})</h3>
  ${buildTable(notified, '#e67e22')}
  <p style="font-size:12px;color:#888;margin-top:6px">Queste verranno generate normalmente — il review pass corregge l'anno nel titolo.</p>
  ` : ''}

  <div style="background:#f0f7ff;border-left:3px solid #3498db;padding:10px 14px;margin-top:20px;border-radius:2px">
    <p style="margin:0;font-size:12px;color:#555">
      <strong>Nessuna azione richiesta.</strong> Il pool procede in automatico.<br>
      Se vuoi ripristinare keyword escluse o aggiungerne di nuove, scrivi in chat.
    </p>
  </div>

  <p style="color:#ccc;font-size:11px;margin-top:20px">${new Date().toISOString()} — Content Network</p>
</div>`;

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: FROM,
      to: [TO],
      subject: `🧹 Keyword Pool — ${excluded.length} escluse, ${notified.length} monitorate`,
      html,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Resend error: ${err}`);
  }

  console.log(`[review] Email sent to ${TO}`);
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function run() {
  console.log('🔍 Suspicious keyword review...');

  const rows = await sql`
    SELECT
      k.id,
      k.keyword,
      n.slug   AS niche,
      s.domain AS site
    FROM keywords k
    JOIN niches n ON k.niche_id = n.id
    JOIN sites s  ON s.niche_id = n.id AND s.status = 'live'
    WHERE k.used = false
    ORDER BY n.slug, k.id
  `;

  console.log(`  Scanning ${rows.length} unused keywords...`);

  const toExclude = [];
  const toNotify  = [];

  for (const row of rows) {
    const flag = flagKeyword(row.keyword);
    if (!flag) continue;
    const item = { id: row.id, site: row.site, keyword: row.keyword, reason: flag.reason };
    if (flag.auto) toExclude.push(item);
    else           toNotify.push(item);
  }

  console.log(`  Auto-exclude: ${toExclude.length} | Notify-only: ${toNotify.length}`);

  if (toExclude.length === 0 && toNotify.length === 0) {
    console.log('  ✅ Pool clean — nothing to do');
    return;
  }

  // Print summary
  if (toExclude.length) {
    console.log('\n  EXCLUDED:');
    for (const k of toExclude) console.log(`    [${k.id}] ${k.keyword} — ${k.reason}`);
  }
  if (toNotify.length) {
    console.log('\n  NOTIFY-ONLY:');
    for (const k of toNotify) console.log(`    [${k.id}] ${k.keyword} — ${k.reason}`);
  }
  console.log('');

  if (DRY_RUN) {
    console.log('  [dry-run] No DB changes, no email sent.');
    return;
  }

  // Auto-exclude in DB
  if (toExclude.length) {
    const ids = toExclude.map(k => k.id);
    await sql`UPDATE keywords SET used = true WHERE id = ANY(${ids})`;
    console.log(`  ✅ Excluded ${ids.length} keywords from pool`);
  }

  // Send notification email
  await sendNotificationEmail(toExclude, toNotify);
}

run().catch(err => {
  console.error('review-suspicious-keywords error:', err.message);
  process.exit(1);
});
