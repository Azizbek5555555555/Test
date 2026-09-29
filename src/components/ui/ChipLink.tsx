import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/format";

/** Figma: filtr "chip" — faol bo'lsa accent fon */
export function ChipLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      scroll={false}
      aria-current={active ? "true" : undefined}
      className={cn(
        "whitespace-nowrap rounded-full px-4 py-1.5 text-[13px] font-medium transition-colors",
        active
          ? "bg-brand-400 text-ink-950"
          : "border border-line bg-ink-900 text-muted hover:border-brand-400/40 hover:text-fg",
      )}
    >
      {children}
    </Link>
  );
}

/** Chiplar qatori — mobil ekranda gorizontal aylanadi */
export function ChipRow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("-mx-4 overflow-x-auto px-4 sm:mx-0 sm:overflow-visible sm:px-0", className)}>
      <div className="flex w-max gap-2 sm:w-auto sm:flex-wrap">{children}</div>
    </div>
  );
}
