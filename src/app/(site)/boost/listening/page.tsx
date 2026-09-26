import type { Metadata } from "next";
import Link from "next/link";
import { getProfile, profileHasPremium } from "@/lib/auth";
import { countQuestionsByTestSet, getTestSets } from "@/lib/queries";
import { PageHeader, EmptyState, Alert } from "@/components/ui/Card";
import { ButtonLink } from "@/components/ui/Button";
import { TestSetCard } from "@/components/test/TestSetCard";
import { LinkTabs } from "@/components/ui/Tabs";

export const metadata: Metadata = {
  title: "Listening Practice",
  description:
    "Audio, transkript, gap filling, matching va comprehension savollari bilan listening mashg'ulotlari.",
};

export default async function ListeningPracticePage({
  searchParams,
}: {
  searchParams: Promise<{ level?: string }>;
}) {
  const { level } = await searchParams;
  const [profile, allSets] = await Promise.all([
    getProfile(),
    getTestSets({ category: "general_english", section: "listening" }),
  ]);

  // Daraja bo'yicha filtr (A2, B1, B2, C1 ...)
  const levels = Array.from(
    new Set(allSets.map((s) => s.level).filter((l): l is string => Boolean(l))),
  ).sort();
  const activeLevel = level && levels.includes(level) ? level : "all";
  const sets =
    activeLevel === "all" ? allSets : allSets.filter((s) => s.level === activeLevel);
  const levelTabs = [
    { id: "all", label: "Barcha darajalar", href: "/boost/listening", count: allSets.length },
    ...levels.map((l) => ({
      id: l,
      label: l,
      href: `/boost/listening?level=${encodeURIComponent(l)}`,
      count: allSets.filter((s) => s.level === l).length,
    })),
  ];

  const unlocked = profileHasPremium(profile);
  const counts = await countQuestionsByTestSet(sets.map((s) => s.id));

  return (
    <div className="container-page py-10">
      <Link
        href="/boost"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-fg mb-6"
      >
        ← Boost Your General English
      </Link>

      <PageHeader
        eyebrow="Learn"
        title="Listening Practice"
        description="Har bir mashg'ulotda audio hamda gap filling, multiple choice, matching va boshqa savollar bo'ladi. Audio skripti — Premium foydalanuvchilar uchun."
      >
        {levels.length > 1 ? (
          <LinkTabs items={levelTabs} activeId={activeLevel} />
        ) : null}
      </PageHeader>

      <div className="mb-8">
        <Alert tone="info" title="Maslahat">
          Avval audioni diqqat bilan tinglang va javob bering. Test
          tugagach natija sahifasida audio <strong>skriptini</strong> o&apos;qib,
          qaysi so&apos;zni eshitmaganingizni aniqlang (skript — ⭐ Premium).
        </Alert>
      </div>

      {sets.length === 0 ? (
        <EmptyState
          icon="🎧"
          title="Mashg'ulotlar hali qo'shilmagan"
          description="Admin panel orqali 'General English' turkumida Listening mashg'ulotlarini qo'shing."
          action={<ButtonLink href="/boost">Orqaga</ButtonLink>}
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {sets.map((testSet) => (
            <TestSetCard
              key={testSet.id}
              testSet={testSet}
              questionCount={counts[testSet.id]}
              unlocked={unlocked}
              href={`/tests/${testSet.slug}`}
              sections={["listening"]}
            />
          ))}
        </div>
      )}
    </div>
  );
}
