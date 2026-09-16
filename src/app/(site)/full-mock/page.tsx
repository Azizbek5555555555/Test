import type { Metadata } from "next";
import { getProfile, profileHasPremium } from "@/lib/auth";
import {
  countQuestionsByTestSet,
  getTestParts,
  getTestSets,
} from "@/lib/queries";
import { PageHeader, EmptyState, Alert } from "@/components/ui/Card";
import { ButtonLink } from "@/components/ui/Button";
import { TestSetCard } from "@/components/test/TestSetCard";
import type { SkillSection } from "@/lib/types";

export const metadata: Metadata = {
  title: "Full Mock",
  description:
    "To'liq Multilevel mock testlar: Reading, Listening, Writing va Speaking bo'limlari bilan.",
};

export default async function FullMockPage() {
  const [profile, testSets] = await Promise.all([
    getProfile(),
    getTestSets({ category: "full_mock" }),
  ]);

  const unlocked = profileHasPremium(profile);
  const counts = await countQuestionsByTestSet(testSets.map((t) => t.id));

  // Har bir test ichidagi bo'limlarni aniqlaymiz
  const sectionsBySet: Record<string, SkillSection[]> = {};
  await Promise.all(
    testSets.map(async (testSet) => {
      const parts = await getTestParts(testSet.id);
      sectionsBySet[testSet.id] = Array.from(
        new Set(parts.map((p) => p.section)),
      );
    }),
  );

  const freeCount = testSets.filter((t) => !t.is_premium).length;

  return (
    <div className="container-page py-10">
      <PageHeader
        eyebrow="Practice"
        title="Full Mock Testlar"
        description="Har bir mock test real imtihon tuzilishini takrorlaydi: Reading, Listening, Writing va Speaking. Javoblaringiz avtomatik saqlanadi — testni bo'lib-bo'lib ham ishlashingiz mumkin."
      />

      {!profile ? (
        <div className="mb-8">
          <Alert tone="info" title="Natijalar saqlanishi uchun">
            Testni boshlashdan oldin{" "}
            <a href="/login" className="font-bold underline">
              tizimga kiring
            </a>
            . Aks holda natijangiz profilingizga yozilmaydi.
          </Alert>
        </div>
      ) : null}

      {testSets.length === 0 ? (
        <EmptyState
          icon="📝"
          title="Hozircha mock testlar yo'q"
          description="Admin panel orqali birinchi testni qo'shing yoki supabase/seed.sql faylini ishga tushiring."
          action={<ButtonLink href="/">Bosh sahifaga</ButtonLink>}
        />
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-3 mb-6 text-sm text-muted">
            <span>
              Jami <strong className="text-fg">{testSets.length}</strong> ta test
            </span>
            <span aria-hidden>·</span>
            <span>
              <strong className="text-emerald-600 dark:text-emerald-400">
                {freeCount}
              </strong>{" "}
              tasi bepul
            </span>
            {!unlocked && testSets.length > freeCount ? (
              <>
                <span aria-hidden>·</span>
                <a
                  href="/premium"
                  className="font-bold text-brand-600 dark:text-brand-400 hover:underline"
                >
                  Qolganlarini ochish →
                </a>
              </>
            ) : null}
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {testSets.map((testSet) => (
              <TestSetCard
                key={testSet.id}
                testSet={testSet}
                questionCount={counts[testSet.id]}
                unlocked={unlocked}
                href={`/tests/${testSet.slug}`}
                sections={sectionsBySet[testSet.id]}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
