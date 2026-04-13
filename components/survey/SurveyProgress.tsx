"use client";

import surveyContent from "@/content/he/survey.json";

interface SurveyProgressProps {
  answered: number;
  total: number;
  onScrollToNext: () => void;
  allAnswered: boolean;
}

export function SurveyProgress({
  answered,
  total,
  onScrollToNext,
  allAnswered,
}: SurveyProgressProps) {
  const percent = Math.round((answered / total) * 100);

  return (
    <div className="sticky top-0 z-40 backdrop-blur-sm border-b border-border"
         style={{ background: "rgba(254,255,211,0.97)" }}>
      <div className="max-w-xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4 mb-2">
          <div className="flex items-center gap-2">
            {allAnswered ? (
              <span className="text-sm font-bold" style={{ color: "#6D9E51" }}>
                {surveyContent.progress.complete} ✓
              </span>
            ) : (
              <>
                <span className="text-sm font-semibold text-foreground">
                  {answered} / {total}
                </span>
                <span className="text-xs text-muted-foreground">
                  מוצרים ({percent}%)
                </span>
              </>
            )}
          </div>

          {!allAnswered && answered > 0 && (
            <button
              type="button"
              onClick={onScrollToNext}
              className="text-xs font-medium underline underline-offset-2 hover:no-underline transition-all shrink-0"
              style={{ color: "#A82323" }}
            >
              הבא ↓
            </button>
          )}
        </div>

        {/* Brand-red progress bar */}
        <div className="h-1.5 bg-black/10 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{
              width: `${percent}%`,
              background: allAnswered ? "#6D9E51" : "#A82323",
            }}
            role="progressbar"
            aria-valuenow={percent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${percent}% הושלם`}
          />
        </div>
      </div>
    </div>
  );
}
