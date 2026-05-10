/**
 * One-off script to INSERT the ParentCare pillar article into medicarepriceguide.com.
 *
 * Pillar: "What to Do When Your Parent Comes Home From the Hospital"
 * Drives traffic to /find-care/ from a long-tail post-discharge query
 * (low competition, high intent — primary funnel inlet).
 *
 * Run on VPS:
 *   node packages/parentcare/src/insert-pillar-article.mjs
 *   node packages/vps/src/rerender-articles.js --site-id 11
 */

import 'dotenv/config';
import { sql } from '@content-network/db';

const SITE_ID = 11;
const NICHE_SLUG = 'senior-care-medicare';
const SLUG = 'what-to-do-when-parent-comes-home-from-hospital';
const TITLE = 'What to Do When Your Parent Comes Home From the Hospital: A Step-by-Step Caregiver Guide';
const META = "Your parent is coming home from the hospital. Here's exactly what to do in the first 72 hours, the first week, and the first month — including what Medicare covers and when in-home care is worth it.";

const TODAY = new Date().toISOString().slice(0, 10);
const PUB_DATE = new Date().toISOString();

// ─────────────────────────────────────────────────────────────────────
// Article content — structured HTML matching the echo template classes.
// ~2400 words. Intro, 9 sections, FAQ, conclusion, CTA.
// ─────────────────────────────────────────────────────────────────────
const CONTENT = `
<p class="intro">Your parent has just been discharged from the hospital — and somehow, between the conversation with the social worker and the moment you walk back through the front door together, the responsibility for their recovery has quietly become yours. This is one of the most stressful weeks a family caregiver ever lives through. It is also the week where most of the avoidable mistakes happen. This guide walks you through exactly what to do, in order, so you can keep your parent safe at home and avoid the readmission that nearly one in four older adults faces within thirty days of discharge.</p>

<section class="art-section">
<h2>Before the discharge: questions you must ask the hospital</h2>
<p>The single most useful conversation in the entire recovery happens before your parent ever leaves the hospital. You need a discharge planner — usually a social worker, case manager, or nurse — to walk you through five specific things. Do not accept "we'll send everything in the paperwork." The paperwork is rarely enough.</p>
<ul class="art-list">
<li><strong>The full discharge diagnosis and prognosis.</strong> Ask for it in writing, in plain English. "What is my parent recovering from? What is the realistic timeline? What does 'better' look like at one week, one month, three months?"</li>
<li><strong>Every medication, with reason.</strong> A typical post-hospital senior comes home on 8 to 12 medications, often including new ones added during admission and old ones that should now be stopped. Get the reconciliation list, double-check it against what is currently in the medicine cabinet, and ask the pharmacist to flag anything that interacts.</li>
<li><strong>Red-flag symptoms.</strong> What signs mean "call the doctor today" versus "go straight to the ER"? Write the answers down. Tape them to the fridge. You will not remember them under stress.</li>
<li><strong>What follow-up appointments are already scheduled.</strong> Confirm dates, addresses, and whether transportation is needed. If a primary care visit is not on the books within seven days, request one before you leave.</li>
<li><strong>What in-home services Medicare has approved.</strong> If your parent qualifies for skilled home health (nursing, physical therapy, occupational therapy), Medicare typically covers it 100 percent for a defined period. The hospital can make the referral on your behalf — but only if you ask.</li>
</ul>
<p>If the hospital cannot answer any of these clearly, you have a right to delay discharge. Use it. A discharge that goes badly costs your parent far more than an extra day in the hospital.</p>
</section>

<section class="art-section">
<h2>The first 24 hours at home: stabilize, don't optimize</h2>
<p>The first day is not the day to rearrange the bedroom or set up a long-term care system. It is the day to keep your parent safe, hydrated, medicated, and rested. Aim for boring. Boring is the goal.</p>
<p>Three priorities, in order:</p>
<ol class="art-list">
<li><strong>Medications on time.</strong> Set timer alarms on your phone for every dose, including overnight if needed. Use a weekly pill organizer and fill it together so your parent watches the process and feels in control.</li>
<li><strong>Hydration and nutrition.</strong> Aim for small meals and steady fluids. Watch for choking risk if there have been swallowing concerns. If your parent is not eating or drinking by hour 24, call the doctor.</li>
<li><strong>Rest, but not bed rest.</strong> Brief walks to the bathroom and around the house every two hours, with help, prevent blood clots and pneumonia. Long stretches in bed do the opposite.</li>
</ol>
</section>

<section class="art-section">
<h2>Setting up the home: the room that matters most</h2>
<p>The bedroom your parent will sleep in for the next several weeks needs three changes most homes are missing.</p>
<p><strong>Path lighting.</strong> Falls happen on the way to the bathroom at 3 a.m. Plug-in motion-sensor night lights along the route from bed to toilet are a five-dollar fix that prevents a five-figure ER visit. Get four of them.</p>
<p><strong>Bathroom grab bars.</strong> Towel racks are not grab bars. A senior leaning on a towel rack to stand from the toilet will eventually pull it out of the wall — and fall on the way down. Properly installed grab bars by the toilet and inside the shower are the highest-leverage home modification you can make. Most can be added in under an hour by a handyman for under one hundred dollars.</p>
<p><strong>Clear, wide pathways.</strong> Throw rugs, low furniture, electrical cords, and pets that wind around legs are the four most common indoor fall causes. Roll up the rugs. Move the side tables. Tape down the cords. Tell the dog he sleeps in a different room for a month.</p>
</section>

<section class="art-section">
<h2>What Medicare actually covers in the first 60 days</h2>
<p>This is the area where families lose thousands of dollars to avoidable confusion. Medicare and home care are not the same thing. They cover different services, for different durations, with very different rules.</p>
<p><strong>Medicare Part A, post-hospital, typically covers:</strong></p>
<ul class="art-list">
<li>Skilled home health care if your parent is "homebound" and needs intermittent skilled nursing or therapy. This usually means a nurse, physical therapist, or occupational therapist visiting one to three times per week, plus a home health aide for short personal care visits during the same period.</li>
<li>Up to 100 days in a skilled nursing facility for short-term rehab — but only the first 20 days are fully covered. Days 21 to 100 carry a daily co-pay (over $200/day in 2026).</li>
<li>Medical equipment such as a hospital bed, walker, wheelchair, or oxygen, with a doctor's order.</li>
</ul>
<p><strong>Medicare does not cover:</strong></p>
<ul class="art-list">
<li>Long-term custodial care — meaning a paid caregiver who simply helps with bathing, meals, dressing, and supervision. This is what most families actually need, and it is what comes out of pocket.</li>
<li>Round-the-clock care of any kind in the home.</li>
<li>Most personal care if it is not paired with a "skilled" service.</li>
</ul>
<p>If your parent qualifies for home health, the agency is paid by Medicare on a per-episode basis. If they don't qualify or they need more help than Medicare allows, you are looking at private-pay home care — and the math changes quickly.</p>
<p>For a deeper look at what Medicare home health benefits actually include, see our guide on <a href="/home-health-aide/">Medicare home health aide coverage</a>.</p>
</section>

<section class="art-section">
<h2>What in-home care actually costs in 2026</h2>
<p>The 2026 national median for an in-home caregiver is approximately $34 per hour. That number tells you almost nothing useful, because it varies by state, by metropolitan area, by the agency's level of training and supervision, and by whether you need awake overnight care, which costs roughly 30 percent more than daytime hours.</p>
<p>Realistic monthly cost ranges, private-pay, in 2026:</p>
<ul class="art-list">
<li><strong>4 hours/day, 5 days/week:</strong> roughly $2,700 to $3,600 per month</li>
<li><strong>8 hours/day, 7 days/week:</strong> roughly $7,500 to $10,000 per month</li>
<li><strong>24/7 live-in care:</strong> roughly $14,000 to $20,000 per month</li>
<li><strong>24/7 awake care (two shifts):</strong> roughly $22,000 to $28,000 per month</li>
</ul>
<p>If you are looking at the upper end of that range for more than a few weeks, the math often tips toward an assisted living community or memory care facility, which generally cost less than 24/7 in-home awake care while providing more supervision. We break down the comparison in detail in our <a href="/assisted-living-facility-cost/">guide to assisted living costs</a>.</p>
</section>

<section class="art-section">
<h2>Red flags in the first two weeks</h2>
<p>Most readmissions are preventable. They happen because subtle warning signs in the first two weeks at home get explained away as "Mom's just tired from the hospital." She is not just tired. Trust your gut and call the doctor's office for any of these:</p>
<ul class="art-list">
<li>New or worsening confusion, especially if it appears suddenly. In older adults, sudden confusion is more often caused by a urinary tract infection, dehydration, or medication interaction than by dementia.</li>
<li>Shortness of breath that is new or worse than at discharge.</li>
<li>Chest pain, even if mild and brief.</li>
<li>A fall, even if "she said she's fine." Falls in the first two weeks frequently mask hip fractures or head injuries.</li>
<li>Refusing to eat or drink for more than 12 to 24 hours.</li>
<li>Fever above 100.4 °F (38 °C).</li>
<li>Increasing leg swelling, redness, or pain — possible blood clot.</li>
<li>Wound changes around any surgical site: redness, warmth, drainage, or worsening pain.</li>
</ul>
<p>Save the doctor's after-hours number in your phone before you need it. The first time you call should not be the time you are also looking up the number.</p>
</section>

<section class="art-section">
<h2>In-home care vs. short-term rehab vs. assisted living</h2>
<p>If you and your parent's care team have decided that going home alone is not realistic, the next decision is between three very different paths.</p>
<p><strong>Short-term rehab</strong> — usually 7 to 21 days in a skilled nursing facility, focused on getting strength back after surgery, stroke, or a serious illness. Mostly covered by Medicare for the first 20 days. The goal is always to send your parent home stronger.</p>
<p><strong>In-home care</strong> — a paid caregiver coming to the home for a defined number of hours per day or per week. Right when your parent has the cognitive capacity to direct their own routine, has a safe home environment, and needs help with specific tasks rather than constant supervision.</p>
<p><strong>Assisted living or memory care</strong> — a community where your parent lives full time. Right when home is no longer safe, when supervision needs are 24/7, when the family caregiver is approaching burnout, or when the cost math of round-the-clock home care no longer works.</p>
<p>There is no universally right answer. The right answer is the one that matches your parent's medical reality, your family's capacity, and the budget you can actually sustain for years if needed.</p>
</section>

<section class="art-section">
<h2>How to choose a home care agency you can actually trust</h2>
<p>If you decide on in-home care, the agency you choose matters more than almost any other decision in this process. A good caregiver, supervised by a good agency, is transformative. A bad one is dangerous. Five things to verify before signing a contract:</p>
<ul class="art-list">
<li><strong>State licensing.</strong> In Florida, home care agencies must be licensed by AHCA. Ask for the license number and check it. Skip agencies that hesitate.</li>
<li><strong>Background check policy.</strong> Caregivers should be Level 2 background checked, not just self-reported. Ask exactly what the agency screens for and how often it is renewed.</li>
<li><strong>Bonded and insured.</strong> Ask to see proof. If the agency cannot produce a current certificate of insurance for general liability and workers' compensation, walk away.</li>
<li><strong>Continuity of caregiver.</strong> The single biggest predictor of a good experience is whether the same caregiver shows up most shifts. Ask the agency directly: "What is your average caregiver tenure, and what happens when our regular caregiver is sick or on vacation?"</li>
<li><strong>Care plan ownership.</strong> A real agency does an in-home assessment and writes a written care plan you can keep and update. Agencies that show up and "see what's needed" without a plan rarely deliver consistency.</li>
</ul>
<p>If you would like a faster way to compare local agencies that meet these criteria, our <a href="/find-care/">free 2-minute care assessment</a> matches your parent's specific needs, location, and budget with up to three trusted local providers — at no cost to you.</p>
</section>

<section class="art-section">
<h2>The family caregiver: do not skip this part</h2>
<p>Six weeks into a parent's recovery, the pattern is almost universal. The adult daughter or son who absorbed the caregiver role becomes exhausted, irritable, and quietly resentful. They sleep less. They eat worse. They miss their own medical appointments. They argue with their spouse. And they often feel guilty for feeling any of it.</p>
<p>The honest truth: if you burn out, your parent's recovery suffers more than if you had hired help in week two. Caregiver burnout is the single most common reason a family ends up making a placement decision in crisis rather than calmly. Avoid the crisis by building help in early.</p>
<p>Three concrete things that help, in order of return on effort:</p>
<ul class="art-list">
<li><strong>One block of respite per week.</strong> Even four hours where someone else is responsible — a sibling, a paid caregiver, an adult day program — protects your nervous system more than people expect.</li>
<li><strong>A second person who knows the medications.</strong> If only one family member knows how to manage the pill schedule, that family member cannot get sick, travel, or sleep through the night. Cross-train someone.</li>
<li><strong>Permission to not be a hero.</strong> You are allowed to not love this. You are allowed to grieve the parent your parent used to be. You are allowed to ask for help before you are at the breaking point.</li>
</ul>
</section>

<section class="art-section">
<h2>A practical 30-day plan</h2>
<p>If you take only one thing from this guide, take this rough sequence. Adjust to your situation.</p>
<ul class="art-list">
<li><strong>Days 1–3:</strong> medications correct and on time. Hydration. Boring. No big decisions.</li>
<li><strong>Days 3–7:</strong> grab bars in. Throw rugs out. Night lights everywhere. First follow-up appointment. Set up Medicare home health if approved.</li>
<li><strong>Days 7–14:</strong> assess realistically. Are you sleeping? Is your parent improving? If either answer is no, get help in the door — even a few hours per week.</li>
<li><strong>Days 14–21:</strong> if recovery is on track, decide what the long-term plan is — independent at home with light help, in-home care with regular hours, or a transition to assisted living. Stay ahead of the decision.</li>
<li><strong>Days 21–30:</strong> review medications with the primary care doctor. Re-check the home for new fall risks now that mobility patterns have changed. Take a full day off.</li>
</ul>
</section>

<section class="article-faq">
<h2>Frequently asked questions</h2>
<div class="faq-item">
<p class="faq-q">Does Medicare pay for someone to come home and help my mother shower?</p>
<p class="faq-a">Only if it is part of a skilled home health episode and the help is intermittent. If your mother does not also need a nurse, physical therapist, or occupational therapist, Medicare will not pay for personal care alone. That kind of help is private pay, long-term care insurance, or in some cases Medicaid.</p>
</div>
<div class="faq-item">
<p class="faq-q">How long does Medicare cover home health after a hospital stay?</p>
<p class="faq-a">There is no fixed limit, but episodes are typically certified in 60-day blocks. As long as your parent remains homebound and continues to need a skilled service, the agency can recertify. Coverage ends when the skilled need ends — even if personal care is still needed.</p>
</div>
<div class="faq-item">
<p class="faq-q">My father refuses to let a stranger into the house. What do I do?</p>
<p class="faq-a">This is one of the most common roadblocks, and it is rarely about the caregiver. It is usually about loss of independence and pride. Three things help: introduce the caregiver as someone helping you (the family caregiver), not your parent. Start with a short shift and a low-stakes task. And give your parent veto power over the choice — interview two or three candidates together so they feel in control of the decision.</p>
</div>
<div class="faq-item">
<p class="faq-q">When should I consider assisted living instead of in-home care?</p>
<p class="faq-a">Three signals point toward assisted living: 24-hour supervision is needed (especially for memory loss), in-home care has stretched past about 12 hours per day on a sustained basis, or the family caregiver is showing signs of burnout despite paid help. The cost math also matters: 24/7 in-home awake care typically costs more than memory care, while providing less consistent supervision.</p>
</div>
<div class="faq-item">
<p class="faq-q">What is the single biggest mistake families make in the first month?</p>
<p class="faq-a">Trying to absorb everything alone for too long. Families who bring in even a few hours of paid help in week one or two consistently report better recoveries, fewer crises, and lower long-term costs than families who wait until week six and hire in panic.</p>
</div>
<div class="faq-item">
<p class="faq-q">Can I get a quick read on what kind of care my parent really needs?</p>
<p class="faq-a">Yes. Our <a href="/find-care/">free 2-minute care assessment</a> walks you through a few practical questions about your parent's situation and matches you with trusted local providers — home care agencies, assisted living communities, or care advisors — based on your specific needs and budget.</p>
</div>
</section>

<section class="article-section conclusion">
<h2>The bottom line</h2>
<p>The first month after a parent comes home from the hospital is the one stretch of caregiving where small, early decisions reshape the entire next year. Get the medications right. Make the home boring and safe. Use what Medicare covers. Watch for the red flags. And do not wait until you are burnt out to bring in help — the families who end up regretting the most are usually the ones who tried to do it all alone for too long.</p>
<p>You do not have to figure this out by yourself. If you are unsure what kind of care your parent actually needs, or whether home care, assisted living, or memory care is the right next step, take the <a href="/find-care/">2-minute care assessment</a> and we will match you with trusted local options — at no cost, with no pressure.</p>
</section>
`.trim();

