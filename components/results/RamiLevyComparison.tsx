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
  const allProductIds = Object.keys(rlPrices).map(Number);

  // Full basket (all 107 products that have RL price)
  let officialFull = 0;
  let rlFull = 0;
  let rlFullCount = 0;

  for (const id of allProductIds) {
    const rl = rlPrices[id];
    officialFull += rl.official_price;
    if (rl.is_available && rl.rami_levy_price !== null) {
      rlFull += rl.rami_levy_price;
      rlFullCount++;
    }
  }

  // User's purchased items (regular + sometimes)
  let officialMine = 0;
  let rlMine = 0;
  let rlMineCount = 0;

  for (const [idStr, answer] of Object.entries(answers)) {
    if (answer === "no") continue;
    const id = parseInt(idStr);
    const rl = rlPrices[id];
    if (!rl) continue;

    const weight = ANSWER_WEIGHT[answer];
    officialMine += rl.official_price * weight;
    if (rl.is_available && rl.rami_levy_price !== null) {
      rlMine += rl.rami_levy_price * weight;
      rlMineCount++;
    }
  }

  const myDiff = rlMine - officialMine;
  const fullDiff = rlFull - officialFull;
  const fullDiffPct = officialFull > 0 ? (fullDiff / officialFull) * 100 : 0;

  const fetchedDate = fetchedAt
    ? new Date(fetchedAt).toLocaleDateString("he-IL", { day: "numeric", month: "long", year: "numeric" })
    : null;

  return (
    <div className="bg-white border border-border rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-border flex items-start justify-between gap-3">
        <div>
          <h2 className="font-bold text-base">השוואה לרמי לוי</h2>
          {fetchedDate && (
            <p className="text-xs text-muted-foreground mt-0.5">נכון ל-{fetchedDate} · {rlFullCount}/107 מוצרים</p>
          )}
        </div>
        <span className="shrink-0 text-xs bg-orange-50 text-orange-700 border border-orange-200 rounded-full px-2.5 py-1 font-semibold">
          רמי לוי
        </span>
      </div>

      {/* My purchases comparison */}
      {officialMine > 0 && (
        <div className="p-5 border-b border-border">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            המוצרים שסימנת ({rlMineCount} מוצרים, משוקלל)
          </p>
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="bg-slate-50 rounded-xl p-3 text-center border border-slate-200">
              <p className="text-lg font-bold">{formatCurrency(officialMine)}</p>
              <p className="text-xs text-muted-foreground mt-0.5">סל רשמי</p>
            </div>
            <div className="bg-orange-50 rounded-xl p-3 text-center border border-orange-200">
              <p className="text-lg font-bold text-orange-700">{formatCurrency(rlMine)}</p>
              <p className="text-xs text-orange-600/70 mt-0.5">רמי לוי</p>
            </div>
          </div>
          {myDiff > 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-2.5 text-center">
              <p className="text-emerald-800 text-sm font-semibold">
                חסכון של {formatCurrency(myDiff)} לעומת רמי לוי
              </p>
            </motion.div>
          )}
        </div>
      )}

      {/* Full basket */}
      <div className="p-5">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          כל {rlFullCount} המוצרים שנמצאו ברמי לוי
        </p>
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="bg-slate-50 rounded-xl p-3 text-center border border-slate-200">
            <p className="text-xl font-bold">{formatCurrency(officialFull)}</p>
            <p className="text-xs text-muted-foreground mt-0.5">סל רשמי</p>
          </div>
          <div className="bg-orange-50 rounded-xl p-3 text-center border border-orange-200">
            <p className="text-xl font-bold text-orange-700">{formatCurrency(rlFull)}</p>
            <p className="text-xs text-orange-600/70 mt-0.5">רמי לוי</p>
          </div>
        </div>
        {fullDiff > 0 && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-center">
            <p className="font-bold text-red-800 text-base">+{formatCurrency(fullDiff)} יותר ברמי לוי</p>
            <p className="text-xs text-red-700/70 mt-0.5">
              הסל הרשמי זול ב-{fullDiffPct.toFixed(0)}% מאותם מוצרים ברמי לוי
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
