# הסל של ישראל 🛒

**בדיקה אנונימית: עד כמה הסל הרשמי באמת משקף את הבית שלך?**

אתר ציבורי המאפשר לבדוק בכמה דקות כמה מ-107 מוצרי "הסל של ישראל" הרשמי אתה קונה בפועל — ולהשוות לשאר המשתמשים ולמחירי רמי לוי.

---

## מה האתר עושה

- עוברים על 107 מוצרי הסל הרשמי ומסמנים: **קונה בקביעות / לפעמים / לא קונה**
- בסוף מקבלים: אחוז התאמה משוקלל, עלות הסל הקבוע, השוואה לממוצע משתמשים
- השוואה לייב למחירי **רמי לוי** (104/107 מוצרים) — ה-Spoiler: הסל הרשמי זול ב~38%
- אם בחרת עיר: בדיקה אם יש סניף קרפור בסביבתך
- שיתוף תוצאות כתמונה מעוצבת

**אנונימי לחלוטין** — בלי הרשמה, בלי מייל, בלי מידע מזהה.

---

## Stack

| כלי | גרסה |
|-----|------|
| [Next.js](https://nextjs.org) | 16 (App Router, Turbopack) |
| [React](https://react.dev) | 19 |
| [TypeScript](https://typescriptlang.org) | 5 |
| [Tailwind CSS](https://tailwindcss.com) | v4 |
| [shadcn/ui](https://ui.shadcn.com) | CLI v4 |
| [motion](https://motion.dev) | latest (Framer Motion) |
| [Supabase](https://supabase.com) | Postgres + RLS |

---

## הרצה מקומית

```bash
git clone https://github.com/yossi-weinberger/sal-quiz
cd sal-quiz
npm install

# הגדר משתני סביבה
cp .env.example .env.local
# ערוך את .env.local עם פרטי Supabase שלך

npm run dev
```

פתח [http://localhost:3000](http://localhost:3000)

---

## משתני סביבה

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

לקבל מ: [app.supabase.com](https://app.supabase.com) → Settings → API

---

## הגדרת Supabase

```bash
# 1. הרץ את ה-migration
# העתק את תוכן supabase/migrations/001_initial_schema.sql לתוך ה-SQL editor של Supabase

# 2. זרע נתונים (מוצרים + סניפים)
npm run seed

# 3. עדכן מחירי רמי לוי
npm run fetch:rami-levy
```

---

## סקריפטים שימושיים

```bash
npm run dev              # שרת פיתוח
npm run build            # build לפרודקשן
npm run import:products  # ייבוא מוצרים מ-Excel
npm run import:branches  # ייבוא סניפי קרפור מ-Excel
npm run seed             # זריעת נתונים ל-Supabase
npm run fetch:rami-levy  # עדכון מחירי רמי לוי (מ-rami-levy.co.il)
```

---

## מבנה הפרויקט

```
app/                    # Next.js App Router
  page.tsx              # דף נחיתה
  survey/page.tsx       # הסקר (107 מוצרים)
  result/page.tsx       # דף תוצאות
  api/responses/        # שמירת תגובות אנונימיות
  api/rami-levy/        # מחירי רמי לוי

components/
  layout/               # Header, Footer, LandingForm
  survey/               # ProductCard, SurveyProgress, BasketPanel
  results/              # ScoreBlock, AnswerDonut, RamiLevyComparison, ShareCard
  shared/               # CitySearch

content/he/             # כל טקסטי ה-UI (JSON)
data/                   # products.json, branches.json, cities.json
lib/                    # calculations, city-matching, supabase, types
scripts/                # import & seed scripts
supabase/migrations/    # SQL schema
```

---

## נתון מעניין 📊

מתוך 104 מוצרים שנמצאו ברמי לוי:
- **מחיר סל רשמי:** ₪1,048  
- **מחיר אותם מוצרים ברמי לוי:** ₪1,709  
- **הפרש:** +₪661 (63% יקר יותר ברמי לוי)

---

## נבנה על ידי

[@YossiW10](https://x.com/YossiW10) · נבנה באמצעות AI

שאלות / בעיות? שלח [DM בטוויטר](https://x.com/YossiW10)
