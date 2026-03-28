/**
 * review-suspicious-keywords.js
 *
 * Scansiona il pool keyword e invia email di review con le keyword sospette.
 * L'utente risponde in chat con gli ID da escludere.
 *
 * Run manuale: node packages/vps/src/review-suspicious-keywords.js
 * Run dry:     node packages/vps/src/review-suspicious-keywords.js --dry-run
 * Scheduler:   domenica alle 11:xx (dopo GSC cleanup)
 */
import 'dotenv/config';
import { sql } from '@content-network/db';

const DRY_RUN = process.argv.includes('--dry-run');

// ── Pattern sospetti ──────────────────────────────────────────────────────────

const FLAG_RULES = [
  {
    reason: 'Non-US geo: Australia',
    test: kw => /\baustrali(a|an|ans)?\b/i.test(kw),
  },
  {
    reason: 'Non-US geo: Canada',
    test: kw => /\bcanad(a|ian|ians)?\b/i.test(kw),
  },
  {
    reason: 'Non-US geo: Netherlands',
    test: kw => /\bnetherlands\b/i.test(kw),
  },
  {
    reason: 'Non-US geo: UK/British',
    test: kw => /\b(united kingdom|british|england|scotland|wales|ireland)\b/i.test(kw),
  },
  {
    reason: 'Non-US product: conservatory',
    test: kw => /\bconservator(y|ies)\b/i.test(kw),
  },
  {
    reason: 'Non-US currency: pound/sterling',
    test: kw => /\b(pound sterling|gbp|£)\b/i.test(kw),
  },
  {
    reason: 'Non-US healthcare: NHS/BUPA',
    test: kw => /\b(nhs|bupa)\b/i.test(kw),
  },
  {
    reason: 'Off-topic: gaming',
    test: kw => /\b(bloxburg|roblox|minecraft|fortnite|sims)\b/i.test(kw),
  },
  {
    reason: 'Stale year',
    test: kw => {
      const CY = new Date().getFullYear();
      const m = kw.match(/\b(20\d{2})\b/);
      return m && parseInt(m[1]) < CY;
    },
  },
  {
    reason: 'Non-ASCII characters',
    test: kw => /[^\x00-\x7F]/.test(kw),
  },
  {
    reason: 'Too short (<3 words)',
    test: kw => kw.trim().split(/\s+/).length < 3,
  },
];

function flagKeyword(keyword) {
  for (const rule of FLAG_RULES) {
    if (rule.test(keyword)) return rule.reason;
  }
  return null;
}

// ── Email via Resend ──────────────────────────────────────────────────────────

async function sendReviewEmail(flagged) {
  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  const TO = process.env.ALERT_EMAIL_TO;
  const FROM = process.env.ALERT_EMAIL_FROM || 'onboarding@resend.dev';

  if (!RESEND_API_KEY || !TO) {
    console.log('[review] No email config — printing to console only');
    return;
  }

  // Build HTML table
  const rows = flagged.map(k => `
    <tr style="border-bottom:1px solid #eee">
      <td style="padding:6px 10px;font-family:monospace;color:#555">${k.id}</td>
      <td style="padding:6px 10px;font-size:12px;color:#888">${k.site}</td>
      <td style="padding:6px 10px;font-weight:500">${k.keyword}</td>
      <td style="padding:6px 10px;font-size:12px;color:#c0392b">${k.reason}</td>
    </tr>`).join('');

  // Also build CSV content as inline pre block
  const csvLines = ['id,site,keyword,reason', ...flagged.map(k =>
    `${k.id},${k.site},"${k.keyword.replace(/"/g, '""')}","${k.reason}"`
  )];
  const csvText = csvLines.join('\n');

  const html = `
<div style="font-family:Arial,sans-serif;max-width:700px;margin:0 auto;padding:20px">
  <h2 style="color:#2c3e50;margin-bottom:4px">🔍 Keyword Review — ${flagged.length} item${flagged.length !== 1 ? 's' : ''} flagged</h2>
  <p style="color:#666;font-size:13px;margin-top:0">Settimana del ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>

  <p style="color:#444;font-size:14px">Rivedi la lista e rispondi in chat con i keyword ID da escludere definitivamente.<br>
  Se tutto ok, nessuna azione richiesta.</p>

  <table style="width:100%;border-collapse:collapse;font-size:14px;margin:16px 0">
    <thead>
      <tr style="background:#f0f0f0">
        <th style="padding:8px 10px;text-align:left;font-size:12px;color:#666">ID</th>
        <th style="padding:8px 10px;text-align:left;font-size:12px;color:#666">SITO</th>
        <th style="padding:8px 10px;text-align:left;font-size:12px;color:#666">KEYWORD</th>
        <th style="padding:8px 10px;text-align:left;font-size:12px;color:#666">MOTIVO FLAG</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>

  <div style="background:#f8f8f8;border-left:3px solid #3498db;padding:12px 16px;margin-top:16px;border-radius:2px">
    <p style="margin:0;font-size:13px;color:#555"><strong>Come rispondere in chat:</strong><br>
    "Escludi keyword: 12, 114, 223" → vengono marcate used=true e saltate per sempre<br>
    "Ok tutto bene" → nessuna azione, il pool procede normalmente</p>
  </div>

  <details style="margin-top:20px">
    <summary style="cursor:pointer;font-size:12px;color:#888">CSV (copia/incolla)</summary>
    <pre style="font-size:11px;background:#f5f5f5;padding:10px;border-radius:4px;overflow-x:auto">${csvText}</pre>
  </details>

  <p style="color:#bbb;font-size:11px;margin-top:24px">${new Date().toISOString()} — Content Network VPS</p>
</div>`;

  // Build attachment (base64 CSV)
  const csvBase64 = Buffer.from(csvText, 'utf-8').toString('base64');

  const body = {
    from: FROM,
    to: [TO],
    subject: `🔍 Keyword Review — ${flagged.length} item${flagged.length !== 1 ? 's' : ''} da approvare`,
    html,
    attachments: [{
      filename: `suspicious-keywords-${new Date().toISOString().slice(0, 10)}.csv`,
      content: csvBase64,
    }],
  };

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Resend error: ${err}`);
  }

  console.log(`[review] Email sent to ${TO} (${flagged.length} flagged keywords)`);
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function run() {
  console.log('🔍 Suspicious keyword review...');

  // Load all unused keywords with site domain via niche→sites join
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

  const flagged = [];
  for (const row of rows) {
    const reason = flagKeyword(row.keyword);
    if (reason) {
      flagged.push({
        id: row.id,
        site: row.site,
        niche: row.niche,
        keyword: row.keyword,
        reason,
      });
    }
  }

  console.log(`  Found ${flagged.length} suspicious keywords`);

  if (flagged.length === 0) {
    console.log('  ✅ Pool clean — no review needed');
    return;
  }

  // Print to console always
  console.log('\n  ID     | Site                      | Keyword                                          | Reason');
  console.log('  ' + '-'.repeat(110));
  for (const k of flagged) {
    const id = String(k.id).padEnd(6);
    const site = k.site.padEnd(26);
    const kw = k.keyword.padEnd(48);
    console.log(`  ${id} | ${site} | ${kw} | ${k.reason}`);
  }
  console.log('');

  if (DRY_RUN) {
    console.log('  [dry-run] Email not sent.');
    return;
  }

  await sendReviewEmail(flagged);
}

run().catch(err => {
  console.error('review-suspicious-keywords error:', err.message);
  process.exit(1);
});
