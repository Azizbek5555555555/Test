"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { MAIN_NAV } from "@/lib/constants";
import { cn } from "@/lib/format";

export function MobileNav({ signedIn }: { signedIn: boolean }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const close = () => setOpen(false);

  // Menyu ochiq bo'lganda sahifa scroll qilinmasin
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="lg:hidden w-9 h-9 inline-flex items-center justify-center rounded-lg
                   text-muted hover:text-fg hover:bg-[var(--bg-subtle)]"
        aria-label="Menyuni ochish"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
          <path
            d="M3 5h14M3 10h14M3 15h14"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </button>

      {open ? (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-ink-950/50 backdrop-blur-sm"
            onClick={() => setOpen(false)}
            aria-label="Menyuni yopish"
          />
          <div className="absolute right-0 top-0 bottom-0 w-[82%] max-w-xs bg-surface border-l border-line p-5 overflow-y-auto animate-fade-up">
            <div className="flex items-center justify-between mb-6">
              <span className="font-extrabold text-lg">Menyu</span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="w-9 h-9 inline-flex items-center justify-center rounded-lg
                           text-muted hover:text-fg hover:bg-[var(--bg-subtle)]"
                aria-label="Yopish"
              >
                ✕
              </button>
            </div>

            <nav className="space-y-1">
              {MAIN_NAV.map((item) => {
                const active = pathname.startsWith(item.href);
                return (
                  <Link
                    onClick={close}
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "block px-3 py-2.5 rounded-lg font-semibold transition-colors",
                      active
                        ? "bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300"
                        : "hover:bg-[var(--bg-subtle)]",
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
              <Link
                onClick={close}
                href="/leaderboard"
                className="block px-3 py-2.5 rounded-lg font-semibold hover:bg-[var(--bg-subtle)]"
              >
                Leaderboard
              </Link>
              <Link
                onClick={close}
                href="/contact"
                className="block px-3 py-2.5 rounded-lg font-semibold hover:bg-[var(--bg-subtle)]"
              >
                Biz bilan bog&apos;lanish
              </Link>
            </nav>

            <div className="mt-6 pt-6 border-t border-line space-y-2">
              {signedIn ? (
                <>
                  <Link
                    onClick={close}
                    href="/profile"
                    className="block px-3 py-2.5 rounded-lg font-semibold hover:bg-[var(--bg-subtle)]"
                  >
                    👤 Mening profilim
                  </Link>
                  <Link
                    onClick={close}
                    href="/premium"
                    className="block px-3 py-2.5 rounded-lg font-semibold text-gold-700 dark:text-gold-400
                               hover:bg-gold-50 dark:hover:bg-gold-950/40"
                  >
                    ⭐ Premium
                  </Link>
                </>
              ) : (
                <Link
                  onClick={close}
                  href="/login"
                  className="block px-3 py-2.5 rounded-lg font-semibold bg-brand-600 text-white text-center"
                >
                  Kirish / Ro&apos;yxatdan o&apos;tish
                </Link>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
