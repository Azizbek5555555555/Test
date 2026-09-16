import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getProfile, profileHasPremium } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import { PageHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { ProfileSettingsForm } from "@/components/profile/ProfileSettingsForm";

export const metadata: Metadata = {
  title: "Sozlamalar",
  robots: { index: false, follow: false },
};

export default async function SettingsPage() {
  const profile = await getProfile();
  if (!profile)
    redirect(`/login?next=${encodeURIComponent("/profile/settings")}`);

  const isPremium = profileHasPremium(profile);

  return (
    <div className="container-page py-10">
      <Link
        href="/profile"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-fg mb-6"
      >
        ← Profil
      </Link>

      <PageHeader
        title="Sozlamalar"
        description="Ismingiz reytingda va natijalar hujjatida ko'rinadi."
      />

      <div className="grid lg:grid-cols-[1fr_320px] gap-8 items-start max-w-4xl">
        <div className="card p-6">
          <h2 className="font-extrabold text-lg mb-5">Shaxsiy ma&apos;lumotlar</h2>
          <ProfileSettingsForm
            defaultName={profile.full_name ?? ""}
            defaultPhone={profile.phone ?? ""}
          />
        </div>

        <aside className="space-y-4">
          <div className="card p-5">
            <h3 className="font-bold text-sm mb-3">Hisob</h3>
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
                  <dt className="text-muted text-xs">Premium muddati</dt>
                  <dd className="font-semibold">
                    {formatDate(profile.premium_until)}
                  </dd>
                </div>
              ) : null}
              <div>
                <dt className="text-muted text-xs">Ro&apos;yxatdan o&apos;tgan</dt>
                <dd className="font-semibold">
                  {formatDate(profile.created_at)}
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
                ⭐ Premiumga o&apos;tish
              </ButtonLink>
            ) : null}
          </div>

          <div className="card p-5">
            <h3 className="font-bold text-sm mb-2">Hisobdan chiqish</h3>
            <p className="text-xs text-muted leading-relaxed mb-3">
              Qurilmangizdan chiqasiz. Natijalaringiz saqlanib qoladi.
            </p>
            <form action="/auth/signout" method="post">
              <button
                type="submit"
                className="w-full rounded-xl border border-rose-200 dark:border-rose-800
                           bg-rose-50 dark:bg-rose-950/40 px-4 py-2.5 text-sm font-bold
                           text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-950/60
                           transition-colors"
              >
                🚪 Chiqish
              </button>
            </form>
          </div>
        </aside>
      </div>
    </div>
  );
}
