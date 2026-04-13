import type { Branch } from "@/lib/types";
import resultsContent from "@/content/he/results.json";
import citiesData from "@/data/cities.json";

interface CityContextProps {
  cityName: string;
  branches: Branch[];
}

interface WoltArea {
  area: string;
  cities: string[];
  url: string;
}

function findWoltArea(cityName: string): WoltArea | null {
  const areas = (citiesData as { wolt_delivery_areas?: WoltArea[] }).wolt_delivery_areas ?? [];
  const normalized = cityName.trim().toLowerCase();
  return areas.find((a) =>
    a.cities.some((c) => c.toLowerCase() === normalized || normalized.includes(c.toLowerCase()) || c.toLowerCase().includes(normalized))
  ) ?? null;
}

export function CityContext({ cityName, branches }: CityContextProps) {
  const hasBranch = branches.length > 0;
  const woltArea = hasBranch ? null : findWoltArea(cityName);

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
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm font-semibold text-amber-800">
            {resultsContent.city.noBranch.replace("{{city}}", cityName)}
          </p>
          <p className="text-sm text-amber-700 leading-relaxed">
            {resultsContent.city.noBranchNote}
          </p>

          {woltArea ? (
            <div className="bg-white/70 rounded-lg border border-amber-200 px-3 py-3 mt-1">
              <p className="text-xs font-semibold text-amber-900 mb-1">
                📦 קרפור מספק משלוחים דרך וולט לאזורך
              </p>
              <p className="text-xs text-amber-800 mb-2">
                האזור שלך ({woltArea.area}) מכוסה על ידי שירות המשלוחים.
              </p>
              <a
                href={woltArea.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-semibold rounded-lg px-3 py-1.5 transition-opacity hover:opacity-80"
                style={{ background: "#009DE0", color: "white" }}
              >
                הזמן באמצעות וולט ←
              </a>
            </div>
          ) : (
            <div className="bg-white/50 rounded-lg border border-amber-200 px-3 py-2.5 mt-1">
              <p className="text-xs text-amber-700">
                ייתכן שקרפור מספק משלוחים דרך וולט לחלק מהאזורים.{" "}
                <a
                  href="https://wolt.com/he/isr"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-2 font-medium"
                >
                  בדוק באתר וולט
                </a>
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
