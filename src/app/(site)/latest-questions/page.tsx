import type { Metadata } from "next";
import Link from "next/link";
import { getProfile, profileHasPremium } from "@/lib/auth";
import { getTestSets } from "@/lib/queries";
import { getTestOutlines } from "@/lib/test-outlines";
import { EXAM_YEARS, SECTIONS, SECTION_LABEL, yearToSlug } from "@/lib/constants";
import { cn } from "@/lib/format";
import type { SkillSection, TestSet } from "@/lib/types";
import { EmptyState } from "@/components/ui/Card";
import { ButtonLink } from "@/components/ui/Button";
import { SectionIcon } from "@/components/ui/icons";
import { Reveal } from "@/components/motion/Reveal";
import { CtaBand } from "@/components/marketing/CtaBand";
import { PageHero } from "@/components/marketing/PageHero";
import { getT } from "@/i18n/server";
import type { Bi, T } from "@/i18n";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return {
    title: t("Oxirgi tushgan savollar", "Latest exam questions"),
    description: t(
      "Real Multilevel imtihonlarida tushgan va eslab qolingan savollar — yillar bo'yicha tartiblangan.",
      "Questions that appeared in real Multilevel exams — sorted by year.",
    ),
  };
}

/** Savollar soni birligi — bo'limga qarab */
const UNIT: Record<SkillSection, Bi> = {
  reading: { uz: "ta savol", en: "questions" },
  listening: { uz: "ta savol", en: "questions" },
  writing: { uz: "ta topshiriq", en: "tasks" },
  speaking: { uz: "ta mavzu", en: "topics" },
};

function href(year: string, section: SkillSection | "all"): string {
  const params = new URLSearchParams({ year: yearToSlug(year) });
  if (section !== "all") params.set("section", section);
  return `/latest-questions?${params.toString()}`;
}

