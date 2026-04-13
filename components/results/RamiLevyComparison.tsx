"use client";

import { motion } from "motion/react";
import type { Answer } from "@/lib/types";
import { formatCurrency } from "@/lib/calculations";
import disclaimerContent from "@/content/he/disclaimer.json";
import { getProductLines } from "@/lib/basket-data";

interface RLPrice {
  product_id: number;
  rami_levy_price: number | null;
  official_price: number;
  name_he: string;
  is_available: boolean;
}

interface RamiLevyComparisonProps {
  /** Keys = basket group ids */
  answers: Record<number, Answer>;
  rlPrices: Record<number, RLPrice>;
  fetchedAt: string | null;
}

export function RamiLevyComparison({ answers, rlPrices, fetchedAt }: RamiLevyComparisonProps) {
  const products = getProductLines();

  let officialRegular = 0;
  let rlRegular = 0;
  let regularLineCount = 0;
  let rlFoundCount = 0;

  for (const p of products) {
    const gAns = answers[p.group_id];
    if (gAns !== "regular") continue;
    const rl = rlPrices[p.id];
    if (!rl) continue;
    regularLineCount++;
    officialRegular += rl.official_price;
    if (rl.is_available && rl.rami_levy_price !== null) {
      rlRegular += rl.rami_levy_price;
      rlFoundCount++;
    }
  }

  if (officialRegular === 0) return null;

  const saving = rlRegular - officialRegular;
  const savingPct = officialRegular > 0 ? (saving / officialRegular) * 100 : 0;

  const fetchedDate = fetchedAt
    ? new Date(fetchedAt).toLocaleDateString("he-IL", { day: "numeric", month: "long", year: "numeric" })
    : null;

  return (
    <div className="bg-white rounded-2xl border border-border overflow-hidden">
      <div className="px-5 py-4 border-b border-border flex items-start justify-between gap-3">
        <div>
          <h2 className="font-bold text-base">הסל הקבוע שלך ברמי לוי</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {rlFoundCount} מוצרים נמצאו ברמי לוי (לפי ברקוד מהרשימה)
            {fetchedDate && ` · נכון ל-${fetchedDate}`}
          </p>
        </div>
        <span className="text-xs bg-orange-50 text-orange-700 border border-orange-200 rounded-full px-2.5 py-1 font-semibold shrink-0">
          רמי לוי
        </span>
      </div>

      <div className="p-5">
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="rounded-xl p-4 text-center border border-brand-green-light"
               style={{ background: "rgba(188,217,162,0.2)" }}>
            <p className="text-2xl font-bold">{formatCurrency(officialRegular)}</p>
            <p className="text-xs font-semibold mt-1" style={{ color: "#3a6b2a" }}>סל של ישראל</p>
            <p className="text-xs text-muted-foreground mt-0.5">{regularLineCount} מוצרים קבועים</p>
          </div>
          <div className="rounded-xl p-4 text-center border border-orange-200 bg-orange-50">
            <p className="text-2xl font-bold text-orange-700">{formatCurrency(rlRegular)}</p>
            <p className="text-xs font-semibold text-orange-700 mt-1">אותם מוצרים ברמי לוי</p>
            <p className="text-xs text-muted-foreground mt-0.5">{rlFoundCount} נמצאו</p>
          </div>
        </div>

        {saving > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl px-5 py-4 text-center"
            style={{ background: "#A82323", color: "white" }}
          >
            <p className="text-3xl font-bold">{formatCurrency(saving)}</p>
            <p className="text-sm opacity-90 mt-0.5">
              חיסכון — הסל הרשמי זול ב-{savingPct.toFixed(0)}% מרמי לוי
            </p>
          </motion.div>
        )}

        <p className="text-xs text-muted-foreground mt-3 text-center leading-relaxed">
          ההשוואה לפי המוצרים שסימנת שאתה קונה בהם בקביעות.
          {regularLineCount > rlFoundCount && (
            <span> {regularLineCount - rlFoundCount} מוצרים לא נמצאו ברמי לוי ולא נכללו.</span>
          )}{" "}
          {disclaimerContent.ramiFootnote}
        </p>
      </div>
    </div>
  );
}
