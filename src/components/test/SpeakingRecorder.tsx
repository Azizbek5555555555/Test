"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createClient } from "@/lib/supabase/client";
import type { AnswerValue } from "@/lib/types";
import { Textarea } from "@/components/ui/Field";
import { cn, formatClock } from "@/lib/format";

const MAX_SECONDS = 180;
export const SPEAKING_BUCKET = "speaking";

/** useSyncExternalStore uchun: bu qiymat hech qachon o'zgarmaydi */
function subscribeNoop(): () => void {
  return () => {};
}

function getRecorderSupport(): boolean {
  return (
    typeof window.MediaRecorder !== "undefined" &&
    Boolean(navigator.mediaDevices?.getUserMedia)
  );
}

type Status = "idle" | "recording" | "uploading" | "done" | "error";

function readAnswer(value: AnswerValue): { text: string; audio: string } {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const record = value as Record<string, string>;
    return { text: record.text ?? "", audio: record.audio ?? "" };
  }
  if (typeof value === "string") return { text: value, audio: "" };
  return { text: "", audio: "" };
}

export function SpeakingRecorder({
  questionId,
  value,
  onChange,
  disabled,
  uploadContext,
}: {
  questionId: string;
  value: AnswerValue;
  onChange: (value: AnswerValue) => void;
  disabled?: boolean;
  uploadContext?: { attemptId: string; userId: string };
}) {
  const answer = readAnswer(value);

  const [status, setStatus] = useState<Status>(answer.audio ? "done" : "idle");
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Brauzer ovoz yozishni qo'llab-quvvatlaydimi (server renderida — yo'q)
  const supported = useSyncExternalStore(
    subscribeNoop,
    getRecorderSupport,
    () => false,
  );

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Komponent yopilganda mikrofon va taymerni to'xtatamiz
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      streamRef.current?.getTracks().forEach((track) => track.stop());
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  function updateText(text: string) {
    onChange({ text, audio: answer.audio });
  }

  async function startRecording() {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];

      const recorder = new MediaRecorder(stream);
      recorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };

      recorder.onstop = () => {
        streamRef.current?.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        const blob = new Blob(chunksRef.current, {
          type: recorder.mimeType || "audio/webm",
        });
        void uploadRecording(blob);
      };

      recorder.start();
      setStatus("recording");
      setSeconds(0);

      timerRef.current = setInterval(() => {
        setSeconds((prev) => {
          if (prev + 1 >= MAX_SECONDS) {
            stopRecording();
            return MAX_SECONDS;
          }
          return prev + 1;
        });
      }, 1000);
    } catch {
      setError(
        "Mikrofonga ruxsat berilmadi. Javobingizni matn ko'rinishida yozishingiz mumkin.",
      );
      setStatus("error");
    }
  }

  function stopRecording() {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (recorderRef.current?.state === "recording") {
      recorderRef.current.stop();
    }
  }

  async function uploadRecording(blob: Blob) {
    const localUrl = URL.createObjectURL(blob);
    setPreviewUrl(localUrl);

    if (!uploadContext) {
      setStatus("done");
      return;
    }

    setStatus("uploading");
    try {
      const supabase = createClient();
      const path = `${uploadContext.userId}/${uploadContext.attemptId}/${questionId}.webm`;

      const { error: uploadError } = await supabase.storage
        .from(SPEAKING_BUCKET)
        .upload(path, blob, {
          upsert: true,
          contentType: blob.type || "audio/webm",
        });

      if (uploadError) {
        setError(
          "Audio yuklanmadi. Javobingizni matn ko'rinishida ham yozib qo'ying.",
        );
        setStatus("error");
        return;
      }

      onChange({ text: answer.text, audio: path });
      setStatus("done");
    } catch {
      setError("Audio yuklanmadi. Matn ko'rinishida yozib qo'ying.");
      setStatus("error");
    }
  }

  function resetRecording() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setSeconds(0);
    setStatus("idle");
    setError(null);
    onChange({ text: answer.text, audio: "" });
  }

  return (
    <div className="space-y-3">
      {supported ? (
        <div className="rounded-xl border border-line bg-[var(--bg-subtle)] p-4">
          <div className="flex flex-wrap items-center gap-3">
            {status === "recording" ? (
              <button
                type="button"
                onClick={stopRecording}
                disabled={disabled}
                className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5
                           text-sm font-bold text-white hover:bg-rose-700 transition-colors"
              >
                <span className="w-2.5 h-2.5 rounded-sm bg-white" aria-hidden />
                To&apos;xtatish
              </button>
            ) : (
              <button
                type="button"
                onClick={startRecording}
                disabled={disabled || status === "uploading"}
                className={cn(
                  "inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold",
                  "bg-brand-600 text-white hover:bg-brand-700 transition-colors",
                  "disabled:opacity-50 disabled:pointer-events-none",
                )}
              >
                <span className="w-2.5 h-2.5 rounded-full bg-white" aria-hidden />
                {status === "done" ? "Qayta yozish" : "Yozishni boshlash"}
              </button>
            )}

            {status === "recording" ? (
              <span className="inline-flex items-center gap-2 text-sm font-bold text-rose-600 tabular-nums">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" aria-hidden />
                {formatClock(seconds)} / {formatClock(MAX_SECONDS)}
              </span>
            ) : null}

            {status === "uploading" ? (
              <span className="text-sm text-muted">Yuklanmoqda…</span>
            ) : null}

            {status === "done" && answer.audio ? (
              <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                ✅ Yozildi va saqlandi
              </span>
            ) : null}

            {(previewUrl || status === "done") && status !== "recording" ? (
              <button
                type="button"
                onClick={resetRecording}
                disabled={disabled}
                className="text-sm text-muted hover:text-fg font-semibold ml-auto"
              >
                O&apos;chirish
              </button>
            ) : null}
          </div>

          {previewUrl ? (
            <audio
              src={previewUrl}
              controls
              className="w-full mt-3"
              preload="metadata"
            />
          ) : null}

          {error ? (
            <p className="text-xs text-amber-700 dark:text-amber-400 mt-3 leading-relaxed">
              ⚠️ {error}
            </p>
          ) : null}
        </div>
      ) : (
        <p className="text-xs text-muted">
          Brauzeringiz ovoz yozishni qo&apos;llab-quvvatlamaydi — javobingizni
          matn ko&apos;rinishida yozing.
        </p>
      )}

      <Textarea
        value={answer.text}
        onChange={(e) => updateText(e.target.value)}
        disabled={disabled}
        placeholder="Javobingizning asosiy fikrlarini shu yerga yozing (ixtiyoriy, lekin tavsiya etiladi)…"
        className="min-h-32"
      />
    </div>
  );
}
