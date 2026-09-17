import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/format";

/**
 * Bosh sahifadagi katta bo'lim kartasi.
 * Hujjatning 15-bo'limidagi ko'rinishga mos:
 *   SARLAVHA · qisqa tavsif · TUGMA
 */
export function HomeSectionCard({
  index,
  title,
  subtitle,
  items,
  href,
  cta,
  accent,
  emoji,
  badge,
  large,
}: {
  index: number;
  title: string;
  subtitle?: string;
  items: string[];
  href: string;
  cta: string;
  accent: string;
  emoji: string;
  badge?: ReactNode;
  large?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group card p-0 overflow-hidden flex flex-col transition-all duration-200",
        "hover:shadow-[var(--shadow-lift)] hover:-translate-y-1",
        large && "sm:col-span-2",
      )}
    >
      <div className={cn("h-1.5 bg-gradient-to-r", accent)} aria-hidden />

      <div className="p-6 flex-1 flex flex-col">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div
            className={cn(
              "w-12 h-12 rounded-2xl grid place-items-center text-2xl shrink-0",
              "bg-gradient-to-br text-white shadow-sm",
              accent,
            )}
            aria-hidden
          >
            {emoji}
          </div>
          <div className="flex items-center gap-2">
            {badge}
            <span className="text-xs font-bold text-muted tabular-nums">
              {String(index).padStart(2, "0")}
            </span>
          </div>
        </div>

        <h3 className="font-extrabold text-xl tracking-tight">{title}</h3>
        {subtitle ? (
          <p className="text-sm text-muted mt-1.5 leading-relaxed">
            {subtitle}
          </p>
        ) : null}

        <ul className="flex flex-wrap gap-x-2 gap-y-1.5 mt-4">
          {items.map((item) => (
            <li
              key={item}
              className="text-xs font-semibold text-muted bg-[var(--bg-subtle)]
                         border border-line rounded-full px-2.5 py-1"
            >
              {item}
            </li>
          ))}
        </ul>

        <span
          className="mt-6 inline-flex items-center gap-1.5 text-sm font-bold
                     text-brand-600 dark:text-brand-400 group-hover:gap-2.5 transition-all"
        >
          {cta}
          <span aria-hidden>→</span>
        </span>
      </div>
    </Link>
  );
}
