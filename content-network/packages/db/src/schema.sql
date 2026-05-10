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

-- Price tracker — monthly economic data snapshots
CREATE TABLE IF NOT EXISTS price_snapshots (
  id           SERIAL PRIMARY KEY,
  niche_slug   TEXT NOT NULL,
  metric_key   TEXT NOT NULL,
  metric_label TEXT NOT NULL,
  value        NUMERIC NOT NULL,
  period       DATE NOT NULL,
  source       TEXT NOT NULL,
  unit         TEXT NOT NULL DEFAULT 'index',
  series_id    TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(niche_slug, metric_key, period)
);
CREATE INDEX IF NOT EXISTS idx_price_snapshots_niche ON price_snapshots(niche_slug, period DESC);

-- API token tracking per cost monitoring
ALTER TABLE articles ADD COLUMN IF NOT EXISTS tokens_in INTEGER DEFAULT 0;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS tokens_out INTEGER DEFAULT 0;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS model_used TEXT;

-- ============================================================
-- PARENTCARE FINDER — Lead generation system
-- ============================================================

-- Buyer registry (home care agencies, assisted living, ecc.)
CREATE TABLE IF NOT EXISTS parentcare_buyers (
  id              SERIAL PRIMARY KEY,
  name            TEXT NOT NULL,
  contact_name    TEXT,
  email           TEXT NOT NULL,
  phone           TEXT,
  category        TEXT NOT NULL,            -- 'home_care'|'assisted_living'|'memory_care'|'placement_advisor'|'medical_alert'
  zip_codes       TEXT[] DEFAULT '{}',      -- ZIP codes serviti
  state           TEXT NOT NULL,            -- 'FL','TX','AZ',ecc.
  metro           TEXT,                     -- 'tampa-st-pete','phoenix-mesa',ecc.
  price_per_lead  NUMERIC(8,2) DEFAULT 50,
  exclusive       BOOLEAN DEFAULT FALSE,
  active          BOOLEAN DEFAULT TRUE,
  pilot           BOOLEAN DEFAULT TRUE,     -- primi 5 lead gratis
  pilot_leads_remaining INTEGER DEFAULT 5,
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_pc_buyers_active ON parentcare_buyers(active, category);
CREATE INDEX IF NOT EXISTS idx_pc_buyers_state ON parentcare_buyers(state, active);

-- Buyer portal token (shared in welcome email + every lead delivery)
ALTER TABLE parentcare_buyers ADD COLUMN IF NOT EXISTS auth_token TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS uniq_pc_buyers_auth_token ON parentcare_buyers(auth_token) WHERE auth_token IS NOT NULL;

-- Lead inquiries from quiz
CREATE TABLE IF NOT EXISTS parentcare_leads (
  id              SERIAL PRIMARY KEY,
  ts              TIMESTAMPTZ DEFAULT NOW(),

  -- Quiz answers
  who_needs_care  TEXT,                     -- 'mother'|'father'|'spouse'|'grandparent'|'self'|'other'
  main_concern    TEXT,                     -- 'lives_alone'|'recent_fall'|'memory_issues'|'post_hospital'|...
  location_now    TEXT,                     -- 'home'|'hospital'|'rehab'|'assisted_living'|'nursing_home'
  level_help      TEXT,                     -- 'few_hours'|'daily'|'overnight'|'24_7'|'assisted_living'|'memory_care'
  urgency         TEXT,                     -- 'immediate'|'this_week'|'this_month'|'planning'
  payment         TEXT,                     -- 'private_pay'|'ltc_insurance'|'medicaid'|'va'|'unsure'
  zip             VARCHAR(10),
  state           TEXT,
  metro           TEXT,

  -- Contact
  name            TEXT,
  phone           TEXT,
  email           TEXT,

  -- TCPA/FTSA consent capture (audit trail)
  consent_text    TEXT NOT NULL,
  consent_version VARCHAR(20),
  consent_ip      INET,
  consent_ua      TEXT,
  consent_url     TEXT,
  consent_ts      TIMESTAMPTZ DEFAULT NOW(),
  checkbox_checked BOOLEAN DEFAULT TRUE,

  -- Scoring + status
  score           INTEGER DEFAULT 0,
  tier            TEXT DEFAULT 'low',       -- 'high'|'medium'|'low'
  status          TEXT DEFAULT 'new',       -- 'new'|'routed'|'sold'|'rejected'|'duplicate'|'dnc'
  source          TEXT DEFAULT 'quiz',      -- traffic source
  utm_source      TEXT,
  utm_medium      TEXT,
  utm_campaign    TEXT,
  referer         TEXT,
  notes           TEXT
);
CREATE INDEX IF NOT EXISTS idx_pc_leads_ts ON parentcare_leads(ts DESC);
CREATE INDEX IF NOT EXISTS idx_pc_leads_status ON parentcare_leads(status);
CREATE INDEX IF NOT EXISTS idx_pc_leads_zip ON parentcare_leads(zip);
CREATE INDEX IF NOT EXISTS idx_pc_leads_phone ON parentcare_leads(phone);
CREATE INDEX IF NOT EXISTS idx_pc_leads_email ON parentcare_leads(email);

-- Lead routing log (which lead → which buyer, accept/reject)
CREATE TABLE IF NOT EXISTS parentcare_routing (
  id              SERIAL PRIMARY KEY,
  lead_id         INTEGER REFERENCES parentcare_leads(id) ON DELETE CASCADE,
  buyer_id        INTEGER REFERENCES parentcare_buyers(id),
  routed_at       TIMESTAMPTZ DEFAULT NOW(),
  buyer_response  TEXT,                     -- 'accepted'|'rejected'|'no_response'|'pending'
  response_at     TIMESTAMPTZ,
  reject_reason   TEXT,
  price_paid      NUMERIC(8,2),
  notes           TEXT
);
CREATE INDEX IF NOT EXISTS idx_pc_routing_lead ON parentcare_routing(lead_id);
CREATE INDEX IF NOT EXISTS idx_pc_routing_buyer ON parentcare_routing(buyer_id, routed_at DESC);

-- DNC (Do Not Contact) list — federal/state DNC + internal opt-outs
CREATE TABLE IF NOT EXISTS parentcare_dnc (
  id              SERIAL PRIMARY KEY,
  phone           TEXT,
  email           TEXT,
  source          TEXT,                     -- 'opt_out'|'fed_dnc'|'state_dnc'|'manual'|'litigation_risk'
  added_at        TIMESTAMPTZ DEFAULT NOW(),
  notes           TEXT
);
CREATE INDEX IF NOT EXISTS idx_pc_dnc_phone ON parentcare_dnc(phone);
CREATE INDEX IF NOT EXISTS idx_pc_dnc_email ON parentcare_dnc(email);
