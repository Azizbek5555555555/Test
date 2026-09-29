import type { Metadata } from "next";
import Link from "next/link";
import { getProfile, profileHasPremium } from "@/lib/auth";
import { getTestSets } from "@/lib/queries";
import { getTestOutlines } from "@/lib/test-outlines";
import { EmptyState, Alert } from "@/components/ui/Card";
import { PageHero } from "@/components/marketing/PageHero";
import { ChipLink, ChipRow } from "@/components/ui/ChipLink";
import { Reveal } from "@/components/motion/Reveal";
import { ButtonLink } from "@/components/ui/Button";
import { TestSetCard } from "@/components/test/TestSetCard";

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
  const outlines = await getTestOutlines(sets.map((s) => s.id));

  return (
    <div>
      <PageHero eyebrow="Boost Your General English" title="Listening Practice">
        Har bir mashg&apos;ulotda audio hamda gap filling, multiple choice, matching va boshqa
        savollar bo&apos;ladi. Audio skripti — Premium foydalanuvchilar uchun.{" "}
        <Link href="/boost" className="text-brand-400 hover:text-brand-300">
          ← Bo&apos;lim sahifasi
        </Link>
      </PageHero>

      <div className="container-page">
        {levels.length > 1 ? (
          <ChipRow className="mb-6">
            {levelTabs.map((t) => (
              <ChipLink key={t.id} href={t.href} active={activeLevel === t.id}>
                {t.label} · {t.count}
              </ChipLink>
            ))}
          </ChipRow>
        ) : null}

        <div className="mb-8">
          <Alert tone="info" title="Maslahat">
            Avval audioni diqqat bilan tinglang va javob bering. Test tugagach natija
            sahifasida audio <strong>skriptini</strong> o&apos;qib, qaysi so&apos;zni
            eshitmaganingizni aniqlang (skript — Premium).
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
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {sets.map((testSet, i) => (
              <Reveal key={testSet.id} delay={(i % 3) * 70}>
                <TestSetCard
                  testSet={testSet}
                  questionCount={outlines[testSet.id]?.questions}
                  unlocked={unlocked}
                  href={`/tests/${testSet.slug}`}
                  sections={["listening"]}
                />
              </Reveal>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
