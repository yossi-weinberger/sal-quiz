-- Block direct PostgREST RPC calls to refresh_aggregate_views() by anon/authenticated.
-- Survey inserts still refresh MVs via AFTER INSERT trigger (SECURITY DEFINER).

REVOKE EXECUTE ON FUNCTION refresh_aggregate_views() FROM anon;
REVOKE EXECUTE ON FUNCTION refresh_aggregate_views() FROM authenticated;
