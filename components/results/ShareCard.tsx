"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { SurveyResult } from "@/lib/types";
import { HOUSEHOLD_LABELS } from "@/lib/types";
import shareContent from "@/content/he/share.json";
import { formatCurrency, formatPercent } from "@/lib/calculations";
import { Share2, Copy, Check } from "lucide-react";

interface ShareCardProps {
  result: SurveyResult;
  comparisonStatus: "above" | "below" | "at" | null;
}

export function ShareCard({ result, comparisonStatus }: ShareCardProps) {
  const [copied, setCopied] = useState(false);

  const lines = [
    shareContent.lines.regularCount.replace(
      "{{count}}",
      String(result.regularCount)
    ),
    shareContent.lines.weightedMatch.replace(
      "{{percent}}",
      String(result.weightedMatchPercent)
    ),
    shareContent.lines.regularCost.replace(
      "{{cost}}",
      result.regularCost.toFixed(2)
    ),
    comparisonStatus === "above"
      ? shareContent.lines.aboveAverage
      : comparisonStatus === "below"
      ? shareContent.lines.belowAverage
      : comparisonStatus === "at"
      ? shareContent.lines.atAverage
      : null,
    result.cityName && result.hasBranchInCity === false
      ? shareContent.lines.noBranch
      : null,
  ].filter(Boolean) as string[];

  const shareText = [
    shareContent.cardTitle,
    "",
    ...lines,
    "",
    shareContent.callToAction.replace("{{url}}", typeof window !== "undefined" ? window.location.origin : ""),
  ].join("\n");

  async function handleCopyText() {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  }

  async function handleNativeShare() {
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareContent.shareTitle,
          text: shareText,
        });
      } catch {
        // cancelled or not supported
      }
    }
  }

  return (
    <div className="space-y-4">
      {/* Visual share card */}
      <div
        id="share-card"
        className="bg-foreground text-background rounded-2xl p-6 space-y-3"
      >
        <p className="text-xs text-background/60 font-medium uppercase tracking-wide">
          {shareContent.siteUrl}
        </p>
        <h2 className="text-lg font-bold leading-tight">
          {shareContent.cardTitle}
        </h2>
        <ul className="space-y-2">
          {lines.map((line, i) => (
            <li key={i} className="text-sm text-background/90 flex items-start gap-2">
              <span className="text-background/40 text-xs mt-0.5 shrink-0">—</span>
              {line}
            </li>
          ))}
        </ul>
        <div className="pt-1 border-t border-background/20">
          <p className="text-xs text-background/50">
            {typeof window !== "undefined" ? window.location.hostname : ""}
          </p>
        </div>
      </div>

      {/* Share buttons */}
      <div className="flex gap-2 flex-wrap">
        {typeof navigator !== "undefined" && "share" in navigator && (
          <Button
            variant="default"
            size="sm"
            onClick={handleNativeShare}
            className="flex items-center gap-2"
          >
            <Share2 size={14} />
            שתף
          </Button>
        )}

        <Button
          variant="outline"
          size="sm"
          onClick={handleCopyText}
          className="flex items-center gap-2"
        >
          {copied ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
          {copied ? shareContent.copySuccess : "העתק טקסט"}
        </Button>
      </div>
    </div>
  );
}
