"use client";

import { useOptimistic, useTransition } from "react";
import { useRouter } from "next/navigation";
import { LOCALE_COOKIE, type Locale } from "@/i18n";
import { useLocale } from "@/i18n/client";
import { cn } from "@/lib/format";

/** Tanlangan tilni 1 yilga eslab qoladi va <html lang> ni darhol yangilaydi */
function persistLocale(next: Locale) {
  document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
  document.documentElement.lang = next;
}

/** UZ | EN almashtirgich: tanlov cookie'ga yoziladi, sahifa yangi tilda qayta chiziladi */
export function LangSwitch({ className }: { className?: string }) {
  const locale = useLocale();
  const router = useRouter();
  const [pending, start] = useTransition();
  // tugma darhol siljiydi, sahifa matnlari serverdan kelguncha
  const [shown, setShown] = useOptimistic(locale);

  const choose = (next: Locale) => {
    if (next === shown || pending) return;
    persistLocale(next);
    start(() => {
      setShown(next);
      router.refresh();
    });
  };

  return (
    <div
      className={cn("lang-switch", pending && "is-pending", className)}
      role="group"
      aria-label={shown === "en" ? "Language" : "Til"}
      data-active={shown}
    >
      <span className="lang-switch-thumb" aria-hidden />
      {(["uz", "en"] as const).map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => choose(l)}
          aria-pressed={shown === l}
          className={cn("lang-switch-btn", shown === l && "is-active")}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
