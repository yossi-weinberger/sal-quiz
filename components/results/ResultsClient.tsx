"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ScoreBlock } from "./ScoreBlock";
import { ComparisonBar } from "./ComparisonBar";
import { CityContext } from "./CityContext";
import { ShareCard } from "./ShareCard";
import { Separator } from "@/components/ui/separator";
import type { SurveyResult, ComparisonData } from "@/lib/types";
import { HOUSEHOLD_LABELS } from "@/lib/types";
import { formatCurrency, formatPercent, compareToAverage } from "@/lib/calculations";
import resultsContent from "@/content/he/results.json";
import methodologyContent from "@/content/he/methodology.json";
import Link from "next/link";

export function ResultsClient() {
  const router = useRouter();
  const [result, setResult] = useState<SurveyResult | null>(null);
  const [comparison, setComparison] = useState<ComparisonData | null>(null);
  const [showMethodology, setShowMethodology] = useState(false);

  useEffect(() => {
    const raw = sessionStorage.getItem("survey_result");
    if (!raw) {
      router.replace("/");
      return;
    }
    try {
      setResult(JSON.parse(raw) as SurveyResult);
    } catch {
      router.replace("/");
    }
  }, [router]);

  useEffect(() => {
    if (!result) return;
    fetch("/api/responses")
      .then((r) => r.json())
      .then((data) => setComparison(data))
      .catch(() => {});
  }, [result]);

  if (!result) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">טוען תוצאות...</p>
      </div>
    );
  }

  type RawAvg = {
    household_type?: string;
    total_responses: number;
    avg_weighted_match: string | number;
    avg_regular_count: string | number;
    avg_weighted_cost: string | number;
  };

  const householdAvg = (comparison?.household as RawAvg[] | null)?.find(
    (h) => h.household_type === result.householdType
  ) ?? null;

  const globalAvg = (comparison?.global as unknown as RawAvg | null) ?? null;

  const weightedMatchComparison = globalAvg
    ? compareToAverage(result.weightedMatchPercent, Number(globalAvg.avg_weighted_match))
    : null;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Back link */}
        <Link
          href="/"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors mb-8 inline-flex items-center gap-1.5"
        >
          ← חזרה לדף הבית
        </Link>

        {/* Title */}
        <div className="mb-8 mt-4">
          <h1 className="text-2xl sm:text-3xl font-bold leading-tight mb-2">
            {resultsContent.title}
          </h1>
          <p className="text-sm text-muted-foreground">
            {resultsContent.subtitle}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {HOUSEHOLD_LABELS[result.householdType]}
            {result.cityName ? ` · ${result.cityName}` : ""}
          </p>
        </div>

        {/* Main score */}
        <div className="mb-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
            <ScoreBlock
              label={resultsContent.scores.weightedMatch}
              value={formatPercent(result.weightedMatchPercent)}
              subValue={resultsContent.scores.weightedMatchDesc}
              highlight
            />
            <ScoreBlock
              label={resultsContent.scores.regularCountUnit}
              value={`${result.regularCount}`}
              subValue={resultsContent.scores.regularCount}
            />
            <ScoreBlock
              label="קנה לפעמים"
              value={`${result.sometimesCount}`}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <ScoreBlock
              label={resultsContent.scores.regularCost}
              value={formatCurrency(result.regularCost)}
            />
            <ScoreBlock
              label={resultsContent.scores.weightedCost}
              value={formatCurrency(result.weightedCost)}
            />
          </div>
        </div>

        <Separator className="my-6" />

        {/* Comparison section */}
        <div className="mb-6">
          <h2 className="text-base font-semibold mb-4">
            {resultsContent.comparison.title}
          </h2>

          {globalAvg ? (
            <div className="bg-background border border-border rounded-xl divide-y divide-border overflow-hidden">
              <div className="px-4 py-1">
                <ComparisonBar
                  label={`${resultsContent.comparison.weightedMatchLabel} — ${resultsContent.comparison.allUsers}`}
                  userValue={result.weightedMatchPercent}
                  avgValue={globalAvg ? Number(globalAvg.avg_weighted_match) : null}
                  formatter={formatPercent}
                />
                <ComparisonBar
                  label={`${resultsContent.comparison.regularCountLabel} — ${resultsContent.comparison.allUsers}`}
                  userValue={result.regularCount}
                  avgValue={globalAvg ? Number(globalAvg.avg_regular_count) : null}
                  formatter={(v) => `${Math.round(v)} מוצרים`}
                />
                <ComparisonBar
                  label={`${resultsContent.comparison.weightedCostLabel} — ${resultsContent.comparison.allUsers}`}
                  userValue={result.weightedCost}
                  avgValue={globalAvg ? Number(globalAvg.avg_weighted_cost) : null}
                  formatter={formatCurrency}
                  higherIsBetter={false}
                />
              </div>

              {householdAvg && (
                <div className="px-4 py-1 bg-muted/30">
                  <p className="text-xs font-semibold text-muted-foreground pt-3 pb-1">
                    {resultsContent.comparison.householdType}: {HOUSEHOLD_LABELS[result.householdType]}
                  </p>
                  <ComparisonBar
                    label={resultsContent.comparison.weightedMatchLabel}
                    userValue={result.weightedMatchPercent}
                    avgValue={Number(householdAvg.avg_weighted_match)}
                    formatter={formatPercent}
                  />
                  <ComparisonBar
                    label={resultsContent.comparison.regularCountLabel}
                    userValue={result.regularCount}
                    avgValue={Number(householdAvg.avg_regular_count)}
                    formatter={(v) => `${Math.round(v)} מוצרים`}
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="bg-muted/30 border border-border rounded-xl px-4 py-5 text-sm text-muted-foreground text-center">
              {resultsContent.comparison.noDataYet}
            </div>
          )}
        </div>

        <Separator className="my-6" />

        {/* City context */}
        {result.cityName && (
          <div className="mb-6">
            <CityContext
              cityName={result.cityName}
              branches={result.branches}
            />
          </div>
        )}

        <Separator className="my-6" />

        {/* Share section */}
        <div className="mb-6">
          <h2 className="text-base font-semibold mb-4">שתף את התוצאות</h2>
          <ShareCard
            result={result}
            comparisonStatus={weightedMatchComparison}
          />
        </div>

        <Separator className="my-6" />

        {/* Methodology accordion */}
        <div className="mb-8">
          <button
            type="button"
            onClick={() => setShowMethodology((v) => !v)}
            className="w-full flex items-center justify-between py-3 text-sm font-semibold text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg"
            aria-expanded={showMethodology}
          >
            {methodologyContent.title}
            <span className="text-muted-foreground">{showMethodology ? "▲" : "▼"}</span>
          </button>

          {showMethodology && (
            <div className="mt-3 space-y-4 text-sm text-foreground/80 leading-relaxed bg-muted/30 rounded-xl border border-border p-5">
              {methodologyContent.sections.map((section) => (
                <div key={section.title}>
                  <p className="font-semibold text-foreground mb-1">{section.title}</p>
                  {"text" in section && <p>{(section as { text: string }).text}</p>}
                  {"formula" in section && (
                    <p className="font-mono text-xs bg-muted px-3 py-2 rounded-lg mt-1.5 text-foreground">
                      {(section as { formula: string }).formula}
                    </p>
                  )}
                  {"items" in section && (
                    <ul className="list-disc list-inside space-y-1 mt-1">
                      {(section as { items: string[] }).items.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Start again */}
        <div className="text-center">
          <Link
            href="/"
            className="text-sm text-muted-foreground underline underline-offset-2 hover:text-foreground transition-colors"
          >
            חזרה לדף הבית
          </Link>
        </div>
      </div>
    </div>
  );
}
