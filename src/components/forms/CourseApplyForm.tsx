"use client";

import { useT } from "@/i18n/client";
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
  const t = useT();
  const [state, formAction, pending] = useActionState<
    ActionResult | null,
    FormData
  >(applyToCourseAction, null);

  if (state?.ok) {
    return (
      <Alert tone="success" title={t("Ariza qabul qilindi 🎉", "Application received 🎉")}>
        {state.message} <br />
        <span className="text-xs opacity-80">{t("Kurs", "Course")}: {courseTitle}</span>
      </Alert>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      {state && !state.ok ? <Alert tone="danger">{state.message}</Alert> : null}

      <input type="hidden" name="course_id" value={courseId} />

      <Field label={t("Ism-familiya", "Full name")} htmlFor="apply-name" required>
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

      <Field label={t("Telefon raqam", "Phone number")} htmlFor="apply-phone" required>
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
        label={t("Qo'shimcha izoh", "Additional note")}
        htmlFor="apply-note"
        hint={t("Darajangiz, qulay vaqtingiz yoki savolingiz", "Your level, preferred time or a question")}
      >
        <Textarea
          id="apply-note"
          name="note"
          placeholder={t("Masalan: hozir B1 darajadaman, kechki guruh qulay.", "E.g. I am at B1 now, an evening group suits me.")}
          maxLength={1000}
        />
      </Field>

      <Button type="submit" size="lg" fullWidth disabled={pending}>
        {pending ? t("Yuborilmoqda…", "Sending…") : t("Ro'yxatdan o'tish", "Enrol")}
      </Button>

      <p className="text-xs text-muted text-center">
        {t(
          "Arizangizni qabul qilgach, administrator siz bilan telefon orqali bog'lanadi.",
          "Once we receive your application, an administrator will contact you by phone.",
        )}
      </p>
    </form>
  );
}
