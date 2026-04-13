import { compareToAverage } from "@/lib/calculations";
import resultsContent from "@/content/he/results.json";

interface ComparisonBarProps {
  label: string;
  userValue: number;
  avgValue: number | null;
  formatter?: (v: number) => string;
  higherIsBetter?: boolean;
}

export function ComparisonBar({
  label,
  userValue,
  avgValue,
  formatter = (v) => String(v),
  higherIsBetter = true,
}: ComparisonBarProps) {
  if (avgValue === null) return null;

  const comparison = compareToAverage(userValue, avgValue);
  const isAbove = comparison === "above";
  const isBelow = comparison === "below";

  // Determine if this is "good" or "bad" for the user
  const isPositive = higherIsBetter ? isAbove : isBelow;
  const isNegative = higherIsBetter ? isBelow : isAbove;

  const comparisonLabel =
    comparison === "above"
      ? resultsContent.comparison.aboveAverage
      : comparison === "below"
      ? resultsContent.comparison.belowAverage
      : resultsContent.comparison.atAverage;

  const indicatorColor = isPositive
    ? "text-green-700 bg-green-50 border-green-200"
    : isNegative
    ? "text-red-700 bg-red-50 border-red-200"
    : "text-muted-foreground bg-muted border-border";

  return (
    <div className="flex items-center justify-between gap-3 py-3 border-b border-border last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground">{label}</p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-muted-foreground">
            {resultsContent.comparison.yourScore}: {formatter(userValue)}
          </span>
          <span className="text-xs text-muted-foreground">·</span>
          <span className="text-xs text-muted-foreground">
            {resultsContent.comparison.communityAverage}: {formatter(avgValue)}
          </span>
        </div>
      </div>
      <span
        className={`shrink-0 text-xs font-medium px-2.5 py-1 rounded-full border ${indicatorColor}`}
      >
        {comparisonLabel}
      </span>
    </div>
  );
}
