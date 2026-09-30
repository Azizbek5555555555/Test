/**
 * Ikki tilli interfeys (UZ / EN). Asosiy til — o'zbekcha.
 * Tanlangan til cookie'da saqlanadi (URL o'zgarmaydi).
 *
 * Matnlar joyida ikki variant bilan yoziladi:  t("Bepul boshlash", "Start free")
 * yoki tayyor juftlik bilan:                    t({ uz: "...", en: "..." })
 */
export type Locale = "uz" | "en";
export const LOCALES: Locale[] = ["uz", "en"];
export const DEFAULT_LOCALE: Locale = "uz";
export const LOCALE_COOKIE = "lx-lang";

/** Ikki tilli matn */
export interface Bi {
  uz: string;
  en: string;
}

export function isLocale(value: unknown): value is Locale {
  return value === "uz" || value === "en";
}

export type T = {
  (uz: string, en: string): string;
  (pair: Bi): string;
  locale: Locale;
};

export function makeT(locale: Locale): T {
  const fn = ((a: string | Bi, b?: string) => {
    if (typeof a === "object") return locale === "en" ? a.en : a.uz;
    return locale === "en" ? (b ?? a) : a;
  }) as T;
  fn.locale = locale;
  return fn;
}

/** Sana/son formatlash uchun Intl locale */
export const intlLocale = (locale: Locale) => (locale === "en" ? "en-GB" : "uz-UZ");
