"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CitySearch } from "@/components/shared/CitySearch";
import type { HouseholdType } from "@/lib/types";
import homeContent from "@/content/he/home.json";

interface LandingFormProps {
  cities: string[];
  carrefourCities?: string[];
}

const HOUSEHOLD_OPTIONS: {
  type: HouseholdType;
  label: string;
  icon: React.ReactNode;
}[] = [
  {
    type: "single",
    label: "יחיד/ה",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
        <circle cx="10" cy="6" r="3.5" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M3 18c0-3.866 3.134-7 7-7s7 3.134 7 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    type: "couple",
    label: "זוג",
    icon: (
      <svg width="22" height="20" viewBox="0 0 22 20" fill="none" aria-hidden>
        <circle cx="8" cy="6" r="3" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M1 18c0-3.314 3.134-6 7-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        <circle cx="14" cy="6" r="3" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M21 18c0-3.314-3.134-6-7-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    type: "couple_kids",
    label: "זוג עם ילדים",
    icon: (
      <svg width="24" height="20" viewBox="0 0 24 20" fill="none" aria-hidden>
        <circle cx="9" cy="5.5" r="2.8" stroke="currentColor" strokeWidth="1.4"/>
        <path d="M2 18c0-3 2.8-5.5 7-5.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
        <circle cx="15" cy="5.5" r="2.8" stroke="currentColor" strokeWidth="1.4"/>
        <path d="M22 18c0-3-2.8-5.5-7-5.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
        <circle cx="12" cy="13" r="2" stroke="currentColor" strokeWidth="1.3"/>
        <path d="M8 19c0-2 1.8-3.5 4-3.5s4 1.5 4 3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    type: "large_family",
    label: "משפחה גדולה",
    icon: (
      <svg width="28" height="20" viewBox="0 0 28 20" fill="none" aria-hidden>
        <circle cx="9" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.3"/>
        <path d="M2 18c0-2.8 3.1-5 7-5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
        <circle cx="19" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.3"/>
        <path d="M26 18c0-2.8-3.1-5-7-5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
        <circle cx="11" cy="12.5" r="1.8" stroke="currentColor" strokeWidth="1.2"/>
        <circle cx="14" cy="12.5" r="1.8" stroke="currentColor" strokeWidth="1.2"/>
        <circle cx="17" cy="12.5" r="1.8" stroke="currentColor" strokeWidth="1.2"/>
        <path d="M8 19.5c0-1.8 1.3-3 3-3h6c1.7 0 3 1.2 3 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
      </svg>
    ),
  },
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
          {HOUSEHOLD_OPTIONS.map(({ type, label, icon }) => {
            const active = householdType === type;
            return (
              <button
                key={type}
                type="button"
                onClick={() => setHouseholdType(type)}
                style={active
                  ? { background: "#A82323", borderColor: "#A82323", color: "#ffffff" }
                  : { background: "rgba(255,255,255,0.6)", borderColor: "var(--border)", color: "var(--foreground)" }
                }
                className="flex items-center gap-2.5 px-4 py-3 rounded-xl border text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring hover:scale-[1.02] active:scale-[0.97] cursor-pointer"
                aria-pressed={active}
              >
                <span style={{ opacity: active ? 1 : 0.5 }}>
                  {icon}
                </span>
                {label}
              </button>
            );
          })}
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
        <p className="text-xs text-muted-foreground mt-1.5">{homeContent.form.cityHelp}</p>
      </div>

      {/* Start button */}
      <button
        type="button"
        onClick={handleStart}
        disabled={!householdType || submitted}
        style={{
          background: householdType && !submitted ? "#A82323" : undefined,
          color: householdType && !submitted ? "#ffffff" : undefined,
        }}
        className="w-full h-12 rounded-xl text-base font-semibold border border-border transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {submitted ? "טוען..." : "התחל בדיקה"}
      </button>
    </div>
  );
}
