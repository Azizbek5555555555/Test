import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getProfile, profileHasPremium } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import { PageHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { ProfileSettingsForm } from "@/components/profile/ProfileSettingsForm";
import { getT } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("Sozlamalar", "Settings"), robots: { index: false, follow: false } };
}

export default async function SettingsPage() {
  const profile = await getProfile();
  if (!profile)
    redirect(`/login?next=${encodeURIComponent("/profile/settings")}`);

  const isPremium = profileHasPremium(profile);
  const t = await getT();

  return (
    <div className="container-page py-10">
      <Link
        href="/profile"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-fg mb-6"
      >
        ← {t("Profil", "Profile")}
      </Link>

      <PageHeader
        title={t("Sozlamalar", "Settings")}
        description={t("Ismingiz reytingda va natijalar hujjatida ko'rinadi.", "Your name appears on the leaderboard and on your result sheets.")}
      />

      <div className="grid lg:grid-cols-[1fr_320px] gap-8 items-start max-w-4xl">
        <div className="card p-6">
          <h2 className="font-extrabold text-lg mb-5">{t("Shaxsiy ma'lumotlar", "Personal details")}</h2>
          <ProfileSettingsForm
            defaultName={profile.full_name ?? ""}
            defaultPhone={profile.phone ?? ""}
          />
        </div>

        <aside className="space-y-4">
          <div className="card p-5">
            <h3 className="font-bold text-sm mb-3">{t("Hisob", "Account")}</h3>
            <dl className="space-y-2.5 text-sm">
              <div>
                <dt className="text-muted text-xs">Email</dt>
                <dd className="font-semibold break-all">{profile.email}</dd>
              </div>
              <div>
                <dt className="text-muted text-xs">Status</dt>
                <dd className="mt-1">
                  {isPremium ? (
                    <Badge tone="premium">⭐ PREMIUM</Badge>
                  ) : (
                    <Badge tone="neutral">FREE</Badge>
                  )}
                </dd>
              </div>
              {isPremium && profile.premium_until ? (
                <div>
                  <dt className="text-muted text-xs">{t("Premium muddati", "Premium until")}</dt>
                  <dd className="font-semibold">
                    {formatDate(profile.premium_until, t.locale)}
                  </dd>
                </div>
              ) : null}
              <div>
                <dt className="text-muted text-xs">{t("Ro'yxatdan o'tgan", "Joined")}</dt>
                <dd className="font-semibold">
                  {formatDate(profile.created_at, t.locale)}
                </dd>
              </div>
            </dl>

            {!isPremium ? (
              <ButtonLink
                href="/premium"
                variant="premium"
                size="sm"
                fullWidth
                className="mt-4"
              >
                ⭐ {t("Premiumga o'tish", "Go Premium")}
              </ButtonLink>
            ) : null}
          </div>

          <div className="card p-5">
            <h3 className="font-bold text-sm mb-2">{t("Hisobdan chiqish", "Log out")}</h3>
            <p className="text-xs text-muted leading-relaxed mb-3">
              {t("Qurilmangizdan chiqasiz. Natijalaringiz saqlanib qoladi.", "You will be logged out on this device. Your results stay saved.")}
            </p>
            <form action="/auth/signout" method="post">
              <button
                type="submit"
                className="w-full rounded-xl border border-danger/40
                            bg-danger/10 px-4 py-2.5 text-sm font-bold
                            text-danger hover:bg-danger/10
                           transition-colors"
              >
                🚪 {t("Chiqish", "Log out")}
              </button>
            </form>
          </div>
        </aside>
      </div>
    </div>
  );
}
