"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { formatXp } from "@/lib/format";

export interface UserMenuData {
  fullName: string | null;
  email: string | null;
  avatarUrl: string | null;
  isPremium: boolean;
  isStaff: boolean;
  totalXp: number;
}

export function UserMenu({ user }: { user: UserMenuData }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent | TouchEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const items = [
    { href: "/profile", label: "Mening profilim", icon: "👤" },
    { href: "/profile/results", label: "Natijalarim", icon: "📊" },
    { href: "/premium", label: "Premium", icon: "⭐" },
  ];

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-2 rounded-full p-0.5 hover:bg-[var(--bg-subtle)] transition-colors"
      >
        <Avatar
          name={user.fullName}
          src={user.avatarUrl}
          size="md"
          ring={user.isPremium}
        />
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-64 card p-0 overflow-hidden z-50 animate-pop"
        >
          <div className="p-4 border-b border-line bg-[var(--bg-subtle)]">
            <div className="flex items-center gap-3">
              <Avatar
                name={user.fullName}
                src={user.avatarUrl}
                size="md"
                ring={user.isPremium}
              />
              <div className="min-w-0">
                <p className="font-bold text-sm truncate">
                  {user.fullName ?? "Foydalanuvchi"}
                </p>
                <p className="text-xs text-muted truncate">{user.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-3">
              {user.isPremium ? (
                <span className="text-xs font-bold text-gold-700 dark:text-gold-400">
                  ⭐ PREMIUM
                </span>
              ) : (
                <Link
                  href="/premium"
                  onClick={() => setOpen(false)}
                  className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline"
                >
                  Premiumga o&apos;tish →
                </Link>
              )}
              <span className="text-xs text-muted ml-auto tabular-nums">
                {formatXp(user.totalXp)} XP
              </span>
            </div>
          </div>

          <nav className="p-1.5">
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                role="menuitem"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm
                           hover:bg-[var(--bg-subtle)] transition-colors"
              >
                <span aria-hidden>{item.icon}</span>
                {item.label}
              </Link>
            ))}

            {user.isStaff ? (
              <Link
                href="/admin"
                role="menuitem"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm
                           hover:bg-[var(--bg-subtle)] transition-colors"
              >
                <span aria-hidden>🛠️</span>
                Admin panel
              </Link>
            ) : null}
          </nav>

          <form action="/auth/signout" method="post" className="p-1.5 border-t border-line">
            <button
              type="submit"
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm
                         text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40
                         transition-colors"
            >
              <span aria-hidden>🚪</span>
              Chiqish
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
