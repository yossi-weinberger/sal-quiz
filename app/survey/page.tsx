import { SurveyClient } from "@/components/survey/SurveyClient";
import productsData from "@/data/products.json";
import type { Product } from "@/lib/types";
import { redirect } from "next/navigation";

interface PageProps {
  searchParams: Promise<{ household?: string; city?: string }>;
}

const VALID_HOUSEHOLD_TYPES = ["single", "couple", "couple_kids", "large_family"];

export default async function SurveyPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const household = params.household;
  const city = params.city ?? null;

  if (!household || !VALID_HOUSEHOLD_TYPES.includes(household)) {
    redirect("/");
  }

  const products = (productsData as Product[]).filter((p) => p.is_active);

  return (
    <SurveyClient
      products={products}
      householdType={household as "single" | "couple" | "couple_kids" | "large_family"}
      cityName={city}
    />
  );
}
