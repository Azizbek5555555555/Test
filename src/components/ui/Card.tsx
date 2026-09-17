import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/format";

export function Card({
  className,
  children,
  ...rest
}: ComponentProps<"div"> & { children: ReactNode }) {
  return (
    <div className={cn("card p-5", className)} {...rest}>
      {children}
    </div>
  );
}

export function CardLink({
  className,
  children,
  ...rest
}: ComponentProps<typeof Link> & { children: ReactNode }) {
  return (
    <Link
      className={cn(
        "card p-5 block transition-all duration-200",
        "hover:shadow-[var(--shadow-lift)] hover:-translate-y-0.5",
        "focus-visible:-translate-y-0.5",
        className,
      )}
      {...rest}
    >
      {children}
    </Link>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
      <div className="min-w-0">
        {eyebrow ? (
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-600 dark:text-brand-400 mb-1.5">
            {eyebrow}
          </p>
        ) : null}
        <h2 className="text-2xl sm:text-3xl font-extrabold text-balance-title">
          {title}
        </h2>
        {description ? (
          <p className="text-muted mt-2 max-w-2xl">{description}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  children?: ReactNode;
}) {
  return (
    <header className="mb-8">
      {eyebrow ? (
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-600 dark:text-brand-400 mb-2">
          {eyebrow}
        </p>
      ) : null}
      <h1 className="text-3xl sm:text-4xl font-extrabold text-balance-title">
        {title}
      </h1>
      {description ? (
        <p className="text-muted mt-3 max-w-3xl leading-relaxed">
          {description}
        </p>
      ) : null}
      {children ? <div className="mt-5">{children}</div> : null}
    </header>
  );
}

export function EmptyState({
  icon = "📭",
  title,
  description,
  action,
}: {
  icon?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="card p-10 text-center">
      <div className="text-4xl mb-3" aria-hidden>
        {icon}
      </div>
      <h3 className="font-bold text-lg">{title}</h3>
      {description ? (
        <p className="text-muted mt-2 max-w-md mx-auto text-sm leading-relaxed">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export function Alert({
  tone = "info",
  title,
  children,
}: {
  tone?: "info" | "success" | "warning" | "danger";
  title?: string;
  children: ReactNode;
}) {
  const tones = {
    info: "bg-sky-50 border-sky-200 text-sky-900 dark:bg-sky-950/40 dark:border-sky-800 dark:text-sky-200",
    success:
      "bg-emerald-50 border-emerald-200 text-emerald-900 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-200",
    warning:
      "bg-amber-50 border-amber-200 text-amber-900 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-200",
    danger:
      "bg-rose-50 border-rose-200 text-rose-900 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-200",
  };
  const icons = { info: "ℹ️", success: "✅", warning: "⚠️", danger: "⛔" };

  return (
    <div className={cn("rounded-xl border p-4 text-sm", tones[tone])}>
      <div className="flex gap-3">
        <span aria-hidden className="shrink-0">
          {icons[tone]}
        </span>
        <div className="min-w-0">
          {title ? <p className="font-bold mb-1">{title}</p> : null}
          <div className="leading-relaxed">{children}</div>
        </div>
      </div>
    </div>
  );
}

export function ProgressBar({
  value,
  max = 100,
  tone = "brand",
  showLabel,
}: {
  value: number;
  max?: number;
  tone?: "brand" | "success" | "gold";
  showLabel?: boolean;
}) {
  const pct = Math.max(0, Math.min(100, max ? (value / max) * 100 : 0));
  const tones = {
    brand: "bg-brand-500",
    success: "bg-emerald-500",
    gold: "bg-gold-400",
  };
  return (
    <div className="flex items-center gap-3">
      <div
        className="h-2 flex-1 rounded-full bg-[var(--bg-subtle)] overflow-hidden"
        role="progressbar"
        aria-valuenow={Math.round(pct)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={cn("h-full rounded-full transition-all", tones[tone])}
          style={{ width: `${pct}%` }}
        />
      </div>
      {showLabel ? (
        <span className="text-xs font-bold tabular-nums text-muted w-10 text-right">
          {Math.round(pct)}%
        </span>
      ) : null}
    </div>
  );
}

export function Stat({
  label,
  value,
  hint,
  icon,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  icon?: string;
}) {
  return (
    <div className="card p-4">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">
          {label}
        </p>
        {icon ? (
          <span aria-hidden className="text-lg leading-none">
            {icon}
          </span>
        ) : null}
      </div>
      <p className="text-2xl font-extrabold mt-2 tabular-nums">{value}</p>
      {hint ? <p className="text-xs text-muted mt-1">{hint}</p> : null}
    </div>
  );
}
