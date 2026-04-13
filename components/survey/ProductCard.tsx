"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { motion, useMotionValue, useTransform, AnimatePresence } from "motion/react";
import type { Answer, Product } from "@/lib/types";

interface ProductCardProps {
  product: Product;
  answer: Answer | null;
  onAnswer: (answer: Answer) => void;
}

const ANSWER_CONFIG = {
  regular: {
    label: "בקביעות",
    icon: "✓",
    activeClass: "bg-emerald-600 text-white border-emerald-600",
    idleClass: "bg-white border-emerald-200 text-emerald-700 hover:bg-emerald-50",
    stripBg: "bg-emerald-50 border-emerald-200",
    stripText: "text-emerald-800",
    stripDot: "bg-emerald-500",
    badgeClass: "bg-emerald-100 text-emerald-800 border-emerald-200",
    cardBg: "bg-emerald-50/50 border-emerald-200",
  },
  sometimes: {
    label: "לפעמים",
    icon: "~",
    activeClass: "bg-amber-500 text-white border-amber-500",
    idleClass: "bg-white border-amber-200 text-amber-700 hover:bg-amber-50",
    stripBg: "bg-amber-50 border-amber-200",
    stripText: "text-amber-800",
    stripDot: "bg-amber-400",
    badgeClass: "bg-amber-100 text-amber-800 border-amber-200",
    cardBg: "bg-amber-50/50 border-amber-200",
  },
  no: {
    label: "לא קונה",
    icon: "×",
    activeClass: "bg-slate-500 text-white border-slate-500",
    idleClass: "bg-white border-slate-200 text-slate-600 hover:bg-slate-50",
    stripBg: "bg-slate-50 border-slate-200",
    stripText: "text-slate-500",
    stripDot: "bg-slate-300",
    badgeClass: "bg-slate-100 text-slate-600 border-slate-200",
    cardBg: "bg-slate-50/50 border-slate-200",
  },
} as const;

const SWIPE_THRESHOLD = 90;

