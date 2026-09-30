"use client";

import { useEffect } from "react";

/**
 * Kursor ortidan yuradigan yumshoq nur: [data-spot] elementlarida
 * --sx/--sy o'zgaruvchilarini yangilaydi (nur CSS'da chiziladi).
 * Sensorli ekranlarda ishlamaydi — kerak ham emas.
 */
export function Spotlight() {
  useEffect(() => {
    if (!window.matchMedia("(hover: hover)").matches) return;
    let raf = 0;
    let last: PointerEvent | null = null;
    const onMove = (e: PointerEvent) => {
      last = e;
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const el = (last?.target as Element | null)?.closest<HTMLElement>("[data-spot]");
        if (!el || !last) return;
        const r = el.getBoundingClientRect();
        el.style.setProperty("--sx", `${last.clientX - r.left}px`);
        el.style.setProperty("--sy", `${last.clientY - r.top}px`);
      });
    };
    document.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      document.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(raf);
    };
  }, []);
  return null;
}
