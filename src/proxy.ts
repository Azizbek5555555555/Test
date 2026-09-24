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

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  // Supabase hali sozlanmagan bo'lsa — sayt baribir ochilishi kerak
  if (!isSupabaseConfigured()) {
    return response;
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
     * _next/static, _next/image, favicon, rasm fayllari — o'tkazib yuboriladi
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|mp3|wav|m4a)$).*)",
  ],
};
