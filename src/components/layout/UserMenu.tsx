"use client";

import { useT } from "@/i18n/client";
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
  /** Oxirgi CEFR darajasi (B1, B2 ...) */
  level?: string | null;
}

function firstName(name: string | null, fallback: string): string {
  return name?.trim().split(/\s+/)[0] || fallback;
}

export function UserMenu({ user }: { user: UserMenuData }) {
  const [open, setOpen] = useState(false);
  const t = useT();
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
    { href: "/profile", label: t("Mening profilim", "My profile"), icon: "👤" },
    { href: "/profile/results", label: t("Natijalarim", "My results"), icon: "📊" },
    { href: "/premium", label: "Premium", icon: "⭐" },
  ];

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-2.5 rounded-full py-0.5 pl-1 pr-0.5 group"
      >
        <span className="hidden md:inline text-sm font-semibold text-fg group-hover:text-brand-300 transition-colors max-w-[9rem] truncate">
          {firstName(user.fullName, t("Profil", "Profile"))}
        </span>
        {user.level ? (
          <span className="hidden md:inline rounded-full bg-brand-400 px-2 py-0.5 text-[10px] font-bold text-ink-950">
            {user.level}
          </span>
        ) : null}
        <Avatar
          name={user.fullName}
          src={user.avatarUrl}
          size="md"
          ring={user.isPremium}
          className={user.isPremium ? undefined : "border-[1.5px] border-brand-400"}
        />
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 mt-3 w-64 card p-0 overflow-hidden z-50 animate-pop shadow-lift"
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
                  {user.fullName ?? t("Foydalanuvchi", "User")}
                </p>
                <p className="text-xs text-muted truncate">{user.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-3">
              {user.isPremium ? (
                <span className="text-xs font-bold text-gold-400">
                  ⭐ PREMIUM
                </span>
              ) : (
                <Link
                  href="/premium"
                  onClick={() => setOpen(false)}
                  className="text-xs font-bold text-brand-400 hover:underline"
                >
                  {t("Premiumga o'tish →", "Go Premium →")}
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
                {t("Admin panel", "Admin panel")}
              </Link>
            ) : null}
          </nav>

          <form action="/auth/signout" method="post" className="p-1.5 border-t border-line">
            <button
              type="submit"
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm
                         text-danger hover:bg-danger/10
                         transition-colors"
            >
              <span aria-hidden>🚪</span>
              {t("Chiqish", "Log out")}
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
