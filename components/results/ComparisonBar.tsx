import { compareToAverage } from "@/lib/calculations";
import resultsContent from "@/content/he/results.json";

interface ComparisonBarProps {
  title: string;
  hint?: string;
  userValue: number;
  avgValue: number | null;
  formatter?: (v: number) => string;
  higherIsBetter?: boolean;
  averageLabel?: string;
}

export function ComparisonBar({
  title,
  hint,
  userValue,
  avgValue,
  formatter = (v) => String(v),
  higherIsBetter = true,
  averageLabel = resultsContent.comparison.peerAverage,
}: ComparisonBarProps) {
  if (avgValue === null) return null;

  const comparison = compareToAverage(userValue, avgValue);
  const isAbove = comparison === "above";
  const isBelow = comparison === "below";

  const isPositive = higherIsBetter ? isAbove : isBelow;
  const isNegative = higherIsBetter ? isBelow : isAbove;

  const comparisonLabel =
    comparison === "above"
      ? resultsContent.comparison.aboveAverage
      : comparison === "below"
        ? resultsContent.comparison.belowAverage
        : resultsContent.comparison.atAverage;

  const indicatorColor = isPositive
    ? "text-green-800 bg-green-50 border-green-200"
    : isNegative
      ? "text-red-800 bg-red-50 border-red-200"
      : "text-muted-foreground bg-muted border-border";

  return (
    <div className="py-4 border-b border-border last:border-0">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground leading-tight">{title}</p>
          {hint ? (
            <p className="text-[10px] text-muted-foreground mt-1 leading-snug">{hint}</p>
          ) : null}
        </div>
        <span
          className={`shrink-0 text-sm font-semibold px-3 py-1.5 rounded-xl border ${indicatorColor}`}
        >
          {comparisonLabel}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="min-w-0">
          <p className="text-[10px] font-medium text-muted-foreground mb-1">
            {resultsContent.comparison.yourValue}
          </p>
          <p className="text-3xl font-bold tabular-nums tracking-tight text-foreground break-all leading-none">
            {formatter(userValue)}
          </p>
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-medium text-muted-foreground mb-1">{averageLabel}</p>
          <p className="text-3xl font-bold tabular-nums tracking-tight text-muted-foreground break-all leading-none">
            {formatter(avgValue)}
          </p>
        </div>
      </div>
    </div>
  );
}
