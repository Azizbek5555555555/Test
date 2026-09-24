import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createServerSupabase } from "@/lib/supabase/server";
import { getPublicOrigin } from "@/lib/request-origin";

/**
 * Emaildagi "Tasdiqlash" havolasi shu manzilga olib keladi
 * (kod o'rniga havola bosilgan holat uchun).
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const origin = getPublicOrigin(request);
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/";

  if (!tokenHash || !type) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent("Tasdiqlash havolasi noto'g'ri yoki eskirgan.")}`,
    );
  }

  try {
    const supabase = await createServerSupabase();
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    });

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

  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/";
  // Ismi yo'q foydalanuvchidan ism so'raladi; ismi borlar /onboarding dan
  // avtomatik ravishda `next` manziliga o'tib ketadi.
  return NextResponse.redirect(
    `${origin}/onboarding?next=${encodeURIComponent(safeNext)}`,
  );
}
