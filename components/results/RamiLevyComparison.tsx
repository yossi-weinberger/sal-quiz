"use client";

import { motion } from "motion/react";
import type { Answer } from "@/lib/types";
import { formatCurrency } from "@/lib/calculations";

interface RLPrice {
  product_id: number;
  rami_levy_price: number | null;
  official_price: number;
  name_he: string;
  is_available: boolean;
}

interface RamiLevyComparisonProps {
  answers: Record<number, Answer>;
  rlPrices: Record<number, RLPrice>;
  fetchedAt: string | null;
}

const ANSWER_WEIGHT = { regular: 1.0, sometimes: 0.5, no: 0.0 } as const;

export function RamiLevyComparison({ answers, rlPrices, fetchedAt }: RamiLevyComparisonProps) {
  // User's purchased items only (regular + sometimes, weighted)
  let officialMine = 0;
  let rlMine = 0;
  let countMine = 0;

  for (const [idStr, answer] of Object.entries(answers)) {
    if (answer === "no") continue;
    const id = parseInt(idStr);
    const rl = rlPrices[id];
    if (!rl) continue;
    const weight = ANSWER_WEIGHT[answer];
    officialMine += rl.official_price * weight;
    if (rl.is_available && rl.rami_levy_price !== null) {
      rlMine += rl.rami_levy_price * weight;
      countMine++;
    }
  }

  const myDiff = rlMine - officialMine;
  const myDiffPct = officialMine > 0 ? (myDiff / officialMine) * 100 : 0;

  const fetchedDate = fetchedAt
    ? new Date(fetchedAt).toLocaleDateString("he-IL", { day: "numeric", month: "long", year: "numeric" })
    : null;

  if (officialMine === 0) return null;

  return (
    <div className="bg-white rounded-2xl border border-border overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-border flex items-center justify-between">
        <div>
          <h2 className="font-bold text-base">כמה היה עולה ברמי לוי?</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            המוצרים שסימנת · {countMine} מוצרים
            {fetchedDate && ` · נכון ל-${fetchedDate}`}
          </p>
        </div>
        <span className="text-xs bg-orange-50 text-orange-700 border border-orange-200 rounded-full px-2.5 py-1 font-semibold shrink-0">
          רמי לוי
        </span>
      </div>

      {/* Two-column comparison */}
      <div className="p-5">
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="rounded-xl p-4 text-center border border-brand-green-light bg-brand-green-light/20">
            <p className="text-xl font-bold text-foreground">{formatCurrency(officialMine)}</p>
            <p className="text-xs font-semibold mt-1" style={{ color: "#3a6b2a" }}>סל ישראל</p>
            <p className="text-xs text-muted-foreground">המחיר הרשמי</p>
          </div>
          <div className="rounded-xl p-4 text-center border border-orange-200 bg-orange-50">
            <p className="text-xl font-bold text-orange-700">{formatCurrency(rlMine)}</p>
            <p className="text-xs font-semibold text-orange-700 mt-1">רמי לוי</p>
            <p className="text-xs text-muted-foreground">מחיר באתר</p>
          </div>
        </div>

        {/* Saving callout */}
        {myDiff > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl px-5 py-4 text-center"
            style={{ background: "#A82323", color: "white" }}
          >
            <p className="text-2xl font-bold mb-0.5">{formatCurrency(myDiff)} חיסכון</p>
            <p className="text-sm opacity-90">
              הסל הרשמי זול ב-{myDiffPct.toFixed(0)}% מרמי לוי
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
