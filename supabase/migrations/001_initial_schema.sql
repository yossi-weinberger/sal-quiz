-- ============================================================
-- הסל של המדינה - Initial Schema
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- ENUM TYPES
-- ============================================================

CREATE TYPE household_type AS ENUM (
  'single',
  'couple',
  'couple_kids',
  'large_family'
);

CREATE TYPE answer_value AS ENUM (
  'regular',
  'sometimes',
  'no'
);

-- ============================================================
-- PRODUCTS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS products (
  id              INTEGER PRIMARY KEY,
  barcode         TEXT,
  name_he         TEXT NOT NULL,
  official_price  NUMERIC(8, 2) NOT NULL,
  image_path      TEXT,
  display_order   INTEGER NOT NULL DEFAULT 0,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_products_display_order ON products (display_order);
CREATE INDEX idx_products_is_active ON products (is_active);

-- ============================================================
-- BRANCHES TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS branches (
  id                    INTEGER PRIMARY KEY,
  format_type           TEXT,
  branch_name           TEXT NOT NULL,
  city_name             TEXT NOT NULL,
  address               TEXT,
  normalized_city_name  TEXT NOT NULL,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_branches_city ON branches (city_name);
CREATE INDEX idx_branches_normalized_city ON branches (normalized_city_name);

-- ============================================================
-- RESPONSES TABLE (anonymous)
-- ============================================================

CREATE TABLE IF NOT EXISTS responses (
  id                       UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_type           household_type NOT NULL,
  city_name                TEXT,
  normalized_city_name     TEXT,
  has_branch_in_city       BOOLEAN,
  branch_count             INTEGER,
  weighted_match_percent   NUMERIC(5, 2) NOT NULL,
  regular_count            INTEGER NOT NULL,
  sometimes_count          INTEGER NOT NULL,
  not_buy_count            INTEGER NOT NULL,
  regular_cost             NUMERIC(10, 2) NOT NULL,
  weighted_cost            NUMERIC(10, 2) NOT NULL,
  completed_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  source                   TEXT NOT NULL DEFAULT 'web'
);

CREATE INDEX idx_responses_household ON responses (household_type);
CREATE INDEX idx_responses_completed_at ON responses (completed_at);

-- ============================================================
-- RESPONSE ITEMS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS response_items (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  response_id          UUID NOT NULL REFERENCES responses(id) ON DELETE CASCADE,
  product_id           INTEGER NOT NULL REFERENCES products(id),
  answer_value         answer_value NOT NULL,
  answer_numeric       NUMERIC(3, 1) NOT NULL
);

CREATE INDEX idx_response_items_response ON response_items (response_id);
CREATE INDEX idx_response_items_product ON response_items (product_id);

-- ============================================================
-- ANALYTICS VIEWS
-- ============================================================

CREATE OR REPLACE VIEW v_global_averages AS
SELECT
  COUNT(*) AS total_responses,
  ROUND(AVG(weighted_match_percent)::numeric, 2) AS avg_weighted_match,
  ROUND(AVG(regular_count)::numeric, 2) AS avg_regular_count,
  ROUND(AVG(weighted_cost)::numeric, 2) AS avg_weighted_cost
FROM responses;

CREATE OR REPLACE VIEW v_household_averages AS
SELECT
  household_type,
  COUNT(*) AS total_responses,
  ROUND(AVG(weighted_match_percent)::numeric, 2) AS avg_weighted_match,
  ROUND(AVG(regular_count)::numeric, 2) AS avg_regular_count,
  ROUND(AVG(weighted_cost)::numeric, 2) AS avg_weighted_cost
FROM responses
GROUP BY household_type;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE response_items ENABLE ROW LEVEL SECURITY;

-- Products: public read
CREATE POLICY "products_public_read" ON products
  FOR SELECT TO anon, authenticated USING (is_active = TRUE);

-- Branches: public read
CREATE POLICY "branches_public_read" ON branches
  FOR SELECT TO anon, authenticated USING (TRUE);

-- Responses: public insert only (anonymous), public read for aggregates
CREATE POLICY "responses_public_insert" ON responses
  FOR INSERT TO anon, authenticated WITH CHECK (TRUE);

-- Response items: public insert only
CREATE POLICY "response_items_public_insert" ON response_items
  FOR INSERT TO anon, authenticated WITH CHECK (TRUE);

-- Service role can do everything (bypasses RLS)
