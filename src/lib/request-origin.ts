/**
 * Saytning HAQIQIY tashqi manzilini aniqlaydi (masalan
 * https://multilevel-plus-production.up.railway.app).
 *
 * Nega kerak: Railway kabi hostinglarda Next.js server proxy orqasida
 * ishlaydi va `request.url` ichki manzilni (https://0.0.0.0:8080) ko'rsatadi.
 * Undan foydalanib yo'naltirish qilinsa, foydalanuvchi buzuq manzilga
 * tushib qoladi va Google orqali kirish ishlamaydi.
 *
 * Proxy haqiqiy domenni `X-Forwarded-Host` / `X-Forwarded-Proto`
 * sarlavhalarida yuboradi — shu sababli avval ularga qaraymiz.
 * Bu fayl server-only modullarni import qilmaydi (proxy.ts ham ishlatadi).
 */
export function getPublicOrigin(request: Request): string {
  const headers = request.headers;

  const host =
    firstValue(headers.get("x-forwarded-host")) ?? firstValue(headers.get("host"));

  if (host) {
    const proto =
      firstValue(headers.get("x-forwarded-proto")) ??
      new URL(request.url).protocol.replace(":", "");
    return `${proto}://${host}`;
  }

  return new URL(request.url).origin;
}

/** Tashqi manzilga nisbatan to'liq URL yasaydi: ("/login", request) */
export function publicUrl(path: string, request: Request): URL {
  return new URL(path, getPublicOrigin(request));
}

/** "a.com, b.com" ko'rinishidagi sarlavhadan birinchi qiymatni oladi */
function firstValue(value: string | null): string | null {
  const first = value?.split(",")[0]?.trim();
  return first ? first : null;
}
