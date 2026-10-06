import type { T } from "@/i18n";
import type { PremiumPlan } from "./types";

/** Tarifdagi o'qituvchi tekshiruvlari soni (Writing/Speaking bo'lgan Full Mock'lar) */
export function planReviews(plan: Pick<PremiumPlan, "reviews"> | null | undefined): number {
  const n = Number(plan?.reviews ?? 0);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
}

/** "1 ta Full Mock — o'qituvchi tekshiruvi bilan" / "O'qituvchi tekshiruvisiz" */
export function reviewsLabel(count: number, t: T): string {
  if (count <= 0) return t("O'qituvchi tekshiruvisiz", "No teacher review");
  return t(
    `${count} ta Full Mock — o'qituvchi tekshiruvi va izohi bilan`,
    `${count} Full Mock${count > 1 ? "s" : ""} reviewed by a teacher, with feedback`,
  );
}

/** Oyiga to'g'ri keladigan narx (yaxlitlangan) */
export function perMonth(plan: Pick<PremiumPlan, "amount" | "months">): number {
  return Math.round(plan.amount / Math.max(1, plan.months) / 100) * 100;
}
