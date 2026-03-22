# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Git Workflow

As you complete work, commit changes to Git and push them to GitHub frequently so progress is never lost:

- Make small, focused commits after each meaningful unit of work (a working feature, a bug fix, a refactor step).
- Write clean, descriptive commit messages in the imperative mood (e.g., "Add login endpoint", "Fix null check in parser").
- Push to GitHub after every commit (or logical group of commits) — never leave finished work only in the local working tree.

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

#### Funzionalità implementate — Anti-detection AI (sessione corrente)
- **NICHE_PROMPT_CONFIGS** in `prompts.js` — 20 nicchie top-paying, ognuna con `wordCount`, `tone`, `persona`, `structure`, `requiredElements`, `avoidances`, `categoryHint`, `schemaHint` completamente diversi
- **20 AUTHOR_PERSONAS** — bio dettagliate, credenziali, avatar unici per nicchia
- Le 20 nicchie: home-improvement-costs, personal-finance, insurance-guide, legal-advice, real-estate-investing, health-symptoms, credit-cards-banking, weight-loss-fitness, automotive-guide, online-education, cybersecurity-privacy, mental-health-wellness, home-security-systems, solar-energy, senior-care-medicare, business-startup + 5 originali

#### Setup `.env` richiesto
```
ANTHROPIC_API_KEY=
DATABASE_URL=           # Neon PostgreSQL
CLOUDFLARE_API_TOKEN=   # Auto DNS+CDN+SSL per ogni dominio
SERVER_IP=178.104.17.161
CERTBOT_EMAIL=          # Fallback SSL se no Cloudflare
ADSENSE_ID=ca-pub-XXXXXXXXXXXXXXXX
GA4_MEASUREMENT_ID=G-XXXXXXXXXX
GOOGLE_SITE_VERIFICATION=   # da Search Console > Settings > Ownership verification
PEXELS_API_KEY=
MAX_ARTICLES_PER_DAY=35
WWW_ROOT=/var/www
DISQUS_SHORTNAME=       # opzionale — commenti su articoli
```

#### Stato VPS (aggiornato 2026-03-22)
- VPS aggiornato a commit `070c3ed` (in sync con GitHub)
- DB: 20 nicchie, migration tags completata, 49 articoli, 1421 keywords
- PM2: `content-scheduler` online (cron orario), `email-api` online (porta 3001)
- Bug fix: `paginationHtml` era misplaced in `renderArticlePage` su tutti e 5 i template — fixato

#### Prossimi step
- Acquistare dominio reale → site-spawner crea zona CF automaticamente
- Applicare a Google AdSense (inserire ADSENSE_ID in `.env`)
- Dopo spawn primo sito: verificare category pages con paginazione funzionino
