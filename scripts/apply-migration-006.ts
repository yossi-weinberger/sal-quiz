/**
 * Apply supabase/migrations/006_revoke_refresh_rpc_from_clients.sql via Supabase CLI.
 *
 * Requires DATABASE_URL in .env.local or .env (Supabase Dashboard → Database → URI, session mode).
 *
 * Run: npx tsx scripts/apply-migration-006.ts
 */

import * as dotenv from "dotenv";
import { spawnSync } from "child_process";
import * as path from "path";
import * as fs from "fs";

dotenv.config({ path: ".env" });
dotenv.config({ path: ".env.local" });

const root = path.resolve(__dirname, "..");
const sqlPath = path.join(
  root,
  "supabase",
  "migrations",
  "006_revoke_refresh_rpc_from_clients.sql"
);

function main() {
  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (!databaseUrl) {
    console.error(
      "Missing DATABASE_URL. Add to .env.local (or .env): Postgres URI from Supabase → Settings → Database → Connection string (URI)."
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
  console.log("✓ Migration 006 applied.");
}

main();
