"use client";

import { useT } from "@/i18n/client";
import { useActionState, useState } from "react";
import { requestPremiumAction, type ActionResult } from "@/lib/actions/forms";
import type { PremiumPlan } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Field";
import { Alert } from "@/components/ui/Card";
import { PlanOptions } from "./PlanOptions";

export function PremiumRequestForm({
  plans,
  hasPending,
  initialPlan,
}: {
  plans: PremiumPlan[];
  hasPending: boolean;
  initialPlan?: string;
}) {
  const t = useT();
  const [selected, setSelected] = useState(
    plans.find((p) => p.id === initialPlan)?.id ?? plans.find((p) => p.popular)?.id ?? plans[0]?.id ?? "",
  );
  const [state, formAction, pending] = useActionState<
    ActionResult | null,
    FormData
  >(requestPremiumAction, null);

  const plan = plans.find((p) => p.id === selected) ?? plans[0];

  if (hasPending && !state) {
    return (
      <Alert tone="info" title={t("So'rovingiz ko'rib chiqilmoqda", "Your request is being reviewed")}>
        {t(
          "Siz allaqachon Premium so'rovi yuborgansiz. To'lovni amalga oshirib, chekni Telegram orqali yuboring — admin tasdiqlagach Premium darhol faollashadi.",
          "You have already sent a Premium request. Make the payment and send the receipt via Telegram — Premium activates as soon as an admin approves it.",
        )}
      </Alert>
    );
  }

  return (
    <form action={formAction} className="space-y-5">
      {state ? (
        <Alert tone={state.ok ? "success" : "danger"}>{state.message}</Alert>
      ) : null}

      <PlanOptions plans={plans} selected={plan?.id ?? ""} onSelect={setSelected} />

      <input type="hidden" name="plan" value={plan?.id ?? ""} />

      <div>
        <label htmlFor="premium-note" className="block text-sm font-semibold mb-1.5">
          {t("Izoh", "Note")} <span className="text-muted font-normal">({t("ixtiyoriy", "optional")})</span>
        </label>
        <Textarea
          id="premium-note"
          name="note"
          placeholder={t(
            "Masalan: to'lovni Payme orqali qildim, chekni Telegramga yubordim.",
            "E.g. I paid via Payme and sent the receipt on Telegram.",
          )}
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
          ? t("Yuborilmoqda…", "Sending…")
          : state?.ok
            ? t("✅ So'rov yuborildi", "✅ Request sent")
            : t(
                `⭐ ${plan?.title ?? ""} Premium so'rovini yuborish`,
                `⭐ Send ${plan ? `${plan.months}-month` : ""} Premium request`,
              )}
      </Button>
    </form>
  );
}
