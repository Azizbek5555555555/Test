import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/format";

/**
 * Figma: "Progress ring" — ingichka fon aylana + rangli yoy.
 * Sahifa ochilganda yoy 0 dan qiymatgacha to'ladi (globals.css: ml-ring).
 */
export function ProgressRing({
  value,
  size = 120,
  stroke = 8,
  color = "var(--accent)",
  track = "var(--color-ink-700)",
  className,
  children,
}: {
  /** 0–100 */
  value: number;
  size?: number;
  stroke?: number;
  color?: string;
  track?: string;
  className?: string;
  children?: ReactNode;
}) {
  const r = (size - stroke) / 2;
  const full = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(100, value));
  const offset = full * (1 - clamped / 100);

  return (
    <div className={cn("relative grid place-items-center", className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={full}
          strokeDashoffset={offset}
          className="animate-ring"
          style={{ "--ring-full": `${full}` } as CSSProperties}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">{children}</div>
    </div>
  );
}
