/**
 * Quick CLI to print buyer outreach emails ready to copy/paste.
 *
 * Usage:
 *   node packages/parentcare/src/outreach-cli.js
 *   node packages/parentcare/src/outreach-cli.js --metro="Phoenix-Mesa"
 *   node packages/parentcare/src/outreach-cli.js --buyer="Visiting Angels Tampa" --contact="Sarah"
 */

import { buyerOutreachTemplate } from './email-templates.js';

const args = process.argv.slice(2);
function arg(name, fallback) {
  const found = args.find(a => a.startsWith(`--${name}=`));
  if (found) return found.split('=').slice(1).join('=');
  const idx = args.indexOf(`--${name}`);
  if (idx !== -1) return args[idx+1];
  return fallback;
}

const buyerName  = arg('buyer', 'your agency');
const contactName = arg('contact', 'there');
const metro       = arg('metro', 'Tampa-St. Pete');

const { subject, text } = buyerOutreachTemplate({ buyerName, contactName, metro });
console.log('\n──────── SUBJECT ────────');
console.log(subject);
console.log('\n──────── BODY ────────');
console.log(text);
console.log('──────── END ────────\n');
