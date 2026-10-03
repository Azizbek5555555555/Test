import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { publicUrl } from "@/lib/request-origin";

/** Kirish talab qilinadigan sahifalar */
const PROTECTED_PREFIXES = [
  "/profile",
  "/test",
  "/exam",
  "/vocabulary-battle/play",
  "/premium/checkout",
  "/admin",
];

/** Faqat xodimlar (admin/teacher) uchun */
const STAFF_PREFIXES = ["/admin"];

/**
 * Asosiy domen (Railway → Variables → CANONICAL_HOST=levelx.academy).
 * Sayt boshqa manzil bilan ochilsa (www.levelx.academy yoki *.up.railway.app),
 * foydalanuvchi asosiy domenga yo'naltiriladi. O'zgaruvchi yo'q bo'lsa — hech narsa qilinmaydi.
 * Kirish jarayoni (/auth/*) va API so'rovlari tegilmaydi: ular cookie va POST bilan ishlaydi.
 */
function canonicalRedirect(request: NextRequest): NextResponse | null {
  const canonical = process.env.CANONICAL_HOST?.trim().toLowerCase();
  if (!canonical) return null;
  if (request.method !== "GET" && request.method !== "HEAD") return null;

  const { pathname, search } = request.nextUrl;
  if (pathname.startsWith("/auth/") || pathname.startsWith("/api/")) return null;

  const host = (request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? "")
    .split(",")[0]
    .trim()
    .toLowerCase()
    .replace(/:\d+$/, "");
  if (!host || host === canonical) return null;
  // Lokal ishlab chiqish va ichki manzillar yo'naltirilmaydi
  if (host === "localhost" || host === "0.0.0.0" || /^\d+\.\d+\.\d+\.\d+$/.test(host)) return null;
  if (host !== `www.${canonical}` && !host.endsWith(".up.railway.app")) return null;

  return NextResponse.redirect(`https://${canonical}${pathname}${search}`, 308);
}

export async function proxy(request: NextRequest) {
  const redirect = canonicalRedirect(request);
  if (redirect) return redirect;

  let response = NextResponse.next({ request });

  // Supabase hali sozlanmagan bo'lsa — sayt baribir ochilishi kerak
  if (!isSupabaseConfigured()) {
    return response;
  }

  // Supabase qaytish manzilini "Redirect URLs" ro'yxatida topmasa,
  // foydalanuvchini Site URL'ga (bosh sahifaga) `?code=...` bilan qaytaradi.
  // Bunday holda ham kirishni yakunlaymiz — kodni /auth/callback ga uzatamiz.
  const authCode = request.nextUrl.searchParams.get("code");
  if (request.nextUrl.pathname === "/" && authCode && /^[\w-]{8,}$/.test(authCode)) {
    return NextResponse.redirect(
      publicUrl(`/auth/callback?code=${encodeURIComponent(authCode)}&next=%2F`, request),
    );
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  // MUHIM: getUser() sessiyani yangilaydi. Uni olib tashlamang.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  const needsAuth = PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );

  if (needsAuth && !user) {
    return NextResponse.redirect(
      publicUrl(`/login?next=${encodeURIComponent(pathname)}`, request),
    );
  }

  const needsStaff = STAFF_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );

  if (needsStaff && user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    const role = (profile as { role?: string } | null)?.role;
    if (role !== "admin" && role !== "teacher") {
      return NextResponse.redirect(publicUrl("/", request));
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Statik fayllardan tashqari hamma so'rovlar:
     * _next/* (statik fayllar, rasmlar, dev HMR), favicon, rasm fayllari va to'lov
     * tizimlarining serverdan-serverga so'rovlari (api/payments) — o'tkazib yuboriladi
     */
    "/((?!_next/|favicon.ico|api/payments|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|mp3|wav|m4a)$).*)",
  ],
};
