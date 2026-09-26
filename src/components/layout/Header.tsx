import Link from "next/link";
import { getProfile, isStaff, profileHasPremium } from "@/lib/auth";
import { MAIN_NAV, SITE_NAME } from "@/lib/constants";
import { ButtonLink } from "@/components/ui/Button";
import { ThemeToggle } from "./ThemeToggle";
import { UserMenu } from "./UserMenu";
import { MobileNav } from "./MobileNav";
import { BrandMark, BrandWordmark } from "./BrandLogo";

export async function Header() {
  const profile = await getProfile();

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-[var(--bg)]/85 backdrop-blur-md">
      <div className="container-page">
        <div className="flex items-center gap-4 h-16">
          <Link
            href="/"
            className="flex items-center gap-2.5 shrink-0"
            aria-label={`${SITE_NAME} — bosh sahifa`}
          >
            <BrandMark size={38} />
            <BrandWordmark className="text-xl hidden sm:block" />
          </Link>

          <nav className="hidden lg:flex items-center gap-0.5 ml-2">
            {MAIN_NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="px-3 py-2 rounded-lg text-sm font-semibold text-muted
                           hover:text-fg hover:bg-[var(--bg-subtle)] transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />

            {profile ? (
              <UserMenu
                user={{
                  fullName: profile.full_name,
                  email: profile.email,
                  avatarUrl: profile.avatar_url,
                  isPremium: profileHasPremium(profile),
                  isStaff: isStaff(profile),
                  totalXp: profile.total_xp,
                }}
              />
            ) : (
              <ButtonLink href="/login" size="sm" className="hidden sm:inline-flex">
                Kirish
              </ButtonLink>
            )}

            <MobileNav signedIn={Boolean(profile)} />
          </div>
        </div>
      </div>
    </header>
  );
}
