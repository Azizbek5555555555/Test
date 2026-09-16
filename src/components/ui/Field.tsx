import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/format";

const CONTROL =
  "w-full rounded-xl border border-line bg-surface px-4 py-2.5 text-sm text-fg " +
  "placeholder:text-muted/70 transition-colors " +
  "focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/25 " +
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
      <span className="text-sm font-semibold">
        {children}
        {required ? <span className="text-rose-500 ml-0.5">*</span> : null}
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
        <p className="text-xs text-rose-600 dark:text-rose-400 mt-1.5 font-medium">
          {error}
        </p>
      ) : null}
    </div>
  );
}
