"use client";

import { useRef, useState, useEffect } from "react";
import type { SurveyResult } from "@/lib/types";
import { HOUSEHOLD_LABELS } from "@/lib/types";
import { formatCurrency, formatPercent } from "@/lib/calculations";
import { Share2, Download, Copy, Check, Loader2 } from "lucide-react";

interface ShareCardProps {
  result: SurveyResult;
  comparisonStatus: "above" | "below" | "at" | null;
}

const P = {
  dark:  "#111814",
  red:   "#A82323",
  cream: "#F7FAEE",
  green: "#6D9E51",
  greenLight: "#BCD9A2",
};

export function ShareCard({ result, comparisonStatus }: ShareCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "copied">("idle");
  // Preload logo as base64 so html2canvas can render it
  const [logoSrc, setLogoSrc] = useState<string>("/logo.png");

  useEffect(() => {
    fetch("/logo.png")
      .then((r) => r.blob())
      .then(
        (blob) =>
          new Promise<string>((res) => {
            const reader = new FileReader();
            reader.onloadend = () => res(reader.result as string);
            reader.readAsDataURL(blob);
          })
      )
      .then(setLogoSrc)
      .catch(() => {}); // fallback to /logo.png
  }, []);

  const compLabel =
    comparisonStatus === "above" ? "מעל הממוצע"
    : comparisonStatus === "below" ? "מתחת לממוצע"
    : null;

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
    `${typeof window !== "undefined" ? window.location.origin : "https://sal-quiz.vercel.app"}`,
  ].filter(Boolean).join("\n");

  async function captureCanvas() {
    if (!cardRef.current) return null;
    try {
      const { default: html2canvas } = await import("html2canvas");
      return html2canvas(cardRef.current, {
        backgroundColor: P.dark,
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        foreignObjectRendering: false,
        imageTimeout: 5000,
      });
    } catch { return null; }
  }

  async function handleShare() {
    setStatus("loading");
    const canvas = await captureCanvas();
    if (!canvas) { setStatus("idle"); return; }

    const blob = await new Promise<Blob | null>((res) =>
      canvas.toBlob(res, "image/png")
    );
    if (!blob) { setStatus("idle"); return; }

    const file = new File([blob], "sal-israel.png", { type: "image/png" });

    if (navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: "הסל של ישראל — התוצאות שלי" });
        setStatus("idle"); return;
      } catch { /* cancelled */ }
    }
    if (navigator.share) {
      try {
        await navigator.share({
          title: "הסל של ישראל",
          text: shareText,
          url: window.location.origin,
        });
        setStatus("idle"); return;
      } catch { /* cancelled */ }
    }
    // Fallback: download
    const url = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url; a.download = "sal-israel-results.png"; a.click();
    setStatus("idle");
  }

  async function handleDownload() {
    setStatus("loading");
    const canvas = await captureCanvas();
    if (!canvas) { setStatus("idle"); return; }
    const a = document.createElement("a");
    a.href = canvas.toDataURL("image/png");
    a.download = "sal-israel-results.png";
    a.click();
    setStatus("idle");
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(shareText);
      setStatus("copied");
      setTimeout(() => setStatus("idle"), 2000);
    } catch { setStatus("idle"); }
  }

  const canShare = typeof navigator !== "undefined" && "share" in navigator;
  const hostname = typeof window !== "undefined"
    ? window.location.hostname.replace("www.", "")
    : "sal-quiz.vercel.app";

  return (
    <div className="space-y-4">
      {/* ── Visual share card captured by html2canvas ── */}
      <div
        ref={cardRef}
        dir="rtl"
        style={{
          background: P.dark,
          fontFamily: "Arial, sans-serif",
          borderRadius: "16px",
          overflow: "hidden",
          userSelect: "none",
          WebkitUserSelect: "none",
        }}
      >
        {/* Header */}
        <div style={{ padding: "20px 24px 0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logoSrc} alt="" width={28} height={28} crossOrigin="anonymous"
              style={{ borderRadius: "6px", objectFit: "contain", opacity: 0.85 }} />
            <span style={{ color: "rgba(255,255,255,0.55)", fontWeight: "700", fontSize: "15px", letterSpacing: "0.02em" }}>
              הסל של ישראל
            </span>
          </div>
          <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "14px" }}>
            {HOUSEHOLD_LABELS[result.householdType]}
          </span>
        </div>

        {/* Score — hero */}
        <div style={{ padding: "16px 24px 18px" }}>
          <div style={{ fontSize: "88px", fontWeight: "800", color: P.cream, lineHeight: 1 }}>
            {formatPercent(result.weightedMatchPercent)}
          </div>
          <div style={{ fontSize: "16px", color: "rgba(255,255,255,0.45)", marginTop: "6px" }}>
            מהסל תואם לבית שלי
          </div>
        </div>

        {/* Thin divider */}
        <div style={{ margin: "0 24px", height: "1px", background: "rgba(255,255,255,0.08)" }} />

        {/* Stats */}
        <div style={{ padding: "18px 24px 20px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "18px 24px" }}>
          <div>
            <div style={{ fontSize: "38px", fontWeight: "800", color: P.green }}>{result.regularCount}</div>
            <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.45)", marginTop: "3px" }}>מוצרים קבועים</div>
          </div>
          <div>
            <div style={{ fontSize: "28px", fontWeight: "700", color: "rgba(255,255,255,0.9)" }}>{formatCurrency(result.regularCost)}</div>
            <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.45)", marginTop: "3px" }}>עלות סל קבוע</div>
          </div>
          <div>
            <div style={{ fontSize: "38px", fontWeight: "800", color: "rgba(255,255,255,0.5)" }}>{result.sometimesCount}</div>
            <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.3)", marginTop: "3px" }}>לפעמים</div>
          </div>
          <div>
            <div style={{ fontSize: "28px", fontWeight: "700", color: "rgba(255,255,255,0.5)" }}>
              {formatCurrency(result.maxCost ?? result.weightedCost)}
            </div>
            <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.3)", marginTop: "3px" }}>עלות סל מרבי</div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ margin: "0 24px", height: "1px", background: "rgba(255,255,255,0.06)" }} />
        <div style={{ padding: "12px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: "13px", color: "rgba(255,255,255,0.3)" }}>
            {compLabel}{result.cityName && result.hasBranchInCity === false ? ` · ${result.cityName} — אין קרפור` : ""}
          </span>
          <span style={{ fontSize: "13px", color: P.green, fontWeight: "700" }}>{hostname}</span>
        </div>
      </div>

      {/* ── Buttons ── */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleShare}
          disabled={status === "loading"}
          className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-sm transition-all duration-150 cursor-pointer hover:opacity-90 active:scale-95 disabled:opacity-60"
          style={{ background: P.red, color: "white" }}
        >
          {status === "loading" ? <Loader2 size={18} className="animate-spin" /> : <Share2 size={18} />}
          {status === "loading" ? "מכין..." : "שתף תמונה"}
        </button>
        <button
          type="button"
          onClick={handleDownload}
          disabled={status === "loading"}
          className="flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl font-semibold text-sm transition-all duration-150 cursor-pointer hover:bg-muted/60 active:scale-95 border border-border bg-white disabled:opacity-60"
        >
          <Download size={18} />
        </button>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl font-semibold text-sm transition-all duration-150 cursor-pointer hover:bg-muted/60 active:scale-95 border border-border bg-white"
        >
          {status === "copied" ? <Check size={18} className="text-green-600" /> : <Copy size={18} />}
        </button>
      </div>
      <p className="text-xs text-muted-foreground text-center">
        "שתף תמונה" — פותח את תפריט השיתוף עם תמונת PNG
      </p>
    </div>
  );
}
