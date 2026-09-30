import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import { createServerSupabase } from "@/lib/supabase/server";
import { formatDate, formatDateTime, formatSum } from "@/lib/format";
import { Alert } from "@/components/ui/Card";
import { ButtonLink } from "@/components/ui/Button";
import { AutoRefresh } from "@/components/forms/AutoRefresh";
import { getT } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return {
    title: t("To'lov holati", "Payment status"),
    robots: { index: false, follow: false },
  };
}

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
  const t = await getT();

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
            ? t("Premium faollashdi!", "Premium is active!")
            : order.status === "cancelled"
              ? t("To'lov amalga oshmadi", "Payment failed")
              : t("To'lov tasdiqlanmoqda…", "Confirming payment…")}
        </h1>

        <p className="text-sm text-muted mt-2 leading-relaxed">
          {order.status === "paid"
            ? profile.premium_until
              ? t(
                  `Premium ${formatDate(profile.premium_until)} gacha amal qiladi. Rahmat!`,
                  `Premium is valid until ${formatDate(profile.premium_until, "en")}. Thank you!`,
                )
              : t("Barcha Premium imkoniyatlar siz uchun ochiq. Rahmat!", "All Premium features are open to you. Thank you!")
            : order.status === "cancelled"
              ? t(
                  "To'lov bekor qilindi yoki o'tmadi. Kartangizdan pul yechilgan bo'lsa, u avtomatik qaytariladi.",
                  "The payment was cancelled or did not go through. If money was taken from your card, it will be refunded automatically.",
                )
              : t(
                  `${PROVIDER_LABEL[order.provider]} to'lovni tasdiqlashini kutyapmiz. Bu odatda bir necha soniya davom etadi — sahifa o'zi yangilanadi.`,
                  `Waiting for ${PROVIDER_LABEL[order.provider]} to confirm the payment. This usually takes a few seconds — the page refreshes on its own.`,
                )}
        </p>

        <dl className="mt-6 rounded-xl bg-[var(--bg-subtle)] border border-line p-4 text-sm text-left space-y-2">
          <div className="flex justify-between gap-3">
            <dt className="text-muted">{t("Buyurtma", "Order")}</dt>
            <dd className="font-semibold tabular-nums">№ {order.order_number}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted">{t("Tarif", "Plan")}</dt>
            <dd className="font-semibold">{order.plan_title ?? t(`${order.months} oylik`, `${order.months}-month`)}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted">{t("Summa", "Amount")}</dt>
            <dd className="font-semibold tabular-nums">{formatSum(order.amount, t.locale)}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted">{t("To'lov tizimi", "Payment system")}</dt>
            <dd className="font-semibold">{PROVIDER_LABEL[order.provider]}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted">{t("Sana", "Date")}</dt>
            <dd className="font-semibold">{formatDateTime(order.paid_at ?? order.created_at, t.locale)}</dd>
          </div>
        </dl>

        {order.status === "pending" ? (
          <div className="mt-5 text-left">
            <Alert tone="info">
              {t(
                "To'lov sahifasida to'lovni yakunlamagan bo'lsangiz, Premium sahifasiga qaytib, qaytadan urinib ko'ring.",
                "If you did not complete the payment on the payment page, go back to the Premium page and try again.",
              )}
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
                {t("Full Mock testlar", "Full Mock tests")}
              </ButtonLink>
            </>
          ) : (
            <ButtonLink href="/premium" variant={order.status === "cancelled" ? "primary" : "secondary"}>
              {order.status === "cancelled" ? t("Qayta urinib ko'rish", "Try again") : t("Premium sahifasiga qaytish", "Back to Premium")}
            </ButtonLink>
          )}
        </div>
      </div>
    </div>
  );
}
