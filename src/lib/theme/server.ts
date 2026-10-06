import "server-only";

import { cookies } from "next/headers";
import { DEFAULT_THEME, isTheme, THEME_COOKIE, type Theme } from "./index";

/** Joriy so'rov mavzusi (cookie'dan) — sahifa birinchi chizilishidanoq to'g'ri rangda keladi */
export async function getTheme(): Promise<Theme> {
  try {
    const value = (await cookies()).get(THEME_COOKIE)?.value;
    return isTheme(value) ? value : DEFAULT_THEME;
  } catch {
    return DEFAULT_THEME;
  }
}
