# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Git Workflow

As you complete work, commit changes to Git and push them to GitHub frequently so progress is never lost:

- Make small, focused commits after each meaningful unit of work (a working feature, a bug fix, a refactor step).
- Write clean, descriptive commit messages in the imperative mood (e.g., "Add login endpoint", "Fix null check in parser").
- Push to GitHub after every commit (or logical group of commits) — never leave finished work only in the local working tree.

## DEPLOY OBBLIGATORIO — VPS 178.104.17.161

**REGOLA ASSOLUTA: dopo ogni commit/push, esegui SEMPRE il deploy sul VPS.**

Comando deploy (eseguire via SSH o webhook):
```bash
ssh root@178.104.17.161 "cd /opt/content-network && git pull origin main && cd content-network && npm install --silent && pm2 restart content-scheduler email-api && echo 'DEPLOY OK'"
```

Se SSH non è disponibile nell'ambiente (client SSH assente), usa il webhook deploy:
```bash
curl -s -X POST http://178.104.17.161:9000/deploy -H "Authorization: Bearer $DEPLOY_TOKEN"
```

**Non lasciare MAI modifiche pushate senza averle deployate sul VPS.**
Se il deploy fallisce, riportalo all'utente con l'errore completo.

## Progetti in questo repo

### AURA (dating app)
- Monorepo Turborepo in `/aura/`
- Stack: `apps/api`, `apps/web`, `packages/ai`, `packages/db`, `packages/shared`
- File prototipo: `aura-prototype.html` (committato)

### Content Network (automated SEO site fleet)
- Directory: `/content-network/`
- Stack: Node.js monorepo, Neon PostgreSQL, Claude API
- Packages: `keyword-engine`, `content-engine`, `db`, `site-spawner`, `scheduler`, `email-api`, `vps`
- 5 template: `pulse` (tabloid), `tribune` (broadsheet), `nexus` (dark tech), `echo` (lifestyle), `vortex` (adventure)
- 5 nicchie: home-improvement-costs, pet-care-by-breed, software-error-fixes, diet-specific-recipes, small-town-tourism
- Flusso: `db:migrate` → `keyword` → `spawn` → `content` → scheduler cron ogni ora

#### Stato VPS (178.104.17.161)
- PM2 processes: `content-scheduler` (cron orario), `email-api` (porta 3001)
- Codice deploy: `/opt/content-network/` — `git pull && npm install` per aggiornare

#### Funzionalità implementate — UI/UX
- Nav bar categorie statiche nel template (Base.astro riceve prop `categories[]`)
- Ticker breaking news seamless loop (JS duplica contenuto, translateX(0→-50%), no jitter)
- Cookie consent GDPR — AdSense carica solo dopo consenso utente
- Native ads widget — fetch `/api/articles.json`, mostra 4 articoli correlati
- Email subscribe API — Express su porta 3001, nginx proxy, salva su Neon
- Ad units placeholder (`.ad.ad-inline`, `.ad.ad-sidebar`) — pronti per AdSense
- **Interactive tool pages** — `packages/content-engine/src/tools/tool-generator.js` genera HTML standalone con calculator per ogni nicchia; formula embedded via `JSON.stringify` + `new Function`; outputs: range-hero, currency-hero, number-hero, bar chart, wizard
- **Pulse prototype** (`pulse-prototype.html`) — 5 view interattive incluso Calcolatore (view 5)