const SCHEMA_MARKUP = [
  {
    '@context': 'https://schema.org',
    '@type': 'Article',
    '@id': `https://medicarepriceguide.com/${SLUG}/#article`,
    headline: TITLE,
    datePublished: PUB_DATE,
    dateModified: PUB_DATE,
    description: META,
    author: { '@type':'Person', name: 'Nancy Williams', url: 'https://medicarepriceguide.com/author/nancy-williams/' },
    publisher: { '@type':'Organization', name: 'Medicare Price Guide', url: 'https://medicarepriceguide.com' },
    mainEntityOfPage: `https://medicarepriceguide.com/${SLUG}/`,
    articleSection: 'Senior Care',
    wordCount: 2400,
  },
  {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      { '@type':'Question', name:'Does Medicare pay for someone to come home and help my mother shower?',
        acceptedAnswer:{ '@type':'Answer', text:'Only if it is part of a skilled home health episode and the help is intermittent. If your mother does not also need a nurse, physical therapist, or occupational therapist, Medicare will not pay for personal care alone.' } },
      { '@type':'Question', name:'How long does Medicare cover home health after a hospital stay?',
        acceptedAnswer:{ '@type':'Answer', text:'There is no fixed limit, but episodes are typically certified in 60-day blocks. As long as your parent remains homebound and continues to need a skilled service, the agency can recertify.' } },
      { '@type':'Question', name:'When should I consider assisted living instead of in-home care?',
        acceptedAnswer:{ '@type':'Answer', text:'Three signals point toward assisted living: 24-hour supervision is needed, in-home care has stretched past about 12 hours per day, or the family caregiver is showing signs of burnout despite paid help.' } },
      { '@type':'Question', name:'What is the single biggest mistake families make in the first month?',
        acceptedAnswer:{ '@type':'Answer', text:'Trying to absorb everything alone for too long. Families who bring in even a few hours of paid help in week one or two consistently report better recoveries, fewer crises, and lower long-term costs.' } },
    ]
  },
  {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type':'ListItem', position:1, name:'Home', item:'https://medicarepriceguide.com/' },
      { '@type':'ListItem', position:2, name:'Caring for Aging Parents', item:'https://medicarepriceguide.com/category/caring-for-aging-parents/' },
      { '@type':'ListItem', position:3, name: TITLE, item: `https://medicarepriceguide.com/${SLUG}/` }
    ]
  }
];

