/**
 * Import products from Excel file into data/products.json
 *
 * Run: npx tsx scripts/import-products.ts
 *
 * Excel structure (sal-products.xlsx):
 * - Row 4: headers (col A=index, B=barcode, C=name, D=price)
 * - Rows 5+: product data
 */

import * as xlsx from "xlsx";
import * as fs from "fs";
import * as path from "path";

interface Product {
  id: number;
  barcode: string;
  name_he: string;
  official_price: number;
  image_path: string;
  display_order: number;
  is_active: boolean;
}

const EXCEL_PATH = path.join(process.cwd(), "sal-products.xlsx");
const OUTPUT_PATH = path.join(process.cwd(), "data", "products.json");
const DATA_DIR = path.join(process.cwd(), "data");

function main() {
  if (!fs.existsSync(EXCEL_PATH)) {
    console.error(`Excel file not found at: ${EXCEL_PATH}`);
    process.exit(1);
  }

  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  const workbook = xlsx.readFile(EXCEL_PATH);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = xlsx.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    defval: null,
  }) as unknown[][];

  const products: Product[] = [];
  let totalPrice = 0;

  // Find the header row (contains "ברקוד" or numeric index in col A)
  // Data rows have a number in column A
  let dataStart = 0;
  for (let i = 0; i < rows.length; i++) {
    const col0 = rows[i][0];
    if (col0 !== null && col0 !== undefined && !isNaN(Number(col0)) && Number(col0) === 1) {
      dataStart = i;
      break;
    }
  }

  for (let i = dataStart; i < rows.length; i++) {
    const row = rows[i];
    const indexVal = row[0];
    if (indexVal === null || indexVal === undefined) continue;

    const idx = Number(indexVal);
    if (isNaN(idx) || idx <= 0) continue;

    const barcode = String(row[1] ?? "").trim();
    const name = String(row[2] ?? "").trim();
    const price = parseFloat(String(row[3] ?? "0")) || 0;

    if (!name) continue;

    totalPrice += price;

    products.push({
      id: idx,
      barcode,
      name_he: name,
      official_price: price,
      image_path: `/products/${idx}.jpg`,
      display_order: idx,
      is_active: true,
    });
  }

  products.sort((a, b) => a.display_order - b.display_order);

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(products, null, 2), "utf-8");

  console.log(`✓ Imported ${products.length} products`);
  console.log(`✓ Total basket price: ₪${totalPrice.toFixed(2)}`);
  console.log(`✓ Written to ${OUTPUT_PATH}`);
}

main();
