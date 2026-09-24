/**
 * Supabase so'rovlari uchun fetch "o'rami".
 *
 * Baza so'rovi muvaffaqiyatsiz bo'lsa (noto'g'ri kalit, noto'g'ri URL,
 * jadval yo'q, ruxsat yo'q...), sahifa bo'sh ko'rinadi va sababini bilib
 * bo'lmaydi. Shu o'ram xatoni server terminaliga (lokal: `npm run dev`
 * oynasi, Railway: Deploy Logs) aniq yozadi. Kalitlar logga YOZILMAYDI.
 */
export const loggingFetch: typeof fetch = async (input, init) => {
  const url =
    typeof input === "string"
      ? input
      : input instanceof URL
        ? input.href
        : input.url;

  // Faqat ma'lumot so'rovlari (auth tokenni yangilash kabi shovqinni emas)
  const isDataRequest = /\/(rest|storage)\/v1\//.test(url);

  try {
    const response = await fetch(input, init);

    if (isDataRequest && !response.ok && response.status !== 406) {
      let body = "";
      try {
        body = (await response.clone().text()).slice(0, 400);
      } catch {
        /* javob matnini o'qib bo'lmadi */
      }
      console.error(
        `[supabase] ${response.status} ${init?.method ?? "GET"} ${safePath(url)} → ${body}`,
      );
    }

    return response;
  } catch (error) {
    console.error(
      `[supabase] so'rov yuborilmadi (${safePath(url)}): ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
    throw error;
  }
};

function safePath(url: string): string {
  try {
    const parsed = new URL(url);
    return `${parsed.host}${parsed.pathname}`;
  } catch {
    return "noto'g'ri URL";
  }
}
