/**
 * Alert System — notifiche email per eventi critici
 *
 * Supporta due metodi (in ordine di priorità):
 *
 * 1. Resend API (raccomandato — zero dipendenze, 3000 email/mese gratis)
 *    https://resend.com — registrazione gratuita, API key in 2 minuti
 *    Env: RESEND_API_KEY, ALERT_EMAIL_FROM, ALERT_EMAIL_TO
 *
 * 2. SMTP generico (Gmail, Mailgun, ecc.) via nodemailer
 *    Env: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS,
 *         ALERT_EMAIL_FROM, ALERT_EMAIL_TO
 *
 * Se nessuna configurazione è presente, gli alert vengono solo loggati.
 */

const RESEND_API_KEY  = process.env.RESEND_API_KEY;
const ALERT_EMAIL_TO  = process.env.ALERT_EMAIL_TO;
const ALERT_EMAIL_FROM = process.env.ALERT_EMAIL_FROM || 'alerts@content-network.local';

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587');
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;

// ── Resend API ────────────────────────────────────────────────
async function sendViaResend(subject, html) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: ALERT_EMAIL_FROM,
      to: [ALERT_EMAIL_TO],
      subject,
      html
    })
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Resend error: ${err}`);
  }
}

// ── SMTP via nodemailer ───────────────────────────────────────
async function sendViaSMTP(subject, html) {
  // Import dinamico — nodemailer è opzionale
  let nodemailer;
  try {
    nodemailer = (await import('nodemailer')).default;
  } catch {
    throw new Error('nodemailer not installed — run: npm install nodemailer');
  }

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS }
  });

  await transporter.sendMail({
    from: ALERT_EMAIL_FROM,
    to: ALERT_EMAIL_TO,
    subject,
    html
  });
}

// ── Dispatcher ────────────────────────────────────────────────
async function sendEmail(subject, html) {
  if (!ALERT_EMAIL_TO) {
    console.log(`[ALERT] ${subject}`);
    return;
  }

  try {
    if (RESEND_API_KEY) {
      await sendViaResend(subject, html);
    } else if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
      await sendViaSMTP(subject, html);
    } else {
      console.log(`[ALERT] No email provider configured. Subject: ${subject}`);
    }
  } catch (e) {
    console.warn(`[ALERT] Email send failed: ${e.message}`);
  }
}

function buildHtml(emoji, title, details, color = '#333') {
  return `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
  <h2 style="color:${color};margin-bottom:8px">${emoji} ${title}</h2>
  <pre style="background:#f5f5f5;padding:12px;border-radius:4px;font-size:13px;white-space:pre-wrap">${details}</pre>
  <p style="color:#999;font-size:12px;margin-top:16px">${new Date().toISOString()} — Content Network</p>
</div>`;
}

// ── API pubblica ──────────────────────────────────────────────

export async function alertCritical(title, details) {
  const subject = `🚨 CRITICAL: ${title}`;
  await sendEmail(subject, buildHtml('🚨', title, details, '#c0392b'));
}

export async function alertWarning(title, details) {
  const subject = `⚠️ WARNING: ${title}`;
  await sendEmail(subject, buildHtml('⚠️', title, details, '#e67e22'));
}

export async function alertReport(stats) {
  const lines = Object.entries(stats)
    .map(([k, v]) => `${k}: ${v}`)
    .join('\n');
  const subject = `📊 Weekly Report — Content Network`;
  await sendEmail(subject, buildHtml('📊', 'Weekly Report', lines, '#2980b9'));
}
