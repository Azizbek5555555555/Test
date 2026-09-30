import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getProfile } from "@/lib/auth";
import { getMyAttemptsWithTests } from "@/lib/queries";
import { PageHeader, EmptyState } from "@/components/ui/Card";
import { ButtonLink } from "@/components/ui/Button";
import { AttemptRow } from "@/components/profile/AttemptRow";
import { getT } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("Natijalarim", "My results"), robots: { index: false, follow: false } };
}

export default async function MyResultsPage() {
  const profile = await getProfile();
  if (!profile)
    redirect(`/login?next=${encodeURIComponent("/profile/results")}`);

  const [attempts, t] = await Promise.all([getMyAttemptsWithTests(100), getT()]);

  const groups = [
    {
      title: t("Davom etayotgan", "In progress"),
      items: attempts.filter((a) => a.status === "in_progress"),
      empty: null,
    },
    {
      title: t("Tekshiruvda", "In review"),
      items: attempts.filter((a) => a.status === "submitted"),
      empty: null,
    },
    {
      title: t("Baholangan", "Graded"),
      items: attempts.filter((a) => a.status === "graded"),
      empty: null,
    },
  ].filter((g) => g.items.length > 0);

  return (
    <div className="container-page py-10">
      <Link
        href="/profile"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-fg mb-6"
      >
        ← {t("Profil", "Profile")}
      </Link>

      <PageHeader
        eyebrow="Progress"
        title={t("Barcha natijalarim", "All my results")}
        description={t(
          "Har bir test natijasi shu yerda saqlanadi. Natija ustiga bosib, javoblar tahlilini ko'rishingiz mumkin.",
          "Every test result is saved here. Click a result to see the answer breakdown.",
        )}
      />

      {attempts.length === 0 ? (
        <EmptyState
          icon="📊"
          title={t("Natijalar hali yo'q", "No results yet")}
          description={t("Birinchi testni ishlab ko'ring — natijangiz avtomatik saqlanadi.", "Take your first test — your result is saved automatically.")}
          action={<ButtonLink href="/full-mock">{t("Full Mock testlar", "Full Mock tests")}</ButtonLink>}
        />
      ) : (
        <div className="space-y-8">
          {groups.map((group) => (
            <section key={group.title}>
              <h2 className="font-extrabold text-lg mb-4">
                {group.title}{" "}
                <span className="text-muted font-bold text-sm tabular-nums">
                  ({group.items.length})
                </span>
              </h2>
              <div className="space-y-3">
                {group.items.map((attempt) => (
                  <AttemptRow key={attempt.id} attempt={attempt} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
