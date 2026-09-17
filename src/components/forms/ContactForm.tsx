"use client";

import { useActionState } from "react";
import {
  sendContactMessageAction,
  type ActionResult,
} from "@/lib/actions/forms";
import { Button } from "@/components/ui/Button";
import { Field, Input, Textarea } from "@/components/ui/Field";
import { Alert } from "@/components/ui/Card";

export function ContactForm({
  defaultName,
  defaultEmail,
  defaultPhone,
}: {
  defaultName?: string | null;
  defaultEmail?: string | null;
  defaultPhone?: string | null;
}) {
  const [state, formAction, pending] = useActionState<
    ActionResult | null,
    FormData
  >(sendContactMessageAction, null);

  if (state?.ok) {
    return (
      <Alert tone="success" title="Xabar yuborildi ✅">
        {state.message}
      </Alert>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      {state && !state.ok ? <Alert tone="danger">{state.message}</Alert> : null}

      <Field label="Ismingiz" htmlFor="contact-name" required>
        <Input
          id="contact-name"
          name="name"
          defaultValue={defaultName ?? ""}
          placeholder="Aziz Karimov"
          autoComplete="name"
          required
          minLength={2}
        />
      </Field>

      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Email" htmlFor="contact-email">
          <Input
            id="contact-email"
            name="email"
            type="email"
            defaultValue={defaultEmail ?? ""}
            placeholder="siz@example.com"
            autoComplete="email"
          />
        </Field>

        <Field label="Telefon" htmlFor="contact-phone">
          <Input
            id="contact-phone"
            name="phone"
            type="tel"
            defaultValue={defaultPhone ?? ""}
            placeholder="+998 90 123 45 67"
            autoComplete="tel"
          />
        </Field>
      </div>

      <Field label="Xabaringiz" htmlFor="contact-message" required>
        <Textarea
          id="contact-message"
          name="message"
          placeholder="Savolingizni yoki taklifingizni yozing…"
          required
          minLength={10}
          maxLength={3000}
          className="min-h-36"
        />
      </Field>

      <Button type="submit" size="lg" fullWidth disabled={pending}>
        {pending ? "Yuborilmoqda…" : "Xabarni yuborish"}
      </Button>
    </form>
  );
}
