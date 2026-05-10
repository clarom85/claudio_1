/**
 * ParentCare Finder — Quiz configuration.
 * Empathic, conversational, conditional. Designed for adult children
 * navigating senior-care decisions for an aging parent.
 *
 * Each step has:
 *   - id          : machine slug saved to DB
 *   - kind        : single | multi | text | tel | email | zip | consent
 *   - title       : main question (warm, conversational)
 *   - subtitle    : reassuring micro-copy
 *   - options     : for single/multi
 *   - showIf      : (answers) => bool — conditional branching
 *   - required    : default true
 *   - validate    : optional fn(value)=>errorString|null
 */

export const CONSENT_VERSION = 'v1.0-2026-05-10';

export const CONSENT_TEXT = `By clicking "See My Care Options" below, I confirm I am at least 18 years old and I expressly consent to be contacted by ParentCare Finder (operated by Vireon Media) and one matched local home care provider in my area, by phone call (including from automated dialing systems or prerecorded messages), text message, and/or email at the phone number and email address I provided, regarding senior care services for the person I described.

I understand that:
• My consent is not a condition of receiving any service or making any purchase.
• Standard message and data rates may apply.
• I can opt out at any time by replying STOP to text messages, clicking "unsubscribe" in any email, or asking the caller to remove me.
• I have read and agree to the Privacy Policy and Terms of Service.`;

export const QUIZ_STEPS = [
  // ────────────────────────────────────────────────────────────
  // 1. Who needs care
  {
    id: 'who_needs_care',
    kind: 'single',
    title: 'Who are you looking for care for?',
    subtitle: 'Tell us a little about who needs help.',
    icon: 'family',
    options: [
      { value: 'mother',      label: 'My mother' },
      { value: 'father',      label: 'My father' },
      { value: 'spouse',      label: 'My spouse' },
      { value: 'grandparent', label: 'My grandparent' },
      { value: 'self',        label: 'Myself' },
      { value: 'other',       label: 'Another loved one' },
    ],
  },

  // 2. Main concern (multi-select OK — many families face several at once)
  {
    id: 'main_concern',
    kind: 'multi',
    title: "What's bringing you here today?",
    subtitle: "Select everything that applies. There's no wrong answer.",
    icon: 'heart',
    options: [
      { value: 'lives_alone',       label: 'They live alone and I worry about safety' },
      { value: 'recent_fall',       label: 'They recently had a fall' },
      { value: 'memory_issues',     label: "I'm noticing memory or confusion changes" },
      { value: 'post_hospital',     label: 'Coming home after a hospital stay' },
      { value: 'daily_care',        label: 'Help with bathing, dressing, or daily care' },
      { value: 'medication',        label: 'Help managing medications' },
      { value: 'overnight',         label: 'Overnight supervision' },
      { value: 'caregiver_burnout', label: 'Family caregiver is burning out' },
      { value: 'unsure',            label: "I'm not sure yet — exploring options" },
    ],
  },

  // 3. Where are they now
  {
    id: 'location_now',
    kind: 'single',
    title: 'Where is your loved one right now?',
    subtitle: 'This helps us understand the timeline you may be working with.',
    icon: 'home',
    options: [
      { value: 'home',             label: 'At home' },
      { value: 'hospital',         label: 'In the hospital' },
      { value: 'rehab',            label: 'At a rehab facility' },
      { value: 'assisted_living',  label: 'In an assisted living community' },
      { value: 'nursing_home',     label: 'In a nursing home' },
      { value: 'other',            label: 'Somewhere else' },
    ],
  },

  // 4. Level of help — adapts based on memory_issues flag
  {
    id: 'level_help',
    kind: 'single',
    title: 'What level of support do you think they need?',
    subtitle: "Best guess is fine. We'll help you refine this with a local expert.",
    icon: 'support',
    options: [
      { value: 'few_hours',        label: 'A few hours a week' },
      { value: 'daily',            label: 'Daily help at home' },
      { value: 'overnight',        label: 'Overnight care' },
      { value: '24_7',             label: 'Around-the-clock (24/7)' },
      { value: 'assisted_living',  label: 'Move to assisted living' },
      { value: 'memory_care',      label: 'Specialized memory care' },
      { value: 'unsure',           label: 'Not sure yet' },
    ],
  },

  // 5. Urgency
  {
    id: 'urgency',
    kind: 'single',
    title: 'How soon do you need help?',
    subtitle: "Whatever the timeline, we'll meet you where you are.",
    icon: 'clock',
    options: [
      { value: 'immediate',  label: 'Right away — within the next few days' },
      { value: 'this_week',  label: 'This week' },
      { value: 'this_month', label: 'Within a month' },
      { value: 'planning',   label: 'Just planning ahead for the future' },
    ],
  },

  // 6. ZIP code
  {
    id: 'zip',
    kind: 'zip',
    title: "What's the ZIP code where care is needed?",
    subtitle: "We'll match you with providers serving that area.",
    icon: 'pin',
    placeholder: '12345',
    validate(v) {
      if (!v || !/^\d{5}$/.test(String(v).trim())) return 'Please enter a valid 5-digit US ZIP code.';
      return null;
    },
  },

  // 7. Payment situation
  {
    id: 'payment',
    kind: 'single',
    title: 'How do you expect to cover the cost of care?',
    subtitle: "It's okay if you're not sure yet — many families aren't.",
    icon: 'wallet',
    options: [
      { value: 'private_pay',    label: 'Private pay (out of pocket)' },
      { value: 'ltc_insurance',  label: 'Long-term care insurance' },
      { value: 'medicaid',       label: 'Medicaid' },
      { value: 'va',             label: 'Veterans benefits (VA)' },
      { value: 'unsure',         label: "I'm not sure yet" },
    ],
  },

  // 8. Contact + consent (combined final step)
  {
    id: 'contact',
    kind: 'contact',
    title: 'Where should we send your care options?',
    subtitle: "We'll match you with up to 1–3 trusted local providers. No spam, ever.",
    icon: 'inbox',
    fields: [
      { id: 'name',  type: 'text',  label: 'Your name',          placeholder: 'First and last',     required: true },
      { id: 'phone', type: 'tel',   label: 'Phone',              placeholder: '(813) 555-0100',    required: true },
      { id: 'email', type: 'email', label: 'Email (optional)',   placeholder: 'you@example.com',   required: false },
    ],
  },
];

