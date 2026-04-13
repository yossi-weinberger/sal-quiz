import { LandingForm } from "@/components/layout/LandingForm";
import homeContent from "@/content/he/home.json";
import branchesData from "@/data/branches.json";
import israeliCitiesData from "@/data/israeli-cities.json";
import { getCarrefourCities } from "@/lib/city-matching";
import type { Branch } from "@/lib/types";

export default function HomePage() {
  const branches = branchesData as Branch[];
  const carrefourCities = getCarrefourCities(branches);

  // Merge: all Israeli cities + Carrefour cities, deduplicated, sorted
  const allCitiesSet = new Set([
    ...carrefourCities,
    ...israeliCitiesData.cities,
  ]);
  const allCities = Array.from(allCitiesSet).sort((a, b) =>
    a.localeCompare(b, "he")
  );

  return (
    <main className="min-h-screen flex flex-col bg-background">
      <section className="flex-1 flex flex-col items-center justify-center px-4 py-12 sm:py-16 max-w-xl mx-auto w-full">
        {/* Title */}
        <div className="w-full text-center mb-10">
          <div className="inline-block bg-foreground/5 border border-border rounded-full px-4 py-1 text-xs font-medium text-muted-foreground mb-5 tracking-wide">
            כלי השוואה ציבורי
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4 leading-tight">
            {homeContent.title}
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-md mx-auto">
            {homeContent.subtitle}
          </p>
        </div>

        {/* Intro */}
        <div className="w-full rounded-2xl border border-border bg-muted/30 p-5 mb-5 space-y-2.5 text-sm text-foreground/80 leading-relaxed">
          <p>{homeContent.intro.paragraph1}</p>
          <p>{homeContent.intro.paragraph2}</p>
        </div>

        {/* Stats row */}
        <div className="w-full grid grid-cols-3 gap-2.5 mb-6">
          {[
            { label: "107 מוצרים", sub: "בסל הרשמי" },
            { label: "₪1,098", sub: "מחיר מלא" },
            { label: "אנונימי", sub: "100%" },
          ].map((s) => (
            <div
              key={s.label}
              className="border border-border rounded-xl p-3 text-center"
            >
              <p className="font-bold text-sm text-foreground">{s.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{s.sub}</p>
            </div>
          ))}
        </div>

        {/* Privacy note */}
        <div className="w-full flex gap-3 items-start border border-green-200 bg-green-50 rounded-xl p-4 mb-8">
          <div className="shrink-0 w-5 h-5 rounded-full bg-green-600 flex items-center justify-center mt-0.5">
            <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
              <path d="M1 4l3 3 5-6" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-green-900 mb-0.5">{homeContent.privacy.title}</p>
            <p className="text-sm text-green-800/80 leading-relaxed">
              {homeContent.privacy.text}
            </p>
          </div>
        </div>

        {/* Form */}
        <LandingForm cities={allCities} carrefourCities={carrefourCities} />

        {/* Methodology */}
        <div className="w-full mt-8 text-center">
          <p className="text-xs text-muted-foreground leading-relaxed max-w-md mx-auto">
            <span className="font-semibold">{homeContent.methodology.title}:</span>{" "}
            {homeContent.methodology.text}
          </p>
        </div>
      </section>
    </main>
  );
}
