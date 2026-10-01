"use client";

import { LangSwitch } from "./LangSwitch";
import { useT } from "@/i18n/client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ComponentType, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import {
  Award,
  BookOpen,
  CheckCircle,
  FileText,
  Layers,
  MapPin,
  MessageCircle,
  Star,
  User,
  X,
  Zap,
} from "react-feather";
import { MAIN_NAV } from "@/lib/constants";
import { BrandMark, BrandWordmark } from "./BrandLogo";

type IconType = ComponentType<{ size?: number; className?: string; strokeWidth?: number }>;

const NAV_ICON: Record<string, IconType> = {
  "/full-mock": FileText,
  "/latest-questions": Zap,
  "/boost": BookOpen,
  "/vocabulary-battle": Layers,
  "/exam-checking": CheckCircle,
  "/courses": MapPin,
};

/** Mobil menyu: o'ngdan chiqadigan shisha panel, havolalar ikonka bilan, navbatma-navbat paydo bo'ladi */
export function MobileNav({ signedIn }: { signedIn: boolean }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const t = useT();

  const close = () => setOpen(false);

  // Menyu ochiq bo'lganda sahifa scroll qilinmasin; Esc bilan yopiladi
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const links = [
    ...MAIN_NAV.map((item) => ({ href: item.href, label: t(item.label), icon: NAV_ICON[item.href] ?? FileText })),
    { href: "/leaderboard", label: t("Reyting", "Leaderboard"), icon: Award },
    { href: "/contact", label: t("Biz bilan bog'lanish", "Contact us"), icon: MessageCircle },
  ];

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="site-burger xl:hidden"
        aria-label={t("Menyuni ochish", "Open menu")}
        aria-expanded={open}
      >
        <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden>
          <path d="M3 6h14M3 10h14M3 14h9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>

      {/* Header'dagi backdrop-blur "fixed" elementlarni o'ziga bog'lab qo'yadi —
          shuning uchun panel to'g'ridan-to'g'ri <body> ichiga chiziladi */}
      {open && typeof document !== "undefined"
        ? createPortal(
            <div className="mnav xl:hidden" role="dialog" aria-modal="true" aria-label={t("Menyu", "Menu")}>
              <button type="button" className="mnav-scrim" onClick={close} aria-label={t("Menyuni yopish", "Close menu")} />
              <div className="mnav-panel">
                <div className="mnav-head">
                  <Link href="/" onClick={close} className="flex items-center gap-2.5" aria-label="levelxenglish">
                    <BrandMark size={30} />
                    <BrandWordmark className="text-[19px] leading-none" />
                  </Link>
                  <button type="button" onClick={close} className="site-burger" aria-label={t("Yopish", "Close")}>
                    <X size={18} aria-hidden />
                  </button>
                </div>

                <nav className="mnav-links">
                  {links.map((item, i) => {
                    const Icon = item.icon;
                    const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                    return (
                      <Link
                        key={item.href}
                        onClick={close}
                        href={item.href}
                        aria-current={active ? "page" : undefined}
                        className="mnav-link"
                        style={{ "--i": i } as CSSProperties}
                      >
                        <span className="mnav-ico">
                          <Icon size={17} strokeWidth={1.8} aria-hidden />
                        </span>
                        {item.label}
                      </Link>
                    );
                  })}
                </nav>

                <div className="mnav-foot">
                  <LangSwitch />
                  {signedIn ? (
                    <div className="grid grid-cols-2 gap-2">
                      <Link onClick={close} href="/profile" className="mnav-btn">
                        <User size={15} aria-hidden /> {t("Profil", "Profile")}
                      </Link>
                      <Link onClick={close} href="/premium" className="mnav-btn mnav-btn-premium">
                        <Star size={15} aria-hidden /> Premium
                      </Link>
                    </div>
                  ) : (
                    <Link onClick={close} href="/login" className="mnav-btn mnav-btn-primary">
                      {t("Kirish / Ro'yxatdan o'tish", "Log in / Sign up")}
                    </Link>
                  )}
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
