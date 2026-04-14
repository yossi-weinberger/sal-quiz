"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { ProductCard } from "./ProductCard";
import { SurveyProgress } from "./SurveyProgress";
import { BasketPanel } from "./BasketPanel";
import type { Answer, Product, HouseholdType, BasketLine } from "@/lib/types";
import {
  loadDraft,
  saveDraft,
  createDraft,
  clearDraft,
} from "@/lib/draft";
import type { SurveyDraft } from "@/lib/types";
import surveyContent from "@/content/he/survey.json";
import { buildSurveyResult } from "@/lib/calculations";
import branchesData from "@/data/branches.json";
import type { Branch } from "@/lib/types";
import { findBranchesForCity, normalizeCity } from "@/lib/city-matching";
import { ShoppingBasket } from "lucide-react";

interface SurveyClientProps {
  lines: BasketLine[];
  products: Product[];
  householdType: HouseholdType;
  cityName: string | null;
}

export function SurveyClient({ lines, products, householdType, cityName }: SurveyClientProps) {
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<number, Answer>>({});
  const [draftRestored, setDraftRestored] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [basketOpen, setBasketOpen] = useState(false);
  /** When set, that answered product is shown in the main list for editing (jump from basket). */
  const [editFromBasketId, setEditFromBasketId] = useState<number | null>(null);
  const initialized = useRef(false);
  /** Avoid loadDraft + sync localStorage on every tap — set on first save */
  const draftStartedAtRef = useRef<string | null>(null);

  const total = lines.length;
  const answeredCount = Object.keys(answers).length;
  const allAnswered = answeredCount === total;

  const cardsToShow = useMemo(() => {
    const unanswered = lines.filter((l) => !answers[l.id]);
    if (editFromBasketId == null) return unanswered;
    const focused = lines.find((l) => l.id === editFromBasketId);
    if (!focused || !answers[editFromBasketId]) return unanswered;
    if (unanswered.some((u) => u.id === editFromBasketId)) return unanswered;
    return [focused, ...unanswered];
  }, [lines, answers, editFromBasketId]);

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
      draftStartedAtRef.current = draft.startedAt;
      setDraftRestored(true);
    } else {
      const empty = createDraft(householdType, cityName);
      draftStartedAtRef.current = empty.startedAt;
      saveDraft(empty);
    }
  }, [householdType, cityName]);

  const handleAnswer = useCallback(
    (groupId: number, answer: Answer) => {
      setAnswers((prev) => {
        const updated = { ...prev, [groupId]: answer };
        if (draftStartedAtRef.current === null) {
          draftStartedAtRef.current = loadDraft()?.startedAt ?? new Date().toISOString();
        }
        const startedAt = draftStartedAtRef.current;
        const lastSavedAt = new Date().toISOString();
        const payload: SurveyDraft = {
          householdType,
          cityName,
          answers: updated,
          startedAt,
          lastSavedAt,
        };
        queueMicrotask(() => {
          saveDraft(payload);
        });
        return updated;
      });
      setEditFromBasketId((id) => (id === groupId ? null : id));
    },
    [householdType, cityName]
  );

  function scrollToGroup(groupId: number) {
    const el = document.getElementById(`basket-group-${groupId}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }

  function scrollToNextUnanswered() {
    const first = lines.find((l) => !answers[l.id]);
    if (first) scrollToGroup(first.id);
  }

  async function handleSubmit() {
    if (!allAnswered || submitting) return;
    setSubmitting(true);
    setSubmitError(null);

    const branches = branchesData as Branch[];
    const cityBranches = cityName ? findBranchesForCity(cityName, branches) : [];
    const result = buildSurveyResult(householdType, cityName, answers, lines, cityBranches);

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

      const data = (await response.json()) as { id?: string; error?: string };

      if (!response.ok) {
        setSubmitError(data.error ?? "Failed to save response");
        setSubmitting(false);
        return;
      }

      clearDraft();
      sessionStorage.setItem(
        "survey_result",
        JSON.stringify({ ...result, responseId: data.id })
      );
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

        {answeredCount === 0 && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-4 px-4 py-3.5 bg-white/70 rounded-xl border border-border text-xs text-muted-foreground space-y-3"
          >
            <div>
              <p className="font-semibold text-foreground text-sm mb-1.5">
                {surveyContent.intro.title}
              </p>
              <p className="leading-relaxed">{surveyContent.intro.what}</p>
              <p className="leading-relaxed mt-2">{surveyContent.intro.how}</p>
            </div>
            <div
              className="pt-2.5 border-t border-border/70 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px] sm:text-xs"
              aria-label="מקרא תשובות"
            >
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: "#6D9E51" }} />
                <span>{surveyContent.intro.legendRegular}</span>
              </div>
              <span className="text-border hidden sm:inline">·</span>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="w-2 h-2 rounded-full bg-slate-300 shrink-0" />
                <span>{surveyContent.intro.legendNo}</span>
              </div>
              <span className="text-border hidden sm:inline">·</span>
              <span className="sm:ml-0">{surveyContent.intro.legendSometimes}</span>
            </div>
          </motion.div>
        )}

        <div className="space-y-2">
          {/* Exit-only animation on the removed card (opacity + scale). No `layout` on rows — that was the slow part. */}
          <AnimatePresence initial={false}>
            {cardsToShow.map((line) => (
              <motion.div
                key={line.id}
                initial={false}
                exit={{
                  opacity: 0,
                  scale: 0.96,
                  transition: { duration: 0.2, ease: [0.4, 0, 0.2, 1] },
                }}
              >
                <ProductCard
                  line={line}
                  answer={answers[line.id] ?? null}
                  onAnswer={(a) => handleAnswer(line.id, a)}
                  startExpanded={editFromBasketId === line.id}
                  onCloseEdit={() => setEditFromBasketId(null)}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

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
                {submitting ? surveyContent.submitSection.submitting : "סיום — ראה תוצאות"}
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="h-24" />
      </main>

      <AnimatePresence>
        {answeredCount > 0 && (
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

      <BasketPanel
        lines={lines}
        answers={answers}
        open={basketOpen}
        onClose={() => setBasketOpen(false)}
        onJumpTo={(groupId) => {
          if (answers[groupId]) {
            setEditFromBasketId(groupId);
          } else {
            setEditFromBasketId(null);
          }
          setTimeout(() => scrollToGroup(groupId), 100);
        }}
      />
    </div>
  );
}
