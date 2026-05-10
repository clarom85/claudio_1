/**
 * ParentCare Finder — Legal copy.
 * TCPA/FTSA-aware. Vireon Media operator. Florida initial focus.
 *
 * Texts are returned as plain HTML (already escaped). Use as-is in
 * privacy + terms pages rendered through simplePageWrapper.
 */

import { CONSENT_VERSION, CONSENT_TEXT } from './quiz-config.js';

const BRAND = 'ParentCare Finder';
const OPERATOR = 'Vireon Media';
const HOST_DOMAIN = 'medicarepriceguide.com';
// Email aliases live on medicarepriceguide.com via Cloudflare Email Routing,
// all forwarded to vireonmediaadv@gmail.com. Vireon Media remains the
// operating-company brand name; the inbound email infra is consolidated
// on the consumer-facing domain.
const PRIVACY_EMAIL = `privacy@medicarepriceguide.com`;
const DNC_EMAIL = `dnc@medicarepriceguide.com`;
const LEGAL_EMAIL = `legal@medicarepriceguide.com`;
const ARB_EMAIL = `arbitration-optout@medicarepriceguide.com`;

function todayPretty() {
  return new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

export function renderInFormConsentBlock() {
  const text = CONSENT_TEXT.replace(/\n/g, '<br>');
  return `<div class="pc-consent-block">
    <label class="pc-consent-row">
      <input type="checkbox" id="pc-consent" name="consent" />
      <span class="pc-consent-text">${text}</span>
    </label>
    <input type="hidden" name="consent_version" value="${CONSENT_VERSION}" />
  </div>`;
}

export function renderParentCarePrivacy() {
  const today = todayPretty();
  const c = '#c4622d'; // echo terra
  return {
    title: 'ParentCare Finder — Privacy Policy',
    description: `Privacy Policy for the ParentCare Finder service. How we collect, use, and share information from families seeking senior care options.`,
    body: `<div style="max-width:780px;margin:48px auto;padding:0 20px;color:#1a1a1a;font-family:Lato,system-ui,sans-serif;line-height:1.75">
      <p style="font-size:13px;letter-spacing:2px;text-transform:uppercase;color:#7a6a5a;margin-bottom:8px">${BRAND}</p>
      <h1 style="font-family:'Cormorant Garamond',Georgia,serif;font-size:42px;font-weight:400;color:#3d2b1f;margin:0 0 8px">Privacy Policy</h1>
      <p style="color:#7a6a5a;font-size:13px;margin-bottom:36px">Last updated: ${today}</p>

      <div style="background:#faf6f1;border-left:3px solid ${c};padding:18px 22px;margin-bottom:36px;border-radius:2px">
        <p style="font-size:14px;margin:0;line-height:1.75"><strong>Quick summary.</strong> When you complete our care assessment, we share your contact details and care needs with one or more pre-screened local senior care providers so they can contact you about their services. We may receive compensation for connecting you. We do <strong>not</strong> sell your data to third-party data brokers. You can opt out at any time.</p>
      </div>

      <p style="font-size:16px;margin-bottom:20px">This Privacy Policy explains how ${OPERATOR} ("we", "us", "our"), operator of ${HOST_DOMAIN} and the ${BRAND} service (the "Service"), collects, uses, and shares information about you when you complete a care assessment or otherwise use the Service.</p>

      <h2 style="font-family:'Cormorant Garamond',Georgia,serif;font-size:28px;font-weight:400;color:#3d2b1f;margin:36px 0 14px;padding-bottom:8px;border-bottom:1px solid #d8ccc0">1. Information We Collect</h2>
      <p style="font-size:16px;margin-bottom:14px"><strong>Information you provide directly:</strong></p>
      <ul style="font-size:16px;padding-left:24px;margin-bottom:20px">
        <li style="margin-bottom:8px">Your name, phone number, email address, and ZIP code</li>
        <li style="margin-bottom:8px">Information about the person needing care: relationship to you, level of need, location, urgency, payment situation</li>
      </ul>
      <p style="font-size:16px;margin-bottom:14px"><strong>Information collected automatically:</strong></p>
      <ul style="font-size:16px;padding-left:24px;margin-bottom:20px">
        <li style="margin-bottom:8px">IP address, browser type, device identifiers, user agent</li>
        <li style="margin-bottom:8px">Pages visited, referring URL, time on page</li>
        <li style="margin-bottom:8px">Cookie and pixel data (Google Analytics)</li>
      </ul>
      <p style="font-size:16px;margin-bottom:20px"><strong>We do not collect</strong> Social Security numbers, financial account numbers, or protected health information (PHI) as defined under HIPAA. Please do not submit such information through our forms.</p>

      <h2 style="font-family:'Cormorant Garamond',Georgia,serif;font-size:28px;font-weight:400;color:#3d2b1f;margin:36px 0 14px;padding-bottom:8px;border-bottom:1px solid #d8ccc0">2. How We Use Your Information</h2>
      <ul style="font-size:16px;padding-left:24px;margin-bottom:20px">
        <li style="margin-bottom:8px">Match you with one or more local senior care providers in our network</li>
        <li style="margin-bottom:8px">Contact you by phone, text, or email about your inquiry</li>
        <li style="margin-bottom:8px">Send you educational content and care-related information (you can opt out anytime)</li>
        <li style="margin-bottom:8px">Improve our website and the quality of provider matches</li>
        <li style="margin-bottom:8px">Detect fraud and prevent abuse</li>
        <li style="margin-bottom:8px">Comply with legal obligations</li>
      </ul>

      <h2 style="font-family:'Cormorant Garamond',Georgia,serif;font-size:28px;font-weight:400;color:#3d2b1f;margin:36px 0 14px;padding-bottom:8px;border-bottom:1px solid #d8ccc0">3. How We Share Your Information</h2>
      <p style="font-size:16px;margin-bottom:14px"><strong>Matched provider partners.</strong> When you submit our care assessment, we share your contact information and the care needs you described with one or more pre-screened local senior care providers (such as home care agencies, assisted living communities, or care advisors) so they can contact you about their services. We may receive compensation when we connect you with a provider.</p>
      <p style="font-size:16px;margin-bottom:14px"><strong>Service providers.</strong> Email delivery, hosting, analytics, and similar vendors acting on our behalf under confidentiality agreements.</p>
      <p style="font-size:16px;margin-bottom:14px"><strong>Legal compliance.</strong> When required by law, subpoena, or to protect our rights, users, or the public.</p>
      <p style="font-size:16px;margin-bottom:20px"><strong>We do not sell</strong> your personal information to data brokers or to third parties for their independent marketing purposes.</p>

      <h2 style="font-family:'Cormorant Garamond',Georgia,serif;font-size:28px;font-weight:400;color:#3d2b1f;margin:36px 0 14px;padding-bottom:8px;border-bottom:1px solid #d8ccc0">4. Your Choices</h2>
      <ul style="font-size:16px;padding-left:24px;margin-bottom:20px">
        <li style="margin-bottom:8px"><strong>Opt out of texts:</strong> reply STOP to any message</li>
        <li style="margin-bottom:8px"><strong>Opt out of emails:</strong> click "unsubscribe" in any email</li>
        <li style="margin-bottom:8px"><strong>Opt out of calls:</strong> ask the caller to add you to their internal do-not-call list, or email <a href="mailto:${DNC_EMAIL}" style="color:${c}">${DNC_EMAIL}</a></li>
        <li style="margin-bottom:8px"><strong>Access, correct, or delete</strong> your data: email <a href="mailto:${PRIVACY_EMAIL}" style="color:${c}">${PRIVACY_EMAIL}</a></li>
      </ul>

      <h2 style="font-family:'Cormorant Garamond',Georgia,serif;font-size:28px;font-weight:400;color:#3d2b1f;margin:36px 0 14px;padding-bottom:8px;border-bottom:1px solid #d8ccc0">5. State Privacy Rights</h2>
      <p style="font-size:16px;margin-bottom:14px">If you are a resident of California, Colorado, Connecticut, Virginia, Utah, Texas, Oregon, or another state with consumer privacy laws, you have the right to know what personal information we have about you, request deletion, opt out of "sales" or "sharing" (we do not sell, but we share with providers as described above; you may opt out by emailing <a href="mailto:${PRIVACY_EMAIL}" style="color:${c}">${PRIVACY_EMAIL}</a>), and not be discriminated against for exercising these rights.</p>

      <h2 style="font-family:'Cormorant Garamond',Georgia,serif;font-size:28px;font-weight:400;color:#3d2b1f;margin:36px 0 14px;padding-bottom:8px;border-bottom:1px solid #d8ccc0">6. Data Retention</h2>
      <p style="font-size:16px;margin-bottom:20px">We retain your information for as long as necessary to provide the Service and comply with legal obligations, typically up to 5 years after your last interaction. Consent records (TCPA/FTSA audit trail) are retained for at least 4 years per applicable statutes of limitation.</p>

      <h2 style="font-family:'Cormorant Garamond',Georgia,serif;font-size:28px;font-weight:400;color:#3d2b1f;margin:36px 0 14px;padding-bottom:8px;border-bottom:1px solid #d8ccc0">7. Security</h2>
      <p style="font-size:16px;margin-bottom:20px">We use commercially reasonable safeguards including encryption in transit (HTTPS), access controls, and limited employee access. No system is 100% secure.</p>

      <h2 style="font-family:'Cormorant Garamond',Georgia,serif;font-size:28px;font-weight:400;color:#3d2b1f;margin:36px 0 14px;padding-bottom:8px;border-bottom:1px solid #d8ccc0">8. Children</h2>
      <p style="font-size:16px;margin-bottom:20px">The Service is not directed to children under 18. We do not knowingly collect information from children.</p>

      <h2 style="font-family:'Cormorant Garamond',Georgia,serif;font-size:28px;font-weight:400;color:#3d2b1f;margin:36px 0 14px;padding-bottom:8px;border-bottom:1px solid #d8ccc0">9. Changes</h2>
      <p style="font-size:16px;margin-bottom:20px">We may update this Policy. The "Last updated" date will reflect changes. Material changes will be communicated via email when feasible.</p>

      <h2 style="font-family:'Cormorant Garamond',Georgia,serif;font-size:28px;font-weight:400;color:#3d2b1f;margin:36px 0 14px;padding-bottom:8px;border-bottom:1px solid #d8ccc0">10. Contact</h2>
      <p style="font-size:16px;margin-bottom:8px">${OPERATOR}</p>
      <p style="font-size:16px;margin-bottom:8px">Privacy: <a href="mailto:${PRIVACY_EMAIL}" style="color:${c}">${PRIVACY_EMAIL}</a></p>
      <p style="font-size:16px;margin-bottom:32px">Do-not-call requests: <a href="mailto:${DNC_EMAIL}" style="color:${c}">${DNC_EMAIL}</a></p>

      <p style="font-size:14px;color:#7a6a5a;margin-top:40px">
        <a href="/find-care/" style="color:${c}">Care Assessment</a> &middot;
        <a href="/find-care/terms/" style="color:${c}">Terms of Service</a> &middot;
        <a href="/" style="color:${c}">Back to ${HOST_DOMAIN}</a>
      </p>
    </div>`
  };
}

export function renderParentCareTerms() {
  const today = todayPretty();
  const c = '#c4622d';
  return {
    title: 'ParentCare Finder — Terms of Service',
    description: `Terms of Service for the ParentCare Finder care assessment and provider matching service.`,
    body: `<div style="max-width:780px;margin:48px auto;padding:0 20px;color:#1a1a1a;font-family:Lato,system-ui,sans-serif;line-height:1.75">
      <p style="font-size:13px;letter-spacing:2px;text-transform:uppercase;color:#7a6a5a;margin-bottom:8px">${BRAND}</p>
      <h1 style="font-family:'Cormorant Garamond',Georgia,serif;font-size:42px;font-weight:400;color:#3d2b1f;margin:0 0 8px">Terms of Service</h1>
      <p style="color:#7a6a5a;font-size:13px;margin-bottom:36px">Last updated: ${today}</p>

      <p style="font-size:16px;margin-bottom:24px">By using ${HOST_DOMAIN}, the ${BRAND} service, or any related properties operated by ${OPERATOR} (the "Service"), you agree to these Terms.</p>

      <h2 style="font-family:'Cormorant Garamond',Georgia,serif;font-size:28px;font-weight:400;color:#3d2b1f;margin:36px 0 14px;padding-bottom:8px;border-bottom:1px solid #d8ccc0">1. Not Medical or Legal Advice</h2>
      <p style="font-size:16px;margin-bottom:20px">The Service provides general educational information about senior care options. Nothing on the Service is medical, legal, financial, or insurance advice. Always consult licensed professionals before making care decisions. We are not a healthcare provider, healthcare facility, medical referral service, or licensed senior placement agency.</p>

      <h2 style="font-family:'Cormorant Garamond',Georgia,serif;font-size:28px;font-weight:400;color:#3d2b1f;margin:36px 0 14px;padding-bottom:8px;border-bottom:1px solid #d8ccc0">2. Nature of the Service</h2>
      <p style="font-size:16px;margin-bottom:14px">The Service connects users with third-party senior care providers. We are <strong>not</strong> a party to any agreement between you and a provider. We do not employ, supervise, license, or endorse any provider. We do not guarantee provider quality, availability, pricing, licensing status, or outcomes.</p>
      <p style="font-size:16px;margin-bottom:20px">You are solely responsible for verifying any provider's credentials, licensing, references, insurance, and suitability before engaging them.</p>

      <h2 style="font-family:'Cormorant Garamond',Georgia,serif;font-size:28px;font-weight:400;color:#3d2b1f;margin:36px 0 14px;padding-bottom:8px;border-bottom:1px solid #d8ccc0">3. Compensation Disclosure</h2>
      <p style="font-size:16px;margin-bottom:20px">We may receive compensation from providers when we connect them with prospective clients. This does not increase your cost. Provider participation in our network does not imply endorsement, and the order in which providers are presented may be influenced by such arrangements.</p>

      <h2 style="font-family:'Cormorant Garamond',Georgia,serif;font-size:28px;font-weight:400;color:#3d2b1f;margin:36px 0 14px;padding-bottom:8px;border-bottom:1px solid #d8ccc0">4. Eligibility</h2>
      <p style="font-size:16px;margin-bottom:20px">You must be at least 18 years old. By using the Service, you represent that you have authority to share information about any third party (for example, your parent) for the purpose of seeking care for them.</p>

      <h2 style="font-family:'Cormorant Garamond',Georgia,serif;font-size:28px;font-weight:400;color:#3d2b1f;margin:36px 0 14px;padding-bottom:8px;border-bottom:1px solid #d8ccc0">5. Accuracy</h2>
      <p style="font-size:16px;margin-bottom:20px">You agree to provide accurate, current information. We may decline to process submissions that appear fraudulent, incomplete, or abusive.</p>

      <h2 style="font-family:'Cormorant Garamond',Georgia,serif;font-size:28px;font-weight:400;color:#3d2b1f;margin:36px 0 14px;padding-bottom:8px;border-bottom:1px solid #d8ccc0">6. Prohibited Uses</h2>
      <ul style="font-size:16px;padding-left:24px;margin-bottom:20px">
        <li style="margin-bottom:8px">Submitting information about another person without authority</li>
        <li style="margin-bottom:8px">Scraping, automating, or reverse-engineering the Service</li>
        <li style="margin-bottom:8px">Using the Service to send spam, phishing, or unlawful content</li>
        <li style="margin-bottom:8px">Reselling or redistributing Service content without written permission</li>
      </ul>

      <h2 style="font-family:'Cormorant Garamond',Georgia,serif;font-size:28px;font-weight:400;color:#3d2b1f;margin:36px 0 14px;padding-bottom:8px;border-bottom:1px solid #d8ccc0">7. Intellectual Property</h2>
      <p style="font-size:16px;margin-bottom:20px">All content on the Service is owned by ${OPERATOR} or its licensors and protected by copyright. You may view content for personal, non-commercial use.</p>

      <h2 style="font-family:'Cormorant Garamond',Georgia,serif;font-size:28px;font-weight:400;color:#3d2b1f;margin:36px 0 14px;padding-bottom:8px;border-bottom:1px solid #d8ccc0">8. Disclaimers</h2>
      <p style="font-size:14px;text-transform:uppercase;letter-spacing:.5px;margin-bottom:20px;color:#3d2b1f">THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING MERCHANTABILITY, FITNESS FOR A PURPOSE, AND NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED OR ERROR-FREE.</p>

      <h2 style="font-family:'Cormorant Garamond',Georgia,serif;font-size:28px;font-weight:400;color:#3d2b1f;margin:36px 0 14px;padding-bottom:8px;border-bottom:1px solid #d8ccc0">9. Limitation of Liability</h2>
      <p style="font-size:14px;text-transform:uppercase;letter-spacing:.5px;margin-bottom:20px;color:#3d2b1f">TO THE MAXIMUM EXTENT PERMITTED BY LAW, ${OPERATOR.toUpperCase()} SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, CONSEQUENTIAL, SPECIAL, OR PUNITIVE DAMAGES, OR LOSS OF PROFITS OR DATA. OUR AGGREGATE LIABILITY SHALL NOT EXCEED $100 USD.</p>

      <h2 style="font-family:'Cormorant Garamond',Georgia,serif;font-size:28px;font-weight:400;color:#3d2b1f;margin:36px 0 14px;padding-bottom:8px;border-bottom:1px solid #d8ccc0">10. Indemnification</h2>
      <p style="font-size:16px;margin-bottom:20px">You agree to indemnify and hold harmless ${OPERATOR} from claims arising out of your use of the Service, your submissions, or your breach of these Terms.</p>

      <h2 style="font-family:'Cormorant Garamond',Georgia,serif;font-size:28px;font-weight:400;color:#3d2b1f;margin:36px 0 14px;padding-bottom:8px;border-bottom:1px solid #d8ccc0">11. Arbitration and Class Waiver</h2>
      <p style="font-size:16px;margin-bottom:14px">Any dispute shall be resolved by binding individual arbitration under the rules of the American Arbitration Association in Wilmington, Delaware. <strong>YOU WAIVE THE RIGHT TO PARTICIPATE IN A CLASS ACTION OR CLASS ARBITRATION.</strong></p>
      <p style="font-size:16px;margin-bottom:20px">You may opt out of arbitration by emailing <a href="mailto:${ARB_EMAIL}" style="color:${c}">${ARB_EMAIL}</a> within 30 days of first using the Service.</p>

      <h2 style="font-family:'Cormorant Garamond',Georgia,serif;font-size:28px;font-weight:400;color:#3d2b1f;margin:36px 0 14px;padding-bottom:8px;border-bottom:1px solid #d8ccc0">12. Governing Law</h2>
      <p style="font-size:16px;margin-bottom:20px">These Terms are governed by the laws of the State of Delaware, without regard to conflict of laws.</p>

      <h2 style="font-family:'Cormorant Garamond',Georgia,serif;font-size:28px;font-weight:400;color:#3d2b1f;margin:36px 0 14px;padding-bottom:8px;border-bottom:1px solid #d8ccc0">13. Termination</h2>
      <p style="font-size:16px;margin-bottom:20px">We may suspend or terminate your access at any time without notice.</p>

      <h2 style="font-family:'Cormorant Garamond',Georgia,serif;font-size:28px;font-weight:400;color:#3d2b1f;margin:36px 0 14px;padding-bottom:8px;border-bottom:1px solid #d8ccc0">14. Changes</h2>
      <p style="font-size:16px;margin-bottom:20px">We may modify these Terms. Continued use after changes constitutes acceptance.</p>

      <h2 style="font-family:'Cormorant Garamond',Georgia,serif;font-size:28px;font-weight:400;color:#3d2b1f;margin:36px 0 14px;padding-bottom:8px;border-bottom:1px solid #d8ccc0">15. Contact</h2>
      <p style="font-size:16px;margin-bottom:32px">${OPERATOR} &middot; <a href="mailto:${LEGAL_EMAIL}" style="color:${c}">${LEGAL_EMAIL}</a></p>

      <p style="font-size:14px;color:#7a6a5a;margin-top:40px">
        <a href="/find-care/" style="color:${c}">Care Assessment</a> &middot;
        <a href="/find-care/privacy/" style="color:${c}">Privacy Policy</a> &middot;
        <a href="/" style="color:${c}">Back to ${HOST_DOMAIN}</a>
      </p>
    </div>`
  };
}

export const LEGAL_META = {
  BRAND, OPERATOR, HOST_DOMAIN,
  PRIVACY_EMAIL, DNC_EMAIL, LEGAL_EMAIL, ARB_EMAIL,
  CONSENT_VERSION, CONSENT_TEXT,
};
