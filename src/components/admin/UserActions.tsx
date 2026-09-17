"use client";

import { useActionState, useState } from "react";
import { setPremiumAction, setRoleAction } from "@/lib/actions/admin";
import type { ActionResult } from "@/lib/actions/profile";
import type { UserRole } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Field";

export function PremiumControl({
  userId,
  isPremium,
}: {
  userId: string;
  isPremium: boolean;
}) {
  const [months, setMonths] = useState("3");
  const [state, formAction, pending] = useActionState<
    ActionResult | null,
    FormData
  >(setPremiumAction, null);

  return (
    <div className="space-y-1.5">
      <form action={formAction} className="flex flex-wrap items-center gap-1.5">
        <input type="hidden" name="user_id" value={userId} />
        <input type="hidden" name="enable" value="true" />
        <input type="hidden" name="months" value={months} />

        <Select
          value={months}
          onChange={(e) => setMonths(e.target.value)}
          className="w-24 py-1.5 text-xs"
          aria-label="Premium muddati"
        >
          <option value="1">1 oy</option>
          <option value="3">3 oy</option>
          <option value="6">6 oy</option>
          <option value="12">12 oy</option>
          <option value="0">Muddatsiz</option>
        </Select>

        <Button type="submit" size="sm" variant="premium" disabled={pending}>
          {isPremium ? "Uzaytirish" : "Premium berish"}
        </Button>
      </form>

      {isPremium ? (
        <form action={formAction}>
          <input type="hidden" name="user_id" value={userId} />
          <input type="hidden" name="enable" value="false" />
          <input type="hidden" name="months" value="0" />
          <button
            type="submit"
            disabled={pending}
            className="text-xs font-semibold text-rose-600 dark:text-rose-400 hover:underline disabled:opacity-50"
          >
            Premiumni o&apos;chirish
          </button>
        </form>
      ) : null}

      {state ? (
        <p
          className={`text-xs ${
            state.ok
              ? "text-emerald-600 dark:text-emerald-400"
              : "text-rose-600 dark:text-rose-400"
          }`}
        >
          {state.message}
        </p>
      ) : null}
    </div>
  );
}

export function RoleControl({
  userId,
  role,
}: {
  userId: string;
  role: UserRole;
}) {
  const [value, setValue] = useState<UserRole>(role);
  const [state, formAction, pending] = useActionState<
    ActionResult | null,
    FormData
  >(setRoleAction, null);

  return (
    <div className="space-y-1.5">
      <form action={formAction} className="flex items-center gap-1.5">
        <input type="hidden" name="user_id" value={userId} />
        <input type="hidden" name="role" value={value} />

        <Select
          value={value}
          onChange={(e) => setValue(e.target.value as UserRole)}
          className="w-28 py-1.5 text-xs"
          aria-label="Rol"
        >
          <option value="student">Student</option>
          <option value="teacher">O&apos;qituvchi</option>
          <option value="admin">Admin</option>
        </Select>

        <Button
          type="submit"
          size="sm"
          variant="secondary"
          disabled={pending || value === role}
        >
          Saqlash
        </Button>
      </form>

      {state ? (
        <p
          className={`text-xs ${
            state.ok
              ? "text-emerald-600 dark:text-emerald-400"
              : "text-rose-600 dark:text-rose-400"
          }`}
        >
          {state.message}
        </p>
      ) : null}
    </div>
  );
}
