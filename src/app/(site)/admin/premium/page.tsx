import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getProfile, isAdmin } from "@/lib/auth";
import { listPremiumRequests } from "@/lib/admin-queries";
import { formatDateTime, formatSum } from "@/lib/format";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/Card";
import { PremiumRequestActions } from "@/components/admin/PremiumRequestActions";

export const metadata: Metadata = {
  title: "Premium so'rovlar",
  robots: { index: false, follow: false },
};

const STATUS_META = {
  pending: { tone: "warning" as const, label: "Kutilmoqda" },
  approved: { tone: "success" as const, label: "Tasdiqlangan" },
  rejected: { tone: "danger" as const, label: "Rad etilgan" },
};

export default async function AdminPremiumPage() {
  const me = await getProfile();
  if (!isAdmin(me)) redirect("/admin");

  const requests = await listPremiumRequests();
  const pending = requests.filter((r) => r.status === "pending");
  const handled = requests.filter((r) => r.status !== "pending");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-extrabold">Premium so&apos;rovlar</h2>
        <p className="text-sm text-muted mt-0.5">
          Tasdiqlaganingizda foydalanuvchiga Premium avtomatik faollashadi.
        </p>
      </div>

      <section>
        <h3 className="font-bold mb-3">
          Kutilmoqda{" "}
          <span className="text-muted tabular-nums">({pending.length})</span>
        </h3>

        {pending.length === 0 ? (
          <EmptyState
            icon="✅"
            title="Yangi so'rov yo'q"
            description="Barcha so'rovlar ko'rib chiqilgan."
          />
        ) : (
          <div className="space-y-3">
            {pending.map((request) => (
              <div key={request.id} className="card p-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-bold">
                      {request.profiles?.full_name ?? "Ismsiz"}
                    </p>
                    <p className="text-sm text-muted">
                      {request.profiles?.email}
                    </p>
                    <p className="text-sm mt-2">
                      <strong>{request.plan}</strong> · {request.months} oy ·{" "}
                      {formatSum(request.amount)}
                    </p>
                    {request.note ? (
                      <p className="text-sm text-muted mt-1.5 leading-relaxed">
                        💬 {request.note}
                      </p>
                    ) : null}
                    <p className="text-xs text-muted mt-2">
                      {formatDateTime(request.created_at)}
                    </p>
                  </div>

                  <PremiumRequestActions
                    requestId={request.id}
                    userId={request.user_id}
                    months={request.months}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {handled.length > 0 ? (
        <section>
          <h3 className="font-bold mb-3">Ko&apos;rib chiqilgan</h3>
          <div className="card p-0 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line bg-[var(--bg-subtle)]">
                  <th className="text-left font-bold px-4 py-2.5">
                    Foydalanuvchi
                  </th>
                  <th className="text-left font-bold px-4 py-2.5">Tarif</th>
                  <th className="text-left font-bold px-4 py-2.5">Holat</th>
                  <th className="text-left font-bold px-4 py-2.5 hidden sm:table-cell">
                    Sana
                  </th>
                </tr>
              </thead>
              <tbody>
                {handled.map((request) => {
                  const meta = STATUS_META[request.status];
                  return (
                    <tr
                      key={request.id}
                      className="border-b border-line last:border-0"
                    >
                      <td className="px-4 py-2.5">
                        <p className="font-semibold">
                          {request.profiles?.full_name ?? "Ismsiz"}
                        </p>
                        <p className="text-xs text-muted">
                          {request.profiles?.email}
                        </p>
                      </td>
                      <td className="px-4 py-2.5">
                        {request.plan} · {request.months} oy
                      </td>
                      <td className="px-4 py-2.5">
                        <Badge tone={meta.tone}>{meta.label}</Badge>
                      </td>
                      <td className="px-4 py-2.5 text-muted text-xs hidden sm:table-cell">
                        {formatDateTime(request.reviewed_at ?? request.created_at)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </div>
  );
}
