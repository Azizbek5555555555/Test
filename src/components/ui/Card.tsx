import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { AlertCircle, AlertTriangle, CheckCircle, Info } from "react-feather";
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
        "card p-5 block lift",
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
    <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
      <div className="min-w-0">
        {eyebrow ? (
          <p className="eyebrow mb-3">
            <span className="h-px w-6 bg-brand-400" aria-hidden />
            {eyebrow}
          </p>
        ) : null}
        <h2 className="display-title text-3xl sm:text-4xl lg:text-[44px] text-balance-title">
          {title}
        </h2>
        {description ? (
          <p className="text-muted mt-3 max-w-2xl leading-relaxed">{description}</p>
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
    <header className="mb-10 animate-fade-up">
      {eyebrow ? (
        <p className="eyebrow mb-4">
          <span className="h-px w-6 bg-brand-400" aria-hidden />
          {eyebrow}
        </p>
      ) : null}
      <h1 className="display-title text-4xl sm:text-5xl lg:text-[56px] text-balance-title">
        {title}
      </h1>
      {description ? (
        <p className="text-muted mt-4 max-w-2xl text-base leading-relaxed">
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
      <h3 className="display-title text-2xl">{title}</h3>
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
  // Figma: holat ranglari — to'q fonda yarim shaffof tus + rangli chegara
  const tones = {
    info: "bg-ink-800/60 border-line text-fg",
    success: "bg-success/10 border-success/40 text-fg",
    warning: "bg-warning/10 border-warning/40 text-fg",
    danger: "bg-danger/10 border-danger/45 text-fg",
  };
  const icons = {
    info: <Info size={18} className="text-muted" />,
    success: <CheckCircle size={18} className="text-success" />,
    warning: <AlertTriangle size={18} className="text-warning" />,
    danger: <AlertCircle size={18} className="text-danger" />,
  };

  return (
    <div className={cn("rounded-xl border p-4 text-sm", tones[tone])}>
      <div className="flex gap-3">
        <span aria-hidden className="mt-px shrink-0">
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
    success: "bg-success",
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
