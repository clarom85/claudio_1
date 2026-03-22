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
