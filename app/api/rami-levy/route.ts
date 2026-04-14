import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { limitApiRead } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/request-ip";

interface RamiLevyRow {
  product_id: number;
  barcode: string;
  rami_levy_price: number | null;
  is_available: boolean;
  fetched_at: string;
  products: { official_price: number; name_he: string } | null;
}

export async function GET(req: NextRequest) {
  const ip = getClientIp(req);
  const rl = await limitApiRead(ip);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many requests" },
      {
        status: 429,
        headers: {
          "Retry-After": String(
            Math.max(1, Math.ceil((rl.reset - Date.now()) / 1000))
          ),
        },
      }
    );
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data, error } = await supabase
    .from("rami_levy_prices")
    .select("product_id, barcode, rami_levy_price, is_available, fetched_at, products(official_price, name_he)")
    .order("product_id");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const priceMap: Record<number, {
    product_id: number;
    rami_levy_price: number | null;
    official_price: number;
    name_he: string;
    is_available: boolean;
  }> = {};
  let fetchedAt: string | null = null;

  for (const row of data as unknown as RamiLevyRow[]) {
    priceMap[row.product_id] = {
      product_id: row.product_id,
      rami_levy_price: row.rami_levy_price,
      official_price: row.products?.official_price ?? 0,
      name_he: row.products?.name_he ?? "",
      is_available: row.is_available,
    };
    if (!fetchedAt && row.fetched_at) fetchedAt = row.fetched_at;
  }

  return NextResponse.json({ prices: priceMap, fetched_at: fetchedAt });
}
