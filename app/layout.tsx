import type { Metadata } from "next";
import { Heebo } from "next/font/google";
import { Footer } from "@/components/layout/Footer";
import "./globals.css";

const heebo = Heebo({
  variable: "--font-heebo",
  subsets: ["hebrew", "latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "הסל של ישראל",
  description:
    " עד כמה הסל הרשמי באמת משקף את משק הבית שלך — ומה הוא היה עולה ברמי לוי",
  openGraph: {
    title: "הסל של ישראל",
    description:
      "עד כמה הסל הרשמי באמת משקף את משק הבית שלך",
    locale: "he_IL",
    type: "website",
  },
  twitter: {
    card: "summary",
    creator: "@YossiW10",
    title: "הסל של ישראל",
    description: "עד כמה הסל הרשמי באמת משקף את משק הבית שלך",
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
        <Footer />
      </body>
    </html>
  );
}
