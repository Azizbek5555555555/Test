import { DEFAULT_CEFR_BANDS } from "./defaults";
import type { CefrBands } from "./types";
import type { Locale } from "@/i18n";

/** 99000 → "99 000 so'm" */
export function formatSum(amount: number | null | undefined, locale: Locale = "uz"): string {
  if (amount == null) return "—";
  return `${amount.toLocaleString("ru-RU").replace(/ /g, " ")} ${locale === "en" ? "UZS" : "so'm"}`;
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

/** 180 → "3 soat" / 45 → "45 daqiqa" (EN: "3 h" / "45 min") */
export function formatDuration(minutes: number | null | undefined, locale: Locale = "uz"): string {
  if (!minutes) return "—";
  const [h, m] = locale === "en" ? ["h", "min"] : ["soat", "daqiqa"];
  if (minutes < 60) return `${minutes} ${m}`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours} ${h} ${rest} ${m}` : `${hours} ${h}`;
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

const MONTHS_EN = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

/** ISO sanani "12-mart, 2026" (EN: "12 March 2026") ko'rinishida chiqaradi */
export function formatDate(iso: string | null | undefined, locale: Locale = "uz"): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  if (locale === "en") return `${date.getDate()} ${MONTHS_EN[date.getMonth()]} ${date.getFullYear()}`;
  return `${date.getDate()}-${MONTHS_UZ[date.getMonth()]}, ${date.getFullYear()}`;
}

export function formatDateTime(iso: string | null | undefined, locale: Locale = "uz"): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  const time = `${String(date.getHours()).padStart(2, "0")}:${String(
    date.getMinutes(),
  ).padStart(2, "0")}`;
  return `${formatDate(iso, locale)} · ${time}`;
}

/** Nisbiy vaqt: "5 daqiqa oldin", "2 soat oldin", "kecha", "3 kun oldin" */
export function timeAgo(iso: string | null | undefined, now: number = Date.now(), locale: Locale = "uz"): string {
  if (!iso) return "";
  const en = locale === "en";
  const diff = Math.max(0, now - new Date(iso).getTime());
  const min = Math.floor(diff / 60000);
  if (min < 1) return en ? "just now" : "hozirgina";
  if (min < 60) return en ? `${min} min ago` : `${min} daqiqa oldin`;
  const hours = Math.floor(min / 60);
  if (hours < 24) return en ? `${hours} h ago` : `${hours} soat oldin`;
  const days = Math.floor(hours / 24);
  if (days === 1) return en ? "yesterday" : "kecha";
  if (days < 7) return en ? `${days} days ago` : `${days} kun oldin`;
  return formatDate(iso, locale);
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
  if (!name) return "LX";
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("") || "LX";
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
