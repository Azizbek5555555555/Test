"use client";

import { useEffect, useRef } from "react";

/**
 * Sichqoncha ortidan suzib yuradigan ikki ichma-ich doira (butun saytda).
 * Kichik nuqta tez, katta halqa sekinroq ergashadi; havola va tugmalar
 * ustida halqa kattalashadi. Faqat sichqonchali qurilmalarda ishlaydi
 * (telefon/planshetda va "harakatni kamaytirish" yoqilganda o'chiq).
 */
export function CursorFollower() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dot = dotRef.current;
    const ring = ringRef.current;
    if (!fine || reduced || !dot || !ring) return;

    const target = { x: -100, y: -100 };
    const d = { x: -100, y: -100 };
    const r = { x: -100, y: -100 };
    let raf = 0;
    let visible = false;

    const loop = () => {
      d.x += (target.x - d.x) * 0.45;
      d.y += (target.y - d.y) * 0.45;
      r.x += (target.x - r.x) * 0.16;
      r.y += (target.y - r.y) * 0.16;
      dot.style.transform = `translate3d(${d.x.toFixed(1)}px, ${d.y.toFixed(1)}px, 0)`;
      ring.style.transform = `translate3d(${r.x.toFixed(1)}px, ${r.y.toFixed(1)}px, 0)`;
      const settled = Math.abs(target.x - r.x) < 0.3 && Math.abs(target.y - r.y) < 0.3;
      raf = settled ? 0 : requestAnimationFrame(loop);
    };
    const kick = () => {
      if (!raf) raf = requestAnimationFrame(loop);
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      target.x = e.clientX;
      target.y = e.clientY;
      if (!visible) {
        visible = true;
        // birinchi harakatda sakramasdan paydo bo'lsin
        d.x = r.x = target.x;
        d.y = r.y = target.y;
        document.documentElement.classList.add("cursor-on");
      }
      const el = e.target as Element | null;
      const interactive = el?.closest("a, button, [role='button'], summary, label, select, input[type='submit']");
      const typing = el?.closest("input:not([type='submit']), textarea, [contenteditable='true']");
      ring.dataset.state = typing ? "text" : interactive ? "link" : "";
      kick();
    };
    const onLeave = () => {
      visible = false;
      document.documentElement.classList.remove("cursor-on");
    };
    const onDown = () => ring.classList.add("is-down");
    const onUp = () => ring.classList.remove("is-down");

    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", onLeave);
    window.addEventListener("blur", onLeave);
    window.addEventListener("pointerdown", onDown, { passive: true });
    window.addEventListener("pointerup", onUp, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("blur", onLeave);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      cancelAnimationFrame(raf);
      document.documentElement.classList.remove("cursor-on");
    };
  }, []);

  return (
    <>
      <div ref={ringRef} className="cursor-ring" aria-hidden>
        <span />
      </div>
      <div ref={dotRef} className="cursor-dot" aria-hidden>
        <span />
      </div>
    </>
  );
}
