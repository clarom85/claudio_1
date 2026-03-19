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
- File prototipo: `aura-prototype.html` (non ancora committato)

### Content Network (automated SEO site fleet)
- Directory: `/content-network/`
- Stack: Node.js monorepo, Astro (static sites), Neon PostgreSQL, Cloudflare Pages, Claude API
- Packages: `keyword-engine`, `content-engine`, `db`, `site-spawner`, `scheduler`
- Template: `pulse` (tabloid-style, 5 template totali pianificati: pulse/tribune/nexus/echo/vortex)
- 5 nicchie seed: home-improvement-costs, pet-care-by-breed, software-error-fixes, diet-specific-recipes, small-town-tourism
- Setup richiede: `.env` con ANTHROPIC_API_KEY, DATABASE_URL (Neon), CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID
- Flusso: `db:migrate` → `keyword` → `spawn` → `content` → scheduler cron ogni ora
