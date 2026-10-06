import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getProfile, isAdmin } from "@/lib/auth";
import { listPaymentOrders } from "@/lib/admin-queries";
import { getEnabledProviders } from "@/lib/payments/config";
import Link from "next/link";
import { cn, formatDateTime, formatSum } from "@/lib/format";
import { getPaymentStatsFor, parseRange, RANGES } from "@/lib/admin-stats";
import { Delta, Donut, METHOD_COLOR } from "@/components/admin/charts";
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

export default async function AdminPaymentsPage({ searchParams }: { searchParams: Promise<{ range?: string }> }) {
  const me = await getProfile();
  if (!isAdmin(me)) redirect("/admin");

  const rangeKey = parseRange((await searchParams).range);
  const [orders, providers, stats] = await Promise.all([
    listPaymentOrders(),
    Promise.resolve(getEnabledProviders()),
    getPaymentStatsFor(rangeKey),
  ]);
  const topMethod = stats ? [...stats.methods].sort((a, b) => b.count - a.count || b.amount - a.amount)[0] : null;

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

      {/* ------------------------------------------------ To'lov usullari statistikasi */}
      {stats ? (
        <section className="ag">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="ag-title">Qaysi usul bilan ko&apos;p to&apos;lanmoqda?</p>
              <p className="ag-sub">Payme, Click va karta o&apos;tkazmasi (tasdiqlangan Premium so&apos;rovlar)</p>
            </div>
            <nav className="flex flex-wrap gap-1.5" aria-label="Davr">
              {RANGES.map((r) => (
                <Link
                  key={r.key}
                  href={r.key === "30" ? "/admin/payments" : `/admin/payments?range=${r.key}`}
                  scroll={false}
                  className={cn("ag-pillbtn", r.key === rangeKey && "is-active")}
                >
                  {r.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="mt-5 grid items-center gap-6 md:grid-cols-[auto_1fr]">
            <Donut size={190} segments={stats.methods.map((m) => ({ label: m.label, value: m.amount, color: METHOD_COLOR[m.key] }))}>
              <span className="px-6 text-[16px] font-light leading-tight tabular-nums">{formatSum(stats.amount)}</span>
              <span className="text-[11px] text-faint">{stats.count} ta to&apos;lov</span>
            </Donut>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[11px] uppercase tracking-[0.1em] text-faint">
                    <th className="py-2 font-semibold">Usul</th>
                    <th className="py-2 text-right font-semibold">Soni</th>
                    <th className="py-2 text-right font-semibold">Summa</th>
                    <th className="py-2 text-right font-semibold">Ulushi</th>
                    <th className="py-2 text-right font-semibold">O&apos;rtacha chek</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.methods.map((m) => (
                    <tr key={m.key} className="border-t border-hi/5">
                      <td className="py-3">
                        <span className="inline-flex items-center gap-2">
                          <i className="h-2.5 w-2.5 rounded-full" style={{ background: METHOD_COLOR[m.key] }} />
                          {m.label}
                          {topMethod && topMethod.key === m.key && m.count > 0 ? <span className="ad-chip ad-chip-up">eng ko&apos;p</span> : null}
                        </span>
                      </td>
                      <td className="py-3 text-right tabular-nums">{m.count}</td>
                      <td className="py-3 text-right tabular-nums">{formatSum(m.amount)}</td>
                      <td className="py-3 text-right tabular-nums">{stats.amount > 0 ? Math.round((m.amount / stats.amount) * 100) : 0}%</td>
                      <td className="py-3 text-right tabular-nums">{m.count > 0 ? formatSum(Math.round(m.amount / m.count)) : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="mt-3 flex items-center gap-2 text-[12px] text-faint">
                O&apos;tgan shunday davrga nisbatan: <Delta value={stats.amount} prev={stats.prevAmount} />
              </p>
            </div>
          </div>
        </section>
      ) : null}

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
