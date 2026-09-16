"use client";

import { useState, type ReactNode } from "react";
import { cn } from "@/lib/format";

/** Admin panelda formani yig'ib/ochib turish uchun */
export function Collapsible({
  title,
  subtitle,
  children,
  defaultOpen,
  tone = "default",
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  defaultOpen?: boolean;
  tone?: "default" | "accent";
}) {
  const [open, setOpen] = useState(Boolean(defaultOpen));

  return (
    <div
      className={cn(
        "card p-0 overflow-hidden",
        tone === "accent" && "border-brand-300 dark:border-brand-800",
      )}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="w-full flex items-center gap-3 p-4 text-left hover:bg-[var(--bg-subtle)] transition-colors"
      >
        <span
          className={cn(
            "shrink-0 transition-transform text-muted",
            open && "rotate-90",
          )}
          aria-hidden
        >
          ▶
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-bold">{title}</span>
          {subtitle ? (
            <span className="block text-xs text-muted mt-0.5">{subtitle}</span>
          ) : null}
        </span>
      </button>

      {open ? (
        <div className="p-4 pt-0 border-t border-line">
          <div className="pt-4">{children}</div>
        </div>
      ) : null}
    </div>
  );
}
