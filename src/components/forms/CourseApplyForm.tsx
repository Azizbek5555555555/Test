"use client";

import { useActionState } from "react";
import { applyToCourseAction, type ActionResult } from "@/lib/actions/forms";
import { Button } from "@/components/ui/Button";
import { Field, Input, Textarea } from "@/components/ui/Field";
import { Alert } from "@/components/ui/Card";

export function CourseApplyForm({
  courseId,
  courseTitle,
  defaultName,
  defaultPhone,
}: {
  courseId: string;
  courseTitle: string;
  defaultName?: string | null;
  defaultPhone?: string | null;
}) {
  const [state, formAction, pending] = useActionState<
    ActionResult | null,
    FormData
  >(applyToCourseAction, null);

  if (state?.ok) {
    return (
      <Alert tone="success" title="Ariza qabul qilindi 🎉">
        {state.message} <br />
        <span className="text-xs opacity-80">Kurs: {courseTitle}</span>
      </Alert>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      {state && !state.ok ? <Alert tone="danger">{state.message}</Alert> : null}

      <input type="hidden" name="course_id" value={courseId} />

      <Field label="Ism-familiya" htmlFor="apply-name" required>
        <Input
          id="apply-name"
          name="full_name"
          defaultValue={defaultName ?? ""}
          placeholder="Aziz Karimov"
          autoComplete="name"
          required
          minLength={2}
          maxLength={120}
        />
      </Field>

      <Field label="Telefon raqam" htmlFor="apply-phone" required>
        <Input
          id="apply-phone"
          name="phone"
          type="tel"
          defaultValue={defaultPhone ?? ""}
          placeholder="+998 90 123 45 67"
          autoComplete="tel"
          required
        />
      </Field>

      <Field
        label="Qo'shimcha izoh"
        htmlFor="apply-note"
        hint="Darajangiz, qulay vaqtingiz yoki savolingiz"
      >
        <Textarea
          id="apply-note"
          name="note"
          placeholder="Masalan: hozir B1 darajadaman, kechki guruh qulay."
          maxLength={1000}
        />
      </Field>

      <Button type="submit" size="lg" fullWidth disabled={pending}>
        {pending ? "Yuborilmoqda…" : "Ro'yxatdan o'tish"}
      </Button>

      <p className="text-xs text-muted text-center">
        Arizangizni qabul qilgach, administrator siz bilan telefon orqali
        bog&apos;lanadi.
      </p>
    </form>
  );
}
