import type { Branch } from "@/lib/types";
import resultsContent from "@/content/he/results.json";

interface CityContextProps {
  cityName: string;
  branches: Branch[];
}

export function CityContext({ cityName, branches }: CityContextProps) {
  const hasBranch = branches.length > 0;

  return (
    <div className={`rounded-xl border p-5 ${hasBranch ? "bg-green-50 border-green-200" : "bg-amber-50 border-amber-200"}`}>
      <h3 className="font-semibold text-sm mb-2">{resultsContent.city.title}</h3>

      {hasBranch ? (
        <div>
          <p className="text-sm text-green-800 mb-3">
            {resultsContent.city.hasBranch
              .replace("{{count}}", String(branches.length))
              .replace("{{city}}", cityName)}
          </p>
          <ul className="space-y-2">
            {branches.map((branch) => (
              <li key={branch.id} className="bg-white/60 rounded-lg border border-green-200 px-3 py-2">
                <p className="text-sm font-medium">{branch.branch_name}</p>
                {branch.address && (
                  <p className="text-xs text-muted-foreground mt-0.5">{branch.address}</p>
                )}
                {branch.format_type && (
                  <p className="text-xs text-green-700 mt-0.5">
                    {resultsContent.city.branchFormat.replace("{{format}}", branch.format_type)}
                  </p>
                )}
              </li>
            ))}
          </ul>
          <p className="text-xs text-green-800/80 mt-3 leading-relaxed">
            {resultsContent.city.branchDataDisclaimer}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm font-semibold text-amber-800">
            {resultsContent.city.noBranch.replace("{{city}}", cityName)}
          </p>
          <p className="text-sm text-amber-700 leading-relaxed">
            {resultsContent.city.noBranchNote}
          </p>
          <p className="text-xs text-amber-800/90 leading-relaxed border-t border-amber-200/80 pt-3">
            {resultsContent.city.noBranchDeliveryNote}
          </p>
        </div>
      )}
    </div>
  );
}
