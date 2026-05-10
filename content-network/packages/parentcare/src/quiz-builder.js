/**
 * ParentCare Finder — Premium quiz builder.
 * Renders the full /find-care/ landing + quiz as standalone HTML body.
 * Wrapped at the call site by simplePageWrapper or echo renderBase.
 *
 * Design language:
 *   - Cream backgrounds, terracotta accent, sage green secondary
 *   - Cormorant Garamond serif headings, Lato body
 *   - Soft shadows, rounded corners, generous spacing
 *   - Multi-step with horizontal slide transitions
 *   - Progress bar smooth fill
 *   - Mobile-first, accessible (aria-live, focus management)
 */

import { QUIZ_STEPS, CONSENT_VERSION, CONSENT_TEXT } from './quiz-config.js';

function esc(s = '') {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const ICONS = {
  family: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="7" r="3"/><circle cx="17" cy="7" r="3"/><path d="M3 21v-1a6 6 0 0 1 6-6h0a6 6 0 0 1 6 6v1"/><path d="M14 14a4 4 0 0 1 7 4v3"/></svg>`,
  heart:  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.6a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.07a5.5 5.5 0 0 0-7.78 7.78l1.06 1.07L12 21.23l7.78-7.78 1.06-1.07a5.5 5.5 0 0 0 0-7.78z"/></svg>`,
  home:   `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12l9-9 9 9"/><path d="M5 10v10h14V10"/></svg>`,
  support:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M9 9a3 3 0 1 1 4.5 2.6c-.9.5-1.5 1.2-1.5 2.4"/><circle cx="12" cy="17" r=".7" fill="currentColor"/></svg>`,
  clock:  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>`,
  pin:    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-7.5 8-13a8 8 0 1 0-16 0c0 5.5 8 13 8 13z"/><circle cx="12" cy="9" r="2.5"/></svg>`,
  wallet: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="6" width="18" height="14" rx="2"/><path d="M3 10h18"/><circle cx="17" cy="15" r="1.2" fill="currentColor"/></svg>`,
  inbox:  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5 4h14l3 8v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-6z"/></svg>`,
};

function renderStepHtml(step, idx, total) {
  const icon = ICONS[step.icon] || '';
  let inner = '';

  if (step.kind === 'single' || step.kind === 'multi') {
    const role = step.kind === 'single' ? 'radio' : 'checkbox';
    inner = `<div class="pc-options" role="${step.kind === 'single' ? 'radiogroup' : 'group'}" aria-labelledby="pc-q-${step.id}-title">
      ${step.options.map(opt => `
        <label class="pc-option" data-value="${esc(opt.value)}">
          <input type="${role === 'radio' ? 'radio' : 'checkbox'}" name="${esc(step.id)}" value="${esc(opt.value)}"/>
          <span class="pc-option-check"></span>
          <span class="pc-option-label">${esc(opt.label)}</span>
        </label>
      `).join('')}
    </div>`;
  } else if (step.kind === 'zip') {
    inner = `<div class="pc-input-wrap">
      <input class="pc-input pc-input-zip" name="${esc(step.id)}" type="text" inputmode="numeric" pattern="[0-9]*" maxlength="5" placeholder="${esc(step.placeholder || '12345')}" autocomplete="postal-code"/>
      <span class="pc-input-hint" aria-live="polite"></span>
    </div>`;
  } else if (step.kind === 'contact') {
    const fieldsHtml = step.fields.map(f => `
      <div class="pc-field">
        <label class="pc-field-label" for="pc-f-${esc(f.id)}">${esc(f.label)}${f.required ? '' : ' <em style="color:#7a6a5a;font-style:normal;font-size:12px">(optional)</em>'}</label>
        <input class="pc-input" id="pc-f-${esc(f.id)}" name="${esc(f.id)}" type="${esc(f.type)}" placeholder="${esc(f.placeholder || '')}" ${f.type === 'tel' ? 'autocomplete="tel" inputmode="tel"' : ''} ${f.type === 'email' ? 'autocomplete="email" inputmode="email"' : ''} ${f.required ? 'required' : ''}/>
      </div>`).join('');

    const consentHtml = `<div class="pc-consent">
      <label class="pc-consent-row">
        <input type="checkbox" id="pc-consent-cb" name="consent"/>
        <span class="pc-consent-box"></span>
        <span class="pc-consent-text">${esc(CONSENT_TEXT).replace(/\n/g, '<br>')}</span>
      </label>
      <input type="hidden" name="consent_version" value="${esc(CONSENT_VERSION)}"/>
    </div>`;

    inner = `<div class="pc-fields">${fieldsHtml}</div>${consentHtml}`;
  }

  return `<section class="pc-step" data-step="${idx}" data-id="${esc(step.id)}" data-kind="${esc(step.kind)}" aria-hidden="${idx === 0 ? 'false' : 'true'}">
    <div class="pc-step-icon">${icon}</div>
    <div class="pc-step-meta">Step ${idx + 1} of ${total}</div>
    <h2 id="pc-q-${esc(step.id)}-title" class="pc-step-title">${esc(step.title)}</h2>
    ${step.subtitle ? `<p class="pc-step-sub">${esc(step.subtitle)}</p>` : ''}
    <div class="pc-step-body">${inner}</div>
    <div class="pc-step-error" role="alert" aria-live="polite"></div>
  </section>`;
}

export function renderQuizPageBody({ siteName = 'medicarepriceguide.com', apiUrl = '/api/parentcare/submit' } = {}) {
  const stepsHtml = QUIZ_STEPS.map((s, i) => renderStepHtml(s, i, QUIZ_STEPS.length)).join('\n');
  const totalSteps = QUIZ_STEPS.length;

  return `<style>
${PARENTCARE_QUIZ_CSS}
</style>

<main class="pc-main">
  <!-- HERO -->
  <section class="pc-hero">
    <div class="pc-hero-inner">
      <p class="pc-eyebrow">For families navigating elder care</p>
      <h1 class="pc-h1">Worried about an aging parent?<br><span class="pc-h1-italic">You're not alone — and you don't have to figure this out alone.</span></h1>
      <p class="pc-hero-sub">Take our free 2-minute care assessment. We'll match you with trusted local options based on your loved one's needs, location, and budget — no pressure, no commitment.</p>
      <a href="#pc-quiz" class="pc-cta-primary" data-pc-start>Begin the assessment <span class="pc-arrow">→</span></a>
      <ul class="pc-trust-row">
        <li><span class="pc-tick">✓</span> Free and confidential</li>
        <li><span class="pc-tick">✓</span> Takes about 2 minutes</li>
        <li><span class="pc-tick">✓</span> No obligation, ever</li>
      </ul>
    </div>
    <div class="pc-hero-card" aria-hidden="true">
      <div class="pc-hero-card-quote">"Mom is coming home from the hospital and we don't know what to do."</div>
      <div class="pc-hero-card-cite">— Lisa, Tampa, FL</div>
      <div class="pc-hero-card-divider"></div>
      <div class="pc-hero-card-stats">
        <div><strong>70%</strong><span>of adults over 65 will need long-term care</span></div>
        <div><strong>$34/hr</strong><span>median in-home caregiver cost in 2026</span></div>
      </div>
    </div>
  </section>

  <!-- TRUST SECTION -->
  <section class="pc-trust">
    <div class="pc-trust-inner">
      <div class="pc-trust-col">
        <div class="pc-trust-icon">${ICONS.heart}</div>
        <h3>Empathic, not transactional</h3>
        <p>We start by listening. Our assessment is shaped around your situation — not a sales script.</p>
      </div>
      <div class="pc-trust-col">
        <div class="pc-trust-icon">${ICONS.support}</div>
        <h3>Local, vetted providers</h3>
        <p>We work with a small network of trusted local home care agencies, assisted living communities, and memory care specialists.</p>
      </div>
      <div class="pc-trust-col">
        <div class="pc-trust-icon">${ICONS.clock}</div>
        <h3>You're in control</h3>
        <p>Want to compare options first? Just need information? Tell us how you'd like to be contacted, and we'll respect that.</p>
      </div>
    </div>
  </section>

  <!-- QUIZ -->
  <section class="pc-quiz" id="pc-quiz" aria-labelledby="pc-quiz-heading">
    <div class="pc-quiz-shell">
      <div class="pc-progress" aria-hidden="true">
        <div class="pc-progress-fill" id="pc-progress-fill"></div>
      </div>
      <div class="pc-progress-meta" aria-live="polite">
        <span id="pc-progress-text">Step 1 of ${totalSteps}</span>
        <span id="pc-progress-pct">${Math.round(100 / totalSteps)}%</span>
      </div>

      <form id="pc-form" class="pc-form" novalidate>
        <h2 id="pc-quiz-heading" class="pc-sr-only">Care Assessment</h2>
        <div class="pc-steps-track" id="pc-steps-track">
${stepsHtml}
        </div>

        <div class="pc-nav">
          <button type="button" class="pc-back" id="pc-back" aria-label="Previous question">
            <span aria-hidden="true">←</span> Back
          </button>
          <button type="button" class="pc-next" id="pc-next">
            Continue <span aria-hidden="true">→</span>
          </button>
          <button type="submit" class="pc-submit" id="pc-submit" hidden>
            See My Care Options <span aria-hidden="true">→</span>
          </button>
        </div>
      </form>

      <!-- SUCCESS state -->
      <div class="pc-success" id="pc-success" hidden role="status" aria-live="polite">
        <div class="pc-success-icon">${ICONS.heart}</div>
        <h2>Thank you. We've received your assessment.</h2>
        <p>Based on what you shared, we're matching you with trusted local providers in your area. <strong>Expect a call or email within the next few hours</strong> from a senior care advisor — usually the same day.</p>
        <p class="pc-success-note">Want to learn more while you wait? Read our guides on <a href="/medicare-coverage/">what Medicare covers</a> and <a href="/in-home-care-costs/">what in-home care actually costs in your state</a>.</p>
      </div>

      <!-- ERROR state -->
      <div class="pc-error-box" id="pc-error-box" hidden role="alert">
        <p>We couldn't process your request. <a href="#" id="pc-retry">Please try again</a> or call us at <a href="tel:+18555555555">(855) 555-5555</a>.</p>
      </div>
    </div>
  </section>

  <!-- FOOTER NOTE -->
  <section class="pc-bottom-note">
    <div class="pc-bottom-inner">
      <p>${esc(siteName)} is operated by Vireon Media. ParentCare Finder is an information service that connects families with local senior care providers. We are not a healthcare provider, healthcare facility, or licensed senior placement agency. We may receive compensation when we connect you with a provider in our network.</p>
      <p><a href="/find-care/privacy/">Privacy Policy</a> &middot; <a href="/find-care/terms/">Terms of Service</a> &middot; <a href="mailto:dnc@vireonmedia.com">Do-not-call requests</a></p>
    </div>
  </section>
</main>

<script>
${PARENTCARE_QUIZ_JS.replace('__API_URL__', apiUrl).replace('__CONSENT_VERSION__', CONSENT_VERSION)}
</script>`;
}

// ─────────────────────────────────────────────────────────────────────
// CSS — premium echo-coherent, mobile-first
// ─────────────────────────────────────────────────────────────────────
const PARENTCARE_QUIZ_CSS = `
.pc-main *,.pc-main *::before,.pc-main *::after{box-sizing:border-box}
.pc-main{
  --pc-cream:#faf6f1;
  --pc-warm-cream:#f5ecdf;
  --pc-terra:#c4622d;
  --pc-terra-dark:#a8521f;
  --pc-sage:#5a7a5a;
  --pc-sage-light:#e8f0e2;
  --pc-warm:#3d2b1f;
  --pc-muted:#7a6a5a;
  --pc-border:#e6dccf;
  --pc-white:#fff;
  --pc-shadow-sm:0 1px 3px rgba(61,43,31,.06),0 1px 2px rgba(61,43,31,.04);
  --pc-shadow:0 4px 16px rgba(61,43,31,.08),0 2px 4px rgba(61,43,31,.04);
  --pc-shadow-lg:0 12px 40px rgba(61,43,31,.10),0 4px 12px rgba(61,43,31,.06);
  --pc-radius:14px;
  --pc-radius-sm:8px;
  --pc-ff-head:'Cormorant Garamond','Garamond',Georgia,serif;
  --pc-ff-body:'Lato',system-ui,-apple-system,sans-serif;
  --pc-ease:cubic-bezier(.4,.0,.2,1);
  background:var(--pc-cream);
  color:var(--pc-warm);
  font-family:var(--pc-ff-body);
  line-height:1.6;
  font-size:16px;
  margin:0;
  padding:0;
  overflow-x:hidden;
}
.pc-sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}

/* HERO */
.pc-hero{
  display:grid;
  grid-template-columns:1.4fr 1fr;
  gap:60px;
  max-width:1180px;
  margin:0 auto;
  padding:72px 32px 64px;
  align-items:center;
}
.pc-eyebrow{
  font-size:12px;
  letter-spacing:3px;
  text-transform:uppercase;
  color:var(--pc-terra);
  margin:0 0 18px;
  font-weight:700;
}
.pc-h1{
  font-family:var(--pc-ff-head);
  font-weight:400;
  font-size:clamp(34px,5.2vw,56px);
  line-height:1.08;
  color:var(--pc-warm);
  margin:0 0 22px;
  letter-spacing:-.5px;
}
.pc-h1-italic{font-style:italic;color:var(--pc-muted);font-size:.78em;font-weight:400;display:block;margin-top:10px}
.pc-hero-sub{
  font-size:18px;
  color:var(--pc-muted);
  line-height:1.7;
  margin:0 0 32px;
  max-width:580px;
}
.pc-cta-primary{
  display:inline-flex;
  align-items:center;
  gap:10px;
  background:var(--pc-terra);
  color:var(--pc-white);
  font-size:17px;
  font-weight:700;
  letter-spacing:.3px;
  padding:18px 32px;
  border-radius:var(--pc-radius);
  text-decoration:none;
  box-shadow:var(--pc-shadow);
  transition:transform .2s var(--pc-ease),box-shadow .2s var(--pc-ease),background .2s var(--pc-ease);
}
.pc-cta-primary:hover{background:var(--pc-terra-dark);transform:translateY(-1px);box-shadow:var(--pc-shadow-lg)}
.pc-cta-primary .pc-arrow{transition:transform .2s var(--pc-ease)}
.pc-cta-primary:hover .pc-arrow{transform:translateX(4px)}
.pc-trust-row{
  list-style:none;
  padding:0;
  margin:32px 0 0;
  display:flex;
  gap:28px;
  flex-wrap:wrap;
}
.pc-trust-row li{font-size:14px;color:var(--pc-muted);display:flex;align-items:center;gap:8px}
.pc-tick{
  display:inline-flex;
  align-items:center;
  justify-content:center;
  width:18px;height:18px;
  background:var(--pc-sage-light);
  color:var(--pc-sage);
  border-radius:50%;
  font-size:11px;
  font-weight:700;
}

.pc-hero-card{
  background:var(--pc-white);
  border:1px solid var(--pc-border);
  border-radius:var(--pc-radius);
  padding:36px 32px;
  box-shadow:var(--pc-shadow-lg);
  position:relative;
}
.pc-hero-card::before{
  content:'';position:absolute;top:-1px;left:-1px;right:-1px;height:5px;
  background:linear-gradient(90deg,var(--pc-terra) 0%,var(--pc-sage) 100%);
  border-radius:var(--pc-radius) var(--pc-radius) 0 0;
}
.pc-hero-card-quote{
  font-family:var(--pc-ff-head);
  font-style:italic;
  font-size:22px;
  line-height:1.45;
  color:var(--pc-warm);
  margin:0 0 14px;
}
.pc-hero-card-cite{font-size:13px;color:var(--pc-muted);letter-spacing:.5px;margin-bottom:24px}
.pc-hero-card-divider{height:1px;background:var(--pc-border);margin:0 0 24px}
.pc-hero-card-stats{display:grid;grid-template-columns:1fr 1fr;gap:18px}
.pc-hero-card-stats > div{display:flex;flex-direction:column}
.pc-hero-card-stats strong{font-family:var(--pc-ff-head);font-size:34px;font-weight:600;color:var(--pc-terra);line-height:1.1}
.pc-hero-card-stats span{font-size:12px;color:var(--pc-muted);line-height:1.5;margin-top:6px}

/* TRUST */
.pc-trust{background:var(--pc-warm-cream);padding:64px 32px;border-top:1px solid var(--pc-border);border-bottom:1px solid var(--pc-border)}
.pc-trust-inner{
  max-width:1100px;margin:0 auto;display:grid;
  grid-template-columns:repeat(3,1fr);gap:48px;
}
.pc-trust-col{text-align:left}
.pc-trust-icon{
  width:46px;height:46px;display:flex;align-items:center;justify-content:center;
  background:var(--pc-cream);border:1px solid var(--pc-border);border-radius:var(--pc-radius-sm);
  color:var(--pc-terra);margin-bottom:18px;
}
.pc-trust-icon svg{width:22px;height:22px}
.pc-trust-col h3{font-family:var(--pc-ff-head);font-weight:600;font-size:22px;color:var(--pc-warm);margin:0 0 10px}
.pc-trust-col p{font-size:15px;color:var(--pc-muted);line-height:1.7;margin:0}

/* QUIZ */
.pc-quiz{padding:80px 24px;background:linear-gradient(180deg,var(--pc-cream) 0%,var(--pc-warm-cream) 100%)}
.pc-quiz-shell{
  max-width:680px;margin:0 auto;background:var(--pc-white);
  border:1px solid var(--pc-border);border-radius:var(--pc-radius);
  box-shadow:var(--pc-shadow-lg);overflow:hidden;
}
.pc-progress{height:4px;background:var(--pc-border);position:relative}
.pc-progress-fill{
  height:100%;background:linear-gradient(90deg,var(--pc-terra),var(--pc-terra-dark));
  width:0%;transition:width .55s var(--pc-ease);
}
.pc-progress-meta{
  display:flex;justify-content:space-between;align-items:center;
  padding:16px 28px 0;font-size:12px;letter-spacing:1px;
  text-transform:uppercase;color:var(--pc-muted);font-weight:700;
}
.pc-form{padding:8px 0 28px}
.pc-steps-track{position:relative;min-height:420px;padding:32px 36px}
.pc-step{
  position:absolute;top:32px;left:36px;right:36px;
  opacity:0;transform:translateX(40px);
  pointer-events:none;
  transition:opacity .45s var(--pc-ease),transform .45s var(--pc-ease);
}
.pc-step.is-active{opacity:1;transform:translateX(0);pointer-events:auto;position:relative;top:0;left:0;right:0}
.pc-step.is-leaving-back{transform:translateX(-40px)}
.pc-step-icon{
  width:54px;height:54px;display:flex;align-items:center;justify-content:center;
  background:var(--pc-warm-cream);border:1px solid var(--pc-border);border-radius:50%;
  color:var(--pc-terra);margin-bottom:18px;
}
.pc-step-icon svg{width:24px;height:24px}
.pc-step-meta{font-size:11px;letter-spacing:2px;text-transform:uppercase;color:var(--pc-muted);font-weight:700;margin-bottom:8px}
.pc-step-title{font-family:var(--pc-ff-head);font-weight:500;font-size:clamp(24px,3.8vw,32px);line-height:1.18;color:var(--pc-warm);margin:0 0 10px;letter-spacing:-.2px}
.pc-step-sub{font-size:15px;color:var(--pc-muted);line-height:1.65;margin:0 0 26px;max-width:540px}
.pc-step-error{color:#a8521f;font-size:13px;font-weight:600;min-height:20px;margin-top:10px}

/* OPTIONS */
.pc-options{display:flex;flex-direction:column;gap:10px}
.pc-option{
  display:flex;align-items:center;gap:14px;
  padding:16px 18px;background:var(--pc-cream);
  border:1.5px solid var(--pc-border);border-radius:var(--pc-radius-sm);
  cursor:pointer;font-size:15.5px;color:var(--pc-warm);
  transition:border-color .2s var(--pc-ease),background .2s var(--pc-ease),transform .15s var(--pc-ease);
  user-select:none;
}
.pc-option:hover{border-color:var(--pc-terra);background:var(--pc-white)}
.pc-option input{position:absolute;opacity:0;pointer-events:none;width:0;height:0}
.pc-option-check{
  flex-shrink:0;width:22px;height:22px;border-radius:50%;
  border:2px solid var(--pc-border);background:var(--pc-white);
  display:flex;align-items:center;justify-content:center;
  transition:all .2s var(--pc-ease);position:relative;
}
.pc-option[data-kind="multi"] .pc-option-check{border-radius:5px}
.pc-option-check::after{
  content:'';width:10px;height:10px;border-radius:50%;
  background:var(--pc-terra);
  transform:scale(0);transition:transform .2s var(--pc-ease);
}
.pc-option.is-selected .pc-option-check::after{transform:scale(1)}
.pc-option.is-selected{
  border-color:var(--pc-terra);background:#fdf5ee;
  box-shadow:inset 0 0 0 1px var(--pc-terra);
}
.pc-option.is-selected .pc-option-check{border-color:var(--pc-terra)}
.pc-option-label{flex:1;line-height:1.45}

/* INPUTS */
.pc-input-wrap{position:relative}
.pc-input{
  width:100%;font-family:inherit;font-size:17px;
  padding:16px 18px;background:var(--pc-cream);
  border:1.5px solid var(--pc-border);border-radius:var(--pc-radius-sm);
  color:var(--pc-warm);transition:border-color .2s var(--pc-ease),background .2s var(--pc-ease);
  outline:none;
}
.pc-input:focus{border-color:var(--pc-terra);background:var(--pc-white);box-shadow:0 0 0 3px rgba(196,98,45,.1)}
.pc-input::placeholder{color:var(--pc-muted);opacity:.7}
.pc-input-zip{font-size:24px;letter-spacing:6px;text-align:center;font-weight:700;max-width:240px}
.pc-input-hint{display:block;font-size:13px;color:var(--pc-muted);margin-top:8px;min-height:18px}

.pc-fields{display:flex;flex-direction:column;gap:16px}
.pc-field{display:flex;flex-direction:column;gap:6px}
.pc-field-label{font-size:13px;font-weight:700;color:var(--pc-warm);letter-spacing:.3px}

/* CONSENT */
.pc-consent{margin-top:22px;padding:16px 18px;background:var(--pc-warm-cream);border:1px solid var(--pc-border);border-radius:var(--pc-radius-sm)}
.pc-consent-row{display:flex;gap:12px;cursor:pointer;align-items:flex-start}
.pc-consent-row input{position:absolute;opacity:0;pointer-events:none}
.pc-consent-box{
  flex-shrink:0;width:22px;height:22px;border:2px solid var(--pc-border);
  background:var(--pc-white);border-radius:5px;margin-top:2px;
  display:flex;align-items:center;justify-content:center;
  transition:all .2s var(--pc-ease);
}
.pc-consent-box::after{content:'✓';color:var(--pc-white);font-weight:700;font-size:14px;opacity:0;transition:opacity .15s}
.pc-consent-row.is-checked .pc-consent-box{background:var(--pc-sage);border-color:var(--pc-sage)}
.pc-consent-row.is-checked .pc-consent-box::after{opacity:1}
.pc-consent-text{font-size:12.5px;line-height:1.65;color:var(--pc-muted)}

/* NAV */
.pc-nav{display:flex;align-items:center;justify-content:space-between;padding:0 36px;margin-top:8px;gap:14px}
.pc-back{
  background:transparent;border:none;cursor:pointer;font-family:inherit;font-size:14px;
  color:var(--pc-muted);font-weight:600;padding:10px 4px;letter-spacing:.3px;
  display:inline-flex;align-items:center;gap:6px;
  transition:color .2s var(--pc-ease);
}
.pc-back:hover{color:var(--pc-terra)}
.pc-back[hidden]{display:none}
.pc-back:disabled{opacity:0;pointer-events:none}
.pc-next,.pc-submit{
  background:var(--pc-terra);color:var(--pc-white);border:none;cursor:pointer;
  font-family:inherit;font-size:16px;font-weight:700;letter-spacing:.3px;
  padding:14px 28px;border-radius:var(--pc-radius-sm);
  display:inline-flex;align-items:center;gap:8px;
  box-shadow:var(--pc-shadow-sm);
  transition:transform .15s var(--pc-ease),background .2s var(--pc-ease),box-shadow .2s var(--pc-ease);
}
.pc-next:hover,.pc-submit:hover{background:var(--pc-terra-dark);transform:translateY(-1px);box-shadow:var(--pc-shadow)}
.pc-next:disabled,.pc-submit:disabled{opacity:.45;cursor:not-allowed;transform:none}
.pc-submit{background:var(--pc-sage);font-size:17px;padding:16px 32px}
.pc-submit:hover{background:#456845}

/* SUCCESS */
.pc-success{padding:64px 36px;text-align:center}
.pc-success-icon{
  width:78px;height:78px;margin:0 auto 22px;display:flex;align-items:center;justify-content:center;
  background:var(--pc-sage-light);border-radius:50%;color:var(--pc-sage);
}
.pc-success-icon svg{width:36px;height:36px}
.pc-success h2{font-family:var(--pc-ff-head);font-weight:500;font-size:30px;color:var(--pc-warm);margin:0 0 14px;line-height:1.2}
.pc-success p{font-size:16px;color:var(--pc-muted);line-height:1.75;margin:0 auto 14px;max-width:520px}
.pc-success-note{font-size:14px;margin-top:24px}
.pc-success-note a{color:var(--pc-terra);font-weight:600}

.pc-error-box{padding:24px 36px;background:#fdf2ec;border-top:1px solid var(--pc-border);text-align:center}
.pc-error-box p{margin:0;color:var(--pc-warm);font-size:14px}
.pc-error-box a{color:var(--pc-terra);font-weight:700}

/* BOTTOM NOTE */
.pc-bottom-note{padding:48px 32px;background:var(--pc-warm);color:rgba(255,255,255,.7)}
.pc-bottom-inner{max-width:880px;margin:0 auto;text-align:center}
.pc-bottom-inner p{font-size:13px;line-height:1.75;margin:0 0 14px}
.pc-bottom-inner a{color:rgba(255,255,255,.9);text-decoration:underline}

/* MOBILE */
@media (max-width:860px){
  .pc-hero{grid-template-columns:1fr;gap:36px;padding:48px 24px}
  .pc-hero-card{order:-1}
  .pc-trust-inner{grid-template-columns:1fr;gap:32px}
  .pc-quiz{padding:48px 16px}
  .pc-steps-track{padding:24px 22px;min-height:440px}
  .pc-step{left:22px;right:22px;top:24px}
  .pc-nav{padding:0 22px}
  .pc-success{padding:48px 22px}
  .pc-success h2{font-size:24px}
}
@media (max-width:480px){
  .pc-hero{padding:32px 18px;gap:28px}
  .pc-hero-card{padding:24px 22px}
  .pc-hero-card-quote{font-size:19px}
  .pc-hero-card-stats strong{font-size:28px}
  .pc-trust{padding:40px 18px}
  .pc-quiz{padding:32px 12px}
  .pc-quiz-shell{border-radius:10px}
  .pc-step-title{font-size:22px}
  .pc-step-sub{font-size:14px;margin-bottom:18px}
  .pc-option{padding:13px 14px;font-size:14.5px;gap:12px}
  .pc-input{font-size:16px;padding:14px 16px}
  .pc-input-zip{font-size:22px;letter-spacing:4px}
  .pc-nav{flex-direction:row;padding:0 18px}
  .pc-next,.pc-submit{font-size:15px;padding:12px 22px}
  .pc-submit{font-size:15.5px;padding:14px 24px}
  .pc-cta-primary{font-size:15.5px;padding:15px 26px;width:100%;justify-content:center}
  .pc-trust-row{gap:14px}
  .pc-trust-row li{font-size:13px}
  .pc-h1-italic{font-size:.85em}
  .pc-bottom-note{padding:36px 18px}
  .pc-bottom-inner p{font-size:12.5px}
}
@media (prefers-reduced-motion:reduce){
  .pc-main *,.pc-main *::before,.pc-main *::after{animation-duration:.001s!important;transition-duration:.001s!important}
}
`;

// ─────────────────────────────────────────────────────────────────────
// JS — quiz controller (vanilla, ~6KB)
// ─────────────────────────────────────────────────────────────────────
const PARENTCARE_QUIZ_JS = `
(function(){
  'use strict';
  var API_URL = '__API_URL__';
  var CONSENT_VERSION = '__CONSENT_VERSION__';

  var form = document.getElementById('pc-form');
  var track = document.getElementById('pc-steps-track');
  var steps = Array.prototype.slice.call(track.querySelectorAll('.pc-step'));
  var total = steps.length;
  var idx = 0;
  var answers = {};

  var fill = document.getElementById('pc-progress-fill');
  var pmeta = document.getElementById('pc-progress-text');
  var pct = document.getElementById('pc-progress-pct');
  var btnBack = document.getElementById('pc-back');
  var btnNext = document.getElementById('pc-next');
  var btnSubmit = document.getElementById('pc-submit');
  var success = document.getElementById('pc-success');
  var errorBox = document.getElementById('pc-error-box');

  // Smooth-scroll into the quiz when the hero CTA is clicked
  document.querySelectorAll('[data-pc-start]').forEach(function(b){
    b.addEventListener('click', function(){ setTimeout(focusActiveStep, 600); });
  });

  // OPTION click → toggle selection
  steps.forEach(function(step){
    var kind = step.dataset.kind;
    if (kind === 'single' || kind === 'multi'){
      step.querySelectorAll('.pc-option').forEach(function(opt){
        opt.dataset.kind = kind;
        opt.addEventListener('click', function(e){
          e.preventDefault();
          if (kind === 'single'){
            step.querySelectorAll('.pc-option').forEach(function(o){o.classList.remove('is-selected'); o.querySelector('input').checked=false});
            opt.classList.add('is-selected');
            opt.querySelector('input').checked = true;
            // Auto-advance for single-select
            setTimeout(next, 280);
          } else {
            opt.classList.toggle('is-selected');
            opt.querySelector('input').checked = opt.classList.contains('is-selected');
          }
          clearError(step);
        });
        // keyboard
        opt.tabIndex = 0;
        opt.addEventListener('keydown', function(e){
          if (e.key === 'Enter' || e.key === ' '){ e.preventDefault(); opt.click(); }
        });
      });
    }
    if (kind === 'zip'){
      var zip = step.querySelector('.pc-input-zip');
      zip.addEventListener('input', function(){
        zip.value = zip.value.replace(/\\D/g,'').slice(0,5);
        clearError(step);
      });
      zip.addEventListener('keydown', function(e){
        if (e.key === 'Enter'){ e.preventDefault(); next(); }
      });
    }
    if (kind === 'contact'){
      var consentRow = step.querySelector('.pc-consent-row');
      var consentInput = step.querySelector('#pc-consent-cb');
      consentRow.addEventListener('click', function(e){
        if (e.target.tagName === 'A') return; // allow link clicks
        if (e.target !== consentInput){
          consentInput.checked = !consentInput.checked;
        }
        consentRow.classList.toggle('is-checked', consentInput.checked);
        clearError(step);
      });
      step.querySelectorAll('.pc-input').forEach(function(inp){
        inp.addEventListener('input', function(){ clearError(step); });
      });
    }
  });

  btnNext.addEventListener('click', next);
  btnBack.addEventListener('click', back);
  form.addEventListener('submit', submit);
  document.getElementById('pc-retry')?.addEventListener('click', function(e){
    e.preventDefault(); errorBox.hidden = true; form.style.display = '';
  });

  function focusActiveStep(){
    var s = steps[idx];
    var first = s.querySelector('input,button,.pc-option');
    if (first) try { first.focus({preventScroll:true}); } catch(_){}
  }

  function showError(step, msg){
    var box = step.querySelector('.pc-step-error');
    if (box) box.textContent = msg;
  }
  function clearError(step){
    var box = step.querySelector('.pc-step-error');
    if (box) box.textContent = '';
  }

  function validate(step){
    var kind = step.dataset.kind;
    if (kind === 'single'){
      var sel = step.querySelector('input:checked');
      if (!sel) { showError(step, 'Please choose one option.'); return null; }
      return sel.value;
    }
    if (kind === 'multi'){
      var sels = step.querySelectorAll('input:checked');
      if (!sels.length) { showError(step, 'Please choose at least one option.'); return null; }
      return Array.prototype.map.call(sels, function(i){return i.value});
    }
    if (kind === 'zip'){
      var v = (step.querySelector('.pc-input-zip').value||'').trim();
      if (!/^\\d{5}$/.test(v)) { showError(step, 'Please enter a valid 5-digit US ZIP code.'); return null; }
      return v;
    }
    if (kind === 'contact'){
      var name = step.querySelector('#pc-f-name').value.trim();
      var phone = step.querySelector('#pc-f-phone').value.trim();
      var email = step.querySelector('#pc-f-email').value.trim();
      var consent = step.querySelector('#pc-consent-cb').checked;
      if (!name || name.length < 2){ showError(step, 'Please share your name.'); return null; }
      var digits = phone.replace(/\\D/g,'');
      if (digits.length < 10){ showError(step, 'Please enter a valid phone number (at least 10 digits).'); return null; }
      if (email && !/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email)){
        showError(step, 'Please enter a valid email address (or leave it blank).'); return null;
      }
      if (!consent){ showError(step, 'Please review and accept the consent statement to continue.'); return null; }
      return { name:name, phone:digits, email:email };
    }
  }

  function setIdx(newIdx, dir){
    if (newIdx === idx) return;
    var current = steps[idx];
    current.classList.remove('is-active');
    current.classList.toggle('is-leaving-back', dir === 'back');
    current.setAttribute('aria-hidden','true');

    idx = newIdx;
    var nextStep = steps[idx];
    nextStep.classList.remove('is-leaving-back');
    nextStep.setAttribute('aria-hidden','false');
    // small async delay so transition runs cleanly
    requestAnimationFrame(function(){
      // hide all non-active
      steps.forEach(function(s,i){ if (i !== idx) s.classList.remove('is-active'); });
      nextStep.classList.add('is-active');
      updateProgress();
      updateNav();
      setTimeout(focusActiveStep, 100);
    });
  }

  function updateProgress(){
    var p = Math.round(((idx+1)/total) * 100);
    fill.style.width = p + '%';
    pmeta.textContent = 'Step ' + (idx+1) + ' of ' + total;
    pct.textContent = p + '%';
  }
  function updateNav(){
    btnBack.hidden = idx === 0;
    var isLast = idx === total - 1;
    btnNext.hidden = isLast;
    btnSubmit.hidden = !isLast;
  }

  function next(){
    var step = steps[idx];
    var v = validate(step);
    if (v === null || v === undefined) return;
    answers[step.dataset.id] = v;
    if (idx < total - 1) setIdx(idx + 1, 'forward');
  }
  function back(){
    if (idx > 0) setIdx(idx - 1, 'back');
  }

  async function submit(e){
    e.preventDefault();
    var step = steps[idx];
    var v = validate(step);
    if (v === null || v === undefined) return;
    answers[step.dataset.id] = v;

    btnSubmit.disabled = true;
    btnSubmit.innerHTML = 'Sending…';

    var contact = answers.contact || {};
    var payload = {
      who_needs_care: answers.who_needs_care,
      main_concern: answers.main_concern,
      location_now: answers.location_now,
      level_help: answers.level_help,
      urgency: answers.urgency,
      zip: answers.zip,
      payment: answers.payment,
      name: contact.name,
      phone: contact.phone,
      email: contact.email,
      consent_version: CONSENT_VERSION,
      utm_source: getQS('utm_source'),
      utm_medium: getQS('utm_medium'),
      utm_campaign: getQS('utm_campaign'),
      referer: document.referrer || ''
    };

    try {
      var resp = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      var data = await resp.json().catch(function(){ return {ok:false}; });
      if (!resp.ok || !data.ok){
        throw new Error(data.error || 'Server error');
      }
      // Track GA4 conversion if available
      try {
        if (window.gtag) window.gtag('event','generate_lead',{ value: 50, currency: 'USD' });
      } catch(_){}
      form.style.display = 'none';
      btnBack.hidden = btnNext.hidden = btnSubmit.hidden = true;
      success.hidden = false;
      success.scrollIntoView({behavior:'smooth', block:'start'});
    } catch(err){
      btnSubmit.disabled = false;
      btnSubmit.innerHTML = 'See My Care Options →';
      errorBox.hidden = false;
      console.error('[parentcare] submit failed:', err);
    }
  }

  function getQS(k){
    try {
      return new URLSearchParams(window.location.search).get(k) || '';
    } catch(_){ return ''; }
  }

  // init
  steps[0].classList.add('is-active');
  updateProgress();
  updateNav();
})();
`;

export const PARENTCARE_CSS = PARENTCARE_QUIZ_CSS;