#### Funzionalità implementate — SEO
- Sitemap.xml completa: homepage, pagine statiche, tool, categorie, autori, articoli; `xmlns:news` + `xmlns:image`
- **LCP preload** — `<link rel="preload" as="image" fetchpriority="high">` in Base.astro via prop `lcpImage`
- **GA4** — script gtag con `anonymize_ip:true`; iniettato sia in Astro che in `simplePageWrapper`
- **Outbound citations** — Claude genera `citations:[{claim,source,url}]`; renderizzati come "Sources & References" con `rel="nofollow noopener noreferrer"`
- **Hero image** — immagine Pexels sopra l'articolo, `loading="eager"` + `fetchpriority="high"` + `width/height` espliciti (CLS fix)
- **Category pages con intro text** — `category-intros.js` fornisce 100-140 parole per categoria/nicchia (evita thin content); placeholder `{{siteName}}` sostituito a runtime
- **Custom 404 page** — `404.html` root-level con link a categorie dinamici; nginx `error_page 404 /404.html`
- **BreadcrumbList schema** + Article/FAQ/WebSite schema su ogni pagina
- Author pages con Person schema, social links, bio lunga

#### Funzionalità implementate — Content quality
- **Content clustering (topical authority)** — `keyword-engine/src/cluster.js`; pillar = keyword più breve per cluster senza satellite signals; satelliti linkano al pillar; DB: `cluster_slug`, `is_pillar`; `getUnusedKeywords` ordina `is_pillar DESC` (pillar generati prima)
- **Content freshness** — scheduler domenica 3am; aggiorna `updated_at` + "Last reviewed" in HTML per articoli >90 giorni; zero API cost; poi purge CF cache
- Image fetcher — Pexels API (`PEXELS_API_KEY`), scarica immagine per ogni articolo
- Internal link injector — `link-injector.js`, second pass post-generazione, max 3 link/articolo, **idempotente** (tracking `insideAnchor` evita doppi link)
- **Re-linking pass cross-batch** — scheduler esegue `relinkSite()` dopo ogni generazione; carica tutti gli articoli pubblicati e ri-inietta link sull'intero corpus
- Author generator — Claude genera bio 450-600 parole, Pexels scarica ritratto professionale

#### Funzionalità implementate — Infrastructure
- **Cloudflare auto-setup** — `vps/src/cloudflare.js`; per ogni nuovo dominio: crea zona CF, A record proxied, configura SSL full/HTTPS redirect/Brotli/HTTP3/Bot Fight Mode; se `CLOUDFLARE_API_TOKEN` presente, SSL gestito da CF (no Certbot); fallback Certbot se token assente
- **Publishing cadence ramp** — `content-engine/src/publishing-schedule.js`; 6 fasi basate su età sito (giorni); nuovi siti iniziano 3-5/giorno, scalano a 25-35/giorno in 6 mesi; solo 7am-10pm EST con ±12min jitter
- `MAX_ARTICLES_PER_DAY=35` hard cap in scheduler
- Email subscribe API (Express, porta 3001)

#### Nuovi file chiave (questa sessione)
- `packages/content-engine/src/tools/tool-generator.js` — genera HTML calculator standalone
- `packages/content-engine/src/tools/tool-configs.js` — config per ogni nicchia (inputs, formula, outputs)
- `packages/content-engine/src/category-intros.js` — intro text statico per category pages
- `packages/content-engine/src/publishing-schedule.js` — ramp pubblicazione age-based
- `packages/keyword-engine/src/cluster.js` — clustering topical authority
- `packages/vps/src/cloudflare.js` — Cloudflare API (zone, DNS, settings, cache purge)
- `templates/pulse/src/pages/category/[slug].astro` — category page Astro

#### Setup `.env` richiesto
```
ANTHROPIC_API_KEY=
DATABASE_URL=           # Neon PostgreSQL
CLOUDFLARE_API_TOKEN=   # Auto DNS+CDN+SSL per ogni dominio
SERVER_IP=178.104.17.161
CERTBOT_EMAIL=          # Fallback SSL se no Cloudflare
ADSENSE_ID=ca-pub-XXXXXXXXXXXXXXXX
GA4_MEASUREMENT_ID=G-XXXXXXXXXX
PEXELS_API_KEY=
MAX_ARTICLES_PER_DAY=35
WWW_ROOT=/var/www
```

