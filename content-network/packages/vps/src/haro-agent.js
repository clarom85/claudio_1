/**
 * haro-agent.js — Journalist Outreach Agent
 *
 * Monitora richieste di giornalisti da più fonti, valuta la rilevanza
 * per le nostre nicchie con Claude, genera risposte da esperto e le invia.
 *
 * Fonti supportate:
 *   - SourceBottle RSS (free account — https://sourcebottle.com)
 *     Env: SOURCEBOTTLE_RSS_URL=/url-del-tuo-feed-rss
 *   - Twitter/X #journorequest
 *     Env: TWITTER_BEARER_TOKEN=...
 *
 * Env richiesti:
 *   ANTHROPIC_API_KEY, RESEND_API_KEY, ALERT_EMAIL_FROM
 *
 * Uso:
 *   node packages/vps/src/haro-agent.js [--dry-run] [--site-id <id>]
 *
 * PM2:
 *   pm2 start packages/vps/src/haro-agent.js --name haro --cron "0 * /6 * * *" --no-autorestart
 *   (nota: rimuovi spazio tra * e /6 nel cron string)
 */

import 'dotenv/config';
import { sql } from '@content-network/db';
import { fetchConnectivelyRequests } from './connectively-parser.js';

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const RESEND_API_KEY    = process.env.RESEND_API_KEY;
const OUTREACH_FROM     = process.env.OUTREACH_EMAIL_FROM || process.env.ALERT_EMAIL_FROM;

const args      = process.argv.slice(2);
const dryRun    = args.includes('--dry-run');
const _sidIdx   = args.indexOf('--site-id');
const siteIdFilter = (_sidIdx >= 0 ? parseInt(args[_sidIdx + 1]) : 0) || null;

// ─── Niche keyword map ────────────────────────────────────────────────────────

const NICHE_KEYWORDS = {
  'home-improvement-costs': [
    'home improvement', 'renovation', 'remodel', 'contractor', 'hvac', 'roofing',
    'plumbing', 'electrical', 'kitchen remodel', 'bathroom remodel', 'flooring',
    'home repair', 'construction cost', 'home project', 'home addition',
  ],
  'insurance-guide': [
    'insurance', 'coverage', 'premium', 'deductible', 'policy', 'claim',
    'health insurance', 'auto insurance', 'home insurance', 'life insurance',
    'renters insurance', 'car insurance', 'insurance cost',
  ],
  'legal-advice': [
    'legal', 'lawyer', 'attorney', 'lawsuit', 'litigation', 'contract',
    'legal rights', 'legal advice', 'injury claim', 'divorce', 'employment law',
  ],
  'senior-care-medicare': [
    'medicare', 'medicaid', 'senior care', 'elderly', 'nursing home',
    'assisted living', 'retirement', 'senior living', 'long-term care',
  ],
  'solar-energy': [
    'solar', 'solar panels', 'solar installation', 'renewable energy',
    'solar cost', 'clean energy', 'solar savings', 'solar incentive',
  ],
  'personal-finance': [
    'personal finance', 'savings', 'budget', 'debt', 'credit score',
    'investing', 'financial planning', 'emergency fund', 'retirement savings',
  ],
  'real-estate-investing': [
    'real estate', 'property investment', 'mortgage', 'housing market',
    'landlord', 'rental property', 'real estate investing', 'house flipping',
  ],
  'health-symptoms': [
    'health', 'symptoms', 'medical', 'doctor', 'wellness', 'chronic pain',
    'mental health', 'nutrition', 'fitness', 'disease prevention',
  ],
  'weight-loss-fitness': [
    'weight loss', 'diet', 'fitness', 'exercise', 'nutrition', 'calories',
    'workout', 'obesity', 'healthy eating', 'weight management',
  ],
  'automotive-guide': [
    'car', 'vehicle', 'auto repair', 'car maintenance', 'used car',
    'car buying', 'auto insurance', 'car cost', 'electric vehicle', 'EV',
  ],
};

// ─── DB setup ─────────────────────────────────────────────────────────────────

