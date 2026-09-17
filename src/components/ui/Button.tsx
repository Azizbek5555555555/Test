import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/format";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "ghost"
  | "premium"
  | "danger"
  | "outline";

export type ButtonSize = "sm" | "md" | "lg";

const BASE =
  "inline-flex items-center justify-center gap-2 font-semibold rounded-xl " +
  "transition-all duration-150 select-none whitespace-nowrap " +
  "disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]";

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    "bg-brand-600 text-white hover:bg-brand-700 shadow-sm hover:shadow-md",
  secondary:
    "bg-[var(--bg-subtle)] text-fg hover:bg-[var(--border)] border border-line",
  ghost: "text-fg hover:bg-[var(--bg-subtle)]",
  outline:
    "border-2 border-brand-600 text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-950/40",
  premium:
    "bg-gradient-to-r from-gold-400 to-gold-500 text-gold-950 hover:from-gold-300 " +
    "hover:to-gold-400 shadow-sm hover:shadow-md",
  danger: "bg-rose-600 text-white hover:bg-rose-700",
};

const SIZES: Record<ButtonSize, string> = {
  sm: "text-sm px-3 py-1.5",
  md: "text-sm px-4 py-2.5",
  lg: "text-base px-6 py-3.5",
};

interface CommonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  className?: string;
  children: ReactNode;
}

export function Button({
  variant = "primary",
  size = "md",
  fullWidth,
  className,
  children,
  ...rest
}: CommonProps & ComponentProps<"button">) {
  return (
    <button
      className={cn(
        BASE,
        VARIANTS[variant],
        SIZES[size],
        fullWidth && "w-full",
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

export function ButtonLink({
  variant = "primary",
  size = "md",
  fullWidth,
  className,
  children,
  ...rest
}: CommonProps & ComponentProps<typeof Link>) {
  return (
    <Link
      className={cn(
        BASE,
        VARIANTS[variant],
        SIZES[size],
        fullWidth && "w-full",
        className,
      )}
      {...rest}
    >
      {children}
    </Link>
  );
}
