import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Answer, HouseholdType } from "@/lib/types";

const VALID_HOUSEHOLD_TYPES: HouseholdType[] = [
  "single", "couple", "couple_kids", "large_family",
];
const VALID_ANSWERS: Answer[] = ["regular", "sometimes", "no"];
const TOTAL_PRODUCTS = 107;

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

function validatePayload(body: SubmitPayload): string | null {
  if (!VALID_HOUSEHOLD_TYPES.includes(body.householdType)) {
    return "Invalid household type";
  }
  if (
    typeof body.weightedMatchPercent !== "number" ||
    body.weightedMatchPercent < 0 ||
    body.weightedMatchPercent > 100
  ) {
    return "Invalid weighted match percent";
  }
  const answers = body.answers ?? {};
  const answerCount = Object.keys(answers).length;
  if (answerCount !== TOTAL_PRODUCTS) {
    return `Expected ${TOTAL_PRODUCTS} answers, got ${answerCount}`;
  }
  for (const [id, val] of Object.entries(answers)) {
    const productId = parseInt(id, 10);
    if (isNaN(productId) || productId < 1 || productId > TOTAL_PRODUCTS) {
      return `Invalid product id: ${id}`;
    }
    if (!VALID_ANSWERS.includes(val)) {
      return `Invalid answer value: ${val}`;
    }
  }
  const countSum =
    (body.regularCount ?? 0) +
    (body.sometimesCount ?? 0) +
    (body.notBuyCount ?? 0);
  if (countSum !== TOTAL_PRODUCTS) {
    return `Count sum mismatch: ${countSum}`;
  }
  if (body.cityName && typeof body.cityName !== "string") {
    return "Invalid city name";
  }
  if (body.cityName && body.cityName.length > 100) {
    return "City name too long";
  }
  return null;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as SubmitPayload;

    const validationError = validatePayload(body);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const supabase = getSupabase();

    const { data: response, error: responseError } = await supabase
      .from("responses")
      .insert({
        household_type: body.householdType,
        city_name: body.cityName ?? null,
        normalized_city_name: body.normalizedCityName ?? null,
        has_branch_in_city: body.hasBranchInCity ?? null,
        branch_count: body.branchCount ?? null,
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
    }));

    const { error: itemsError } = await supabase
      .from("response_items")
      .insert(items);

    if (itemsError) {
      // Log but don't fail — aggregate data is already saved
      console.error("Response items insert error:", itemsError);
    }

    return NextResponse.json({ id: response.id });
  } catch (err) {
    console.error("API route error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const supabase = getSupabase();

    const [globalResult, householdResult] = await Promise.all([
      supabase.from("mv_global_averages").select("*").single(),
      supabase.from("mv_household_averages").select("*"),
    ]);

    return NextResponse.json({
      global: globalResult.data,
      household: householdResult.data,
    });
  } catch (err) {
    console.error("GET aggregate error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
