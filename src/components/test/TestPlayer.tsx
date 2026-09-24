"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  AnswerMap,
  AnswerValue,
  PublicQuestion,
  TestPart,
} from "@/lib/types";
import { SECTION_ICON, SECTION_LABEL } from "@/lib/constants";
import { cn, formatClock } from "@/lib/format";
import { saveAnswersAction, submitAttemptAction } from "@/lib/actions/attempts";
import { Button } from "@/components/ui/Button";
import { QuestionRenderer } from "./QuestionRenderer";
import { AudioPlayer } from "./AudioPlayer";

export interface TestPlayerProps {
  attemptId: string;
  userId: string;
  testTitle: string;
  parts: TestPart[];
  questionsByPart: Record<string, PublicQuestion[]>;
  initialAnswers: AnswerMap;
  initialPartIndex: number;
  /** true → imtihon rejimi: bo'limlar ketma-ket, orqaga qaytib bo'lmaydi */
  sequential: boolean;
  /** Umumiy vaqt (daqiqa). 0 bo'lsa taymer ko'rsatilmaydi. */
  totalMinutes: number;
  /** Tugagach qaysi manzilga o'tish kerak */
  resultHref: string;
  /** Listening audiosi faqat bir marta ijro etilishi kerakmi */
  singlePlayAudio?: boolean;
}

type SaveState = "idle" | "saving" | "saved" | "error";

