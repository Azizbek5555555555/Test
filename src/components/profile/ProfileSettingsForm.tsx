"use client";

import { useActionState } from "react";
import { updateProfileAction, type ActionResult } from "@/lib/actions/profile";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { Alert } from "@/components/ui/Card";

export function ProfileSettingsForm({
  defaultName,
  defaultPhone,
}: {
  defaultName: string;
  defaultPhone: string;
}) {
  const [state, formAction, pending] = useActionState<
    ActionResult | null,
    FormData
  >(updateProfileAction, null);

  return (
    <form action={formAction} className="space-y-4">
      {state ? (
        <Alert tone={state.ok ? "success" : "danger"}>{state.message}</Alert>
      ) : null}

      <Field label="Ism-familiya" htmlFor="settings-name" required>
        <Input
          id="settings-name"
          name="full_name"
          defaultValue={defaultName}
          placeholder="Aziz Karimov"
          autoComplete="name"
          required
          minLength={2}
          maxLength={80}
        />
      </Field>

      <Field
        label="Telefon raqam"
        htmlFor="settings-phone"
        hint="Kurslarga yozilishda avtomatik to'ldiriladi"
      >
        <Input
          id="settings-phone"
          name="phone"
          type="tel"
          defaultValue={defaultPhone}
          placeholder="+998 90 123 45 67"
          autoComplete="tel"
        />
      </Field>

      <Button type="submit" disabled={pending}>
        {pending ? "Saqlanmoqda…" : "Saqlash"}
      </Button>
    </form>
  );
}