async function ensureTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS journalist_outreach (
      id                SERIAL PRIMARY KEY,
      source            VARCHAR(50)  NOT NULL,
      external_id       VARCHAR(500) NOT NULL,
      request_title     TEXT,
      request_text      TEXT,
      journalist_email  VARCHAR(255),
      journalist_name   VARCHAR(255),
      deadline          TEXT,
      niche_slug        VARCHAR(100),
      site_id           INTEGER,
      relevance_score   INTEGER DEFAULT 0,
      response_text     TEXT,
      response_sent     BOOLEAN DEFAULT false,
      response_sent_at  TIMESTAMPTZ,
      link_received     BOOLEAN DEFAULT false,
      created_at        TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE (source, external_id)
    )
  `;
}

// ─── Sources ──────────────────────────────────────────────────────────────────

function stripHtml(html) {
  return html.replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ').trim();
}

function extractEmail(text) {
  return text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/)?.[0] || null;
}

function parseRssItems(xml) {
  const items = [];
  for (const [, itemXml] of xml.matchAll(/<item>([\s\S]*?)<\/item>/g)) {
    const get = (tag) =>
      itemXml.match(new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>`))?.[1]
      ?? itemXml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`))?.[1]
      ?? '';
    items.push({
      title:       stripHtml(get('title')),
      description: stripHtml(get('description')),
      link:        get('link').trim(),
      guid:        get('guid').trim() || get('link').trim(),
      pubDate:     get('pubDate').trim(),
    });
  }
  return items;
}

async function fetchSourceBottle() {
  const rssUrl = process.env.SOURCEBOTTLE_RSS_URL;
  if (!rssUrl) return [];

  try {
    const res = await fetch(rssUrl, { headers: { 'User-Agent': 'ContentNetwork/1.0' } });
    if (!res.ok) { console.warn(`  ⚠️  SourceBottle RSS ${res.status}`); return []; }
    const xml  = await res.text();
    const items = parseRssItems(xml);

    return items.map(item => ({
      source:           'sourcebottle',
      external_id:      item.guid || item.link,
      request_title:    item.title,
      request_text:     `${item.title}. ${item.description}`.substring(0, 2000),
      journalist_email: extractEmail(item.description),
      journalist_name:  null,
      deadline:         item.pubDate,
    }));
  } catch (e) {
    console.warn(`  ⚠️  SourceBottle fetch error: ${e.message}`);
    return [];
  }
}

async function fetchTwitterRequests() {
  const token = process.env.TWITTER_BEARER_TOKEN;
  if (!token) return [];

  try {
    const query = encodeURIComponent('(#journorequest OR #HARO OR "source request") -is:retweet lang:en');
    const url   = `https://api.twitter.com/2/tweets/search/recent?query=${query}&max_results=50&tweet.fields=author_id,created_at,text&expansions=author_id&user.fields=name,username`;
    const res   = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) { console.warn(`  ⚠️  Twitter API ${res.status}`); return []; }
    const data  = await res.json();

    const userMap = {};
    for (const u of (data.includes?.users || [])) userMap[u.id] = u;

    return (data.data || []).map(t => {
      const user = userMap[t.author_id] || {};
      // Extract email from tweet text (rare but possible)
      const email = extractEmail(t.text);
      return {
        source:           'twitter',
        external_id:      t.id,
        request_title:    t.text.substring(0, 120).replace(/\n/g, ' '),
        request_text:     t.text,
        journalist_email: email,
        journalist_name:  user.name || null,
        deadline:         t.created_at,
      };
    });
  } catch (e) {
    console.warn(`  ⚠️  Twitter fetch error: ${e.message}`);
    return [];
  }
}

// ─── Claude helpers (raw fetch, no SDK) ───────────────────────────────────────

async function claudeCall(model, prompt, maxTokens = 300) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key':         ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'content-type':      'application/json',
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      messages: [{ role: 'user', content: prompt }],
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Anthropic error: ${JSON.stringify(data)}`);
  return data.content[0].text;
}

async function checkRelevance(item, sites) {
  const nicheList = sites
    .map(s => `- ${s.niche_slug}: ${(NICHE_KEYWORDS[s.niche_slug] || []).slice(0, 6).join(', ')}`)
    .join('\n');

  const prompt = `Journalist request:
Title: ${item.request_title}
Text: ${item.request_text?.substring(0, 500)}

Our sites cover these niches:
${nicheList}

Is this request relevant to any of our niches? Reply with JSON only:
{"relevant": true/false, "niche_slug": "slug_or_null", "score": 0-10, "reason": "one sentence"}

Score 8-10 = strong match, directly about this niche topic.
Score 5-7 = tangential, could contribute but not ideal.
Score <5 = not relevant.`;

  try {
    const text = await claudeCall('claude-haiku-4-5-20251001', prompt, 150);
    const json = text.match(/\{[\s\S]*?\}/)?.[0];
    return json ? JSON.parse(json) : { relevant: false, score: 0, niche_slug: null, reason: 'parse error' };
  } catch {
    return { relevant: false, score: 0, niche_slug: null, reason: 'error' };
  }
}

async function generateResponse(item, site, nicheSlug) {
  const keywords = (NICHE_KEYWORDS[nicheSlug] || []).slice(0, 8).join(', ');

  const prompt = `You are a contributor for ${site.domain}, an authoritative resource on ${nicheSlug.replace(/-/g, ' ')}.

A journalist posted this request:
Title: ${item.request_title}
Request: ${item.request_text?.substring(0, 800)}

Write a professional expert response (180-240 words) that:
1. Opens with the single most valuable insight — no "Hi, I'm..." preamble
2. Includes 1-2 specific statistics, ranges, or data points (realistic, plausible)
3. Uses confident but accurate language — hedge where needed ("typically", "in most cases")
4. References ${site.domain} naturally as the source publication
5. Ends with: "You can find more detailed research at ${site.domain}"

