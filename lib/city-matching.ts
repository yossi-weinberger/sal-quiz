import type { Branch } from "./types";

/** Normalize Hebrew city name for fuzzy comparison */
export function normalizeCity(city: string): string {
  return city
    .trim()
    .replace(/\s+/g, " ")
    .replace(/["'״]/g, "")
    .replace(/[–—-]/g, " ")
    .trim();
}

/** Check if two city names refer to the same city */
function citiesMatch(a: string, b: string): boolean {
  const na = normalizeCity(a).toLowerCase();
  const nb = normalizeCity(b).toLowerCase();
  if (na === nb) return true;
  // One contains the other (handles "ראשון לציון" vs "ראשל\"צ")
  if (na.includes(nb) || nb.includes(na)) return true;
  return false;
}

/** Find all branches for a given city name */
export function findBranchesForCity(
  cityName: string,
  branches: Branch[]
): Branch[] {
  if (!cityName) return [];
  return branches.filter((b) => citiesMatch(b.city_name, cityName));
}

/** Get list of unique city names from branches */
export function getCarrefourCities(branches: Branch[]): string[] {
  const seen = new Set<string>();
  const cities: string[] = [];
  for (const b of branches) {
    const key = normalizeCity(b.city_name).toLowerCase();
    if (!seen.has(key) && b.city_name) {
      seen.add(key);
      cities.push(b.city_name);
    }
  }
  return cities.sort((a, b) => a.localeCompare(b, "he"));
}

/** Search cities by partial input - Carrefour cities shown first */
export function searchCities(
  query: string,
  allCities: string[],
  carrefourCities: string[] = [],
  limit = 8
): string[] {
  if (!query.trim()) {
    // Show Carrefour cities first, then others
    const rest = allCities.filter(
      (c) => !carrefourCities.some((cc) => citiesMatch(c, cc))
    );
    return [...carrefourCities, ...rest].slice(0, limit);
  }
  const q = normalizeCity(query).toLowerCase();
  const matches = allCities.filter((c) =>
    normalizeCity(c).toLowerCase().includes(q)
  );
  // Sort: Carrefour cities first
  matches.sort((a, b) => {
    const aHas = carrefourCities.some((cc) => citiesMatch(a, cc));
    const bHas = carrefourCities.some((cc) => citiesMatch(b, cc));
    if (aHas && !bHas) return -1;
    if (!aHas && bHas) return 1;
    return a.localeCompare(b, "he");
  });
  return matches.slice(0, limit);
}
