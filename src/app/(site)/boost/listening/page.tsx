import type { Metadata } from "next";
import Link from "next/link";
import { getProfile, profileHasPremium } from "@/lib/auth";
import { countQuestionsByTestSet, getTestSets } from "@/lib/queries";
import { PageHeader, EmptyState, Alert } from "@/components/ui/Card";
import { ButtonLink } from "@/components/ui/Button";
import { TestSetCard } from "@/components/test/TestSetCard";

export const metadata: Metadata = {
  title: "Listening Practice",
  description:
    "Audio, transkript, gap filling, matching va comprehension savollari bilan listening mashg'ulotlari.",
};

export default async function ListeningPracticePage() {
  const [profile, sets] = await Promise.all([
    getProfile(),
    getTestSets({ category: "general_english", section: "listening" }),
  ]);

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
        description="Har bir mashg'ulotda audio, kerak bo'lsa transkript, hamda gap filling, multiple choice, matching va comprehension savollari bo'ladi."
      />

      <div className="mb-8">
        <Alert tone="info" title="Maslahat">
          Avval audioni <strong>transkriptsiz</strong> tinglang. Javob
          berganingizdan keyin transkriptni o&apos;qib, qaysi so&apos;zni
          eshitmaganingizni aniqlang — eng tez o&apos;sish shu yerda.
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
