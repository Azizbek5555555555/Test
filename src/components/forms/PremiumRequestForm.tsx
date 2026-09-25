"use client";

import { useActionState, useState } from "react";
import { requestPremiumAction, type ActionResult } from "@/lib/actions/forms";
import type { PremiumPlan } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Field";
import { Alert } from "@/components/ui/Card";
import { cn, formatSum } from "@/lib/format";

export function PremiumRequestForm({
  plans,
  hasPending,
}: {
  plans: PremiumPlan[];
  hasPending: boolean;
}) {
  const [selected, setSelected] = useState(
    plans.find((p) => p.popular)?.id ?? plans[0]?.id ?? "",
  );
  const [state, formAction, pending] = useActionState<
    ActionResult | null,
    FormData
  >(requestPremiumAction, null);

  const plan = plans.find((p) => p.id === selected) ?? plans[0];

  if (hasPending && !state) {
    return (
      <Alert tone="info" title="So'rovingiz ko'rib chiqilmoqda">
        Siz allaqachon Premium so&apos;rovi yuborgansiz. To&apos;lovni amalga
        oshirib, chekni Telegram orqali yuboring — admin tasdiqlagach Premium
        darhol faollashadi.
      </Alert>
    );
  }

  return (
    <form action={formAction} className="space-y-5">
      {state ? (
        <Alert tone={state.ok ? "success" : "danger"}>{state.message}</Alert>
      ) : null}

      <div className="grid sm:grid-cols-3 gap-3">
        {plans.map((item) => {
          const active = item.id === selected;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setSelected(item.id)}
              className={cn(
                "relative rounded-2xl border-2 p-4 text-left transition-all",
                active
                  ? "border-gold-500 bg-gold-50 dark:bg-gold-950/30"
                  : "border-line hover:border-gold-300",
              )}
            >
              {item.popular ? (
                <span
                  className="absolute -top-2.5 left-4 rounded-full bg-gold-500 px-2 py-0.5
                             text-[10px] font-extrabold text-gold-950 uppercase tracking-wide"
                >
                  Ommabop
                </span>
              ) : null}

              <p className="font-extrabold text-lg">{item.title}</p>
              <p className="text-xl font-extrabold tabular-nums mt-1">
                {formatSum(item.amount)}
              </p>
              {item.note ? (
                <p className="text-xs text-muted mt-1.5">{item.note}</p>
              ) : null}

              <span
                className={cn(
                  "absolute top-4 right-4 w-5 h-5 rounded-full border-2 grid place-items-center",
                  active
                    ? "border-gold-500 bg-gold-500 text-white text-xs"
                    : "border-ink-300 dark:border-ink-600",
                )}
                aria-hidden
              >
                {active ? "✓" : ""}
              </span>
            </button>
          );
        })}
      </div>

      <input type="hidden" name="plan" value={plan?.id ?? ""} />

      <div>
        <label htmlFor="premium-note" className="block text-sm font-semibold mb-1.5">
          Izoh <span className="text-muted font-normal">(ixtiyoriy)</span>
        </label>
        <Textarea
          id="premium-note"
          name="note"
          placeholder="Masalan: to'lovni Payme orqali qildim, chekni Telegramga yubordim."
          className="min-h-20"
          maxLength={500}
        />
      </div>

      <Button
        type="submit"
        variant="premium"
        size="lg"
        fullWidth
        disabled={pending || state?.ok}
      >
        {pending
          ? "Yuborilmoqda…"
          : state?.ok
            ? "✅ So'rov yuborildi"
            : `⭐ ${plan?.title ?? ""} Premium so'rovini yuborish`}
      </Button>
    </form>
  );
}
