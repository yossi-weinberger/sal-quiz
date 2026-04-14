"use client";

import { useRef, useState, useEffect } from "react";
import Image from "next/image";
import { motion, useMotionValue, useTransform } from "motion/react";
import type { Answer, BasketLine } from "@/lib/types";

interface ProductCardProps {
  line: BasketLine;
  answer: Answer | null;
  onAnswer: (answer: Answer) => void;
  /** Open in edit mode (e.g. jumped from basket for an already-answered product). */
  startExpanded?: boolean;
  /** Called when user closes edit mode from basket (card is removed from main list). */
  onCloseEdit?: () => void;
}

// Brand palette: #6D9E51 green, #BCD9A2 light green, #A82323 red, #FEFFD3 cream
const ANSWER_CONFIG = {
  regular: {
    label: "בקביעות",
    icon: "✓",
    activeStyle: { background: "#6D9E51", borderColor: "#6D9E51", color: "white" },
    idleClass: "bg-white border-brand-green-light text-[#3a6b2a] hover:bg-brand-green-light/30",
    stripBg: "bg-[#BCD9A2]/30 border-[#BCD9A2]",
    stripText: "text-[#3a6b2a]",
    stripDot: "bg-[#6D9E51]",
    badgeStyle: { background: "#BCD9A2", color: "#2a5a1a", border: "1px solid #6D9E51" },
    cardBg: "bg-[#BCD9A2]/20 border-[#BCD9A2]",
  },
  sometimes: {
    label: "לפעמים",
    icon: "~",
    activeStyle: { background: "#d97706", borderColor: "#d97706", color: "white" },
    idleClass: "bg-white border-amber-200 text-amber-700 hover:bg-amber-50",
    stripBg: "bg-amber-50 border-amber-200",
    stripText: "text-amber-800",
    stripDot: "bg-amber-400",
    badgeStyle: { background: "#fef3c7", color: "#92400e", border: "1px solid #fbbf24" },
    cardBg: "bg-amber-50/50 border-amber-200",
  },
  no: {
    label: "לא קונה",
    icon: "×",
    activeStyle: { background: "#64748b", borderColor: "#64748b", color: "white" },
    idleClass: "bg-white border-slate-200 text-slate-600 hover:bg-slate-50",
    stripBg: "bg-slate-50 border-slate-200",
    stripText: "text-slate-500",
    stripDot: "bg-slate-300",
    badgeStyle: { background: "#f1f5f9", color: "#475569", border: "1px solid #cbd5e1" },
    cardBg: "bg-slate-50/50 border-slate-200",
  },
} as const;

const SWIPE_THRESHOLD = 90;

export function ProductCard({ line, answer, onAnswer, startExpanded, onCloseEdit }: ProductCardProps) {
  const x = useMotionValue(0);
  const dragHandled = useRef(false);
  const [imgError, setImgError] = useState(false);
  const [expanded, setExpanded] = useState(() => Boolean(startExpanded && answer));

  const greenOpacity = useTransform(x, [0, SWIPE_THRESHOLD], [0, 0.15]);
  const redOpacity = useTransform(x, [-SWIPE_THRESHOLD, 0], [0.15, 0]);
  const cardRotate = useTransform(x, [-150, 150], [-2, 2]);

  const cfg = answer ? ANSWER_CONFIG[answer] : null;
  const isAnswered = answer !== null;

  useEffect(() => {
    if (startExpanded && answer) {
      setExpanded(true);
    }
  }, [startExpanded, answer, line.id]);

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

  // Answered items stay off the main list except when editing from basket (startExpanded).
  if (isAnswered && !expanded) {
    return null;
  }

  // ── Full card (no outer layout/mount animation — avoids expensive layout thrash on list change) ──
  return (
    <div
      id={`basket-group-${line.id}`}
      className="relative"
      style={{ zIndex: expanded ? 20 : undefined }}
    >
      <div
        className={`relative rounded-2xl border bg-white overflow-visible shadow-sm transition-colors duration-150 ${isAnswered ? cfg!.cardBg : "border-border"}`}
        style={expanded ? { outline: "2px solid #A82323", outlineOffset: "1px" } : undefined}
      >
        {/* Edit header */}
        {isAnswered && expanded && (
          <div className="flex items-center justify-between px-3 pt-2.5 pb-0">
            <span className="text-xs text-muted-foreground">שנה תשובה</span>
            <button
              type="button"
              onClick={() => onCloseEdit?.()}
              className="text-xs underline text-muted-foreground hover:text-foreground"
            >
              סגור
            </button>
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
                src={imgError ? "/products/placeholder.svg" : line.image_path}
                alt={line.name_he}
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
                  {line.name_he}
                </h3>
                <p className="text-sm font-bold text-foreground/80 mt-0.5">
                  ₪{line.official_price.toFixed(2)}
                  <span className="text-xs font-normal text-muted-foreground mr-1">מחיר רשמי</span>
                </p>
              </div>

              {/* 3 horizontal buttons — full width */}
              <div className="flex gap-1.5">
                {(["regular", "sometimes", "no"] as Answer[]).map((a) => {
                  const c = ANSWER_CONFIG[a];
                  const active = answer === a;
                  return (
                    <button
                      key={a}
                      type="button"
                      onClick={() => {
                        onAnswer(a);
                        if (expanded) setExpanded(false);
                      }}
                      style={active ? c.activeStyle : undefined}
                      className={`
                        flex-1 py-2.5 px-1 rounded-xl border-2 text-xs font-bold
                        transition-transform duration-100 active:scale-[0.97] text-center cursor-pointer
                        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
                        ${active ? "shadow-md" : c.idleClass}
                      `}
                      aria-pressed={active}
                    >
                      {c.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
