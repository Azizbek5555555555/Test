"use client";

import { useActionState } from "react";
import { reviewPremiumRequestAction } from "@/lib/actions/admin";
import type { ActionResult } from "@/lib/actions/profile";
import { Button } from "@/components/ui/Button";

export function PremiumRequestActions({
  requestId,
  userId,
  months,
}: {
  requestId: string;
  userId: string;
  months: number;
}) {
  const [state, formAction, pending] = useActionState<
    ActionResult | null,
    FormData
  >(reviewPremiumRequestAction, null);

  if (state?.ok) {
    return (
      <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
        ✅ {state.message}
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <form action={formAction}>
          <input type="hidden" name="request_id" value={requestId} />
          <input type="hidden" name="user_id" value={userId} />
          <input type="hidden" name="months" value={months} />
          <input type="hidden" name="decision" value="approve" />
          <Button type="submit" size="sm" variant="premium" disabled={pending}>
            {pending ? "…" : `✅ Tasdiqlash (${months} oy)`}
          </Button>
        </form>

        <form action={formAction}>
          <input type="hidden" name="request_id" value={requestId} />
          <input type="hidden" name="user_id" value={userId} />
          <input type="hidden" name="months" value={months} />
          <input type="hidden" name="decision" value="reject" />
          <Button type="submit" size="sm" variant="secondary" disabled={pending}>
            Rad etish
          </Button>
        </form>
      </div>

      {state && !state.ok ? (
        <p className="text-xs text-rose-600 dark:text-rose-400">
          {state.message}
        </p>
      ) : null}
    </div>
  );
}
