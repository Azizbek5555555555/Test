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

/**
 * Content Security Policy — brauzerga "faqat shu manbalardan kod va resurs yukla" deydi.
 * Har so'rovda yangi tasodifiy `nonce` yaratiladi: faqat shu kalitga ega skriptlar ishlaydi,
 * shuning uchun saytga qandaydir yo'l bilan tiqilgan begona <script> bajarilmaydi (XSS himoyasi).
 */
function contentSecurityPolicy(nonce: string, request: NextRequest): string {
  let supabase = "https://*.supabase.co";
  try {
    if (process.env.NEXT_PUBLIC_SUPABASE_URL) supabase = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).origin;
  } catch {
    /* noto'g'ri URL — umumiy qiymat qoladi */
  }
  const supabaseWs = supabase.replace(/^http/, "ws");
  const dev = process.env.NODE_ENV === "development";
  const https = (request.headers.get("x-forwarded-proto") ?? request.nextUrl.protocol).startsWith("https");

  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${dev ? " 'unsafe-eval'" : ""}`,
    // React `style={{...}}` atributlari va next/font uslublari uchun
    "style-src 'self' 'unsafe-inline'",
    `img-src 'self' data: blob: https://lh3.googleusercontent.com https://images.unsplash.com ${supabase}`,
    "font-src 'self' data:",
    `connect-src 'self' ${supabase} ${supabaseWs}`,
    `media-src 'self' blob: ${supabase}`,
    "worker-src 'self' blob:",
    "frame-src 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    ...(https ? ["upgrade-insecure-requests"] : []),
  ].join("; ");
}

export async function proxy(request: NextRequest) {
  const redirect = canonicalRedirect(request);
  if (redirect) return redirect;

  const nonce = btoa(crypto.randomUUID());
  const csp = contentSecurityPolicy(nonce, request);
  // Next.js sahifani chizayotganda nonce'ni so'rov sarlavhasidan oladi va o'z skriptlariga qo'yadi
  const next = () => {
    const headers = new Headers(request.headers);
    headers.set("x-nonce", nonce);
    headers.set("content-security-policy", csp);
    const res = NextResponse.next({ request: { headers } });
    res.headers.set("Content-Security-Policy", csp);
    return res;
  };

  let response = next();

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
          response = next();
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
