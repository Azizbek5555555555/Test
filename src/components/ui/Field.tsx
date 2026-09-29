import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/format";

// Figma: "Input fields" — 1px ink/border, 8px radius, 14px ichki bo'shliq;
// fokusda 1.5px accent chegara
const CONTROL =
  "w-full rounded-lg border border-line bg-ink-900 px-3.5 py-3 text-sm text-fg " +
  "placeholder:text-faint transition-colors " +
  "focus:border-brand-400 focus:outline-none focus:ring-[0.5px] focus:ring-brand-400 " +
  "disabled:opacity-60 disabled:cursor-not-allowed";

export function Label({
  htmlFor,
  children,
  required,
  hint,
}: {
  htmlFor?: string;
  children: ReactNode;
  required?: boolean;
  hint?: string;
}) {
  return (
    <label htmlFor={htmlFor} className="block mb-1.5">
      <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted">
        {children}
        {required ? <span className="text-brand-400 ml-0.5">*</span> : null}
      </span>
      {hint ? (
        <span className="block text-xs text-muted font-normal mt-0.5">
          {hint}
        </span>
      ) : null}
    </label>
  );
}

export function Input({ className, ...rest }: ComponentProps<"input">) {
  return <input className={cn(CONTROL, className)} {...rest} />;
}

export function Textarea({ className, ...rest }: ComponentProps<"textarea">) {
  return (
    <textarea className={cn(CONTROL, "min-h-28 resize-y", className)} {...rest} />
  );
}

export function Select({ className, children, ...rest }: ComponentProps<"select">) {
  return (
    <select className={cn(CONTROL, "pr-9", className)} {...rest}>
      {children}
    </select>
  );
}

export function Field({
  label,
  htmlFor,
  required,
  hint,
  error,
  children,
}: {
  label: string;
  htmlFor?: string;
  required?: boolean;
  hint?: string;
  error?: string | null;
  children: ReactNode;
}) {
  return (
    <div>
      <Label htmlFor={htmlFor} required={required} hint={hint}>
        {label}
      </Label>
      {children}
      {error ? (
        <p className="text-xs text-danger mt-1.5 font-medium">
          {error}
        </p>
      ) : null}
    </div>
  );
}
