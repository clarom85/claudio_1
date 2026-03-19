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
- 5 template completi: `pulse` (tabloid), `tribune` (broadsheet), `nexus` (dark tech), `echo` (lifestyle), `vortex` (adventure)
- 5 nicchie seed: home-improvement-costs, pet-care-by-breed, software-error-fixes, diet-specific-recipes, small-town-tourism
- Setup richiede: `.env` con ANTHROPIC_API_KEY, DATABASE_URL (Neon), CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID, ADSENSE_ID
- Flusso: `db:migrate` → `keyword` → `spawn` → `content` → scheduler cron ogni ora

#### Stato VPS (178.104.17.161)
- Sito attivo: `home-improvement-costs` (nicchia 1) — IP diretto, no dominio ancora
- 10 articoli pubblicati, 4 category pages (hvac, bathroom, flooring, deck-patio)
- PM2 processes: `content-scheduler` (cron orario), `email-api` (porta 3001)
- Codice deploy: `/opt/content-network/` — `git pull` per aggiornare

#### Funzionalità implementate
- Nav bar categorie **statiche** (SEO-friendly, no JS fetch) — header() riceve `site.categories[]`
- Cookie consent GDPR — AdSense carica solo dopo consenso utente
- Native ads widget — fetch `/api/articles.json`, mostra 4 articoli correlati
- Email subscribe API — Express su porta 3001, nginx proxy, salva su Neon
- Ad units placeholder visibili (`.ad.ad-inline`, `.ad.ad-sidebar`) — pronti per AdSense
- Category pages con BreadcrumbList schema
- Sitemap.xml con URL categorie inclusi

#### Prossimi step
- Acquistare dominio reale + configurare DNS
- Certbot SSL (`certbot --nginx -d dominio.com`)
- Applicare a Google AdSense (inserire ADSENSE_ID in `.env` e rebuild)
- Generare contenuto per le altre 4 nicchie
