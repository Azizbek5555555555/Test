import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getProfile, profileHasPremium } from "@/lib/auth";
import { getMyAttemptsWithTests, getMyRank, getMyStats } from "@/lib/queries";
import { formatDate, formatXp } from "@/lib/format";
import { Stat, PageHeader, EmptyState } from "@/components/ui/Card";
import { Badge, CefrBadge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { AttemptRow } from "@/components/profile/AttemptRow";

export const metadata: Metadata = {
  title: "Mening profilim",
  robots: { index: false, follow: false },
};

export default async function ProfilePage() {
  const profile = await getProfile();
  if (!profile) redirect(`/login?next=${encodeURIComponent("/profile")}`);

  const [stats, attempts, rank] = await Promise.all([
    getMyStats(),
    getMyAttemptsWithTests(6),
    getMyRank("weekly"),
  ]);

  const isPremium = profileHasPremium(profile);
  const finished = attempts.filter((a) => a.status !== "in_progress");
  const inProgress = attempts.filter((a) => a.status === "in_progress");

  return (
    <div className="container-page py-10">
      {/* ------------------------------------------------- Profil kartasi */}
      <div className="card p-6 mb-8">
        <div className="flex flex-wrap items-center gap-5">
          <Avatar
            name={profile.full_name}
            src={profile.avatar_url}
            size="xl"
            ring={isPremium}
          />

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl font-extrabold">
                {profile.full_name ?? "Foydalanuvchi"}
              </h1>
              {isPremium ? (
                <Badge tone="premium">⭐ PREMIUM</Badge>
              ) : (
                <Badge tone="neutral">FREE</Badge>
              )}
              {profile.role !== "student" ? (
                <Badge tone="brand">
                  {profile.role === "admin" ? "Admin" : "O'qituvchi"}
                </Badge>
              ) : null}
            </div>

            <p className="text-sm text-muted mt-1">{profile.email}</p>

            <p className="text-xs text-muted mt-2">
              Ro&apos;yxatdan o&apos;tgan: {formatDate(profile.created_at)}
              {isPremium && profile.premium_until
                ? ` · Premium muddati: ${formatDate(profile.premium_until)}`
                : ""}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <ButtonLink href="/profile/settings" variant="secondary" size="sm">
              ⚙️ Sozlamalar
            </ButtonLink>
            {!isPremium ? (
              <ButtonLink href="/premium" variant="premium" size="sm">
                ⭐ Premium
              </ButtonLink>
            ) : null}
          </div>
        </div>
      </div>

      {/* ------------------------------------------------- Statistika */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Stat
          label="Topshirilgan testlar"
          value={stats?.tests_taken ?? 0}
          icon="📝"
        />
        <Stat
          label="Eng yaxshi natija"
          value={
            stats?.best_overall != null
              ? Math.round(stats.best_overall)
              : "—"
          }
          hint={stats?.last_level ? `Oxirgi daraja: ${stats.last_level}` : undefined}
          icon="📊"
        />
        <Stat
          label="Vocabulary XP"
          value={formatXp(stats?.total_xp ?? profile.total_xp)}
          hint={rank ? `Haftalik o'rin: #${rank.rank}` : undefined}
          icon="🎮"
        />
        <Stat
          label="O'qilgan maqolalar"
          value={stats?.articles_done ?? 0}
          icon="📰"
        />
      </div>

      {/* ------------------------------------------------- Tugallanmagan */}
      {inProgress.length > 0 ? (
        <section className="mb-8">
          <h2 className="font-extrabold text-lg mb-4">
            Tugallanmagan testlar
          </h2>
          <div className="space-y-3">
            {inProgress.map((attempt) => (
              <AttemptRow key={attempt.id} attempt={attempt} />
            ))}
          </div>
        </section>
      ) : null}

      {/* ------------------------------------------------- Oxirgi natijalar */}
      <section>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h2 className="font-extrabold text-lg">Oxirgi natijalar</h2>
          {finished.length > 0 ? (
            <Link
              href="/profile/results"
              className="text-sm font-bold text-brand-600 dark:text-brand-400 hover:underline"
            >
              Barchasi →
            </Link>
          ) : null}
        </div>

        {finished.length === 0 ? (
          <EmptyState
            icon="🚀"
            title="Hali test topshirmagansiz"
            description="Birinchi bepul mock testni ishlab ko'ring — natijangiz shu yerda saqlanadi."
            action={<ButtonLink href="/full-mock">Full Mock testlar</ButtonLink>}
          />
        ) : (
          <div className="space-y-3">
            {finished.map((attempt) => (
              <AttemptRow key={attempt.id} attempt={attempt} />
            ))}
          </div>
        )}
      </section>

      {/* ------------------------------------------------- Keyingi qadam */}
      <section className="mt-10">
        <PageHeader title="Keyingi qadam" />
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            {
              href: "/full-mock",
              icon: "📝",
              title: "Mock test ishlash",
              text: "Imtihon tuzilishiga ko'niking",
            },
            {
              href: "/boost/articles",
              icon: "📰",
              title: "Maqola o'qish",
              text: "So'z boyligini oshiring",
            },
            {
              href: "/vocabulary-battle",
              icon: "🎮",
              title: "Vocabulary Battle",
              text: rank ? `Haftalik o'rningiz: #${rank.rank}` : "Reytingda qatnashing",
            },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="card p-5 hover:shadow-[var(--shadow-lift)] hover:-translate-y-0.5 transition-all"
            >
              <span className="text-2xl" aria-hidden>
                {item.icon}
              </span>
              <p className="font-bold mt-2">{item.title}</p>
              <p className="text-sm text-muted mt-1">{item.text}</p>
            </Link>
          ))}
        </div>
      </section>

      {stats?.last_level ? (
        <div className="card p-6 mt-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-muted">
              Oxirgi CEFR darajangiz
            </p>
            <p className="text-sm text-muted mt-1">
              Keyingi darajaga chiqish uchun zaif bo&apos;limlaringizni mashq
              qiling.
            </p>
          </div>
          <CefrBadge level={stats.last_level} size="lg" />
        </div>
      ) : null}
    </div>
  );
}
