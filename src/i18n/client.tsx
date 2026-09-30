"use client";

import { createContext, useContext, useMemo } from "react";
import { DEFAULT_LOCALE, makeT, type Locale } from "./index";

const LocaleContext = createContext<Locale>(DEFAULT_LOCALE);

export function I18nProvider({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  return <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>;
}

export function useLocale(): Locale {
  return useContext(LocaleContext);
}

/** Client komponentlar uchun tarjima funksiyasi */
export function useT() {
  const locale = useLocale();
  return useMemo(() => makeT(locale), [locale]);
}
