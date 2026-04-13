"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnswerDonut } from "./AnswerDonut";
import { ComparisonBar } from "./ComparisonBar";
import { CityContext } from "./CityContext";
import { ShareCard } from "./ShareCard";
import { RamiLevyComparison } from "./RamiLevyComparison";
import { Separator } from "@/components/ui/separator";
import type { SurveyResult } from "@/lib/types";
import { HOUSEHOLD_LABELS } from "@/lib/types";
import { formatCurrency, formatPercent, compareToAverage } from "@/lib/calculations";
import resultsContent from "@/content/he/results.json";
import methodologyContent from "@/content/he/methodology.json";
import Link from "next/link";

export function ResultsClient() {
  const router = useRouter();
  const [result, setResult] = useState<SurveyResult | null>(null);
  const [comparison, setComparison] = useState<Record<string, unknown> | null>(null);
  type RLPriceMap = Record<number, { product_id: number; rami_levy_price: number | null; official_price: number; name_he: string; is_available: boolean }>;
  const [rlData, setRlData] = useState<{ prices: RLPriceMap; fetched_at: string | null } | null>(null);
  const [showMethodology, setShowMethodology] = useState(false);

  useEffect(() => {
    const raw = sessionStorage.getItem("survey_result");
    if (!raw) { router.replace("/"); return; }
    try { setResult(JSON.parse(raw) as SurveyResult); } catch { router.replace("/"); }
  }, [router]);

  useEffect(() => {
    if (!result) return;
    fetch("/api/responses").then((r) => r.json()).then(setComparison).catch(() => {});
    fetch("/api/rami-levy").then((r) => r.json()).then(setRlData).catch(() => {});
  }, [result]);

  if (!result) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground text-sm">טוען תוצאות...</p>
      </div>
    );
  }

  type RawAvg = { household_type?: string; total_responses: number; avg_weighted_match: string | number; avg_regular_count: string | number; avg_weighted_cost: string | number; };
  const householdAvg = (comparison?.household as RawAvg[] | null)?.find((h) => h.household_type === result.householdType) ?? null;
  const globalAvg = (comparison?.global as unknown as RawAvg | null) ?? null;
  const weightedMatchComparison = globalAvg ? compareToAverage(result.weightedMatchPercent, Number(globalAvg.avg_weighted_match)) : null;
  const totalProducts = result.regularCount + result.sometimesCount + result.notBuyCount;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-xl mx-auto px-4 py-8">
        <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors mb-8 inline-flex items-center gap-1.5">
          ← חזרה לדף הבית
        </Link>

        {/* Title */}
        <div className="mt-4 mb-6">
          <h1 className="text-2xl font-bold leading-tight mb-1">{resultsContent.title}</h1>
          <p className="text-sm text-muted-foreground">{resultsContent.subtitle}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {HOUSEHOLD_LABELS[result.householdType]}{result.cityName ? ` · ${result.cityName}` : ""}
          </p>
        </div>

        {/* ── Main score — full width highlight ── */}
        <div className="bg-foreground text-background rounded-2xl p-5 mb-3 text-center">
          <p className="text-5xl font-bold tracking-tight mb-1">
            {formatPercent(result.weightedMatchPercent)}
          </p>
          <p className="text-sm text-background/70">{resultsContent.scores.weightedMatch}</p>
          <p className="text-xs text-background/50 mt-0.5">{resultsContent.scores.weightedMatchDesc}</p>
        </div>

        {/* ── 3-column counts ── */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="bg-white rounded-xl border border-emerald-200 p-3 text-center">
            <p className="text-2xl font-bold text-emerald-700">{result.regularCount}</p>
            <p className="text-xs text-emerald-600/80 mt-0.5 leading-tight">קנה בקביעות</p>
            <p className="text-xs text-muted-foreground">מתוך {totalProducts}</p>
          </div>
          <div className="bg-white rounded-xl border border-amber-200 p-3 text-center">
            <p className="text-2xl font-bold text-amber-600">{result.sometimesCount}</p>
            <p className="text-xs text-amber-600/80 mt-0.5 leading-tight">קנה לפעמים</p>
            <p className="text-xs text-muted-foreground">מתוך {totalProducts}</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-3 text-center">
            <p className="text-2xl font-bold text-slate-500">{result.notBuyCount}</p>
            <p className="text-xs text-slate-500/80 mt-0.5 leading-tight">לא קונה</p>
            <p className="text-xs text-muted-foreground">מתוך {totalProducts}</p>
          </div>
        </div>

        {/* ── 2-column costs with tooltip explanation ── */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="bg-white rounded-xl border border-border p-4 text-center">
            <p className="text-xl font-bold">{formatCurrency(result.regularCost)}</p>
            <p className="text-xs font-semibold text-foreground/80 mt-1">{resultsContent.scores.regularCost}</p>
            <p className="text-xs text-muted-foreground mt-0.5 leading-tight">{"regularCostDesc" in resultsContent.scores ? (resultsContent.scores as { regularCostDesc: string }).regularCostDesc : ""}</p>
          </div>
          <div className="bg-white rounded-xl border border-border p-4 text-center">
            <p className="text-xl font-bold">{formatCurrency(result.weightedCost)}</p>
            <p className="text-xs font-semibold text-foreground/80 mt-1">{resultsContent.scores.weightedCost}</p>
            <p className="text-xs text-muted-foreground mt-0.5 leading-tight">{"weightedCostDesc" in resultsContent.scores ? (resultsContent.scores as { weightedCostDesc: string }).weightedCostDesc : ""}</p>
          </div>
        </div>

        <Separator className="my-5" />

        {/* ── Donut / breakdown chart ── */}
        <div className="bg-white rounded-2xl border border-border p-5 mb-4">
          <h2 className="text-sm font-semibold mb-4 text-foreground">פיצול תשובות</h2>
          <AnswerDonut
            regular={result.regularCount}
            sometimes={result.sometimesCount}
            notBuy={result.notBuyCount}
            total={totalProducts}
          />
        </div>

        <Separator className="my-5" />

        {/* ── Rami Levy comparison ── */}
        {rlData && result && Object.keys(rlData.prices).length > 0 && (
          <>
            <RamiLevyComparison
              answers={result.answers}
              rlPrices={rlData.prices}
              fetchedAt={rlData.fetched_at}
            />
            <Separator className="my-5" />
          </>
        )}

        {/* ── Comparison ── */}
        <div className="mb-4">
          <h2 className="text-sm font-semibold mb-3">{resultsContent.comparison.title}</h2>
          {globalAvg ? (
            <div className="bg-white border border-border rounded-xl overflow-hidden">
              <div className="px-4 divide-y divide-border">
                <ComparisonBar label={`${resultsContent.comparison.weightedMatchLabel} — ${resultsContent.comparison.allUsers}`} userValue={result.weightedMatchPercent} avgValue={Number(globalAvg.avg_weighted_match)} formatter={formatPercent} />
                <ComparisonBar label={`${resultsContent.comparison.regularCountLabel} — ${resultsContent.comparison.allUsers}`} userValue={result.regularCount} avgValue={Number(globalAvg.avg_regular_count)} formatter={(v) => `${Math.round(v)} מוצרים`} />
                <ComparisonBar label={`${resultsContent.comparison.weightedCostLabel} — ${resultsContent.comparison.allUsers}`} userValue={result.weightedCost} avgValue={Number(globalAvg.avg_weighted_cost)} formatter={formatCurrency} higherIsBetter={false} />
              </div>
              {householdAvg && (
                <div className="px-4 bg-muted/20 border-t border-border">
                  <p className="text-xs font-semibold text-muted-foreground pt-3 pb-1">
                    {resultsContent.comparison.householdType}: {HOUSEHOLD_LABELS[result.householdType]}
                  </p>
                  <ComparisonBar label={resultsContent.comparison.weightedMatchLabel} userValue={result.weightedMatchPercent} avgValue={Number(householdAvg.avg_weighted_match)} formatter={formatPercent} />
                  <ComparisonBar label={resultsContent.comparison.regularCountLabel} userValue={result.regularCount} avgValue={Number(householdAvg.avg_regular_count)} formatter={(v) => `${Math.round(v)} מוצרים`} />
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white border border-border rounded-xl px-4 py-5 text-sm text-muted-foreground text-center">
              {resultsContent.comparison.noDataYet}
            </div>
          )}
        </div>

        <Separator className="my-5" />

        {/* ── City context ── */}
        {result.cityName && (
          <>
            <div className="mb-4">
              <CityContext cityName={result.cityName} branches={result.branches} />
            </div>
            <Separator className="my-5" />
          </>
        )}

        {/* ── Share ── */}
        <div className="mb-4">
          <h2 className="text-sm font-semibold mb-3">שתף את התוצאות</h2>
          <ShareCard result={result} comparisonStatus={weightedMatchComparison} />
        </div>

        <Separator className="my-5" />

        {/* ── Methodology accordion ── */}
        <div className="mb-8">
          <button
            type="button"
            onClick={() => setShowMethodology((v) => !v)}
            className="w-full flex items-center justify-between py-3 text-sm font-semibold focus-visible:outline-none rounded-lg"
            aria-expanded={showMethodology}
          >
            {methodologyContent.title}
            <span className="text-muted-foreground text-xs">{showMethodology ? "▲ סגור" : "▼ פתח"}</span>
          </button>

          {showMethodology && (
            <div className="mt-2 space-y-4 text-sm text-foreground/80 leading-relaxed bg-muted/30 rounded-xl border border-border p-5">
              {methodologyContent.sections.map((section) => (
                <div key={section.title}>
                  <p className="font-semibold text-foreground mb-1">{section.title}</p>
                  {"text" in section && <p>{(section as { text: string }).text}</p>}
                  {"formula" in section && (
                    <p className="font-mono text-xs bg-muted px-3 py-2 rounded-lg mt-1.5">
                      {(section as { formula: string }).formula}
                    </p>
                  )}
                  {"items" in section && (
                    <ul className="list-disc list-inside space-y-1 mt-1">
                      {(section as { items: string[] }).items.map((item) => <li key={item}>{item}</li>)}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="text-center">
          <Link href="/" className="text-sm text-muted-foreground underline underline-offset-2 hover:text-foreground">
            חזרה לדף הבית
          </Link>
        </div>
      </div>
    </div>
  );
}
