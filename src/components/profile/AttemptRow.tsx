import Link from "next/link";
import type { AttemptWithTest } from "@/lib/queries";
import { SECTIONS, SECTION_LABEL } from "@/lib/constants";
import { formatDateTime } from "@/lib/format";
import { Badge, CefrBadge } from "@/components/ui/Badge";

const STATUS_META = {
  in_progress: { tone: "info" as const, label: "Davom etmoqda" },
  submitted: { tone: "warning" as const, label: "Tekshiruvda" },
  graded: { tone: "success" as const, label: "Baholandi" },
  abandoned: { tone: "neutral" as const, label: "Bekor qilingan" },
};

export function AttemptRow({ attempt }: { attempt: AttemptWithTest }) {
  const test = attempt.test_sets;
  const status = STATUS_META[attempt.status];
  const inProgress = attempt.status === "in_progress";

  const href = inProgress
    ? attempt.mode === "exam_checking"
      ? `/exam/${attempt.id}`
      : `/test/${attempt.id}`
    : `/results/${attempt.id}`;

  const scores = attempt.section_scores ?? {};
  const shown = SECTIONS.filter((s) => scores[s] != null);

  return (
    <Link
      href={href}
      className="card p-4 flex flex-wrap items-center gap-4
                 hover:shadow-[var(--shadow-lift)] transition-shadow"
    >
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-bold truncate">
            {test?.title ?? "Test"}
          </h3>
          <Badge tone={status.tone}>{status.label}</Badge>
          {attempt.mode === "exam_checking" ? (
            <Badge tone="premium">🎯 Exam</Badge>
          ) : null}
        </div>

        <p className="text-xs text-muted mt-1">
          {formatDateTime(attempt.submitted_at ?? attempt.started_at)}
          {test?.year_label ? ` · ${test.year_label}` : ""}
        </p>

        {shown.length > 0 ? (
          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
            {shown.map((section) => (
              <span key={section} className="text-xs text-muted">
                {SECTION_LABEL[section]}:{" "}
                <strong className="text-fg tabular-nums">
                  {scores[section]}
                </strong>
              </span>
            ))}
          </div>
        ) : null}
      </div>

      <div className="flex items-center gap-4 shrink-0">
        {attempt.overall_score != null ? (
          <div className="text-right">
            <p className="text-xs text-muted font-semibold">Overall</p>
            <p className="text-xl font-extrabold tabular-nums">
              {Math.round(Number(attempt.overall_score))}
            </p>
          </div>
        ) : null}

        {attempt.cefr_level ? <CefrBadge level={attempt.cefr_level} /> : null}

        <span className="text-muted" aria-hidden>
          →
        </span>
      </div>
    </Link>
  );
}
