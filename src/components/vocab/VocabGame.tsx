"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { VocabRoundWord, VocabSession } from "@/lib/types";
import {
  GAME_BASE_POINTS,
  GAME_MAX_BONUS,
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

const OPTION_STYLES = [
  "bg-rose-500 hover:bg-rose-600",
  "bg-sky-500 hover:bg-sky-600",
  "bg-amber-500 hover:bg-amber-600",
  "bg-emerald-500 hover:bg-emerald-600",
];

const OPTION_SHAPES = ["▲", "◆", "●", "■"];

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
      setError(result.message ?? "So'zlarni yuklab bo'lmadi.");
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
      setError(result.message ?? "Natijani saqlab bo'lmadi.");
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
      <div className="card p-8 text-center max-w-lg mx-auto">
        <p className="text-5xl mb-4" aria-hidden>
          {packEmoji}
        </p>
        <h1 className="text-2xl font-extrabold">{packTitle}</h1>
        <p className="text-muted mt-3 leading-relaxed">
          {words.length || 20} ta so&apos;z · har biriga 15 soniya. Tez va
          to&apos;g&apos;ri javob bering — qancha tez bo&apos;lsangiz, shuncha
          ko&apos;p ball.
        </p>

        <div className="grid grid-cols-2 gap-3 mt-6 text-sm">
          <div className="rounded-xl bg-[var(--bg-subtle)] border border-line p-3">
            <p className="font-extrabold text-lg">{GAME_BASE_POINTS}</p>
            <p className="text-xs text-muted">to&apos;g&apos;ri javob uchun</p>
          </div>
          <div className="rounded-xl bg-[var(--bg-subtle)] border border-line p-3">
            <p className="font-extrabold text-lg">+{GAME_MAX_BONUS}</p>
            <p className="text-xs text-muted">tezlik bonusi</p>
          </div>
        </div>

        <Button size="lg" fullWidth className="mt-6" onClick={start}>
          🎮 Boshlash
        </Button>
      </div>
    );
  }

  if (phase === "loading") {
    return (
      <div className="card p-12 text-center max-w-lg mx-auto">
        <div className="text-4xl animate-pulse" aria-hidden>
          ⏳
        </div>
        <p className="text-muted mt-4">Tayyorlanmoqda…</p>
      </div>
    );
  }

  if (phase === "error") {
    return (
      <div className="max-w-lg mx-auto space-y-4">
        <Alert tone="danger" title="Xatolik">
          {error}
        </Alert>
        <div className="flex gap-3">
          <Button onClick={start} fullWidth>
            Qayta urinish
          </Button>
          <ButtonLink href="/vocabulary-battle" variant="secondary" fullWidth>
            Orqaga
          </ButtonLink>
        </div>
      </div>
    );
  }

  /* ---------------------------------------------------------- NATIJA */
  if (phase === "done" && session) {
    const accuracy = percent(session.correct_count, session.total_count);

    return (
      <div className="max-w-lg mx-auto">
        <div className="card p-0 overflow-hidden animate-pop">
          <div className="bg-gradient-to-br from-brand-500 via-brand-700 to-brand-900 p-8 text-center text-white">
            <p className="text-5xl mb-3" aria-hidden>
              {accuracy >= 80 ? "🏆" : accuracy >= 50 ? "🎯" : "💪"}
            </p>
            <p className="text-white/80 text-xs font-bold uppercase tracking-[0.2em]">
              Your Score
            </p>
            <p className="text-5xl font-extrabold tabular-nums mt-1">
              {formatXp(session.score)}
            </p>
          </div>

          <div className="p-6">
            <dl className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-[var(--bg-subtle)] border border-line p-4 text-center">
                <dt className="text-xs text-muted font-semibold">
                  Correct Answers
                </dt>
                <dd className="text-2xl font-extrabold tabular-nums mt-1">
                  {session.correct_count}/{session.total_count}
                </dd>
              </div>
              <div className="rounded-xl bg-[var(--bg-subtle)] border border-line p-4 text-center">
                <dt className="text-xs text-muted font-semibold">Your Rank</dt>
                <dd className="text-2xl font-extrabold tabular-nums mt-1">
                  {rank ? `#${rank}` : "—"}
                </dd>
              </div>
            </dl>

            <p className="text-sm text-muted text-center mt-4">
              Aniqlik: <strong className="text-fg">{accuracy}%</strong> ·
              Haftalik reytingdagi o&apos;rningiz yangilandi.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 mt-6">
              <Button fullWidth onClick={start}>
                🔁 Yana o&apos;ynash
              </Button>
              <ButtonLink href="/leaderboard" variant="secondary" fullWidth>
                🏆 Reyting
              </ButtonLink>
            </div>

            <Link
              href="/vocabulary-battle"
              className="block text-center text-sm text-muted hover:text-fg font-semibold mt-4"
            >
              Boshqa to&apos;plamni tanlash
            </Link>
          </div>
        </div>
      </div>
    );
  }

  /* ------------------------------------------------------------ O'YIN */
  if (!current) return null;

  const progress = ((index + (phase === "feedback" ? 1 : 0)) / words.length) * 100;
  const timePct = (msLeft / GAME_TIME_LIMIT_MS) * 100;
  const seconds = Math.ceil(msLeft / 1000);

  return (
    <div className="max-w-3xl mx-auto">
      {/* Yuqori qator */}
      <div className="flex items-center justify-between gap-4 mb-4">
        <span className="text-sm font-bold tabular-nums text-muted">
          {index + 1} / {words.length}
        </span>
        <span className="text-sm font-extrabold tabular-nums text-brand-600 dark:text-brand-400">
          {formatXp(localScore)} ball
        </span>
      </div>

      <div className="h-1.5 rounded-full bg-[var(--bg-subtle)] overflow-hidden mb-6">
        <div
          className="h-full bg-brand-500 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Savol */}
      <div className="card p-8 text-center mb-5">
        <p className="text-xs font-bold uppercase tracking-[0.15em] text-muted mb-3">
          Ushbu so&apos;zning ma&apos;nosi qaysi?
        </p>
        <p className="text-3xl sm:text-4xl font-extrabold tracking-tight break-words">
          {current.word}
        </p>

        {/* Taymer */}
        <div className="mt-6 flex items-center gap-3">
          <div className="h-2.5 flex-1 rounded-full bg-[var(--bg-subtle)] overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-100",
                timePct > 50
                  ? "bg-emerald-500"
                  : timePct > 20
                    ? "bg-amber-500"
                    : "bg-rose-500",
              )}
              style={{ width: `${Math.max(0, timePct)}%` }}
            />
          </div>
          <span className="text-lg font-extrabold tabular-nums w-8 text-right">
            {seconds}
          </span>
        </div>
      </div>

      {/* Variantlar */}
      <div className="grid sm:grid-cols-2 gap-3">
        {(current.options ?? []).map((option, i) => {
          const isSelected = selected === i;
          return (
            <button
              key={`${option}-${i}`}
              type="button"
              disabled={phase === "feedback"}
              onClick={() => answer(i)}
              className={cn(
                "flex items-center gap-3 rounded-2xl p-4 text-left text-white font-bold",
                "transition-all duration-150 active:scale-[0.98] shadow-sm",
                OPTION_STYLES[i % OPTION_STYLES.length],
                phase === "feedback" && !isSelected && "opacity-40",
                isSelected && "ring-4 ring-white/60 scale-[1.02]",
                phase === "feedback" && "cursor-default",
              )}
            >
              <span
                className="w-9 h-9 rounded-xl bg-white/25 grid place-items-center text-base shrink-0"
                aria-hidden
              >
                {OPTION_SHAPES[i % OPTION_SHAPES.length]}
              </span>
              <span className="min-w-0">{option}</span>
            </button>
          );
        })}
      </div>

      <p className="text-center text-xs text-muted mt-5">
        To&apos;g&apos;ri javob o&apos;yin oxirida serverda hisoblanadi — halol
        natija kafolatlanadi.
      </p>
    </div>
  );
}
