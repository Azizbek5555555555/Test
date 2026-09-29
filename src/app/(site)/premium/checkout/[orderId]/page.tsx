import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import { createServerSupabase } from "@/lib/supabase/server";
import { formatDate, formatDateTime, formatSum } from "@/lib/format";
import { Alert } from "@/components/ui/Card";
import { ButtonLink } from "@/components/ui/Button";
import { AutoRefresh } from "@/components/forms/AutoRefresh";

export const metadata: Metadata = {
  title: "To'lov holati",
  robots: { index: false, follow: false },
};

interface Order {
  id: string;
  order_number: number;
  plan_title: string | null;
  months: number;
  amount: number;
  provider: "payme" | "click";
  status: "pending" | "paid" | "cancelled";
  created_at: string;
  paid_at: string | null;
}

const PROVIDER_LABEL = { payme: "Payme", click: "Click" } as const;

/**
 * Payme / Click to'lov sahifasidan qaytilgan joy. To'lov tasdig'i to'lov
 * tizimining serveridan alohida keladi — shuning uchun holat kutilayotgan
 * bo'lsa, sahifa o'zi bir necha soniyada yangilanib turadi.
 */
export default async function CheckoutStatusPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;
  const profile = await requireProfile(`/premium/checkout/${orderId}`);

  if (!/^[0-9a-f-]{36}$/i.test(orderId)) notFound();

  const supabase = await createServerSupabase();
  const { data } = await supabase
    .from("payment_orders")
    .select("id, order_number, plan_title, months, amount, provider, status, created_at, paid_at")
    .eq("id", orderId)
    .maybeSingle();

  const order = data as Order | null;
  if (!order) notFound();

  return (
    <div className="container-page py-12 max-w-xl">
      {order.status === "pending" ? <AutoRefresh seconds={3} times={60} /> : null}

      <div className="card p-6 sm:p-8 text-center">
        <div className="text-5xl mb-4" aria-hidden>
          {order.status === "paid" ? "🎉" : order.status === "cancelled" ? "⚠️" : "⏳"}
        </div>

        <h1 className="text-2xl font-extrabold">
          {order.status === "paid"
            ? "Premium faollashdi!"
            : order.status === "cancelled"
              ? "To'lov amalga oshmadi"
              : "To'lov tasdiqlanmoqda…"}
        </h1>

        <p className="text-sm text-muted mt-2 leading-relaxed">
          {order.status === "paid"
            ? profile.premium_until
              ? `Premium ${formatDate(profile.premium_until)} gacha amal qiladi. Rahmat!`
              : "Barcha Premium imkoniyatlar siz uchun ochiq. Rahmat!"
            : order.status === "cancelled"
              ? "To'lov bekor qilindi yoki o'tmadi. Kartangizdan pul yechilgan bo'lsa, u avtomatik qaytariladi."
              : `${PROVIDER_LABEL[order.provider]} to'lovni tasdiqlashini kutyapmiz. Bu odatda bir necha soniya davom etadi — sahifa o'zi yangilanadi.`}
        </p>

        <dl className="mt-6 rounded-xl bg-[var(--bg-subtle)] border border-line p-4 text-sm text-left space-y-2">
          <div className="flex justify-between gap-3">
            <dt className="text-muted">Buyurtma</dt>
            <dd className="font-semibold tabular-nums">№ {order.order_number}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted">Tarif</dt>
            <dd className="font-semibold">{order.plan_title ?? `${order.months} oylik`}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted">Summa</dt>
            <dd className="font-semibold tabular-nums">{formatSum(order.amount)}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted">To&apos;lov tizimi</dt>
            <dd className="font-semibold">{PROVIDER_LABEL[order.provider]}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted">Sana</dt>
            <dd className="font-semibold">{formatDateTime(order.paid_at ?? order.created_at)}</dd>
          </div>
        </dl>

        {order.status === "pending" ? (
          <div className="mt-5 text-left">
            <Alert tone="info">
              To&apos;lov sahifasida to&apos;lovni yakunlamagan bo&apos;lsangiz,
              Premium sahifasiga qaytib, qaytadan urinib ko&apos;ring.
            </Alert>
          </div>
        ) : null}

        <div className="mt-6 flex flex-wrap justify-center gap-3">
          {order.status === "paid" ? (
            <>
              <ButtonLink href="/exam-checking" variant="premium">
                🎯 Exam Full Checking
              </ButtonLink>
              <ButtonLink href="/full-mock" variant="secondary">
                Full Mock testlar
              </ButtonLink>
            </>
          ) : (
            <ButtonLink href="/premium" variant={order.status === "cancelled" ? "primary" : "secondary"}>
              {order.status === "cancelled" ? "Qayta urinib ko'rish" : "Premium sahifasiga qaytish"}
            </ButtonLink>
          )}
        </div>
      </div>
    </div>
  );
}
