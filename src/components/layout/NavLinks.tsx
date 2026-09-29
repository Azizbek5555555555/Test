"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/format";

/** Figma: Inter 14px, oraliq 32px; faol havola — accent/base, qolganlari — text/secondary */
export function NavLinks({ items }: { items: { href: string; label: string }[] }) {
  const pathname = usePathname();

  return (
    <nav className="hidden lg:flex items-center gap-7 xl:gap-8 mx-auto">
      {items.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "relative text-sm transition-colors py-1",
              "after:absolute after:left-0 after:-bottom-0.5 after:h-px after:bg-brand-400",
              "after:transition-all after:duration-300",
              active
                ? "font-semibold text-brand-400 after:w-full"
                : "font-medium text-muted hover:text-fg after:w-0 hover:after:w-full",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