#### Funzionalità implementate — SEO avanzata (sessione corrente)
- **noindex utility pages** — privacy, terms, disclaimer, contact, advertise, 404 hanno `noindex,follow`; `renderBase` accetta `noindex=true`
- **og:image fallback** — `effectiveOgImage = ogImage || ${siteUrl}/images/og-default.jpg`; SVG brandizzato 1200x630 scritto da site-spawner a spawn time
- **og:site_name + twitter tags** — aggiunti in tutti i renderBase
- **GA4 dinamico** — `process.env.GA4_MEASUREMENT_ID` iniettato in `renderBase` (layout.js)
- **GSC verification** — `process.env.GOOGLE_SITE_VERIFICATION` iniettato in renderBase + Base.astro
- **Preconnect** — pagead2.googlesyndication.com, www.googletagmanager.com + dns-prefetch google-analytics.com
- **CLS ads fix** — `min-height` inline su tutti i container ad (280px inline, 250px sidebar, 90px leaderboard); classe `.ad-leader` corretta
- **Table of Contents** — generato auto in `html-builder.js` per articoli con 3+ sezioni; anchor link verso H2 con id
- **HowTo schema** — `buildHowToSchema()` in schema.js; attivato quando `articleData.schemaType === 'HowTo'`
- **ItemList schema** — category e tag pages includono JSON-LD ItemList con top 10 articoli (carousel rich results)
- **Tag pages** — `renderTagPage()` in layout.js; `buildTagUrls()` in scheduler; tag in DB come `TEXT[]`; aggiunti a sitemap
- **DB tags column** — `ALTER TABLE articles ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';`
- **Disqus comments** — embed condizionale in `renderArticlePage`; attivo solo se `DISQUS_SHORTNAME` env presente
- **dateModified** — `buildArticleSchema` accetta param separato; scheduler aggiorna su refresh contenuto

#### Funzionalità implementate — Anti-detection AI
- **NICHE_PROMPT_CONFIGS** in `prompts.js` — 20 nicchie top-paying, ognuna con `wordCount`, `tone`, `persona`, `structure`, `requiredElements`, `avoidances`, `categoryHint`, `schemaHint` completamente diversi
- **20 AUTHOR_PERSONAS** — bio dettagliate, credenziali, avatar unici per nicchia
- Le 20 nicchie: home-improvement-costs, personal-finance, insurance-guide, legal-advice, real-estate-investing, health-symptoms, credit-cards-banking, weight-loss-fitness, automotive-guide, online-education, cybersecurity-privacy, mental-health-wellness, home-security-systems, solar-energy, senior-care-medicare, business-startup + 5 originali

#### Funzionalità implementate — HCU Mitigation (Google Helpful Content)
- **AI phrase blacklist** — `prompts.js` `AI_PHRASE_BLACKLIST` (40+ frasi); iniettato in ABSOLUTE RULES del prompt
- **Word count variation** — `getVariedWordCount()`: 30% short (base-300), 50% medium (base), 20% long (base+400)
- **E-E-A-T language requirements** — blocco dedicato nel prompt con istruzioni per Experience (first-person markers), Expertise (domain terminology), Authority (citations), Trust (hedging + referral to professionals)
- **expertTip field** — JSON field generato da Claude; renderizzato come callout box giallo-ambra in `html-builder.js`; autore attribuito
- **authorNote espanso** — 2-3 frasi con aneddoto specifico da esperienza diretta (non generico)
- **"Was this helpful?" widget** — thumbs up/down in ogni articolo; POST `/api/feedback` con slug+vote+site; tabella `article_feedback` su Neon
- **Pagine editoriali** — site-spawner genera `/about/` (E-E-A-T completo), `/editorial-guidelines/`, `/editorial-process/` per ogni sito; indicizzabili (noindex=false); cross-linkate tra loro
- **Live data injection** — `content-engine/src/data-fetcher.js`; fetch dati reali da FRED/BLS/NREL/Census prima di ogni generazione; cache 24h; block `LIVE DATA` iniettato nel prompt con date aggiornate; degrada silenziosamente senza API key

