import type { Answer, Product, SurveyResult, HouseholdType, Branch } from "./types";
import { ANSWER_WEIGHT } from "./types";

export const TOTAL_PRODUCTS = 107;

export function calcWeightedMatch(
  answers: Record<number, Answer>,
  total = TOTAL_PRODUCTS
): number {
  const sum = Object.values(answers).reduce(
    (acc, a) => acc + ANSWER_WEIGHT[a],
    0
  );
  return (sum / total) * 100;
}

export function calcCounts(answers: Record<number, Answer>): {
  regular: number;
  sometimes: number;
  no: number;
} {
  let regular = 0;
  let sometimes = 0;
  let no = 0;
  for (const a of Object.values(answers)) {
    if (a === "regular") regular++;
    else if (a === "sometimes") sometimes++;
    else no++;
  }
  return { regular, sometimes, no };
}

export function calcCosts(
  answers: Record<number, Answer>,
  products: Product[]
): {
  /** Products marked "regular" at full price — your definite basket */
  regular: number;
  /** Products marked "regular" OR "sometimes" at full price — maximum basket */
  max: number;
  /** Kept for analytics: regular×1.0 + sometimes×0.5 */
  weighted: number;
} {
  let regular = 0;
  let max = 0;
  let weighted = 0;

  for (const product of products) {
    const answer = answers[product.id];
    if (!answer || answer === "no") continue;

    const p = product.official_price;
    if (answer === "regular") {
      regular += p;
      max += p;
      weighted += p; // × 1.0
    } else {
      // "sometimes"
      max += p;         // full price in max basket
      weighted += p * 0.5; // half price in weighted
    }
  }

  return {
    regular: Math.round(regular * 100) / 100,
    max: Math.round(max * 100) / 100,
    weighted: Math.round(weighted * 100) / 100,
  };
}

export function buildSurveyResult(
  householdType: HouseholdType,
  cityName: string | null,
  answers: Record<number, Answer>,
  products: Product[],
  cityBranches: Branch[]
): SurveyResult {
  const counts = calcCounts(answers);
  const weightedMatchPercent = calcWeightedMatch(answers);
  const costs = calcCosts(answers, products);

  return {
    householdType,
    cityName,
    answers,
    regularCount: counts.regular,
    sometimesCount: counts.sometimes,
    notBuyCount: counts.no,
    weightedMatchPercent: Math.round(weightedMatchPercent * 10) / 10,
    regularCost: costs.regular,
    maxCost: costs.max,
    weightedCost: costs.weighted,
    hasBranchInCity: cityName ? cityBranches.length > 0 : null,
    branchCount: cityName ? cityBranches.length : null,
    branches: cityBranches,
  };
}

export function formatPercent(value: number): string {
  return `${Math.round(value * 10) / 10}%`;
}

export function formatCurrency(value: number): string {
  return `₪${value.toLocaleString("he-IL", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function compareToAverage(
  userValue: number,
  avgValue: number
): "above" | "below" | "at" {
  const diff = userValue - avgValue;
  if (Math.abs(diff) < 1) return "at";
  return diff > 0 ? "above" : "below";
}
