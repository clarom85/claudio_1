/**
 * ParentCare Finder — email templates.
 * Used for buyer lead delivery, lead confirmation, and buyer outreach.
 *
 * All templates are plain HTML (inline-styled, mobile-friendly), with
 * matching plain-text versions for the multipart fallback.
 */

import { labelFor } from './quiz-config.js';

const FROM_NAME = 'ParentCare Finder';
// Use the already-verified Resend domain until vireonmedia.com is verified.
// Override with ALERT_EMAIL_FROM env var when ready.
const FROM_EMAIL = process.env.ALERT_EMAIL_FROM || 'onboarding@resend.dev';
const REPLY_TO = 'romanazziclaudio@gmail.com';
const TERRA = '#c4622d';
const SAGE = '#5a7a5a';
const WARM = '#3d2b1f';
const CREAM = '#faf6f1';

function fmtPhone(digits) {
  if (!digits) return '';
  const d = String(digits).replace(/\D/g, '');
  if (d.length === 10) return `(${d.slice(0,3)}) ${d.slice(3,6)}-${d.slice(6)}`;
  if (d.length === 11) return `+${d[0]} (${d.slice(1,4)}) ${d.slice(4,7)}-${d.slice(7)}`;
  return digits;
}

// ─────────────────────────────────────────────────────────
// Email TO BUYER — qualified lead delivery
// ─────────────────────────────────────────────────────────
export function buyerLeadEmail({ lead, buyer, routingId }) {
  const concerns = Array.isArray(lead.main_concern) ? lead.main_concern : [];
  const subject = `[ParentCare Lead #${lead.id}] ${labelFor('urgency', lead.urgency)} — ${labelFor('level_help', lead.level_help)} in ${lead.zip}`;

  const rows = [
    ['Tier',           lead.tier ? `${lead.tier.toUpperCase()} (score ${lead.score})` : '—'],
    ['Caller',         `${lead.name || '—'} (looking for care for ${labelFor('who_needs_care', lead.who_needs_care)})`],
    ['Phone',          fmtPhone(lead.phone) || '—'],
    ['Email',          lead.email || '—'],
    ['ZIP',            lead.zip || '—'],
    ['Urgency',        labelFor('urgency', lead.urgency)],
    ['Care needed',    labelFor('level_help', lead.level_help)],
    ['Currently at',   labelFor('location_now', lead.location_now)],
    ['Main concerns',  labelFor('main_concern', concerns)],
    ['Payment',        labelFor('payment', lead.payment)],
    ['Submitted',      new Date(lead.ts || Date.now()).toLocaleString('en-US', { timeZone: 'America/New_York' }) + ' EST'],
  ];

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:${CREAM};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:${WARM}">
<div style="max-width:620px;margin:0 auto;padding:24px 16px">
  <div style="background:#fff;border-radius:10px;border:1px solid #e6dccf;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,.06)">
    <div style="background:${TERRA};color:#fff;padding:22px 28px">
      <div style="font-size:11px;letter-spacing:2px;text-transform:uppercase;opacity:.85;margin-bottom:6px">Qualified Lead Delivery</div>
      <h1 style="font-family:'Cormorant Garamond',Georgia,serif;font-weight:500;font-size:26px;line-height:1.2;margin:0">New family inquiry — ${lead.zip}</h1>
    </div>
    <div style="padding:24px 28px">
      <p style="font-size:15px;line-height:1.65;margin:0 0 18px;color:${WARM}">
        Hi ${buyer.contact_name || buyer.name},<br><br>
        We've received a new inquiry from a family in your service area. Below are their details. <strong>Please reach out within 1 hour for the best response rate.</strong>
      </p>

      <table cellpadding="0" cellspacing="0" border="0" style="width:100%;border-collapse:collapse;margin:0 0 22px;font-size:14px">
        ${rows.map(([k,v]) => `<tr>
          <td style="padding:8px 0;color:#7a6a5a;font-weight:600;letter-spacing:.3px;text-transform:uppercase;font-size:11px;width:130px;vertical-align:top">${k}</td>
          <td style="padding:8px 0 8px 12px;color:${WARM};border-bottom:1px solid #f0e8de;line-height:1.5">${v}</td>
        </tr>`).join('')}
      </table>

      <div style="background:${CREAM};border:1px solid #e6dccf;border-radius:8px;padding:16px 18px;margin-bottom:20px">
        <div style="font-size:12px;font-weight:700;color:${TERRA};letter-spacing:1px;text-transform:uppercase;margin-bottom:8px">Outreach script suggestion</div>
        <p style="font-size:14px;line-height:1.6;margin:0;color:${WARM}">
          "Hi ${lead.name?.split(' ')[0] || 'there'}, this is [your name] from [agency]. I received a request from ParentCare Finder about care options for your ${labelFor('who_needs_care', lead.who_needs_care).toLowerCase()}. Is now a good time to talk through what you're looking for?"
        </p>
      </div>

      <div style="text-align:center;margin:24px 0 8px">
        <a href="tel:${lead.phone}" style="background:${SAGE};color:#fff;text-decoration:none;font-weight:700;padding:14px 28px;border-radius:6px;display:inline-block;font-size:15px;letter-spacing:.3px">Call ${fmtPhone(lead.phone)}</a>
      </div>

      ${buyer.auth_token ? `<div style="text-align:center;margin:14px 0 8px">
        <a href="https://medicarepriceguide.com/buyer-portal?token=${buyer.auth_token}" style="font-size:13px;color:${TERRA};text-decoration:none;font-weight:600">Open lead portal &rarr;</a>
        <p style="font-size:11px;color:#aaa;margin-top:4px">Mark this lead good/bad/no-answer with one tap, or just reply to this email.</p>
      </div>` : ''}

      <p style="font-size:12px;color:#7a6a5a;line-height:1.7;margin-top:24px;border-top:1px solid #f0e8de;padding-top:16px">
        Routing ID: ${routingId} &middot; Lead ID: ${lead.id}<br>
        Reply to this email with feedback after contact: <strong>good lead</strong>, <strong>bad fit</strong>, <strong>could not reach</strong>, or <strong>tour scheduled</strong>. This helps us improve the quality of leads we send you.<br>
        <span style="color:#aaa">Consent captured ${new Date(lead.consent_ts || lead.ts).toUTCString()} from IP ${lead.consent_ip || '—'}.</span>
      </p>
    </div>
  </div>
  <p style="font-size:11px;color:#aaa;text-align:center;margin:18px 0 0">
    ParentCare Finder &middot; operated by Vireon Media &middot; <a href="mailto:partners@vireonmedia.com" style="color:#aaa">partners@vireonmedia.com</a>
  </p>
</div>
</body></html>`;

  const text = [
    `NEW PARENTCARE LEAD — ${lead.zip}`,
    `Routing #${routingId} · Lead #${lead.id} · ${(lead.tier||'').toUpperCase()}`,
    '',
    `Caller: ${lead.name} (caring for ${labelFor('who_needs_care', lead.who_needs_care)})`,
    `Phone: ${fmtPhone(lead.phone)}`,
    lead.email ? `Email: ${lead.email}` : '',
    `ZIP: ${lead.zip}`,
    `Urgency: ${labelFor('urgency', lead.urgency)}`,
    `Care needed: ${labelFor('level_help', lead.level_help)}`,
    `Currently at: ${labelFor('location_now', lead.location_now)}`,
    `Concerns: ${labelFor('main_concern', concerns)}`,
    `Payment: ${labelFor('payment', lead.payment)}`,
    '',
    `Reply to this email with: good lead | bad fit | could not reach | tour scheduled.`,
    '',
    `ParentCare Finder · Vireon Media · partners@vireonmedia.com`,
  ].filter(Boolean).join('\n');

  return { from: `${FROM_NAME} <${FROM_EMAIL}>`, replyTo: REPLY_TO, to: buyer.email, subject, html, text };
}

