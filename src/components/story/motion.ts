"use client";

import { useSyncExternalStore } from "react";
import type { Keyframe } from "@/lib/home-story";

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

/** Kalit kadrlar orasida silliq qiymat (har bir xususiyat alohida interpolyatsiya qilinadi) */
export function sample(frames: Keyframe[], p: number) {
  const out: Partial<Record<keyof Keyframe, number>> = {};
  for (const k of ["x", "y", "r", "rx", "ry", "s", "o"] as const) {
    let prev: Keyframe | undefined;
    let next: Keyframe | undefined;
    for (const f of frames) {
      if (f[k] === undefined) continue;
      if (f.p <= p) prev = f;
      else {
        next = f;
        break;
      }
    }
    if (!prev && !next) continue;
    if (!prev) out[k] = next![k];
    else if (!next) out[k] = prev[k];
    else out[k] = prev[k]! + (next[k]! - prev[k]!) * smooth((p - prev.p) / (next.p - prev.p));
  }
  return out;
}

/** Tasodifiy, lekin har safar bir xil ketma-ketlik (uchqunlar joyi server/brauzerda o'zgarmasin) */
export function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}
