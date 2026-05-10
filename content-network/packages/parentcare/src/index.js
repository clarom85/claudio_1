/**
 * ParentCare Finder — public exports.
 */

export * from './quiz-config.js';
export * from './scoring.js';
export * from './buyer-router.js';
export * from './email-templates.js';
export { renderQuizPageBody } from './quiz-builder.js';
export { renderParentCarePrivacy, renderParentCareTerms, LEGAL_META } from './legal.js';
export { sendEmail } from './mailer.js';
export { processSubmission } from './pipeline.js';
