export type Answer = "regular" | "sometimes" | "no";

export type HouseholdType =
  | "single"
  | "couple"
  | "couple_kids"
  | "large_family";

export interface Product {
  id: number;
  /** Survey group — one answer covers all product lines in this group. */
  group_id: number;
  barcode: string;
  name_he: string;
  official_price: number;
  image_path: string;
  display_order: number;
  is_active: boolean;
}

/** One survey card: display fields for a group_id (from products + diaper label). */
export interface BasketGroupRow {
  id: number;
  name_he: string;
  display_order: number;
  image_path: string;
}

/** Group + computed price for UI + product line ids for Rami Levy / DB. */
export interface BasketLine extends BasketGroupRow {
  official_price: number;
  product_ids: number[];
}

export interface Branch {
  id: number;
  format_type: string;
  branch_name: string;
  city_name: string;
  address: string;
  normalized_city_name: string;
}

export interface SurveyDraft {
  householdType: HouseholdType;
  cityName: string | null;
  answers: Record<number, Answer>;
  startedAt: string;
  lastSavedAt: string;
}

export interface SurveyResult {
  householdType: HouseholdType;
  cityName: string | null;
  /** Keys = basket group ids (not product line ids). */
  answers: Record<number, Answer>;
  regularCount: number;
  sometimesCount: number;
  notBuyCount: number;
  weightedMatchPercent: number;
  /** Sum of prices for products marked "regular" only */
  regularCost: number;
  /** Sum of prices for products marked "regular" OR "sometimes" (all at full price) */
  maxCost: number;
  /** Kept for DB analytics only — regular×1.0 + sometimes×0.5 */
  weightedCost: number;
  hasBranchInCity: boolean | null;
  branchCount: number | null;
  branches: Branch[];
}

export interface AggregateStats {
  totalResponses: number;
  avgWeightedMatch: number;
  avgRegularCount: number;
  avgWeightedCost: number;
}

export interface ComparisonData {
  global: AggregateStats;
  household: AggregateStats | null;
}

export const ANSWER_WEIGHT: Record<Answer, number> = {
  regular: 1.0,
  sometimes: 0.5,
  no: 0.0,
};

export const HOUSEHOLD_LABELS: Record<HouseholdType, string> = {
  single: "יחיד/ה",
  couple: "זוג",
  couple_kids: "זוג עם ילדים",
  large_family: "משפחה מרובת ילדים",
};
