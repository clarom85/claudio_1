-- ============================================================
-- CONTENT NETWORK — Database Schema
-- ============================================================

-- Nicchie disponibili
CREATE TABLE IF NOT EXISTS niches (
  id          SERIAL PRIMARY KEY,
  slug        TEXT UNIQUE NOT NULL,         -- 'home-improvement-costs'
  name        TEXT NOT NULL,                -- 'Home Improvement Costs'
  seed_keywords TEXT[] NOT NULL,            -- keyword di partenza
  language    TEXT DEFAULT 'en',
  country     TEXT DEFAULT 'US',
  template    TEXT NOT NULL,                -- 'pulse','tribune','nexus','echo','vortex'
  active      BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Siti generati
CREATE TABLE IF NOT EXISTS sites (
  id              SERIAL PRIMARY KEY,
  niche_id        INTEGER REFERENCES niches(id),
  domain          TEXT UNIQUE NOT NULL,     -- 'homecosthub.com'
  cf_project_name TEXT UNIQUE NOT NULL,     -- nome progetto Cloudflare Pages
  cf_deploy_url   TEXT,                     -- URL pubblico
  template        TEXT NOT NULL,
  status          TEXT DEFAULT 'pending',   -- pending|building|live|paused
  week_number     INTEGER NOT NULL,         -- settimana di creazione
  articles_count  INTEGER DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Keywords scoperte e gestite
CREATE TABLE IF NOT EXISTS keywords (
  id              SERIAL PRIMARY KEY,
  niche_id        INTEGER REFERENCES niches(id),
  keyword         TEXT NOT NULL,
  search_volume   INTEGER DEFAULT 0,        -- stimato
  difficulty      TEXT DEFAULT 'unknown',   -- low|medium|high|unknown
  intent          TEXT DEFAULT 'informational', -- informational|commercial|transactional
  source          TEXT NOT NULL,            -- 'autocomplete'|'paa'|'trends'|'reddit'|'youtube'
  used            BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(niche_id, keyword)
);

-- Articoli generati e pubblicati
CREATE TABLE IF NOT EXISTS articles (
  id              SERIAL PRIMARY KEY,
  site_id         INTEGER REFERENCES sites(id),
  keyword_id      INTEGER REFERENCES keywords(id),
  slug            TEXT NOT NULL,
  title           TEXT NOT NULL,
  meta_description TEXT,
  content         TEXT NOT NULL,            -- HTML completo
  word_count      INTEGER,
  schema_markup   JSONB,                    -- JSON-LD
  status          TEXT DEFAULT 'draft',     -- draft|published|indexed
  published_at    TIMESTAMPTZ,
  indexed_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(site_id, slug)
);

-- Aggiunge updated_at su DB esistenti (idempotente)
ALTER TABLE articles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE articles ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- Coda pubblicazione (scheduler usa questa)
CREATE TABLE IF NOT EXISTS publish_queue (
  id              SERIAL PRIMARY KEY,
  article_id      INTEGER REFERENCES articles(id),
  site_id         INTEGER REFERENCES sites(id),
  scheduled_for   TIMESTAMPTZ NOT NULL,
  status          TEXT DEFAULT 'pending',   -- pending|processing|done|failed
  attempts        INTEGER DEFAULT 0,
  error           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Metriche siti (aggiornate periodicamente)
CREATE TABLE IF NOT EXISTS site_metrics (
  id              SERIAL PRIMARY KEY,
  site_id         INTEGER REFERENCES sites(id),
  recorded_at     TIMESTAMPTZ DEFAULT NOW(),
  articles_indexed INTEGER DEFAULT 0,
  est_monthly_traffic INTEGER DEFAULT 0,
  ad_revenue_usd  NUMERIC(10,2) DEFAULT 0
);

-- Aggiunge colonne cluster su DB esistenti (idempotente)
ALTER TABLE keywords ADD COLUMN IF NOT EXISTS cluster_slug TEXT;
ALTER TABLE keywords ADD COLUMN IF NOT EXISTS is_pillar BOOLEAN DEFAULT FALSE;

-- DataForSEO volume scoring
ALTER TABLE keywords ADD COLUMN IF NOT EXISTS cpc NUMERIC(8,2) DEFAULT NULL;
ALTER TABLE keywords ADD COLUMN IF NOT EXISTS volume_scored BOOLEAN DEFAULT FALSE;

-- Indice per prioritizzare keyword con alto volume
CREATE INDEX IF NOT EXISTS idx_keywords_volume ON keywords(niche_id, search_volume DESC) WHERE used = FALSE;

-- Ranking tracker (punto 6)
CREATE TABLE IF NOT EXISTS rankings (
  id          SERIAL PRIMARY KEY,
  site_id     INTEGER REFERENCES sites(id),
  article_id  INTEGER REFERENCES articles(id),
  keyword     TEXT NOT NULL,
  position    INTEGER,
  url         TEXT,
  checked_at  TIMESTAMPTZ DEFAULT NOW()
);

-- A/B template testing (punto 4)
ALTER TABLE sites ADD COLUMN IF NOT EXISTS ab_variant TEXT;

-- GSC submission tracking (punto 5)
ALTER TABLE articles ADD COLUMN IF NOT EXISTS gsc_submitted_at TIMESTAMPTZ;

-- Indici per performance
CREATE INDEX IF NOT EXISTS idx_keywords_niche_unused ON keywords(niche_id, used) WHERE used = FALSE;
CREATE INDEX IF NOT EXISTS idx_articles_site ON articles(site_id, status);
CREATE INDEX IF NOT EXISTS idx_queue_scheduled ON publish_queue(scheduled_for, status) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_sites_status ON sites(status);
CREATE INDEX IF NOT EXISTS idx_rankings_site_article ON rankings(site_id, article_id, checked_at DESC);
CREATE INDEX IF NOT EXISTS idx_rankings_position ON rankings(site_id, position) WHERE position IS NOT NULL;
