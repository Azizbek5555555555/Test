import "server-only";

import { cookies } from "next/headers";
import { DEFAULT_LOCALE, isLocale, LOCALE_COOKIE, makeT, type Locale } from "./index";

/** Joriy so'rov tili (cookie'dan) */
export async function getLocale(): Promise<Locale> {
  try {
    const value = (await cookies()).get(LOCALE_COOKIE)?.value;
    return isLocale(value) ? value : DEFAULT_LOCALE;
  } catch {
    return DEFAULT_LOCALE;
  }
}

/** Server komponentlar uchun tarjima funksiyasi */
export async function getT() {
  return makeT(await getLocale());
}
