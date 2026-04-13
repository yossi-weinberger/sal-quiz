/**
 * Assign group_id on each product line in data/products.json.
 * Diaper lines 35–40 → one group (35); other lines map 1:1 or shifted — see lib/group-ids.ts.
 */
import * as fs from "fs";
import * as path from "path";
import { productToGroupId } from "../lib/group-ids";

const root = path.resolve(__dirname, "..");
const productsPath = path.join(root, "data", "products.json");

interface RawProduct {
  id: number;
  barcode: string;
  name_he: string;
  official_price: number;
  image_path: string;
  display_order: number;
  is_active: boolean;
}

function main() {
  const raw = JSON.parse(fs.readFileSync(productsPath, "utf8")) as RawProduct[];
  const withGroup = raw.map((p) => ({
    ...p,
    group_id: productToGroupId(p.id),
  }));

  fs.writeFileSync(productsPath, JSON.stringify(withGroup, null, 2) + "\n");

  const n = new Set(withGroup.map((p) => p.group_id)).size;
  console.log(`Updated data/products.json — ${withGroup.length} lines, ${n} survey groups.`);
}

main();
