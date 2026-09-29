"use server";

import { headers } from "next/headers";
import { createServerSupabase } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth";
import {
  clickCheckoutUrl,
  getClickConfig,
  getPaymeConfig,
  paymeCheckoutUrl,
  type PaymentProvider,
} from "@/lib/payments/config";

export type StartPaymentResult =
  | { ok: true; url: string }
  | { ok: false; message: string };

/** Saytning tashqi manzili (Railway proxy orqasida ham to'g'ri) */
async function siteOrigin(): Promise<string> {
  const h = await headers();
  const first = (value: string | null) => value?.split(",")[0]?.trim() || null;
  const host = first(h.get("x-forwarded-host")) ?? first(h.get("host"));
  if (!host) return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const proto =
    first(h.get("x-forwarded-proto")) ??
    (host.startsWith("localhost") || host.startsWith("127.") ? "http" : "https");
  return `${proto}://${host}`;
}

/**
 * Premium uchun onlayn to'lovni boshlaydi: bazada buyurtma yaratadi
 * (narx serverdagi tarifdan) va Payme / Click to'lov sahifasi havolasini qaytaradi.
 */
export async function startPaymentAction(
  plan: string,
  provider: PaymentProvider,
): Promise<StartPaymentResult> {
  const profile = await getProfile();
  if (!profile) {
    return { ok: false, message: "To'lov qilish uchun avval tizimga kiring." };
  }

  const payme = provider === "payme" ? getPaymeConfig() : null;
  const click = provider === "click" ? getClickConfig() : null;
  if (!payme && !click) {
    return { ok: false, message: "Bu to'lov usuli hozircha ulanmagan." };
  }

  try {
    const supabase = await createServerSupabase();
    const { data, error } = await supabase.rpc("create_payment_order", {
      p_plan: plan,
      p_provider: provider,
    });

    if (error || !data) {
      return {
        ok: false,
        message: error?.message?.includes("Juda ko'p")
          ? "Juda ko'p urinish. Birozdan keyin qayta urinib ko'ring."
          : "Buyurtma yaratib bo'lmadi. Sahifani yangilab, qayta urinib ko'ring.",
      };
    }

    const order = data as { id: string; order_number: number; amount: number };
    const returnUrl = `${await siteOrigin()}/premium/checkout/${order.id}`;

    const url = payme
      ? paymeCheckoutUrl(payme, order.order_number, order.amount, returnUrl)
      : clickCheckoutUrl(click!, order.order_number, order.amount, returnUrl);

    return { ok: true, url };
  } catch {
    return { ok: false, message: "Xatolik yuz berdi. Qayta urinib ko'ring." };
  }
}
