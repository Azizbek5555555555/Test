import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createServerSupabase } from "@/lib/supabase/server";
import { getPublicOrigin } from "@/lib/request-origin";

/**
 * Emaildagi "Tasdiqlash" havolasi shu manzilga olib keladi
 * (kod o'rniga havola bosilgan holat uchun).
 *
 * Ikki xil havola qo'llab-quvvatlanadi:
 *  - `?token_hash=...&type=...` — o'zgartirilgan email shabloni
 *  - `?code=...` — Supabase'ning standart shabloni ({{ .ConfirmationURL }})
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const origin = getPublicOrigin(request);
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";
  const errorDescription = searchParams.get("error_description");

  if (errorDescription) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(errorDescription)}`,
    );
  }

  if (!code && (!tokenHash || !type)) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent("Tasdiqlash havolasi noto'g'ri yoki eskirgan.")}`,
    );
  }

  try {
    const supabase = await createServerSupabase();
    const { error } = code
      ? await supabase.auth.exchangeCodeForSession(code)
      : await supabase.auth.verifyOtp({
          type: type as EmailOtpType,
          token_hash: tokenHash as string,
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
