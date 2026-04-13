"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import { ProductCard } from "./ProductCard";
import { SurveyProgress } from "./SurveyProgress";
import { BasketPanel } from "./BasketPanel";
import type { Answer, Product, HouseholdType } from "@/lib/types";
import {
  loadDraft,
  saveDraft,
  createDraft,
  updateDraftAnswer,
  clearDraft,
} from "@/lib/draft";
import surveyContent from "@/content/he/survey.json";
import { buildSurveyResult } from "@/lib/calculations";
import branchesData from "@/data/branches.json";
import type { Branch } from "@/lib/types";
import { findBranchesForCity, normalizeCity } from "@/lib/city-matching";
import { ShoppingBasket } from "lucide-react";

interface SurveyClientProps {
  products: Product[];
  householdType: HouseholdType;
  cityName: string | null;
}

export function SurveyClient({ products, householdType, cityName }: SurveyClientProps) {
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<number, Answer>>({});
  const [draftRestored, setDraftRestored] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [basketOpen, setBasketOpen] = useState(false);
  const initialized = useRef(false);

  const total = products.length;
  const answeredCount = Object.keys(answers).length;
  const allAnswered = answeredCount === total;

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    const draft = loadDraft();
    if (
      draft &&
      draft.householdType === householdType &&
      draft.cityName === cityName &&
      Object.keys(draft.answers).length > 0
    ) {
      setAnswers(draft.answers as Record<number, Answer>);
      setDraftRestored(true);
    } else {
      saveDraft(createDraft(householdType, cityName));
    }
  }, [householdType, cityName]);

  const handleAnswer = useCallback(
    (productId: number, answer: Answer) => {
      setAnswers((prev) => {
        const updated = { ...prev, [productId]: answer };
        const draft = loadDraft() ?? createDraft(householdType, cityName);
        saveDraft(updateDraftAnswer(draft, productId, answer));
        return updated;
      });
    },
    [householdType, cityName]
  );

  function scrollToProduct(productId: number) {
    const el = document.getElementById(`product-${productId}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }

  function scrollToNextUnanswered() {
    const first = products.find((p) => !answers[p.id]);
    if (first) scrollToProduct(first.id);
  }

  async function handleSubmit() {
    if (!allAnswered || submitting) return;
    setSubmitting(true);
    setSubmitError(null);

    const branches = branchesData as Branch[];
    const cityBranches = cityName ? findBranchesForCity(cityName, branches) : [];
    const result = buildSurveyResult(householdType, cityName, answers, products, cityBranches);

    try {
      const response = await fetch("/api/responses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          householdType: result.householdType,
          cityName: result.cityName,
          normalizedCityName: cityName ? normalizeCity(cityName) : null,
          hasBranchInCity: result.hasBranchInCity,
          branchCount: result.branchCount,
          weightedMatchPercent: result.weightedMatchPercent,
          regularCount: result.regularCount,
          sometimesCount: result.sometimesCount,
          notBuyCount: result.notBuyCount,
          regularCost: result.regularCost,
          weightedCost: result.weightedCost,
          answers: Object.fromEntries(Object.entries(answers)),
        }),
      });

      const { id } = await response.json();
      clearDraft();
      sessionStorage.setItem("survey_result", JSON.stringify({ ...result, responseId: id }));
    } catch {
      sessionStorage.setItem("survey_result", JSON.stringify(result));
      clearDraft();
    }

    router.push("/result");
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SurveyProgress
        answered={answeredCount}
        total={total}
        onScrollToNext={scrollToNextUnanswered}
        allAnswered={allAnswered}
      />

      <main className="flex-1 max-w-xl mx-auto w-full px-4 py-5">
        {/* Draft restored */}
        <AnimatePresence>
          {draftRestored && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-4 px-4 py-2.5 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-800"
            >
              {surveyContent.draft.restored}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Swipe hint (only shown until first answer) */}
        {answeredCount === 0 && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-4 px-4 py-3 bg-white/70 rounded-xl border border-border text-xs text-muted-foreground"
          >
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="w-2 h-2 rounded-full" style={{ background: "#6D9E51" }} />
                <span>בקביעות = החלק ימינה</span>
              </div>
              <span className="text-border">·</span>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="w-2 h-2 rounded-full bg-slate-300" />
                <span>לא קונה = החלק שמאלה</span>
              </div>
              <span className="text-border">·</span>
              <span>לפעמים = לחץ כפתור</span>
            </div>
          </motion.div>
        )}

        {/* Product list */}
        <div className="space-y-2">
          <AnimatePresence initial={false}>
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                answer={answers[product.id] ?? null}
                onAnswer={(a) => handleAnswer(product.id, a)}
              />
            ))}
          </AnimatePresence>
        </div>

        {/* Submit section */}
        <AnimatePresence>
          {allAnswered && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mt-8 p-6 bg-white rounded-2xl border border-border shadow-sm text-center"
            >
              <h2 className="text-lg font-bold mb-1">{surveyContent.submitSection.title}</h2>
              <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                {surveyContent.submitSection.description}
              </p>
              <p className="text-xs text-muted-foreground mb-5">{surveyContent.submitSection.note}</p>

              {submitError && (
                <p className="text-sm text-destructive mb-3">{submitError}</p>
              )}

              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                style={{ background: "#A82323", color: "white" }}
                className="w-full h-12 rounded-xl text-base font-semibold disabled:opacity-60 transition-opacity"
              >
                {submitting ? surveyContent.submitSection.submitting : "סיום — ראה תוצאות →"}
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="h-24" />
      </main>

      {/* Floating basket button */}
      <AnimatePresence>
        {answeredCount > 0 && !allAnswered && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", damping: 15, stiffness: 300 }}
            type="button"
            onClick={() => setBasketOpen(true)}
            style={{ background: "#A82323", color: "white" }}
            className="fixed bottom-6 left-4 z-40 flex items-center gap-2 px-4 py-3 rounded-full shadow-xl transition-all duration-150 hover:scale-105 active:scale-95 cursor-pointer"
            aria-label="סל תשובות"
          >
            <ShoppingBasket size={18} />
            <span className="text-sm font-semibold">{answeredCount}/{total}</span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Basket panel */}
      <BasketPanel
        products={products}
        answers={answers}
        open={basketOpen}
        onClose={() => setBasketOpen(false)}
        onJumpTo={(id) => {
          setTimeout(() => scrollToProduct(id), 100);
        }}
      />
    </div>
  );
}
