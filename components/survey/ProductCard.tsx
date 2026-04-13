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
    label: "קונה בקביעות",
    icon: "✓",
    activeClass: "bg-emerald-600 text-white border-emerald-600 shadow-emerald-100 shadow-md",
    idleClass: "bg-white border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-400",
    stripBg: "bg-emerald-50 border-emerald-200",
    stripText: "text-emerald-800",
    stripDot: "bg-emerald-500",
    badgeClass: "bg-emerald-100 text-emerald-800 border-emerald-200",
  },
  sometimes: {
    label: "קונה לפעמים",
    icon: "~",
    activeClass: "bg-amber-500 text-white border-amber-500 shadow-amber-100 shadow-md",
    idleClass: "bg-white border-amber-200 text-amber-700 hover:bg-amber-50 hover:border-amber-400",
    stripBg: "bg-amber-50 border-amber-200",
    stripText: "text-amber-800",
    stripDot: "bg-amber-400",
    badgeClass: "bg-amber-100 text-amber-800 border-amber-200",
  },
  no: {
    label: "לא קונה",
    icon: "×",
    activeClass: "bg-red-500 text-white border-red-500 shadow-red-100 shadow-md",
    idleClass: "bg-white border-red-200 text-red-600 hover:bg-red-50 hover:border-red-400",
    stripBg: "bg-slate-50 border-slate-200",
    stripText: "text-slate-500",
    stripDot: "bg-slate-300",
    badgeClass: "bg-slate-100 text-slate-600 border-slate-200",
  },
} as const;

const SWIPE_THRESHOLD = 90;

export function ProductCard({ product, answer, onAnswer }: ProductCardProps) {
  const x = useMotionValue(0);
  const dragHandled = useRef(false);
  const [imgError, setImgError] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const greenOpacity = useTransform(x, [0, SWIPE_THRESHOLD], [0, 0.18]);
  const redOpacity = useTransform(x, [-SWIPE_THRESHOLD, 0], [0.18, 0]);
  const cardRotate = useTransform(x, [-150, 150], [-3, 3]);

  const cfg = answer ? ANSWER_CONFIG[answer] : null;
  const isAnswered = answer !== null;

  function handleDragStart() {
    dragHandled.current = false;
  }

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

  // Compact answered strip
  if (isAnswered && !expanded) {
    return (
      <motion.div
        id={`product-${product.id}`}
        layout
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: "auto" }}
        exit={{ opacity: 0, height: 0 }}
        transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
      >
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className={`
            w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl border
            transition-all duration-150 text-start group
            hover:brightness-95 active:scale-[0.99]
            ${cfg!.stripBg}
          `}
          aria-label={`${product.name_he} - ${ANSWER_CONFIG[answer].label} — לחץ לשינוי`}
        >
          {/* Colored dot */}
          <div className={`shrink-0 w-2 h-2 rounded-full ${cfg!.stripDot}`} />

          {/* Tiny image */}
          <div className="shrink-0 w-8 h-8 rounded-lg overflow-hidden bg-white border border-white/60">
            <Image
              src={imgError ? "/products/placeholder.svg" : product.image_path}
              alt={product.name_he}
              width={32}
              height={32}
              className="object-contain w-full h-full p-0.5"
              onError={() => setImgError(true)}
            />
          </div>

          {/* Name */}
          <span className={`flex-1 min-w-0 text-sm font-medium truncate ${cfg!.stripText}`}>
            {product.name_he}
          </span>

          {/* Price */}
          <span className="shrink-0 text-xs text-muted-foreground">
            ₪{product.official_price.toFixed(2)}
          </span>

          {/* Answer badge */}
          <span className={`shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full border ${cfg!.badgeClass}`}>
            {ANSWER_CONFIG[answer].label}
          </span>

          {/* Edit hint */}
          <span className="shrink-0 text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity mr-0.5">
            שנה
          </span>
        </button>
      </motion.div>
    );
  }

  // Full expanded card (unanswered or in edit mode)
  return (
    <motion.div
      id={`product-${product.id}`}
      layout
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
    >
      <div className="relative rounded-2xl border border-border bg-white overflow-hidden shadow-sm">
        {/* Edit mode header */}
        {isAnswered && expanded && (
          <div className={`flex items-center justify-between px-4 pt-3 pb-0`}>
            <span className="text-xs text-muted-foreground">שנה תשובה</span>
            <button
              type="button"
              onClick={() => setExpanded(false)}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2"
            >
              סגור
            </button>
          </div>
        )}

        <motion.div
          style={{ x, rotate: cardRotate }}
          drag={!isAnswered ? "x" : false}
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.25}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          className={!isAnswered ? "cursor-grab active:cursor-grabbing" : ""}
        >
          {/* Drag color overlays */}
          {!isAnswered && (
            <>
              <motion.div
                style={{ opacity: greenOpacity }}
                className="absolute inset-0 bg-emerald-400 pointer-events-none z-10 rounded-2xl"
              />
              <motion.div
                style={{ opacity: redOpacity }}
                className="absolute inset-0 bg-red-400 pointer-events-none z-10 rounded-2xl"
              />
            </>
          )}

          <div className="p-4">
            {/* Top: image + info */}
            <div className="flex gap-3.5 mb-4">
              <div className="shrink-0 w-[72px] h-[72px] rounded-xl overflow-hidden bg-slate-50 border border-slate-100">
                <Image
                  src={imgError ? "/products/placeholder.svg" : product.image_path}
                  alt={product.name_he}
                  width={72}
                  height={72}
                  className="object-contain w-full h-full p-1"
                  loading="lazy"
                  onError={() => setImgError(true)}
                />
              </div>

              <div className="flex-1 min-w-0 flex flex-col justify-center">
                <h3 className="text-sm font-semibold leading-snug text-foreground">
                  {product.name_he}
                </h3>
                <p className="text-base font-bold text-foreground/90 mt-1">
                  ₪{product.official_price.toFixed(2)}
                </p>
                <p className="text-xs text-muted-foreground">מחיר רשמי</p>
              </div>
            </div>

            {/* Full-width answer buttons */}
            <div className="flex flex-col gap-2">
              <AnswerButton
                answer="regular"
                active={answer === "regular"}
                onClick={() => {
                  onAnswer("regular");
                  if (expanded) setExpanded(false);
                }}
              />
              <AnswerButton
                answer="sometimes"
                active={answer === "sometimes"}
                onClick={() => {
                  onAnswer("sometimes");
                  if (expanded) setExpanded(false);
                }}
              />
              <AnswerButton
                answer="no"
                active={answer === "no"}
                onClick={() => {
                  onAnswer("no");
                  if (expanded) setExpanded(false);
                }}
              />
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

function AnswerButton({
  answer,
  active,
  onClick,
}: {
  answer: Answer;
  active: boolean;
  onClick: () => void;
}) {
  const cfg = ANSWER_CONFIG[answer];

  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.97 }}
      className={`
        w-full py-3 px-4 rounded-xl border-2 text-sm font-semibold
        transition-all duration-150 flex items-center justify-center gap-2
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1
        ${active ? cfg.activeClass : cfg.idleClass}
      `}
      aria-pressed={active}
    >
      <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center text-xs font-bold shrink-0
        ${active ? "border-white/60 bg-white/20" : "border-current opacity-60"}`}>
        {cfg.icon}
      </span>
      {cfg.label}
    </motion.button>
  );
}
