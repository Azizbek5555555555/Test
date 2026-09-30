import { LangSwitch } from "./LangSwitch";
import { getT } from "@/i18n/server";
import Link from "next/link";
import { getProfile, isStaff, profileHasPremium } from "@/lib/auth";
import { MAIN_NAV, SITE_NAME } from "@/lib/constants";
import { createServerSupabase } from "@/lib/supabase/server";
import { ButtonLink } from "@/components/ui/Button";
import { UserMenu } from "./UserMenu";
import { MobileNav } from "./MobileNav";
import { NavLinks } from "./NavLinks";
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
 * Figma: top-navigation — 84px, ink/base 70% + blur, pastda ink/border chiziq.
 * Chapda logo, o'rtada havolalar (faol — accent), o'ngda foydalanuvchi.
 */
export async function Header() {
  const t = await getT();
  const profile = await getProfile();
  const level = profile ? await getLastLevel(profile.id) : null;

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-ink-950/70 backdrop-blur-[8px]">
      <div className="container-page">
        <div className="flex items-center gap-6 h-[72px] lg:h-[84px]">
          <Link
            href="/"
            className="flex items-center gap-3 shrink-0"
            aria-label={`${SITE_NAME} — ${t("bosh sahifa", "home")}`}
          >
            <BrandMark size={34} />
            <BrandWordmark className="text-[22px] leading-none hidden sm:block" />
          </Link>

          <NavLinks items={MAIN_NAV.map((item) => ({ href: item.href, label: t(item.label) }))} />

          <div className="ml-auto flex items-center gap-4">
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
                <Link
                  href="/login"
                  className="hidden sm:inline text-sm font-semibold text-fg hover:text-brand-300 transition-colors"
                >
                  {t("Kirish", "Log in")}
                </Link>
                <ButtonLink href="/login" size="sm" className="hidden sm:inline-flex">
                  {t("Bepul boshlash", "Start free")}
                </ButtonLink>
              </>
            )}

            <MobileNav signedIn={Boolean(profile)} />
          </div>
        </div>
      </div>
    </header>
  );
}
