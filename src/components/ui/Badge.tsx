import type { ReactNode } from "react";
import { cn } from "@/lib/format";
import { CEFR_COLOR } from "@/lib/constants";

type Tone =
  | "neutral"
  | "brand"
  | "success"
  | "warning"
  | "danger"
  | "premium"
  | "info";

// Figma: "System badges" — to'la rangli pill, to'q (ink) matn, Inter Bold 11px
const TONES: Record<Tone, string> = {
  neutral: "bg-ink-800 text-muted border border-line",
  brand: "bg-brand-400 text-ink-950",
  success: "bg-success text-ink-950",
  warning: "bg-warning text-ink-950",
  danger: "bg-danger text-ink-950",
  info: "bg-ink-800 text-ink-200 border border-line",
  premium: "bg-gold-400 text-ink-950",
};

export function Badge({
  tone = "neutral",
  children,
  className,
}: {
  tone?: Tone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold leading-none tracking-[0.02em]",
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/**
 * FREE / 🔒 PREMIUM belgisi — hujjatning 8-bo'limidagi ko'rinish.
 */
export function AccessBadge({
  isPremium,
  unlocked,
}: {
  isPremium: boolean;
  unlocked?: boolean;
}) {
  if (!isPremium) {
    return <Badge tone="success">FREE</Badge>;
  }
  return (
    <Badge tone="premium">
      {unlocked ? (
        <span aria-hidden>★</span>
      ) : (
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" aria-hidden>
          <rect x="4" y="11" width="16" height="10" rx="2" stroke="currentColor" strokeWidth="2.5" />
          <path d="M8 11V7a4 4 0 1 1 8 0v4" stroke="currentColor" strokeWidth="2.5" />
        </svg>
      )}
      PREMIUM
    </Badge>
  );
}

export function CefrBadge({
  level,
  size = "md",
}: {
  level: string | null | undefined;
  size?: "sm" | "md" | "lg";
}) {
  if (!level) return null;
  const sizes = {
    sm: "text-[10px] px-2 py-0.5",
    md: "text-xs px-3 py-1",
    lg: "text-2xl px-5 py-2 font-display font-semibold",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-bold text-ink-950 tracking-wide",
        CEFR_COLOR[level] ?? "bg-ink-500",
        sizes[size],
      )}
    >
      {level}
    </span>
  );
}
