"use client";

import { useT } from "@/i18n/client";
import { useState } from "react";
import type { AnswerMap, AnswerValue, ArticleQuestionPublic } from "@/lib/types";
import {
  submitArticleAnswersAction,
  type ArticleResultEntry,
} from "@/lib/actions/articles";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";
import { Alert } from "@/components/ui/Card";
import { cn, percent } from "@/lib/format";

export function ArticleQuiz({
  articleId,
  questions,
  signedIn,
  loginHref,
}: {
  articleId: string;
  questions: ArticleQuestionPublic[];
  signedIn: boolean;
  loginHref: string;
}) {
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [results, setResults] = useState<Record<
    string,
    ArticleResultEntry
  > | null>(null);
  const [score, setScore] = useState<{ correct: number; total: number } | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const t = useT();

  if (questions.length === 0) return null;

  const answeredCount = questions.filter((q) => {
    const value = answers[q.id];
    return typeof value === "string" ? value.trim() !== "" : value != null;
  }).length;

  function setAnswer(questionId: string, value: AnswerValue) {
    if (results) return; // tekshirilgandan keyin o'zgartirilmaydi
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  }

  async function check() {
    setLoading(true);
    setError(null);
    const result = await submitArticleAnswersAction(articleId, answers);
    setLoading(false);

    if (!result.ok) {
      setError(result.message ?? t("Xatolik yuz berdi.", "Something went wrong."));
      return;
    }

    setResults(result.results ?? {});
    setScore({
      correct: result.correctCount ?? 0,
      total: result.totalCount ?? questions.length,
    });
  }

  function reset() {
    setAnswers({});
    setResults(null);
    setScore(null);
    setError(null);
  }

  return (
    <section className="mt-12">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <h2 className="text-2xl font-extrabold">Reading questions</h2>
        <span className="text-sm text-muted tabular-nums">
          {results ? t("Tekshirildi", "Checked") : `${answeredCount} / ${questions.length}`}
        </span>
      </div>

      {score ? (
        <div className="mb-6">
          <Alert
            tone={
              percent(score.correct, score.total) >= 70 ? "success" : "warning"
            }
            title={`${t("Natija", "Result")}: ${score.correct} / ${score.total} (${percent(score.correct, score.total)}%)`}
          >
            {percent(score.correct, score.total) >= 70
              ? t("Ajoyib! Bu matnni yaxshi tushundingiz.", "Great! You understood this text well.")
              : t(
                  "Xato qilgan savollaringizni ko'rib chiqing — pastda to'g'ri javob va izoh bor.",
                  "Review the questions you got wrong — the correct answer and explanation are below.",
                )}
          </Alert>
        </div>
      ) : null}

      {error ? (
        <div className="mb-5">
          <Alert tone="danger">{error}</Alert>
        </div>
      ) : null}

      <ol className="space-y-4">
        {questions.map((question, index) => {
          const result = results?.[question.id];
          const value = answers[question.id] ?? null;

          return (
            <li
              key={question.id}
              className={cn(
                "card p-5 border",
                result
                  ? result.correct
                    ? "border-success/40"
                    : "border-danger/40"
                  : "border-line",
              )}
            >
              <div className="flex gap-3">
                <span
                  className={cn(
                    "shrink-0 w-7 h-7 rounded-lg grid place-items-center text-sm font-bold",
                    result
                      ? result.correct
                        ? "bg-success text-white"
                        : "bg-danger text-white"
                      : "bg-brand-400 text-ink-950",
                  )}
                  aria-hidden
                >
                  {result ? (result.correct ? "✓" : "✕") : index + 1}
                </span>

                <div className="min-w-0 flex-1">
                  <p className="font-semibold leading-relaxed">
                    {question.prompt}
                  </p>

                  <div className="mt-3">
                    {question.kind === "gap_fill" ||
                    question.kind === "short_answer" ? (
                      <Input
                        type="text"
                        value={typeof value === "string" ? value : ""}
                        onChange={(e) => setAnswer(question.id, e.target.value)}
                        disabled={Boolean(results)}
                        placeholder={t("Javobingizni yozing…", "Type your answer…")}
                        className="max-w-sm"
                        autoComplete="off"
                      />
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {(question.options ?? []).map((option, i) => {
                          const selected = value === option;
                          return (
                            <button
                              key={`${option}-${i}`}
                              type="button"
                              disabled={Boolean(results)}
                              onClick={() => setAnswer(question.id, option)}
                              className={cn(
                                "px-3.5 py-2 rounded-xl text-sm font-semibold border-2 transition-all text-left",
                                selected
                                  ? "border-brand-400 bg-brand-400 text-ink-950"
                                  : "border-line text-muted hover:border-brand-400 hover:text-fg",
                                results && "cursor-default",
                              )}
                            >
                              {option}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {result && !result.correct ? (
                    <p className="text-sm mt-3 font-semibold text-success">
                      {t("To'g'ri javob", "Correct answer")}: {formatCorrect(result.answer)}
                    </p>
                  ) : null}

                  {result?.explanation ? (
                    <p className="text-sm text-muted mt-2 leading-relaxed border-l-2 border-line pl-3">
                      💡 {result.explanation}
                    </p>
                  ) : null}
                </div>
              </div>
            </li>
          );
        })}
      </ol>

      <div className="flex flex-wrap gap-3 mt-6">
        {!signedIn ? (
          <ButtonLink href={loginHref} size="lg">
            {t("Javoblarni tekshirish uchun kiring", "Log in to check your answers")}
          </ButtonLink>
        ) : results ? (
          <Button variant="secondary" size="lg" onClick={reset}>
            {t("Qayta ishlash", "Try again")}
          </Button>
        ) : (
          <Button
            size="lg"
            onClick={check}
            disabled={loading || answeredCount === 0}
          >
            {loading ? t("Tekshirilmoqda…", "Checking…") : t("Javoblarni tekshirish", "Check answers")}
          </Button>
        )}
      </div>
    </section>
  );
}

function formatCorrect(value: unknown): string {
  if (value == null) return "—";
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.map(String).join(" / ");
  return String(value);
}
