/**
 * Email Subscribe API — porta 3001
 * Riceve POST /api/subscribe, salva su Neon, risponde JSON
 * nginx proxy: location /api/subscribe → http://localhost:3001
 */
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { sql } from '@content-network/db';
import { processSubmission } from '@content-network/parentcare';
import { labelFor } from '@content-network/parentcare/quiz-config';

const app = express();
const PORT = process.env.EMAIL_API_PORT || 3001;

app.set('trust proxy', true); // capture real IP behind nginx
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '32kb' }));

// ── Assicura tabelle ────────────────────────────────────────────
async function ensureTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS email_subscribers (
      id SERIAL PRIMARY KEY,
      email TEXT NOT NULL,
      site TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(email, site)
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS article_feedback (
      id SERIAL PRIMARY KEY,
      slug TEXT NOT NULL,
      site TEXT NOT NULL,
      vote TEXT NOT NULL CHECK (vote IN ('yes','no')),
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
}

// ── POST /api/subscribe ─────────────────────────────────────────
app.post('/api/subscribe', async (req, res) => {
  const { email, site } = req.body || {};

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ ok: false, error: 'Invalid email' });
  }

  try {
    await sql`
      INSERT INTO email_subscribers (email, site)
      VALUES (${email.toLowerCase().trim()}, ${site || 'unknown'})
      ON CONFLICT (email, site) DO NOTHING
    `;
    console.log(`📧 Subscribed: ${email} from ${site || 'unknown'}`);
    res.json({ ok: true });
  } catch (err) {
    console.error('Subscribe error:', err.message);
    res.status(500).json({ ok: false, error: 'Server error' });
  }
});

// ── POST /api/feedback ──────────────────────────────────────────
app.post('/api/feedback', async (req, res) => {
  const { slug, vote, site } = req.body || {};
  if (!slug || !['yes', 'no'].includes(vote)) {
    return res.status(400).json({ ok: false, error: 'Invalid payload' });
  }
  try {
    await sql`
      INSERT INTO article_feedback (slug, site, vote)
      VALUES (${slug}, ${site || 'unknown'}, ${vote})
    `;
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false });
  }
});

// ── POST /api/parentcare/submit ────────────────────────────────
app.post('/api/parentcare/submit', async (req, res) => {
  try {
    const ip = req.ip || req.headers['x-forwarded-for'] || req.connection?.remoteAddress || null;
    const userAgent = req.headers['user-agent'] || '';
    const refererUrl = req.headers['referer'] || req.headers['referrer'] || '';

    const result = await processSubmission({
      payload: req.body || {},
      ip,
      userAgent,
      refererUrl,
    });

    if (!result.ok) {
      return res.status(result.status || 400).json({ ok: false, error: result.error });
    }
    // Always return generic success to user (don't reveal DNC/dup status)
    res.json({ ok: true });
  } catch (err) {
    console.error('[parentcare submit] error:', err.message, err.stack);
    res.status(500).json({ ok: false, error: 'Server error' });
  }
});

// ── ADMIN: /admin/parentcare ──────────────────────────────────
function requireAdminToken(req, res) {
  const token = process.env.PARENTCARE_ADMIN_TOKEN || '';
  if (!token) {
    res.status(500).send('PARENTCARE_ADMIN_TOKEN not set');
    return false;
  }
  if (req.query.token !== token) {
    res.status(403).send('403 Forbidden');
    return false;
  }
  return true;
}

