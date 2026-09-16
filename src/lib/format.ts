import { DEFAULT_CEFR_BANDS } from "./defaults";
import type { CefrBands } from "./types";

/** 99000 → "99 000 so'm" */
export function formatSum(amount: number | null | undefined): string {
  if (amount == null) return "—";
  return `${amount.toLocaleString("ru-RU").replace(/ /g, " ")} so'm`;
}

/** 8750 → "8,750" */
export function formatXp(xp: number | null | undefined): string {
  if (xp == null) return "0";
  return xp.toLocaleString("en-US");
}

/** Sekundlarni "12:05" ko'rinishiga keltiradi */
export function formatClock(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

/** 180 → "3 soat" / 45 → "45 daqiqa" */
export function formatDuration(minutes: number | null | undefined): string {
  if (!minutes) return "—";
  if (minutes < 60) return `${minutes} daqiqa`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours} soat ${rest} daqiqa` : `${hours} soat`;
}

const MONTHS_UZ = [
  "yanvar",
  "fevral",
  "mart",
  "aprel",
  "may",
  "iyun",
  "iyul",
  "avgust",
  "sentabr",
  "oktabr",
  "noyabr",
  "dekabr",
];

/** ISO sanani "12-mart, 2026" ko'rinishida chiqaradi */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return `${date.getDate()}-${MONTHS_UZ[date.getMonth()]}, ${date.getFullYear()}`;
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  const time = `${String(date.getHours()).padStart(2, "0")}:${String(
    date.getMinutes(),
  ).padStart(2, "0")}`;
  return `${formatDate(iso)} · ${time}`;
}

/** Ballga qarab CEFR darajasini hisoblaydi (server bilan bir xil mantiq) */
export function cefrFromScore(
  score: number | null | undefined,
  bands: CefrBands = DEFAULT_CEFR_BANDS,
): string | null {
  if (score == null) return null;
  if (score >= bands.C1) return "C1";
  if (score >= bands.B2) return "B2";
  if (score >= bands.B1) return "B1";
  if (score >= bands.A2) return "A2";
  return "A1";
}

/** Ismdan bosh harflarni oladi: "Aziz Karimov" → "AK" */
export function initials(name: string | null | undefined): string {
  if (!name) return "MP";
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("") || "MP";
}

/** Matndagi so'zlar sonini sanaydi (Writing uchun) */
export function countWords(text: string | null | undefined): number {
  if (!text) return 0;
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

/** Foizni xavfsiz hisoblaydi */
export function percent(part: number, total: number): number {
  if (!total) return 0;
  return Math.round((part / total) * 100);
}

/** Bir nechta class nomini birlashtiradi */
export function cn(
  ...classes: (string | false | null | undefined)[]
): string {
  return classes.filter(Boolean).join(" ");
}