#### Funzionalità implementate — Keyword Engine (10 fonti)
1. **Seeds per-niche** da `NICHE_PROMPT_CONFIGS`
2. **PAA (People Also Ask)** — `keyword-engine/src/paa.js`; SerpAPI primary (campo `related_questions`), Google scraper fallback; campiona 10 keyword per preservare quota
3. **Seed expansion DB** — `--expand` flag: usa top 15 pillar keyword dal DB come seed aggiuntivi (rompe saturazione)
4. **Modifier matrix** — `keyword-engine/src/modifiers.js`; zero-cost; QUESTION_PREFIXES, COST_PREFIXES, INTENT_SUFFIXES, QUALIFIERS, COMPARISON_TEMPLATES; ~100-200 varianti per seed
5. **Related Searches Google** — `keyword-engine/src/related-searches.js`; scrapa "Searches related to X" dal fondo SERP; ~8 query per seed
6. **Location expansion** — `keyword-engine/src/locations.js`; top 25 US states × 4 template × top 3 seeds; solo per 10 nicchie geo-rilevanti
7. **Entity lists** — `keyword-engine/src/entities.js`; liste statiche per-nicchia (razze, diete, software, regioni, prodotti finanziari, ecc.); seed × entity combinations
8. **Competitor H2 scraping** — `keyword-engine/src/competitor-scraper.js`; top 3 URL organici per seed → estrae H2/H3 (10-100 char, 3-10 parole); salta domini noti (YouTube, Reddit, ecc.)
9. **Year filter** — `filter.js`; salta keyword con anno ≤ currentYear-2 (es. "best X 2022")
10. **Volume scoring** — `keyword-engine/src/volume-scorer.js`; Keywords Everywhere primary ($0.0001/kw, key: `246b21d52651ea1cafc8`), DataForSEO fallback ($0.0005/kw); aggiorna `search_volume`, `cpc`, `difficulty` su DB
- **Auto-trigger refill** — scheduler controlla `getUnusedKeywordCount()` ogni ora; soglia 200; passa `--expand` se count < 50
- **DB schema aggiornato** — colonne `cpc`, `volume_scored`, indice `idx_keywords_volume`; `getUnusedKeywords` ordina `is_pillar DESC, search_volume DESC NULLS LAST`

#### Funzionalità implementate — Automazione & Infrastructure
- **Keyword dedup Jaccard** — `keyword-engine/src/filter.js` (threshold 75%)
- **Email alerts** — `vps/src/alert.js` (Resend API o SMTP); env: `RESEND_API_KEY`, `ALERT_EMAIL_TO`
- **Health-check** — ogni 15min, disk check; `ads.txt` e `404.html` spostati in `optionalFiles` (warnings, non errori critici)
- **A/B template** — `sites.ab_variant` (A=default nicchia, B=altro); `--template` flag su site-spawner
- **GSC Indexing API** — `vps/src/gsc.js`; env: `GSC_SERVICE_ACCOUNT_JSON`; daily alle 02:xx
- **Ranking tracker** — `vps/src/ranking-tracker.js`; env: `SERPAPI_KEY`; domenica 04:xx
- **Smart refresh** — Claude riscrive articoli in pos 21-50; domenica 05:xx
- **Link graph** — `vps/src/link-graph.js`; PageRank + orphan detection; domenica 06:xx
- **Weekly email report** — domenica 07:xx
- **Weekly backup** — `vps/src/backup.js`; domenica 08:xx; pg_dump DB su Neon (path assoluto `/usr/lib/postgresql/17/bin/pg_dump` per PG17), tar.gz `/var/www`; mantiene ultimi 7 backup; alert email su fallimento DB

