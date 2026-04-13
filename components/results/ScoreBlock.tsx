interface ScoreBlockProps {
  label: string;
  value: string;
  subValue?: string;
  highlight?: boolean;
}

export function ScoreBlock({ label, value, subValue, highlight }: ScoreBlockProps) {
  return (
    <div
      className={`
        rounded-xl border p-4 text-center
        ${highlight ? "bg-foreground text-background border-foreground" : "bg-background border-border"}
      `}
    >
      <div className={`text-2xl font-bold mb-1 ${highlight ? "text-background" : "text-foreground"}`}>
        {value}
      </div>
      <div className={`text-xs leading-tight ${highlight ? "text-background/70" : "text-muted-foreground"}`}>
        {label}
      </div>
      {subValue && (
        <div className={`text-xs mt-1 font-medium ${highlight ? "text-background/80" : "text-foreground/70"}`}>
          {subValue}
        </div>
      )}
    </div>
  );
}
