"use client";

import { useEffect, type RefObject } from "react";

/**
 * 3D sahna uchun sichqoncha + skroll bo'yicha og'ish.
 * Elementga CSS o'zgaruvchilarini yozadi (rAF bilan silliq):
 *   --tx, --ty : sichqoncha bo'yicha -1..1 (markazdan)
 *   --sp       : skroll ulushi 0..1 (hero yuqoridan chiqib ketayotganda)
 * Sensorli ekranda sichqoncha qismi o'chiq; "harakatni kamaytirish"da hech narsa qilmaydi.
 */
export function useTilt(ref: RefObject<HTMLElement | null>, zoneRef?: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const zone = zoneRef?.current ?? el;

    const target = { x: 0, y: 0, s: 0 };
    const cur = { x: 0, y: 0, s: 0 };
    let raf = 0;
    let visible = true;

    const readScroll = () => {
      const r = zone.getBoundingClientRect();
      // 0 — hero joyida, 1 — hero ekrandan to'liq chiqib ketdi
      target.s = Math.min(1, Math.max(0, -r.top / Math.max(1, r.height)));
    };
    const loop = () => {
      cur.x += (target.x - cur.x) * 0.08;
      cur.y += (target.y - cur.y) * 0.08;
      cur.s += (target.s - cur.s) * 0.14;
      el.style.setProperty("--tx", cur.x.toFixed(4));
      el.style.setProperty("--ty", cur.y.toFixed(4));
      el.style.setProperty("--sp", cur.s.toFixed(4));
      const settled =
        Math.abs(target.x - cur.x) < 0.001 && Math.abs(target.y - cur.y) < 0.001 && Math.abs(target.s - cur.s) < 0.001;
      raf = settled ? 0 : requestAnimationFrame(loop);
    };
    const kick = () => {
      if (!raf && visible) raf = requestAnimationFrame(loop);
    };
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" || !visible) return;
      const r = el.getBoundingClientRect();
      target.x = Math.max(-1, Math.min(1, (e.clientX - (r.left + r.width / 2)) / (r.width / 1.2)));
      target.y = Math.max(-1, Math.min(1, (e.clientY - (r.top + r.height / 2)) / (r.height / 1.2)));
      kick();
    };
    const onLeave = () => {
      target.x = 0;
      target.y = 0;
      kick();
    };
    const onScroll = () => {
      readScroll();
      kick();
    };
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible) kick();
    });
    io.observe(el);

    readScroll();
    kick();
    window.addEventListener("scroll", onScroll, { passive: true });
    if (fine) {
      window.addEventListener("pointermove", onMove, { passive: true });
      document.addEventListener("pointerleave", onLeave);
    }
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
    };
  }, [ref, zoneRef]);
}
