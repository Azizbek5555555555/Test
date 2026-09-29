"use client";

import { useState, useTransition } from "react";
import type { PremiumPlan } from "@/lib/types";
import { startPaymentAction } from "@/lib/actions/payments";
import { Alert } from "@/components/ui/Card";
import { cn, formatSum } from "@/lib/format";

type Provider = "payme" | "click";

const PROVIDERS: Record<Provider, { label: string; className: string }> = {
  payme: {
    label: "Payme",
    className: "bg-[#00b8c2] hover:bg-[#00a3ac] text-white",
  },
  click: {
    label: "Click",
    className: "bg-[#0068ff] hover:bg-[#005ae0] text-white",
  },
};

/**
 * Premium tarifini tanlash va Payme / Click orqali onlayn to'lash.
 * To'lov o'tishi bilan Premium avtomatik yoqiladi.
 */
export function OnlinePayment({
  plans,
  providers,
}: {
  plans: PremiumPlan[];
  providers: Provider[];
}) {
  const [selected, setSelected] = useState(
    plans.find((p) => p.popular)?.id ?? plans[0]?.id ?? "",
  );
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<Provider | null>(null);
  const [, startTransition] = useTransition();

  const plan = plans.find((p) => p.id === selected) ?? plans[0];

  function pay(provider: Provider) {
    if (!plan) return;
    setError(null);
    setBusy(provider);
    startTransition(async () => {
      const result = await startPaymentAction(plan.id, provider);
      if (result.ok) {
        window.location.href = result.url;
        return; // sahifa almashguncha tugma "kutilmoqda" holatida qoladi
      }
      setError(result.message);
      setBusy(null);
    });
  }

  return (
    <div className="space-y-5">
      {error ? <Alert tone="danger">{error}</Alert> : null}

      <div className="grid sm:grid-cols-3 gap-3">
        {plans.map((item) => {
          const active = item.id === selected;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setSelected(item.id)}
              disabled={busy !== null}
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
              {item.note ? <p className="text-xs text-muted mt-1.5">{item.note}</p> : null}
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

      <div className="grid sm:grid-cols-2 gap-3">
        {providers.map((provider) => (
          <button
            key={provider}
            type="button"
            onClick={() => pay(provider)}
            disabled={busy !== null || !plan}
            className={cn(
              "inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3.5",
              "text-base font-extrabold shadow-sm transition-all active:scale-[0.98]",
              "disabled:opacity-60 disabled:pointer-events-none",
              PROVIDERS[provider].className,
            )}
          >
            {busy === provider
              ? "To'lov sahifasi ochilmoqda…"
              : `${PROVIDERS[provider].label} orqali to'lash`}
          </button>
        ))}
      </div>

      <p className="text-xs text-muted leading-relaxed">
        💳 Uzcard va Humo kartalari qabul qilinadi. To&apos;lov o&apos;tishi bilan
        Premium <strong>avtomatik</strong> yoqiladi — chek yuborish shart emas.
      </p>
    </div>
  );
}
