/**
 * Apply supabase/migrations/004_basket_100_products.sql via Supabase CLI.
 *
 * Requires DATABASE_URL in .env.local (Supabase Dashboard → Database → URI, session mode).
 *
 * Run: npx tsx scripts/apply-migration-004.ts
 */

import * as dotenv from "dotenv";
import { spawnSync } from "child_process";
import * as path from "path";
import * as fs from "fs";

dotenv.config({ path: ".env.local" });

const root = path.resolve(__dirname, "..");
const sqlPath = path.join(root, "supabase", "migrations", "004_basket_100_products.sql");

function main() {
  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (!databaseUrl) {
    console.error(
      "Missing DATABASE_URL in .env.local. Add the Postgres URI from Supabase → Settings → Database → Connection string (URI)."
    );
    process.exit(1);
  }
  if (!fs.existsSync(sqlPath)) {
    console.error(`File not found: ${sqlPath}`);
    process.exit(1);
  }

  const r = spawnSync(
    "npx",
    ["supabase", "db", "query", "-f", sqlPath, "--db-url", databaseUrl],
    { stdio: "inherit", cwd: root, shell: true }
  );
  if (r.status !== 0) {
    process.exit(r.status ?? 1);
  }
  console.log("✓ Migration 004 applied.");
}

main();
