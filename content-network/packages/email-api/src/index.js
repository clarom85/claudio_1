/**
 * Email Subscribe API — porta 3001
 * Riceve POST /api/subscribe, salva su Neon, risponde JSON
 * nginx proxy: location /api/subscribe → http://localhost:3001
 */
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { sql } from '@content-network/db';

const app = express();
const PORT = process.env.EMAIL_API_PORT || 3001;

app.use(cors({ origin: '*' }));
app.use(express.json());

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
