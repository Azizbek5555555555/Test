"use client";

import { useT } from "@/i18n/client";
import { useRef, useState } from "react";
import { cn, formatClock } from "@/lib/format";

/**
 * Listening bo'limi uchun audio pleyer.
 * `singlePlay` yoqilganda audio faqat BIR MARTA ijro etiladi —
 * real Multilevel imtihonidagidek.
 *
 * ESLATMA: bo'lim almashganda holat tozalanishi uchun ota-komponent
 * bu komponentga `key={part.id}` beradi — shuning uchun ichida
 * "reset" effekti kerak emas.
 */
export function AudioPlayer({
  src,
  singlePlay,
  label = "Listening audio",
}: {
  src: string | null | undefined;
  singlePlay?: boolean;
  label?: string;
}) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [played, setPlayed] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [failed, setFailed] = useState(false);
  const t = useT();

  if (!src) {
    return (
      <div
        className="rounded-xl border p-4 text-sm
                    border-warning/40 bg-warning/10 text-warning"
      >
        🎧 <strong>{t("Bu bo'lim uchun audio tez orada qo'shiladi.", "Audio for this section will be added soon.")}</strong>{" "}
        {t("Hozircha keyingi bo'limga o'tishingiz mumkin.", "For now you can move on to the next section.")}
      </div>
    );
  }

  if (failed) {
    return (
      <div
        className="rounded-xl border p-4 text-sm
                    border-danger/40 bg-danger/10 text-danger"
      >
        ⛔{" "}
        {t(
          "Audio faylni yuklab bo'lmadi. Sahifani yangilang yoki administratorga murojaat qiling.",
          "Could not load the audio file. Refresh the page or contact an administrator.",
        )}
      </div>
    );
  }

  const blocked = Boolean(singlePlay && played && !playing);

  function toggle() {
    const audio = audioRef.current;
    if (!audio) return;

    if (playing) {
      audio.pause();
      return;
    }
    if (blocked) return;

    void audio.play().catch(() => setFailed(true));
  }

  return (
    <div className="card p-4">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={toggle}
          disabled={blocked}
          aria-label={playing ? t("Pauza", "Pause") : t("Ijro etish", "Play")}
          className={cn(
            "w-12 h-12 rounded-full grid place-items-center text-lg shrink-0 transition-colors",
            blocked
              ? "bg-[var(--bg-subtle)] text-muted cursor-not-allowed"
              : "bg-brand-400 text-ink-950 hover:bg-brand-300",
          )}
        >
          {playing ? "⏸" : "▶"}
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <p className="text-sm font-bold truncate">{label}</p>
            <span className="text-xs text-muted tabular-nums shrink-0">
              {formatClock(current)} / {formatClock(duration)}
            </span>
          </div>

          <div className="h-1.5 rounded-full bg-[var(--bg-subtle)] overflow-hidden">
            <div
              className="h-full bg-brand-500 transition-all"
              style={{
                width: duration ? `${(current / duration) * 100}%` : "0%",
              }}
            />
          </div>

          {singlePlay ? (
            <p className="text-xs text-muted mt-1.5">
              {blocked
                ? `🔒 ${t(
                    "Audio allaqachon ijro etilgan — imtihon qoidasiga ko'ra qayta tinglab bo'lmaydi.",
                    "The audio has already been played — under exam rules it cannot be replayed.",
                  )}`
                : `⚠️ ${t("Bu audio faqat bir marta ijro etiladi.", "This audio plays only once.")}`}
            </p>
          ) : null}
        </div>
      </div>

      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        controls={!singlePlay}
        className={cn("w-full mt-3", singlePlay && "hidden")}
        onPlay={() => {
          setPlaying(true);
          setPlayed(true);
        }}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
        onTimeUpdate={(e) => setCurrent(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration || 0)}
        onError={() => setFailed(true)}
      />
    </div>
  );
}
