"use client";

import { useT } from "@/i18n/client";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { VocabRoundWord, VocabSession } from "@/lib/types";
import {
  GAME_BASE_POINTS,
  GAME_MAX_BONUS,
  GAME_QUESTION_COUNT,
  GAME_TIME_LIMIT_MS,
} from "@/lib/constants";
import { cn, formatXp, percent } from "@/lib/format";
import {
  startVocabRoundAction,
  submitVocabSessionAction,
  type GameAnswer,
} from "@/lib/actions/vocab";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Card";

type Phase = "intro" | "loading" | "playing" | "feedback" | "done" | "error";

const OPTION_LETTERS = ["A", "B", "C", "D", "E", "F"];

/** Vaqtni o'lchash uchun yordamchi (render paytida chaqirilmaydi) */
function nowMs(): number {
  return Date.now();
}

export function VocabGame({
  packId,
  packTitle,
  packEmoji,
}: {
  packId: string;
  packTitle: string;
  packEmoji: string;
}) {
  const t = useT();
  const [phase, setPhase] = useState<Phase>("intro");
  const [words, setWords] = useState<VocabRoundWord[]>([]);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [msLeft, setMsLeft] = useState(GAME_TIME_LIMIT_MS);
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<VocabSession | null>(null);
  const [rank, setRank] = useState<number | null>(null);
  const [localScore, setLocalScore] = useState(0);

  const answersRef = useRef<GameAnswer[]>([]);
  const roundIdRef = useRef<string | null>(null);
  const questionStartRef = useRef<number>(0);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const current = words[index];

  const clearTick = useCallback(() => {
    if (tickRef.current) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
  }, []);

  useEffect(() => clearTick, [clearTick]);

  /* ------------------------------------------------------------- START */
  async function start() {
    setPhase("loading");
    setError(null);

    const result = await startVocabRoundAction(packId);
    if (!result.ok || !result.words || !result.roundId) {
      setError(result.message ?? t("So'zlarni yuklab bo'lmadi.", "Could not load the words."));
      setPhase("error");
      return;
    }

    answersRef.current = [];
    roundIdRef.current = result.roundId;
    setWords(result.words);
    setIndex(0);
    setSelected(null);
    setLocalScore(0);
    beginQuestion();
    setPhase("playing");
  }

  function beginQuestion() {
    questionStartRef.current = nowMs();
    setMsLeft(GAME_TIME_LIMIT_MS);
    clearTick();

    tickRef.current = setInterval(() => {
      const elapsed = nowMs() - questionStartRef.current;
      const left = GAME_TIME_LIMIT_MS - elapsed;
      if (left <= 0) {
        clearTick();
        setMsLeft(0);
        answer(-1, GAME_TIME_LIMIT_MS);
      } else {
        setMsLeft(left);
      }
    }, 100);
  }

  /* ------------------------------------------------------------ ANSWER */
  function answer(choice: number, forcedMs?: number) {
    if (phase === "feedback") return;
    clearTick();

    const ms = forcedMs ?? nowMs() - questionStartRef.current;
    const word = words[index];
    if (!word) return;

    answersRef.current.push({ word_id: word.id, choice, ms: Math.round(ms) });
    setSelected(choice);

    // Taxminiy ball (yakuniy ball serverda hisoblanadi)
    if (choice >= 0) {
      const bonus = Math.floor(
        GAME_MAX_BONUS *
          Math.max(0, (GAME_TIME_LIMIT_MS - Math.min(ms, GAME_TIME_LIMIT_MS)) /
            GAME_TIME_LIMIT_MS),
      );
      setLocalScore((prev) => prev + GAME_BASE_POINTS + bonus);
    }

    setPhase("feedback");

    setTimeout(() => {
      if (index + 1 >= words.length) {
        void finish();
      } else {
        setIndex((prev) => prev + 1);
        setSelected(null);
        setPhase("playing");
        beginQuestion();
      }
    }, 700);
  }

  /* ------------------------------------------------------------ FINISH */
  async function finish() {
    setPhase("loading");
    const roundId = roundIdRef.current;
    if (!roundId) {
      setError("O'yin topilmadi. Qaytadan boshlang.");
      setPhase("error");
      return;
    }
    roundIdRef.current = null;
    const result = await submitVocabSessionAction(roundId, answersRef.current);

    if (!result.ok || !result.session) {
      setError(result.message ?? t("Natijani saqlab bo'lmadi.", "Could not save the result."));
      setPhase("error");
      return;
    }

    setSession(result.session);
    setRank(result.rank ?? null);
    setPhase("done");
  }

  /* ========================================================== KO'RINISH */

  if (phase === "intro") {
    return (
      <div className="card mx-auto max-w-md animate-fade-up rounded-2xl p-8 text-center">
        <span className="rounded bg-ink-700 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-brand-300">
          Lobby
        </span>
        <p className="mt-5 text-4xl" aria-hidden>
          {packEmoji}
        </p>
        <h1 className="display-title mt-3 text-[32px]">{packTitle}</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          {t(
            `${words.length || GAME_QUESTION_COUNT} ta so'z · har biriga ${Math.round(GAME_TIME_LIMIT_MS / 1000)} soniya. Tez va to'g'ri javob bering — qancha tez bo'lsangiz, shuncha ko'p ball.`,
            `${words.length || GAME_QUESTION_COUNT} words · ${Math.round(GAME_TIME_LIMIT_MS / 1000)} seconds each. Answer fast and correctly — the faster you are, the more points you get.`,
          )}
        </p>

        <div className="mt-6 grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-xl border border-line bg-ink-800 p-3">
            <p className="font-display text-2xl text-fg lining-nums">{GAME_BASE_POINTS}</p>
            <p className="text-xs text-muted">{t("to'g'ri javob uchun", "per correct answer")}</p>
          </div>
          <div className="rounded-xl border border-line bg-ink-800 p-3">
            <p className="font-display text-2xl text-gold-400 lining-nums">+{GAME_MAX_BONUS}</p>
            <p className="text-xs text-muted">{t("tezlik bonusi", "speed bonus")}</p>
          </div>
        </div>

        <Button size="lg" fullWidth className="mt-7" onClick={start}>
          {t("Jangni boshlash", "Start the battle")}
        </Button>
      </div>
    );
  }

  if (phase === "loading") {
    return (
      <div className="card mx-auto max-w-md rounded-2xl p-12 text-center">
        <span
          className="mx-auto block size-10 animate-spin rounded-full border-2 border-ink-600 border-t-brand-400"
          aria-hidden
        />
        <p className="mt-4 text-sm text-muted">{t("Tayyorlanmoqda…", "Getting ready…")}</p>
      </div>
    );
  }

  if (phase === "error") {
    return (
      <div className="mx-auto max-w-md space-y-4">
        <Alert tone="danger" title={t("Xatolik", "Error")}>
          {error}
        </Alert>
        <div className="flex gap-3">
          <Button onClick={start} fullWidth>
            {t("Qayta urinish", "Try again")}
          </Button>
          <ButtonLink href="/vocabulary-battle" variant="secondary" fullWidth>
            {t("Orqaga", "Back")}
          </ButtonLink>
        </div>
      </div>
    );
  }

  /* ---------------------------------------------------------- NATIJA */
  if (phase === "done" && session) {
    const accuracy = percent(session.correct_count, session.total_count);

    return (
      <div className="card mx-auto max-w-md animate-pop rounded-2xl p-8 text-center">
        <span className="rounded bg-success/15 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-success">
          {t("O'yin yakunlandi", "Game over")}
        </span>
        <p className="mt-6 text-[13px] uppercase tracking-wide text-muted">{t("Yakuniy ball", "Final score")}</p>
        <p className="mt-1 font-display text-6xl text-gold-400 lining-nums">
          {formatXp(session.score)} XP
        </p>
        <span aria-hidden className="mx-auto my-6 block h-px w-4/5 bg-line" />

        <dl className="space-y-2.5 text-left text-sm">
          <div className="flex justify-between">
            <dt className="text-muted">{t("To'g'ri javoblar", "Correct answers")}:</dt>
            <dd className="font-semibold text-fg tabular-nums">
              {session.correct_count} / {session.total_count}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted">{t("Aniqlik", "Accuracy")}:</dt>
            <dd className="font-semibold text-success tabular-nums">{accuracy}%</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted">{t("Haftalik o'rningiz", "Weekly rank")}:</dt>
            <dd className="font-semibold text-brand-400 tabular-nums">{rank ? `#${rank}` : "—"}</dd>
          </div>
        </dl>

        <div className="mt-7 space-y-3">
          <Button fullWidth onClick={start}>
            {t("Yana o'ynash", "Play again")}
          </Button>
          <ButtonLink href="/leaderboard" variant="secondary" fullWidth>
            {t("Reytingni ko'rish", "See leaderboard")}
          </ButtonLink>
        </div>

        <Link
          href="/vocabulary-battle"
          className="mt-5 block text-center text-sm font-semibold text-muted hover:text-fg"
        >
          {t("Boshqa to'plamni tanlash", "Choose another pack")}
        </Link>
      </div>
    );
  }

  /* ------------------------------------------------------------ O'YIN */
  if (!current) return null;

  const progress = ((index + (phase === "feedback" ? 1 : 0)) / words.length) * 100;
  const timePct = (msLeft / GAME_TIME_LIMIT_MS) * 100;
  const seconds = Math.ceil(msLeft / 1000);

  return (
    <div className="mx-auto max-w-xl rounded-2xl border-[1.5px] border-brand-400/80 bg-ink-900 p-6 shadow-[0_24px_60px_-30px_rgba(16, 191, 166,0.35)] sm:p-8">
      {/* Yuqori qator */}
      <div className="flex items-center justify-between gap-4">
        <span className="text-sm font-semibold tabular-nums text-gold-400">
          {t("Savol", "Question")} {index + 1} / {words.length}
        </span>
        <span className="inline-flex items-center gap-1 rounded bg-ink-700 px-2 py-1 text-[11px] font-semibold text-gold-400">
          ⚡ {packTitle}
        </span>
      </div>

      <div className="mt-4 h-1 overflow-hidden rounded-full bg-ink-700">
        <div
          className="h-full rounded-full bg-brand-400 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Taymer */}
      <div className="mt-3 flex items-center justify-between text-[13px]">
        <span className="text-muted">{t("Qolgan vaqt", "Time left")}</span>
        <span
          className={cn(
            "font-semibold tabular-nums",
            timePct > 50 ? "text-brand-400" : timePct > 20 ? "text-warning" : "text-danger",
          )}
        >
          00:{String(seconds).padStart(2, "0")}
        </span>
      </div>
      <div className="mt-2 h-0.5 overflow-hidden rounded-full bg-ink-800">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-100",
            timePct > 50 ? "bg-brand-400/70" : timePct > 20 ? "bg-warning" : "bg-danger",
          )}
          style={{ width: `${Math.max(0, timePct)}%` }}
        />
      </div>

      {/* Savol */}
      <p key={current.id} className="display-title mt-5 animate-fade-up text-[28px] leading-snug break-words sm:text-[32px]">
        {t(`“${current.word}” so'zining ma'nosi?`, `What does “${current.word}” mean?`)}
      </p>

      {/* Variantlar */}
      <div className="mt-6 space-y-3">
        {(current.options ?? []).map((option, i) => {
          const isSelected = selected === i;
          return (
            <button
              key={`${option}-${i}`}
              type="button"
              disabled={phase === "feedback"}
              onClick={() => answer(i)}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-left text-[15px] transition-all duration-150 active:scale-[0.99]",
                isSelected
                  ? "border-brand-400 bg-brand-400/15 text-fg"
                  : "border-line bg-ink-800 text-fg hover:border-brand-400/60 hover:bg-ink-700",
                phase === "feedback" && !isSelected && "opacity-40",
                phase === "feedback" && "cursor-default",
              )}
            >
              <span className="font-semibold text-muted">{OPTION_LETTERS[i] ?? i + 1}.</span>
              <span className="min-w-0">{option}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-6 flex items-center justify-between text-[13px]">
        <span className="text-muted">{t("Joriy ball", "Current score")}</span>
        <span className="text-lg font-semibold tabular-nums text-fg">{formatXp(localScore)}</span>
      </div>

      <p className="mt-4 text-center text-xs text-faint">
        {t("To'g'ri javob o'yin oxirida serverda hisoblanadi — halol natija kafolatlanadi.", "Correct answers are checked on the server at the end of the game — a fair result is guaranteed.")}
      </p>
    </div>
  );
}
