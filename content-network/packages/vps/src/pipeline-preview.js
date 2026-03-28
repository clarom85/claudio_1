/**
 * pipeline-preview.js
 *
 * Invia email ogni giorno alle 11:00 UTC con le prossime 10 keyword
 * in coda per ogni sito — esattamente quelle che verranno processate
 * al prossimo run di generazione.
 *
 * Utile per screening preventivo: se vedi una keyword problematica,
 * rispondi in chat prima che diventi articolo.
 *
 * Run manuale: node packages/vps/src/pipeline-preview.js
 * Scheduler:   ogni giorno alle 11:xx UTC
 */
import 'dotenv/config';
import { sql } from '@content-network/db';

const TOP_N = 10;

async function run() {
  // Top N keywords per sito, ordinate come le sceglie il content engine
  const rows = await sql`
    WITH ranked AS (
      SELECT
        k.id,
        k.keyword,
        k.search_volume,
        k.cpc,
        k.is_pillar,
        n.slug   AS niche,
        s.domain AS domain,
        s.id     AS site_id,
        ROW_NUMBER() OVER (
          PARTITION BY s.id
          ORDER BY k.is_pillar DESC, k.search_volume DESC NULLS LAST, k.id ASC
        ) AS rn
      FROM keywords k
      JOIN niches   n ON k.niche_id = n.id
      JOIN sites    s ON s.niche_id = n.id AND s.status = 'live'
      WHERE k.used = false
    )
    SELECT * FROM ranked WHERE rn <= ${TOP_N}
    ORDER BY domain, rn
  `;

  if (rows.length === 0) {
    console.log('[pipeline-preview] No unused keywords found');
    await sendEmail(
      '⏳ Pipeline Preview — pool keyword esaurito',
      buildEmptyHtml()
    );
    return;
  }

  // Group by domain
  const bySite = {};
  for (const r of rows) {
    if (!bySite[r.domain]) bySite[r.domain] = [];
    bySite[r.domain].push(r);
  }

  const dateStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  const html = buildHtml(bySite, dateStr);
  const subject = `⏳ Pipeline Preview — prossime keyword in coda (${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})`;

  await sendEmail(subject, html);
  console.log(`[pipeline-preview] Sent — ${rows.length} keywords across ${Object.keys(bySite).length} sites`);
}

function buildHtml(bySite, dateStr) {
  const siteBlocks = Object.entries(bySite).map(([domain, keywords]) => {
    const totalUnused = '—'; // shown in footer note

    const rows = keywords.map((k, i) => {
      const pillarBadge = k.is_pillar
        ? '<span style="background:#e8f4fd;color:#2980b9;font-size:10px;padding:1px 5px;border-radius:3px;font-weight:600">PILLAR</span>'
        : '';
      const vol = k.search_volume > 0
        ? k.search_volume.toLocaleString()
        : '<span style="color:#ccc">—</span>';
      const cpc = k.cpc > 0
        ? `$${parseFloat(k.cpc).toFixed(2)}`
        : '<span style="color:#ccc">—</span>';

      return `
        <tr style="border-bottom:1px solid #f0f0f0${i === 0 ? ';background:#fffef0' : ''}">
          <td style="padding:7px 10px;font-size:12px;color:#aaa;text-align:center">${i + 1}</td>
          <td style="padding:7px 10px;font-size:13px;font-weight:${i === 0 ? '600' : '400'}">${k.keyword} ${pillarBadge}</td>
          <td style="padding:7px 10px;font-size:12px;color:#666;text-align:right">${vol}</td>
          <td style="padding:7px 10px;font-size:12px;color:#27ae60;text-align:right">${cpc}</td>
        </tr>`;
    }).join('');

    return `
      <div style="margin-bottom:28px">
        <h3 style="color:#2980b9;font-size:14px;margin:0 0 8px;border-bottom:2px solid #e8f4fd;padding-bottom:6px">
          🌐 ${domain}
        </h3>
        <table style="width:100%;border-collapse:collapse">
          <thead>
            <tr style="background:#f9f9f9">
              <th style="padding:6px 10px;text-align:center;font-size:11px;color:#999;width:32px">#</th>
              <th style="padding:6px 10px;text-align:left;font-size:11px;color:#999">KEYWORD</th>
              <th style="padding:6px 10px;text-align:right;font-size:11px;color:#999">VOL/MO</th>
              <th style="padding:6px 10px;text-align:right;font-size:11px;color:#999">CPC</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
        <p style="font-size:11px;color:#aaa;margin:4px 0 0">
          Riga evidenziata = prossima a essere generata
        </p>
      </div>`;
  }).join('');

  return `
<div style="font-family:Arial,sans-serif;max-width:700px;margin:0 auto;padding:20px">
  <h2 style="color:#2c3e50;margin-bottom:4px">⏳ Pipeline Preview</h2>
  <p style="color:#666;font-size:13px;margin-top:0">${dateStr} — prossime ${TOP_N} keyword in coda per sito</p>

  ${siteBlocks}

  <div style="background:#f0f7ff;border-left:3px solid #3498db;padding:10px 14px;border-radius:2px;margin-top:4px">
    <p style="margin:0;font-size:12px;color:#555">
      Se vedi una keyword problematica, rispondi in chat prima che diventi articolo:<br>
      <strong>"Escludi keyword ID: 1234"</strong> → viene rimossa dalla coda immediatamente.
    </p>
  </div>

  <p style="color:#ccc;font-size:11px;margin-top:20px">${new Date().toISOString()} — Content Network</p>
</div>`;
}

function buildEmptyHtml() {
  return `
<div style="font-family:Arial,sans-serif;max-width:700px;margin:0 auto;padding:20px">
  <h2 style="color:#c0392b">⚠️ Pipeline — Pool keyword esaurito</h2>
  <p style="color:#444;font-size:14px">
    Non ci sono keyword disponibili in coda.<br>
    È necessario runnare il keyword engine per rifornire il pool.
  </p>
  <p style="font-size:13px;color:#888">
    Comando: <code>node packages/keyword-engine/src/index.js --niche &lt;slug&gt;</code>
  </p>
  <p style="color:#ccc;font-size:11px;margin-top:20px">${new Date().toISOString()} — Content Network</p>
</div>`;
}

async function sendEmail(subject, html) {
  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  const TO = process.env.ALERT_EMAIL_TO;
  const FROM = process.env.ALERT_EMAIL_FROM || 'onboarding@resend.dev';

  if (!RESEND_API_KEY || !TO) {
    console.log('[pipeline-preview] No email config — skipping');
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
  console.error('pipeline-preview error:', err.message);
  process.exit(1);
});
