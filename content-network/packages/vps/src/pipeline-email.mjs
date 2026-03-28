/**
 * pipeline-email.mjs — Invia email con le prossime 10 keyword per sito.
 * Run: node packages/vps/src/pipeline-email.mjs
 */
import 'dotenv/config';
import { sql } from '@content-network/db';

const GEO = /\b(Alabama|Alaska|Arizona|Arkansas|California|Colorado|Connecticut|Delaware|Florida|Georgia|Hawaii|Idaho|Illinois|Indiana|Iowa|Kansas|Kentucky|Louisiana|Maine|Maryland|Massachusetts|Michigan|Minnesota|Mississippi|Missouri|Montana|Nebraska|Nevada|New Hampshire|New Jersey|New Mexico|New York|North Carolina|North Dakota|Ohio|Oklahoma|Oregon|Pennsylvania|Rhode Island|South Carolina|South Dakota|Tennessee|Texas|Utah|Vermont|Virginia|Washington|West Virginia|Wisconsin|Wyoming)\b/i;
const MAX_PER_CLUSTER = 3;

async function getNext(nicheId, limit = 10) {
  return sql`
    WITH ppc AS (
      SELECT k.cluster_slug, COUNT(*) AS ap
      FROM keywords k JOIN articles a ON a.keyword_id = k.id
      WHERE k.niche_id = ${nicheId} AND k.cluster_slug IS NOT NULL
        AND k.keyword !~* ${GEO.source} AND a.status IN ('published','draft')
      GROUP BY k.cluster_slug
    ),
    ranked AS (
      SELECT k.*, COALESCE(p.ap,0) AS ap,
        ROW_NUMBER() OVER (
          PARTITION BY CASE
            WHEN k.cluster_slug IS NULL THEN k.keyword
            WHEN k.keyword ~* ${GEO.source} THEN k.keyword
            ELSE k.cluster_slug
          END
          ORDER BY k.is_pillar DESC NULLS LAST, k.search_volume DESC NULLS LAST
        ) AS rn
      FROM keywords k LEFT JOIN ppc p ON p.cluster_slug = k.cluster_slug
      WHERE k.niche_id = ${nicheId} AND k.used = FALSE
    )
    SELECT id, keyword, search_volume, cpc::text, is_pillar FROM ranked
    WHERE (rn + ap) <= ${MAX_PER_CLUSTER}
    ORDER BY is_pillar DESC NULLS LAST, search_volume DESC NULLS LAST
    LIMIT ${limit}
  `;
}

async function getPoolStats(nicheId) {
  const [r] = await sql`SELECT COUNT(*) as total FROM keywords WHERE niche_id = ${nicheId} AND used = false`;
  return parseInt(r.total);
}

function buildRows(kws) {
  return kws.map((k, i) => {
    const vol = k.search_volume ? Number(k.search_volume).toLocaleString() : '—';
    const cpc = k.cpc && parseFloat(k.cpc) > 0 ? '$' + parseFloat(k.cpc).toFixed(2) : '—';
    const badge = k.is_pillar
      ? '<span style="background:#8e44ad;color:white;font-size:10px;font-weight:700;padding:2px 6px;border-radius:3px;margin-right:6px">PILLAR</span>'
      : '';
    const rowBg = i % 2 === 0 ? '#ffffff' : '#f9f9f9';
    return `
      <tr style="background:${rowBg}">
        <td style="padding:8px 12px;font-size:12px;color:#bbb;text-align:center;width:30px">${i + 1}</td>
        <td style="padding:8px 12px;font-size:13px;color:#2c3e50">${badge}${k.keyword}</td>
        <td style="padding:8px 12px;font-size:13px;color:#2980b9;text-align:right;font-weight:600;white-space:nowrap">${vol}</td>
        <td style="padding:8px 12px;font-size:13px;color:#27ae60;text-align:right;font-weight:600;white-space:nowrap">${cpc}</td>
        <td style="padding:8px 12px;font-size:11px;color:#ccc;text-align:center;width:50px">${k.id}</td>
      </tr>`;
  }).join('');
}

function buildSiteBlock(domain, kws, poolCount) {
  return `
<div style="margin-bottom:32px;border:1px solid #eee;border-radius:4px;overflow:hidden">
  <div style="background:#1a1a2e;padding:12px 18px;display:flex;justify-content:space-between;align-items:center">
    <h3 style="color:white;margin:0;font-size:14px">🌐 ${domain}</h3>
    <span style="color:#aaa;font-size:12px">${poolCount.toLocaleString()} keyword nel pool</span>
  </div>
  <table style="width:100%;border-collapse:collapse">
    <thead>
      <tr style="background:#f0f0f0">
        <th style="padding:7px 12px;font-size:11px;color:#999;text-align:center">#</th>
        <th style="padding:7px 12px;font-size:11px;color:#999;text-align:left">KEYWORD</th>
        <th style="padding:7px 12px;font-size:11px;color:#999;text-align:right">VOL/MO</th>
        <th style="padding:7px 12px;font-size:11px;color:#999;text-align:right">CPC</th>
        <th style="padding:7px 12px;font-size:11px;color:#999;text-align:center">ID</th>
      </tr>
    </thead>
    <tbody>${buildRows(kws)}</tbody>
  </table>
</div>`;
}

async function sendEmail(subject, html) {
  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  const TO = process.env.ALERT_EMAIL_TO;
  const FROM = process.env.ALERT_EMAIL_FROM || 'onboarding@resend.dev';
  if (!RESEND_API_KEY || !TO) { console.log('[pipeline-email] No email config — skipping'); return; }
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: FROM, to: [TO], subject, html }),
  });
  if (!res.ok) { const e = await res.text(); throw new Error(`Resend: ${e}`); }
}

async function run() {
  const sites = [
    { domain: 'repairrateguide.com',    nicheId: 1  },
    { domain: 'coveragepriceguide.com', nicheId: 12 },
  ];

  const blocks = [];
  for (const s of sites) {
    const [kws, pool] = await Promise.all([getNext(s.nicheId), getPoolStats(s.nicheId)]);
    blocks.push(buildSiteBlock(s.domain, kws, pool));
  }

  const dateStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  const html = `
<div style="font-family:Arial,sans-serif;max-width:760px;margin:0 auto;padding:20px">
  <h2 style="color:#2c3e50;margin-bottom:4px">🔑 Keyword Pipeline — Prossime 10</h2>
  <p style="color:#666;font-size:13px;margin-top:0">${dateStr} — keyword pronte per la prossima generazione, in ordine di priorità (pillar → search volume)</p>

  ${blocks.join('\n')}

  <div style="background:#f0f7ff;border-left:3px solid #3498db;padding:10px 14px;border-radius:2px;margin-top:4px">
    <p style="margin:0;font-size:12px;color:#555">
      <strong>Ordine di generazione:</strong> pillar prima, poi per search volume decrescente.<br>
      Le geo-varianti (stati USA) sono esenti dal limite di 3 articoli per cluster.
    </p>
  </div>

  <p style="color:#ccc;font-size:11px;margin-top:20px">${new Date().toISOString()} — Content Network</p>
</div>`;

  const subject = `🔑 Keyword Pipeline — Prossime 10 per sito (${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})`;
  await sendEmail(subject, html);
  console.log('[pipeline-email] Sent');
  process.exit(0);
}

run().catch(err => { console.error(err); process.exit(1); });
