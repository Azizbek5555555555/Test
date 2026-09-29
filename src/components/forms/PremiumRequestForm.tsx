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
                "relative rounded-xl border-[1.5px] p-4 text-left transition-all",
                active
                  ? "border-gold-400 bg-gold-400/10"
                  : "border-line bg-ink-900 hover:border-gold-400/50",
              )}
            >
              {item.popular ? (
                <span
                  className="absolute -top-2.5 left-4 rounded-full bg-gold-400 px-2 py-0.5
                             text-[10px] font-bold uppercase tracking-wide text-ink-950"
                >
                  Ommabop
                </span>
              ) : null}

              <p className="font-display text-xl text-fg">{item.title}</p>
              <p className="mt-1 text-lg font-semibold tabular-nums text-gold-400">
                {formatSum(item.amount)}
              </p>
              {item.note ? (
                <p className="text-xs text-muted mt-1.5">{item.note}</p>
              ) : null}

              <span
                className={cn(
                  "absolute top-4 right-4 grid h-5 w-5 place-items-center rounded-full border-2",
                  active
                    ? "border-gold-400 bg-gold-400 text-xs text-ink-950"
                    : "border-ink-600",
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