// ─────────────────────────────────────────────────────────
// Email TO LEAD — confirmation + what to expect
// ─────────────────────────────────────────────────────────
export function leadConfirmationEmail({ lead }) {
  if (!lead.email) return null;
  const firstName = (lead.name || '').split(' ')[0] || 'there';
  const subject = `We've received your care assessment — what happens next`;

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:${CREAM};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:${WARM}">
<div style="max-width:580px;margin:0 auto;padding:32px 16px">
  <div style="background:#fff;border-radius:10px;border:1px solid #e6dccf;overflow:hidden">
    <div style="padding:36px 32px 12px;text-align:center">
      <div style="display:inline-block;width:56px;height:56px;background:#e8f0e2;border-radius:50%;line-height:56px;font-size:28px;color:${SAGE};margin-bottom:18px">♡</div>
      <h1 style="font-family:'Cormorant Garamond',Georgia,serif;font-weight:500;font-size:30px;line-height:1.2;color:${WARM};margin:0 0 10px">Thank you, ${firstName}.</h1>
      <p style="font-size:15px;color:#7a6a5a;line-height:1.65;margin:0">We've received your care assessment.</p>
    </div>
    <div style="padding:24px 32px 32px">
      <p style="font-size:15.5px;line-height:1.75;color:${WARM};margin:0 0 18px">
        Caring for an aging parent can feel overwhelming — especially when there's urgency or uncertainty involved. You've taken a thoughtful first step.
      </p>
      <p style="font-size:15.5px;line-height:1.75;color:${WARM};margin:0 0 18px">
        <strong>Within the next few hours</strong>, a senior care advisor from a trusted local provider in your area will reach out to talk through your options. This first conversation is informational, not transactional — just a chance to better understand your situation and the path forward.
      </p>

      <div style="background:${CREAM};border-left:3px solid ${TERRA};padding:16px 18px;margin:22px 0;border-radius:4px">
        <p style="font-size:14px;line-height:1.7;margin:0;color:${WARM}">
          <strong>What to expect on the call:</strong><br>
          • Questions about daily routines, medical needs, and home setup<br>
          • Discussion of care options — in-home, assisted living, memory care<br>
          • Estimated cost ranges for your area<br>
          • Next steps if you decide to move forward (no pressure)
        </p>
      </div>

      <p style="font-size:14px;line-height:1.65;color:#7a6a5a;margin:24px 0 0">
        Want to learn more while you wait?<br>
        <a href="https://medicarepriceguide.com/medicare-coverage/" style="color:${TERRA};font-weight:600">What Medicare covers (and doesn't)</a><br>
        <a href="https://medicarepriceguide.com/in-home-care-costs/" style="color:${TERRA};font-weight:600">In-home care costs by state</a>
      </p>
    </div>
  </div>
  <p style="font-size:11px;color:#aaa;text-align:center;margin:20px 0 0;line-height:1.6">
    ParentCare Finder &middot; operated by Vireon Media<br>
    <a href="https://medicarepriceguide.com/find-care/privacy/" style="color:#aaa">Privacy</a> &middot;
    <a href="https://medicarepriceguide.com/find-care/terms/" style="color:#aaa">Terms</a> &middot;
    <a href="mailto:dnc@vireonmedia.com?subject=Please%20remove%20me" style="color:#aaa">Opt out</a>
  </p>
</div>
</body></html>`;

  const text = [
    `Thank you, ${firstName}.`,
    `We've received your care assessment.`,
    '',
    `Within the next few hours, a senior care advisor from a trusted local provider in your area will reach out to talk through your options.`,
    '',
    `What to expect:`,
    `• Questions about daily routines, medical needs, home setup`,
    `• Discussion of care options — in-home, assisted living, memory care`,
    `• Estimated cost ranges for your area`,
    `• Next steps if you decide to move forward (no pressure)`,
    '',
    `Want to opt out? Reply STOP or email dnc@vireonmedia.com.`,
    '',
    `ParentCare Finder · operated by Vireon Media`,
  ].join('\n');

  return { from: `${FROM_NAME} <${FROM_EMAIL}>`, replyTo: REPLY_TO, to: lead.email, subject, html, text };
}

