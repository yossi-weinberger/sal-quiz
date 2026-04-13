-- ============================================================
-- Migration 002: Schema optimizations
-- ============================================================

-- 1. Remove useless index (n_distinct=1, planner never uses it)
DROP INDEX IF EXISTS idx_products_is_active;

-- 2. Remove redundant column (deterministic from answer_value)
ALTER TABLE response_items DROP COLUMN IF EXISTS answer_numeric;

-- 3. Composite index for common join pattern
CREATE INDEX IF NOT EXISTS idx_response_items_response_product
  ON response_items (response_id, product_id);

-- 4. BRIN index for time-range scans on append-only table
CREATE INDEX IF NOT EXISTS idx_responses_completed_brin
  ON responses USING BRIN (completed_at);

-- 5. Index for score distribution queries
CREATE INDEX IF NOT EXISTS idx_responses_weighted_match
  ON responses (weighted_match_percent);

-- 6. Built-in UUID generation (no extension required)
ALTER TABLE responses ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE response_items ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- 7. Data integrity constraints
ALTER TABLE responses
  ADD CONSTRAINT chk_weighted_match CHECK (weighted_match_percent BETWEEN 0 AND 100),
  ADD CONSTRAINT chk_counts_sum CHECK (regular_count + sometimes_count + not_buy_count = 107);

-- 8. Barcode index for Rami Levy join
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products (barcode);

-- ============================================================
-- Materialized views for O(1) aggregate reads at any scale
-- ============================================================

CREATE MATERIALIZED VIEW IF NOT EXISTS mv_global_averages AS
SELECT
  COUNT(*) AS total_responses,
  ROUND(AVG(weighted_match_percent)::numeric, 2) AS avg_weighted_match,
  ROUND(AVG(regular_count)::numeric, 2) AS avg_regular_count,
  ROUND(AVG(weighted_cost)::numeric, 2) AS avg_weighted_cost
FROM responses;

CREATE MATERIALIZED VIEW IF NOT EXISTS mv_household_averages AS
SELECT
  household_type,
  COUNT(*) AS total_responses,
  ROUND(AVG(weighted_match_percent)::numeric, 2) AS avg_weighted_match,
  ROUND(AVG(regular_count)::numeric, 2) AS avg_regular_count,
  ROUND(AVG(weighted_cost)::numeric, 2) AS avg_weighted_cost
FROM responses
GROUP BY household_type;

-- Unique indexes for CONCURRENTLY refresh (non-blocking)
CREATE UNIQUE INDEX IF NOT EXISTS mv_global_averages_unique
  ON mv_global_averages ((1));

CREATE UNIQUE INDEX IF NOT EXISTS mv_household_averages_unique
  ON mv_household_averages (household_type);

GRANT SELECT ON mv_global_averages TO anon;
GRANT SELECT ON mv_household_averages TO anon;

-- Auto-refresh trigger after each new submission
CREATE OR REPLACE FUNCTION refresh_aggregate_views()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_global_averages;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_household_averages;
END;
$$;

GRANT EXECUTE ON FUNCTION refresh_aggregate_views() TO anon;

CREATE OR REPLACE FUNCTION trigger_refresh_aggregates()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  PERFORM refresh_aggregate_views();
  RETURN NEW;
END;
$$;

CREATE TRIGGER after_response_insert
  AFTER INSERT ON responses
  FOR EACH ROW EXECUTE FUNCTION trigger_refresh_aggregates();
