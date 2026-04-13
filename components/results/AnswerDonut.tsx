"use client";

import { motion } from "motion/react";

interface AnswerDonutProps {
  regular: number;
  sometimes: number;
  notBuy: number;
  total: number;
}

export function AnswerDonut({ regular, sometimes, notBuy, total }: AnswerDonutProps) {
  const regularPct = (regular / total) * 100;
  const sometimesPct = (sometimes / total) * 100;
  const notBuyPct = (notBuy / total) * 100;

  // SVG donut parameters
  const r = 36;
  const cx = 48;
  const cy = 48;
  const circumference = 2 * Math.PI * r;

  const segments = [
    { pct: regularPct, color: "#059669", label: "קנה בקביעות", count: regular, colorClass: "bg-emerald-600" },
    { pct: sometimesPct, color: "#F59E0B", label: "קנה לפעמים", count: sometimes, colorClass: "bg-amber-400" },
    { pct: notBuyPct, color: "#CBD5E1", label: "לא קונה", count: notBuy, colorClass: "bg-slate-300" },
  ];

  let cumulativePct = 0;
  const arcs = segments.map((seg) => {
    const dashArray = (seg.pct / 100) * circumference;
    const dashOffset = -((cumulativePct / 100) * circumference);
    cumulativePct += seg.pct;
    return { ...seg, dashArray, dashOffset };
  });

  return (
    <div className="flex items-center gap-6 flex-col sm:flex-row">
      {/* Donut */}
      <div className="relative shrink-0 w-24 h-24">
        <svg viewBox="0 0 96 96" className="w-full h-full -rotate-90">
          {/* Track */}
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="#F1F5F9" strokeWidth="14" />
          {arcs.map((arc, i) => (
            <motion.circle
              key={i}
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke={arc.color}
              strokeWidth="14"
              strokeDasharray={`${arc.dashArray} ${circumference - arc.dashArray}`}
              strokeDashoffset={arc.dashOffset}
              strokeLinecap="butt"
              initial={{ strokeDasharray: `0 ${circumference}` }}
              animate={{ strokeDasharray: `${arc.dashArray} ${circumference - arc.dashArray}` }}
              transition={{ duration: 0.8, delay: i * 0.15, ease: [0.4, 0, 0.2, 1] }}
            />
          ))}
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-lg font-bold leading-none">{total}</span>
          <span className="text-[9px] text-muted-foreground leading-tight">מוצרים</span>
        </div>
      </div>

      {/* Legend + bars */}
      <div className="flex-1 min-w-0 space-y-2.5 w-full">
        {segments.map((seg) => (
          <div key={seg.label}>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5">
                <div className={`w-2.5 h-2.5 rounded-sm shrink-0 ${seg.colorClass}`} />
                <span className="text-xs text-foreground/80">{seg.label}</span>
              </div>
              <span className="text-xs font-semibold text-foreground">
                {seg.count} <span className="text-muted-foreground font-normal">({seg.pct.toFixed(0)}%)</span>
              </span>
            </div>
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <motion.div
                className={`h-full rounded-full ${seg.colorClass}`}
                initial={{ width: 0 }}
                animate={{ width: `${seg.pct}%` }}
                transition={{ duration: 0.7, ease: [0.4, 0, 0.2, 1], delay: 0.1 }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
