"use client";

import { useId } from "react";
import type {
  AnswerValue,
  MatchingOption,
  PublicQuestion,
  QuestionKind,
} from "@/lib/types";
import { cn, countWords } from "@/lib/format";
import { Textarea, Input, Select } from "@/components/ui/Field";
import { SpeakingRecorder } from "./SpeakingRecorder";

export const AUTO_GRADED: QuestionKind[] = [
  "mcq",
  "multi_select",
  "true_false_ng",
  "gap_fill",
  "matching",
  "short_answer",
];

export const MANUAL_GRADED: QuestionKind[] = ["essay", "speaking_prompt"];

function asStringOptions(options: unknown): string[] {
  if (!Array.isArray(options)) return [];
  return options.filter((o): o is string => typeof o === "string");
}

function asMatchingOptions(options: unknown): MatchingOption[] {
  if (!Array.isArray(options)) return [];
  return options.filter(
    (o): o is MatchingOption =>
      typeof o === "object" &&
      o !== null &&
      "left" in o &&
      "right" in o &&
      Array.isArray((o as MatchingOption).right),
  );
}

export interface QuestionRendererProps {
  question: PublicQuestion;
  number: number;
  value: AnswerValue;
  onChange: (value: AnswerValue) => void;
  disabled?: boolean;
  /** Speaking javoblarini yuklash uchun */
  uploadContext?: { attemptId: string; userId: string };
}

