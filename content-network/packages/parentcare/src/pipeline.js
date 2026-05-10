/**
 * ParentCare Finder — submission pipeline.
 *
 * Steps:
 *   1. Validate payload
 *   2. DNC check (federal/state/internal)
 *   3. Dedup (24h)
 *   4. Score + categorize
 *   5. Persist lead with full consent audit trail
 *   6. Match buyer by ZIP + category
 *   7. Send buyer email + lead confirmation
 *   8. Mark routed
 *
 * Returns { ok, leadId, status, message } — caller renders accordingly.
 */

import { sql } from '@content-network/db';
import { CONSENT_TEXT, CONSENT_VERSION } from './quiz-config.js';
import { scoreLead, categorizeLead } from './scoring.js';
import { findBuyers, logRouting, markLeadRouted, isOnDnc, isDuplicate } from './buyer-router.js';
import { buyerLeadEmail, leadConfirmationEmail, unmatchedLeadAlert } from './email-templates.js';
import { sendEmail } from './mailer.js';

// State derivation from ZIP — minimal, FL-focused for pilot.
// Full ZCTA→state mapping would be a 30k-row CSV; we ship a tiny lookup
// covering the pilot metros and rely on buyers' explicit ZIP arrays.
const ZIP_PREFIX_STATE = {
  '32': 'FL', '33': 'FL', '34': 'FL',                  // Florida
  '75': 'TX', '76': 'TX', '77': 'TX', '78': 'TX', '79': 'TX', // Texas
  '85': 'AZ', '86': 'AZ',                              // Arizona
};
function zipToState(zip) {
  const z = String(zip || '').trim();
  if (!/^\d{5}$/.test(z)) return null;
  return ZIP_PREFIX_STATE[z.slice(0, 2)] || null;
}

const REQUIRED_FIELDS = [
  'who_needs_care', 'main_concern', 'location_now',
  'level_help', 'urgency', 'zip', 'payment',
  'name', 'phone',
];

export function validatePayload(p) {
  const errors = [];
  for (const f of REQUIRED_FIELDS) {
    const v = p[f];
    if (v === undefined || v === null || v === '' || (Array.isArray(v) && !v.length)) {
      errors.push(`Missing field: ${f}`);
    }
  }
  if (p.zip && !/^\d{5}$/.test(String(p.zip).trim())) {
    errors.push('Invalid ZIP format (must be 5 digits)');
  }
  const phoneDigits = String(p.phone || '').replace(/\D/g, '');
  if (phoneDigits.length < 10 || phoneDigits.length > 15) {
    errors.push('Invalid phone number');
  }
  if (p.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(p.email).trim())) {
    errors.push('Invalid email');
  }
  return errors;
}

