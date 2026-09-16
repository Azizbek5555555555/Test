import type { Metadata } from "next";
import Link from "next/link";
import { getYearSectionCounts } from "@/lib/queries";
import { EXAM_YEARS, SECTIONS, SECTION_ICON, SECTION_LABEL, yearToSlug } from "@/lib/constants";
import { PageHeader, EmptyState, Alert } from "@/components/ui/Card";
import { ButtonLink } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "Oxirgi tushgan savollar",
  description:
    "Real Multilevel imtihonlarida tushgan va eslab qolingan savollar — yillar bo'yicha tartiblangan.",
};

export default async function LatestQuestionsPage() {
  const counts = await getYearSectionCounts();

  // Bazadagi yillar + hujjatdagi standart yillar
  const years = Array.from(
    new Set([...Object.keys(counts), ...EXAM_YEARS]),
  ).sort((a, b) => b.localeCompare(a));

  const hasAny = Object.keys(counts).length > 0;

  return (
    <div className="container-page py-10">
      <PageHeader
        eyebrow="Practice"
        title="Oxirgi tushgan savollar"
        description="Bu bo'limda oldingi yillarda real imtihonlarda tushgan yoki o'quvchilar tomonidan eslab qolingan savollar yil bo'yicha joylashtirilgan."
      />

      {!hasAny ? (
        <EmptyState
          icon="🗂️"
          title="Savollar hali qo'shilmagan"
          description="Admin panel orqali yil va bo'limni tanlab test qo'shing, yoki supabase/seed.sql ni ishga tushiring."
          action={<ButtonLink href="/full-mock">Full Mock testlarga</ButtonLink>}
        />
      ) : (
        <>
          <div className="mb-8">
            <Alert tone="info">
              Har bir yil ichida <strong>Reading</strong>,{" "}
              <strong>Listening</strong>, <strong>Writing</strong> va{" "}
              <strong>Speaking</strong> bo&apos;limlari bor. Ba&apos;zi
              qismlar bepul, ba&apos;zilari Premium.
            </Alert>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {years.map((year) => {
              const yearCounts = counts[year] ?? {};
              const total = SECTIONS.reduce(
                (sum, section) => sum + (yearCounts[section] ?? 0),
                0,
              );

              return (
                <Link
                  key={year}
                  href={`/latest-questions/${yearToSlug(year)}`}
                  className="group card p-6 transition-all duration-200
                             hover:shadow-[var(--shadow-lift)] hover:-translate-y-0.5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide text-muted">
                        Savollar to&apos;plami
                      </p>
                      <h2 className="text-2xl font-extrabold mt-1">{year}</h2>
                    </div>
                    <span className="text-3xl" aria-hidden>
                      🗂️
                    </span>
                  </div>

                  <ul className="mt-5 space-y-2">
                    {SECTIONS.map((section) => (
                      <li
                        key={section}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="text-muted">
                          <span aria-hidden>{SECTION_ICON[section]}</span>{" "}
                          {SECTION_LABEL[section]}
                        </span>
                        <span className="font-bold tabular-nums">
                          {yearCounts[section] ?? 0} ta
                        </span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-5 pt-4 border-t border-line flex items-center justify-between">
                    <span className="text-xs text-muted">
                      Jami {total} ta to&apos;plam
                    </span>
                    <span
                      className="inline-flex items-center gap-1.5 text-sm font-bold
                                 text-brand-600 dark:text-brand-400 group-hover:gap-2.5 transition-all"
                    >
                      EXPLORE <span aria-hidden>→</span>
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
