import "server-only";

import { createServerSupabase } from "./supabase/server";

/**
 * Baza urinish ochilganda `expires_at = hozir + test vaqti + 5 daqiqa` qo'yadi
 * (0005_security_hardening.sql → prepare_attempt). 5 daqiqa — internet sekin
 * bo'lsa ham oxirgi javoblar saqlanib ulgurishi uchun zaxira.
 */
export const ATTEMPT_GRACE_MS = 5 * 60_000;

function currentTime(): number {
  return Date.now();
}

/**
 * Test vaqti tugashiga qancha millisekund qolgan (zaxirasiz).
 * `null` — muddat belgilanmagan.
 */
export function attemptMsLeft(expiresAt: string | null): number | null {
  if (!expiresAt) return null;
  const end = new Date(expiresAt).getTime();
  if (Number.isNaN(end)) return null;
  return end - ATTEMPT_GRACE_MS - currentTime();
}

/** Vaqti tugaganmi? */
export function isAttemptTimeOver(expiresAt: string | null): boolean {
  const left = attemptMsLeft(expiresAt);
  return left !== null && left <= 0;
}

/** Taymer uchun qolgan daqiqalar (kamida 1) */
export function attemptMinutesLeft(
  expiresAt: string | null,
  fallbackMinutes: number,
): number {
  const left = attemptMsLeft(expiresAt);
  if (left === null) return fallbackMinutes;
  return Math.max(1, Math.round(left / 60_000));
}

/**
 * Vaqti tugagan urinishni saqlangan javoblar bilan yakunlaydi (baholaydi).
 * Baholash butunlay bazadagi score_attempt() funksiyasida bajariladi.
 */
export async function finalizeAttempt(attemptId: string): Promise<boolean> {
  try {
    const supabase = await createServerSupabase();
    const { error } = await supabase.rpc("score_attempt", {
      p_attempt_id: attemptId,
    });
    return !error;
  } catch {
    // Keyingi safar sahifa ochilganda qayta urinib ko'riladi
    return false;
  }
}