// ─────────────────────────────────────────────────────────
// Internal alert — when lead arrives but NO buyer matched
// ─────────────────────────────────────────────────────────
export function unmatchedLeadAlert({ lead, alertEmail }) {
  if (!alertEmail) return null;
  const concerns = Array.isArray(lead.main_concern) ? lead.main_concern : [];
  return {
    from: `${FROM_NAME} <${FROM_EMAIL}>`,
    to: alertEmail,
    subject: `[ParentCare] Lead #${lead.id} arrived — NO BUYER MATCH for ZIP ${lead.zip}`,
    text: `Lead #${lead.id} (${lead.tier} tier, score ${lead.score}) — no buyer covers ZIP ${lead.zip} for category derived from quiz answers.

Caller: ${lead.name} | ${fmtPhone(lead.phone)} | ${lead.email || '—'}
Urgency: ${labelFor('urgency', lead.urgency)} | Care: ${labelFor('level_help', lead.level_help)}
Location: ${labelFor('location_now', lead.location_now)} | Payment: ${labelFor('payment', lead.payment)}
Concerns: ${labelFor('main_concern', concerns)}

ACTION: contact lead manually within 1h, OR add a buyer for ZIP ${lead.zip} and re-route.

Admin: https://medicarepriceguide.com/admin/parentcare?token=__SET__&id=${lead.id}`,
  };
}

// ─────────────────────────────────────────────────────────
// Cold outreach to potential buyers (manual, but template ready)
// ─────────────────────────────────────────────────────────
export function buyerOutreachTemplate({ buyerName, contactName = 'there', metro = 'Tampa-St. Pete' }) {
  const subject = `Free 5-lead pilot for ${buyerName}: families looking for care in ${metro}`;
  const text = `Hi ${contactName},

I'm Claudio with Vireon Media. We run medicarepriceguide.com — a US-focused senior care information site that gets organic search traffic from adult children researching care options for aging parents.

We've just launched ParentCare Finder, a 2-minute care assessment that captures qualified inquiries from families in the ${metro} area. We're inviting a small number of local home care agencies to a no-risk pilot:

• 5 free qualified leads, no contract, no setup fee
• After the pilot, $50 per qualified lead (no spend without your approval)
• Real families, real consent (full TCPA/FTSA audit trail)
• Lead delivered to you by email within 60 seconds of submission
• You give us feedback on each lead — good fit, bad fit, could not reach — and we use it to filter what we send you next

We're starting in ${metro} because of the strong local demand for in-home care. We're only working with 3–5 partners per metro to keep volume meaningful for everyone.

Would you be open to a 15-minute call this week to walk through how it works? I can also just send the first lead for you to evaluate before any conversation.

Thanks for considering.

Claudio Romanazzi
Vireon Media — ParentCare Finder
romanazziclaudio@gmail.com
`;
  return { subject, text };
}
