"use client";

import { useRef, useState, useEffect } from "react";
import type { SurveyResult } from "@/lib/types";
import { HOUSEHOLD_LABELS } from "@/lib/types";
import { formatCurrency, formatPercent } from "@/lib/calculations";
import { Share2, Download, Copy, Check, Loader2 } from "lucide-react";
import shareContent from "@/content/he/share.json";
import { TOTAL_GROUPS } from "@/lib/basket-data";

interface ShareCardProps {
  result: SurveyResult;
  comparisonStatus: "above" | "below" | "at" | null;
}

const P = {
  dark: "#111814",
  red: "#A82323",
  cream: "#F7FAEE",
  green: "#6D9E51",
};

export function ShareCard({ result, comparisonStatus }: ShareCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "copied">("idle");
  const [logoSrc, setLogoSrc] = useState<string>("/logo.png");
  const ic = shareContent.imageCard;
  const contextTitle = `סל הממשלה: ${TOTAL_GROUPS} מוצרים`;
  const contextSubtitle = `בשאלון ${TOTAL_GROUPS} שאלות — כמה מהן מתאימות לבית?`;
  const outOfGroups = `מתוך ${TOTAL_GROUPS}`;

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
      .catch(() => {});
  }, []);

  const compShort =
    comparisonStatus === "above" ? ic.comparisonAbove
    : comparisonStatus === "below" ? ic.comparisonBelow
    : null;

  const shareText = [
    `${shareContent.siteUrl}`,
    `${contextTitle} — ${contextSubtitle}`,
    ``,
    `${formatPercent(result.weightedMatchPercent)} — ${ic.matchLabel}`,
    `${result.regularCount} ${outOfGroups} · ${ic.regularLabel}`,
    `${result.sometimesCount} ${outOfGroups} · ${ic.sometimesLabel}`,
    `${ic.costLabel}: ${formatCurrency(result.regularCost)}`,
    `${ic.maxCostLabel}: ${formatCurrency(result.maxCost ?? result.weightedCost)}`,
    compShort ?? null,
    result.cityName && result.hasBranchInCity === false
      ? `${result.cityName}: ${ic.noBranchShort}`
      : null,
    ``,
    `${ic.cta}: ${typeof window !== "undefined" ? window.location.origin : ""}`,
  ]
    .filter(Boolean)
    .join("\n");

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
    } catch {
      return null;
    }
  }

  async function handleShare() {
    setStatus("loading");
    const canvas = await captureCanvas();
    if (!canvas) {
      setStatus("idle");
      return;
    }

    const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/png"));
    if (!blob) {
      setStatus("idle");
      return;
    }

    const file = new File([blob], "sal-israel.png", { type: "image/png" });

    if (navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: shareContent.shareTitle,
        });
        setStatus("idle");
        return;
      } catch {
        /* cancelled */
      }
    }
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareContent.shareTitle,
          text: shareText,
          url: window.location.origin,
        });
        setStatus("idle");
        return;
      } catch {
        /* cancelled */
      }
    }
    const url = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = "sal-israel-results.png";
    a.click();
    setStatus("idle");
  }

  async function handleDownload() {
    setStatus("loading");
    const canvas = await captureCanvas();
    if (!canvas) {
      setStatus("idle");
      return;
    }
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
    } catch {
      setStatus("idle");
    }
  }

  const hostname =
    typeof window !== "undefined" ? window.location.hostname.replace("www.", "") : "sal-quiz.vercel.app";

  return (
    <div className="space-y-4">
      <div
        ref={cardRef}
        dir="rtl"
        style={{
          background: P.dark,
          fontFamily: "Arial, Helvetica, sans-serif",
          borderRadius: "16px",
          overflow: "hidden",
          userSelect: "none",
          WebkitUserSelect: "none",
          minHeight: "580px",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Brand row */}
        <div
          style={{
            padding: "18px 22px 0",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={logoSrc}
              alt=""
              width={36}
              height={36}
              crossOrigin="anonymous"
              style={{ borderRadius: "8px", objectFit: "contain", flexShrink: 0 }}
            />
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  color: P.cream,
                  fontWeight: "800",
                  fontSize: "17px",
                  letterSpacing: "0.01em",
                  lineHeight: 1.2,
                }}
              >
                {shareContent.siteUrl}
              </div>
              <div style={{ color: "rgba(255,255,255,0.42)", fontSize: "12px", marginTop: "4px" }}>
                {HOUSEHOLD_LABELS[result.householdType]}
              </div>
            </div>
          </div>
        </div>

        {/* What this is — instant context for viewers */}
        <div style={{ padding: "16px 22px 8px" }}>
          <div style={{ color: P.green, fontWeight: "800", fontSize: "15px", lineHeight: 1.35 }}>
            {contextTitle}
          </div>
          <div style={{ color: "rgba(255,255,255,0.72)", fontSize: "14px", marginTop: "6px", lineHeight: 1.45 }}>
            {contextSubtitle}
          </div>
        </div>

        {/* Hero: match % — generous line-height avoids overlap in html2canvas on narrow viewports */}
        <div style={{ padding: "8px 22px 14px", textAlign: "center" as const }}>
          <div
            style={{
              fontSize: "clamp(56px, 18vw, 92px)",
              fontWeight: "800",
              color: P.cream,
              lineHeight: 1.08,
              letterSpacing: "-0.02em",
              paddingBottom: "6px",
            }}
          >
            {formatPercent(result.weightedMatchPercent)}
          </div>
          <div style={{ fontSize: "17px", color: "rgba(255,255,255,0.5)", marginTop: "12px", fontWeight: "600", lineHeight: 1.35 }}>
            {ic.matchLabel}
          </div>
        </div>

        <div style={{ margin: "8px 22px", height: "1px", background: "rgba(255,255,255,0.1)" }} />

        {/* Regular vs sometimes — two columns */}
        <div
          style={{
            padding: "12px 22px 10px",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "14px",
            textAlign: "center" as const,
          }}
        >
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                flexWrap: "wrap" as const,
                minHeight: "52px",
                paddingBottom: "8px",
              }}
            >
              <span style={{ fontSize: "clamp(32px, 10vw, 44px)", fontWeight: "800", color: P.green, lineHeight: 1.2 }}>
                {result.regularCount}
              </span>
              <span style={{ fontSize: "clamp(14px, 4vw, 18px)", fontWeight: "700", color: "rgba(255,255,255,0.4)", lineHeight: 1.3 }}>
                {outOfGroups}
              </span>
            </div>
            <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.62)", marginTop: "2px", fontWeight: "600", lineHeight: 1.4 }}>
              {ic.regularLabel}
            </div>
          </div>
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                flexWrap: "wrap" as const,
                minHeight: "52px",
                paddingBottom: "8px",
              }}
            >
              <span style={{ fontSize: "clamp(32px, 10vw, 44px)", fontWeight: "800", color: "rgba(255,255,255,0.5)", lineHeight: 1.2 }}>
                {result.sometimesCount}
              </span>
              <span style={{ fontSize: "clamp(14px, 4vw, 18px)", fontWeight: "700", color: "rgba(255,255,255,0.32)", lineHeight: 1.3 }}>
                {outOfGroups}
              </span>
            </div>
            <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.38)", marginTop: "2px", fontWeight: "600", lineHeight: 1.4 }}>
              {ic.sometimesLabel}
            </div>
          </div>
        </div>

        {/* Costs — regular + max basket */}
        <div style={{ margin: "8px 22px 0", display: "flex", flexDirection: "column" as const, gap: "10px" }}>
          <div
            style={{
              padding: "12px 14px",
              borderRadius: "12px",
              background: "rgba(255,255,255,0.06)",
              textAlign: "center" as const,
            }}
          >
            <div style={{ fontSize: "28px", fontWeight: "800", color: P.cream, lineHeight: 1.2, paddingBottom: "2px" }}>
              {formatCurrency(result.regularCost)}
            </div>
            <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", marginTop: "8px", lineHeight: 1.35 }}>
              {ic.costLabel}
            </div>
          </div>
          <div
            style={{
              padding: "10px 14px",
              borderRadius: "12px",
              background: "rgba(255,255,255,0.04)",
              textAlign: "center" as const,
            }}
          >
            <div style={{ fontSize: "22px", fontWeight: "700", color: "rgba(255,255,255,0.55)", lineHeight: 1.25, paddingBottom: "2px" }}>
              {formatCurrency(result.maxCost ?? result.weightedCost)}
            </div>
            <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.32)", marginTop: "8px", lineHeight: 1.35 }}>
              {ic.maxCostLabel}
            </div>
          </div>
        </div>

        {/* Optional one-liners — small, does not compete with hero */}
        {(compShort || (result.cityName && result.hasBranchInCity === false)) && (
          <div style={{ padding: "14px 22px 0", textAlign: "center" as const }}>
            {compShort && (
              <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.38)" }}>{compShort}</div>
            )}
            {result.cityName && result.hasBranchInCity === false && (
              <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.32)", marginTop: compShort ? "6px" : 0 }}>
                {result.cityName} — {ic.noBranchShort}
              </div>
            )}
          </div>
        )}

        <div style={{ flex: 1 }} />

        {/* CTA footer — discovery */}
        <div
          style={{
            marginTop: "18px",
            padding: "16px 22px 20px",
            borderTop: "1px solid rgba(255,255,255,0.08)",
            textAlign: "center" as const,
          }}
        >
          <div style={{ fontSize: "15px", fontWeight: "800", color: P.cream, marginBottom: "6px" }}>{ic.cta}</div>
          <div style={{ fontSize: "14px", color: P.green, fontWeight: "700", wordBreak: "break-all" as const }}>{hostname}</div>
        </div>
      </div>

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
    </div>
  );
}