export function TestPlayer({
  attemptId,
  userId,
  testTitle,
  parts,
  questionsByPart,
  initialAnswers,
  initialPartIndex,
  sequential,
  totalMinutes,
  resultHref,
  singlePlayAudio,
}: TestPlayerProps) {
  const router = useRouter();

  const [answers, setAnswers] = useState<AnswerMap>(initialAnswers);
  const [partIndex, setPartIndex] = useState(
    Math.min(Math.max(0, initialPartIndex), Math.max(0, parts.length - 1)),
  );
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(totalMinutes * 60);

  const submittedRef = useRef(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Taymer va avtosaqlash eng so'nggi qiymatlarni ko'rishi uchun
  const answersRef = useRef(answers);
  const partIndexRef = useRef(partIndex);

  useEffect(() => {
    answersRef.current = answers;
    partIndexRef.current = partIndex;
  }, [answers, partIndex]);

  const currentPart = parts[partIndex];
  const currentQuestions = useMemo(
    () => (currentPart ? (questionsByPart[currentPart.id] ?? []) : []),
    [currentPart, questionsByPart],
  );

  const allQuestions = useMemo(
    () => parts.flatMap((part) => questionsByPart[part.id] ?? []),
    [parts, questionsByPart],
  );

  const answeredCount = useMemo(
    () => allQuestions.filter((q) => isAnswered(answers[q.id])).length,
    [allQuestions, answers],
  );

  /* ------------------------------------------------------- AVTOSAQLASH */
  const persist = useCallback(
    async (nextAnswers: AnswerMap, nextPartIndex: number) => {
      setSaveState("saving");
      const result = await saveAnswersAction(
        attemptId,
        nextAnswers,
        nextPartIndex,
      );
      setSaveState(result.ok ? "saved" : "error");
    },
    [attemptId],
  );

  function updateAnswer(questionId: string, value: AnswerValue) {
    setAnswers((prev) => {
      const next = { ...prev, [questionId]: value };
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        void persist(next, partIndexRef.current);
      }, 1200);
      return next;
    });
  }

  // Sahifadan chiqishdan oldin ogohlantirish
  useEffect(() => {
    function onBeforeUnload(event: BeforeUnloadEvent) {
      if (submittedRef.current) return;
      event.preventDefault();
      event.returnValue = "";
    }
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, []);

  /* ------------------------------------------------------------ TAYMER */
  const handleSubmit = useCallback(
    async (auto: boolean) => {
      if (submittedRef.current) return;
      submittedRef.current = true;
      setSubmitting(true);
      setSubmitError(null);

      if (saveTimer.current) clearTimeout(saveTimer.current);

      const result = await submitAttemptAction(attemptId, answersRef.current);

      if (result.ok) {
        router.push(resultHref);
        router.refresh();
      } else {
        submittedRef.current = false;
        setSubmitting(false);
        setConfirmOpen(false);
        setSubmitError(
          result.message ??
            (auto
              ? "Vaqt tugadi, lekin natijani saqlab bo'lmadi. Qaytadan urinib ko'ring."
              : "Yakunlashda xatolik yuz berdi."),
        );
      }
    },
    [attemptId, resultHref, router],
  );

  useEffect(() => {
    if (totalMinutes <= 0) return;

    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          void handleSubmit(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [totalMinutes, handleSubmit]);

  /* ---------------------------------------------------------- HARAKAT */
  function goToPart(index: number) {
    if (index < 0 || index >= parts.length) return;
    if (sequential && index < partIndex) return; // imtihonda orqaga qaytib bo'lmaydi
    setPartIndex(index);
    void persist(answersRef.current, index);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (!currentPart) {
    return (
      <div className="container-page py-16 text-center">
        <p className="text-muted">
          Bu testda hali savollar qo&apos;shilmagan. Admin panel orqali
          qo&apos;shing.
        </p>
      </div>
    );
  }

  const isReadingLike = Boolean(currentPart.passage);
  const timeLow = totalMinutes > 0 && secondsLeft <= 300;

  return (
    <div className="min-h-dvh bg-[var(--bg)]">
      {/* ================================================= YUQORI PANEL */}
      <div className="sticky top-0 z-40 border-b border-line bg-[var(--bg)]/95 backdrop-blur-md">
        <div className="container-page">
          <div className="flex items-center gap-3 h-14">
            <div className="min-w-0 flex-1">
              <p className="font-bold text-sm truncate">{testTitle}</p>
              <p className="text-xs text-muted">
                {SECTION_ICON[currentPart.section]}{" "}
                {SECTION_LABEL[currentPart.section]} · {currentPart.title}
              </p>
            </div>

            <div className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-muted">
              <SaveIndicator state={saveState} />
            </div>

            {totalMinutes > 0 ? (
              <div
                className={cn(
                  "px-3 py-1.5 rounded-lg font-bold tabular-nums text-sm border",
                  timeLow
                    ? "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800"
                    : "bg-[var(--bg-subtle)] text-fg border-line",
                )}
                role="timer"
                aria-live="off"
              >
                ⏱ {formatClock(secondsLeft)}
              </div>
            ) : null}

            <Button
              size="sm"
              onClick={() => setConfirmOpen(true)}
              disabled={submitting}
            >
              Yakunlash
            </Button>
          </div>

          {/* Bo'limlar navigatsiyasi */}
          <div className="flex items-center gap-1.5 pb-2.5 overflow-x-auto">
            {parts.map((part, i) => {
              const active = i === partIndex;
              const locked = sequential && i > partIndex;
              const passed = sequential && i < partIndex;
              return (
                <button
                  key={part.id}
                  type="button"
                  onClick={() => goToPart(i)}
                  disabled={locked || passed}
                  className={cn(
                    "shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors border",
                    active
                      ? "bg-brand-600 text-white border-brand-600"
                      : locked || passed
                        ? "border-line text-muted/60 cursor-not-allowed"
                        : "border-line text-muted hover:text-fg hover:bg-[var(--bg-subtle)]",
                  )}
                >
                  {passed ? "✓ " : locked ? "🔒 " : ""}
                  {SECTION_LABEL[part.section]}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ================================================= ASOSIY QISM */}
      <div className="container-page py-6">
        {submitError ? (
          <div
            className="mb-5 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900
                       dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-200"
          >
            ⛔ {submitError}
          </div>
        ) : null}

        {currentPart.instructions ? (
          <div
            className="mb-5 rounded-xl border border-sky-200 bg-sky-50 p-4 text-sm leading-relaxed
                       text-sky-900 dark:border-sky-800 dark:bg-sky-950/40 dark:text-sky-200"
          >
            ℹ️ {currentPart.instructions}
          </div>
        ) : null}

        {currentPart.audio_url || currentPart.section === "listening" ? (
          <div className="mb-5">
            <AudioPlayer
              key={currentPart.id}
              src={currentPart.audio_url}
              singlePlay={singlePlayAudio}
            />
          </div>
        ) : null}

        {/* Audio hali yuklanmagan bo'lsa — bo'lim ishlashi uchun transkript ko'rsatiladi */}
        {!currentPart.audio_url && currentPart.transcript ? (
          <details className="card p-0 mb-5 overflow-hidden" open>
            <summary className="cursor-pointer select-none p-4 font-bold text-sm hover:bg-[var(--bg-subtle)]">
              📄 Transkript (audio o&apos;rniga)
            </summary>
            <p className="px-4 pb-4 text-sm leading-relaxed whitespace-pre-line">
              {currentPart.transcript}
            </p>
          </details>
        ) : null}

        {/* Writing Task 1 uchun grafik / jadval rasmi */}
        {currentPart.image_url ? (
          <figure className="card p-4 mb-5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={currentPart.image_url}
              alt={`${currentPart.title} — topshiriq rasmi`}
              className="mx-auto max-h-[480px] w-auto rounded-lg"
            />
          </figure>
        ) : null}

        <div
          className={cn(
            "grid gap-6",
            isReadingLike ? "lg:grid-cols-2" : "lg:grid-cols-[1fr_260px]",
          )}
        >
          {/* --------------------------------------- Chap: matn yoki savollar */}
          {isReadingLike ? (
            <div className="card p-6 lg:max-h-[calc(100dvh-13rem)] lg:overflow-y-auto lg:sticky lg:top-32">
              <div
                className="prose-exam"
                // Matn admin panel orqali kiritiladi (ishonchli manba)
                dangerouslySetInnerHTML={{ __html: currentPart.passage ?? "" }}
              />
            </div>
          ) : null}

          <div className="space-y-5">
            <div className="card p-6 space-y-7">
              {currentQuestions.length === 0 ? (
                <p className="text-sm text-muted">
                  Bu bo&apos;limda hali savollar yo&apos;q.
                </p>
              ) : (
                currentQuestions.map((question, i) => (
                  <div
                    key={question.id}
                    className={cn(
                      i > 0 && "pt-7 border-t border-line",
                    )}
                  >
                    <QuestionRenderer
                      question={question}
                      number={i + 1}
                      value={answers[question.id] ?? null}
                      onChange={(value) => updateAnswer(question.id, value)}
                      disabled={submitting}
                      uploadContext={{ attemptId, userId }}
                    />
                  </div>
                ))
              )}
            </div>

            {/* Bo'limlar orasida harakat */}
            <div className="flex items-center justify-between gap-3">
              <Button
                variant="secondary"
                onClick={() => goToPart(partIndex - 1)}
                disabled={partIndex === 0 || sequential || submitting}
              >
                ← Oldingi bo&apos;lim
              </Button>

              {partIndex < parts.length - 1 ? (
                <Button
                  onClick={() => goToPart(partIndex + 1)}
                  disabled={submitting}
                >
                  Keyingi bo&apos;lim →
                </Button>
              ) : (
                <Button
                  onClick={() => setConfirmOpen(true)}
                  disabled={submitting}
                >
                  Testni yakunlash
                </Button>
              )}
            </div>
          </div>

          {/* --------------------------------------- O'ng: savollar xaritasi */}
          {!isReadingLike ? (
            <aside className="lg:sticky lg:top-32 h-fit">
              <QuestionPalette
                questions={currentQuestions}
                answers={answers}
                answeredCount={answeredCount}
                totalCount={allQuestions.length}
              />
            </aside>
          ) : null}
        </div>

        {isReadingLike ? (
          <div className="mt-6">
            <QuestionPalette
              questions={currentQuestions}
              answers={answers}
              answeredCount={answeredCount}
              totalCount={allQuestions.length}
              horizontal
            />
          </div>
        ) : null}
      </div>

      {/* ================================================= TASDIQLASH */}
      {confirmOpen ? (
        <div className="fixed inset-0 z-[70] grid place-items-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-ink-950/60 backdrop-blur-sm"
            onClick={() => !submitting && setConfirmOpen(false)}
            aria-label="Yopish"
          />
          <div
            className="relative card p-6 max-w-md w-full animate-pop"
            role="dialog"
            aria-modal="true"
          >
            <h2 className="text-xl font-extrabold">Testni yakunlaysizmi?</h2>
            <p className="text-sm text-muted mt-2 leading-relaxed">
              Yakunlagandan keyin javoblarni o&apos;zgartirib bo&apos;lmaydi.
            </p>

            <div className="rounded-xl bg-[var(--bg-subtle)] border border-line p-4 mt-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted">Javob berilgan:</span>
                <span className="font-extrabold tabular-nums">
                  {answeredCount} / {allQuestions.length}
                </span>
              </div>
              {answeredCount < allQuestions.length ? (
                <p className="text-xs text-amber-700 dark:text-amber-400 mt-2">
                  ⚠️ {allQuestions.length - answeredCount} ta savol javobsiz
                  qoldi.
                </p>
              ) : (
                <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-2">
                  ✅ Barcha savollarga javob berildi.
                </p>
              )}
            </div>

            <div className="flex gap-3 mt-5">
              <Button
                variant="secondary"
                fullWidth
                onClick={() => setConfirmOpen(false)}
                disabled={submitting}
              >
                Orqaga
              </Button>
              <Button
                fullWidth
                onClick={() => handleSubmit(false)}
                disabled={submitting}
              >
                {submitting ? "Yuborilmoqda…" : "Ha, yakunlash"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------ */

function isAnswered(value: AnswerValue): boolean {
  if (value == null) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "object") {
    return Object.values(value).some(
      (v) => typeof v === "string" && v.trim().length > 0,
    );
  }
  return false;
}

function SaveIndicator({ state }: { state: SaveState }) {
  const map = {
    idle: { text: "Avtomatik saqlanadi", tone: "text-muted" },
    saving: { text: "Saqlanmoqda…", tone: "text-muted" },
    saved: { text: "✓ Saqlandi", tone: "text-emerald-600 dark:text-emerald-400" },
    error: { text: "⚠ Saqlanmadi", tone: "text-amber-600 dark:text-amber-400" },
  } as const;
  const item = map[state];
  return <span className={item.tone}>{item.text}</span>;
}

function QuestionPalette({
  questions,
  answers,
  answeredCount,
  totalCount,
  horizontal,
}: {
  questions: PublicQuestion[];
  answers: AnswerMap;
  answeredCount: number;
  totalCount: number;
  horizontal?: boolean;
}) {
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-bold uppercase tracking-wide text-muted">
          Savollar
        </p>
        <span className="text-xs font-bold tabular-nums text-muted">
          {answeredCount}/{totalCount}
        </span>
      </div>

      <div
        className={cn(
          "grid gap-1.5",
          horizontal
            ? "grid-cols-10 sm:grid-cols-[repeat(auto-fill,minmax(2.25rem,1fr))]"
            : "grid-cols-5",
        )}
      >
        {questions.map((question, i) => {
          const answered = isAnswered(answers[question.id] ?? null);
          return (
            <a
              key={question.id}
              href={`#q-${question.id}`}
              className={cn(
                "aspect-square rounded-lg grid place-items-center text-xs font-bold border transition-colors",
                answered
                  ? "bg-brand-600 text-white border-brand-600"
                  : "border-line text-muted hover:border-brand-400 hover:text-fg",
              )}
            >
              {i + 1}
            </a>
          );
        })}
      </div>

      <div className="flex items-center gap-4 mt-3 text-[11px] text-muted">
        <span className="inline-flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-brand-600" aria-hidden />
          Javob berilgan
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="w-3 h-3 rounded border border-line" aria-hidden />
          Bo&apos;sh
        </span>
      </div>
    </div>
  );
}
