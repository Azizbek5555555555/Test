"use client";

import { useActionState, useState } from "react";
import { speakingStandardScore, writingStandardScore } from "@/lib/scoring";
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
  const [writing, setWriting] = useState(defaultWriting != null ? String(defaultWriting) : "");
  const [speaking, setSpeaking] = useState(defaultSpeaking != null ? String(defaultSpeaking) : "");

  return (
    <form action={formAction} className="space-y-5">
      {state ? (
        <Alert tone={state.ok ? "success" : "danger"}>{state.message}</Alert>
      ) : null}

      <input type="hidden" name="attempt_id" value={attemptId} />

      {hasWriting ? (
        <div className="space-y-3">
          <h3 className="font-bold">✍️ Writing</h3>
          <RubricCalculator
            title="Rasmiy mezon bo'yicha hisoblagich"
            parts={WRITING_PARTS}
            convert={writingStandardScore}
            note="Topshiriqlar bali yig'indisi (0–17) rasmiy jadval bo'yicha 0–75 ga o'tkaziladi."
            onResult={(v) => setWriting(String(v))}
          />
          <Field
            label="Yakuniy ball (0–75)"
            htmlFor="writing"
            hint="Hisoblagich avtomatik to'ldiradi — kerak bo'lsa qo'lda o'zgartirishingiz mumkin"
          >
            <Input
              id="writing"
              name="writing"
              type="number"
              min={0}
              max={75}
              value={writing}
              onChange={(e) => setWriting(e.target.value)}
              placeholder="45"
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
          <RubricCalculator
            title="Rasmiy mezon bo'yicha hisoblagich"
            parts={SPEAKING_PARTS}
            convert={speakingStandardScore}
            note="Savollar bali yig'indisi (0–21) 0–75 shkalaga o'tkaziladi (taxminiy — Speaking uchun alohida rasmiy jadval yuborilmagan)."
            onResult={(v) => setSpeaking(String(v))}
          />
          <Field
            label="Yakuniy ball (0–75)"
            htmlFor="speaking"
            hint="Hisoblagich avtomatik to'ldiradi — kerak bo'lsa qo'lda o'zgartirishingiz mumkin"
          >
            <Input
              id="speaking"
              name="speaking"
              type="number"
              min={0}
              max={75}
              value={speaking}
              onChange={(e) => setSpeaking(e.target.value)}
              placeholder="51"
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
        Saqlaganingizdan keyin umumiy ball (4 bo&apos;lim o&apos;rtachasi, 0–75) va daraja
        qayta hisoblanadi: C1 65–75, B2 51–64, B1 38–50. Natija o&apos;quvchi profilida
        darhol ko&apos;rinadi.
      </p>
    </form>
  );
}

/* ------------------------------------------------------------------ Rasmiy mezonlar */
interface RubricPart {
  key: string;
  label: string;
  bands: { value: number; label: string }[];
}

const W_LOW = [
  { value: 5, label: "5 — B1 dan yuqori" },
  { value: 4, label: "4 — Yuqori B1" },
  { value: 3, label: "3 — Quyi B1 (qisman mavzuga mos)" },
  { value: 2, label: "2 — A2 (xatolar tushunishga xalaqit beradi)" },
  { value: 1, label: "1 — A1 va past / mavzudan tashqari" },
  { value: 0, label: "0 — Javob yo'q" },
];
const W_HIGH = [
  { value: 6, label: "6 — C2 (C1 dan yuqori)" },
  { value: 5, label: "5 — C1" },
  { value: 4, label: "4 — Yuqori B2" },
  { value: 3, label: "3 — Quyi B2" },
  { value: 2, label: "2 — B1" },
  { value: 1, label: "1 — A2" },
  { value: 0, label: "0 — Ma'nosiz / mavzudan tashqari / javob yo'q" },
];

const WRITING_PARTS: RubricPart[] = [
  { key: "w11", label: "Task 1.1 — do'stga xat (~50 so'z)", bands: W_LOW },
  { key: "w12", label: "Task 1.2 — rasmiy xat (120–150 so'z)", bands: W_HIGH },
  { key: "w2", label: "Task 2 — esse / post (~250 so'z)", bands: W_HIGH },
];

const levelBands = (top: string, hi: string, lo: string, hi2: string, lo2: string) => [
  { value: 5, label: `5 — ${top}` },
  { value: 4, label: `4 — ${hi}` },
  { value: 3, label: `3 — ${lo}` },
  { value: 2, label: `2 — ${hi2}` },
  { value: 1, label: `1 — ${lo2}` },
  { value: 0, label: "0 — Javob yo'q / mavzudan tashqari" },
];

const SPEAKING_PARTS: RubricPart[] = [
  { key: "s13", label: "1–3 savollar (Part 1.1)", bands: levelBands("A2 dan yuqori", "Yuqori A2", "Quyi A2", "Yuqori A1", "Quyi A1") },
  { key: "s46", label: "4–6 savollar (Part 1.2)", bands: levelBands("B1 dan yuqori", "Yuqori B1", "Quyi B1", "Yuqori A2", "Quyi A2") },
  { key: "s7", label: "7-savol (Part 2)", bands: levelBands("B2 dan yuqori", "Yuqori B2", "Quyi B2", "Yuqori B1", "Quyi B1") },
  {
    key: "s8",
    label: "8-savol (Part 3)",
    bands: [
      { value: 6, label: "6 — C1 dan yuqori" },
      { value: 5, label: "5 — C1" },
      { value: 4, label: "4 — Yuqori B2" },
      { value: 3, label: "3 — Quyi B2" },
      { value: 2, label: "2 — Yuqori B1" },
      { value: 1, label: "1 — Quyi B1" },
      { value: 0, label: "0 — Javob yo'q / mavzudan tashqari" },
    ],
  },
];

function RubricCalculator({
  title,
  parts,
  convert,
  note,
  onResult,
}: {
  title: string;
  parts: RubricPart[];
  convert: (sum: number) => number;
  note: string;
  onResult: (score: number) => void;
}) {
  const [marks, setMarks] = useState<Record<string, number | null>>({});
  const filled = parts.every((p) => marks[p.key] != null);
  const sum = parts.reduce((acc, p) => acc + (marks[p.key] ?? 0), 0);

  function choose(key: string, raw: string) {
    const next = { ...marks, [key]: raw === "" ? null : Number(raw) };
    setMarks(next);
    if (parts.every((p) => next[p.key] != null)) {
      onResult(convert(parts.reduce((acc, p) => acc + (next[p.key] ?? 0), 0)));
    }
  }

  return (
    <div className="rounded-xl border border-line bg-ink-900/50 p-4">
      <p className="text-sm font-semibold">{title}</p>
      <div className="mt-3 grid gap-3">
        {parts.map((p) => (
          <label key={p.key} className="block text-xs text-muted">
            {p.label}
            <select
              className="mt-1 w-full rounded-lg border border-line bg-ink-950 px-3 py-2 text-sm text-fg"
              value={marks[p.key] ?? ""}
              onChange={(e) => choose(p.key, e.target.value)}
            >
              <option value="">— baho tanlang —</option>
              {p.bands.map((b) => (
                <option key={b.value} value={b.value}>
                  {b.label}
                </option>
              ))}
            </select>
          </label>
        ))}
      </div>
      <p className="mt-3 text-xs text-muted">
        {filled ? (
          <>
            Yig&apos;indi: <strong className="text-fg">{sum}</strong> → standart ball:{" "}
            <strong className="text-brand-400">{convert(sum)} / 75</strong>
          </>
        ) : (
          note
        )}
      </p>
    </div>
  );
}
