/**
 * Rebuild data/products.json to 100 lines: merge Nutrilion 22–24 and diapers 35–40.
 * Run: npx tsx scripts/rebuild-products-100.ts
 */
import * as fs from "fs";
import * as path from "path";

const root = path.resolve(__dirname, "..");
const productsPath = path.join(root, "data", "products.json");

interface P {
  id: number;
  barcode: string;
  extra_barcodes?: string[];
  name_he: string;
  official_price: number;
  image_path: string;
  display_order: number;
  is_active: boolean;
  group_id?: number;
}

function main() {
  const raw = JSON.parse(fs.readFileSync(productsPath, "utf8")) as P[];
  if (raw.length === 100) {
    console.error(
      "products.json already has 100 rows. Restore a 107-line catalog copy, then re-run."
    );
    process.exit(1);
  }
  const byId = new Map(raw.map((p) => [p.id, p]));

  const out: P[] = [];

  for (let oldId = 1; oldId <= 21; oldId++) {
    const p = byId.get(oldId)!;
    const nid = out.length + 1;
    out.push({
      ...p,
      id: nid,
      display_order: nid,
      group_id: nid,
    });
  }

  // Nutrilion 22–24 -> one
  const n22 = byId.get(22)!;
  const n23 = byId.get(23)!;
  const n24 = byId.get(24)!;
  const nutSum =
    Math.round((n22.official_price + n23.official_price + n24.official_price) * 100) / 100;
  const nidN = out.length + 1;
  out.push({
    id: nidN,
    barcode: n22.barcode,
    extra_barcodes: [n23.barcode, n24.barcode],
    name_he: "נוטרילון שלבים 1–3 — 800 גרם (סל רשמי)",
    official_price: nutSum,
    image_path: "/products/22.jpg",
    display_order: nidN,
    is_active: true,
    group_id: nidN,
  });

  for (let oldId = 25; oldId <= 34; oldId++) {
    const p = byId.get(oldId)!;
    const nid = out.length + 1;
    out.push({
      ...p,
      id: nid,
      display_order: nid,
      group_id: nid,
    });
  }

  // Diapers 35–40 -> one
  const d35 = byId.get(35)!;
  let dSum = 0;
  for (let oid = 35; oid <= 40; oid++) {
    dSum += byId.get(oid)!.official_price;
  }
  dSum = Math.round(dSum * 100) / 100;
  const diaperExtras: string[] = [];
  for (let oid = 36; oid <= 40; oid++) {
    diaperExtras.push(byId.get(oid)!.barcode);
  }
  const nidD = out.length + 1;
  out.push({
    id: nidD,
    barcode: d35.barcode,
    extra_barcodes: diaperExtras,
    name_he: "חיתולים — האגיס פרידום (מגוון מידות בסל הרשמי)",
    official_price: dSum,
    image_path: "/products/35.jpg",
    display_order: nidD,
    is_active: true,
    group_id: nidD,
  });

  for (let oldId = 41; oldId <= 107; oldId++) {
    const p = byId.get(oldId)!;
    const nid = out.length + 1;
    out.push({
      ...p,
      id: nid,
      display_order: nid,
      group_id: nid,
    });
  }

  if (out.length !== 100) {
    throw new Error(`Expected 100 products, got ${out.length}`);
  }

  fs.writeFileSync(productsPath, JSON.stringify(out, null, 2) + "\n");
  console.log("Wrote 100 products to data/products.json");
}

main();
