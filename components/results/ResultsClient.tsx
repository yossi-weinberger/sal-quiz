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
import disclaimerContent from "@/content/he/disclaimer.json";
import Link from "next/link";

export function ResultsClient() {
  const router = useRouter();
  const [result, setResult] = useState<SurveyResult | null>(null);
  const [comparison, setComparison] = useState<Record<string, unknown> | null>(null);
  type RLPriceMap = Record<number, { product_id: number; rami_levy_price: number | null; official_price: number; name_he: string; is_available: boolean }>;
  const [rlData, setRlData] = useState<{ prices: RLPriceMap; fetched_at: string | null } | null>(null);
  const [showMethodology, setShowMethodology] = useState(false);
  const [showDisclaimer, setShowDisclaimer] = useState(false);

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
    <div className="min-h-screen bg-background">
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
            <p className="text-xs text-emerald-600/80 mt-0.5 leading-tight">קונה בקביעות</p>
            <p className="text-xs text-muted-foreground">מתוך {totalProducts}</p>
          </div>
          <div className="bg-white rounded-xl border border-amber-200 p-3 text-center">
            <p className="text-2xl font-bold text-amber-600">{result.sometimesCount}</p>
            <p className="text-xs text-amber-600/80 mt-0.5 leading-tight">קונה לפעמים</p>
            <p className="text-xs text-muted-foreground">מתוך {totalProducts}</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-3 text-center">
            <p className="text-2xl font-bold text-slate-500">{result.notBuyCount}</p>
            <p className="text-xs text-slate-500/80 mt-0.5 leading-tight">לא קונה</p>
            <p className="text-xs text-muted-foreground">מתוך {totalProducts}</p>
          </div>
        </div>

        {/* ── Cost range: regular → max ── */}
        <div className="bg-white rounded-xl border border-border p-4 mb-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">עלות הסל שלך</p>

          {/* Range bar */}
          <div className="flex items-center gap-2 mb-4">
            <div className="flex-1 text-center">
              <p className="text-2xl font-bold text-foreground">{formatCurrency(result.regularCost)}</p>
              <p className="text-xs font-semibold mt-0.5" style={{ color: "#3a6b2a" }}>סל קבוע</p>
              <p className="text-xs text-muted-foreground">{result.regularCount} מוצרים שתמיד קונים</p>
            </div>
            <div className="flex flex-col items-center gap-1 shrink-0">
              <div className="w-px h-8 bg-border" />
              <span className="text-xs text-muted-foreground">עד</span>
              <div className="w-px h-8 bg-border" />
            </div>
            <div className="flex-1 text-center">
              <p className="text-2xl font-bold text-foreground">{formatCurrency(result.maxCost ?? result.weightedCost)}</p>
              <p className="text-xs font-semibold text-amber-700 mt-0.5">סל מרבי</p>
              <p className="text-xs text-muted-foreground">+ {result.sometimesCount} שקונים לפעמים</p>
            </div>
          </div>

          {/* Explanation */}
          <div className="bg-muted/40 rounded-lg px-3 py-2 text-xs text-muted-foreground leading-relaxed">
            <span className="font-semibold text-foreground">איך לקרוא זאת:</span>{" "}
            הסל הקבוע הוא מה שאתה בוודאות מוציא. הסל המרבי כולל גם את המוצרים שקונים לפעמים — אם תקנה את כולם בקנייה אחת.
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
          <h2 className="text-xl font-black mb-2 tracking-tight">{resultsContent.comparison.title}</h2>
          <p className="text-xs text-muted-foreground leading-snug mb-3">{resultsContent.comparison.intro}</p>
          {globalAvg ? (
            <div className="bg-white border border-border rounded-xl overflow-hidden shadow-sm">
              <div className="border-b-2 border-border/80">
                <div className="px-4 sm:px-5 pt-5 pb-4 bg-gradient-to-bl from-slate-50 via-white to-white border-r-[6px] border-[#A82323]">
                  <p className="text-xs font-extrabold uppercase tracking-widest text-[#A82323] mb-2">
                    {resultsContent.comparison.section1Kicker}
                  </p>
                  <h3 className="text-2xl sm:text-[1.75rem] font-black text-foreground leading-tight tracking-tight">
                    {resultsContent.comparison.globalBaselineTitle}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-2 leading-snug max-w-prose">
                    {resultsContent.comparison.globalBaselineSubtitle}
                  </p>
                </div>
                <div className="px-4 sm:px-5">
                <ComparisonBar
                  title={resultsContent.comparison.weightedMatchTitle}
                  hint={resultsContent.comparison.weightedMatchHint}
                  userValue={result.weightedMatchPercent}
                  avgValue={Number(globalAvg.avg_weighted_match)}
                  formatter={formatPercent}
                  averageLabel={resultsContent.comparison.peerAverage}
                />
                <ComparisonBar
                  title={resultsContent.comparison.regularCountTitle}
                  hint={resultsContent.comparison.regularCountHint}
                  userValue={result.regularCount}
                  avgValue={Number(globalAvg.avg_regular_count)}
                  formatter={(v) => `${Math.round(v)} מוצרים`}
                  averageLabel={resultsContent.comparison.peerAverage}
                />
                <ComparisonBar
                  title={resultsContent.comparison.weightedCostTitle}
                  hint={resultsContent.comparison.weightedCostHint}
                  userValue={result.weightedCost}
                  avgValue={Number(globalAvg.avg_weighted_cost)}
                  formatter={formatCurrency}
                  higherIsBetter={false}
                  averageLabel={resultsContent.comparison.peerAverage}
                />
                </div>
              </div>

              {householdAvg ? (
                <div className="border-t-[3px] border-dashed border-border bg-muted/20">
                  <div className="px-4 sm:px-5 pt-5 pb-3 bg-gradient-to-bl from-amber-50/90 via-white to-emerald-50/30 border-r-[6px] border-emerald-700">
                    <p className="text-xs font-extrabold uppercase tracking-widest text-emerald-800 mb-2">
                      {resultsContent.comparison.section2Kicker}
                    </p>
                    <h3 className="text-2xl sm:text-[1.75rem] font-black text-foreground leading-tight tracking-tight">
                      {resultsContent.comparison.householdBaselineTitle}
                    </h3>
                    <p className="text-lg sm:text-xl font-bold text-emerald-900/90 mt-1">
                      ({HOUSEHOLD_LABELS[result.householdType]})
                    </p>
                    <p className="text-sm text-muted-foreground mt-3 leading-snug max-w-prose">
                      {resultsContent.comparison.householdBaselineSub}
                    </p>
                  </div>
                  <div className="px-4 sm:px-5 pb-1">
                  <ComparisonBar
                    title={resultsContent.comparison.weightedMatchTitle}
                    hint={resultsContent.comparison.weightedMatchHint}
                    userValue={result.weightedMatchPercent}
                    avgValue={Number(householdAvg.avg_weighted_match)}
                    formatter={formatPercent}
                    averageLabel={resultsContent.comparison.peerAverageHousehold}
                  />
                  <ComparisonBar
                    title={resultsContent.comparison.regularCountTitle}
                    hint={resultsContent.comparison.regularCountHint}
                    userValue={result.regularCount}
                    avgValue={Number(householdAvg.avg_regular_count)}
                    formatter={(v) => `${Math.round(v)} מוצרים`}
                    averageLabel={resultsContent.comparison.peerAverageHousehold}
                  />
                  <ComparisonBar
                    title={resultsContent.comparison.weightedCostTitle}
                    hint={resultsContent.comparison.weightedCostHint}
                    userValue={result.weightedCost}
                    avgValue={Number(householdAvg.avg_weighted_cost)}
                    formatter={formatCurrency}
                    higherIsBetter={false}
                    averageLabel={resultsContent.comparison.peerAverageHousehold}
                  />
                  </div>
                </div>
              ) : (
                <div className="border-t-[3px] border-dashed border-border px-4 sm:px-5 py-4 bg-muted/15 text-center">
                  <p className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground mb-2">
                    {resultsContent.comparison.section2Kicker}
                  </p>
                  <p className="text-sm text-muted-foreground leading-snug">
                    {resultsContent.comparison.householdMissing}
                  </p>
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
                  {"link" in section &&
                    (section as { link?: { href: string; label: string } }).link && (
                      <p className="mt-2">
                        <a
                          href={(section as { link: { href: string; label: string } }).link.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-semibold underline underline-offset-2 hover:opacity-90"
                          style={{ color: "#A82323" }}
                        >
                          {(section as { link: { href: string; label: string } }).link.label}
                        </a>
                      </p>
                    )}
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

        {/* Disclaimer accordion */}
        <div className="mb-8">
          <button
            type="button"
            onClick={() => setShowDisclaimer((v) => !v)}
            className="w-full flex items-center justify-between py-3 text-sm font-semibold focus-visible:outline-none rounded-lg"
            aria-expanded={showDisclaimer}
          >
            {disclaimerContent.title}
            <span className="text-muted-foreground text-xs">{showDisclaimer ? "▲ סגור" : "▼ פתח"}</span>
          </button>

          {showDisclaimer && (
            <div className="mt-2 space-y-4 text-xs text-foreground/75 leading-relaxed bg-muted/20 rounded-xl border border-border p-5">
              {disclaimerContent.sections.map((section) => (
                <div key={section.title}>
                  <p className="font-semibold text-foreground mb-1 text-sm">{section.title}</p>
                  <p>{section.text}</p>
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
