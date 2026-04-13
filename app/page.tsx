import Image from "next/image";
import { LandingForm } from "@/components/layout/LandingForm";
import homeContent from "@/content/he/home.json";
import disclaimerContent from "@/content/he/disclaimer.json";
import officialProgram from "@/content/he/official-program.json";
import branchesData from "@/data/branches.json";
import israeliCitiesData from "@/data/israeli-cities.json";
import { getCarrefourCities } from "@/lib/city-matching";
import type { Branch, Product } from "@/lib/types";
import productsData from "@/data/products.json";
import { formatCurrency, sumOfficialBasketPrice } from "@/lib/calculations";

export default function HomePage() {
  const products = productsData as Product[];
  const fullBasketTotal = sumOfficialBasketPrice(products);

  const branches = branchesData as Branch[];
  const carrefourCities = getCarrefourCities(branches);
  const allCitiesSet = new Set([...carrefourCities, ...israeliCitiesData.cities]);
  const allCities = Array.from(allCitiesSet).sort((a, b) => a.localeCompare(b, "he"));

  return (
    <main className="min-h-screen flex flex-col bg-background">
      <section className="flex-1 flex flex-col items-center justify-center px-4 py-12 sm:py-16 max-w-xl mx-auto w-full">

        {/* Title */}
        <div className="w-full text-center mb-10">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Image src="/logo.png" alt="לוגו הסל של ישראל" width={52} height={52} className="rounded-xl shadow-sm" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4 leading-tight text-foreground">
            {homeContent.title}
          </h1>
          <p className="text-base sm:text-lg text-foreground/70 leading-relaxed max-w-md mx-auto">
            {homeContent.subtitle}
          </p>
        </div>

        {/* Intro */}
        <div className="w-full rounded-2xl border border-border bg-white/60 p-5 mb-5 space-y-2.5 text-sm text-foreground/75 leading-relaxed">
          <p>{homeContent.intro.paragraph1}</p>
          <p>{homeContent.intro.paragraph2}</p>
          <p className="pt-2 border-t border-border/60 text-xs text-foreground/65 leading-relaxed">
            {officialProgram.introLine}{" "}
            <a
              href={officialProgram.url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold underline underline-offset-2 hover:opacity-90"
              style={{ color: "#A82323" }}
            >
              {officialProgram.linkText}
            </a>
          </p>
        </div>

        {/* Stats row — full basket count + price together */}
        <div className="w-full grid grid-cols-2 gap-2.5 mb-6">
          <div className="bg-white/70 border border-border rounded-xl p-3 text-center">
            <p className="font-bold text-sm text-foreground leading-snug">
              {products.length} מוצרים · {formatCurrency(fullBasketTotal)}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">{homeContent.stats.fullBasketSub}</p>
          </div>
          <div className="bg-white/70 border border-border rounded-xl p-3 text-center">
            <p className="font-bold text-sm text-foreground">{homeContent.stats.anonymousLabel}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{homeContent.stats.anonymousSub}</p>
          </div>
        </div>

        {/* Privacy note */}
        <div className="w-full flex gap-3 items-start border border-brand-green bg-brand-green-light/30 rounded-xl p-4 mb-8">
          <div className="shrink-0 w-5 h-5 rounded-full bg-brand-green flex items-center justify-center mt-0.5">
            <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
              <path d="M1 4l3 3 5-6" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold mb-0.5" style={{ color: "#3a6b2a" }}>{homeContent.privacy.title}</p>
            <p className="text-sm leading-relaxed" style={{ color: "#4a7a38" }}>
              {homeContent.privacy.text}
            </p>
          </div>
        </div>

        {/* Form */}
        <LandingForm cities={allCities} carrefourCities={carrefourCities} />

        {/* Methodology */}
        <div className="w-full mt-8 text-center space-y-3">
          <p className="text-xs text-muted-foreground leading-relaxed max-w-md mx-auto">
            <span className="font-semibold">{homeContent.methodology.title}:</span>{" "}
            {homeContent.methodology.text}
          </p>
          <p className="text-[11px] text-muted-foreground/90 leading-relaxed max-w-md mx-auto border-t border-border/60 pt-3">
            {disclaimerContent.shortHome}
          </p>
        </div>
      </section>
    </main>
  );
}
