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
import { getT } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return {
    title: "Listening Practice",
    description: t(
      "Audio, transkript, gap filling, matching va comprehension savollari bilan listening mashg'ulotlari.",
      "Listening lessons with audio, transcripts, gap filling, matching and comprehension questions.",
    ),
  };
}

export default async function ListeningPracticePage({
  searchParams,
}: {
  searchParams: Promise<{ level?: string }>;
}) {
  const { level } = await searchParams;
  const [profile, allSets, t] = await Promise.all([
    getProfile(),
    getTestSets({ category: "general_english", section: "listening" }),
    getT(),
  ]);

  // Daraja bo'yicha filtr (A2, B1, B2, C1 ...)
  const levels = Array.from(
    new Set(allSets.map((s) => s.level).filter((l): l is string => Boolean(l))),
  ).sort();
  const activeLevel = level && levels.includes(level) ? level : "all";
  const sets =
    activeLevel === "all" ? allSets : allSets.filter((s) => s.level === activeLevel);
  const levelTabs = [
    { id: "all", label: t("Barcha darajalar", "All levels"), href: "/boost/listening", count: allSets.length },
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
      <PageHero
        eyebrow="Boost Your General English"
        title="Listening Practice"
        highlight="Practice"
        hand="Train your ears every day"
        words={["accent", "gap filling", "matching", "script"]}
      >
        {t(
          "Har bir mashg'ulotda audio hamda gap filling, multiple choice, matching va boshqa savollar bo'ladi. Audio skripti — Premium foydalanuvchilar uchun.",
          "Every lesson has audio plus gap filling, multiple choice, matching and other questions. Audio transcripts are for Premium members.",
        )}{" "}
        <Link href="/boost" className="text-brand-400 hover:text-brand-300">
          ← {t("Bo'lim sahifasi", "Section page")}
        </Link>
      </PageHero>

      <div className="container-page">
        {levels.length > 1 ? (
          <ChipRow className="mb-6">
            {levelTabs.map((tab) => (
              <ChipLink key={tab.id} href={tab.href} active={activeLevel === tab.id}>
                {tab.label} · {tab.count}
              </ChipLink>
            ))}
          </ChipRow>
        ) : null}

        <div className="mb-8">
          <Alert tone="info" title={t("Maslahat", "Tip")}>
            {t(
              "Avval audioni diqqat bilan tinglang va javob bering. Test tugagach natija sahifasida audio skriptini o'qib, qaysi so'zni eshitmaganingizni aniqlang (skript — Premium).",
              "First listen carefully and answer. After the test, read the audio transcript on the results page to find the words you missed (transcripts are Premium).",
            )}
          </Alert>
        </div>

        {sets.length === 0 ? (
          <EmptyState
            icon="🎧"
            title={t("Mashg'ulotlar hali qo'shilmagan", "No lessons yet")}
            description={t("Tez orada yangi mashg'ulotlar qo'shiladi.", "New lessons are coming soon.")}
            action={<ButtonLink href="/boost">{t("Orqaga", "Back")}</ButtonLink>}
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
