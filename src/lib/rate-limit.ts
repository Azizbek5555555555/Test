import "server-only";

import { headers } from "next/headers";
import { HONEYPOT_FIELD } from "./rate-limit-shared";

/**
 * Oddiy "sirpanuvchi oyna" limiti (server xotirasida).
 * Masalan: bitta IP manzildan 10 daqiqada 3 tadan ortiq xabar yuborib bo'lmaydi.
 * Railway'da sayt bitta nusxada ishlaydi, shuning uchun xotiradagi hisob yetarli;
 * qayta ishga tushganda hisob nolga tushadi — bu xavfsizlikka ta'sir qilmaydi
 * (bazadagi to'siq — 0009_antispam.sql — baribir ishlaydi).
 */
const buckets = new Map<string, number[]>();

export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const hits = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);
  if (hits.length >= limit) {
    buckets.set(key, hits);
    return false;
  }
  hits.push(now);
  buckets.set(key, hits);
  // Xotira cheksiz o'smasin
  if (buckets.size > 5000) {
    for (const [k, v] of buckets) if (v.every((t) => now - t >= windowMs)) buckets.delete(k);
  }
  return true;
}

/** Foydalanuvchining IP manzili (Railway proksisi `X-Forwarded-For` da yuboradi) */
export async function clientIp(): Promise<string> {
  const h = await headers();
  return (
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip")?.trim() ||
    "unknown"
  );
}

/**
 * Bot-tuzoq (honeypot): formada odamga ko'rinmaydigan maydon bor.
 * Odam uni to'ldirmaydi, bot esa hamma maydonni to'ldiradi — shundan taniymiz.
 */
export function isBot(formData: FormData): boolean {
  return String(formData.get(HONEYPOT_FIELD) ?? "").trim() !== "";
}
