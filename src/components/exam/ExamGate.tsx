import { Lock } from "react-feather";
import type { SkillSection } from "@/lib/types";
import { EXAM_SECTION_ORDER, SECTION_LABEL } from "@/lib/constants";
import { formatDuration } from "@/lib/format";
import { getT } from "@/i18n/server";
import type { Bi } from "@/i18n";

/** Figma 09 "state-1-intro-gate" sarlavhasi: Premium belgisi, nom, umumiy vaqt */
export async function ExamGateHeader({
  title,
  description,
  totalMinutes,
}: {
  title: string;
  description: string;
  totalMinutes?: number | null;
}) {
  const t = await getT();
  return (
    <div className="flex flex-wrap items-start justify-between gap-6">
      <div className="max-w-xl">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-gold-400 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-on-accent">
          <Lock size={11} strokeWidth={2.5} aria-hidden /> {t("Premium imkoniyat", "Premium feature")}
        </span>
        <h2 className="display-title mt-3 text-[36px] sm:text-[40px]">{title}</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">{description}</p>
      </div>
      {totalMinutes ? (
        <div className="rounded-xl border border-line bg-ink-800 px-5 py-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted">
            {t("Umumiy davomiylik", "Total duration")}
          </p>
          <p className="mt-1 font-display text-3xl text-gold-400 lining-nums">
            {formatDuration(totalMinutes, t.locale)}
          </p>
        </div>
      ) : null}
    </div>
  );
}

/** Figma: "Exam flow sequence" — 4 bosqich doiralari va vaqtlari */
export async function ExamSequence({
  minutes,
  sections = EXAM_SECTION_ORDER,
}: {
  minutes?: Partial<Record<SkillSection, number>>;
  sections?: SkillSection[];
}) {
  const t = await getT();
  return (
    <div className="card rounded-2xl p-6 sm:p-7">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-fg">{t("Imtihon ketma-ketligi", "Exam sequence")}</p>
      <ol className="mt-7 flex items-start justify-between gap-2">
        {sections.map((section, i) => (
          <li key={section} className="flex flex-1 items-start">
            <div className="flex flex-1 flex-col items-center text-center">
              <span
                className={
                  "grid size-9 place-items-center rounded-full text-sm font-semibold text-on-accent " +
                  (i % 2 === 0 ? "bg-brand-400" : "bg-gold-400")
                }
              >
                {i + 1}
              </span>
              <span className="mt-2 text-[13px] font-medium text-fg">{SECTION_LABEL[section]}</span>
              {minutes?.[section] ? (
                <span className="mt-1 text-[11px] text-muted">{minutes[section]} {t("daqiqa", "min")}</span>
              ) : null}
            </div>
            {i < sections.length - 1 ? (
              <span aria-hidden className="mt-[18px] hidden h-px w-5 shrink-0 bg-line sm:block" />
            ) : null}
          </li>
        ))}
      </ol>
    </div>
  );
}

const RULES: Bi[] = [
  {
    uz: "Boshlashdan oldin mikrofon va naushnik ishlayotganini tekshiring.",
    en: "Before you start, check that your microphone and headphones work.",
  },
  {
    uz: "Bo'limlar ketma-ket ochiladi — oldingi bo'limga qaytib bo'lmaydi.",
    en: "Sections open one after another — you cannot go back to a previous section.",
  },
  {
    uz: "Listening audiosi faqat bir marta ijro etiladi; har bo'limning o'z taymeri bor.",
    en: "Listening audio plays only once; every section has its own timer.",
  },
  {
    uz: "Sahifani yopsangiz ham javoblaringiz saqlanadi; vaqt tugasa bo'lim yakunlanadi.",
    en: "Your answers are saved even if you close the page; a section ends when time runs out.",
  },
];

/** Figma: "Exam instructions & guidelines" */
export async function ExamRules() {
  const t = await getT();
  return (
    <div className="card rounded-2xl p-6 sm:p-7">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-fg">{t("Imtihon qoidalari", "Exam rules")}</p>
      <ol className="mt-5 space-y-2.5 text-[13px] leading-relaxed text-muted">
        {RULES.map((rule, i) => (
          <li key={rule.uz}>
            {i + 1}. {t(rule)}
          </li>
        ))}
      </ol>
    </div>
  );
}
