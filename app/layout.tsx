import type { Metadata } from "next";
import { Heebo } from "next/font/google";
import "./globals.css";

const heebo = Heebo({
  variable: "--font-heebo",
  subsets: ["hebrew", "latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "הסל של המדינה?",
  description:
    "בדיקה אנונימית: עד כמה הסל הזה באמת משקף את הבית שלך",
  openGraph: {
    title: "הסל של המדינה?",
    description:
      "בדיקה אנונימית: עד כמה הסל הזה באמת משקף את הבית שלך",
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
