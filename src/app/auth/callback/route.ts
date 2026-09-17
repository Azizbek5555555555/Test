import { NextResponse, type NextRequest } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

/**
 * Google (OAuth) orqali kirgandan keyin foydalanuvchi shu manzilga qaytadi.
 * Bu yerda vaqtinchalik `code` haqiqiy sessiyaga almashtiriladi.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";
  const errorDescription = searchParams.get("error_description");

  // Foydalanuvchi ruxsat bermagan yoki xatolik yuz bergan
  if (errorDescription) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(errorDescription)}`,
    );
  }

  if (!code) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent("Kirish kodi topilmadi. Qaytadan urinib ko'ring.")}`,
    );
  }

  try {
    const supabase = await createServerSupabase();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      return NextResponse.redirect(
        `${origin}/login?error=${encodeURIComponent(error.message)}`,
      );
    }
  } catch {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent("Supabase sozlanmagan. SETUP.md ga qarang.")}`,
    );
  }

  // Ochiq yo'naltirish (open redirect) dan himoya: faqat ichki manzillar
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/";
  return NextResponse.redirect(`${origin}${safeNext}`);
}
