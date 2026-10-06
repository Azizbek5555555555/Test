import Link from "next/link";
import { Clock, Lock, Star } from "react-feather";
import type { SkillSection, TestSet } from "@/lib/types";
import { SECTION_LABEL } from "@/lib/constants";
import { cn, formatDuration } from "@/lib/format";
import { getT } from "@/i18n/server";

/**
 * Figma 05: test kartasi — yuqorida kirish holati + belgi, Cormorant sarlavha,
 * bo'limlar qatori, pastda savollar soni / vaqt va tugma.
 */
export async function TestSetCard({
  testSet,
  questionCount,
  unlocked,
  href,
  sections,
  showDescription = true,
}: {
  testSet: TestSet;
  questionCount?: number;
  unlocked: boolean;
  href: string;
  sections?: SkillSection[];
  showDescription?: boolean;
}) {
  const t = await getT();
  const locked = testSet.is_premium && !unlocked;
  const manual =
    sections?.some((s) => s === "writing" || s === "speaking") ?? false;

  return (
    <Link
      href={locked ? "/premium?reason=locked" : href}
      data-spot
      className="spot group card lift relative flex h-full flex-col p-6 hover:border-brand-400/40"
    >
      <div className="flex items-center justify-between gap-3">
        {testSet.is_premium ? (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-gold-400">
            {locked ? (
              <Lock size={13} strokeWidth={2} aria-hidden />
            ) : (
              <Star size={13} strokeWidth={2} aria-hidden />
            )}
            {locked ? t("Faqat Premium", "Premium only") : "Premium"}
          </span>
        ) : (
          <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-success">
            {t("Bepul", "Free")}
          </span>
        )}
        {sections && sections.length > 0 ? (
          <span
            className={cn(
              "rounded-full px-2.5 py-0.5 text-[10px] font-semibold",
              manual
                ? "bg-gold-400 uppercase tracking-wide text-on-accent"
                : "border border-line bg-ink-800 text-muted",
            )}
          >
            {manual ? t("To'liq tekshiruv", "Full review") : t("Avto baholash", "Auto-marked")}
          </span>
        ) : null}
      </div>

      <h3 className="display-title mt-4 text-[26px] leading-tight text-fg">
        {testSet.title}
      </h3>

      {sections && sections.length > 0 ? (
        <p className="mt-1.5 text-sm text-muted">
          {sections.map((s) => SECTION_LABEL[s]).join(" · ")}
        </p>
      ) : null}
      {showDescription && testSet.description ? (
        <p className="mt-1.5 text-sm leading-relaxed text-muted line-clamp-2">
          {testSet.description}
        </p>
      ) : null}

      <div className="mt-auto flex flex-wrap items-center justify-between gap-4 pt-6">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-muted">
          {questionCount ? (
            <span className="inline-flex items-center gap-1.5">
              <Star size={14} className="text-brand-400" aria-hidden />
              {questionCount} {t("ta savol", "questions")}
            </span>
          ) : null}
          <span className="inline-flex items-center gap-1.5">
            <Clock size={14} className="text-brand-400" aria-hidden />
            {formatDuration(testSet.duration_minutes, t.locale)}
          </span>
          {testSet.level ? (
            <span className="rounded-full border border-line px-2 py-0.5 text-[11px] font-semibold">
              {testSet.level}
            </span>
          ) : null}
        </div>

        <span
          className={cn(
            "inline-flex items-center rounded-full px-5 py-2 text-[13px] font-semibold transition-colors",
            locked
              ? "border-[1.5px] border-gold-400/80 text-gold-400 group-hover:bg-gold-400 group-hover:text-on-accent"
              : "bg-brand-400 text-on-accent group-hover:bg-brand-300",
          )}
        >
          {locked ? t("Premiumni ochish", "Unlock Premium") : t("Boshlash", "Start")}
        </span>
      </div>
    </Link>
  );
}
