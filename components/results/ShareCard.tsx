"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import type { SurveyResult } from "@/lib/types";
import { HOUSEHOLD_LABELS } from "@/lib/types";
import { formatCurrency, formatPercent } from "@/lib/calculations";
import { Share2, Download, Copy, Check, Loader2 } from "lucide-react";

interface ShareCardProps {
  result: SurveyResult;
  comparisonStatus: "above" | "below" | "at" | null;
}

export function ShareCard({ result, comparisonStatus }: ShareCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "copied">("idle");

  const compLabel =
    comparisonStatus === "above" ? "מעל הממוצע"
    : comparisonStatus === "below" ? "מתחת לממוצע"
    : null;

  async function captureImage(): Promise<{ blob: Blob; dataUrl: string } | null> {
    if (!cardRef.current) return null;
    try {
      const { default: html2canvas } = await import("html2canvas");
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: "#111814",
        scale: 2,
        useCORS: true,
        logging: false,
        foreignObjectRendering: false,
      });
      const dataUrl = canvas.toDataURL("image/png");
      const blob = await new Promise<Blob>((res, rej) =>
        canvas.toBlob((b) => (b ? res(b) : rej()), "image/png")
      );
      return { blob, dataUrl };
    } catch { return null; }
  }

  /** One button — opens native share sheet on mobile, downloads on desktop */
  async function handleShare() {
    setStatus("loading");
    const img = await captureImage();
    if (!img) { setStatus("idle"); return; }

    const file = new File([img.blob], "sal-israel.png", { type: "image/png" });

    // Try native share with image (works on iOS Safari, Chrome Android)
    if (navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: "הסל של ישראל — התוצאות שלי" });
        setStatus("idle");
        return;
      } catch { /* user cancelled */ }
    }

    // Try native share text-only
    if (navigator.share) {
      try {
        await navigator.share({
          title: "הסל של ישראל",
          text: `${formatPercent(result.weightedMatchPercent)} מהסל תואם לבית שלי · ${result.regularCount} מוצרים קבועים`,
          url: window.location.origin,
        });
        setStatus("idle");
        return;
      } catch { /* user cancelled */ }
    }

    // Fallback: download the image
    const a = document.createElement("a");
    a.href = img.dataUrl;
    a.download = "sal-israel-results.png";
    a.click();
    setStatus("idle");
  }

  async function handleCopy() {
    const text = [
      `הסל של ישראל — התוצאות שלי`,
      `${formatPercent(result.weightedMatchPercent)} מהסל תואם לבית שלי`,
      `${result.regularCount} מוצרים קבועים · עלות: ${formatCurrency(result.regularCost)}`,
      compLabel ? compLabel : null,
      window.location.origin,
    ].filter(Boolean).join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setStatus("copied");
      setTimeout(() => setStatus("idle"), 2000);
    } catch { setStatus("idle"); }
  }

  const isLoading = status === "loading";

  return (
    <div className="space-y-4">
      {/* ── Preview card (captured by html2canvas) ── */}
      <div
        ref={cardRef}
        dir="rtl"
        className="rounded-2xl overflow-hidden"
        style={{ background: "#111814", fontFamily: "Heebo, Arial, sans-serif", userSelect: "none" }}
      >
        {/* Header row */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div className="flex items-center gap-2">
            <Image src="/logo.png" alt="לוגו" width={26} height={26} className="rounded-md" />
            <span className="text-sm font-semibold" style={{ color: "#BCD9A2" }}>הסל של ישראל</span>
          </div>
          <span className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
            {HOUSEHOLD_LABELS[result.householdType]}
          </span>
        </div>

        {/* Score */}
        <div className="px-5 pb-4">
          <p className="text-7xl font-bold leading-none" style={{ color: "#F7FAEE" }}>
            {formatPercent(result.weightedMatchPercent)}
          </p>
          <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.5)" }}>
            מהסל תואם לבית שלי
          </p>
        </div>

        {/* Thin divider */}
        <div className="mx-5 h-px" style={{ background: "rgba(255,255,255,0.08)" }} />

        {/* Stats — clean text rows, no colored boxes */}
        <div className="px-5 py-4 grid grid-cols-2 gap-y-3">
          <div>
            <p className="text-2xl font-bold" style={{ color: "#6D9E51" }}>{result.regularCount}</p>
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>מוצרים קבועים</p>
          </div>
          <div>
            <p className="text-2xl font-bold" style={{ color: "#F7FAEE" }}>{formatCurrency(result.regularCost)}</p>
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>עלות סל קבוע</p>
          </div>
          <div>
            <p className="text-2xl font-bold" style={{ color: "rgba(255,255,255,0.6)" }}>{result.sometimesCount}</p>
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>לפעמים</p>
          </div>
          <div>
            <p className="text-2xl font-bold" style={{ color: "rgba(255,255,255,0.6)" }}>{formatCurrency(result.maxCost ?? result.weightedCost)}</p>
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>עלות סל מרבי</p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 flex items-center justify-between" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <span className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
            {result.cityName && result.hasBranchInCity === false && `${result.cityName} — אין קרפור · `}
            {compLabel || ""}
          </span>
          <span className="text-xs font-medium" style={{ color: "#6D9E51" }}>
            {typeof window !== "undefined" ? window.location.hostname : "sal-israel"}
          </span>
        </div>
      </div>

      {/* ── Buttons ── */}
      <div className="flex gap-2">
        {/* Primary: Share / Download */}
        <button
          type="button"
          onClick={handleShare}
          disabled={isLoading}
          className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-sm transition-all duration-150 cursor-pointer hover:opacity-90 active:scale-95 disabled:opacity-60"
          style={{ background: "#A82323", color: "white" }}
        >
          {isLoading
            ? <Loader2 size={18} className="animate-spin" />
            : <Share2 size={18} />
          }
          {isLoading ? "מכין..." : "שתף תמונה"}
        </button>

        {/* Secondary: Copy text */}
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl font-semibold text-sm transition-all duration-150 cursor-pointer hover:bg-muted/60 active:scale-95 border border-border bg-white"
          style={{ color: status === "copied" ? "#6D9E51" : undefined }}
        >
          {status === "copied" ? <Check size={18} /> : <Copy size={18} />}
          <span className="hidden sm:inline">{status === "copied" ? "הועתק" : "העתק"}</span>
        </button>
      </div>

      <p className="text-xs text-muted-foreground text-center">
        לחיצה על "שתף תמונה" תפתח את תפריט השיתוף של המכשיר
      </p>
    </div>
  );
}