export async function processSubmission({ payload, ip, userAgent, refererUrl }) {
  // 1. Validate
  const errs = validatePayload(payload);
  if (errs.length) {
    return { ok: false, error: errs.join('; '), status: 400 };
  }

  const phoneDigits = String(payload.phone).replace(/\D/g, '');
  const emailLower = payload.email ? String(payload.email).trim().toLowerCase() : null;
  const zip = String(payload.zip).trim();
  const state = zipToState(zip);

  // 2. DNC check
  if (await isOnDnc({ phone: phoneDigits, email: emailLower })) {
    // Persist as DNC for audit but do not route
    await sql`
      INSERT INTO parentcare_leads (
        who_needs_care, main_concern, location_now, level_help, urgency,
        payment, zip, state, name, phone, email,
        consent_text, consent_version, consent_ip, consent_ua, consent_url,
        score, tier, status, source, utm_source, utm_medium, utm_campaign, referer
      ) VALUES (
        ${payload.who_needs_care},
        ${normalizeMulti(payload.main_concern)},
        ${payload.location_now}, ${payload.level_help}, ${payload.urgency},
        ${payload.payment}, ${zip}, ${state},
        ${payload.name}, ${phoneDigits}, ${emailLower},
        ${CONSENT_TEXT}, ${CONSENT_VERSION}, ${ip || null}, ${userAgent || ''}, ${refererUrl || ''},
        0, 'low', 'dnc', 'quiz',
        ${payload.utm_source || ''}, ${payload.utm_medium || ''}, ${payload.utm_campaign || ''},
        ${payload.referer || ''}
      )
    `;
    return { ok: true, status: 'dnc', message: 'received' }; // never reveal DNC status to user
  }

  // 3. Dedup (last 24h)
  if (await isDuplicate({ phone: phoneDigits, email: emailLower })) {
    return { ok: true, status: 'duplicate', message: 'received' }; // user-facing: success, internal: skipped
  }

  // 4. Score + categorize
  const leadShape = {
    ...payload,
    phone: phoneDigits,
    email: emailLower,
    zip,
  };
  const { score, tier } = scoreLead(leadShape);
  const category = categorizeLead(leadShape);

  // 5. Persist lead
  const inserted = await sql`
    INSERT INTO parentcare_leads (
      who_needs_care, main_concern, location_now, level_help, urgency,
      payment, zip, state, name, phone, email,
      consent_text, consent_version, consent_ip, consent_ua, consent_url,
      score, tier, status, source, utm_source, utm_medium, utm_campaign, referer
    ) VALUES (
      ${payload.who_needs_care},
      ${normalizeMulti(payload.main_concern)},
      ${payload.location_now}, ${payload.level_help}, ${payload.urgency},
      ${payload.payment}, ${zip}, ${state},
      ${payload.name}, ${phoneDigits}, ${emailLower},
      ${CONSENT_TEXT}, ${CONSENT_VERSION}, ${ip || null}, ${userAgent || ''}, ${refererUrl || ''},
      ${score}, ${tier}, 'new', 'quiz',
      ${payload.utm_source || ''}, ${payload.utm_medium || ''}, ${payload.utm_campaign || ''},
      ${payload.referer || ''}
    )
    RETURNING id, ts
  `;
  const leadId = inserted[0].id;
  const ts = inserted[0].ts;

  const concernsArr = Array.isArray(payload.main_concern)
    ? payload.main_concern
    : String(payload.main_concern || '').split(',').filter(Boolean);
  const fullLead = {
    id: leadId,
    ts,
    score, tier,
    consent_ts: ts,
    consent_ip: ip,
    main_concern: concernsArr,
    who_needs_care: payload.who_needs_care,
    location_now: payload.location_now,
    level_help: payload.level_help,
    urgency: payload.urgency,
    payment: payload.payment,
    zip, state,
    name: payload.name,
    phone: phoneDigits,
    email: emailLower,
  };

  // 6. Match buyer
  let buyers = await findBuyers(fullLead, { category, max: 1 });

  // Fallback chain: if no buyer for primary category, try placement_advisor → home_care
  if (!buyers.length && category !== 'placement_advisor') {
    buyers = await findBuyers(fullLead, { category: 'placement_advisor', max: 1 });
  }
  if (!buyers.length && category !== 'home_care') {
    buyers = await findBuyers(fullLead, { category: 'home_care', max: 1 });
  }

  if (!buyers.length) {
    // Internal alert — no buyer match
    const alert = unmatchedLeadAlert({ lead: fullLead, alertEmail: process.env.ALERT_EMAIL_TO });
    if (alert) await sendEmail(alert);
    // Still send confirmation to the family — set expectation we'll follow up
    if (emailLower) {
      const conf = leadConfirmationEmail({ lead: fullLead });
      if (conf) await sendEmail(conf);
    }
    return { ok: true, status: 'unmatched', leadId };
  }

  const buyer = buyers[0];

  // 7. Log routing + send buyer email
  const routingId = await logRouting(leadId, buyer.id, {
    price: buyer.pilot && buyer.pilot_leads_remaining > 0 ? 0 : Number(buyer.price_per_lead || 0),
    notes: buyer.pilot && buyer.pilot_leads_remaining > 0 ? 'pilot-free' : '',
  });

  const buyerMail = buyerLeadEmail({ lead: fullLead, buyer, routingId });
  await sendEmail(buyerMail);

  // 8. Family confirmation
  if (emailLower) {
    const conf = leadConfirmationEmail({ lead: fullLead });
    if (conf) await sendEmail(conf);
  }

  await markLeadRouted(leadId);
  return { ok: true, status: 'routed', leadId, buyerId: buyer.id };
}

// Postgres TEXT columns store multi-select as comma-joined when needed for legacy reasons,
// but we store as JSON-friendly comma string. Keep the array intact for scoring.
function normalizeMulti(v) {
  if (Array.isArray(v)) return v.join(',');
  return String(v || '');
}
