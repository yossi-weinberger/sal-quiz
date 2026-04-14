-- ============================================================
-- Fix: REFRESH ... CONCURRENTLY on mv_global_averages fails
-- (expression unique index / PG behavior), rolling back every
-- responses INSERT. Use non-concurrent refresh — fine for survey traffic.
-- ============================================================

CREATE OR REPLACE FUNCTION refresh_aggregate_views()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  REFRESH MATERIALIZED VIEW mv_global_averages;
  REFRESH MATERIALIZED VIEW mv_household_averages;
END;
$$;
