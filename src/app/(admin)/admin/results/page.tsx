import type { Metadata } from "next";
import Link from "next/link";
import { listAllResults } from "@/lib/admin-queries";
import { SECTIONS, SECTION_LABEL } from "@/lib/constants";
import { formatDateTime } from "@/lib/format";
import { Badge, CefrBadge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/Card";
import { Input } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "Barcha natijalar",
  robots: { index: false, follow: false },
};

export default async function AdminResultsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const results = await listAllResults(q);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold">Barcha natijalar</h2>
          <p className="text-sm text-muted mt-0.5">
            O&apos;quvchilarning yakunlangan testlari va imtihonlari
          </p>
        </div>

        <form className="flex items-center gap-2" action="/admin/results">
          <Input
            name="q"
            defaultValue={q ?? ""}
            placeholder="O'quvchi yoki test nomi…"
            className="w-64"
          />
          <Button type="submit" variant="secondary">
            Qidirish
          </Button>
        </form>
      </div>

      {results.length === 0 ? (
        <EmptyState
          icon="📊"
          title={q ? "Hech narsa topilmadi" : "Natijalar hali yo'q"}
          description={
            q
              ? "Qidiruvni o'zgartirib ko'ring."
              : "O'quvchilar test topshirgach, natijalar shu yerda paydo bo'ladi."
          }
        />
      ) : (
        <div className="space-y-2">
          {results.map((row) => {
            const scores = row.section_scores ?? {};
            const shown = SECTIONS.filter((section) => scores[section] != null);

            return (
              <div
                key={row.id}
                className="card p-4 flex flex-wrap items-center gap-4"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-bold truncate">
                      {row.profiles?.full_name ?? "Ismsiz"}
                    </p>
                    {row.status === "graded" ? (
                      <Badge tone="success">Baholangan</Badge>
                    ) : (
                      <Badge tone="warning">Tekshiruvda</Badge>
                    )}
                    {row.mode === "exam_checking" ? (
                      <Badge tone="premium">🎯 Exam</Badge>
                    ) : null}
                  </div>
                  <p className="text-xs text-muted truncate">
                    {row.profiles?.email}
                  </p>
                  <p className="text-sm mt-1">
                    {row.test_sets?.title ?? "Test"}{" "}
                    <span className="text-xs text-muted">
                      · {formatDateTime(row.submitted_at ?? row.started_at)}
                    </span>
                  </p>
                  {shown.length > 0 ? (
                    <p className="text-xs text-muted mt-1">
                      {shown
                        .map((section) => `${SECTION_LABEL[section]}: ${scores[section]}`)
                        .join(" · ")}
                    </p>
                  ) : null}
                </div>

                <div className="flex items-center gap-3">
                  {row.overall_score != null ? (
                    <span className="text-xl font-extrabold tabular-nums">
                      {Math.round(Number(row.overall_score))}
                    </span>
                  ) : null}
                  {row.cefr_level ? <CefrBadge level={row.cefr_level} /> : null}

                  <Link
                    href={`/results/${row.id}`}
                    className="rounded-lg border border-line bg-[var(--bg-subtle)]
                               px-3 py-1.5 text-sm font-semibold hover:border-brand-400 transition-colors"
                  >
                    Ko&apos;rish
                  </Link>
                  {row.needs_manual_check || row.status === "graded" ? (
                    <Link
                      href={`/admin/grading/${row.id}`}
                      className="rounded-lg border border-line bg-[var(--bg-subtle)]
                                 px-3 py-1.5 text-sm font-semibold hover:border-brand-400 transition-colors"
                    >
                      {row.status === "graded" ? "Bahoni o'zgartirish" : "Baholash"}
                    </Link>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
