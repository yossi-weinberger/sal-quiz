/**
 * Seed products and branches into Supabase.
 * Run AFTER creating the Supabase project and running the migration SQL.
 *
 * Run: npx tsx scripts/seed-supabase.ts
 *
 * Requires: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local
 */

import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

async function seedProducts() {
  const products = JSON.parse(
    fs.readFileSync(path.join(process.cwd(), "data", "products.json"), "utf-8")
  );

  const { error } = await supabase
    .from("products")
    .upsert(products, { onConflict: "id" });

  if (error) throw new Error(`Products seed failed: ${error.message}`);
  console.log(`✓ Seeded ${products.length} products`);
}

async function seedBranches() {
  const branches = JSON.parse(
    fs.readFileSync(path.join(process.cwd(), "data", "branches.json"), "utf-8")
  );

  const { error } = await supabase
    .from("branches")
    .upsert(branches, { onConflict: "id" });

  if (error) throw new Error(`Branches seed failed: ${error.message}`);
  console.log(`✓ Seeded ${branches.length} branches`);
}

async function main() {
  console.log("Seeding Supabase...");
  await seedProducts();
  await seedBranches();
  console.log("✓ Done!");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
