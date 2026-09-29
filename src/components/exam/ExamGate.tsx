import { Lock } from "react-feather";
import type { SkillSection } from "@/lib/types";
import { EXAM_SECTION_ORDER, SECTION_LABEL } from "@/lib/constants";
import { formatDuration } from "@/lib/format";

/** Figma 09 "state-1-intro-gate" sarlavhasi: Premium belgisi, nom, umumiy vaqt */
export function ExamGateHeader({
  title,
  description,
  totalMinutes,
}: {
  title: string;
  description: string;
  totalMinutes?: number | null;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-6">
      <div className="max-w-xl">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-gold-400 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-ink-950">
          <Lock size={11} strokeWidth={2.5} aria-hidden /> Premium imkoniyat
        </span>
        <h2 className="display-title mt-3 text-[36px] sm:text-[40px]">{title}</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">{description}</p>
      </div>
      {totalMinutes ? (
        <div className="rounded-xl border border-line bg-ink-800 px-5 py-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted">
            Umumiy davomiylik
          </p>
          <p className="mt-1 font-display text-3xl text-gold-400 lining-nums">
            {formatDuration(totalMinutes)}
          </p>
        </div>
      ) : null}
    </div>
  );
}

/** Figma: "Exam flow sequence" — 4 bosqich doiralari va vaqtlari */
export function ExamSequence({
  minutes,
  sections = EXAM_SECTION_ORDER,
}: {
  minutes?: Partial<Record<SkillSection, number>>;
  sections?: SkillSection[];
}) {
  return (
    <div className="card rounded-2xl p-6 sm:p-7">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-fg">Imtihon ketma-ketligi</p>
      <ol className="mt-7 flex items-start justify-between gap-2">
        {sections.map((section, i) => (
          <li key={section} className="flex flex-1 items-start">
            <div className="flex flex-1 flex-col items-center text-center">
              <span
                className={
                  "grid size-9 place-items-center rounded-full text-sm font-semibold text-ink-950 " +
                  (i % 2 === 0 ? "bg-brand-400" : "bg-gold-400")
                }
              >
                {i + 1}
              </span>
              <span className="mt-2 text-[13px] font-medium text-fg">{SECTION_LABEL[section]}</span>
              {minutes?.[section] ? (
                <span className="mt-1 text-[11px] text-muted">{minutes[section]} daqiqa</span>
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

const RULES = [
  "Boshlashdan oldin mikrofon va naushnik ishlayotganini tekshiring.",
  "Bo'limlar ketma-ket ochiladi — oldingi bo'limga qaytib bo'lmaydi.",
  "Listening audiosi faqat bir marta ijro etiladi; har bo'limning o'z taymeri bor.",
  "Sahifani yopsangiz ham javoblaringiz saqlanadi; vaqt tugasa bo'lim yakunlanadi.",
];

/** Figma: "Exam instructions & guidelines" */
export function ExamRules() {
  return (
    <div className="card rounded-2xl p-6 sm:p-7">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-fg">Imtihon qoidalari</p>
      <ol className="mt-5 space-y-2.5 text-[13px] leading-relaxed text-muted">
        {RULES.map((rule, i) => (
          <li key={rule}>
            {i + 1}. {rule}
          </li>
        ))}
      </ol>
    </div>
  );
}