async function run() {
  // 1. Niche
  const [niche] = await sql`SELECT id FROM niches WHERE slug = ${NICHE_SLUG}`;
  if (!niche) throw new Error('niche not found');

  // 2. Keyword (seed for the article — pillar, high volume so it leads ranking)
  const kwText = 'what to do when parent comes home from hospital';
  const existing = await sql`
    SELECT id FROM keywords WHERE niche_id = ${niche.id} AND keyword = ${kwText}
  `;
  let keywordId;
  if (existing.length) {
    keywordId = existing[0].id;
    await sql`UPDATE keywords SET used = TRUE, is_pillar = TRUE, search_volume = 2400 WHERE id = ${keywordId}`;
  } else {
    const ins = await sql`
      INSERT INTO keywords (niche_id, keyword, search_volume, difficulty, intent, source, used, is_pillar, cluster_slug)
      VALUES (${niche.id}, ${kwText}, 2400, 'low', 'informational', 'manual', TRUE, TRUE, 'post-hospital-discharge')
      RETURNING id
    `;
    keywordId = ins[0].id;
  }

  // 3. Article — INSERT, status=published, immediately
  const exists = await sql`SELECT id FROM articles WHERE site_id = ${SITE_ID} AND slug = ${SLUG}`;
  if (exists.length) {
    await sql`
      UPDATE articles SET
        title = ${TITLE},
        meta_description = ${META},
        content = ${CONTENT},
        word_count = 2400,
        schema_markup = ${JSON.stringify(SCHEMA_MARKUP)}::jsonb,
        status = 'published',
        published_at = ${PUB_DATE},
        updated_at = NOW(),
        tags = ARRAY['post-hospital-discharge','aging-parents','home-care','medicare'],
        keyword_id = ${keywordId}
      WHERE id = ${exists[0].id}
    `;
    console.log(`✏️  Updated existing article #${exists[0].id} (${SLUG})`);
  } else {
    const a = await sql`
      INSERT INTO articles (
        site_id, keyword_id, slug, title, meta_description, content,
        word_count, schema_markup, status, published_at, tags
      ) VALUES (
        ${SITE_ID}, ${keywordId}, ${SLUG}, ${TITLE}, ${META}, ${CONTENT},
        2400, ${JSON.stringify(SCHEMA_MARKUP)}::jsonb, 'published', ${PUB_DATE},
        ARRAY['post-hospital-discharge','aging-parents','home-care','medicare']
      ) RETURNING id
    `;
    console.log(`✅ Inserted new article #${a[0].id} (${SLUG})`);
  }

  console.log(`\nNext step: node packages/vps/src/rerender-articles.js --site-id ${SITE_ID}`);
  process.exit(0);
}

run().catch(err => { console.error(err); process.exit(1); });
