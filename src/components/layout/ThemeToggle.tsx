"use client";

const STORAGE_KEY = "ml-theme";

/**
 * Yorug'/qorong'i rejim tugmasi.
 *
 * Holat React state'da saqlanmaydi — joriy rejim <html data-theme> atributida
 * turadi va qaysi belgi ko'rinishi CSS orqali hal qilinadi. Shu sababli
 * server va brauzer renderi har doim bir xil bo'ladi (hydration xatosi yo'q).
 */
export function ThemeToggle() {
  function toggle() {
    const root = document.documentElement;
    const explicit = root.getAttribute("data-theme");

    const current =
      explicit === "light" || explicit === "dark"
        ? explicit
        : window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light";

    const next = current === "dark" ? "light" : "dark";
    root.setAttribute("data-theme", next);

    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* private rejimda ishlamasligi mumkin — muhim emas */
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className="w-9 h-9 inline-flex items-center justify-center rounded-lg
                 text-muted hover:text-fg hover:bg-[var(--bg-subtle)] transition-colors"
      aria-label="Yorug' yoki qorong'i rejimni almashtirish"
      title="Rejimni almashtirish"
    >
      <span aria-hidden className="text-base theme-icon-moon">
        🌙
      </span>
      <span aria-hidden className="text-base theme-icon-sun">
        ☀️
      </span>
    </button>
  );
}
