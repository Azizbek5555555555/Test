import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProfile, profileHasPremium } from "@/lib/auth";
import { countQuestionsByTestSet, getTestSets } from "@/lib/queries";
import {
  SECTIONS,
  SECTION_ICON,
  SECTION_LABEL,
  slugToYear,
  yearToSlug,
} from "@/lib/constants";
import type { SkillSection } from "@/lib/types";
import { PageHeader, EmptyState } from "@/components/ui/Card";
import { LinkTabs } from "@/components/ui/Tabs";
import { ButtonLink } from "@/components/ui/Button";
import { TestSetCard } from "@/components/test/TestSetCard";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ year: string }>;
}): Promise<Metadata> {
  const { year } = await params;
  const label = slugToYear(year);
  return {
    title: `${label} savollari`,
    description: `${label} o'quv yilida Multilevel imtihonlarida tushgan savollar.`,
  };
}

export default async function YearPage({
  params,
  searchParams,
}: {
  params: Promise<{ year: string }>;
  searchParams: Promise<{ section?: string }>;
}) {
  const { year: yearSlug } = await params;
  const { section: sectionParam } = await searchParams;

  const yearLabel = slugToYear(yearSlug);
  if (!yearLabel) notFound();

  const activeSection = SECTIONS.includes(sectionParam as SkillSection)
    ? (sectionParam as SkillSection)
    : "all";

  const [profile, allSets] = await Promise.all([
    getProfile(),
    getTestSets({ category: "latest_questions", year: yearLabel }),
  ]);

  if (allSets.length === 0) notFound();

  const unlocked = profileHasPremium(profile);
  const counts = await countQuestionsByTestSet(allSets.map((s) => s.id));

  const visible =
    activeSection === "all"
      ? allSets
      : allSets.filter((s) => s.section === activeSection);

  const tabs = [
    {
      id: "all",
      label: "Barchasi",
      href: `/latest-questions/${yearSlug}`,
      count: allSets.length,
    },
    ...SECTIONS.map((section) => ({
      id: section,
      label: SECTION_LABEL[section],
      href: `/latest-questions/${yearSlug}?section=${section}`,
      count: allSets.filter((s) => s.section === section).length,
    })),
  ];

  return (
    <div className="container-page py-10">
      <Link
        href="/latest-questions"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-fg mb-6"
      >
        ← Barcha yillar
      </Link>

      <PageHeader
        eyebrow="Oxirgi tushgan savollar"
        title={`${yearLabel} savollari to'plami`}
        description="Ushbu o'quv yilida real imtihonlarda uchragan savollar. Bo'limni tanlab mashq qiling."
      >
        <LinkTabs items={tabs} activeId={activeSection} />
      </PageHeader>

      {/* Bo'limlar bo'yicha qisqacha */}
      {activeSection === "all" ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
          {SECTIONS.map((section) => {
            const sets = allSets.filter((s) => s.section === section);
            const questionTotal = sets.reduce(
              (sum, s) => sum + (counts[s.id] ?? 0),
              0,
            );
            return (
              <Link
                key={section}
                href={`/latest-questions/${yearSlug}?section=${section}`}
                className="card p-4 hover:shadow-[var(--shadow-lift)] transition-shadow"
              >
                <p className="text-2xl" aria-hidden>
                  {SECTION_ICON[section]}
                </p>
                <p className="font-bold mt-1.5">{SECTION_LABEL[section]}</p>
                <p className="text-xs text-muted mt-1 tabular-nums">
                  {sets.length} ta to&apos;plam · {questionTotal} ta savol
                </p>
              </Link>
            );
          })}
        </div>
      ) : null}

      {visible.length === 0 ? (
        <EmptyState
          icon={SECTION_ICON[activeSection as SkillSection] ?? "📭"}
          title="Bu bo'limda hali to'plam yo'q"
          description="Boshqa bo'limni tanlang yoki keyinroq qayta tekshiring."
          action={
            <ButtonLink
              href={`/latest-questions/${yearToSlug(yearLabel)}`}
              variant="secondary"
            >
              Barcha bo&apos;limlar
            </ButtonLink>
          }
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {visible.map((testSet) => (
            <TestSetCard
              key={testSet.id}
              testSet={testSet}
              questionCount={counts[testSet.id]}
              unlocked={unlocked}
              href={`/tests/${testSet.slug}`}
              sections={testSet.section ? [testSet.section] : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
}
