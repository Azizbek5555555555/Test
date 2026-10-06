"use client";

import { useT } from "@/i18n/client";
import type { PremiumPlan } from "@/lib/types";
import { cn, formatSum } from "@/lib/format";
import { perMonth, planReviews, reviewsLabel } from "@/lib/premium";

/** Tarif tanlash tugmalari — onlayn to'lov va karta orqali so'rovda bir xil */
export function PlanOptions({
  plans,
  selected,
  onSelect,
  disabled,
}: {
  plans: PremiumPlan[];
  selected: string;
  onSelect: (id: string) => void;
  disabled?: boolean;
}) {
  const t = useT();
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {plans.map((item) => {
        const active = item.id === selected;
        const reviews = planReviews(item);
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelect(item.id)}
            disabled={disabled}
            aria-pressed={active}
            className={cn(
              "relative rounded-xl border-[1.5px] p-4 text-left transition-all",
              active ? "border-gold-400 bg-gold-400/10" : "border-line bg-ink-900 hover:border-gold-400/50",
            )}
          >
            {item.popular ? (
              <span className="absolute -top-2.5 left-4 rounded-full bg-gold-400 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-on-accent">
                {t("Ommabop", "Popular")}
              </span>
            ) : null}
            <p className="font-display text-xl text-fg">
              {t(item.title, `${item.months} ${item.months === 1 ? "month" : "months"}`)}
            </p>
            <p className="mt-1 text-lg font-semibold tabular-nums text-gold-400">{formatSum(item.amount, t.locale)}</p>
            {item.months > 1 ? (
              <p className="text-[11px] tabular-nums text-faint">
                ≈ {formatSum(perMonth(item), t.locale)} / {t("oy", "month")}
              </p>
            ) : null}
            <p className={cn("mt-2 text-xs leading-snug", reviews > 0 ? "text-fg" : "text-muted")}>
              {reviews > 0 ? "✍️ " : ""}
              {reviewsLabel(reviews, t)}
            </p>
            {item.note ? <p className="mt-1.5 text-xs text-muted">{item.note}</p> : null}
            <span
              className={cn(
                "absolute right-4 top-4 grid h-5 w-5 place-items-center rounded-full border-2",
                active ? "border-gold-400 bg-gold-400 text-xs text-on-accent" : "border-ink-600",
              )}
              aria-hidden
            >
              {active ? "✓" : ""}
            </span>
          </button>
        );
      })}
    </div>
  );
}
