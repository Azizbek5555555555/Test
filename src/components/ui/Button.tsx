import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/format";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "ghost"
  | "premium"
  | "danger"
  | "outline"
  | "light"
  | "glass";

export type ButtonSize = "sm" | "md" | "lg";

// Figma: tugmalar "pill" (999px), Inter 600
const BASE =
  "inline-flex items-center justify-center gap-2 font-semibold rounded-full " +
  "transition-all duration-200 select-none whitespace-nowrap " +
  "disabled:opacity-40 disabled:pointer-events-none active:scale-[0.98]";

const VARIANTS: Record<ButtonVariant, string> = {
  // accent/base fon + ink matn; hover → accent/hover
  primary:
    "bg-brand-400 text-on-accent hover:bg-brand-300 hover:shadow-[0_8px_24px_-8px_rgba(16, 191, 166,0.55)]",
  // 1.5px accent chegara; hover → to'liq accent
  secondary:
    "border-[1.5px] border-brand-400 text-fg hover:bg-brand-400 hover:text-on-accent",
  ghost: "text-muted hover:text-fg hover:bg-ink-800",
  outline:
    "border-[1.5px] border-brand-400 text-brand-400 hover:bg-brand-400 hover:text-on-accent",
  premium:
    "bg-gold-400 text-on-accent hover:bg-gold-300 hover:shadow-[0_8px_24px_-8px_rgba(58, 160, 227,0.55)]",
  danger: "bg-danger text-on-accent hover:brightness-110",
  light: "bg-ink-50 text-on-accent hover:bg-white",
  glass: "bg-hi/5 text-fg border border-hi/10 hover:bg-hi/10 backdrop-blur-md",
};

const SIZES: Record<ButtonSize, string> = {
  sm: "text-[13px] px-5 py-2.5",
  md: "text-sm px-[26px] py-3.5",
  lg: "text-[15px] px-8 py-4",
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
