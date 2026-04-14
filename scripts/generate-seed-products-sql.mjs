/**
 * Writes data/seed_products.sql from data/products.json (100 rows + group_id).
 * Run: node scripts/generate-seed-products-sql.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const productsPath = path.join(root, "data", "products.json");
const outPath = path.join(root, "data", "seed_products.sql");

const raw = JSON.parse(fs.readFileSync(productsPath, "utf8"));

function esc(s) {
  return String(s).replace(/'/g, "''");
}

const rows = raw.map(
  (x) =>
    `(${x.id}, '${esc(x.barcode)}', '${esc(x.name_he)}', ${x.official_price}, '${esc(x.image_path)}', ${x.display_order}, true, ${x.group_id})`
);

const sql =
  "INSERT INTO products (id, barcode, name_he, official_price, image_path, display_order, is_active, group_id) VALUES\n" +
  rows.join(",\n") +
  "\nON CONFLICT (id) DO UPDATE SET\n" +
  "  barcode = EXCLUDED.barcode,\n" +
  "  name_he = EXCLUDED.name_he,\n" +
  "  official_price = EXCLUDED.official_price,\n" +
  "  image_path = EXCLUDED.image_path,\n" +
  "  display_order = EXCLUDED.display_order,\n" +
  "  is_active = EXCLUDED.is_active,\n" +
  "  group_id = EXCLUDED.group_id;\n";

fs.writeFileSync(outPath, sql);
console.log(`Wrote ${raw.length} rows to data/seed_products.sql`);
