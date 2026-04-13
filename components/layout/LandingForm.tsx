"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CitySearch } from "@/components/shared/CitySearch";
import type { HouseholdType } from "@/lib/types";
import { HOUSEHOLD_LABELS } from "@/lib/types";
import homeContent from "@/content/he/home.json";

interface LandingFormProps {
  cities: string[];
  carrefourCities?: string[];
}

const HOUSEHOLD_TYPES: HouseholdType[] = [
  "single",
  "couple",
  "couple_kids",
  "large_family",
];

export function LandingForm({ cities, carrefourCities = [] }: LandingFormProps) {
  const router = useRouter();
  const [householdType, setHouseholdType] = useState<HouseholdType | null>(null);
  const [city, setCity] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  function handleStart() {
    if (!householdType) return;
    setSubmitted(true);
    const params = new URLSearchParams();
    params.set("household", householdType);
    if (city) params.set("city", city);
    router.push(`/survey?${params.toString()}`);
  }

  return (
    <div className="w-full space-y-5">
      {/* Household type */}
      <fieldset>
        <legend className="text-sm font-semibold mb-2.5 block">
          {homeContent.form.householdTypeLabel}
          <span className="text-destructive mr-1">*</span>
        </legend>
        <div className="grid grid-cols-2 gap-2">
          {HOUSEHOLD_TYPES.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setHouseholdType(type)}
              className={`
                h-11 px-4 rounded-lg border text-sm font-medium transition-all
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
                ${
                  householdType === type
                    ? "border-foreground bg-foreground text-background"
                    : "border-border bg-background text-foreground hover:border-foreground/40"
                }
              `}
              aria-pressed={householdType === type}
            >
              {HOUSEHOLD_LABELS[type]}
            </button>
          ))}
        </div>
        {submitted && !householdType && (
          <p className="text-destructive text-xs mt-1.5">
            {homeContent.form.householdTypeRequired}
          </p>
        )}
      </fieldset>

      {/* City (optional) */}
      <div>
        <label className="text-sm font-semibold mb-2.5 flex items-center gap-1.5">
          {homeContent.form.cityLabel}
          <span className="text-muted-foreground text-xs font-normal">
            {homeContent.form.cityOptional}
          </span>
        </label>
        <CitySearch
          cities={cities}
          carrefourCities={carrefourCities}
          value={city}
          onChange={setCity}
          placeholder={homeContent.form.cityPlaceholder}
        />
        <p className="text-xs text-muted-foreground mt-1.5">
          {homeContent.form.cityHelp}
        </p>
      </div>

      {/* Start button */}
      <Button
        size="lg"
        className="w-full h-12 text-base font-semibold"
        onClick={handleStart}
        disabled={!householdType || submitted}
      >
        {submitted ? "טוען..." : "התחל בדיקה"}
      </Button>
    </div>
  );
}
