import Link from "next/link";
import { cn } from "@/lib/format";

export interface TabItem {
  id: string;
  label: string;
  href: string;
  count?: number;
}

/** URL asosidagi tablar (server komponentida ham ishlaydi) */
export function LinkTabs({
  items,
  activeId,
  className,
}: {
  items: TabItem[];
  activeId: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "inline-flex flex-wrap gap-1 rounded-xl bg-[var(--bg-subtle)] p-1 border border-line",
        className,
      )}
    >
      {items.map((item) => {
        const active = item.id === activeId;
        return (
          <Link
            key={item.id}
            href={item.href}
            scroll={false}
            aria-current={active ? "page" : undefined}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-semibold transition-colors",
              active
                ? "bg-surface text-fg shadow-sm"
                : "text-muted hover:text-fg",
            )}
          >
            {item.label}
            {typeof item.count === "number" ? (
              <span className="ml-1.5 text-xs opacity-70 tabular-nums">
                {item.count}
              </span>
            ) : null}
          </Link>
        );
      })}
    </div>
  );
}
