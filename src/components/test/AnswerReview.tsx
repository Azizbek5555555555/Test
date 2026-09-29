import type { AnswerValue, AttemptReviewRow, SkillSection } from "@/lib/types";
import { CheckCircle, Clock, MinusCircle, XCircle } from "react-feather";
import { SECTION_LABEL } from "@/lib/constants";
import { SectionIcon } from "@/components/ui/icons";
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

function formatPoints(value: number): string {
  return String(Math.round(value * 100) / 100);
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
        // Ball bo'yicha: matching savolining har bir qatori — alohida ball
        const earned = auto.reduce((sum, r) => sum + r.points * (r.ratio ?? 0), 0);
        const max = auto.reduce((sum, r) => sum + r.points, 0);
        const allCorrect = auto.every((r) => (r.ratio ?? 0) >= 0.999);
        // Imtihondagi raqamlar: matching savoli nechta qator bo'lsa, shuncha raqam oladi
        const numbers: number[] = [];
        let next = 1;
        for (const r of list) {
          numbers.push(next);
          next += r.kind === "matching" && Array.isArray(r.options) ? Math.max(1, r.options.length) : 1;
        }

        return (
          <section key={section}>
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <h3 className="display-title flex items-center gap-2 text-xl">
                <SectionIcon section={section} className="text-brand-400" />
                {SECTION_LABEL[section]}
              </h3>
              {auto.length > 0 ? (
                <Badge tone={allCorrect ? "success" : "neutral"}>
                  {formatPoints(earned)} / {formatPoints(max)} to&apos;g&apos;ri
                </Badge>
              ) : (
                <Badge tone="warning">O&apos;qituvchi tekshiradi</Badge>
              )}
            </div>

            <ol className="space-y-3">
              {list.map((row, i) => (
                <ReviewItem key={row.question_id} row={row} number={numbers[i]} />
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
      ? "border-success/40"
      : isPartial
        ? "border-warning/40"
        : "border-danger/40";

  const mark = manual ? (
    <Clock size={18} className="text-muted" />
  ) : isCorrect ? (
    <CheckCircle size={18} className="text-success" />
  ) : isPartial ? (
    <MinusCircle size={18} className="text-warning" />
  ) : (
    <XCircle size={18} className="text-danger" />
  );

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
                      ? "text-success"
                      : "text-danger",
                )}
              >
                {renderAnswer(row.given_answer as AnswerValue)}
              </dd>
            </div>

            {!manual && !isCorrect ? (
              <div className="flex flex-wrap gap-x-2">
                <dt className="text-muted shrink-0">To&apos;g&apos;ri javob:</dt>
                <dd className="font-semibold text-success min-w-0">
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
