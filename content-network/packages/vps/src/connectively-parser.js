/**
 * connectively-parser.js — Legge digest email di Connectively (ex HARO) via IMAP Gmail
 *
 * Env richiesti:
 *   CONNECTIVELY_EMAIL=vireonmediaadv@gmail.com
 *   CONNECTIVELY_APP_PASSWORD=xxxx xxxx xxxx xxxx   (Gmail App Password 16 caratteri)
 *
 * Restituisce array di journalist request objects compatibili con haro-agent.js
 */

import { ImapFlow } from 'imapflow';

const IMAP_HOST = 'imap.gmail.com';
const IMAP_PORT = 993;

// Mittenti Connectively conosciuti
const CONNECTIVELY_SENDERS = [
  'connectively.us',
  'helpareporter.com',
  'haro',
  'cision.com',
];

function isConnectivelyEmail(envelope) {
  const from = (envelope.from?.[0]?.address || '').toLowerCase();
  const subject = (envelope.subject || '').toLowerCase();
  return CONNECTIVELY_SENDERS.some(s => from.includes(s))
    || subject.includes('haro')
    || subject.includes('connectively')
    || subject.includes('source request');
}

function stripHtml(html) {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ').replace(/&#39;/g, "'").replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function extractEmail(text) {
  return text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/)?.[0] || null;
}

function extractDeadline(text) {
  // "Deadline: January 15, 2025" or "Deadline: 01/15/2025" or similar
  const m = text.match(/deadline[:\s]+([^\n]{5,40})/i);
  return m ? m[1].trim() : null;
}

/**
 * Parsa il body di un digest Connectively in array di richieste individuali.
 * Connectively manda un digest con multiple richieste separate da blocchi.
 */
function parseDigestBody(text, emailDate) {
  const requests = [];

  // Connectively format: ogni richiesta inizia con una riga CATEGORY in maiuscolo
  // e contiene: nome media, query, requirements, deadline, contact email
  // Proviamo a splittare per pattern comuni

  // Pattern 1: splitti per riga vuota + parola in maiuscolo (categoria)
  // Pattern 2: splitti per "Name:" o "Media Outlet:" markers
  // Pattern 3: splitti per "---" separators

  // Approccio robusto: cerca blocchi che contengono una email + testo significativo
  const blocks = text.split(/\n-{3,}\n|\n={3,}\n/);

  for (const block of blocks) {
    const trimmed = block.trim();
    if (trimmed.length < 100) continue; // troppo corto per essere una richiesta

    const email = extractEmail(trimmed);
    const deadline = extractDeadline(trimmed);

    // Estrai titolo: prima riga non vuota significativa (>20 chars)
    const lines = trimmed.split('\n').map(l => l.trim()).filter(Boolean);
    const title = lines.find(l => l.length > 20 && l.length < 200) || lines[0] || '';

    // Salta se sembra un footer/header del digest
    if (
      title.toLowerCase().includes('unsubscribe') ||
      title.toLowerCase().includes('privacy policy') ||
      title.toLowerCase().includes('connectively') && trimmed.length < 300
    ) continue;

    // Body = tutto il testo del blocco (max 1500 chars)
    const bodyText = trimmed.substring(0, 1500);

    // Genera external_id da hash del contenuto
    const hash = Buffer.from(bodyText.substring(0, 200)).toString('base64').replace(/[^a-z0-9]/gi, '').substring(0, 40);

    requests.push({
      source:           'connectively',
      external_id:      hash,
      request_title:    title.substring(0, 200),
      request_text:     bodyText,
      journalist_email: email,
      journalist_name:  null,
      deadline:         deadline || emailDate,
    });
  }

  // Fallback: se nessun blocco trovato, tratta l'intera email come una richiesta
  if (!requests.length && text.length > 200) {
    const email = extractEmail(text);
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 20);
    const hash = Buffer.from(text.substring(0, 200)).toString('base64').replace(/[^a-z0-9]/gi, '').substring(0, 40);
    requests.push({
      source:           'connectively',
      external_id:      hash,
      request_title:    lines[0]?.substring(0, 200) || 'Connectively Request',
      request_text:     text.substring(0, 1500),
      journalist_email: email,
      journalist_name:  null,
      deadline:         emailDate,
    });
  }

  return requests;
}

/**
 * Fetch richieste Connectively dalla mailbox Gmail.
 * Legge le email non lette (o ultime 24h) e le marca come lette dopo il parsing.
 */
export async function fetchConnectivelyRequests() {
  const email    = process.env.CONNECTIVELY_EMAIL;
  const password = process.env.CONNECTIVELY_APP_PASSWORD;

  if (!email || !password) return [];

  const client = new ImapFlow({
    host:   IMAP_HOST,
    port:   IMAP_PORT,
    secure: true,
    auth:   { user: email, pass: password },
    logger: false,
  });

  const allRequests = [];

  try {
    await client.connect();
    await client.mailboxOpen('INBOX');

    // Cerca email non lette nelle ultime 48h
    const since = new Date(Date.now() - 48 * 60 * 60 * 1000);
    const messages = await client.search({ unseen: true, since });

    if (!messages.length) {
      await client.logout();
      return [];
    }

    // Processa al massimo 20 email per run
    const toProcess = messages.slice(-20);

    for await (const msg of client.fetch(toProcess, { envelope: true, bodyStructure: true, source: true })) {
      try {
        if (!isConnectivelyEmail(msg.envelope)) continue;

        // Leggi il body completo come testo
        const raw = msg.source.toString('utf-8');

        // Estrai parte text/plain o text/html
        let bodyText = '';
        const htmlMatch = raw.match(/Content-Type: text\/html[\s\S]*?\r\n\r\n([\s\S]*?)(?:\r\n--|\s*$)/i);
        const plainMatch = raw.match(/Content-Type: text\/plain[\s\S]*?\r\n\r\n([\s\S]*?)(?:\r\n--|\s*$)/i);

        if (plainMatch) {
          bodyText = plainMatch[1];
        } else if (htmlMatch) {
          bodyText = stripHtml(htmlMatch[1]);
        } else {
          // Prendi tutto dopo gli header email
          const bodyStart = raw.indexOf('\r\n\r\n');
          bodyText = bodyStart > 0 ? stripHtml(raw.substring(bodyStart + 4)) : stripHtml(raw);
        }

        const emailDate = msg.envelope.date?.toISOString() || new Date().toISOString();
        const requests  = parseDigestBody(bodyText, emailDate);
        allRequests.push(...requests);

        // Marca come letta
        await client.messageFlagsAdd(msg.seq, ['\\Seen']);

      } catch (e) {
        console.warn(`  ⚠️  Error parsing email: ${e.message}`);
      }
    }

    await client.logout();

  } catch (e) {
    console.warn(`  ⚠️  IMAP error: ${e.message}`);
    try { await client.logout(); } catch {}
  }

  console.log(`  Connectively: parsed ${allRequests.length} requests from inbox`);
  return allRequests;
}
