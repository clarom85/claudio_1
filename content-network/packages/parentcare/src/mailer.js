/**
 * ParentCare Finder — minimal mailer using Resend HTTP API.
 * Free tier: 3000 emails/month. Same key already used for alert.js.
 *
 * Falls back to console-log if RESEND_API_KEY is not set (dev mode).
 */

const RESEND_URL = 'https://api.resend.com/emails';

export async function sendEmail({ from, to, subject, html, text, replyTo }) {
  const key = process.env.RESEND_API_KEY;

  // Dev/no-key fallback
  if (!key) {
    console.log('[parentcare/mailer] (no RESEND_API_KEY) would send:');
    console.log(`  TO:   ${to}`);
    console.log(`  FROM: ${from}`);
    console.log(`  SUBJ: ${subject}`);
    if (text) console.log(`  TXT:  ${text.split('\n').slice(0,4).join(' / ')}…`);
    return { ok: true, dev: true };
  }

  // Default From: prefer the already-verified Resend domain configured for
  // alerts; fall back to the brand From only when explicitly overridden.
  const defaultFrom = process.env.ALERT_EMAIL_FROM
    ? `ParentCare Finder <${process.env.ALERT_EMAIL_FROM}>`
    : 'ParentCare Finder <onboarding@resend.dev>';
  const body = {
    from: from || defaultFrom,
    to: Array.isArray(to) ? to : [to],
    subject,
    html,
    text,
  };
  if (replyTo) body.reply_to = replyTo;

  try {
    const res = await fetch(RESEND_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      console.error('[parentcare/mailer] Resend error:', res.status, data);
      return { ok: false, status: res.status, error: data };
    }
    return { ok: true, id: data.id };
  } catch (err) {
    console.error('[parentcare/mailer] fetch error:', err.message);
    return { ok: false, error: err.message };
  }
}
