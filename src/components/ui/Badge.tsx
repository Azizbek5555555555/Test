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

const TONES: Record<Tone, string> = {
  neutral:
    "bg-[var(--bg-subtle)] text-muted border border-line",
  brand: "bg-brand-50 text-brand-700 border border-brand-200 dark:bg-brand-950/50 dark:text-brand-300 dark:border-brand-800",
  success:
    "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800",
  warning:
    "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800",
  danger:
    "bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800",
  info: "bg-sky-50 text-sky-700 border border-sky-200 dark:bg-sky-950/50 dark:text-sky-300 dark:border-sky-800",
  premium:
    "bg-gradient-to-r from-gold-100 to-gold-200 text-gold-800 border border-gold-300 " +
    "dark:from-gold-950/60 dark:to-gold-900/60 dark:text-gold-300 dark:border-gold-800",
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
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold",
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
  if (unlocked) {
    return <Badge tone="premium">⭐ PREMIUM</Badge>;
  }
  return <Badge tone="premium">🔒 PREMIUM</Badge>;
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
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-3 py-1",
    lg: "text-2xl px-5 py-2",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-lg font-bold text-white tracking-wide",
        CEFR_COLOR[level] ?? "bg-ink-500",
        sizes[size],
      )}
    >
      {level}
    </span>
  );
}
