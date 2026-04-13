/**
 * One-shot production setup against your Supabase project:
 * 1) Apply migration 003 if DB is still on pre-group schema (needs DATABASE_URL)
 * 2) Seed products + branches (needs SUPABASE_SERVICE_ROLE_KEY)
 * 3) Delete all survey responses + refresh materialized views (service role)
 * 4) Verify mv_* via anon key (NEXT_PUBLIC_SUPABASE_ANON_KEY)
 *
 * Required in .env.local:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY
 *   SUPABASE_SERVICE_ROLE_KEY   — Settings → API → service_role
 *   DATABASE_URL                — Settings → Database → Connection string (URI), session mode
 *
 * Run: npx tsx scripts/supabase-bootstrap.ts
 */

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";
import { Client } from "pg";

dotenv.config({ path: ".env.local" });

const root = path.resolve(__dirname, "..");

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing ${name} in .env.local`);
  return v;
}

async function schemaNeedsMigration003(client: Client): Promise<boolean> {
  const r = await client.query<{ exists: boolean }>(
    `SELECT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'response_items' AND column_name = 'group_id'
    ) AS exists`
  );
  return !r.rows[0]?.exists;
}

async function applyMigration003(client: Client): Promise<void> {
  const sqlPath = path.join(root, "supabase", "migrations", "003_basket_groups.sql");
  const sql = fs.readFileSync(sqlPath, "utf8");
  console.log("Applying 003_basket_groups.sql …");
  await client.query(sql);
  console.log("✓ Migration 003 applied.");
}

async function seedAndClear(): Promise<void> {
  const url = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
  const supabase = createClient(url, serviceKey);

  const products = JSON.parse(
    fs.readFileSync(path.join(root, "data", "products.json"), "utf-8")
  );
  const branches = JSON.parse(
    fs.readFileSync(path.join(root, "data", "branches.json"), "utf-8")
  );

  console.log("Seeding products …");
  const { error: pe } = await supabase.from("products").upsert(products, { onConflict: "id" });
  if (pe) throw new Error(`products seed: ${pe.message}`);

  console.log("Seeding branches …");
  const { error: be } = await supabase.from("branches").upsert(branches, { onConflict: "id" });
  if (be) throw new Error(`branches seed: ${be.message}`);
  console.log("✓ Seed complete.");

  const { count: before } = await supabase
    .from("responses")
    .select("*", { count: "exact", head: true });

  console.log(`Deleting survey responses (before: ${before ?? 0}) …`);
  const { error: delErr } = await supabase
    .from("responses")
    .delete()
    .gte("completed_at", "1970-01-01T00:00:00.000Z");
  if (delErr) throw new Error(`delete responses: ${delErr.message}`);

  const { error: rpcErr } = await supabase.rpc("refresh_aggregate_views");
  if (rpcErr) console.warn("refresh_aggregate_views:", rpcErr.message);
  else console.log("✓ Materialized views refreshed.");

  const { count: after } = await supabase
    .from("responses")
    .select("*", { count: "exact", head: true });
  console.log(`✓ Responses after delete: ${after ?? 0}`);
}

async function verifyAnon(): Promise<void> {
  const url = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  const anon = requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  const supabase = createClient(url, anon);

  const { data: global, error: gErr } = await supabase.from("mv_global_averages").select("*").single();
  if (gErr) {
    console.warn("mv_global_averages (anon):", gErr.message);
    return;
  }
  const { data: hh, error: hErr } = await supabase.from("mv_household_averages").select("*");
  if (hErr) console.warn("mv_household_averages (anon):", hErr.message);

  console.log("Verify (anon) mv_global_averages:", JSON.stringify(global, null, 2));
  console.log("Verify (anon) mv_household row count:", hh?.length ?? 0);
  const tr = global?.total_responses;
  const n = tr == null ? NaN : Number(tr);
  if (n === 0) console.log("✓ total_responses is zero.");
  else console.warn(`⚠ total_responses = ${tr} (expected 0 after clear)`);
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (databaseUrl) {
    const client = new Client({ connectionString: databaseUrl, ssl: { rejectUnauthorized: false } });
    await client.connect();
    try {
      const needs = await schemaNeedsMigration003(client);
      if (needs) await applyMigration003(client);
      else console.log("Schema already has response_items.group_id — skipping migration 003.");
    } finally {
      await client.end();
    }
  } else {
    console.warn("DATABASE_URL not set — skipping migration 003. Apply supabase/migrations/003_basket_groups.sql in SQL Editor if needed.");
  }

  if (!serviceKey) {
    console.error(
      "SUPABASE_SERVICE_ROLE_KEY not set — cannot seed or clear. Add it to .env.local (Supabase → Settings → API)."
    );
    process.exitCode = 1;
  } else {
    await seedAndClear();
  }

  try {
    await verifyAnon();
  } catch (e) {
    console.warn("Verify step failed:", e);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
