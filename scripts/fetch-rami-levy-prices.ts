/**
 * Fetch Rami Levy prices for all basket products by barcode.
 * Stores results in Supabase rami_levy_prices table.
 *
 * Run: npx tsx scripts/fetch-rami-levy-prices.ts
 */

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import productsData from "../data/products.json";

dotenv.config({ path: ".env.local" });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

interface Product {
  id: number;
  barcode: string;
  extra_barcodes?: string[];
  name_he: string;
  official_price: number;
}

interface RamiLevyResult {
  product_id: number;
  barcode: string;
  rami_levy_price: number | null;
  is_available: boolean;
}

const HEADERS = {
  Accept: "application/json",
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Referer: "https://www.rami-levy.co.il/",
};

async function fetchRamiLevyPrice(
  barcode: string
): Promise<{ price: number | null; available: boolean }> {
  try {
    const url = `https://www.rami-levy.co.il/api/search?q=${encodeURIComponent(barcode)}`;
    const res = await fetch(url, { headers: HEADERS });
    if (!res.ok) return { price: null, available: false };

    const data = (await res.json()) as {
      status: number;
      total: number;
      data: Array<{
        barcode: string;
        price: { price: number } | null;
        id: number;
      }>;
    };

    if (data.status !== 200 || !data.data?.length) {
      return { price: null, available: false };
    }

    // Find exact barcode match
    const match = data.data.find((p) => p.barcode === barcode) ?? data.data[0];
    const price = match?.price?.price ?? null;

    return { price, available: price !== null };
  } catch {
    return { price: null, available: false };
  }
}

async function main() {
  const supabase = createClient(SUPABASE_URL, ANON_KEY);
  const products = productsData as Product[];

  console.log(`Fetching Rami Levy prices for ${products.length} products...`);

  const results: RamiLevyResult[] = [];
  let found = 0;
  let notFound = 0;

  for (let i = 0; i < products.length; i++) {
    const product = products[i];
    const candidates = [product.barcode, ...(product.extra_barcodes ?? [])];
    let price: number | null = null;
    let available = false;
    let matchedBarcode = product.barcode;
    for (let c = 0; c < candidates.length; c++) {
      const bc = candidates[c]!;
      const r = await fetchRamiLevyPrice(bc);
      if (r.available && r.price !== null) {
        price = r.price;
        available = true;
        matchedBarcode = bc;
        break;
      }
      if (c < candidates.length - 1) {
        await new Promise((res) => setTimeout(res, 100));
      }
    }

    results.push({
      product_id: product.id,
      barcode: matchedBarcode,
      rami_levy_price: price,
      is_available: available,
    });

    if (available) {
      found++;
      const diff = price! - product.official_price;
      const sign = diff >= 0 ? "+" : "";
      console.log(
        `[${i + 1}/${products.length}] ✓ ${product.name_he.slice(0, 30).padEnd(30)} Official:₪${product.official_price.toFixed(2)}  RL:₪${price?.toFixed(2)}  (${sign}${diff.toFixed(2)})`
      );
    } else {
      notFound++;
      console.log(
        `[${i + 1}/${products.length}] ✗ ${product.name_he.slice(0, 40)} — not found`
      );
    }

    // Rate limit: 150ms between requests
    if (i < products.length - 1) {
      await new Promise((r) => setTimeout(r, 150));
    }
  }

  console.log(`\n✓ Found: ${found}  ✗ Not found: ${notFound}`);

  // Upsert to Supabase
  // Delete old prices first
  await supabase.from("rami_levy_prices").delete().gte("id", 0);

  const { error } = await supabase.from("rami_levy_prices").insert(results);
  if (error) {
    console.error("Supabase insert error:", error.message);
    process.exit(1);
  }

  // Summary
  const available = results.filter((r) => r.is_available);
  if (available.length > 0) {
    const officialTotal = products.reduce((s, p) => s + p.official_price, 0);
    const rlTotal = available.reduce((s, r) => s + (r.rami_levy_price ?? 0), 0);
    const officialForAvailable = products
      .filter((p) => available.find((r) => r.product_id === p.id))
      .reduce((s, p) => s + p.official_price, 0);

    console.log(`\n── Summary ──────────────────────`);
    console.log(`Products in official basket: ${products.length}  Total: ₪${officialTotal.toFixed(2)}`);
    console.log(`Found at Rami Levy: ${available.length}`);
    console.log(
      `Official price (found items): ₪${officialForAvailable.toFixed(2)}`
    );
    console.log(`Rami Levy price (found items): ₪${rlTotal.toFixed(2)}`);
    console.log(
      `Difference: ${rlTotal > officialForAvailable ? "+" : ""}₪${(rlTotal - officialForAvailable).toFixed(2)}`
    );
  }

  console.log("\n✓ Saved to Supabase");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