// Mapping for human-readable answers (used in admin & emails)
export const LABELS = {
  who_needs_care: {
    mother: 'Mother', father: 'Father', spouse: 'Spouse',
    grandparent: 'Grandparent', self: 'Self', other: 'Other'
  },
  main_concern: {
    lives_alone: 'Lives alone',
    recent_fall: 'Recent fall',
    memory_issues: 'Memory issues',
    post_hospital: 'Post-hospital discharge',
    daily_care: 'Help with daily care',
    medication: 'Medication management',
    overnight: 'Overnight supervision',
    caregiver_burnout: 'Family caregiver burnout',
    unsure: 'Unsure / exploring',
  },
  location_now: {
    home: 'At home', hospital: 'Hospital', rehab: 'Rehab',
    assisted_living: 'Assisted living', nursing_home: 'Nursing home', other: 'Other'
  },
  level_help: {
    few_hours: 'A few hours/week',
    daily: 'Daily help',
    overnight: 'Overnight care',
    '24_7': '24/7 care',
    assisted_living: 'Move to assisted living',
    memory_care: 'Memory care',
    unsure: 'Unsure',
  },
  urgency: {
    immediate: 'Immediate (days)',
    this_week: 'This week',
    this_month: 'This month',
    planning: 'Planning ahead',
  },
  payment: {
    private_pay: 'Private pay',
    ltc_insurance: 'LTC insurance',
    medicaid: 'Medicaid',
    va: 'VA benefits',
    unsure: 'Unsure',
  },
};

export function labelFor(field, value) {
  if (Array.isArray(value)) return value.map(v => LABELS[field]?.[v] || v).join(', ');
  return LABELS[field]?.[value] || value || '—';
}
