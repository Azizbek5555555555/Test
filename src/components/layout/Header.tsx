import { LangSwitch } from "./LangSwitch";
import { ThemeToggle } from "./ThemeToggle";
import { getT } from "@/i18n/server";
import Link from "next/link";
import { getProfile, isStaff, profileHasPremium } from "@/lib/auth";
import { MAIN_NAV, SITE_NAME } from "@/lib/constants";
import { createServerSupabase } from "@/lib/supabase/server";
import { UserMenu } from "./UserMenu";
import { MobileNav } from "./MobileNav";
import { NavLinks } from "./NavLinks";
import { HeaderShell } from "./HeaderShell";
import { BrandMark, BrandWordmark } from "./BrandLogo";

/** Foydalanuvchining oxirgi aniqlangan CEFR darajasi (header'dagi "B1" belgisi) */
async function getLastLevel(userId: string): Promise<string | null> {
  try {
    const supabase = await createServerSupabase();
    const { data } = await supabase
      .from("attempts")
      .select("cefr_level")
      .eq("user_id", userId)
      .not("cefr_level", "is", null)
      .order("submitted_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    return (data as { cefr_level: string | null } | null)?.cefr_level ?? null;
  } catch {
    return null;
  }
}

/**
 * Suzuvchi shisha kapsula: chapda logo, o'rtada havolalar (faol havola ostida
 * sirpanuvchi firuza indikator), o'ngda til, foydalanuvchi va mobil menyu.
 * Skroll qilinganda kapsula ixchamlashadi va to'qroq bo'ladi (HeaderShell).
 */
export async function Header() {
  const t = await getT();
  const profile = await getProfile();
  const level = profile ? await getLastLevel(profile.id) : null;

  return (
    <HeaderShell>
      <div className="container-page">
        <div className="site-bar">
          <Link href="/" className="site-brand" aria-label={`${SITE_NAME} — ${t("bosh sahifa", "home")}`}>
            <BrandMark size={32} className="site-brand-mark" />
            <BrandWordmark className="text-[19px] sm:text-[21px] leading-none" />
          </Link>

          <NavLinks items={MAIN_NAV.map((item) => ({ href: item.href, label: t(item.label) }))} />

          <div className="ml-auto flex items-center gap-2.5 sm:gap-3">
            <ThemeToggle />
            <LangSwitch className="hidden sm:inline-grid" />
            {profile ? (
              <UserMenu
                user={{
                  fullName: profile.full_name,
                  email: profile.email,
                  avatarUrl: profile.avatar_url,
                  isPremium: profileHasPremium(profile),
                  isStaff: isStaff(profile),
                  totalXp: profile.total_xp,
                  level,
                }}
              />
            ) : (
              <>
                <Link href="/login" className="site-login hidden sm:inline-flex">
                  {t("Kirish", "Log in")}
                </Link>
                <Link href="/login" className="site-cta hidden sm:inline-flex">
                  {t("Bepul boshlash", "Start free")}
                  <span aria-hidden>→</span>
                </Link>
              </>
            )}

            <MobileNav signedIn={Boolean(profile)} />
          </div>
        </div>
      </div>
    </HeaderShell>
  );
}