export default async function LatestQuestionsPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; section?: string }>;
}) {
  const params = await searchParams;
  const [profile, allSets, t] = await Promise.all([
    getProfile(),
    getTestSets({ category: "latest_questions" }),
    getT(),
  ]);
  const unlocked = profileHasPremium(profile);

  // Kontenti bor yillar (yangisi birinchi) + standart yillar
  const byYear = new Map<string, TestSet[]>();
  for (const set of allSets) {
    if (!set.year_label) continue;
    byYear.set(set.year_label, [...(byYear.get(set.year_label) ?? []), set]);
  }
  const years = Array.from(new Set([...byYear.keys(), ...EXAM_YEARS])).sort((a, b) =>
    b.localeCompare(a),
  );
  const firstWithContent = years.find((y) => byYear.has(y)) ?? years[0];
  const year = years.find((y) => yearToSlug(y) === params.year) ?? firstWithContent;
  const section: SkillSection | "all" = SECTIONS.includes(params.section as SkillSection)
    ? (params.section as SkillSection)
    : "all";

  const yearSets = (byYear.get(year) ?? []).slice().sort(
    (a, b) =>
      SECTIONS.indexOf(a.section ?? "reading") - SECTIONS.indexOf(b.section ?? "reading") ||
      a.order_index - b.order_index,
  );
  const shown = section === "all" ? yearSets : yearSets.filter((s) => s.section === section);
  const outlines = await getTestOutlines(yearSets.map((s) => s.id));

  return (
    <div>
      {/* ------------------------------------------------ Hero */}
      <PageHero
        eyebrow={t("Haqiqiy imtihon banki", "Real exam bank")}
        title={t("Oxirgi tushgan savollar", "Latest exam questions")}
        highlight={t("savollar", "questions")}
        hand="Real exam questions"
        words={["2025–2026", "Reading", "Writing", "Speaking"]}
        className="pb-16 sm:pb-20"
      >
        {t(
          "Real imtihonlarda tushgan savollar bilan mashq qiling. Formatga ko'niking, tayyor bo'ling. Savollar so'nggi o'quv yillaridagi imtihonlardan to'plangan.",
          "Practise with questions from real exams. Get used to the format and be ready. The questions are collected from exams of recent academic years.",
        )}
      </PageHero>

      <div className="container-page pb-20">
        {allSets.length === 0 ? (
          <EmptyState
            icon="🗂️"
            title={t("Savollar hali qo'shilmagan", "No questions yet")}
            description={t("Tez orada yangi savollar qo'shiladi.", "New questions are coming soon.")}
            action={<ButtonLink href="/full-mock">{t("Full Mock testlarga", "Go to Full Mock tests")}</ButtonLink>}
          />
        ) : (
          <>
            {/* ------------------------------------------------ Filtrlar */}
            <nav aria-label={t("Filtrlar", "Filters")} className="mb-6 flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap gap-2">
                {years.map((y) => (
                  <Link
                    key={y}
                    href={href(y, section)}
                    scroll={false}
                    aria-current={y === year ? "true" : undefined}
                    className={cn(
                      "rounded-full px-4 py-1.5 text-[13px] font-medium tabular-nums transition-colors",
                      y === year
                        ? "bg-brand-400 text-on-accent"
                        : "border border-line bg-ink-900 text-muted hover:text-fg",
                    )}
                  >
                    {y}
                  </Link>
                ))}
              </div>
              <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
                <div className="flex w-max rounded-full border border-line bg-ink-900 p-1">
                  {(["all", ...SECTIONS] as const).map((s) => (
                    <Link
                      key={s}
                      href={href(year, s)}
                      scroll={false}
                      aria-current={s === section ? "true" : undefined}
                      className={cn(
                        "rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-colors",
                        s === section ? "bg-brand-400 text-on-accent" : "text-muted hover:text-fg",
                      )}
                    >
                      {s === "all" ? t("Barchasi", "All") : SECTION_LABEL[s]}
                    </Link>
                  ))}
                </div>
              </div>
            </nav>

            <div className="grid items-start gap-6 lg:grid-cols-[1fr_400px]">
              {/* ------------------------------------------------ Jadval */}
              <div className="space-y-3">
                {shown.length === 0 ? (
                  <div className="card p-10 text-center text-sm text-muted">
                    {t(`${year} uchun bu bo'limda hali savollar yo'q.`, `No questions in this section for ${year} yet.`)}
                  </div>
                ) : (
                  shown.map((set, i) => {
                    const sec = set.section ?? "reading";
                    const locked = set.is_premium && !unlocked;
                    const count = outlines[set.id]?.questions ?? 0;
                    return (
                      <Reveal key={set.id} delay={Math.min(i, 6) * 50}>
                        <Link
                          href={locked ? "/premium?reason=locked" : `/tests/${set.slug}`}
                          className="group card grid grid-cols-[auto_1fr_auto] items-center gap-x-4 gap-y-2 px-5 py-4 transition-colors hover:border-brand-400/40 sm:grid-cols-[110px_auto_1fr_110px_90px_auto] sm:gap-x-5"
                        >
                          <span className="hidden text-[13px] font-medium text-fg sm:block">
                            {SECTION_LABEL[sec]}
                          </span>
                          <SectionIcon section={sec} className="text-brand-400" />
                          <span className="min-w-0 font-display text-[17px] leading-snug text-fg">
                            {set.title}
                          </span>
                          <span className="hidden text-[13px] text-muted sm:block">
                            {count ? `${count} ${t(UNIT[sec])}` : ""}
                          </span>
                          <span className="hidden sm:block">
                            <AccessPill premium={set.is_premium} t={t} />
                          </span>
                          <span
                            className={cn(
                              "col-start-3 row-start-1 inline-flex justify-center rounded-full px-4 py-1.5 text-[13px] font-semibold transition-colors sm:col-auto sm:row-auto",
                              locked
                                ? "border-[1.5px] border-gold-400/80 text-gold-400 group-hover:bg-gold-400 group-hover:text-on-accent"
                                : "bg-brand-400 text-on-accent group-hover:bg-brand-300",
                            )}
                          >
                            {locked ? t("Ochish", "Unlock") : t("Mashq", "Practise")}
                          </span>
                          {/* Mobil: ikkinchi qator */}
                          <span className="col-span-3 flex items-center gap-3 text-xs text-muted sm:hidden">
                            <AccessPill premium={set.is_premium} t={t} />
                            {count ? `${count} ${t(UNIT[sec])}` : null}
                          </span>
                        </Link>
                      </Reveal>
                    );
                  })
                )}
              </div>

              {/* ------------------------------------------------ Yil xulosasi */}
              <aside className="lg:sticky lg:top-28">
                <div className="rounded-2xl border border-line bg-ink-800 p-6 sm:p-7">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-brand-400">
                    {t(`${year} xulosasi`, `${year} summary`)}
                  </p>
                  <p className="display-title mt-3 text-[28px]">{t("Savollar bazasi", "Question bank")}</p>
                  <ul className="mt-5 divide-y divide-line">
                    {SECTIONS.map((s) => {
                      const sets = yearSets.filter((x) => x.section === s);
                      const total = sets.reduce((sum, x) => sum + (outlines[x.id]?.questions ?? 0), 0);
                      return (
                        <li key={s}>
                          <Link
                            href={href(year, s)}
                            scroll={false}
                            className="flex items-center justify-between gap-3 py-3.5 text-sm transition-colors hover:text-brand-400"
                          >
                            <span className="flex items-center gap-2.5 text-fg">
                              <SectionIcon section={s} size={16} className="text-brand-400" />
                              {SECTION_LABEL[s]}
                            </span>
                            <span className="text-muted tabular-nums">
                              {total ? `${total} ${t(UNIT[s])}` : t(`${sets.length} ta to'plam`, `${sets.length} sets`)}
                            </span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </aside>
            </div>
          </>
        )}
      </div>

      <Reveal className="container-page pb-16 text-center">
        <p className="font-display text-2xl italic text-brand-400 sm:text-[30px]">
          “{t("Haqiqiy savollar. Haqiqiy natija.", "Real questions. Real results.")}”
        </p>
        <span aria-hidden className="mx-auto mt-5 block h-px w-16 bg-line" />
      </Reveal>

      {!unlocked ? (
        <CtaBand
          flushBottom
          title={t("Barcha savollarni oching", "Unlock every question")}
          text={t(
            "Premium bilan har yilning Listening, Writing va Speaking savollari, to'liq mock testlar va o'qituvchi tekshiruvi ochiladi.",
            "Premium unlocks every year's Listening, Writing and Speaking questions, full mock tests and teacher reviews.",
          )}
          action={<ButtonLink href="/premium" size="lg">{t("Premiumga o'tish", "Go Premium")}</ButtonLink>}
        />
      ) : null}
    </div>
  );
}

function AccessPill({ premium, t }: { premium: boolean; t: T }) {
  return premium ? (
    <span className="inline-flex rounded-full bg-gold-400 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-on-accent">
      Premium
    </span>
  ) : (
    <span className="inline-flex rounded-full bg-success px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-on-accent">
      {t("Bepul", "Free")}
    </span>
  );
}
