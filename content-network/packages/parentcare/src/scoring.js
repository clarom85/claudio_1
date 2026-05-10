/**
 * ParentCare Finder — lead scoring.
 * Returns { score, tier } where tier is 'high'|'medium'|'low'.
 *
 * Score components (max 100):
 *   - urgency (0-30)
 *   - level_help intensity (0-25)
 *   - location_now (post-discharge bonus 0-15)
 *   - payment ability (0-15)
 *   - phone presence (0-10)
 *   - main_concern severity (0-5 cumulative, max 5)
 */

const URGENCY_PTS = { immediate: 30, this_week: 22, this_month: 12, planning: 3 };
const LEVEL_PTS = {
  '24_7': 25, memory_care: 24, assisted_living: 22,
  overnight: 18, daily: 16, few_hours: 8, unsure: 6,
};
const LOCATION_PTS = {
  hospital: 15, rehab: 12, home: 8,
  assisted_living: 4, nursing_home: 3, other: 4,
};
const PAYMENT_PTS = {
  private_pay: 15, ltc_insurance: 13, va: 11, medicaid: 6, unsure: 5,
};
const CONCERN_PTS = {
  post_hospital: 5, recent_fall: 4, memory_issues: 4,
  daily_care: 3, overnight: 3, lives_alone: 3,
  medication: 2, caregiver_burnout: 2, unsure: 0,
};

export function scoreLead(lead) {
  let score = 0;
  score += URGENCY_PTS[lead.urgency] || 0;
  score += LEVEL_PTS[lead.level_help] || 0;
  score += LOCATION_PTS[lead.location_now] || 0;
  score += PAYMENT_PTS[lead.payment] || 0;

  const concerns = Array.isArray(lead.main_concern) ? lead.main_concern : [lead.main_concern].filter(Boolean);
  let concernPts = 0;
  for (const c of concerns) concernPts += CONCERN_PTS[c] || 0;
  score += Math.min(concernPts, 5);

  if (lead.phone && String(lead.phone).replace(/\D/g, '').length >= 10) score += 10;

  // tier mapping
  let tier = 'low';
  if (score >= 65) tier = 'high';
  else if (score >= 40) tier = 'medium';

  return { score, tier };
}

/**
 * Determines lead category for buyer matching.
 *  - home_care: in-home help (most flexible)
 *  - assisted_living: move to ALF
 *  - memory_care: dementia/Alzheimer
 *  - placement_advisor: undecided high-need
 */
export function categorizeLead(lead) {
  if (lead.level_help === 'memory_care') return 'memory_care';
  if (lead.level_help === 'assisted_living') return 'assisted_living';
  const concerns = Array.isArray(lead.main_concern) ? lead.main_concern : [lead.main_concern].filter(Boolean);
  if (concerns.includes('memory_issues') && lead.level_help === '24_7') return 'memory_care';
  if (lead.level_help === 'unsure' && lead.urgency === 'immediate') return 'placement_advisor';
  return 'home_care';
}
