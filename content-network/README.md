# Content Network — Automated SEO Site Fleet

## Setup (one-time)

```bash
# 1. Copia e configura env
cp .env.example .env
# Compila: ANTHROPIC_API_KEY, DATABASE_URL (Neon), CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID

# 2. Installa dipendenze
npm install

# 3. Migra DB e seed nicchie
npm run db:migrate
```

## Creare un nuovo sito

```bash
# Step 1: genera keywords per la nicchia (fa ~500+ long-tail keywords)
npm run keyword -- --niche home-improvement-costs

# Step 2: spawna il sito (copia template, deploya su Cloudflare)
npm run spawn -- --niche home-improvement-costs --domain homecosthub.com

# Step 3: genera i primi 50 articoli
npm run content -- --site-id 1 --count 50
```

## Automazione completa (cron)

```bash
# Aggiungi al crontab (Linux/Mac)
0 * * * * cd /path/to/content-network && node packages/scheduler/src/index.js >> logs/scheduler.log 2>&1

# Windows Task Scheduler: esegui ogni ora
node C:\path\content-network\packages\scheduler\src\index.js
```

## Nicchie disponibili

| Slug | Template | CPM |
|------|----------|-----|
| `home-improvement-costs` | pulse | $8-20 |
| `pet-care-by-breed` | tribune | $3-8 |
| `software-error-fixes` | nexus | $5-15 |
| `diet-specific-recipes` | echo | $2-5 |
| `small-town-tourism` | vortex | $4-10 |

## Rotazione template

- Siti 1-10 → Template A
- Siti 11-20 → Template B
- Siti 21-30 → Template C
- etc.

## Anti-ban checklist

- [ ] Ogni sito ha IP/dominio separato
- [ ] AdSense account separati ogni 5 siti
- [ ] GA4 property separata per sito
- [ ] About + Privacy + Contact presenti
- [ ] Author bio reale su ogni articolo
- [ ] Pubblicazione graduale (3 art/ora, non burst)
- [ ] robots.txt + sitemap.xml su ogni sito
- [ ] Core Web Vitals: LCP < 2.5s (verificare con PageSpeed)
