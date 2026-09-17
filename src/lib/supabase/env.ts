/**
 * Supabase kalitlari. Ular .env.local faylidan o'qiladi.
 * Kalitlar modul yuklanganda emas, funksiya chaqirilganda o'qiladi —
 * shuning uchun `npm run build` kalitlarsiz ham muvaffaqiyatli o'tadi.
 */

const MISSING_MESSAGE =
  "Supabase sozlanmagan. .env.local faylida NEXT_PUBLIC_SUPABASE_URL va " +
  "NEXT_PUBLIC_SUPABASE_ANON_KEY qiymatlarini to'ldiring (SETUP.md ga qarang).";

export function getSupabaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) throw new Error(MISSING_MESSAGE);
  return url;
}

export function getSupabaseAnonKey(): string {
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!key) throw new Error(MISSING_MESSAGE);
  return key;
}

export function getServiceRoleKey(): string {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY topilmadi. Bu kalit faqat serverda ishlatiladi " +
        "va hech qachon brauzerga chiqmasligi kerak (SETUP.md ga qarang).",
    );
  }
  return key;
}

/** Supabase ulanganini tekshirish — sozlanmagan bo'lsa sayt xato bermasligi uchun */
export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY),
  );
}

/**
 * Saytning to'liq manzili.
 * Railway `RAILWAY_PUBLIC_DOMAIN` o'zgaruvchisini avtomatik beradi,
 * shuning uchun domen o'zgarsa ham kod o'zgartirilmaydi.
 */
export function getSiteUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/+$/, "");
  }
  if (process.env.RAILWAY_PUBLIC_DOMAIN) {
    return `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`;
  }
  return "http://localhost:3000";
}
