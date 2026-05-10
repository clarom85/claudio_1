# ParentCare Finder

Lead-generation funnel for adult children seeking senior care for a parent.
Lives at `medicarepriceguide.com/find-care/`. Operated by Vireon Media.

## What this package does

1. Renders a premium 8-step quiz (`/find-care/`) using the echo template.
2. Captures TCPA/FTSA-compliant consent with full audit trail.
3. Scores leads (0–100) and categorizes (home care / assisted living / memory care / placement).
4. Routes to a matched local buyer by ZIP via Resend email.
5. Sends a confirmation email to the family.
6. Provides an internal admin UI at `/admin/parentcare` for monitoring + buyer feedback.

Costs cash: **$0**. Uses existing infrastructure (Neon, VPS, Cloudflare, Resend free tier).

---

## Files

```
packages/parentcare/src/
  quiz-config.js        # 8 steps, labels, consent text/version
  quiz-builder.js       # full HTML/CSS/JS landing + quiz body
  scoring.js            # lead scoring + categorization
  buyer-router.js       # ZIP→buyer matching, DNC + dedup checks
  email-templates.js    # buyer delivery, lead confirmation, outreach
  mailer.js             # Resend HTTP client (free tier 3k/month)
  pipeline.js           # full submission pipeline
  legal.js              # privacy + terms HTML
  cta-banner.js         # internal article banner → /find-care/
  seed-buyers.js        # idempotent pilot buyer seed (Tampa)
  outreach-cli.js       # prints buyer outreach email to stdout

packages/vps/src/
  build-parentcare-page.js   # writes /find-care/, /privacy/, /terms/
  inject-parentcare-cta.js   # adds banner to existing articles

packages/email-api/src/index.js  # POST /api/parentcare/submit + /admin/parentcare
packages/db/src/schema.sql       # parentcare_leads, parentcare_buyers, parentcare_routing, parentcare_dnc
```

---

## One-time setup

### 1. Migrate DB (adds parentcare_* tables)

```bash
npm run db:migrate
```

### 2. Seed pilot buyer slots (inactive by default)

```bash
npm run pc:seed
```

Then activate each buyer manually after they sign the pilot agreement:

```sql
UPDATE parentcare_buyers
SET active = TRUE,
    name = 'Visiting Angels Tampa Bay',
    contact_name = 'Sarah Williams',
    email = 'sarah@vatampa.com',
    phone = '+18135551234'
WHERE id = 1;
```

### 3. Set env vars on VPS (`/opt/content-network/content-network/.env`)

```
PARENTCARE_ADMIN_TOKEN=<random-32-char-string>
RESEND_API_KEY=<existing key, already configured for alerts>
ALERT_EMAIL_TO=romanazziclaudio@gmail.com
```

### 4. Build the page

```bash
npm run pc:build
# OR
node packages/vps/src/build-parentcare-page.js --domain=medicarepriceguide.com
```

This writes:
- `/var/www/medicarepriceguide.com/find-care/index.html`
- `/var/www/medicarepriceguide.com/find-care/privacy/index.html`
- `/var/www/medicarepriceguide.com/find-care/terms/index.html`

And purges Cloudflare cache.

### 5. Restart email-api so the new endpoint is live

```bash
pm2 restart email-api
```

### 6. Inject CTA banner on existing articles (optional)

```bash
node packages/vps/src/inject-parentcare-cta.js --site-id 11 --dry-run
node packages/vps/src/inject-parentcare-cta.js --site-id 11
node packages/vps/src/rerender-articles.js --site-id 11
```

---

## nginx routing

Make sure nginx proxies `POST /api/parentcare/submit` and the `/admin/parentcare`
routes to `localhost:3001`. The existing `/api/subscribe` proxy block likely
already covers this — check your `medicarepriceguide.com.conf`:

```nginx
location /api/ {
  proxy_pass http://127.0.0.1:3001;
  proxy_set_header Host $host;
  proxy_set_header X-Real-IP $remote_addr;
  proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
}
location /admin/ {
  proxy_pass http://127.0.0.1:3001;
  proxy_set_header Host $host;
  proxy_set_header X-Real-IP $remote_addr;
  proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
}
```

---

## Daily ops

### View leads dashboard

```
https://medicarepriceguide.com/admin/parentcare?token=<PARENTCARE_ADMIN_TOKEN>
```

Shows tier breakdown, recent leads, active buyers, routing status.

### Mark buyer feedback (after they reply)

`POST /admin/parentcare/feedback?token=<token>` with body:
```json
{ "routing_id": 42, "response": "accepted", "price": 50, "notes": "tour booked" }
```

(Or, simpler: paste a SQL update directly via Neon console.)

### Generate buyer outreach emails

```bash
npm run pc:outreach -- --buyer="Visiting Angels Tampa" --contact="Sarah" --metro="Tampa-St. Pete"
```

Prints subject + body to stdout — copy/paste into Gmail.

---

## Validation milestones (60 days)

- ✅ **GO**: 3+ buyers paying, 10+ leads sold at $50, 1 buyer asks for more volume
- ⚠️ **PIVOT**: 1–2 buyers, decent leads, low accept rate → switch metro or wedge
- ❌ **KILL**: 0 paying buyers after 30 outreach attempts → vertical not accessible

---

## Compliance notes

- Consent text + version is captured per submission (`consent_text`, `consent_version`, `consent_ip`, `consent_ua`).
- DNC list (`parentcare_dnc`) is checked on every submit. Add federal DNC scrubs as needed.
- Dedup window: 24 hours (same phone or email).
- We do NOT route to buyers if no consent or if on DNC.
- Privacy policy clearly identifies us as a referral service receiving compensation.
- TCPA litigation risk is the #1 thing to monitor: as soon as you have the first
  real buyer complaint or volume >50 leads/day, get a TCPA lawyer review ($500–800).

---

## Costs (cash)

| Item | Cost |
|---|---|
| Domain | $0 (subdomain on existing site) |
| Hosting | $0 (existing VPS) |
| DB | $0 (Neon free tier) |
| Email | $0 (Resend free 3k/month, MailerLite free 1k subscribers) |
| Form/quiz | $0 (custom in-house) |
| Privacy/legal | $0 (templates + your review) |
| Logo | $0 (Canva or none) |
| **Total** | **$0** |

Time investment: ~50 hours over 60 days for full Phase 0 validation.
