"use client";

import { useT } from "@/i18n/client";
import { useState, useTransition } from "react";
import type { PremiumPlan } from "@/lib/types";
import { startPaymentAction } from "@/lib/actions/payments";
import { Alert } from "@/components/ui/Card";
import { cn } from "@/lib/format";
import { PlanOptions } from "./PlanOptions";

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
  initialPlan,
}: {
  plans: PremiumPlan[];
  providers: Provider[];
  initialPlan?: string;
}) {
  const t = useT();
  const [selected, setSelected] = useState(
    plans.find((p) => p.id === initialPlan)?.id ?? plans.find((p) => p.popular)?.id ?? plans[0]?.id ?? "",
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

      <PlanOptions plans={plans} selected={plan?.id ?? ""} onSelect={setSelected} disabled={busy !== null} />

      <div className="grid sm:grid-cols-2 gap-3">
        {providers.map((provider) => (
          <button
            key={provider}
            type="button"
            onClick={() => pay(provider)}
            disabled={busy !== null || !plan}
            className={cn(
              "inline-flex items-center justify-center gap-2 rounded-full px-5 py-3.5",
              "text-[15px] font-semibold shadow-sm transition-all active:scale-[0.98]",
              "disabled:opacity-60 disabled:pointer-events-none",
              PROVIDERS[provider].className,
            )}
          >
            {busy === provider
              ? t("To'lov sahifasi ochilmoqda…", "Opening the payment page…")
              : t(`${PROVIDERS[provider].label} orqali to'lash`, `Pay with ${PROVIDERS[provider].label}`)}
          </button>
        ))}
      </div>

      <p className="text-xs text-muted leading-relaxed">
        {t(
          "Uzcard va Humo kartalari qabul qilinadi. To'lov o'tishi bilan Premium avtomatik yoqiladi — chek yuborish shart emas.",
          "Uzcard and Humo cards are accepted. Premium turns on automatically once the payment goes through — no need to send a receipt.",
        )}
      </p>
    </div>
  );
}
