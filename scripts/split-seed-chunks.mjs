import fs from "fs";

const s = fs.readFileSync("data/seed_products.sql", "utf8");
const body = s
  .replace(/^INSERT[\s\S]+?VALUES\s*/i, "")
  .replace(/\s*ON CONFLICT[\s\S]+$/, "");
const tuples = body.split(/\),\s*\r?\n\s*\(/).map((t, i, a) => {
  let x = t.trim();
  if (i > 0) x = "(" + x;
  if (i < a.length - 1) x = x + ")";
  return x;
});
const n = 25;
const chunks = Math.ceil(tuples.length / n);
for (let k = 0; k < chunks; k++) {
  const slice = tuples.slice(k * n, (k + 1) * n).join(",\n");
  const sql =
    "INSERT INTO products (id, barcode, name_he, official_price, image_path, display_order, is_active, group_id) VALUES\n" +
    slice +
    "\nON CONFLICT (id) DO UPDATE SET barcode = EXCLUDED.barcode, name_he = EXCLUDED.name_he, official_price = EXCLUDED.official_price, image_path = EXCLUDED.image_path, display_order = EXCLUDED.display_order, is_active = EXCLUDED.is_active, group_id = EXCLUDED.group_id;";
  fs.writeFileSync(`seed-chunk-${k + 1}.sql`, sql);
}
console.log("tuples", tuples.length, "chunks", chunks);
