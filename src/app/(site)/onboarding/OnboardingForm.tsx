"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";
import { updateProfileAction, type ActionResult } from "@/lib/actions/profile";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { Alert } from "@/components/ui/Card";

export function OnboardingForm({
  defaultName,
  defaultPhone,
  next,
}: {
  defaultName: string;
  defaultPhone: string;
  next: string;
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState<
    ActionResult | null,
    FormData
  >(updateProfileAction, null);

  useEffect(() => {
    if (state?.ok) {
      router.push(next);
      router.refresh();
    }
  }, [state, next, router]);

  return (
    <form action={formAction} className="space-y-4">
      {state && !state.ok ? <Alert tone="danger">{state.message}</Alert> : null}

      <Field label="Ism-familiya" htmlFor="full_name" required>
        <Input
          id="full_name"
          name="full_name"
          defaultValue={defaultName}
          placeholder="Aziz Karimov"
          autoComplete="name"
          required
          minLength={2}
          maxLength={80}
          autoFocus
        />
      </Field>

      <Field
        label="Telefon raqam"
        htmlFor="phone"
        hint="Majburiy emas — kurslarga yozilishda qo'l keladi"
      >
        <Input
          id="phone"
          name="phone"
          type="tel"
          defaultValue={defaultPhone}
          placeholder="+998 90 123 45 67"
          autoComplete="tel"
        />
      </Field>

      <Button type="submit" size="lg" fullWidth disabled={pending}>
        {pending ? "Saqlanmoqda…" : "Davom etish"}
      </Button>
    </form>
  );
}
