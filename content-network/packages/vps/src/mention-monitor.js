/**
 * mention-monitor.js — Unlinked Mention Monitor
 *
 * Cerca menzioni dei nostri domini sul web (senza link) e invia
 * outreach email chiedendo di aggiungere il link.
 *
 * Flusso:
 *   1. Google Custom Search API: cerca "dominio.com" -site:dominio.com
 *   2. Fetch della pagina: controlla se contiene href al nostro dominio
 *   3. Se menzione senza link → genera email outreach con Claude
 *   4. Invia via Resend e traccia in DB
 *
 * Env richiesti:
 *   GOOGLE_CSE_API_KEY   — API key GCP (abilita "Custom Search API")
 *   GOOGLE_CSE_ID        — ID del Custom Search Engine (cx)
 *   RESEND_API_KEY, ALERT_EMAIL_FROM
 *
 * Setup CSE:
 *   programmablesearchengine.google.com → New search engine
 *   → "Search the entire web" → copia il cx
 *
 * Uso:
 *   node packages/vps/src/mention-monitor.js [--dry-run] [--site-id <id>]
 *
 * PM2 cron: domenica 10:00 UTC (dopo backup e GSC)
 */

import 'dotenv/config';
import { sql } from '@content-network/db';

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const RESEND_API_KEY    = process.env.RESEND_API_KEY;
const OUTREACH_FROM     = process.env.OUTREACH_EMAIL_FROM || process.env.ALERT_EMAIL_FROM;
const CSE_API_KEY       = process.env.GOOGLE_CSE_API_KEY;
const CSE_ID            = process.env.GOOGLE_CSE_ID;

const args         = process.argv.slice(2);
const dryRun       = args.includes('--dry-run');
const _sidIdx      = args.indexOf('--site-id');
const siteIdFilter = (_sidIdx >= 0 ? parseInt(args[_sidIdx + 1]) : 0) || null;

// ─── DB ───────────────────────────────────────────────────────────────────────

async function ensureTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS mention_outreach (
      id                SERIAL PRIMARY KEY,
      site_id           INTEGER,
      domain            VARCHAR(100) NOT NULL,
      mention_url       TEXT NOT NULL,
      mention_title     TEXT,
      mention_snippet   TEXT,
      our_url           TEXT,
      contact_email     VARCHAR(255),
      outreach_sent     BOOLEAN DEFAULT false,
      outreach_sent_at  TIMESTAMPTZ,
      link_added        BOOLEAN DEFAULT false,
      created_at        TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE (domain, mention_url)
    )
  `;
}

// ─── Google Custom Search ─────────────────────────────────────────────────────

async function searchMentions(domain) {
  if (!CSE_API_KEY || !CSE_ID) return [];

  const results = [];

  // Due query: con e senza www, per massimizzare copertura
  const queries = [
    `"${domain}" -site:${domain}`,
    `"www.${domain}" -site:${domain}`,
  ];

  for (const q of queries) {
    try {
      const url = `https://www.googleapis.com/customsearch/v1?key=${CSE_API_KEY}&cx=${CSE_ID}&q=${encodeURIComponent(q)}&num=10&dateRestrict=m3`;
      const res  = await fetch(url);
      if (!res.ok) {
        const err = await res.text();
        console.warn(`  ⚠️  CSE error for "${q}": ${err.substring(0, 200)}`);
        continue;
      }
      const data = await res.json();
      for (const item of (data.items || [])) {
        results.push({
          url:     item.link,
          title:   item.title,
          snippet: item.snippet,
        });
      }
    } catch (e) {
      console.warn(`  ⚠️  CSE fetch error: ${e.message}`);
    }
    // Rispetta rate limit CSE
    await new Promise(r => setTimeout(r, 500));
  }

  // Dedup per URL
  const seen = new Set();
  return results.filter(r => {
    if (seen.has(r.url)) return false;
    seen.add(r.url);
    return true;
  });
}

// ─── Page fetch & link check ──────────────────────────────────────────────────

