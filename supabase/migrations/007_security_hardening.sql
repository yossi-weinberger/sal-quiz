-- ============================================================
-- Security hardening based on Supabase advisor findings
-- ============================================================

-- 1. rami_levy_prices: remove anon DELETE + INSERT (script uses service role)
DROP POLICY IF EXISTS "rl_prices_anon_delete" ON rami_levy_prices;
DROP POLICY IF EXISTS "rl_prices_anon_insert" ON rami_levy_prices;

-- 2. Drop old SECURITY DEFINER views (replaced by materialized views in migration 002)
DROP VIEW IF EXISTS public.v_global_averages;
DROP VIEW IF EXISTS public.v_household_averages;

-- 3. Fix mutable search_path on security-sensitive functions
CREATE OR REPLACE FUNCTION public.refresh_aggregate_views()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW public.mv_global_averages;
  REFRESH MATERIALIZED VIEW public.mv_household_averages;
END;
$$;

CREATE OR REPLACE FUNCTION public.trigger_refresh_aggregates()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  PERFORM public.refresh_aggregate_views();
  RETURN NEW;
END;
$$;
