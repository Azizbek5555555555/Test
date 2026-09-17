import type { AnswerValue, AttemptReviewRow, SkillSection } from "@/lib/types";
import { SECTION_ICON, SECTION_LABEL } from "@/lib/constants";
import { cn } from "@/lib/format";
import { Badge } from "@/components/ui/Badge";

function renderAnswer(value: unknown): string {
  if (value == null) return "—";
  if (typeof value === "string") return value.trim() || "—";
  if (typeof value === "number" || typeof value === "boolean")
    return String(value);
  if (Array.isArray(value)) {
    const parts = value.map((v) => renderAnswer(v)).filter((v) => v !== "—");
    return parts.length ? parts.join(", ") : "—";
  }
  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    // Speaking javobi: { text, audio }
    if ("text" in record || "audio" in record) {
      const text = typeof record.text === "string" ? record.text.trim() : "";
      const audio = typeof record.audio === "string" ? record.audio : "";
      if (text && audio) return `${text}  ·  🎙️ audio yozilgan`;
      if (text) return text;
      if (audio) return "🎙️ audio yozilgan";
      return "—";
    }
    const entries = Object.entries(record)
      .filter(([, v]) => v != null && String(v).trim() !== "")
      .map(([k, v]) => `${k} → ${String(v)}`);
    return entries.length ? entries.join(" · ") : "—";
  }
  return "—";
}

export function AnswerReview({ rows }: { rows: AttemptReviewRow[] }) {
  if (rows.length === 0) return null;

  // Bo'limlar bo'yicha guruhlash
  const bySection = new Map<SkillSection, AttemptReviewRow[]>();
  for (const row of rows) {
    const list = bySection.get(row.section) ?? [];
    list.push(row);
    bySection.set(row.section, list);
  }

  return (
    <div className="space-y-8">
      {Array.from(bySection.entries()).map(([section, list]) => {
        const auto = list.filter((r) => r.ratio != null);
        const correct = auto.filter((r) => (r.ratio ?? 0) >= 0.999).length;

        return (
          <section key={section}>
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <h3 className="font-extrabold text-lg">
                <span aria-hidden>{SECTION_ICON[section]}</span>{" "}
                {SECTION_LABEL[section]}
              </h3>
              {auto.length > 0 ? (
                <Badge tone={correct === auto.length ? "success" : "neutral"}>
                  {correct} / {auto.length} to&apos;g&apos;ri
                </Badge>
              ) : (
                <Badge tone="warning">O&apos;qituvchi tekshiradi</Badge>
              )}
            </div>

            <ol className="space-y-3">
              {list.map((row, i) => (
                <ReviewItem key={row.question_id} row={row} number={i + 1} />
              ))}
            </ol>
          </section>
        );
      })}
    </div>
  );
}

function ReviewItem({ row, number }: { row: AttemptReviewRow; number: number }) {
  const manual = row.ratio == null;
  const isCorrect = !manual && (row.ratio ?? 0) >= 0.999;
  const isPartial = !manual && (row.ratio ?? 0) > 0 && (row.ratio ?? 0) < 0.999;

  const tone = manual
    ? "border-line"
    : isCorrect
      ? "border-emerald-300 dark:border-emerald-800"
      : isPartial
        ? "border-amber-300 dark:border-amber-800"
        : "border-rose-300 dark:border-rose-800";

  const mark = manual ? "⏳" : isCorrect ? "✅" : isPartial ? "◐" : "❌";

  return (
    <li className={cn("card p-4 border", tone)}>
      <div className="flex gap-3">
        <span className="shrink-0 text-lg leading-none pt-0.5" aria-hidden>
          {mark}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold text-muted tabular-nums mb-1">
            Savol {number}
          </p>
          <p className="font-semibold leading-relaxed whitespace-pre-line">
            {row.prompt}
          </p>

          <dl className="mt-3 space-y-1.5 text-sm">
            <div className="flex flex-wrap gap-x-2">
              <dt className="text-muted shrink-0">Sizning javobingiz:</dt>
              <dd
                className={cn(
                  "font-semibold min-w-0",
                  manual
                    ? ""
                    : isCorrect
                      ? "text-emerald-700 dark:text-emerald-400"
                      : "text-rose-700 dark:text-rose-400",
                )}
              >
                {renderAnswer(row.given_answer as AnswerValue)}
              </dd>
            </div>

            {!manual && !isCorrect ? (
              <div className="flex flex-wrap gap-x-2">
                <dt className="text-muted shrink-0">To&apos;g&apos;ri javob:</dt>
                <dd className="font-semibold text-emerald-700 dark:text-emerald-400 min-w-0">
                  {renderAnswer(row.correct_answer)}
                </dd>
              </div>
            ) : null}
          </dl>

          {row.explanation && !manual ? (
            <p className="text-sm text-muted mt-2.5 leading-relaxed border-l-2 border-line pl-3">
              💡 {row.explanation}
            </p>
          ) : null}

          {manual ? (
            <p className="text-sm text-muted mt-2.5">
              Bu javob o&apos;qituvchi tomonidan qo&apos;lda baholanadi.
            </p>
          ) : null}
        </div>
      </div>
    </li>
  );
}