Do NOT: start with "Certainly", "Great question", "As an expert". Go straight to the answer.
Tone: credible practitioner, not AI assistant.`;

  return claudeCall('claude-sonnet-4-6', prompt, 400);
}

// ─── Email sending (raw Resend fetch) ─────────────────────────────────────────

async function sendEmail(to, from, subject, text) {
  if (!RESEND_API_KEY) return false;
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization:   `Bearer ${RESEND_API_KEY}`,
        'Content-Type':  'application/json',
      },
      body: JSON.stringify({ from, to, subject, text }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function run() {
  console.log(`\n📰 Journalist Outreach Agent${dryRun ? ' [DRY RUN]' : ''}\n`);

  await ensureTable();

  const sites = siteIdFilter
    ? await sql`SELECT s.id, s.domain, n.slug as niche_slug FROM sites s JOIN niches n ON s.niche_id = n.id WHERE s.status = 'live' AND s.id = ${siteIdFilter}`
    : await sql`SELECT s.id, s.domain, n.slug as niche_slug FROM sites s JOIN niches n ON s.niche_id = n.id WHERE s.status = 'live'`;

  if (!sites.length) { console.log('No live sites.'); process.exit(0); }

  // Fetch from all configured sources
  const [sbItems, twItems, cnItems] = await Promise.all([
    fetchSourceBottle(),
    fetchTwitterRequests(),
    fetchConnectivelyRequests(),
  ]);
  const allItems = [...sbItems, ...twItems, ...cnItems];

  console.log(`Sources: ${sbItems.length} SourceBottle, ${twItems.length} Twitter, ${cnItems.length} Connectively → ${allItems.length} total\n`);

  if (!allItems.length) {
    console.log('No requests fetched. Check SOURCEBOTTLE_RSS_URL / TWITTER_BEARER_TOKEN.');
    process.exit(0);
  }

  let newCount = 0, relevantCount = 0, sentCount = 0;

  for (const item of allItems) {
    // Skip already processed
    const exists = await sql`
      SELECT id FROM journalist_outreach WHERE source = ${item.source} AND external_id = ${item.external_id}
    `;
    if (exists.length) continue;
    newCount++;

    // Relevance check (cheap Haiku)
    const rel = await checkRelevance(item, sites);

    // Always insert for tracking
    await sql`
      INSERT INTO journalist_outreach
        (source, external_id, request_title, request_text, journalist_email, journalist_name,
         deadline, niche_slug, relevance_score)
      VALUES
        (${item.source}, ${item.external_id}, ${item.request_title}, ${item.request_text},
         ${item.journalist_email}, ${item.journalist_name}, ${item.deadline},
         ${rel.niche_slug}, ${rel.score})
      ON CONFLICT (source, external_id) DO NOTHING
    `;

    const prefix = `[${item.source.toUpperCase()}] score=${rel.score}`;

    if (!rel.relevant || rel.score < 7) {
      console.log(`  ⏭  ${prefix} — ${item.request_title?.substring(0, 70)}`);
      continue;
    }

    relevantCount++;
    console.log(`  ✅ ${prefix} niche=${rel.niche_slug} — ${item.request_title?.substring(0, 60)}`);
    console.log(`     ${rel.reason}`);

    // Find matching site
    const matchSite = sites.find(s => s.niche_slug === rel.niche_slug) || sites[0];

    // Generate response
    let responseText;
    try {
      responseText = await generateResponse(item, matchSite, rel.niche_slug);
    } catch (e) {
      console.warn(`     ⚠️  Response generation failed: ${e.message}`);
      continue;
    }

    if (dryRun) {
      console.log(`\n${'─'.repeat(60)}\n${responseText}\n${'─'.repeat(60)}\n`);
    } else {
      let sent = false;

      if (item.journalist_email && OUTREACH_FROM) {
        const fromLabel = matchSite.domain.split('.')[0]
          .split('-').map(w => w[0].toUpperCase() + w.slice(1)).join(' ');
        sent = await sendEmail(
          item.journalist_email,
          `${fromLabel} Editorial <${OUTREACH_FROM}>`,
          `RE: ${item.request_title}`,
          responseText,
        );
        if (sent) sentCount++;
        console.log(`     📧 ${sent ? `Sent to ${item.journalist_email}` : 'Email send failed'}`);
      } else {
        console.log(`     ⚠️  No journalist email — response saved to DB only`);
      }

      // Save response + status
      await sql`
        UPDATE journalist_outreach
        SET response_text     = ${responseText},
            response_sent     = ${sent},
            response_sent_at  = ${sent ? new Date().toISOString() : null},
            site_id           = ${matchSite.id}
        WHERE source = ${item.source} AND external_id = ${item.external_id}
      `;
    }

    // Small delay to avoid rate limits
    await new Promise(r => setTimeout(r, 1500));
  }

  console.log(`\n📊 Summary: ${newCount} new, ${relevantCount} relevant, ${sentCount} emails sent`);
  process.exit(0);
}

run().catch(err => { console.error(err); process.exit(1); });
