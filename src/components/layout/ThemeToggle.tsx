"use client";

import { useSyncExternalStore } from "react";
import { useT } from "@/i18n/client";
import { cn } from "@/lib/format";
import { THEME_COLOR, THEME_COOKIE, isTheme, type Theme } from "@/lib/theme";

function currentTheme(): Theme {
  const value = typeof document !== "undefined" ? document.documentElement.dataset.theme : undefined;
  return isTheme(value) ? value : "dark";
}

function subscribe(onChange: () => void) {
  window.addEventListener("lx-theme", onChange);
  return () => window.removeEventListener("lx-theme", onChange);
}

/** Mavzuni darhol qo'llaydi: <html data-theme>, `dark` klassi, brauzer paneli rangi va cookie */
function applyTheme(next: Theme) {
  const root = document.documentElement;
  root.classList.add("theme-switching");
  root.dataset.theme = next;
  root.classList.toggle("dark", next === "dark");
  root.style.colorScheme = next;
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", THEME_COLOR[next]);
  document.cookie = `${THEME_COOKIE}=${next}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
  window.setTimeout(() => root.classList.remove("theme-switching"), 450);
  window.dispatchEvent(new CustomEvent("lx-theme", { detail: next }));
}

/** Quyosh / oy tugmasi: qorong'i ↔ yorug' mavzu */
export function ThemeToggle({ className }: { className?: string }) {
  const t = useT();
  // <html data-theme> — yagona manba; boshqa tugma (masalan, mobil menyudagi) bosilsa ham sinxron
  const theme = useSyncExternalStore(subscribe, currentTheme, () => "dark" as Theme);

  const next: Theme = theme === "dark" ? "light" : "dark";
  const label = next === "light" ? t("Yorug' mavzu", "Light theme") : t("Qorong'i mavzu", "Dark theme");

  return (
    <button
      type="button"
      onClick={() => applyTheme(next)}
      className={cn("theme-toggle", className)}
      data-theme-state={theme}
      aria-label={label}
      title={label}
    >
      {/* quyosh */}
      <svg className="theme-toggle-sun" width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden>
        <circle cx="12" cy="12" r="4.2" stroke="currentColor" strokeWidth="1.8" />
        <path
          d="M12 2.5v2.2M12 19.3v2.2M4.6 4.6l1.6 1.6M17.8 17.8l1.6 1.6M2.5 12h2.2M19.3 12h2.2M4.6 19.4l1.6-1.6M17.8 6.2l1.6-1.6"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
      {/* oy */}
      <svg className="theme-toggle-moon" width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M20.5 14.6A8.6 8.6 0 0 1 9.4 3.5a8.6 8.6 0 1 0 11.1 11.1Z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}
