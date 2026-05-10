/**
 * ParentCare Finder — aggregator fallback layer.
 *
 * Activated when:
 *   1. No local buyer matches the lead's ZIP + category
 *   2. PARENTCARE_AGGREGATOR_ENABLED=true is set in env
 *   3. At least one provider is configured (env vars below)
 *
 * Currently SHIPPED AS A STUB — every adapter logs the call and returns
 * { ok:false, reason:'not_configured' } unless a real implementation
 * is plugged in. Activate one provider at a time as accounts get
 * approved during Phase 1 (~Month 3).
 *
 * ──────────────────────────────────────────────────────────────────────
 * Available providers, priority order, and how to onboard
 * ──────────────────────────────────────────────────────────────────────
 *
 *  ┌──────────────┬──────────────────────────────────────────────────┐
 *  │ Provider     │ How to apply                                     │
 *  ├──────────────┼──────────────────────────────────────────────────┤
 *  │ caring       │ Email partnersuccess@caring.com                  │
 *  │              │ Phone: (888) 808-0453                            │
 *  │              │ Their public partner program is for PROVIDERS    │
 *  │              │ (buyers). Reach out and ASK explicitly for       │
 *  │              │ publisher / lead-source partnership. Mention:    │
 *  │              │ "I run a TCPA-clean lead funnel sending          │
 *  │              │  qualified inquiries from adult children seeking │
 *  │              │  senior care for an aging parent."               │
 *  │              │ They sometimes accept high-quality publishers.   │
 *  │              │ Pricing target: $80-120 per call ≥90 sec.        │
 *  ├──────────────┼──────────────────────────────────────────────────┤
 *  │ apfm         │ A Place for Mom — affiliate-only via Awin or     │
 *  │              │ Sovrn (formerly VigLink).                        │
 *  │              │ Awin: https://ui.awin.com/merchant-profile/112362│
 *  │              │ Sovrn: https://commerce.sovrn.com/merchants/2378 │
 *  │              │ Note: cookie-based affiliate, NOT a lead API.    │
 *  │              │ Realistic to integrate as a CTA banner / link in │
 *  │              │ the success page rather than as a programmatic   │
 *  │              │ fallback. Pays $30/lead, 15-day tracking gap.    │
 *  ├──────────────┼──────────────────────────────────────────────────┤
 *  │ px           │ PX.com — programmatic ping/post marketplace.     │
 *  │              │ Apply: call (949) 313-7099                       │
 *  │              │ Docs: api.px.com/v2/verticals/                   │
 *  │              │ Ping/post guide: support.px.com (search          │
 *  │              │ "Ping post instructions")                        │
 *  │              │ Requires: 30+ leads/day, 14-day test campaign,   │
 *  │              │ TCPA attestation, signed contract.               │
 *  │              │ Senior-care vertical is NOT advertised on the    │
 *  │              │ public site — confirm during onboarding call.    │
 *  │              │ Best $/lead but highest barrier. ~Month 4-6.     │
 *  ├──────────────┼──────────────────────────────────────────────────┤
 *  │ mediaalpha   │ MediaAlpha — primarily insurance + health.       │
 *  │              │ Apply via mediaalpha.com/contact                 │
 *  │              │ Senior care match weaker than PX/Caring.         │
 *  │              │ Last resort, mention only if first 3 don't open. │
 *  └──────────────┴──────────────────────────────────────────────────┘
 *
 * ──────────────────────────────────────────────────────────────────────
 * Env vars (all optional — leave unset to disable a provider)
 * ──────────────────────────────────────────────────────────────────────
 *   PARENTCARE_AGGREGATOR_ENABLED=true       # master switch
 *   PARENTCARE_AGGREGATOR_PRIORITY=caring,px # comma-separated waterfall
 *
 *   PX_PUBLISHER_ID=<id>
 *   PX_API_KEY=<key>
 *   PX_VERTICAL=senior-care                  # confirm with PX during onboarding
 *
 *   CARING_PARTNER_ID=<id>
 *   CARING_API_KEY=<key>
 *
 *   MEDIAALPHA_PARTNER_ID=<id>
 *   MEDIAALPHA_API_KEY=<key>
 *
 * APFM is intentionally not in the programmatic fallback — handle it as
 * a static affiliate link in the success page for unmatched leads (or a
 * content placement). See success-page rendering in quiz-builder.js.
 */

