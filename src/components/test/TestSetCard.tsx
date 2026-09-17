import Link from "next/link";
import type { SkillSection, TestSet } from "@/lib/types";
import { SECTION_ICON, SECTION_LABEL } from "@/lib/constants";
import { formatDuration } from "@/lib/format";
import { AccessBadge, Badge } from "@/components/ui/Badge";

export function TestSetCard({
  testSet,
  questionCount,
  unlocked,
  href,
  sections,
}: {
  testSet: TestSet;
  questionCount?: number;
  unlocked: boolean;
  href: string;
  sections?: SkillSection[];
}) {
  const locked = testSet.is_premium && !unlocked;

  return (
    <Link
      href={locked ? "/premium?reason=locked" : href}
      className="group card p-5 flex flex-col transition-all duration-200
                 hover:shadow-[var(--shadow-lift)] hover:-translate-y-0.5"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-bold text-lg leading-snug">{testSet.title}</h3>
          {testSet.description ? (
            <p className="text-sm text-muted mt-1.5 leading-relaxed line-clamp-2">
              {testSet.description}
            </p>
          ) : null}
        </div>
        <AccessBadge isPremium={testSet.is_premium} unlocked={unlocked} />
      </div>

      {sections && sections.length > 0 ? (
        <div className="flex flex-wrap gap-1.5 mt-4">
          {sections.map((section) => (
            <span
              key={section}
              className="text-xs font-semibold text-muted bg-[var(--bg-subtle)]
                         border border-line rounded-full px-2.5 py-1"
            >
              {SECTION_ICON[section]} {SECTION_LABEL[section]}
            </span>
          ))}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-auto pt-4 text-xs text-muted">
        <span>⏱ {formatDuration(testSet.duration_minutes)}</span>
        {typeof questionCount === "number" ? (
          <span>❓ {questionCount} ta savol</span>
        ) : null}
        {testSet.level ? <Badge tone="neutral">{testSet.level}</Badge> : null}
      </div>

      <span
        className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold
                   text-brand-600 dark:text-brand-400 group-hover:gap-2.5 transition-all"
      >
        {locked ? "🔒 Premiumga o'tish" : "Boshlash"}
        <span aria-hidden>→</span>
      </span>
    </Link>
  );
}
