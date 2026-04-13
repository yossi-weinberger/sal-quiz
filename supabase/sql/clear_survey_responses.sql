-- Wipe all survey submissions and refresh aggregate materialized views.
-- Run once in Supabase → SQL Editor (as postgres / owner).
-- Alternative: npm run clear:survey-data (requires SUPABASE_SERVICE_ROLE_KEY in .env.local)

TRUNCATE TABLE responses CASCADE;

REFRESH MATERIALIZED VIEW CONCURRENTLY mv_global_averages;
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_household_averages;
