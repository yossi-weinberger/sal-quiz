import type { Metadata } from "next";
import { Heebo } from "next/font/google";
import "./globals.css";

const heebo = Heebo({
  variable: "--font-heebo",
  subsets: ["hebrew", "latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "הסל של ישראל",
  description:
    "בדיקה אנונימית: עד כמה הסל הרשמי באמת משקף את הבית שלך — ומה הוא היה עולה ברמי לוי",
  openGraph: {
    title: "הסל של ישראל",
    description:
      "בדיקה אנונימית: עד כמה הסל הרשמי באמת משקף את הבית שלך",
    locale: "he_IL",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl" className={`${heebo.variable} h-full`}>
      <body className="min-h-full flex flex-col bg-background text-foreground antialiased">
        {children}
      </body>
    </html>
  );
}
