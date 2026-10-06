import type { Metadata, Viewport } from "next";
import { Caveat, Cormorant_Garamond, Inter, Poppins } from "next/font/google";
import { SITE_DESCRIPTION, SITE_DESCRIPTION_EN, SITE_NAME, SITE_TAGLINE, SITE_URL } from "@/lib/constants";
import { headers } from "next/headers";
import { getLocale, getT } from "@/i18n/server";
import { getTheme } from "@/lib/theme/server";
import { THEME_COLOR } from "@/lib/theme";
import { I18nProvider } from "@/i18n/client";
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

// Brend yozuvi (levelxenglish) — rasmiy brend shrifti Poppins
const brand = Poppins({
  subsets: ["latin", "latin-ext"],
  weight: ["500", "600", "700"],
  display: "swap",
  variable: "--font-brand",
});

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — ${SITE_TAGLINE}`,
    template: `%s · ${SITE_NAME}`,
  },
  description: t(SITE_DESCRIPTION, SITE_DESCRIPTION_EN),
  applicationName: SITE_NAME,
  keywords: [
    "levelxenglish",
    "LevelX English",
    "levelx.academy",
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
    description: t(SITE_DESCRIPTION, SITE_DESCRIPTION_EN),
    type: "website",
    siteName: SITE_NAME,
    url: SITE_URL,
    locale: t.locale === "en" ? "en_US" : "uz_UZ",
  },
  robots: { index: true, follow: true },
  };
}

export async function generateViewport(): Promise<Viewport> {
  const theme = await getTheme();
  return {
    width: "device-width",
    initialScale: 1,
    themeColor: THEME_COLOR[theme],
    colorScheme: theme,
  };
}

/**
 * Google uchun tuzilgan ma'lumot (JSON-LD): qidiruv natijalarida sayt nomi
 * "levelxenglish" va brend logosi to'g'ri ko'rinishi uchun.
 */
const STRUCTURED_DATA = JSON.stringify({
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "EducationalOrganization",
      "@id": `${SITE_URL}/#organization`,
      name: SITE_NAME,
      url: SITE_URL,
      logo: `${SITE_URL}/brand/lx-mark-512.png`,
      slogan: SITE_TAGLINE,
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      name: SITE_NAME,
      alternateName: ["levelx", "levelx.academy"],
      url: SITE_URL,
      inLanguage: ["uz", "en"],
      publisher: { "@id": `${SITE_URL}/#organization` },
    },
  ],
});

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const [locale, theme] = await Promise.all([getLocale(), getTheme()]);
  // CSP nonce (proxy.ts) — o'zimizning inline skriptlarimizga beriladi
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  return (
    <html
      lang={locale}
      data-theme={theme}
      className={`${theme === "dark" ? "dark " : ""}${inter.variable} ${cormorant.variable} ${hand.variable} ${brand.variable}`}
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <body className="min-h-dvh">
        <script type="application/ld+json" nonce={nonce} dangerouslySetInnerHTML={{ __html: STRUCTURED_DATA }} />
        {/* har bir to'liq yuklanishda (kirish, refresh) yuklanish ekrani */}
        <Splash label={locale === "en" ? "Loading" : "Yuklanmoqda"} nonce={nonce} />
        <I18nProvider locale={locale}>{children}</I18nProvider>
        <CursorFollower />
      </body>
    </html>
  );
}
