import type { Metadata } from "next";
import { Signika, PT_Sans, Montserrat } from "next/font/google";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { CookieConsent } from "@/components/CookieConsent";
import { SITE_NAME, SITE_URL } from "@/lib/seo";
import "./globals.css";

/* Polices Vegourmet (thème Yummy Bites) : Signika titres + logo, PT Sans corps, Montserrat secondaire. */
const signika = Signika({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-vg-title",
  display: "swap",
});

const ptSans = PT_Sans({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-vg-body",
  display: "swap",
});

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-vg-alt",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Recettes vegan faciles & gourmandes - Vegourmet",
    template: "%s | Vegourmet",
  },
  description:
    "Vegourmet, un blog culinaire proposant des recettes vegan délicieuses et faciles à suivre pour toutes les occasions, du petit-déjeuner au dîner.",
  openGraph: {
    type: "website",
    locale: "fr_FR",
    siteName: SITE_NAME,
    url: SITE_URL,
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="fr"
      className={`${signika.variable} ${ptSans.variable} ${montserrat.variable}`}
    >
      <body className="flex min-h-screen flex-col">
        <SiteHeader />
        <main id="primary" className="flex-1">
          {children}
        </main>
        <SiteFooter />
        <CookieConsent />
      </body>
    </html>
  );
}
