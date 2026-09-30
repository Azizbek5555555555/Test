import type { Metadata, Viewport } from "next";
import { Caveat, Cormorant_Garamond, Inter } from "next/font/google";
import { SITE_DESCRIPTION, SITE_NAME, SITE_TAGLINE } from "@/lib/constants";
import { CursorFollower } from "@/components/motion/CursorFollower";
import { Splash } from "@/components/motion/Loader";
import "./globals.css";

const inter = Inter({
  subsets: ["latin", "latin-ext"],
  display: "swap",
  variable: "--font-inter",
});

// Sarlavhalar uchun — Figma dizayni (Cinematic Editorial)
const cormorant = Cormorant_Garamond({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-cormorant",
});

// Qo'lyozma shrifti — shiorlar, suzuvchi so'zlar va natija varaqalaridagi yozuvlar (butun saytda)
const hand = Caveat({
  subsets: ["latin"],
  weight: ["600"],
  display: "swap",
  variable: "--font-hand",
});

export const metadata: Metadata = {
  title: {
    default: `${SITE_NAME} — ${SITE_TAGLINE}`,
    template: `%s · ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: [
    "LevelX English",
    "LevelX",
    "Multilevel",
    "Multilevel imtihon",
    "ingliz tili",
    "mock test",
    "CEFR",
    "B1 B2 C1",
    "Reading Listening Writing Speaking",
  ],
  openGraph: {
    title: `${SITE_NAME} — ${SITE_TAGLINE}`,
    description: SITE_DESCRIPTION,
    type: "website",
    locale: "uz_UZ",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0b1220",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="uz"
      className={`dark ${inter.variable} ${cormorant.variable} ${hand.variable}`}
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <body className="min-h-dvh">
        {/* har bir to'liq yuklanishda (kirish, refresh) yuklanish ekrani */}
        <Splash />
        {children}
        <CursorFollower />
      </body>
    </html>
  );
}
