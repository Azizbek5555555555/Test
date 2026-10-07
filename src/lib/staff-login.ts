/**
 * Xodimlar (admin / o'qituvchi) uchun login + parol bilan kirish.
 *
 * Supabase'da har bir akkaunt e-mail bilan bog'liq, shuning uchun oddiy
 * "login" ichki manzilga aylantiriladi: `shokir` → `shokir@staff.levelx.academy`.
 * Bu manzilga xat yuborilmaydi — u faqat kirish uchun kalit.
 * E-mail kiritilsa (masalan, Google akkauntiga parol o'rnatilgan bo'lsa) — o'zi ishlatiladi.
 */
export const STAFF_EMAIL_DOMAIN = "staff.levelx.academy";

/** Login: 3–32 ta lotin harfi, raqam, nuqta, chiziqcha yoki pastki chiziq */
export const STAFF_LOGIN_RE = /^[a-z0-9][a-z0-9._-]{2,31}$/;

export const STAFF_PASSWORD_MIN = 8;

/** Login yoki e-mail → Supabase'dagi e-mail. Noto'g'ri bo'lsa — null */
export function loginToEmail(raw: string): string | null {
  const value = raw.trim().toLowerCase();
  if (!value) return null;
  if (value.includes("@")) return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? value : null;
  return STAFF_LOGIN_RE.test(value) ? `${value}@${STAFF_EMAIL_DOMAIN}` : null;
}

/** Ichki manzil bo'lsa — faqat login qismi, aks holda e-mailning o'zi */
export function emailToLogin(email: string | null | undefined): string {
  if (!email) return "";
  const suffix = `@${STAFF_EMAIL_DOMAIN}`;
  return email.endsWith(suffix) ? email.slice(0, -suffix.length) : email;
}

export function isStaffLoginEmail(email: string | null | undefined): boolean {
  return Boolean(email?.endsWith(`@${STAFF_EMAIL_DOMAIN}`));
}
