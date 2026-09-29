import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getProfile, isAdmin } from "@/lib/auth";
import { listPaymentOrders } from "@/lib/admin-queries";
import { getEnabledProviders } from "@/lib/payments/config";
import { formatDateTime, formatSum } from "@/lib/format";
import { Badge } from "@/components/ui/Badge";
import { Alert, EmptyState } from "@/components/ui/Card";

export const metadata: Metadata = {
  title: "To'lovlar",
  robots: { index: false, follow: false },
};

const STATUS_META = {
  pending: { tone: "warning" as const, label: "Kutilmoqda" },
  paid: { tone: "success" as const, label: "To'langan" },
  cancelled: { tone: "danger" as const, label: "Bekor qilingan" },
};

const PROVIDER_LABEL = { payme: "Payme", click: "Click" } as const;

export default async function AdminPaymentsPage() {
  const me = await getProfile();
  if (!isAdmin(me)) redirect("/admin");

  const [orders, providers] = await Promise.all([
    listPaymentOrders(),
    Promise.resolve(getEnabledProviders()),
  ]);

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const paid = orders.filter((o) => o.status === "paid");
  const paidThisMonth = paid.filter((o) => o.paid_at && new Date(o.paid_at) >= monthStart);
  const sum = (list: typeof orders) => list.reduce((total, o) => total + o.amount, 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-extrabold">To&apos;lovlar</h2>
        <p className="text-sm text-muted mt-0.5">
          Payme va Click orqali qilingan to&apos;lovlar. To&apos;lov o&apos;tishi bilan
          Premium avtomatik yoqiladi.
        </p>
      </div>

      {providers.length === 0 ? (
        <Alert tone="warning" title="Onlayn to'lov hali ulanmagan">
          Payme yoki Click kalitlari Railway → Variables bo&apos;limiga kiritilmagan.
          Hozircha o&apos;quvchilar kartaga o&apos;tkazma qilib, &quot;Premium
          so&apos;rovlar&quot; orqali murojaat qiladi (SETUP.md → Onlayn to&apos;lov).
        </Alert>
      ) : (
        <Alert tone="success">
          Ulangan: {providers.map((p) => PROVIDER_LABEL[p]).join(", ")}
        </Alert>
      )}

      <div className="grid sm:grid-cols-3 gap-3">
        <div className="card p-4">
          <p className="text-xs text-muted font-semibold">Shu oy tushum</p>
          <p className="text-xl font-extrabold tabular-nums mt-1">{formatSum(sum(paidThisMonth))}</p>
          <p className="text-xs text-muted mt-0.5">{paidThisMonth.length} ta to&apos;lov</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-muted font-semibold">Jami (oxirgi 200 ta ichida)</p>
          <p className="text-xl font-extrabold tabular-nums mt-1">{formatSum(sum(paid))}</p>
          <p className="text-xs text-muted mt-0.5">{paid.length} ta to&apos;lov</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-muted font-semibold">Kutilayotgan</p>
          <p className="text-xl font-extrabold tabular-nums mt-1">
            {orders.filter((o) => o.status === "pending").length}
          </p>
          <p className="text-xs text-muted mt-0.5">to&apos;lov sahifasiga o&apos;tib, to&apos;lamaganlar</p>
        </div>
      </div>

      {orders.length === 0 ? (
        <EmptyState icon="💳" title="Hali to'lov yo'q" description="Birinchi to'lov shu yerda ko'rinadi." />
      ) : (
        <div className="card p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[var(--bg-subtle)] text-left text-xs text-muted">
              <tr>
                <th className="px-4 py-3 font-semibold">№</th>
                <th className="px-4 py-3 font-semibold">Foydalanuvchi</th>
                <th className="px-4 py-3 font-semibold">Tarif</th>
                <th className="px-4 py-3 font-semibold">Summa</th>
                <th className="px-4 py-3 font-semibold">Tizim</th>
                <th className="px-4 py-3 font-semibold">Holat</th>
                <th className="px-4 py-3 font-semibold">Sana</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-t border-line align-top">
                  <td className="px-4 py-3 tabular-nums font-semibold">{order.order_number}</td>
                  <td className="px-4 py-3">
                    <p className="font-semibold">{order.profiles?.full_name ?? "Ismsiz"}</p>
                    <p className="text-xs text-muted">{order.profiles?.email}</p>
                  </td>
                  <td className="px-4 py-3">{order.plan_title ?? `${order.months} oylik`}</td>
                  <td className="px-4 py-3 tabular-nums">{formatSum(order.amount)}</td>
                  <td className="px-4 py-3">{PROVIDER_LABEL[order.provider]}</td>
                  <td className="px-4 py-3">
                    <Badge tone={STATUS_META[order.status].tone}>
                      {STATUS_META[order.status].label}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted whitespace-nowrap">
                    {formatDateTime(order.paid_at ?? order.cancelled_at ?? order.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