function adminEsc(s = '') {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

app.get('/admin/parentcare', async (req, res) => {
  if (!requireAdminToken(req, res)) return;
  try {
    const tier = req.query.tier || '';
    const status = req.query.status || '';
    const limit = Math.min(parseInt(req.query.limit) || 200, 500);

    const leads = await sql`
      SELECT l.id, l.ts, l.tier, l.score, l.status, l.zip, l.state,
             l.name, l.phone, l.email,
             l.who_needs_care, l.main_concern, l.location_now, l.level_help,
             l.urgency, l.payment, l.utm_source,
             (SELECT json_agg(json_build_object(
                 'buyer_id', r.buyer_id,
                 'buyer_name', b.name,
                 'response', r.buyer_response,
                 'price', r.price_paid,
                 'routed_at', r.routed_at
               ) ORDER BY r.routed_at)
              FROM parentcare_routing r
              LEFT JOIN parentcare_buyers b ON b.id = r.buyer_id
              WHERE r.lead_id = l.id) AS routings
      FROM parentcare_leads l
      WHERE (${tier}::text = '' OR l.tier = ${tier})
        AND (${status}::text = '' OR l.status = ${status})
      ORDER BY l.ts DESC
      LIMIT ${limit}
    `;

    const stats = await sql`
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE status='routed')::int AS routed,
        COUNT(*) FILTER (WHERE tier='high')::int AS high,
        COUNT(*) FILTER (WHERE tier='medium')::int AS med,
        COUNT(*) FILTER (WHERE tier='low')::int AS low,
        COUNT(*) FILTER (WHERE status='dnc')::int AS dnc,
        COUNT(*) FILTER (WHERE ts > NOW() - INTERVAL '7 days')::int AS last7d,
        COUNT(*) FILTER (WHERE ts > NOW() - INTERVAL '24 hours')::int AS last24h
      FROM parentcare_leads
    `;
    const s = stats[0];

    const buyers = await sql`
      SELECT id, name, category, state, metro, pilot, pilot_leads_remaining,
             active, price_per_lead,
             (SELECT COUNT(*)::int FROM parentcare_routing r WHERE r.buyer_id = b.id) AS leads_received
      FROM parentcare_buyers b
      ORDER BY active DESC, name
    `;

    const tierColor = (t) => t==='high' ? '#5a7a5a' : t==='medium' ? '#c4622d' : '#888';
    const fmtPhone = (p) => {
      const d = String(p||'').replace(/\D/g,'');
      if (d.length === 10) return `(${d.slice(0,3)}) ${d.slice(3,6)}-${d.slice(6)}`;
      return p || '—';
    };

    const leadRows = leads.map(l => {
      const concernArr = (l.main_concern || '').split(',').filter(Boolean);
      const routingsHtml = (l.routings || []).map(r => {
        const respCol = r.response==='accepted' ? '#5a7a5a' : r.response==='rejected' ? '#a8521f' : '#888';
        return `<div style="font-size:11px;color:#555;margin-bottom:2px"><strong>${adminEsc(r.buyer_name||'?')}</strong> · <span style="color:${respCol}">${adminEsc(r.response||'pending')}</span>${r.price ? ' · $' + Number(r.price).toFixed(0) : ''}</div>`;
      }).join('') || '<span style="color:#bbb;font-size:11px">—</span>';

      return `<tr>
        <td style="font-size:11px;color:#888;white-space:nowrap">${new Date(l.ts).toLocaleString('en-US',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})}</td>
        <td><span style="display:inline-block;padding:2px 8px;border-radius:10px;font-size:11px;font-weight:700;color:#fff;background:${tierColor(l.tier)}">${(l.tier||'').toUpperCase()}</span> <span style="font-size:11px;color:#888">${l.score}</span></td>
        <td><strong>${adminEsc(l.name||'')}</strong><br><span style="font-size:11px;color:#888">caring for ${labelFor('who_needs_care', l.who_needs_care)}</span></td>
        <td><a href="tel:${l.phone}" style="color:#c4622d;font-weight:600;text-decoration:none">${fmtPhone(l.phone)}</a>${l.email ? '<br><span style="font-size:11px;color:#888">'+adminEsc(l.email)+'</span>':''}</td>
        <td style="font-weight:700">${adminEsc(l.zip||'—')}<br><span style="font-size:11px;color:#888">${adminEsc(l.state||'')}</span></td>
        <td style="font-size:12px">${labelFor('urgency', l.urgency)}<br><span style="color:#888">${labelFor('level_help', l.level_help)}</span></td>
        <td style="font-size:11px">${labelFor('location_now', l.location_now)}<br>${concernArr.map(c => labelFor('main_concern', c)).join(', ')}</td>
        <td style="font-size:11px">${labelFor('payment', l.payment)}</td>
        <td>${routingsHtml}</td>
        <td><span style="display:inline-block;padding:1px 7px;border-radius:8px;font-size:10px;font-weight:700;background:#f0e8de;color:#7a6a5a;text-transform:uppercase">${adminEsc(l.status)}</span></td>
        <td style="font-size:11px;text-align:center"><a href="?token=${adminEsc(req.query.token)}&action=feedback&id=${l.id}" style="color:#c4622d;text-decoration:none;font-size:11px">edit</a></td>
      </tr>`;
    }).join('');

    const buyerRows = buyers.map(b => `
      <tr>
        <td><strong>${adminEsc(b.name)}</strong><br><span style="font-size:11px;color:#888">${b.category} · ${b.metro||b.state||''}</span></td>
        <td style="text-align:center">${b.active ? '<span style="color:#5a7a5a;font-weight:700">●</span>' : '<span style="color:#aaa">○</span>'}</td>
        <td style="text-align:center">${b.pilot ? `<span style="color:#c4622d">${b.pilot_leads_remaining}/5 free</span>` : '$' + Number(b.price_per_lead).toFixed(0)}</td>
        <td style="text-align:center">${b.leads_received}</td>
      </tr>
    `).join('');

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>ParentCare — Admin</title>
<style>
  body{font-family:system-ui,-apple-system,sans-serif;background:#faf6f1;color:#3d2b1f;margin:0;padding:20px}
  h1{font-size:22px;margin:0 0 4px;font-family:'Cormorant Garamond',Georgia,serif;font-weight:500}
  .sub{color:#7a6a5a;font-size:12px;margin-bottom:24px}
  .stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(110px,1fr));gap:12px;margin-bottom:24px}
  .stat{background:#fff;padding:14px 18px;border-radius:8px;border:1px solid #e6dccf}
  .stat-num{font-family:'Cormorant Garamond',Georgia,serif;font-size:28px;font-weight:600;color:#c4622d}
  .stat-lbl{font-size:11px;letter-spacing:1px;text-transform:uppercase;color:#7a6a5a}
  .filters{margin-bottom:16px}
  .filters a{display:inline-block;padding:5px 12px;background:#fff;border:1px solid #e6dccf;border-radius:14px;font-size:12px;text-decoration:none;color:#3d2b1f;margin-right:6px}
  .filters a.is-active{background:#c4622d;color:#fff;border-color:#c4622d}
  table{width:100%;border-collapse:collapse;background:#fff;border-radius:8px;overflow:hidden;border:1px solid #e6dccf;font-size:13px;margin-bottom:32px}
  th{background:#3d2b1f;color:#fff;padding:8px 10px;text-align:left;font-size:11px;letter-spacing:.5px;text-transform:uppercase;font-weight:600}
  td{padding:10px;border-bottom:1px solid #f0e8de;vertical-align:top}
  tr:last-child td{border-bottom:none}
  tr:hover td{background:#faf6f1}
  h2{font-family:'Cormorant Garamond',Georgia,serif;font-weight:500;font-size:22px;margin:24px 0 12px}
  .empty{text-align:center;padding:40px;color:#7a6a5a;background:#fff;border-radius:8px;border:1px dashed #e6dccf}
</style></head><body>
<h1>ParentCare Finder — Admin</h1>
<div class="sub">${new Date().toLocaleString('en-US',{timeZone:'America/New_York',dateStyle:'medium',timeStyle:'short'})} EST</div>

<div class="stats">
  <div class="stat"><div class="stat-num">${s.total}</div><div class="stat-lbl">All leads</div></div>
  <div class="stat"><div class="stat-num">${s.last24h}</div><div class="stat-lbl">Last 24h</div></div>
  <div class="stat"><div class="stat-num">${s.last7d}</div><div class="stat-lbl">Last 7 days</div></div>
  <div class="stat"><div class="stat-num">${s.high}</div><div class="stat-lbl">High tier</div></div>
  <div class="stat"><div class="stat-num">${s.med}</div><div class="stat-lbl">Medium tier</div></div>
  <div class="stat"><div class="stat-num">${s.low}</div><div class="stat-lbl">Low tier</div></div>
  <div class="stat"><div class="stat-num">${s.routed}</div><div class="stat-lbl">Routed</div></div>
  <div class="stat"><div class="stat-num">${s.dnc}</div><div class="stat-lbl">DNC blocked</div></div>
</div>

<div class="filters">
  <strong style="font-size:11px;letter-spacing:1px;text-transform:uppercase;color:#7a6a5a;margin-right:8px">Tier:</strong>
  <a href="?token=${adminEsc(req.query.token)}" class="${!tier?'is-active':''}">All</a>
  <a href="?token=${adminEsc(req.query.token)}&tier=high" class="${tier==='high'?'is-active':''}">High</a>
  <a href="?token=${adminEsc(req.query.token)}&tier=medium" class="${tier==='medium'?'is-active':''}">Medium</a>
  <a href="?token=${adminEsc(req.query.token)}&tier=low" class="${tier==='low'?'is-active':''}">Low</a>
</div>

<h2>Leads</h2>
${leads.length ? `<table>
  <thead><tr>
    <th>Time</th><th>Tier</th><th>Caller</th><th>Contact</th><th>ZIP</th>
    <th>Need</th><th>Concerns / Location</th><th>Pay</th><th>Routed to</th><th>Status</th><th></th>
  </tr></thead>
  <tbody>${leadRows}</tbody>
</table>` : '<div class="empty">No leads yet. Test the quiz at <a href="/find-care/" style="color:#c4622d">/find-care/</a></div>'}

<h2>Buyers</h2>
${buyers.length ? `<table style="max-width:760px">
  <thead><tr>
    <th>Buyer</th><th style="text-align:center">Active</th><th style="text-align:center">Status</th><th style="text-align:center">Leads received</th>
  </tr></thead>
  <tbody>${buyerRows}</tbody>
</table>` : '<div class="empty">No buyers yet. Add via <code>INSERT INTO parentcare_buyers</code>.</div>'}

<p style="font-size:11px;color:#aaa;margin-top:32px">
  Export CSV: <a href="?token=${adminEsc(req.query.token)}&format=csv" style="color:#c4622d">leads.csv</a> ·
  <a href="?token=${adminEsc(req.query.token)}&format=csv&type=buyers" style="color:#c4622d">buyers.csv</a>
</p>
</body></html>`;
    res.setHeader('Content-Type','text/html');
    res.send(html);
  } catch (err) {
    console.error('[admin parentcare] error:', err);
    res.status(500).send(`<pre>Error: ${err.message}</pre>`);
  }
});

// ── BUYER PORTAL: GET /buyer-portal?token=... ─────────────────
// Mobile-first single-page view of leads routed to a single buyer.
// Token-based auth (no password): the same token is delivered with
// every lead-notification email + welcome onboarding email.
app.get('/buyer-portal', async (req, res) => {
  const token = (req.query.token || '').trim();
  if (!token) return res.status(400).send('Missing token');

  try {
    const buyers = await sql`
      SELECT id, name, contact_name, email, category, metro, state,
             pilot, pilot_leads_remaining, price_per_lead, active
      FROM parentcare_buyers
      WHERE auth_token = ${token}
      LIMIT 1
    `;
    if (!buyers.length) return res.status(403).send('Invalid token');
    const buyer = buyers[0];

    const routings = await sql`
      SELECT r.id AS routing_id, r.routed_at, r.buyer_response, r.price_paid,
             r.response_at, r.notes,
             l.id AS lead_id, l.name, l.phone, l.email, l.zip,
             l.who_needs_care, l.urgency, l.level_help, l.location_now,
             l.payment, l.main_concern, l.tier, l.score
      FROM parentcare_routing r
      JOIN parentcare_leads l ON l.id = r.lead_id
      WHERE r.buyer_id = ${buyer.id}
      ORDER BY r.routed_at DESC
      LIMIT 200
    `;

    const stats = {
      total: routings.length,
      good: routings.filter(r => r.buyer_response === 'accepted').length,
      bad: routings.filter(r => r.buyer_response === 'rejected').length,
      pending: routings.filter(r => !r.buyer_response || r.buyer_response === 'pending').length,
      tour: routings.filter(r => (r.notes || '').toLowerCase().includes('tour')).length,
    };

    const fmtPhone = (p) => {
      const d = String(p || '').replace(/\D/g, '');
      if (d.length === 10) return `(${d.slice(0,3)}) ${d.slice(3,6)}-${d.slice(6)}`;
      return p || '—';
    };
    const fmtDate = (d) => new Date(d).toLocaleDateString('en-US',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'});
    const esc = (s='') => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');

    const rows = routings.map(r => {
      const concerns = (r.main_concern || '').split(',').filter(Boolean).map(c => labelFor('main_concern', c)).join(', ');
      const status = r.buyer_response || 'pending';
      const statusColor = status === 'accepted' ? '#5a7a5a' : status === 'rejected' ? '#a8521f' : '#7a6a5a';
      const isPending = !r.buyer_response || r.buyer_response === 'pending';

      return `<div class="lead-card" data-routing-id="${r.routing_id}">
        <div class="lead-head">
          <div>
            <div class="lead-name">${esc(r.name || '—')} <span class="lead-zip">· ${esc(r.zip || '')}</span></div>
            <div class="lead-meta">${esc(labelFor('who_needs_care', r.who_needs_care))} · ${esc(labelFor('urgency', r.urgency))} · ${esc(labelFor('level_help', r.level_help))}</div>
          </div>
          <div class="lead-tier tier-${esc(r.tier || 'low')}">${esc((r.tier || '').toUpperCase())}</div>
        </div>
        <div class="lead-body">
          <a href="tel:${esc(r.phone || '')}" class="lead-phone">📞 ${esc(fmtPhone(r.phone))}</a>
          ${r.email ? `<a href="mailto:${esc(r.email)}" class="lead-email">✉ ${esc(r.email)}</a>` : ''}
          <div class="lead-note">${esc(labelFor('location_now', r.location_now))} · ${esc(labelFor('payment', r.payment))}${concerns ? ' · ' + concerns : ''}</div>
          <div class="lead-time">Sent ${esc(fmtDate(r.routed_at))}</div>
        </div>
        ${isPending ? `<div class="lead-actions">
          <button class="btn-good"  data-action="accepted">✓ Good lead</button>
          <button class="btn-tour"  data-action="accepted" data-note="tour">📅 Tour booked</button>
          <button class="btn-noans" data-action="no_response">📵 No answer</button>
          <button class="btn-bad"   data-action="rejected">✗ Bad fit</button>
        </div>` : `<div class="lead-status" style="color:${statusColor}">Marked as <strong>${esc(status)}</strong>${r.notes ? ' (' + esc(r.notes) + ')' : ''}${r.response_at ? ' · ' + esc(fmtDate(r.response_at)) : ''}</div>`}
      </div>`;
    }).join('');

    const html = `<!DOCTYPE html><html lang="en"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<title>${esc(buyer.name)} — Lead Portal</title>
<style>
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;background:#faf6f1;color:#3d2b1f;line-height:1.5;padding:0 0 60px}
  .topbar{background:#3d2b1f;color:rgba(255,255,255,.92);padding:18px 20px}
  .topbar h1{font-size:18px;font-weight:600;margin-bottom:2px}
  .topbar .sub{font-size:12px;color:rgba(255,255,255,.65)}
  .stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(110px,1fr));gap:10px;padding:16px 18px;background:#fff;border-bottom:1px solid #e6dccf;position:sticky;top:0;z-index:10}
  .stat{text-align:center}
  .stat-num{font-size:24px;font-weight:700;color:#c4622d;line-height:1}
  .stat-lbl{font-size:11px;color:#7a6a5a;letter-spacing:.5px;text-transform:uppercase;margin-top:4px}
  .lead-card{background:#fff;border:1px solid #e6dccf;border-radius:10px;padding:16px;margin:12px 18px;box-shadow:0 1px 3px rgba(0,0,0,.04)}
  .lead-head{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:10px}
  .lead-name{font-size:16px;font-weight:700}
  .lead-zip{font-size:13px;color:#7a6a5a;font-weight:400}
  .lead-meta{font-size:12.5px;color:#7a6a5a;margin-top:2px}
  .lead-tier{display:inline-block;padding:3px 10px;border-radius:12px;font-size:11px;font-weight:700;color:#fff;background:#888;flex-shrink:0;letter-spacing:.5px}
  .lead-tier.tier-high{background:#5a7a5a}
  .lead-tier.tier-medium{background:#c4622d}
  .lead-tier.tier-low{background:#888}
  .lead-body{padding-top:8px;border-top:1px solid #f0e8de}
  .lead-phone,.lead-email{display:inline-block;margin-right:14px;margin-top:6px;color:#c4622d;font-weight:600;text-decoration:none;font-size:14px}
  .lead-note{font-size:13px;color:#3d2b1f;margin-top:8px}
  .lead-time{font-size:11px;color:#aaa;margin-top:8px}
  .lead-actions{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:14px;padding-top:14px;border-top:1px solid #f0e8de}
  .lead-actions button{padding:11px 8px;font-size:13px;font-weight:700;border:none;border-radius:8px;cursor:pointer;color:#fff;letter-spacing:.2px;transition:opacity .15s,transform .15s}
  .lead-actions button:active{transform:scale(.97)}
  .lead-actions button:disabled{opacity:.5;cursor:not-allowed}
  .btn-good{background:#5a7a5a}
  .btn-tour{background:#456845}
  .btn-noans{background:#888}
  .btn-bad{background:#a8521f}
  .lead-status{margin-top:12px;padding-top:12px;border-top:1px solid #f0e8de;font-size:13px;font-weight:600}
  .empty{text-align:center;padding:60px 20px;color:#7a6a5a;font-size:14px}
  @media(max-width:480px){
    .lead-card{margin:10px 12px;padding:14px}
    .lead-actions{grid-template-columns:1fr 1fr}
    .stats{padding:12px 14px;gap:8px}
    .stat-num{font-size:20px}
  }
</style></head><body>
<header class="topbar">
  <h1>${esc(buyer.name)}</h1>
  <div class="sub">${esc(buyer.metro || buyer.state || '')} · ${esc(buyer.category)}${buyer.pilot ? ' · ' + buyer.pilot_leads_remaining + ' free pilot leads remaining' : ' · $' + Number(buyer.price_per_lead).toFixed(0) + '/lead'}</div>
</header>
<section class="stats">
  <div class="stat"><div class="stat-num">${stats.total}</div><div class="stat-lbl">Total</div></div>
  <div class="stat"><div class="stat-num" style="color:#5a7a5a">${stats.good}</div><div class="stat-lbl">Good</div></div>
  <div class="stat"><div class="stat-num" style="color:#456845">${stats.tour}</div><div class="stat-lbl">Tours</div></div>
  <div class="stat"><div class="stat-num" style="color:#7a6a5a">${stats.pending}</div><div class="stat-lbl">Pending</div></div>
  <div class="stat"><div class="stat-num" style="color:#a8521f">${stats.bad}</div><div class="stat-lbl">Bad</div></div>
</section>
${routings.length ? rows : '<div class="empty">No leads yet. We will email you the moment a qualified family inquiry comes in for your area.</div>'}
<script>
(function(){
  var TOKEN = ${JSON.stringify(token)};
  document.addEventListener('click', async function(e){
    var btn = e.target.closest('.lead-actions button');
    if (!btn) return;
    var card = btn.closest('.lead-card');
    var routingId = card.dataset.routingId;
    var action = btn.dataset.action;
    var note = btn.dataset.note || '';
    var allBtns = card.querySelectorAll('.lead-actions button');
    allBtns.forEach(function(b){b.disabled = true});
    btn.innerHTML = 'Saving…';
    try {
      var resp = await fetch('/api/parentcare/buyer-feedback', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ token: TOKEN, routing_id: parseInt(routingId), response: action, notes: note })
      });
      var data = await resp.json();
      if (!data.ok) throw new Error(data.error || 'fail');
      // Replace actions with status row
      var statusText = action === 'accepted' && note === 'tour' ? 'Tour booked' :
                       action === 'accepted' ? 'Good lead' :
                       action === 'rejected' ? 'Bad fit' : 'No answer';
      var statusColor = action === 'accepted' ? '#5a7a5a' : action === 'rejected' ? '#a8521f' : '#888';
      var actionsEl = card.querySelector('.lead-actions');
      var newDiv = document.createElement('div');
      newDiv.className = 'lead-status';
      newDiv.style.color = statusColor;
      newDiv.innerHTML = 'Marked as <strong>' + statusText + '</strong> · just now';
      actionsEl.parentNode.replaceChild(newDiv, actionsEl);
    } catch(err){
      btn.innerHTML = '⚠ Try again';
      allBtns.forEach(function(b){b.disabled = false});
      console.error(err);
    }
  });
})();
</script>
</body></html>`;

    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Robots-Tag', 'noindex,nofollow');
    res.send(html);
  } catch (err) {
    console.error('[buyer-portal] error:', err.message);
    res.status(500).send('Server error');
  }
});

// ── BUYER PORTAL: POST /api/parentcare/buyer-feedback ──────────
app.post('/api/parentcare/buyer-feedback', async (req, res) => {
  const { token, routing_id, response, notes } = req.body || {};
  if (!token || !routing_id || !['accepted','rejected','no_response'].includes(response)) {
    return res.status(400).json({ ok: false, error: 'invalid' });
  }
  try {
    // Verify token belongs to buyer that owns this routing
    const r = await sql`
      SELECT r.id FROM parentcare_routing r
      JOIN parentcare_buyers b ON b.id = r.buyer_id
      WHERE r.id = ${routing_id} AND b.auth_token = ${String(token).trim()}
      LIMIT 1
    `;
    if (!r.length) return res.status(403).json({ ok: false, error: 'forbidden' });

    await sql`
      UPDATE parentcare_routing
      SET buyer_response = ${response},
          notes = COALESCE(NULLIF(${notes || ''}, ''), notes),
          response_at = NOW()
      WHERE id = ${routing_id}
    `;
    res.json({ ok: true });
  } catch (err) {
    console.error('[buyer-feedback] error:', err.message);
    res.status(500).json({ ok: false, error: 'server' });
  }
});

// ── ADMIN: feedback toggle (mark routing accepted/rejected) ───
app.post('/admin/parentcare/feedback', async (req, res) => {
  if (!requireAdminToken(req, res)) return;
  const { routing_id, response, price, notes } = req.body || {};
  if (!routing_id || !['accepted','rejected','no_response'].includes(response)) {
    return res.status(400).json({ ok: false, error: 'invalid' });
  }
  try {
    await sql`
      UPDATE parentcare_routing
      SET buyer_response = ${response},
          price_paid = ${price || null},
          notes = ${notes || ''},
          response_at = NOW()
      WHERE id = ${routing_id}
    `;
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ── GET /status — minimal ops dashboard ────────────────────────
app.get('/status', async (req, res) => {
  const TOKEN = process.env.STATUS_TOKEN;
  if (TOKEN && req.query.token !== TOKEN) {
    return res.status(403).send('403 Forbidden');
  }

  try {
    const now = new Date();
    const since7d  = new Date(now - 7  * 86400e3).toISOString();
    const since30d = new Date(now - 30 * 86400e3).toISOString();
    const todayStart = new Date(now); todayStart.setUTCHours(0,0,0,0);

    const [sites, kwPool, recent7d, recent30d, queueToday, cost7d, linkStats, nextUp] = await Promise.all([
      sql`
        SELECT s.id, s.domain, s.template, n.slug AS niche_slug, n.name AS niche_name,
               COUNT(a.id) FILTER (WHERE a.status='published') AS published,
               MAX(a.published_at) AS last_published
        FROM sites s
        JOIN niches n ON n.id = s.niche_id
        LEFT JOIN articles a ON a.site_id = s.id
        WHERE s.status != 'inactive'
        GROUP BY s.id, n.slug, n.name
        ORDER BY s.id
      `,
      sql`
        SELECT n.slug, n.name, COUNT(*) AS unused
        FROM keywords k JOIN niches n ON n.id = k.niche_id
        WHERE k.used = FALSE
        GROUP BY n.slug, n.name
        ORDER BY n.slug
      `,
      sql`
        SELECT site_id, COUNT(*) AS cnt
        FROM articles
        WHERE status='published' AND published_at >= ${since7d}
        GROUP BY site_id
      `,
      sql`
        SELECT site_id, COUNT(*) AS cnt
        FROM articles
        WHERE status='published' AND published_at >= ${since30d}
        GROUP BY site_id
      `,
      sql`
        SELECT pq.site_id, COUNT(*) AS cnt
        FROM publish_queue pq
        WHERE pq.status IN ('pending','scheduled')
          AND pq.scheduled_for >= ${todayStart.toISOString()}
        GROUP BY pq.site_id
      `,
      sql`
        SELECT site_id,
               SUM(tokens_in)  AS tin,
               SUM(tokens_out) AS tout,
               SUM(CASE WHEN model_used LIKE '%sonnet%' THEN 1 ELSE 0 END) AS sonnet_cnt,
               COUNT(*) AS articles
        FROM articles
        WHERE published_at >= ${since7d} AND tokens_in > 0
        GROUP BY site_id
      `,
      sql`
        SELECT site_id,
               COUNT(*) FILTER (WHERE status='published') AS total,
               COUNT(*) FILTER (WHERE status='published'
                 AND content ~ 'href="/[a-z]') AS linked
        FROM articles
        GROUP BY site_id
      `,
      sql`
        SELECT site_id, keyword, scheduled_for
        FROM (
          SELECT pq.site_id, k.keyword, pq.scheduled_for,
                 ROW_NUMBER() OVER (PARTITION BY pq.site_id ORDER BY pq.scheduled_for) AS rn
          FROM publish_queue pq
          JOIN articles a ON pq.article_id = a.id
          JOIN keywords k ON a.keyword_id = k.id
          WHERE pq.status IN ('pending','scheduled')
            AND pq.scheduled_for >= NOW()
        ) t
        WHERE rn <= 3
        ORDER BY site_id, scheduled_for
      `,
    ]);

    const map7d     = Object.fromEntries(recent7d.map(r  => [r.site_id, parseInt(r.cnt)]));
    const map30d    = Object.fromEntries(recent30d.map(r => [r.site_id, parseInt(r.cnt)]));
    const mapQ      = Object.fromEntries(queueToday.map(r => [r.site_id, parseInt(r.cnt)]));
    const mapCost   = Object.fromEntries(cost7d.map(r => [r.site_id, r]));
    const kwMap     = Object.fromEntries(kwPool.map(r => [r.slug, parseInt(r.unused)]));
    const mapLinks  = Object.fromEntries(linkStats.map(r => [r.site_id, r]));
    // nextUp grouped by site_id
    const mapNextUp = {};
    for (const r of nextUp) {
      if (!mapNextUp[r.site_id]) mapNextUp[r.site_id] = [];
      mapNextUp[r.site_id].push(r);
    }

    // Model rates (USD per 1M tokens)
    const RATES = { sonnet: { in: 3.00, out: 15.00 }, haiku: { in: 0.80, out: 4.00 } };
    function cost(tin, tout, sonnetCnt, total) {
      const sonnetFrac = total > 0 ? sonnetCnt / total : 0;
      const haikuFrac  = 1 - sonnetFrac;
      const rIn  = sonnetFrac * RATES.sonnet.in  + haikuFrac * RATES.haiku.in;
      const rOut = sonnetFrac * RATES.sonnet.out + haikuFrac * RATES.haiku.out;
      return (parseInt(tin) / 1e6) * rIn + (parseInt(tout) / 1e6) * rOut;
    }

    const dateStr = now.toLocaleString('en-US', { timeZone: 'America/New_York', dateStyle: 'medium', timeStyle: 'short' });

    const siteRows = sites.map(s => {
      const pub   = parseInt(s.published) || 0;
      const d7    = map7d[s.id]  || 0;
      const d30   = map30d[s.id] || 0;
      const queue = mapQ[s.id]   || 0;
      const kw    = kwMap[s.niche_slug] || 0;
      const kwDays = d7 > 0 ? Math.round(kw / (d7 / 7)) : '∞';
      const c     = mapCost[s.id];
      const costWeek = c ? cost(c.tin, c.tout, c.sonnet_cnt, c.articles) : 0;
      const lastPub = s.last_published
        ? new Date(s.last_published).toLocaleString('en-US', { timeZone: 'America/New_York', month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' })
        : '—';

      // Link health
      const ls = mapLinks[s.id];
      const linkPct = ls && parseInt(ls.total) > 0
        ? Math.round(parseInt(ls.linked) / parseInt(ls.total) * 100)
        : null;
      const linkColor = linkPct === null ? '#aaa' : linkPct >= 80 ? '#27ae60' : linkPct >= 50 ? '#e67e22' : '#e74c3c';
      const linkHtml = linkPct === null ? '—' : `<span style="color:${linkColor};font-weight:700">${linkPct}%</span>`;

      // Next 3 articles
      const upcoming = mapNextUp[s.id] || [];
      const nextHtml = upcoming.length > 0
        ? upcoming.map(r => {
            const t = new Date(r.scheduled_for).toLocaleString('en-US', { timeZone: 'America/New_York', hour:'2-digit', minute:'2-digit' });
            return `<div style="font-size:11px;color:#555;margin-bottom:3px">🕐 ${t} — ${r.keyword}</div>`;
          }).join('')
        : '<span style="color:#aaa;font-size:11px">—</span>';

      return `<tr>
        <td><strong>${s.domain}</strong><br><span style="color:#888;font-size:11px">${s.template} · ${s.niche_name}</span></td>
        <td style="text-align:center">${pub}</td>
        <td style="text-align:center">${d7}</td>
        <td style="text-align:center">${d30}</td>
        <td style="text-align:center">${linkHtml}</td>
        <td style="text-align:center">${queue > 0 ? `<span style="color:#27ae60;font-weight:700">${queue}</span>` : '0'}</td>
        <td>${nextHtml}</td>
        <td style="text-align:center">${kw}<br><span style="color:#888;font-size:11px">~${kwDays}d</span></td>
        <td style="text-align:center">${costWeek > 0 ? '$' + costWeek.toFixed(3) : '—'}</td>
        <td style="font-size:11px;color:#888">${lastPub}</td>
      </tr>`;
    }).join('');

    const totalCost = sites.reduce((sum, s) => {
      const c = mapCost[s.id];
      return sum + (c ? cost(c.tin, c.tout, c.sonnet_cnt, c.articles) : 0);
    }, 0);

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Content Network — Status</title>
<style>
  body{font-family:system-ui,sans-serif;background:#f5f5f5;color:#222;margin:0;padding:20px}
  h1{font-size:18px;margin:0 0 4px}
  .sub{color:#888;font-size:12px;margin-bottom:24px}
  table{width:100%;border-collapse:collapse;background:#fff;border-radius:6px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.08)}
  th{background:#2c3e50;color:#fff;padding:8px 12px;font-size:12px;text-align:left;font-weight:600}
  td{padding:9px 12px;border-bottom:1px solid #f0f0f0;vertical-align:top;font-size:13px}
  tr:last-child td{border-bottom:none}
  tr:hover td{background:#fafafa}
  .badge{display:inline-block;padding:2px 8px;border-radius:10px;font-size:11px;font-weight:700}
  .footer{color:#aaa;font-size:11px;margin-top:16px}
</style></head><body>
<h1>📊 Content Network — Status</h1>
<div class="sub">${dateStr} EST &nbsp;·&nbsp; API cost 7d: <strong>$${totalCost.toFixed(4)}</strong></div>
<table>
  <thead><tr>
    <th>Site</th><th>Published</th><th>7d</th><th>30d</th>
    <th>Links %</th><th>Queue</th><th>Next 3</th><th>KW pool</th><th>Cost/wk</th><th>Last pub</th>
  </tr></thead>
  <tbody>${siteRows}</tbody>
</table>
<div class="footer">Refresh manually · KW pool = unused keywords · ~Xd = days remaining at current rate</div>
</body></html>`;

    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } catch (err) {
    res.status(500).send(`<pre>Error: ${err.message}</pre>`);
  }
});

// ── Health check ────────────────────────────────────────────────
app.get('/health', (_, res) => res.json({ ok: true, service: 'email-api' }));

// ── Start ───────────────────────────────────────────────────────
ensureTable()
  .then(() => {
    app.listen(PORT, '127.0.0.1', () => {
      console.log(`✅ Email API listening on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('Failed to start email API:', err);
    process.exit(1);
  });
