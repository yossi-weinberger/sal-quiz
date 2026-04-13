"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import type { SurveyResult } from "@/lib/types";
import { HOUSEHOLD_LABELS } from "@/lib/types";
import { formatCurrency, formatPercent } from "@/lib/calculations";
import { Share2, Download, Check } from "lucide-react";

interface ShareCardProps {
  result: SurveyResult;
  comparisonStatus: "above" | "below" | "at" | null;
}

export function ShareCard({ result, comparisonStatus }: ShareCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);
  const [shared, setShared] = useState(false);

  const compLabel =
    comparisonStatus === "above" ? "מעל הממוצע"
    : comparisonStatus === "below" ? "מתחת לממוצע"
    : comparisonStatus === "at" ? "בממוצע"
    : null;

  async function handleDownload() {
    if (!cardRef.current) return;
    setDownloading(true);
    try {
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: "#A82323",
        scale: 2,
        useCORS: true,
        logging: false,
      });
      const url = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = url;
      a.download = "sal-israel-results.png";
      a.click();
    } catch (e) {
      console.error("Download failed", e);
    } finally {
      setDownloading(false);
    }
  }

  async function handleNativeShare() {
    if (!cardRef.current) return;
    try {
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: "#A82323",
        scale: 2,
        useCORS: true,
        logging: false,
      });
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        const file = new File([blob], "sal-israel.png", { type: "image/png" });
        if (navigator.canShare?.({ files: [file] })) {
          await navigator.share({ files: [file], title: "הסל של ישראל — התוצאות שלי" });
          setShared(true);
          setTimeout(() => setShared(false), 2000);
        } else {
          // Fallback: download
          handleDownload();
        }
      }, "image/png");
    } catch (e) {
      console.error("Share failed", e);
    }
  }

  return (
    <div className="space-y-4">
      {/* Visual card to capture */}
      <div
        ref={cardRef}
        dir="rtl"
        className="rounded-2xl p-6 select-none"
        style={{ background: "#A82323", color: "white", fontFamily: "Heebo, Arial, sans-serif" }}
      >
        {/* Site name */}
        <p className="text-xs font-medium opacity-60 tracking-widest mb-4 uppercase">
          הסל של ישראל
        </p>

        {/* Main score */}
        <div className="mb-5">
          <p className="text-6xl font-bold leading-none mb-1">
            {formatPercent(result.weightedMatchPercent)}
          </p>
          <p className="text-sm opacity-80">מהסל תואם לבית שלי</p>
        </div>

        {/* Divider */}
        <div className="h-px bg-white/20 mb-5" />

        {/* Stats grid */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            <div className="bg-white/10 rounded-xl p-3">
              <p className="text-2xl font-bold">{result.regularCount}</p>
              <p className="text-xs opacity-70 mt-0.5">תמיד קונה</p>
            </div>
            <div className="bg-white/10 rounded-xl p-3">
              <p className="text-2xl font-bold">{formatCurrency(result.regularCost)}</p>
              <p className="text-xs opacity-70 mt-0.5">עלות סל קבוע</p>
            </div>
            <div className="bg-white/10 rounded-xl p-3">
              <p className="text-2xl font-bold">{result.sometimesCount}</p>
              <p className="text-xs opacity-70 mt-0.5">קונה לפעמים</p>
            </div>
            <div className="bg-white/10 rounded-xl p-3">
              <p className="text-2xl font-bold">{formatCurrency(result.maxCost ?? result.weightedCost)}</p>
              <p className="text-xs opacity-70 mt-0.5">עלות מקסימלית</p>
            </div>
          </div>

        {/* Context row */}
        <div className="flex items-center justify-between text-xs opacity-70">
          <span>{HOUSEHOLD_LABELS[result.householdType]}</span>
          {compLabel && <span>{compLabel}</span>}
          {result.cityName && (
            <span>{result.cityName}{result.hasBranchInCity === false ? " · אין סניף קרפור" : ""}</span>
          )}
        </div>

        {/* Bottom bar */}
        <div className="mt-4 pt-4 border-t border-white/20">
          <p className="text-xs opacity-50 text-center">
            sal-israel.vercel.app
          </p>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2">
        {"share" in navigator && (
          <Button
            variant="default"
            size="sm"
            onClick={handleNativeShare}
            disabled={shared}
            className="flex-1 bg-brand-red hover:bg-brand-red/90 text-white gap-2"
          >
            {shared ? <Check size={14} /> : <Share2 size={14} />}
            שתף תמונה
          </Button>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={handleDownload}
          disabled={downloading}
          className="flex-1 gap-2"
        >
          <Download size={14} />
          {downloading ? "יוצר..." : "הורד PNG"}
        </Button>
      </div>
    </div>
  );
}
