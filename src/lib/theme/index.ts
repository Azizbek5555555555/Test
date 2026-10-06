/** Sayt mavzusi: qorong'i (standart) yoki yorug'. Tanlov cookie'da 1 yil saqlanadi. */
export type Theme = "dark" | "light";

export const THEME_COOKIE = "lx-theme";
export const DEFAULT_THEME: Theme = "dark";

/** Brauzer paneli rangi (mobil) — sahifa foni bilan bir xil */
export const THEME_COLOR: Record<Theme, string> = {
  dark: "#071427",
  light: "#efeee9",
};

export function isTheme(value: unknown): value is Theme {
  return value === "dark" || value === "light";
}
