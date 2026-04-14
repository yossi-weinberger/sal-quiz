import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Answer, HouseholdType } from "@/lib/types";
import { TOTAL_GROUPS, BASKET_GROUP_META } from "@/lib/basket-data";
import { limitApiRead, limitSurveySubmit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/request-ip";

const VALID_HOUSEHOLD_TYPES: HouseholdType[] = [
  "single", "couple", "couple_kids", "large_family",
];
const VALID_ANSWERS: Answer[] = ["regular", "sometimes", "no"];
const VALID_GROUP_IDS = new Set(BASKET_GROUP_META.map((g) => g.id));

const MAX_BODY_BYTES = 600_000;

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

function getSupabaseService() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
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
  if (answerCount !== TOTAL_GROUPS) {
    return `Expected ${TOTAL_GROUPS} answers, got ${answerCount}`;
  }
  for (const [id, val] of Object.entries(answers)) {
    const groupId = parseInt(id, 10);
    if (isNaN(groupId) || !VALID_GROUP_IDS.has(groupId)) {
      return `Invalid group id: ${id}`;
    }
    if (!VALID_ANSWERS.includes(val)) {
      return `Invalid answer value: ${val}`;
    }
  }
  const countSum =
    (body.regularCount ?? 0) +
    (body.sometimesCount ?? 0) +
    (body.notBuyCount ?? 0);
  if (countSum !== TOTAL_GROUPS) {
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
    const ip = getClientIp(req);
    const rl = await limitSurveySubmit(ip);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Too many submissions. Try again later." },
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

    const contentLength = req.headers.get("content-length");
    if (contentLength) {
      const n = parseInt(contentLength, 10);
      if (!Number.isNaN(n) && n > MAX_BODY_BYTES) {
        return NextResponse.json({ error: "Payload too large" }, { status: 413 });
      }
    }

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

    const items = Object.entries(body.answers).map(([groupId, answer]) => ({
      response_id: response.id,
      group_id: parseInt(groupId, 10),
      answer_value: answer,
    }));

    const { error: itemsError } = await supabase
      .from("response_items")
      .insert(items);

    if (itemsError) {
      console.error("Response items insert error:", itemsError);
      const admin = getSupabaseService();
      if (admin) {
        await admin.from("responses").delete().eq("id", response.id);
      }
      return NextResponse.json(
        { error: "Failed to save response" },
        { status: 500 }
      );
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

export async function GET(req: NextRequest) {
  try {
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
