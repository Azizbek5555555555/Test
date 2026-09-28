"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { setPartsAudioAction } from "@/lib/actions/admin";
import {
  compressAudio,
  formatMb,
  needsCompression,
} from "@/lib/audio-compress";
import { Button } from "@/components/ui/Button";
import { Alert, ProgressBar } from "@/components/ui/Card";

const AUDIO_BUCKET = "audio";
/** Supabase bepul tarifidagi chegara */
const MAX_UPLOAD_BYTES = 50 * 1024 * 1024;

type Status = "idle" | "compressing" | "uploading" | "saving" | "done" | "error";

/**
 * Admin: audio faylni tanlash → (kerak bo'lsa) brauzerda kichraytirish →
 * Supabase Storage'ga yuklash → bo'lim(lar)ga ulash.
 */
export function AudioUpload({
  testSetId,
  partIds,
  currentUrl,
  hint,
}: {
  testSetId: string;
  /** Bir nechta bo'lim — hammasiga bitta audio (Full Mock Listening) */
  partIds: string[];
  currentUrl: string | null;
  hint?: string;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [progress, setProgress] = useState(0);
  const [stageText, setStageText] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  const busy =
    status === "compressing" || status === "uploading" || status === "saving";

  async function handleFile(file: File) {
    setMessage(null);
    setProgress(0);

    if (!file.type.startsWith("audio/") && !/\.(mp3|m4a|wav|ogg|aac)$/i.test(file.name)) {
      setStatus("error");
      setMessage("Bu audio fayl emas. MP3 (yoki M4A/WAV) fayl tanlang.");
      return;
    }

    let blob: Blob = file;
    try {
      if (needsCompression(file)) {
        setStatus("compressing");
        setStageText(`Audio kichraytirilmoqda (${formatMb(file.size)})…`);
        blob = await compressAudio(file, (fraction, stage) => {
          setProgress(stage === "decode" ? 5 : 5 + fraction * 90);
          setStageText(
            stage === "decode"
              ? `Audio o'qilmoqda (${formatMb(file.size)})…`
              : "Audio kichraytirilmoqda…",
          );
        });
      }
    } catch {
      setStatus("error");
      setMessage(
        "Audioni o'qib bo'lmadi. Fayl buzilmaganini tekshiring yoki Google Chrome'da urinib ko'ring.",
      );
      return;
    }

    if (blob.size > MAX_UPLOAD_BYTES) {
      setStatus("error");
      setMessage(
        `Fayl juda katta (${formatMb(blob.size)}). 50 MB dan kichik bo'lishi kerak.`,
      );
      return;
    }

    setStatus("uploading");
    setProgress(96);
    setStageText(`Yuklanmoqda (${formatMb(blob.size)})… sahifani yopmang`);

    const supabase = createClient();
    const path = `tests/${testSetId}/${Date.now()}.mp3`;
    const { error: uploadError } = await supabase.storage
      .from(AUDIO_BUCKET)
      .upload(path, blob, { contentType: "audio/mpeg", upsert: false });

    if (uploadError) {
      setStatus("error");
      setMessage(`Yuklab bo'lmadi: ${uploadError.message}`);
      return;
    }

    const { data } = supabase.storage.from(AUDIO_BUCKET).getPublicUrl(path);

    setStatus("saving");
    setStageText("Bo'limga ulanmoqda…");
    const result = await setPartsAudioAction(testSetId, partIds, data.publicUrl);
    if (!result.ok) {
      setStatus("error");
      setMessage(result.message ?? "Xatolik yuz berdi.");
      return;
    }

    setStatus("done");
    setProgress(100);
    setMessage(
      blob === file
        ? `Audio yuklandi (${formatMb(blob.size)}).`
        : `Audio yuklandi: ${formatMb(file.size)} → ${formatMb(blob.size)}.`,
    );
    router.refresh();
  }

  async function removeAudio() {
    if (!window.confirm("Audioni bu bo'limdan olib tashlaysizmi?")) return;
    setStatus("saving");
    setStageText("Olib tashlanmoqda…");
    const result = await setPartsAudioAction(testSetId, partIds, null);
    setStatus(result.ok ? "done" : "error");
    setMessage(result.message ?? null);
    router.refresh();
  }

  return (
    <div className="space-y-3">
      {currentUrl ? (
        <audio src={currentUrl} controls preload="none" className="w-full" />
      ) : (
        <p className="text-sm text-muted">Hozircha audio yo&apos;q.</p>
      )}

      {hint ? <p className="text-xs text-muted leading-relaxed">{hint}</p> : null}

      <input
        ref={inputRef}
        type="file"
        accept="audio/*,.mp3,.m4a,.wav"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) void handleFile(file);
        }}
      />

      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          size="sm"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
        >
          🎧 {currentUrl ? "Audioni almashtirish" : "Audio yuklash"}
        </Button>
        {currentUrl ? (
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={() => void removeAudio()}
            disabled={busy}
          >
            🗑 Olib tashlash
          </Button>
        ) : null}
      </div>

      {busy ? (
        <div className="space-y-1.5" aria-live="polite">
          <p className="text-sm font-semibold">{stageText}</p>
          <ProgressBar value={progress} showLabel />
        </div>
      ) : null}

      {message && !busy ? (
        <Alert tone={status === "error" ? "danger" : "success"}>{message}</Alert>
      ) : null}
    </div>
  );
}
