"use client";

import { useRef, useState } from "react";
import type { SurveyResult } from "@/lib/types";
import { HOUSEHOLD_LABELS } from "@/lib/types";
import { formatCurrency, formatPercent } from "@/lib/calculations";
import { Share2, Download, Check, Copy } from "lucide-react";

interface ShareCardProps {
  result: SurveyResult;
  comparisonStatus: "above" | "below" | "at" | null;
}

export function ShareCard({ result, comparisonStatus }: ShareCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<"idle" | "downloading" | "sharing" | "copied">("idle");

  const compLabel =
    comparisonStatus === "above" ? "מעל הממוצע"
    : comparisonStatus === "below" ? "מתחת לממוצע"
    : comparisonStatus === "at" ? "בממוצע"
    : null;

  const shareText = [
    `הסל של ישראל — התוצאות שלי`,
    ``,
    `${formatPercent(result.weightedMatchPercent)} מהסל תואם לבית שלי`,
    `${result.regularCount} מוצרים קבועים מתוך 107`,
    `עלות מוצרים קבועים: ${formatCurrency(result.regularCost)}`,
    compLabel ? `השוואה למשתמשים: ${compLabel}` : null,
    result.cityName && result.hasBranchInCity === false ? `בית שלי (${result.cityName}) — אין סניף קרפור` : null,
    ``,
    `בדוק גם את הסל שלך: ${typeof window !== "undefined" ? window.location.origin : ""}`,
  ].filter(Boolean).join("\n");

  async function captureCanvas() {
    if (!cardRef.current) return null;
    const html2canvas = (await import("html2canvas")).default;
    return html2canvas(cardRef.current, {
      backgroundColor: "#A82323",
      scale: 2,
      useCORS: true,
      logging: false,
      foreignObjectRendering: false,
    });
  }

  async function handleNativeShare() {
    setStatus("sharing");
    try {
      // Try image share first
      const canvas = await captureCanvas();
      if (canvas) {
        const blob = await new Promise<Blob | null>((res) =>
          canvas.toBlob(res, "image/png")
        );
        if (blob) {
          const file = new File([blob], "sal-israel.png", { type: "image/png" });
          if (navigator.canShare?.({ files: [file] })) {
            await navigator.share({ files: [file], title: "הסל של ישראל" });
            setStatus("idle");
            return;
          }
        }
      }
      // Fallback: share text only
      if (navigator.share) {
        await navigator.share({ title: "הסל של ישראל", text: shareText });
      }
      setStatus("idle");
    } catch {
      setStatus("idle");
    }
  }

  async function handleDownload() {
    setStatus("downloading");
    try {
      const canvas = await captureCanvas();
      if (!canvas) return;
      const url = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = url;
      a.download = "sal-israel-results.png";
      a.click();
    } catch (e) {
      console.error(e);
    } finally {
      setStatus("idle");
    }
  }

  async function handleCopyText() {
    try {
      await navigator.clipboard.writeText(shareText);
      setStatus("copied");
      setTimeout(() => setStatus("idle"), 2000);
    } catch {
      setStatus("idle");
    }
  }

  const canNativeShare = typeof navigator !== "undefined" && "share" in navigator;

  return (
    <div className="space-y-4">
      {/* Visual card to capture */}
      <div
        ref={cardRef}
        dir="rtl"
        className="rounded-2xl p-6 select-none"
        style={{ background: "#A82323", color: "white", fontFamily: "Heebo, Arial, sans-serif" }}
      >
        <p className="text-xs opacity-50 tracking-widest mb-5 uppercase">הסל של ישראל</p>

        <p className="text-6xl font-bold leading-none mb-1">
          {formatPercent(result.weightedMatchPercent)}
        </p>
        <p className="text-sm opacity-75 mb-5">מהסל תואם לבית שלי</p>

        <div className="h-px bg-white/20 mb-5" />

        <div className="grid grid-cols-2 gap-2.5 mb-5">
          {[
            { v: `${result.regularCount}`, l: "מוצרים קבועים" },
            { v: formatCurrency(result.regularCost), l: "עלות סל קבוע" },
            { v: `${result.sometimesCount}`, l: "מוצרים לפעמים" },
            { v: formatCurrency(result.maxCost ?? result.weightedCost), l: "עלות סל מרבי" },
          ].map(({ v, l }) => (
            <div key={l} className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.12)" }}>
              <p className="text-xl font-bold">{v}</p>
              <p className="text-xs opacity-65 mt-0.5">{l}</p>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between text-xs opacity-60">
          <span>{HOUSEHOLD_LABELS[result.householdType]}</span>
          {compLabel && <span>{compLabel}</span>}
          {result.cityName && (
            <span>{result.cityName}{result.hasBranchInCity === false ? " · אין קרפור" : ""}</span>
          )}
        </div>

        <div className="mt-4 pt-3 border-t border-white/20 text-xs opacity-40 text-center">
          {typeof window !== "undefined" ? window.location.hostname : "sal-israel"}
        </div>
      </div>

      {/* Share action buttons */}
      <div className="grid grid-cols-3 gap-2">
        {/* Native share — most prominent */}
        {canNativeShare && (
          <button
            type="button"
            onClick={handleNativeShare}
            disabled={status === "sharing"}
            className="flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border-2 transition-all duration-150 cursor-pointer hover:scale-[1.02] active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2"
            style={{
              background: "#A82323",
              borderColor: "#A82323",
              color: "white",
            }}
          >
            <Share2 size={18} />
            <span className="text-xs font-semibold">{status === "sharing" ? "..." : "שתף"}</span>
          </button>
        )}

        {/* Download PNG */}
        <button
          type="button"
          onClick={handleDownload}
          disabled={status === "downloading"}
          className="flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border-2 border-border bg-white transition-all duration-150 text-foreground cursor-pointer hover:border-foreground/40 hover:bg-muted/30 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2"
        >
          <Download size={18} />
          <span className="text-xs font-semibold">{status === "downloading" ? "..." : "הורד תמונה"}</span>
        </button>

        {/* Copy text */}
        <button
          type="button"
          onClick={handleCopyText}
          className="flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border-2 border-border bg-white transition-all duration-150 text-foreground cursor-pointer hover:border-foreground/40 hover:bg-muted/30 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2"
        >
          {status === "copied" ? <Check size={18} className="text-green-600" /> : <Copy size={18} />}
          <span className="text-xs font-semibold">{status === "copied" ? "הועתק!" : "העתק טקסט"}</span>
        </button>
      </div>
    </div>
  );
}
