import type { Metadata } from "next";
import Link from "next/link";
import { getPendingChecks } from "@/lib/queries";
import { formatDateTime } from "@/lib/format";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/Card";

export const metadata: Metadata = {
  title: "Tekshirish navbati",
  robots: { index: false, follow: false },
};

export default async function GradingQueuePage() {
  const pending = await getPendingChecks();

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-extrabold">Tekshirish navbati</h2>
        <p className="text-sm text-muted mt-0.5">
          Writing va Speaking javoblarini baholang — natija darhol
          o&apos;quvchiga ko&apos;rinadi.
        </p>
      </div>

      {pending.length === 0 ? (
        <EmptyState
          icon="✅"
          title="Navbat bo'sh"
          description="Hozircha tekshirilishi kerak bo'lgan ish yo'q."
        />
      ) : (
        <div className="space-y-3">
          {pending.map((item) => (
            <Link
              key={item.attempt_id}
              href={`/admin/grading/${item.attempt_id}`}
              className="card p-4 flex flex-wrap items-center gap-4
                         hover:shadow-[var(--shadow-lift)] transition-shadow"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-bold truncate">
                    {item.full_name ?? "Ismsiz"}
                  </p>
                  {item.mode === "exam_checking" ? (
                    <Badge tone="premium">🎯 Exam</Badge>
                  ) : (
                    <Badge tone="neutral">Mock</Badge>
                  )}
                </div>
                <p className="text-sm text-muted truncate">{item.email}</p>
                <p className="text-sm mt-1">{item.test_title}</p>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-xs text-muted">Topshirilgan</p>
                  <p className="text-sm font-semibold">
                    {formatDateTime(item.submitted_at)}
                  </p>
                </div>
                <span className="text-muted" aria-hidden>
                  →
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