async function checkPageForLink(pageUrl, domain) {
  try {
    const controller = new AbortController();
    const timeout    = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(pageUrl, {
      signal:  controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ContentNetworkBot/1.0)' },
    });
    clearTimeout(timeout);

    if (!res.ok) return { hasLink: false, email: null, html: '' };

    const html = await res.text();

    // Cerca href che punta al nostro dominio
    const linkPattern = new RegExp(`href=["'][^"']*${domain.replace('.', '\\.')}[^"']*["']`, 'i');
    const hasLink = linkPattern.test(html);

    // Cerca email di contatto nella pagina
    const emails = html.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || [];
    // Filtra: no noreply, no placeholder, preferisci editorial/contact/info
    const filteredEmails = emails.filter(e => {
      const l = e.toLowerCase();
      return !l.includes('noreply') && !l.includes('example') && !l.includes('placeholder')
        && !l.includes('@sentry') && !l.includes('@w3') && !l.includes('@schema');
    });

    // Priorità: editorial > contact > info > author > altro
    const priority = ['editorial', 'editor', 'contact', 'info', 'hello', 'author', 'press', 'media'];
    let bestEmail = null;
    for (const p of priority) {
      bestEmail = filteredEmails.find(e => e.toLowerCase().includes(p));
      if (bestEmail) break;
    }
    if (!bestEmail && filteredEmails.length) bestEmail = filteredEmails[0];

    return { hasLink, email: bestEmail, html: html.substring(0, 5000) };
  } catch {
    return { hasLink: false, email: null, html: '' };
  }
}

// ─── Find best matching article URL ──────────────────────────────────────────

async function findBestArticleUrl(snippet, siteId, domain) {
  // Cerca articoli del sito che matchano il contesto della menzione
  try {
    const articles = await sql`
      SELECT slug, title FROM articles
      WHERE site_id = ${siteId} AND status = 'published'
      ORDER BY published_at DESC LIMIT 50
    `;

    if (!articles.length) return `https://${domain}/`;

    // Cerca match per parole chiave nello snippet
    const words = snippet.toLowerCase().split(/\W+/).filter(w => w.length > 4);
    let bestSlug = null;
    let bestScore = 0;

    for (const art of articles) {
      const titleWords = art.title.toLowerCase().split(/\W+/);
      const score = words.filter(w => titleWords.includes(w)).length;
      if (score > bestScore) {
        bestScore = score;
        bestSlug  = art.slug;
      }
    }

    return bestSlug ? `https://${domain}/${bestSlug}/` : `https://${domain}/`;
  } catch {
    return `https://${domain}/`;
  }
}

// ─── Claude: genera outreach email ───────────────────────────────────────────

async function generateOutreachEmail(mention, ourUrl, domain) {
  const prompt = `Someone mentioned "${domain}" in their article but didn't add a hyperlink.

Article title: ${mention.title}
Article URL: ${mention.url}
Context snippet: ${mention.snippet}
Our relevant URL: ${ourUrl}

Write a short, friendly outreach email (60-90 words) asking them to add the link.

Requirements:
- No subject line — body only
- Open with a genuine compliment about their article (specific, not generic)
- Mention we noticed they referenced ${domain}
- Politely ask if they'd consider adding the link: ${ourUrl}
- End with name: Roman, Vireon Media
- Tone: collegial, not salesy. One professional to another.
- Do NOT start with "I hope this email finds you well" or similar filler.`;

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key':         ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type':      'application/json',
      },
      body: JSON.stringify({
        model:      'claude-haiku-4-5-20251001',
        max_tokens: 250,
        messages:   [{ role: 'user', content: prompt }],
      }),
    });
    const data = await res.json();
    return data.content?.[0]?.text || null;
  } catch {
    return null;
  }
}

// ─── Email send ───────────────────────────────────────────────────────────────

