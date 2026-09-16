import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getProfile } from "@/lib/auth";
import { getMyAttemptsWithTests } from "@/lib/queries";
import { PageHeader, EmptyState } from "@/components/ui/Card";
import { ButtonLink } from "@/components/ui/Button";
import { AttemptRow } from "@/components/profile/AttemptRow";

export const metadata: Metadata = {
  title: "Natijalarim",
  robots: { index: false, follow: false },
};

export default async function MyResultsPage() {
  const profile = await getProfile();
  if (!profile)
    redirect(`/login?next=${encodeURIComponent("/profile/results")}`);

  const attempts = await getMyAttemptsWithTests(100);

  const groups = [
    {
      title: "Davom etayotgan",
      items: attempts.filter((a) => a.status === "in_progress"),
      empty: null,
    },
    {
      title: "Tekshiruvda",
      items: attempts.filter((a) => a.status === "submitted"),
      empty: null,
    },
    {
      title: "Baholangan",
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
        ← Profil
      </Link>

      <PageHeader
        eyebrow="Progress"
        title="Barcha natijalarim"
        description="Har bir test natijasi shu yerda saqlanadi. Natija ustiga bosib, javoblar tahlilini ko'rishingiz mumkin."
      />

      {attempts.length === 0 ? (
        <EmptyState
          icon="📊"
          title="Natijalar hali yo'q"
          description="Birinchi testni ishlab ko'ring — natijangiz avtomatik saqlanadi."
          action={<ButtonLink href="/full-mock">Full Mock testlar</ButtonLink>}
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
