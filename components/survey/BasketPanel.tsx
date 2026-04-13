"use client";

import { motion, AnimatePresence } from "motion/react";
import type { Answer, Product } from "@/lib/types";
import { X, ShoppingBasket } from "lucide-react";

interface BasketPanelProps {
  products: Product[];
  answers: Record<number, Answer>;
  open: boolean;
  onClose: () => void;
  onJumpTo: (productId: number) => void;
}

const GROUPS: { key: Answer; label: string; dotClass: string; badgeClass: string }[] = [
  { key: "regular", label: "קונה בקביעות", dotClass: "bg-emerald-500", badgeClass: "text-emerald-700 bg-emerald-50 border-emerald-200" },
  { key: "sometimes", label: "קונה לפעמים", dotClass: "bg-amber-400", badgeClass: "text-amber-700 bg-amber-50 border-amber-200" },
  { key: "no", label: "לא קונה", dotClass: "bg-slate-300", badgeClass: "text-slate-500 bg-slate-50 border-slate-200" },
];

export function BasketPanel({ products, answers, open, onClose, onJumpTo }: BasketPanelProps) {
  const unanswered = products.filter((p) => !answers[p.id]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/30 z-50 backdrop-blur-[2px]"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-background rounded-t-2xl shadow-2xl max-h-[85vh] flex flex-col"
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-border rounded-full" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-border">
              <div className="flex items-center gap-2">
                <ShoppingBasket size={18} className="text-foreground/60" />
                <h2 className="font-bold text-base">תשובות שסומנו</h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors"
                aria-label="סגור"
              >
                <X size={16} />
              </button>
            </div>

            {/* Unanswered count */}
            {unanswered.length > 0 && (
              <div className="mx-5 mt-4 px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-xl">
                <p className="text-sm text-amber-800 font-medium">
                  נותרו {unanswered.length} מוצרים ללא תשובה
                </p>
                <button
                  type="button"
                  onClick={() => { onJumpTo(unanswered[0].id); onClose(); }}
                  className="text-xs text-amber-700 underline underline-offset-2 mt-0.5"
                >
                  קפוץ לראשון
                </button>
              </div>
            )}

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
              {GROUPS.map(({ key, label, dotClass, badgeClass }) => {
                const group = products.filter((p) => answers[p.id] === key);
                if (group.length === 0) return null;
                return (
                  <div key={key}>
                    <div className="flex items-center gap-2 mb-2.5">
                      <div className={`w-2 h-2 rounded-full shrink-0 ${dotClass}`} />
                      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        {label} ({group.length})
                      </h3>
                    </div>
                    <div className="space-y-1.5">
                      {group.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => { onJumpTo(p.id); onClose(); }}
                          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg border text-start transition-colors hover:brightness-95 ${badgeClass}`}
                        >
                          <span className="text-xs font-medium truncate flex-1">{p.name_he}</span>
                          <span className="text-xs shrink-0 text-current/60">₪{p.official_price.toFixed(2)}</span>
                          <span className="text-xs shrink-0 opacity-60">שנה →</span>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom safe area */}
            <div className="h-safe-area-inset-bottom min-h-5 shrink-0" />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