export function ProductCard({ product, answer, onAnswer }: ProductCardProps) {
  const x = useMotionValue(0);
  const dragHandled = useRef(false);
  const [imgError, setImgError] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const greenOpacity = useTransform(x, [0, SWIPE_THRESHOLD], [0, 0.15]);
  const redOpacity = useTransform(x, [-SWIPE_THRESHOLD, 0], [0.15, 0]);
  const cardRotate = useTransform(x, [-150, 150], [-2, 2]);

  const cfg = answer ? ANSWER_CONFIG[answer] : null;
  const isAnswered = answer !== null;

  function handleDragEnd(_: unknown, info: { offset: { x: number } }) {
    if (dragHandled.current) return;
    if (info.offset.x > SWIPE_THRESHOLD) {
      dragHandled.current = true;
      onAnswer("regular");
    } else if (info.offset.x < -SWIPE_THRESHOLD) {
      dragHandled.current = true;
      onAnswer("no");
    }
  }

  // ── Compact answered strip ──────────────────────────────────────
  if (isAnswered && !expanded) {
    return (
      <motion.div
        id={`product-${product.id}`}
        layout
        initial={{ opacity: 0, height: 0, marginBottom: 0 }}
        animate={{ opacity: 1, height: "auto" }}
        transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
      >
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl border transition-all duration-150 text-start group hover:brightness-95 ${cfg!.stripBg}`}
          aria-label={`${product.name_he} — ${ANSWER_CONFIG[answer].label} — לחץ לשינוי`}
        >
          <div className={`shrink-0 w-1.5 h-1.5 rounded-full ${cfg!.stripDot}`} />
          <div className="shrink-0 w-7 h-7 rounded-md overflow-hidden bg-white border border-white/80">
            <Image
              src={imgError ? "/products/placeholder.svg" : product.image_path}
              alt=""
              width={28} height={28}
              className="object-contain w-full h-full p-0.5"
              onError={() => setImgError(true)}
            />
          </div>
          <span className={`flex-1 min-w-0 text-xs font-medium truncate ${cfg!.stripText}`}>
            {product.name_he}
          </span>
          <span className="shrink-0 text-xs text-muted-foreground">₪{product.official_price.toFixed(2)}</span>
          <span className={`shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full border ${cfg!.badgeClass}`}>
            {ANSWER_CONFIG[answer].label}
          </span>
          <span className="shrink-0 text-xs text-muted-foreground opacity-0 group-hover:opacity-60 transition-opacity">
            ✎
          </span>
        </button>
      </motion.div>
    );
  }

  // ── Full card ───────────────────────────────────────────────────
  return (
    <motion.div
      id={`product-${product.id}`}
      layout
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
    >
      <div className={`relative rounded-2xl border bg-white overflow-hidden shadow-sm transition-colors duration-150 ${isAnswered ? cfg!.cardBg : "border-border"}`}>
        {/* Edit header */}
        {isAnswered && expanded && (
          <div className="flex items-center justify-between px-3 pt-2.5 pb-0">
            <span className="text-xs text-muted-foreground">שנה תשובה</span>
            <button type="button" onClick={() => setExpanded(false)} className="text-xs underline text-muted-foreground hover:text-foreground">סגור</button>
          </div>
        )}

        <motion.div
          style={{ x, rotate: cardRotate }}
          drag={!isAnswered ? "x" : false}
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.2}
          onDragStart={() => { dragHandled.current = false; }}
          onDragEnd={handleDragEnd}
          className={!isAnswered ? "cursor-grab active:cursor-grabbing select-none" : ""}
        >
          {/* Drag overlays */}
          {!isAnswered && (
            <>
              <motion.div style={{ opacity: greenOpacity }} className="absolute inset-0 bg-emerald-400 pointer-events-none z-10 rounded-2xl" />
              <motion.div style={{ opacity: redOpacity }} className="absolute inset-0 bg-red-400 pointer-events-none z-10 rounded-2xl" />
            </>
          )}

          {/* ── Main card layout: image left | content right ── */}
          <div className="flex min-h-[88px]">
            {/* Image — full height */}
            <div className="relative shrink-0 w-[84px] self-stretch bg-slate-50 border-l border-border/50">
              <Image
                src={imgError ? "/products/placeholder.svg" : product.image_path}
                alt={product.name_he}
                fill
                sizes="84px"
                className="object-contain p-2"
                loading="lazy"
                onError={() => setImgError(true)}
              />
            </div>

            {/* Right side */}
            <div className="flex-1 min-w-0 flex flex-col p-3 gap-2">
              {/* Name + price */}
              <div className="flex-1 min-h-0">
                <h3 className="text-sm font-semibold leading-snug text-foreground line-clamp-2">
                  {product.name_he}
                </h3>
                <p className="text-sm font-bold text-foreground/80 mt-0.5">
                  ₪{product.official_price.toFixed(2)}
                  <span className="text-xs font-normal text-muted-foreground mr-1">מחיר רשמי</span>
                </p>
              </div>

              {/* 3 horizontal buttons — full width */}
              <div className="flex gap-1.5">
                {(["regular", "sometimes", "no"] as Answer[]).map((a) => {
                  const c = ANSWER_CONFIG[a];
                  const active = answer === a;
                  return (
                    <motion.button
                      key={a}
                      type="button"
                      onClick={() => { onAnswer(a); if (expanded) setExpanded(false); }}
                      whileTap={{ scale: 0.95 }}
                      className={`
                        flex-1 py-2 px-1 rounded-lg border text-xs font-semibold
                        transition-all duration-100 text-center
                        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
                        ${active ? c.activeClass : c.idleClass}
                      `}
                      aria-pressed={active}
                    >
                      {c.label}
                    </motion.button>
                  );
                })}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
