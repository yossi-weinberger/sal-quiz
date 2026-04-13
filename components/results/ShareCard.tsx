"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import type { SurveyResult } from "@/lib/types";
import { HOUSEHOLD_LABELS } from "@/lib/types";
import { formatCurrency, formatPercent } from "@/lib/calculations";
import { Share2, Download, Copy, Check } from "lucide-react";

interface ShareCardProps {
  result: SurveyResult;
  comparisonStatus: "above" | "below" | "at" | null;
}

const PALETTE = {
  dark:  "#111a11",
  red:   "#A82323",
  cream: "#FEFFD3",
  green: "#6D9E51",
  greenLight: "#BCD9A2",
};

export function ShareCard({ result, comparisonStatus }: ShareCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<"idle" | "downloading" | "sharing" | "copied">("idle");

  const compLabel =
    comparisonStatus === "above" ? "מעל הממוצע"
    : comparisonStatus === "below" ? "מתחת לממוצע"
    : comparisonStatus === "at" ? "בממוצע" : null;

  const shareText = [
    `הסל של ישראל — התוצאות שלי`,
    ``,
    `${formatPercent(result.weightedMatchPercent)} מהסל תואם לבית שלי`,
    `${result.regularCount} מוצרים קבועים מתוך 107`,
    `עלות סל קבוע: ${formatCurrency(result.regularCost)}`,
    compLabel ? `ביחס לממוצע: ${compLabel}` : null,
    result.cityName && result.hasBranchInCity === false
      ? `${result.cityName} — אין סניף קרפור` : null,
    ``,
    `${typeof window !== "undefined" ? window.location.origin : ""}`,
  ].filter(Boolean).join("\n");

  async function captureCanvas() {
    if (!cardRef.current) return null;
    try {
      const { default: html2canvas } = await import("html2canvas");
      return html2canvas(cardRef.current, {
        backgroundColor: PALETTE.dark,
        scale: 2,
        useCORS: true,
        logging: false,
        foreignObjectRendering: false,
      });
    } catch { return null; }
  }

  async function handleNativeShare() {
    setStatus("sharing");
    try {
      const canvas = await captureCanvas();
      if (canvas) {
        const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/png"));
        if (blob) {
          const file = new File([blob], "sal-israel.png", { type: "image/png" });
          if (navigator.canShare?.({ files: [file] })) {
            await navigator.share({ files: [file], title: "הסל של ישראל" });
            setStatus("idle"); return;
          }
        }
      }
      if (navigator.share) await navigator.share({ title: "הסל של ישראל", text: shareText });
    } catch { /* cancelled */ }
    setStatus("idle");
  }

  async function handleDownload() {
    setStatus("downloading");
    try {
      const canvas = await captureCanvas();
      if (!canvas) { setStatus("idle"); return; }
      const a = document.createElement("a");
      a.href = canvas.toDataURL("image/png");
      a.download = "sal-israel-results.png";
      a.click();
    } catch (e) { console.error(e); }
    setStatus("idle");
  }

  async function handleCopyText() {
    try {
      await navigator.clipboard.writeText(shareText);
      setStatus("copied");
      setTimeout(() => setStatus("idle"), 2000);
    } catch { setStatus("idle"); }
  }

  const canShare = typeof navigator !== "undefined" && "share" in navigator;

  return (
    <div className="space-y-4">
      {/* ── Visual card ── */}
      <div
        ref={cardRef}
        dir="rtl"
        className="rounded-2xl overflow-hidden select-none"
        style={{ background: PALETTE.dark, fontFamily: "Heebo, Arial, sans-serif", color: PALETTE.cream }}
      >
        {/* Top bar — red */}
        <div style={{ background: PALETTE.red }} className="px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Image src="/logo.png" alt="לוגו" width={28} height={28} className="rounded-md object-contain" />
            <span className="text-sm font-bold text-white">הסל של ישראל</span>
          </div>
          <span className="text-xs text-white/70">{HOUSEHOLD_LABELS[result.householdType]}</span>
        </div>

        {/* Score hero */}
        <div className="px-5 pt-5 pb-4">
          <p className="text-7xl font-bold leading-none" style={{ color: PALETTE.cream }}>
            {formatPercent(result.weightedMatchPercent)}
          </p>
          <p className="text-sm mt-1.5" style={{ color: PALETTE.greenLight }}>
            מהסל תואם לבית שלי
          </p>
        </div>

        {/* Stats grid — 2×2 with color coding */}
        <div className="grid grid-cols-2 gap-2.5 px-5 pb-5">
          {/* Regular count — green */}
          <div className="rounded-xl p-3.5" style={{ background: PALETTE.green }}>
            <p className="text-3xl font-bold text-white">{result.regularCount}</p>
            <p className="text-xs text-white/80 mt-0.5">מוצרים קבועים</p>
          </div>
          {/* Regular cost — cream */}
          <div className="rounded-xl p-3.5" style={{ background: PALETTE.cream }}>
            <p className="text-2xl font-bold" style={{ color: PALETTE.dark }}>{formatCurrency(result.regularCost)}</p>
            <p className="text-xs mt-0.5" style={{ color: "#555" }}>עלות סל קבוע</p>
          </div>
          {/* Sometimes count — light green */}
          <div className="rounded-xl p-3.5" style={{ background: PALETTE.greenLight }}>
            <p className="text-3xl font-bold" style={{ color: PALETTE.dark }}>{result.sometimesCount}</p>
            <p className="text-xs mt-0.5" style={{ color: "#3a5a2a" }}>לפעמים</p>
          </div>
          {/* Max cost — subtle */}
          <div className="rounded-xl p-3.5" style={{ background: "rgba(255,255,211,0.12)" }}>
            <p className="text-2xl font-bold" style={{ color: PALETTE.cream }}>
              {formatCurrency(result.maxCost ?? result.weightedCost)}
            </p>
            <p className="text-xs mt-0.5" style={{ color: PALETTE.greenLight }}>עלות סל מרבי</p>
          </div>
        </div>

        {/* Bottom bar */}
        <div
          className="px-5 py-2.5 flex items-center justify-between"
          style={{ background: PALETTE.green }}
        >
          <span className="text-xs text-white/80">
            {compLabel ? compLabel : ""}
            {result.cityName && result.hasBranchInCity === false && ` · ${result.cityName} — אין קרפור`}
          </span>
          <span className="text-xs text-white/60">
            {typeof window !== "undefined" ? window.location.hostname : "sal-israel"}
          </span>
        </div>
      </div>

      {/* ── Action buttons — always all 3 visible ── */}
      <div className="grid gap-2" style={{ gridTemplateColumns: canShare ? "1fr 1fr 1fr" : "1fr 1fr" }}>
        {canShare && (
          <button
            type="button"
            onClick={handleNativeShare}
            disabled={status === "sharing"}
            className="flex flex-col items-center gap-1.5 py-3.5 rounded-xl border-2 cursor-pointer transition-all duration-150 hover:scale-[1.03] active:scale-95 disabled:opacity-60"
            style={{ background: PALETTE.red, borderColor: PALETTE.red, color: "white" }}
          >
            <Share2 size={20} />
            <span className="text-xs font-bold">{status === "sharing" ? "..." : "שתף"}</span>
          </button>
        )}

        <button
          type="button"
          onClick={handleDownload}
          disabled={status === "downloading"}
          className="flex flex-col items-center gap-1.5 py-3.5 rounded-xl border-2 bg-white cursor-pointer transition-all duration-150 hover:scale-[1.03] active:scale-95 disabled:opacity-60"
          style={{ borderColor: PALETTE.green, color: PALETTE.green }}
        >
          <Download size={20} />
          <span className="text-xs font-bold">{status === "downloading" ? "..." : "הורד תמונה"}</span>
        </button>

        <button
          type="button"
          onClick={handleCopyText}
          className="flex flex-col items-center gap-1.5 py-3.5 rounded-xl border-2 bg-white cursor-pointer transition-all duration-150 hover:scale-[1.03] active:scale-95"
          style={{ borderColor: "#d8d9bc", color: "#555" }}
        >
          {status === "copied" ? <Check size={20} className="text-green-600" /> : <Copy size={20} />}
          <span className="text-xs font-bold">{status === "copied" ? "הועתק!" : "העתק טקסט"}</span>
        </button>
      </div>
    </div>
  );
}
