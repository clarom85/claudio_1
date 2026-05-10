/**
 * welcome-buyer.js — Activate a buyer + send welcome email.
 *
 * Usage:
 *   node packages/parentcare/src/welcome-buyer.js --buyer-id=1
 *   node packages/parentcare/src/welcome-buyer.js --buyer-id=1 --dry-run
 *   node packages/parentcare/src/welcome-buyer.js --buyer-id=1 --no-activate
 *
 * Default behavior: marks buyer as active=TRUE and sends the welcome
 * email. Use --no-activate if you want to send the email without
 * flipping active (e.g. re-sending the welcome to an existing buyer).
 */

import 'dotenv/config';
import { sql } from '@content-network/db';
import { buyerWelcomeEmail } from './email-templates.js';
import { sendEmail } from './mailer.js';

async function run() {
  const args = process.argv.slice(2);
  const buyerId = parseInt(args.find(a => a.startsWith('--buyer-id='))?.split('=')[1]
    || args[args.indexOf('--buyer-id') + 1]);
  const dryRun = args.includes('--dry-run');
  const noActivate = args.includes('--no-activate');

  if (!buyerId) {
    console.error('Usage: node welcome-buyer.js --buyer-id=<id> [--dry-run] [--no-activate]');
    process.exit(1);
  }

  const [buyer] = await sql`SELECT * FROM parentcare_buyers WHERE id = ${buyerId}`;
  if (!buyer) { console.error(`Buyer ${buyerId} not found`); process.exit(1); }

  if (!buyer.email) {
    console.error(`Buyer ${buyer.id} has no email — fill it in before activating.`);
    process.exit(1);
  }
  if (!buyer.auth_token) {
    console.error(`Buyer ${buyer.id} has no auth_token — re-run pc:seed to backfill.`);
    process.exit(1);
  }

  console.log(`\nWelcome flow for buyer #${buyer.id} — ${buyer.name}`);
  console.log(`  email:        ${buyer.email}`);
  console.log(`  contact:      ${buyer.contact_name || '—'}`);
  console.log(`  category:     ${buyer.category}`);
  console.log(`  metro:        ${buyer.metro || buyer.state}`);
  console.log(`  pilot:        ${buyer.pilot ? buyer.pilot_leads_remaining + ' free leads remaining' : 'no'}`);
  console.log(`  price/lead:   $${Number(buyer.price_per_lead).toFixed(0)}`);
  console.log(`  active now:   ${buyer.active}`);

  if (dryRun) {
    console.log(`\n[DRY RUN] would activate (=${!noActivate}) and send welcome to ${buyer.email}`);
    process.exit(0);
  }

  if (!noActivate && !buyer.active) {
    await sql`UPDATE parentcare_buyers SET active = TRUE WHERE id = ${buyerId}`;
    console.log(`\n✓ Buyer activated (active=TRUE)`);
  }

  const mail = buyerWelcomeEmail({ buyer });
  const result = await sendEmail(mail);
  if (!result.ok) {
    console.error(`\n✗ Email send failed: ${result.error || 'unknown'}`);
    process.exit(1);
  }
  console.log(`\n✓ Welcome email sent to ${buyer.email}`);
  console.log(`  Portal URL: https://medicarepriceguide.com/buyer-portal?token=${buyer.auth_token}`);
  process.exit(0);
}

run().catch(err => { console.error(err); process.exit(1); });
