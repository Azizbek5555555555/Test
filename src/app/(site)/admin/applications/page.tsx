import type { Metadata } from "next";
import { listApplications } from "@/lib/admin-queries";
import { updateApplicationStatusAction } from "@/lib/actions/admin";
import { formatDateTime } from "@/lib/format";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/Card";

export const metadata: Metadata = {
  title: "Kurs arizalari",
  robots: { index: false, follow: false },
};

const STATUS_META = {
  new: { tone: "warning" as const, label: "Yangi" },
  contacted: { tone: "info" as const, label: "Bog'lanildi" },
  enrolled: { tone: "success" as const, label: "Qabul qilindi" },
  rejected: { tone: "neutral" as const, label: "Rad etildi" },
};

const NEXT_STATUS = [
  { value: "contacted", label: "📞 Bog'lanildi" },
  { value: "enrolled", label: "✅ Qabul qilindi" },
  { value: "rejected", label: "✕ Rad etish" },
  { value: "new", label: "↺ Yangi" },
];

export default async function AdminApplicationsPage() {
  const applications = await listApplications();

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-extrabold">Kurs arizalari</h2>
        <p className="text-sm text-muted mt-0.5">
          Saytdan kelgan ro&apos;yxatdan o&apos;tish arizalari
        </p>
      </div>

      {applications.length === 0 ? (
        <EmptyState
          icon="📋"
          title="Arizalar yo'q"
          description="Kurslar sahifasidan yuborilgan arizalar shu yerda ko'rinadi."
        />
      ) : (
        <div className="space-y-3">
          {applications.map((application) => {
            const meta = STATUS_META[application.status];
            return (
              <div key={application.id} className="card p-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-bold">{application.full_name}</p>
                      <Badge tone={meta.tone}>{meta.label}</Badge>
                    </div>

                    <a
                      href={`tel:${application.phone.replace(/\s/g, "")}`}
                      className="text-sm font-semibold text-brand-600 dark:text-brand-400 hover:underline"
                    >
                      📞 {application.phone}
                    </a>

                    <p className="text-sm mt-1.5">
                      Kurs:{" "}
                      <strong>{application.courses?.title ?? "—"}</strong>
                    </p>

                    {application.note ? (
                      <p className="text-sm text-muted mt-1.5 leading-relaxed">
                        💬 {application.note}
                      </p>
                    ) : null}

                    <p className="text-xs text-muted mt-2">
                      {formatDateTime(application.created_at)}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {NEXT_STATUS.filter(
                      (s) => s.value !== application.status,
                    ).map((status) => (
                      <form key={status.value} action={updateApplicationStatusAction}>
                        <input type="hidden" name="id" value={application.id} />
                        <input
                          type="hidden"
                          name="status"
                          value={status.value}
                        />
                        <button
                          type="submit"
                          className="rounded-lg border border-line bg-[var(--bg-subtle)]
                                     px-2.5 py-1.5 text-xs font-semibold
                                     hover:border-brand-400 transition-colors whitespace-nowrap"
                        >
                          {status.label}
                        </button>
                      </form>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
