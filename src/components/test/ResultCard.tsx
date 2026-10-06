import Link from "next/link";
import type { Attempt, SectionBreakdownEntry, SkillSection } from "@/lib/types";
import { EXAM_SECTION_ORDER, EXAMINER_NAME, REVIEW_HOURS, SECTION_LABEL, SECTIONS, SITE_NAME } from "@/lib/constants";
import { cefrFromScore, cn, formatDateTime } from "@/lib/format";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { getT } from "@/i18n/server";
import { MAX_SCORE, scorePercent } from "@/lib/scoring";
import type { T } from "@/i18n";

/**
 * Figma 09 "Instant Diagnostic Breakdown" — natija kartasi:
 *   MULTILEVEL RESULT · CEFR halqasi · bo'limlar "62 / 75" (rasmiy shkala) · amallar
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
  // 0010: o'qituvchi tekshiruvi limiti tugagan bo'lsa Writing/Speaking baholanmaydi
  const noReview = (breakdown as Record<string, unknown>)._review === "none";

  return (
    <div className="card rounded-2xl p-7 sm:p-10 print:border-ink-300 print:shadow-none">
      <p className="text-center text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
        Multilevel result
      </p>
      <p className="mt-1 text-center text-xs text-faint">
        {SITE_NAME} · {testTitle}
      </p>

      <div className="mt-6 flex justify-center">
        <ProgressRing value={scorePercent(overall)} size={200} stroke={10} color="var(--color-gold-400)">
          <div>
            <p className="font-display text-6xl leading-none text-gold-400 lining-nums">
              {attempt.cefr_level ?? "—"}
            </p>
            <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">
              {attempt.cefr_level ? t("Umumiy CEFR", "Overall CEFR") : t("Tekshirilmoqda", "Being reviewed")}
            </p>
            {overall != null ? (
              <p className="mt-1 text-xs tabular-nums text-muted">{overall} / {MAX_SCORE}</p>
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
            notReviewed={noReview && scores[section] == null}
            t={t}
          />
        ))}
      </ul>

      {attempt.needs_manual_check ? (
        <div className="mt-6 rounded-xl border border-warning/40 bg-warning/10 p-4 text-sm leading-relaxed text-fg">
          <strong>
            {t("Writing va Speaking javoblaringiz tekshiruvda.", "Your Writing and Speaking answers are under review.")}
          </strong>{" "}
          {t(
            `Tekshiruvchi ${EXAMINER_NAME} ularni ${REVIEW_HOURS} soat ichida rasmiy mezonlar bo'yicha baholaydi. Shundan keyin yakuniy ball va daraja yangilanadi — natija profilingizda saqlanadi.`,
            `Our examiner ${EXAMINER_NAME} grades them against the official criteria within ${REVIEW_HOURS} hours. Your final score and level will then update — the result is saved in your profile.`,
          )}
        </div>
      ) : null}

      {noReview && !attempt.needs_manual_check ? (
        <div className="mt-6 rounded-xl border border-gold-400/40 bg-gold-400/10 p-4 text-sm leading-relaxed text-fg print:hidden">
          <strong>{t("Writing va Speaking o'qituvchi tomonidan tekshirilmadi.", "Writing and Speaking were not reviewed by a teacher.")}</strong>{" "}
          {t(
            "Tarifingizdagi o'qituvchi tekshiruvlari tugagan, shuning uchun natija Reading va Listening bo'yicha hisoblandi. Javoblaringiz saqlangan.",
            "Your plan has no teacher reviews left, so the result is based on Reading and Listening. Your answers are saved.",
          )}{" "}
          <Link href="/premium#tariflar" className="font-semibold text-gold-400 underline-offset-2 hover:underline print:hidden">
            {t("Tekshiruvli tariflar →", "Plans with teacher review →")}
          </Link>
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
                    {scores[section]} / {MAX_SCORE}{level ? ` · ${level}` : ""}
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
  notReviewed,
  t,
}: {
  section: SkillSection;
  score: number | null;
  correct?: number;
  total?: number;
  notReviewed?: boolean;
  t: T;
}) {
  const pending = score == null;
  const pct = scorePercent(score);

  return (
    <li>
      <div className="flex items-center justify-between gap-2 text-sm">
        <span className="text-fg">{SECTION_LABEL[section]}</span>
        {pending && notReviewed ? (
          <span className="text-xs font-semibold text-faint">{t("tekshirilmagan", "not reviewed")}</span>
        ) : pending ? (
          <span className="text-xs font-semibold text-warning">{t("tekshirilmoqda", "in review")}</span>
        ) : (
          <span className="font-semibold tabular-nums text-fg">
            {score} / {MAX_SCORE}
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
              (score ?? 0) >= 51 ? "bg-success" : (score ?? 0) >= 38 ? "bg-warning" : "bg-danger",
            )}
            style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
          />
        </div>
      ) : null}
    </li>
  );
}
