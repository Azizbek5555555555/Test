import { cn } from "@/lib/format";

// Figma "waveform-container" balandliklari (px, 60 lik konteyner ichida) — takrorlanadi
const HEIGHTS = [20, 16, 22, 37, 33, 37, 51, 45, 47, 59, 50, 50, 59, 47, 45, 51, 37, 32, 37, 21, 16];

/**
 * Bezak to'lqin shakli: `played` foizigacha accent rangda,
 * qolgani xira. Ustunlar navbatma-navbat "nafas oladi".
 */
export function Waveform({
  bars = 160,
  played = 30,
  className,
}: {
  bars?: number;
  played?: number;
  className?: string;
}) {
  return (
    <div className={cn("flex h-[60px] items-center gap-1 overflow-hidden", className)} aria-hidden>
      {Array.from({ length: bars }, (_, i) => {
        const h = HEIGHTS[i % HEIGHTS.length];
        const active = (i / bars) * 100 < played;
        return (
          <span
            key={i}
            className={cn(
              "wave-bar w-1 shrink-0 rounded-full",
              active ? "bg-brand-400" : "bg-ink-600",
            )}
            style={{ height: h, animationDelay: `${(i % 12) * 90}ms` }}
          />
        );
      })}
    </div>
  );
}
