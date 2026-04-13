/**
 * Import Carrefour branches from Excel into data/branches.json and data/cities.json
 *
 * Run: npx tsx scripts/import-branches.ts
 *
 * Excel structure (sal-snifim.xlsx):
 * - Row 3: headers (col A=format, B=branch name, C=address)
 * - Rows 4+: branch data
 */

import * as xlsx from "xlsx";
import * as fs from "fs";
import * as path from "path";

interface Branch {
  id: number;
  format_type: string;
  branch_name: string;
  city_name: string;
  address: string;
  normalized_city_name: string;
}

const EXCEL_PATH = path.join(process.cwd(), "sal-snifim.xlsx");
const BRANCHES_OUTPUT = path.join(process.cwd(), "data", "branches.json");
const CITIES_OUTPUT = path.join(process.cwd(), "data", "cities.json");
const DATA_DIR = path.join(process.cwd(), "data");

/** Normalize Hebrew city name for matching */
function normalizeCity(city: string): string {
  return city
    .trim()
    .replace(/\s+/g, " ")
    .replace(/["'״]/g, "")
    .trim();
}

/**
 * Map known abbreviations and variants to canonical city names.
 */
const CITY_ALIASES: Record<string, string> = {
  'י-ם': 'ירושלים',
  'ב"ש': 'באר שבע',
  'פ"ת': 'פתח תקווה',
  'ת"א': 'תל אביב',
  "ראשל\"צ": 'ראשון לציון',
};

/**
 * Direct mapping from branch name (as it appears in Excel) to canonical city name.
 * This is the most reliable approach given the inconsistent Excel data.
 */
const BRANCH_NAME_TO_CITY: Record<string, string> = {
  'אור יהודה': 'אור יהודה',
  'אלנבי ירושלים': 'ירושלים',
  'אשדוד ח': 'אשדוד',
  'מגדל העמק': 'מגדל העמק',
  'פתח תקוה': 'פתח תקווה',
  'פתח תקווה': 'פתח תקווה',
  'באר שבע': 'באר שבע',
  'אשקלון': 'אשקלון',
  'חיפה': 'חיפה',
  'דליית אל כרמל': 'דלית אל כרמל',
  'גבעתיים': 'גבעתיים',
  'רמלה': 'רמלה',
  'מעלות תרשיחא': 'מעלות תרשיחא',
  'ראשלצ': 'ראשון לציון',
  'גני אביב לוד': 'לוד',
  'מודיעין': 'מודיעין',
  'יבנה': 'יבנה',
  'יבנה נאות שמיר': 'יבנה',
  'נתניה': 'נתניה',
  'כרכור': 'כרכור',
  'גן יבנה': 'גן יבנה',
  'בית אליעזר חדרה': 'חדרה',
  'רעננה': 'רעננה',
  'אילת': 'אילת',
  'גאילת': 'אילת',
  'ראש העין': 'ראש העין',
  'קריית שמונה': 'קריית שמונה',
  'בית שמש': 'בית שמש',
  'אור עקיבא': 'אור עקיבא',
  'ערד': 'ערד',
  'בית שאן': 'בית שאן',
  'כפר סבא': 'כפר סבא',
  'שדרות': 'שדרות',
  'עפולה': 'עפולה',
  'נתיבות': 'נתיבות',
  'ירושלים': 'ירושלים',
  'אופקים': 'אופקים',
  'מהדרין נאות חן חדרה': 'חדרה',
  'מהדרין אלעד': 'אלעד',
  'מהדרין בית שמש': 'בית שמש',
  'מהדרין הרצל חיפה': 'חיפה',
  'מהדרין ריינס ירושלים': 'ירושלים',
  'מהדרין עמישב פ"ת': 'פתח תקווה',
};

function resolveAlias(name: string): string {
  const trimmed = name.trim();
  return CITY_ALIASES[trimmed] ?? trimmed;
}

/**
 * Extract city name from address string.
 * Strategy: take everything after the last comma,
 * then clean up numbers and street indicators.
 */
function extractCityFromAddress(address: string): string {
  if (!address) return '';

  // Try after last comma
  const lastComma = address.lastIndexOf(',');
  if (lastComma !== -1) {
    const afterComma = address.slice(lastComma + 1).trim();
    if (afterComma && !/^\d/.test(afterComma)) {
      return resolveAlias(afterComma);
    }
  }

  // Try after last dash (like "פינת שאול המלך ב"ש" → "ב"ש")
  const parts = address.trim().split(/\s+/);
  const lastPart = parts[parts.length - 1];
  if (lastPart && CITY_ALIASES[lastPart]) {
    return CITY_ALIASES[lastPart];
  }

  // Last 2-3 Hebrew words (skip if they look like a street number)
  const hebrewWords = parts.filter(p => /[\u05d0-\u05ea]/.test(p));
  if (hebrewWords.length >= 2) {
    const candidate = hebrewWords.slice(-2).join(' ');
    return resolveAlias(candidate);
  }
  if (hebrewWords.length === 1) {
    return resolveAlias(hebrewWords[0]);
  }

  return '';
}

function getCityFromBranch(branchName: string): string {
  const trimmed = branchName.trim();
  if (BRANCH_NAME_TO_CITY[trimmed]) return BRANCH_NAME_TO_CITY[trimmed];
  // Try without trailing single chars like "ח"
  const withoutSuffix = trimmed.replace(/\s+[\u05d0-\u05ea]$/, '').trim();
  if (BRANCH_NAME_TO_CITY[withoutSuffix]) return BRANCH_NAME_TO_CITY[withoutSuffix];
  return '';
}

function main() {
  if (!fs.existsSync(EXCEL_PATH)) {
    console.error(`Excel file not found at: ${EXCEL_PATH}`);
    process.exit(1);
  }

  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  const workbook = xlsx.readFile(EXCEL_PATH);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = xlsx.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    defval: null,
  }) as unknown[][];

  const branches: Branch[] = [];
  const cityMap = new Map<string, string>(); // normalized → display

  // Find data start - look for the "פורמט" header row
  let dataStart = 1;
  for (let i = 0; i < rows.length; i++) {
    const val = String(rows[i][0] ?? '').trim();
    if (val === 'פורמט') { dataStart = i + 1; break; }
    // Or first row with actual format type
    if (val === 'מרקט' || val === 'מהדרין' || val === 'אקספרס') { dataStart = i; break; }
  }

  let branchId = 1;
  for (let i = dataStart; i < rows.length; i++) {
    const row = rows[i];
    const formatVal = String(row[0] ?? '').trim();
    const nameVal = String(row[1] ?? '').trim();
    const addrVal = String(row[2] ?? '').trim();

    if (!nameVal && !addrVal) continue;
    if (!formatVal && !nameVal) continue;

    // Extract city: prefer direct branch name mapping, then address
    let cityName = getCityFromBranch(nameVal);
    if (!cityName) cityName = extractCityFromAddress(addrVal);
    if (!cityName) cityName = nameVal; // fallback to full branch name

    const normalized = normalizeCity(cityName);
    if (cityName && cityName.length > 1) {
      cityMap.set(normalized, cityName);
    }

    branches.push({
      id: branchId++,
      format_type: formatVal,
      branch_name: nameVal,
      city_name: cityName,
      address: addrVal,
      normalized_city_name: normalized,
    });
  }

  const cities = Array.from(cityMap.values()).sort((a, b) => a.localeCompare(b, 'he'));

  fs.writeFileSync(BRANCHES_OUTPUT, JSON.stringify(branches, null, 2), 'utf-8');
  fs.writeFileSync(
    CITIES_OUTPUT,
    JSON.stringify({ carrefour_cities: cities }, null, 2),
    'utf-8'
  );

  console.log(`✓ Imported ${branches.length} branches`);
  console.log(`✓ Unique cities: ${cities.length}`);
  console.log(`✓ Cities: ${cities.join(', ')}`);
  console.log(`✓ Written to ${BRANCHES_OUTPUT}`);
  console.log(`✓ Written to ${CITIES_OUTPUT}`);
}

main();