export function QuestionRenderer({
  question,
  number,
  value,
  onChange,
  disabled,
  uploadContext,
}: QuestionRendererProps) {
  const groupId = useId();

  return (
    <div className="scroll-mt-24" id={`q-${question.id}`}>
      <div className="flex gap-3">
        <span
          className="shrink-0 w-7 h-7 rounded-lg bg-brand-600 text-white
                     grid place-items-center text-sm font-bold tabular-nums"
          aria-hidden
        >
          {number}
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold leading-relaxed whitespace-pre-line">
            {question.prompt}
          </p>
          {question.help_text ? (
            <p className="text-xs text-muted mt-1.5">{question.help_text}</p>
          ) : null}

          <div className="mt-3.5">
            {renderControl({
              question,
              value,
              onChange,
              disabled,
              groupId,
              uploadContext,
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function renderControl({
  question,
  value,
  onChange,
  disabled,
  groupId,
  uploadContext,
}: {
  question: PublicQuestion;
  value: AnswerValue;
  onChange: (value: AnswerValue) => void;
  disabled?: boolean;
  groupId: string;
  uploadContext?: { attemptId: string; userId: string };
}) {
  switch (question.kind) {
    /* ------------------------------------------------------------ MCQ */
    case "mcq": {
      const options = asStringOptions(question.options);
      return (
        <div className="space-y-2">
          {options.map((option, i) => {
            const selected = value === option;
            return (
              <label
                key={`${option}-${i}`}
                className={cn(
                  "flex items-start gap-3 rounded-xl border p-3 cursor-pointer transition-all",
                  selected
                    ? "border-brand-500 bg-brand-50 dark:bg-brand-950/40 ring-1 ring-brand-500/40"
                    : "border-line hover:border-brand-300 hover:bg-[var(--bg-subtle)]",
                  disabled && "cursor-not-allowed opacity-70",
                )}
              >
                <input
                  type="radio"
                  name={groupId}
                  className="sr-only"
                  checked={selected}
                  onChange={() => onChange(option)}
                  disabled={disabled}
                />
                <span
                  className={cn(
                    "shrink-0 w-6 h-6 rounded-full border-2 grid place-items-center text-xs font-bold",
                    selected
                      ? "border-brand-600 bg-brand-600 text-white"
                      : "border-ink-300 dark:border-ink-600 text-muted",
                  )}
                  aria-hidden
                >
                  {String.fromCharCode(65 + i)}
                </span>
                <span className="text-sm leading-relaxed pt-0.5">{option}</span>
              </label>
            );
          })}
        </div>
      );
    }

    /* --------------------------------------------------- MULTI SELECT */
    case "multi_select": {
      const options = asStringOptions(question.options);
      const selected = Array.isArray(value) ? value : [];
      return (
        <div className="space-y-2">
          {options.map((option, i) => {
            const checked = selected.includes(option);
            return (
              <label
                key={`${option}-${i}`}
                className={cn(
                  "flex items-start gap-3 rounded-xl border p-3 cursor-pointer transition-all",
                  checked
                    ? "border-brand-500 bg-brand-50 dark:bg-brand-950/40 ring-1 ring-brand-500/40"
                    : "border-line hover:border-brand-300 hover:bg-[var(--bg-subtle)]",
                  disabled && "cursor-not-allowed opacity-70",
                )}
              >
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={checked}
                  disabled={disabled}
                  onChange={() => {
                    const next = checked
                      ? selected.filter((v) => v !== option)
                      : [...selected, option];
                    onChange(next);
                  }}
                />
                <span
                  className={cn(
                    "shrink-0 w-6 h-6 rounded-md border-2 grid place-items-center text-xs font-bold",
                    checked
                      ? "border-brand-600 bg-brand-600 text-white"
                      : "border-ink-300 dark:border-ink-600 text-muted",
                  )}
                  aria-hidden
                >
                  {checked ? "✓" : String.fromCharCode(65 + i)}
                </span>
                <span className="text-sm leading-relaxed pt-0.5">{option}</span>
              </label>
            );
          })}
        </div>
      );
    }

    /* ------------------------------------------------ TRUE/FALSE/NG */
    case "true_false_ng": {
      const options = asStringOptions(question.options);
      const list = options.length ? options : ["TRUE", "FALSE", "NOT GIVEN"];
      return (
        <div className="flex flex-wrap gap-2">
          {list.map((option) => {
            const selected = value === option;
            return (
              <button
                key={option}
                type="button"
                disabled={disabled}
                onClick={() => onChange(selected ? null : option)}
                className={cn(
                  "px-4 py-2 rounded-xl text-sm font-bold border-2 transition-all",
                  selected
                    ? "border-brand-600 bg-brand-600 text-white"
                    : "border-line hover:border-brand-400 text-muted hover:text-fg",
                  disabled && "cursor-not-allowed opacity-70",
                )}
              >
                {option}
              </button>
            );
          })}
        </div>
      );
    }

    /* ------------------------------------------- GAP FILL / SHORT ANSWER */
    case "gap_fill":
    case "short_answer":
      return (
        <Input
          type="text"
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          placeholder="Javobingizni yozing…"
          className="max-w-sm"
          autoComplete="off"
          spellCheck={false}
        />
      );

    /* ------------------------------------------------------- MATCHING */
    case "matching": {
      const rows = asMatchingOptions(question.options);
      const current =
        value && typeof value === "object" && !Array.isArray(value)
          ? (value as Record<string, string>)
          : {};

      return (
        <div className="space-y-2.5">
          {rows.map((row) => (
            <div
              key={row.left}
              className="flex flex-wrap items-center gap-3 rounded-xl border border-line
                         bg-[var(--bg-subtle)] p-3"
            >
              <span className="text-sm font-semibold min-w-0 flex-1">
                {row.label}
              </span>
              <Select
                value={current[row.left] ?? ""}
                disabled={disabled}
                onChange={(e) =>
                  onChange({ ...current, [row.left]: e.target.value })
                }
                className="max-w-[240px] bg-surface"
                aria-label={row.label}
              >
                <option value="">— tanlang —</option>
                {row.right.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </Select>
            </div>
          ))}
        </div>
      );
    }

    /* ---------------------------------------------------------- ESSAY */
    case "essay": {
      const text = typeof value === "string" ? value : "";
      const words = countWords(text);
      return (
        <div>
          <Textarea
            value={text}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            placeholder="Javobingizni shu yerga yozing…"
            className="min-h-64 font-[inherit] leading-relaxed"
            spellCheck={false}
          />
          <div className="flex items-center justify-between mt-2 text-xs">
            <span className="text-muted">
              Javobingiz o&apos;qituvchi tomonidan tekshiriladi.
            </span>
            <span
              className={cn(
                "font-bold tabular-nums",
                words < 100 ? "text-muted" : "text-emerald-600 dark:text-emerald-400",
              )}
            >
              {words} so&apos;z
            </span>
          </div>
        </div>
      );
    }

    /* ------------------------------------------------ SPEAKING PROMPT */
    case "speaking_prompt":
      return (
        <SpeakingRecorder
          questionId={question.id}
          value={value}
          onChange={onChange}
          disabled={disabled}
          uploadContext={uploadContext}
        />
      );

    default:
      return null;
  }
}
