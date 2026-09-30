"use client";

import { useSyncExternalStore } from "react";

/**
 * Skroll animatsiyalari uchun rejim:
 *  - "anim"   — to'liq animatsiya
 *  - "static" — harakatsiz variant: foydalanuvchi animatsiyani kamaytirgan,
 *               internet sekin (Save-Data, 2G), qurilma xotirasi kam yoki
 *               brauzer 3D transformni qo'llamaydi.
 * Server har doim "anim" deb chizadi; brauzer darhol aniq rejimga o'tadi.
 */
export type MotionMode = "anim" | "static";

function readMode(): MotionMode {
  const nav = navigator as Navigator & {
    connection?: { saveData?: boolean; effectiveType?: string };
    deviceMemory?: number;
  };
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const slow =
    Boolean(nav.connection?.saveData) ||
    ["2g", "slow-2g"].includes(nav.connection?.effectiveType ?? "");
  const lowMemory = typeof nav.deviceMemory === "number" && nav.deviceMemory < 4;
  const no3d = typeof CSS !== "undefined" && !CSS.supports("transform-style", "preserve-3d");
  return reduced || slow || lowMemory || no3d ? "static" : "anim";
}

function subscribe(onChange: () => void) {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

export function useMotionMode(): MotionMode {
  return useSyncExternalStore(subscribe, readMode, () => "anim" as const);
}

/* Umumiy matematika */
export const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
export const smooth = (t: number) => t * t * (3 - 2 * t);
export const rangeT = (p: number, [a, b]: [number, number]) => clamp01((p - a) / (b - a));