async function sendEmail(to, subject, body) {
  if (!RESEND_API_KEY || !OUTREACH_FROM) return false;
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method:  'POST',
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body:    JSON.stringify({ from: `Roman Vireon <${OUTREACH_FROM}>`, to, subject, text: body }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function run() {
  console.log(`\n🔍 Mention Monitor${dryRun ? ' [DRY RUN]' : ''}\n`);

  if (!CSE_API_KEY || !CSE_ID) {
    console.error('GOOGLE_CSE_API_KEY e GOOGLE_CSE_ID non configurati.');
    console.error('Setup: programmablesearchengine.google.com → New → Search the entire web → copia cx');
    console.error('Abilita "Custom Search API" nel tuo progetto GCP e crea una API key.');
    process.exit(1);
  }

  await ensureTable();

  const sites = siteIdFilter
    ? await sql`SELECT s.id, s.domain, n.slug as niche_slug FROM sites s JOIN niches n ON s.niche_id = n.id WHERE s.status = 'live' AND s.id = ${siteIdFilter}`
    : await sql`SELECT s.id, s.domain, n.slug as niche_slug FROM sites s JOIN niches n ON s.niche_id = n.id WHERE s.status = 'live'`;

  if (!sites.length) { console.log('No live sites.'); process.exit(0); }

  let totalMentions = 0, unlinked = 0, sent = 0;

  for (const site of sites) {
    console.log(`\n🌐 ${site.domain}`);

    const mentions = await searchMentions(site.domain);
    console.log(`  Found ${mentions.length} mentions in search results`);

    for (const mention of mentions) {
      // Skip se già processato
      const exists = await sql`
        SELECT id FROM mention_outreach WHERE domain = ${site.domain} AND mention_url = ${mention.url}
      `;
      if (exists.length) continue;

      totalMentions++;

      // Controlla se la pagina ha già un link al nostro sito
      const { hasLink, email } = await checkPageForLink(mention.url, site.domain);

      if (hasLink) {
        console.log(`  ✅ Already linked: ${mention.url.substring(0, 70)}`);
        // Salva come già linkato
        await sql`
          INSERT INTO mention_outreach (site_id, domain, mention_url, mention_title, mention_snippet, outreach_sent)
          VALUES (${site.id}, ${site.domain}, ${mention.url}, ${mention.title}, ${mention.snippet}, true)
          ON CONFLICT (domain, mention_url) DO NOTHING
        `;
        continue;
      }

      unlinked++;
      console.log(`  🔗 Unlinked mention: ${mention.url.substring(0, 70)}`);
      console.log(`     Email: ${email || 'not found'}`);

      // Trova articolo più rilevante da linkare
      const ourUrl = await findBestArticleUrl(mention.snippet || '', site.id, site.domain);

      // Inserisci nel DB
      await sql`
        INSERT INTO mention_outreach (site_id, domain, mention_url, mention_title, mention_snippet, our_url, contact_email)
        VALUES (${site.id}, ${site.domain}, ${mention.url}, ${mention.title}, ${mention.snippet}, ${ourUrl}, ${email})
        ON CONFLICT (domain, mention_url) DO NOTHING
      `;

      if (!email) {
        console.log(`     ⚠️  No contact email found — saved to DB for manual review`);
        continue;
      }

      // Genera outreach email
      const emailBody = await generateOutreachEmail(mention, ourUrl, site.domain);
      if (!emailBody) { console.log(`     ⚠️  Response generation failed`); continue; }

      if (dryRun) {
        console.log(`\n${'─'.repeat(60)}\nTO: ${email}\nSUBJECT: Quick note about your article\n\n${emailBody}\n${'─'.repeat(60)}\n`);
      } else {
        const ok = await sendEmail(email, `Quick note about your article`, emailBody);
        if (ok) sent++;
        console.log(`     📧 ${ok ? `Sent to ${email}` : 'Send failed'}`);

        // Aggiorna DB
        await sql`
          UPDATE mention_outreach
          SET outreach_sent = ${ok}, outreach_sent_at = ${ok ? new Date().toISOString() : null},
              our_url = ${ourUrl}
          WHERE domain = ${site.domain} AND mention_url = ${mention.url}
        `;
      }

      await new Promise(r => setTimeout(r, 1500));
    }
  }

  console.log(`\n📊 Summary: ${totalMentions} new mentions, ${unlinked} unlinked, ${sent} emails sent`);
  process.exit(0);
}

run().catch(err => { console.error(err); process.exit(1); });
