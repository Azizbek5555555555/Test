"use client";

import { useT } from "@/i18n/client";
import type { T } from "@/i18n";
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
import { QuestionRenderer, asMatchingOptions, numberQuestions } from "./QuestionRenderer";
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
  const t = useT();

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

  // Bir nechta qismga ulangan (umumiy) audio manzillari
  const sharedAudioUrls = useMemo(() => {
    const seen = new Map<string, number>();
    for (const part of parts) {
      if (part.audio_url) seen.set(part.audio_url, (seen.get(part.audio_url) ?? 0) + 1);
    }
    return new Set([...seen].filter(([, count]) => count > 1).map(([url]) => url));
  }, [parts]);

  // Imtihondagi haqiqiy raqamlar (Listening 1–35, Reading 1–35 ...)
  const questionNumbers = useMemo(
    () => numberQuestions(parts, questionsByPart),
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
              ? t(
                  "Vaqt tugadi, lekin natijani saqlab bo'lmadi. Qaytadan urinib ko'ring.",
                  "Time is up, but the result could not be saved. Please try again.",
                )
              : t("Yakunlashda xatolik yuz berdi.", "Something went wrong while finishing.")),
        );
      }
    },
    [attemptId, resultHref, router, t],
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
  function goToPart(index: number, questionId?: string) {
    if (index < 0 || index >= parts.length) return;
    if (sequential && index !== partIndex) {
      // imtihonda orqaga qaytib ham, oldinga sakrab ham bo'lmaydi — faqat ketma-ket
      if (index < partIndex || index > partIndex + 1) return;
    }
    if (index === partIndex) {
      if (questionId) focusQuestion(questionId);
      return;
    }
    pendingQuestion.current = questionId ?? null;
    setPartIndex(index);
    void persist(answersRef.current, index);
    if (!questionId) window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // Pastki paneldan boshqa bo'limdagi savol tanlansa — bo'lim chizilgach o'sha savolga o'tiladi
  const pendingQuestion = useRef<string | null>(null);
  useEffect(() => {
    const id = pendingQuestion.current;
    if (!id) return;
    pendingQuestion.current = null;
    requestAnimationFrame(() => focusQuestion(id));
  }, [partIndex]);

  if (!currentPart) {
    return (
      <div className="container-page py-16 text-center">
        <p className="text-muted">
          {t("Bu testda hali savollar qo'shilmagan.", "This test has no questions yet.")}
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
              <SaveIndicator state={saveState} t={t} />
            </div>

            {totalMinutes > 0 ? (
              <div
                className={cn(
                  "px-3 py-1.5 rounded-lg font-bold tabular-nums text-sm border",
                  timeLow
                    ? "bg-danger/10 text-danger border-danger/40"
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
              {t("Yakunlash", "Finish")}
            </Button>
          </div>
        </div>
      </div>

      {/* ================================================= ASOSIY QISM */}
      <div className="container-page pb-32 pt-6">
        {submitError ? (
          <div
            className="mb-5 rounded-xl border p-4 text-sm
                       border-danger/40 bg-danger/10 text-danger"
          >
            ⛔ {submitError}
          </div>
        ) : null}

        {currentPart.instructions ? (
          <div
            className="mb-5 rounded-xl border p-4 text-sm leading-relaxed
                        border-line bg-ink-800/60 text-fg"
          >
            ℹ️ {currentPart.instructions}
          </div>
        ) : null}

        {currentPart.audio_url || currentPart.section === "listening" ? (
          <div className="mb-5">
            <AudioPlayer
              // Bir nechta qismga bitta audio ulangan bo'lsa (Full Mock),
              // qism almashganda pleyer qayta yaratilmaydi — audio davom etadi
              key={currentPart.audio_url ?? currentPart.id}
              src={currentPart.audio_url}
              singlePlay={singlePlayAudio}
              label={
                currentPart.audio_url && sharedAudioUrls.has(currentPart.audio_url)
                  ? t("Listening audio — barcha qismlar uchun bitta", "Listening audio — one for all parts")
                  : undefined
              }
            />
          </div>
        ) : null}

        {/* Skript test paytida ko'rsatilmaydi (javoblarni ochib qo'yadi) — faqat natija sahifasida, Premium uchun */}

        {/* Writing Task 1 uchun grafik / jadval rasmi */}
        {currentPart.image_url ? (
          <figure className="card p-4 mb-5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={currentPart.image_url}
              alt={`${currentPart.title} — ${t("topshiriq rasmi", "task image")}`}
              className="mx-auto max-h-[480px] w-auto rounded-lg"
            />
          </figure>
        ) : null}

        <div
          className={cn(
            // grid-cols-1 = minmax(0, 1fr): keng jadvalli matn telefonda sahifani kengaytirib yubormaydi
            "grid grid-cols-1 gap-6",
            isReadingLike ? "lg:grid-cols-2" : "mx-auto max-w-[920px]",
          )}
        >
          {/* --------------------------------------- Chap: matn yoki savollar */}
          {isReadingLike ? (
            <div className="card p-6 lg:max-h-[calc(100dvh-11.5rem)] lg:overflow-y-auto lg:sticky lg:top-20">
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
                  {t("Bu bo'limda hali savollar yo'q.", "This section has no questions yet.")}
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
                      number={questionNumbers[question.id] ?? i + 1}
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
                ← {t("Oldingi bo'lim", "Previous section")}
              </Button>

              {partIndex < parts.length - 1 ? (
                <Button
                  onClick={() => goToPart(partIndex + 1)}
                  disabled={submitting}
                >
                  {t("Keyingi bo'lim", "Next section")} →
                </Button>
              ) : (
                <Button
                  onClick={() => setConfirmOpen(true)}
                  disabled={submitting}
                >
                  {t("Testni yakunlash", "Finish the test")}
                </Button>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* ================================================= PASTKI PANEL: bo'limlar va savollar */}
      <PartNavigator
        parts={parts}
        questionsByPart={questionsByPart}
        numbers={questionNumbers}
        answers={answers}
        partIndex={partIndex}
        sequential={sequential}
        answeredCount={answeredCount}
        totalCount={allQuestions.length}
        onGo={goToPart}
        t={t}
      />

      {/* ================================================= TASDIQLASH */}
      {confirmOpen ? (
        <div className="fixed inset-0 z-[70] grid place-items-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-ink-950/60 backdrop-blur-sm"
            onClick={() => !submitting && setConfirmOpen(false)}
            aria-label={t("Yopish", "Close")}
          />
          <div
            className="relative card p-6 max-w-md w-full animate-pop"
            role="dialog"
            aria-modal="true"
          >
            <h2 className="text-xl font-extrabold">{t("Testni yakunlaysizmi?", "Finish the test?")}</h2>
            <p className="text-sm text-muted mt-2 leading-relaxed">
              {t("Yakunlagandan keyin javoblarni o'zgartirib bo'lmaydi.", "You cannot change your answers after finishing.")}
            </p>

            <div className="rounded-xl bg-[var(--bg-subtle)] border border-line p-4 mt-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted">{t("Javob berilgan", "Answered")}:</span>
                <span className="font-extrabold tabular-nums">
                  {answeredCount} / {allQuestions.length}
                </span>
              </div>
              {answeredCount < allQuestions.length ? (
                <p className="text-xs text-warning mt-2">
                  ⚠️{" "}
                  {t(
                    `${allQuestions.length - answeredCount} ta savol javobsiz qoldi.`,
                    `${allQuestions.length - answeredCount} questions left unanswered.`,
                  )}
                </p>
              ) : (
                <p className="text-xs text-success mt-2">
                  ✅ {t("Barcha savollarga javob berildi.", "All questions answered.")}
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
                {t("Orqaga", "Back")}
              </Button>
              <Button
                fullWidth
                onClick={() => handleSubmit(false)}
                disabled={submitting}
              >
                {submitting ? t("Yuborilmoqda…", "Submitting…") : t("Ha, yakunlash", "Yes, finish")}
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

function SaveIndicator({ state, t }: { state: SaveState; t: T }) {
  const map = {
    idle: { text: t("Avtomatik saqlanadi", "Saved automatically"), tone: "text-muted" },
    saving: { text: t("Saqlanmoqda…", "Saving…"), tone: "text-muted" },
    saved: { text: `✓ ${t("Saqlandi", "Saved")}`, tone: "text-success" },
    error: { text: `⚠ ${t("Saqlanmadi", "Not saved")}`, tone: "text-warning" },
  } as const;
  const item = map[state];
  return <span className={item.tone}>{item.text}</span>;
}

/** "Part 3" / "Task 1" / "Part 1.2" → tugmada " 3" / " 1" / " 1.2" */
function partNumber(title: string): string {
  const match = /^(?:Part|Task)\s+(\d+(?:\.\d+)?)$/i.exec(title.trim());
  return match ? ` ${match[1]}` : "";
}

function focusQuestion(questionId: string) {
  const el = document.getElementById(`q-${questionId}`);
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "center" });
  const field = el.querySelector<HTMLElement>("input:not([type=hidden]), textarea, select, button");
  field?.focus({ preventScroll: true });
}

/** Matching savoli bir nechta raqamni egallaydi: "14–19" */
function questionLabel(question: PublicQuestion, first: number): string {
  if (question.kind !== "matching") return String(first);
  const count = Math.max(1, asMatchingOptions(question.options).length);
  return count > 1 ? `${first}–${first + count - 1}` : String(first);
}

/**
 * Pastki panel (haqiqiy kompyuterdagi imtihon kabi): barcha bo'limlar ketma-ket,
 * har birida nechta savolga javob berilgani; ochiq bo'limda savol raqamlari —
 * bosilsa o'sha savolga o'tiladi. Boshqa bo'lim bosilsa — o'sha bo'lim ochiladi.
 */
function PartNavigator({
  parts,
  questionsByPart,
  numbers,
  answers,
  partIndex,
  sequential,
  answeredCount,
  totalCount,
  onGo,
  t,
}: {
  parts: TestPart[];
  questionsByPart: Record<string, PublicQuestion[]>;
  numbers: Record<string, number>;
  answers: AnswerMap;
  partIndex: number;
  sequential: boolean;
  answeredCount: number;
  totalCount: number;
  onGo: (index: number, questionId?: string) => void;
  t: T;
}) {
  const trackRef = useRef<HTMLDivElement>(null);

  // Ochiq bo'lim doim ko'rinib tursin
  // (scrollIntoView emas — u butun sahifani ham siljitib yuborishi mumkin; faqat panelning o'zi suriladi)
  useEffect(() => {
    const track = trackRef.current;
    const active = track?.querySelector<HTMLElement>("[data-active='true']");
    if (!track || !active) return;
    const left = active.offsetLeft - (track.clientWidth - active.offsetWidth) / 2;
    track.scrollTo({ left: Math.max(0, left), behavior: "smooth" });
  }, [partIndex]);

  const canGo = (i: number) => !sequential || i === partIndex || i === partIndex + 1;

  return (
    <nav className="tnav" aria-label={t("Bo'limlar va savollar", "Sections and questions")}>
      <div className="tnav-inner">
        <button
          type="button"
          className="tnav-arrow"
          onClick={() => onGo(partIndex - 1)}
          disabled={partIndex === 0 || sequential}
          aria-label={t("Oldingi bo'lim", "Previous section")}
        >
          ‹
        </button>

        <div ref={trackRef} className="tnav-track">
          {parts.map((part, i) => {
            const qs = questionsByPart[part.id] ?? [];
            const done = qs.filter((q) => isAnswered(answers[q.id] ?? null)).length;
            const active = i === partIndex;
            const locked = !canGo(i);
            return (
              <div
                key={part.id}
                className="tnav-part"
                data-active={active}
                data-locked={locked}
                data-complete={qs.length > 0 && done === qs.length}
              >
                <button
                  type="button"
                  className="tnav-part-btn"
                  onClick={() => onGo(i)}
                  disabled={locked}
                  aria-current={active ? "step" : undefined}
                >
                  <span className="tnav-part-name">
                    {locked && sequential && i < partIndex ? "✓ " : locked ? "🔒 " : ""}
                    {SECTION_LABEL[part.section]}
                    {partNumber(part.title)}
                  </span>
                  <span className="tnav-part-count">
                    {done}/{qs.length}
                  </span>
                </button>

                {active && qs.length > 0 ? (
                  <div className="tnav-qs">
                    {qs.map((q, k) => (
                      <button
                        key={q.id}
                        type="button"
                        className="tnav-q"
                        data-answered={isAnswered(answers[q.id] ?? null)}
                        onClick={() => onGo(i, q.id)}
                        aria-label={`${t("Savol", "Question")} ${questionLabel(q, numbers[q.id] ?? k + 1)}`}
                      >
                        {questionLabel(q, numbers[q.id] ?? k + 1)}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>

        <span className="tnav-total" title={t("Javob berilgan savollar", "Answered questions")}>
          {answeredCount}/{totalCount}
        </span>

        <button
          type="button"
          className="tnav-arrow"
          onClick={() => onGo(partIndex + 1)}
          disabled={partIndex >= parts.length - 1}
          aria-label={t("Keyingi bo'lim", "Next section")}
        >
          ›
        </button>
      </div>
    </nav>
  );
}
