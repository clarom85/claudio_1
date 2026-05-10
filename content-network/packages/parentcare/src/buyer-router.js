/**
 * ParentCare Finder — buyer matching by ZIP + category.
 *
 * Strategy:
 *  1. Find all active buyers covering the lead's ZIP for the given category
 *  2. Prefer pilots (free trial slots first), then by lowest current load
 *  3. Return up to N matches (default 1 — exclusive routing)
 */

import { sql } from '@content-network/db';

export async function findBuyers(lead, { category, max = 1 } = {}) {
  const zip = String(lead.zip || '').trim();
  if (!zip) return [];

  const rows = await sql`
    SELECT b.id, b.name, b.contact_name, b.email, b.phone,
           b.category, b.zip_codes, b.state, b.metro,
           b.price_per_lead, b.exclusive, b.pilot, b.pilot_leads_remaining,
           (SELECT COUNT(*)::int FROM parentcare_routing r
              WHERE r.buyer_id = b.id
                AND r.routed_at >= NOW() - INTERVAL '7 days') AS recent_load
    FROM parentcare_buyers b
    WHERE b.active = TRUE
      AND b.category = ${category}
      AND ${zip} = ANY(b.zip_codes)
    ORDER BY
      (b.pilot AND b.pilot_leads_remaining > 0) DESC,
      recent_load ASC,
      b.id ASC
    LIMIT ${max}
  `;
  return rows;
}

/**
 * Logs a routing event and decrements pilot allowance if applicable.
 * Returns the routing row ID.
 */
export async function logRouting(leadId, buyerId, { price = null, notes = '' } = {}) {
  const inserted = await sql`
    INSERT INTO parentcare_routing (lead_id, buyer_id, price_paid, buyer_response, notes)
    VALUES (${leadId}, ${buyerId}, ${price}, 'pending', ${notes})
    RETURNING id
  `;
  // Decrement pilot allowance if pilot
  await sql`
    UPDATE parentcare_buyers
    SET pilot_leads_remaining = GREATEST(pilot_leads_remaining - 1, 0)
    WHERE id = ${buyerId} AND pilot = TRUE AND pilot_leads_remaining > 0
  `;
  return inserted[0].id;
}

/**
 * Marks lead as 'routed' and updates status.
 */
export async function markLeadRouted(leadId) {
  await sql`UPDATE parentcare_leads SET status = 'routed' WHERE id = ${leadId} AND status = 'new'`;
}

/**
 * Fast DNC check — phone or email.
 */
export async function isOnDnc({ phone, email }) {
  if (!phone && !email) return false;
  const phoneDigits = phone ? String(phone).replace(/\D/g, '') : null;
  const emailLower = email ? String(email).trim().toLowerCase() : null;

  const rows = await sql`
    SELECT id FROM parentcare_dnc
    WHERE (${phoneDigits}::text IS NOT NULL AND phone = ${phoneDigits})
       OR (${emailLower}::text IS NOT NULL AND email = ${emailLower})
    LIMIT 1
  `;
  return rows.length > 0;
}

/**
 * Duplicate check — same phone or email submitted in last 24h.
 */
export async function isDuplicate({ phone, email }) {
  if (!phone && !email) return false;
  const phoneDigits = phone ? String(phone).replace(/\D/g, '') : null;
  const emailLower = email ? String(email).trim().toLowerCase() : null;
  const rows = await sql`
    SELECT id FROM parentcare_leads
    WHERE ts > NOW() - INTERVAL '24 hours'
      AND (
        (${phoneDigits}::text IS NOT NULL AND regexp_replace(coalesce(phone,''), '\\D', '', 'g') = ${phoneDigits})
        OR (${emailLower}::text IS NOT NULL AND lower(coalesce(email,'')) = ${emailLower})
      )
    LIMIT 1
  `;
  return rows.length > 0;
}
