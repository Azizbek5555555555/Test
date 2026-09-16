"use client";

import { useActionState } from "react";
import { gradeAttemptAction } from "@/lib/actions/admin";
import type { ActionResult } from "@/lib/actions/profile";
import { Button } from "@/components/ui/Button";
import { Field, Input, Textarea } from "@/components/ui/Field";
import { Alert } from "@/components/ui/Card";

export function GradingForm({
  attemptId,
  hasWriting,
  hasSpeaking,
  defaultWriting,
  defaultSpeaking,
  defaultWritingNote,
  defaultSpeakingNote,
}: {
  attemptId: string;
  hasWriting: boolean;
  hasSpeaking: boolean;
  defaultWriting?: number | null;
  defaultSpeaking?: number | null;
  defaultWritingNote?: string;
  defaultSpeakingNote?: string;
}) {
  const [state, formAction, pending] = useActionState<
    ActionResult | null,
    FormData
  >(gradeAttemptAction, null);

  return (
    <form action={formAction} className="space-y-5">
      {state ? (
        <Alert tone={state.ok ? "success" : "danger"}>{state.message}</Alert>
      ) : null}

      <input type="hidden" name="attempt_id" value={attemptId} />

      {hasWriting ? (
        <div className="space-y-3">
          <h3 className="font-bold">✍️ Writing</h3>
          <Field
            label="Ball (0–100)"
            htmlFor="writing"
            hint="Task Achievement, Coherence, Lexical Resource, Grammar bo'yicha umumiy baho"
          >
            <Input
              id="writing"
              name="writing"
              type="number"
              min={0}
              max={100}
              defaultValue={defaultWriting ?? ""}
              placeholder="58"
              className="max-w-32"
            />
          </Field>
          <Field label="O'quvchiga izoh" htmlFor="writing_note">
            <Textarea
              id="writing_note"
              name="writing_note"
              defaultValue={defaultWritingNote ?? ""}
              placeholder="Kuchli tomonlaringiz… Yaxshilash kerak bo'lgan joylar…"
              className="min-h-28"
            />
          </Field>
        </div>
      ) : null}

      {hasSpeaking ? (
        <div className="space-y-3 pt-2">
          <h3 className="font-bold">🎙️ Speaking</h3>
          <Field
            label="Ball (0–100)"
            htmlFor="speaking"
            hint="Fluency, Pronunciation, Vocabulary, Grammar bo'yicha umumiy baho"
          >
            <Input
              id="speaking"
              name="speaking"
              type="number"
              min={0}
              max={100}
              defaultValue={defaultSpeaking ?? ""}
              placeholder="61"
              className="max-w-32"
            />
          </Field>
          <Field label="O'quvchiga izoh" htmlFor="speaking_note">
            <Textarea
              id="speaking_note"
              name="speaking_note"
              defaultValue={defaultSpeakingNote ?? ""}
              placeholder="Talaffuz, ravonlik va so'z boyligi bo'yicha izoh…"
              className="min-h-28"
            />
          </Field>
        </div>
      ) : null}

      <Button type="submit" size="lg" disabled={pending}>
        {pending ? "Saqlanmoqda…" : "Bahoni saqlash va yakunlash"}
      </Button>

      <p className="text-xs text-muted">
        Saqlaganingizdan keyin umumiy ball va CEFR darajasi qayta hisoblanadi va
        o&apos;quvchi profilida ko&apos;rinadi.
      </p>
    </form>
  );
}