#### File chiave
```
packages/content-engine/src/data-fetcher.js      # live data da FRED/BLS/NREL/Census
packages/content-engine/src/prompts.js           # NICHE_PROMPT_CONFIGS, E-E-A-T, blacklist, variation
packages/content-engine/src/html-builder.js      # expertTip callout, feedback widget
packages/content-engine/src/generator.js         # inietta liveDataBlock nel prompt
packages/email-api/src/index.js                  # /api/subscribe + /api/feedback
packages/keyword-engine/src/paa.js               # PAA via SerpAPI
packages/keyword-engine/src/modifiers.js         # modifier matrix zero-cost
packages/keyword-engine/src/related-searches.js  # Google related searches scraper
packages/keyword-engine/src/locations.js         # location expansion geo-niches
packages/keyword-engine/src/entities.js          # entity lists per niche
packages/keyword-engine/src/competitor-scraper.js # H2/H3 da top URL organici
packages/keyword-engine/src/volume-scorer.js     # Keywords Everywhere + DataForSEO
packages/vps/src/backup.js                       # weekly backup DB + WWW
packages/vps/src/health-check.js                 # fix alert spurie (warnings vs errors)
packages/site-spawner/src/index.js               # pagine editoriali E-E-A-T
```

#### Stato VPS (aggiornato 2026-03-22)
- Latest commit: `5c7d929` (live data injection)
- DB: 20 nicchie, migration tags + rankings + ab_variant + gsc_submitted_at + cpc + volume_scored completata
- PM2: `content-scheduler` (cron orario), `email-api` (porta 3001), `health-check` (cron ogni 15min)
- Deploy: `ssh root@178.104.17.161` → `cd /opt/content-network && git pull origin main` → `cd content-network && npm install` → `pm2 restart email-api content-scheduler`

#### Setup `.env` completo (VPS)
```
ANTHROPIC_API_KEY=
DATABASE_URL=                    # Neon PostgreSQL
CLOUDFLARE_API_TOKEN=            # Auto DNS+CDN+SSL per ogni dominio
SERVER_IP=178.104.17.161
CERTBOT_EMAIL=                   # Fallback SSL se no Cloudflare
ADSENSE_ID=ca-pub-XXXXXXXXXXXXXXXX
EZOIC_SITE_ID=                   # Ezoic (alternativa AdSense)
GA4_MEASUREMENT_ID=G-XXXXXXXXXX
GOOGLE_SITE_VERIFICATION=        # da Search Console > Settings > Ownership verification
PEXELS_API_KEY=
MAX_ARTICLES_PER_DAY=35
WWW_ROOT=/var/www
BACKUP_DIR=/opt/backups
DISQUS_SHORTNAME=                # opzionale — commenti su articoli
RESEND_API_KEY=                  # alert email (resend.com — gratuito 3000/mese)
ALERT_EMAIL_FROM=                # es. alerts@tuodominio.com
ALERT_EMAIL_TO=                  # tua email
SERPAPI_KEY=                     # ranking tracker + PAA (100 free/mese)
GSC_SERVICE_ACCOUNT_JSON=/opt/content-network/gsc-service-account.json
KEYWORDS_EVERYWHERE_API_KEY=246b21d52651ea1cafc8   # volume scoring ($0.0001/kw — acquistare crediti)
DATAFORSEO_LOGIN=                # fallback volume scoring ($0.0005/kw)
DATAFORSEO_PASSWORD=
FRED_API_KEY=                    # live data Federal Reserve (gratis: fred.stlouisfed.org)
BLS_API_KEY=                     # live data Bureau of Labor Statistics (gratis: bls.gov/developers)
NREL_API_KEY=                    # live data solar/energy (gratis: developer.nrel.gov)
```

#### Prossimi step
- Acquistare dominio reale → site-spawner crea zona CF automaticamente
- Configurare env vars FRED/BLS/NREL sul VPS (tutti gratuiti, registrazione online)
- Acquistare crediti Keywords Everywhere ($10 per 100k keyword)
- Applicare a Google AdSense/Ezoic dopo primi 30 articoli live
- GSC: caricare service account JSON sul VPS dopo primo sito live
