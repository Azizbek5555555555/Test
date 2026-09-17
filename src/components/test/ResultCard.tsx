import type { Attempt, SkillSection } from "@/lib/types";
import { SECTION_ICON, SECTION_LABEL, SECTIONS } from "@/lib/constants";
import { formatDateTime } from "@/lib/format";
import { CefrBadge } from "@/components/ui/Badge";
import { cn } from "@/lib/format";

/**
 * Hujjatning 12-bo'limidagi natija kartasi:
 *   MULTILEVEL RESULT
 *   Listening: 62 · Reading: 68 · Writing: 58 · Speaking: 61 · Overall: B2
 */
export function ResultCard({
  attempt,
  testTitle,
  studentName,
}: {
  attempt: Attempt;
  testTitle: string;
  studentName?: string | null;
}) {
  const scores = attempt.section_scores ?? {};
  const breakdown = attempt.section_breakdown ?? {};
  const present = SECTIONS.filter(
    (section) => scores[section] != null || breakdown[section],
  );

  return (
    <div className="card p-0 overflow-hidden print:shadow-none print:border-ink-300">
      <div className="bg-gradient-to-r from-brand-700 to-brand-900 p-6 sm:p-8 text-white">
        <p className="text-brand-200 text-xs font-bold uppercase tracking-[0.2em]">
          Multilevel Plus
        </p>
        <h2 className="text-2xl sm:text-3xl font-extrabold mt-1">
          MULTILEVEL RESULT
        </h2>
        <p className="text-brand-100 text-sm mt-2">{testTitle}</p>
        {studentName ? (
          <p className="text-brand-100 text-sm mt-0.5">{studentName}</p>
        ) : null}
        <p className="text-brand-200/80 text-xs mt-2">
          {formatDateTime(attempt.submitted_at ?? attempt.started_at)}
        </p>
      </div>

      <div className="p-6 sm:p-8">
        <div className="grid sm:grid-cols-2 gap-3">
          {present.map((section) => (
            <ScoreRow
              key={section}
              section={section}
              score={scores[section] ?? null}
              correct={breakdown[section]?.correct}
              total={breakdown[section]?.total}
              pending={scores[section] == null}
            />
          ))}
        </div>

        <div className="mt-6 pt-6 border-t border-line flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-muted">
              Overall
            </p>
            <p className="text-3xl font-extrabold tabular-nums mt-1">
              {attempt.overall_score != null
                ? Number(attempt.overall_score).toFixed(0)
                : "—"}
              <span className="text-base text-muted font-semibold"> / 100</span>
            </p>
          </div>

          <div className="text-right">
            <p className="text-xs font-bold uppercase tracking-wide text-muted mb-1.5">
              CEFR daraja
            </p>
            {attempt.cefr_level ? (
              <CefrBadge level={attempt.cefr_level} size="lg" />
            ) : (
              <span className="text-sm text-muted">Tekshirilmoqda…</span>
            )}
          </div>
        </div>

        {attempt.needs_manual_check ? (
          <div
            className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm
                       text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200"
          >
            ⏳ <strong>Writing va Speaking javoblaringiz o&apos;qituvchi
            tekshiruvida.</strong>{" "}
            Tekshirilgach yakuniy ball va CEFR darajasi yangilanadi — natija
            profilingizda saqlanadi.
          </div>
        ) : null}

        {/* O'qituvchi izohi */}
        {Object.entries(attempt.teacher_feedback ?? {}).some(([, v]) => v) ? (
          <div className="mt-5 space-y-3">
            <h3 className="font-bold text-sm">O&apos;qituvchi izohi</h3>
            {Object.entries(attempt.teacher_feedback ?? {}).map(
              ([section, text]) =>
                text ? (
                  <div
                    key={section}
                    className="rounded-xl border border-line bg-[var(--bg-subtle)] p-4"
                  >
                    <p className="text-xs font-bold uppercase tracking-wide text-muted mb-1.5">
                      {SECTION_LABEL[section as SkillSection] ?? section}
                    </p>
                    <p className="text-sm leading-relaxed whitespace-pre-line">
                      {text}
                    </p>
                  </div>
                ) : null,
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function ScoreRow({
  section,
  score,
  correct,
  total,
  pending,
}: {
  section: SkillSection;
  score: number | null;
  correct?: number;
  total?: number;
  pending: boolean;
}) {
  const pct = score ?? 0;

  return (
    <div className="rounded-xl border border-line bg-[var(--bg-subtle)] p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-bold">
          <span aria-hidden>{SECTION_ICON[section]}</span>{" "}
          {SECTION_LABEL[section]}
        </span>
        <span className="text-xl font-extrabold tabular-nums">
          {pending ? (
            <span className="text-sm font-semibold text-amber-600 dark:text-amber-400">
              kutilmoqda
            </span>
          ) : (
            score
          )}
        </span>
      </div>

      {!pending ? (
        <>
          <div className="h-1.5 rounded-full bg-[var(--border)] overflow-hidden mt-2.5">
            <div
              className={cn(
                "h-full rounded-full",
                pct >= 60 ? "bg-emerald-500" : pct >= 45 ? "bg-amber-500" : "bg-rose-500",
              )}
              style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
            />
          </div>
          {typeof correct === "number" && typeof total === "number" ? (
            <p className="text-xs text-muted mt-1.5 tabular-nums">
              {correct} / {total} to&apos;g&apos;ri
            </p>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
