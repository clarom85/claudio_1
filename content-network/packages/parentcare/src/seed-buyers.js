/**
 * Seed pilot buyers for the Tampa-St. Pete metro.
 * Idempotent — uses email as conflict key.
 *
 * Usage:
 *   node packages/parentcare/src/seed-buyers.js
 *
 * Replace the placeholder rows with real agencies as you onboard them.
 * Each buyer can later be activated/deactivated via SQL or admin UI.
 */

import 'dotenv/config';
import { sql } from '@content-network/db';

// Tampa-St. Pete ZIP codes (broad coverage for pilot — narrow per buyer later)
const TAMPA_ZIPS = [
  '33602','33603','33604','33605','33606','33607','33609','33610','33611',
  '33612','33613','33614','33615','33616','33617','33618','33619','33620',
  '33621','33624','33625','33626','33629','33634','33635','33637','33647',
  // St. Petersburg
  '33701','33702','33703','33704','33705','33706','33707','33708','33709',
  '33710','33711','33712','33713','33714','33715','33716',
  // Clearwater
  '33755','33756','33759','33760','33761','33762','33763','33764','33765',
  '33767','33770','33771','33772','33773','33774','33776','33777','33778',
];

const PILOT_BUYERS = [
  // ── Slot 1 — primary home care
  {
    name: 'Tampa Bay Home Care Co.',
    contact_name: 'TBD',
    email: 'ops+tampabay@vireonmedia.com',  // placeholder; replace before going live
    phone: '+18135550100',
    category: 'home_care',
    zip_codes: TAMPA_ZIPS,
    state: 'FL',
    metro: 'tampa-st-pete',
    price_per_lead: 50,
    exclusive: false,
    pilot: true,
    pilot_leads_remaining: 5,
    active: false,  // start inactive — turn on when buyer agreement signed
    notes: 'Placeholder. Replace email and set active=TRUE once pilot agreement is in place.',
  },
  // ── Slot 2 — backup home care
  {
    name: 'Sunshine Senior Care',
    contact_name: 'TBD',
    email: 'ops+sunshine@vireonmedia.com',
    phone: '+18135550101',
    category: 'home_care',
    zip_codes: TAMPA_ZIPS,
    state: 'FL',
    metro: 'tampa-st-pete',
    price_per_lead: 50,
    exclusive: false,
    pilot: true,
    pilot_leads_remaining: 5,
    active: false,
    notes: 'Placeholder #2.',
  },
  // ── Slot 3 — placement advisor (catch-all for unsure/high-need)
  {
    name: 'Bay Area Senior Placement',
    contact_name: 'TBD',
    email: 'ops+placement@vireonmedia.com',
    phone: '+18135550102',
    category: 'placement_advisor',
    zip_codes: TAMPA_ZIPS,
    state: 'FL',
    metro: 'tampa-st-pete',
    price_per_lead: 75,
    exclusive: false,
    pilot: true,
    pilot_leads_remaining: 5,
    active: false,
    notes: 'Catch-all placeholder. For families that need consultation before deciding.',
  },
];

async function run() {
  // Ensure unique on email
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS uniq_pc_buyers_email ON parentcare_buyers (lower(email))`;

  let inserted = 0, skipped = 0;
  for (const b of PILOT_BUYERS) {
    const existing = await sql`SELECT id FROM parentcare_buyers WHERE lower(email) = lower(${b.email})`;
    if (existing.length) { skipped++; continue; }
    await sql`
      INSERT INTO parentcare_buyers (
        name, contact_name, email, phone, category, zip_codes, state, metro,
        price_per_lead, exclusive, pilot, pilot_leads_remaining, active, notes
      ) VALUES (
        ${b.name}, ${b.contact_name}, ${b.email}, ${b.phone}, ${b.category},
        ${b.zip_codes}, ${b.state}, ${b.metro},
        ${b.price_per_lead}, ${b.exclusive}, ${b.pilot}, ${b.pilot_leads_remaining}, ${b.active},
        ${b.notes}
      )
    `;
    inserted++;
  }
  console.log(`Seeded buyers: ${inserted} inserted, ${skipped} already present.`);
  console.log(`\nIMPORTANT: All seeded buyers are inactive by default.`);
  console.log(`After signing an agreement, activate via:\n  UPDATE parentcare_buyers SET active=TRUE, email='real@agency.com', name='Real Name' WHERE id=<id>;\n`);
  process.exit(0);
}

run().catch(err => { console.error(err); process.exit(1); });