const STUB_RESPONSE = (provider, reason = 'not_configured') => ({
  ok: false,
  provider,
  reason,
  payout: 0,
});

// ──────────────────────────────────────────────────────────────────────
// PX.com — ping/post marketplace
// ──────────────────────────────────────────────────────────────────────
async function submitToPx(lead) {
  const id = process.env.PX_PUBLISHER_ID;
  const key = process.env.PX_API_KEY;
  const vertical = process.env.PX_VERTICAL || 'senior-care';
  if (!id || !key) return STUB_RESPONSE('px');

  // STUB — wire this up after onboarding call:
  //
  // 1. PING request: send minimal lead info (no contact details)
  //    POST https://api.px.com/v2/verticals/{vertical}/ping
  //    body: { zip, ip, ...vertical-specific fields }
  //    Response: { transaction_id, bid_amount } or { no_bid: true }
  //
  // 2. If bid acceptable, POST request with full contact data
  //    POST https://api.px.com/v2/verticals/{vertical}/post
  //    body: { transaction_id, name, phone, email, consent_text, ... }
  //    Response: { sold: true, payout, transaction_id }
  //
  // Implement when account is live.
  console.log(`[aggregator/px] STUB call for lead ${lead.id} — implement after onboarding`);
  return STUB_RESPONSE('px', 'stub');
}

// ──────────────────────────────────────────────────────────────────────
// Caring.com — direct API (terms TBD during onboarding)
// ──────────────────────────────────────────────────────────────────────
async function submitToCaring(lead) {
  const id = process.env.CARING_PARTNER_ID;
  const key = process.env.CARING_API_KEY;
  if (!id || !key) return STUB_RESPONSE('caring');

  // STUB — Caring.com publisher API contract is not public.
  // After onboarding via partnersuccess@caring.com, document the
  // exact endpoint, auth, and payload here.
  //
  // Likely shape (typical for senior-care referral aggregators):
  //   POST https://partners.caring.com/api/leads
  //   Authorization: Bearer ${key}
  //   body: { partner_id, lead: { zip, name, phone, email,
  //          care_type, urgency, consent_text, consent_ts } }
  console.log(`[aggregator/caring] STUB call for lead ${lead.id} — implement after onboarding`);
  return STUB_RESPONSE('caring', 'stub');
}

// ──────────────────────────────────────────────────────────────────────
// MediaAlpha — health/senior fallback (lowest priority)
// ──────────────────────────────────────────────────────────────────────
async function submitToMediaAlpha(lead) {
  const id = process.env.MEDIAALPHA_PARTNER_ID;
  const key = process.env.MEDIAALPHA_API_KEY;
  if (!id || !key) return STUB_RESPONSE('mediaalpha');

  console.log(`[aggregator/mediaalpha] STUB call for lead ${lead.id} — implement after onboarding`);
  return STUB_RESPONSE('mediaalpha', 'stub');
}

const PROVIDERS = {
  px: submitToPx,
  caring: submitToCaring,
  mediaalpha: submitToMediaAlpha,
};

/**
 * Try each configured aggregator in priority order until one accepts
 * the lead. Returns the first successful sale, or { ok:false } if all
 * providers passed.
 *
 * Strict respect for the master switch: when
 * PARENTCARE_AGGREGATOR_ENABLED is unset or false, this function
 * returns immediately without touching any provider. Safe to call
 * unconditionally from the pipeline.
 */
export async function tryAggregatorFallback(lead) {
  if (process.env.PARENTCARE_AGGREGATOR_ENABLED !== 'true') {
    return { ok: false, reason: 'disabled' };
  }
  const priorityList = (process.env.PARENTCARE_AGGREGATOR_PRIORITY || 'caring,px,mediaalpha')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);

  const attempts = [];
  for (const name of priorityList) {
    const fn = PROVIDERS[name];
    if (!fn) {
      attempts.push({ provider: name, ok: false, reason: 'unknown_provider' });
      continue;
    }
    try {
      const res = await fn(lead);
      attempts.push(res);
      if (res.ok) return { ok: true, provider: name, payout: res.payout, attempts };
    } catch (err) {
      attempts.push({ provider: name, ok: false, reason: 'exception', error: err.message });
    }
  }
  return { ok: false, reason: 'all_passed', attempts };
}

export const AGGREGATOR_PROVIDERS = Object.keys(PROVIDERS);
