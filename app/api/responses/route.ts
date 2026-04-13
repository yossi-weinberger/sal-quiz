import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Answer, HouseholdType } from "@/lib/types";
import { ANSWER_WEIGHT } from "@/lib/types";

// Use anon key for server-side calls - RLS policies allow anon insert/select
function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

interface SubmitPayload {
  householdType: HouseholdType;
  cityName: string | null;
  normalizedCityName: string | null;
  hasBranchInCity: boolean | null;
  branchCount: number | null;
  weightedMatchPercent: number;
  regularCount: number;
  sometimesCount: number;
  notBuyCount: number;
  regularCost: number;
  weightedCost: number;
  answers: Record<string, Answer>;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as SubmitPayload;

    if (!body.householdType || typeof body.weightedMatchPercent !== "number") {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    if (Object.keys(body.answers ?? {}).length < 107) {
      return NextResponse.json(
        { error: "Survey not complete" },
        { status: 400 }
      );
    }

    const supabase = getSupabase();

    const { data: response, error: responseError } = await supabase
      .from("responses")
      .insert({
        household_type: body.householdType,
        city_name: body.cityName,
        normalized_city_name: body.normalizedCityName,
        has_branch_in_city: body.hasBranchInCity,
        branch_count: body.branchCount,
        weighted_match_percent: body.weightedMatchPercent,
        regular_count: body.regularCount,
        sometimes_count: body.sometimesCount,
        not_buy_count: body.notBuyCount,
        regular_cost: body.regularCost,
        weighted_cost: body.weightedCost,
        source: "web",
      })
      .select("id")
      .single();

    if (responseError || !response) {
      console.error("Response insert error:", responseError);
      return NextResponse.json(
        { error: "Failed to save response" },
        { status: 500 }
      );
    }

    const items = Object.entries(body.answers).map(([productId, answer]) => ({
      response_id: response.id,
      product_id: parseInt(productId, 10),
      answer_value: answer,
      answer_numeric: ANSWER_WEIGHT[answer],
    }));

    const { error: itemsError } = await supabase
      .from("response_items")
      .insert(items);

    if (itemsError) {
      console.error("Response items insert error:", itemsError);
    }

    return NextResponse.json({ id: response.id });
  } catch (err) {
    console.error("API route error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const supabase = getSupabase();

    const [globalResult, householdResult] = await Promise.all([
      supabase.from("v_global_averages").select("*").single(),
      supabase.from("v_household_averages").select("*"),
    ]);

    return NextResponse.json({
      global: globalResult.data,
      household: householdResult.data,
    });
  } catch (err) {
    console.error("GET aggregate error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
