/**
 * pipeline-preview.js
 *
 * Invia email ogni giorno alle 11:00 UTC con le prossime 20 keyword
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

const TOP_N = 20;

async function run() {
  // Top N keywords per sito, ordinate come le sceglie il content engine
  const rows = await sql`
    WITH ranked AS (
      SELECT
        k.id,
        k.keyword,
        k.search_volume,
        k.cpc,
        k.difficulty,
        k.intent,
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

  // Pool size per site
  const poolCounts = await sql`
    SELECT s.domain, s.id AS site_id, COUNT(*) AS unused_count
    FROM keywords k
    JOIN niches n ON k.niche_id = n.id
    JOIN sites  s ON s.niche_id = n.id AND s.status = 'live'
    WHERE k.used = false
    GROUP BY s.domain, s.id
  `;
  const poolByDomain = {};
  for (const p of poolCounts) poolByDomain[p.domain] = Number(p.unused_count);

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

  const html = buildHtml(bySite, poolByDomain, dateStr);
  const subject = `⏳ Pipeline Preview — prossime keyword in coda (${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})`;

  await sendEmail(subject, html);
  console.log(`[pipeline-preview] Sent — ${rows.length} keywords across ${Object.keys(bySite).length} sites`);
}

function buildHtml(bySite, poolByDomain, dateStr) {
  const siteBlocks = Object.entries(bySite).map(([domain, keywords]) => {
    const poolRemaining = poolByDomain[domain] ?? 0;
    const poolColor = poolRemaining < 200 ? '#e74c3c' : poolRemaining < 500 ? '#e67e22' : '#27ae60';

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
      const diff = k.difficulty > 0
        ? (() => {
            const d = Math.round(k.difficulty);
            const dc = d >= 70 ? '#e74c3c' : d >= 40 ? '#e67e22' : '#27ae60';
            return `<span style="color:${dc};font-weight:600">${d}</span>`;
          })()
        : '<span style="color:#ccc">—</span>';
      const intent = k.intent
        ? `<span style="font-size:10px;background:#f4f4f4;padding:1px 5px;border-radius:3px;color:#666;text-transform:uppercase">${k.intent}</span>`
        : '';

      return `
        <tr style="border-bottom:1px solid #f0f0f0${i === 0 ? ';background:#fffef0' : ''}">
          <td style="padding:6px 8px;font-size:11px;color:#bbb;font-family:monospace;text-align:center">${k.id}</td>
          <td style="padding:6px 8px;font-size:12px;font-weight:${i === 0 ? '600' : '400'}">${k.keyword} ${pillarBadge}</td>
          <td style="padding:6px 8px;font-size:11px;color:#666;text-align:center">${intent}</td>
          <td style="padding:6px 8px;font-size:12px;color:#555;text-align:right">${vol}</td>
          <td style="padding:6px 8px;font-size:12px;color:#27ae60;text-align:right">${cpc}</td>
          <td style="padding:6px 8px;font-size:12px;text-align:right">${diff}</td>
        </tr>`;
    }).join('');

    return `
      <div style="margin-bottom:28px">
        <h3 style="color:#2980b9;font-size:14px;margin:0 0 4px;border-bottom:2px solid #e8f4fd;padding-bottom:6px;display:flex;justify-content:space-between;align-items:baseline">
          <span>🌐 ${domain}</span>
          <span style="font-size:11px;font-weight:400;color:${poolColor}">pool: ${poolRemaining.toLocaleString()} unused</span>
        </h3>
        <table style="width:100%;border-collapse:collapse">
          <thead>
            <tr style="background:#f9f9f9">
              <th style="padding:5px 8px;text-align:center;font-size:10px;color:#999;width:44px">ID</th>
              <th style="padding:5px 8px;text-align:left;font-size:10px;color:#999">KEYWORD</th>
              <th style="padding:5px 8px;text-align:center;font-size:10px;color:#999;width:60px">INTENT</th>
              <th style="padding:5px 8px;text-align:right;font-size:10px;color:#999;width:60px">VOL/MO</th>
              <th style="padding:5px 8px;text-align:right;font-size:10px;color:#999;width:50px">CPC</th>
              <th style="padding:5px 8px;text-align:right;font-size:10px;color:#999;width:40px">DIFF</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
        <p style="font-size:10px;color:#aaa;margin:4px 0 0">
          Riga evidenziata = prossima a essere generata · DIFF: verde &lt;40, arancio 40-69, rosso ≥70
        </p>
      </div>`;
  }).join('');

  return `
<div style="font-family:Arial,sans-serif;max-width:720px;margin:0 auto;padding:20px">
  <h2 style="color:#2c3e50;margin-bottom:4px">⏳ Pipeline Preview</h2>
  <p style="color:#666;font-size:13px;margin-top:0">${dateStr} — prossime ${TOP_N} keyword in coda per sito</p>

  ${siteBlocks}

  <div style="background:#f0f7ff;border-left:3px solid #3498db;padding:10px 14px;border-radius:2px;margin-top:4px">
    <p style="margin:0;font-size:12px;color:#555">
      Se vedi una keyword problematica, rispondi in chat prima che diventi articolo:<br>
      <strong>"Escludi keyword ID: 1234"</strong> → viene rimossa dalla coda immediatamente.<br>
      <strong>"Escludi IDs: 1234, 5678, 9012"</strong> → lista multipla in un messaggio.
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
