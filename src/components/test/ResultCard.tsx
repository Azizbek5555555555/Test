import type { Attempt, SectionBreakdownEntry, SkillSection } from "@/lib/types";
import { EXAM_SECTION_ORDER, SECTION_LABEL, SECTIONS, SITE_NAME } from "@/lib/constants";
import { cefrFromScore, cn, formatDateTime } from "@/lib/format";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { getT } from "@/i18n/server";
import type { T } from "@/i18n";

/**
 * Figma 09 "Instant Diagnostic Breakdown" — natija kartasi:
 *   MULTILEVEL RESULT · CEFR halqasi · bo'limlar "62 / 100" · amallar
 */
export async function ResultCard({
  attempt,
  testTitle,
  studentName,
  actions,
}: {
  attempt: Attempt;
  testTitle: string;
  studentName?: string | null;
  actions?: React.ReactNode;
}) {
  const t = await getT();
  const scores = attempt.section_scores ?? {};
  const breakdown = attempt.section_breakdown ?? {};
  // Imtihon tartibida (Listening → Reading → Writing → Speaking)
  const present = EXAM_SECTION_ORDER.filter(
    (section) => scores[section] != null || breakdown[section],
  ).concat(SECTIONS.filter((s) => !EXAM_SECTION_ORDER.includes(s) && (scores[s] != null || breakdown[s])));

  const overall = attempt.overall_score != null ? Math.round(Number(attempt.overall_score)) : null;

  return (
    <div className="card rounded-2xl p-7 sm:p-10 print:border-ink-300 print:shadow-none">
      <p className="text-center text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
        Multilevel result
      </p>
      <p className="mt-1 text-center text-xs text-faint">
        {SITE_NAME} · {testTitle}
      </p>

      <div className="mt-6 flex justify-center">
        <ProgressRing value={overall ?? 0} size={200} stroke={10} color="var(--color-gold-400)">
          <div>
            <p className="font-display text-6xl leading-none text-gold-400 lining-nums">
              {attempt.cefr_level ?? "—"}
            </p>
            <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">
              {attempt.cefr_level ? t("Umumiy CEFR", "Overall CEFR") : t("Tekshirilmoqda", "Being reviewed")}
            </p>
            {overall != null ? (
              <p className="mt-1 text-xs tabular-nums text-muted">{overall} / 100</p>
            ) : null}
          </div>
        </ProgressRing>
      </div>

      <ul className="mt-8 space-y-4">
        {present.map((section) => (
          <ScoreRow
            key={section}
            section={section}
            score={scores[section] ?? null}
            correct={pointsOrCount(breakdown[section], "correct")}
            total={pointsOrCount(breakdown[section], "total")}
            t={t}
          />
        ))}
      </ul>

      {attempt.needs_manual_check ? (
        <div className="mt-6 rounded-xl border border-warning/40 bg-warning/10 p-4 text-sm leading-relaxed text-fg">
          <strong>
            {t("Writing va Speaking javoblaringiz o'qituvchi tekshiruvida.", "Your Writing and Speaking answers are being reviewed by a teacher.")}
          </strong>{" "}
          {t(
            "Tekshirilgach yakuniy ball va CEFR darajasi yangilanadi — natija profilingizda saqlanadi.",
            "Once reviewed, your final score and CEFR level will update — the result is saved in your profile.",
          )}
        </div>
      ) : null}

      <p className="mt-6 text-center text-xs text-faint">
        {studentName ? `${studentName} · ` : ""}
        {formatDateTime(attempt.submitted_at ?? attempt.started_at, t.locale)}
      </p>

      {actions ? <div className="mt-6 grid grid-cols-2 gap-3 print:hidden">{actions}</div> : null}
    </div>
  );
}

/** Figma: "Coach feedback" kartalari — o'qituvchi izohi har bo'lim uchun */
export async function FeedbackCards({ attempt }: { attempt: Attempt }) {
  const entries = Object.entries(attempt.teacher_feedback ?? {}).filter(([, v]) => v) as [
    SkillSection,
    string,
  ][];
  if (entries.length === 0) return null;
  const t = await getT();
  const scores = attempt.section_scores ?? {};

  return (
    <section className="mb-10">
      <p className="mb-4 text-xs font-semibold uppercase tracking-[0.12em] text-brand-400">
        {t("O'qituvchi izohi va tahlil", "Teacher feedback and analysis")}
      </p>
      <div className="space-y-4">
        {entries.map(([section, text]) => {
          const level = cefrFromScore(scores[section]);
          return (
            <div key={section} className="rounded-2xl border border-line bg-ink-800 p-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-[15px] font-semibold text-fg">{SECTION_LABEL[section] ?? section}</p>
                {scores[section] != null ? (
                  <span className="text-xs font-semibold text-success">
                    {scores[section]} / 100{level ? ` · ${level}` : ""}
                  </span>
                ) : null}
              </div>
              <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-muted">{text}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/**
 * "X / Y to'g'ri" — ball bo'yicha (matching savolining har bir qatori alohida
 * ball, shuning uchun Full Mock'da Listening/Reading → "/ 35"). Eski
 * natijalarda ball bo'lmasa, savollar soni ko'rsatiladi.
 */
function pointsOrCount(
  entry: SectionBreakdownEntry | undefined,
  field: "correct" | "total",
): number | undefined {
  if (!entry) return undefined;
  if (typeof entry.max === "number" && entry.max > 0) {
    const value = field === "total" ? entry.max : entry.earned;
    return typeof value === "number" ? Math.round(value * 100) / 100 : undefined;
  }
  return entry[field];
}

function ScoreRow({
  section,
  score,
  correct,
  total,
  t,
}: {
  section: SkillSection;
  score: number | null;
  correct?: number;
  total?: number;
  t: T;
}) {
  const pending = score == null;
  const pct = score ?? 0;

  return (
    <li>
      <div className="flex items-center justify-between gap-2 text-sm">
        <span className="text-fg">{SECTION_LABEL[section]}</span>
        {pending ? (
          <span className="text-xs font-semibold text-warning">{t("tekshirilmoqda", "in review")}</span>
        ) : (
          <span className="font-semibold tabular-nums text-fg">
            {score} / 100
            {typeof correct === "number" && typeof total === "number" ? (
              <span className="ml-2 text-xs font-normal text-muted">
                ({correct}/{total})
              </span>
            ) : null}
          </span>
        )}
      </div>
      {!pending ? (
        <div className="mt-2 h-1 overflow-hidden rounded-full bg-ink-700">
          <div
            className={cn(
              "h-full rounded-full",
              pct >= 60 ? "bg-success" : pct >= 45 ? "bg-warning" : "bg-danger",
            )}
            style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
          />
        </div>
      ) : null}
    </li>
  );
}
