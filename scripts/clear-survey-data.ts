/**
 * Deletes all anonymous survey responses and dependent rows (response_items).
 * Refreshes aggregate materialized views used by the API.
 *
 * Requires: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY in .env.local
 *
 * Run: npx tsx scripts/clear-survey-data.ts
 */

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(url, serviceKey);

async function main() {
  const { count: before, error: countErr } = await supabase
    .from("responses")
    .select("*", { count: "exact", head: true });

  if (countErr) {
    console.error("Count failed:", countErr.message);
    process.exit(1);
  }

  console.log(`Responses in DB before: ${before ?? 0}`);

  const { error: delErr } = await supabase
    .from("responses")
    .delete()
    .gte("completed_at", "1970-01-01T00:00:00.000Z");

  if (delErr) {
    console.error("Delete failed:", delErr.message);
    process.exit(1);
  }

  const { error: rpcErr } = await supabase.rpc("refresh_aggregate_views");

  if (rpcErr) {
    console.warn("refresh_aggregate_views RPC failed:", rpcErr.message);
    console.warn("Run in Supabase SQL editor if needed:");
    console.warn("  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_global_averages;");
    console.warn("  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_household_averages;");
  } else {
    console.log("Materialized views refreshed.");
  }

  const { count: after } = await supabase
    .from("responses")
    .select("*", { count: "exact", head: true });

  console.log(`Responses in DB after: ${after ?? 0}`);
  console.log("Done.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
