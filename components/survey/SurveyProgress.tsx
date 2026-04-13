"use client";

import { Progress } from "@/components/ui/progress";
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
    <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="max-w-2xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4 mb-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-foreground">
              {allAnswered
                ? surveyContent.progress.complete
                : surveyContent.progress.answered
                    .replace("{{answered}}", String(answered))
                    .replace("{{total}}", String(total))}
            </span>
            <span className="text-xs text-muted-foreground">
              ({percent}%)
            </span>
          </div>

          {!allAnswered && answered > 0 && (
            <button
              type="button"
              onClick={onScrollToNext}
              className="text-xs text-primary underline underline-offset-2 hover:no-underline transition-all shrink-0"
            >
              קפוץ לשאלה הבאה
            </button>
          )}
        </div>

        <Progress
          value={percent}
          className="h-1.5"
          aria-label={`${percent}% הושלם`}
        />
      </div>
    </div>
  );
}
