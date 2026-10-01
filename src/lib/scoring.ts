/**
 * Rasmiy Multilevel baholash tizimi (Bilimni baholash agentligi mezonlari).
 * Bazadagi hisob-kitob: supabase/migrations/0008_official_scoring.sql — jadvallar bir xil.
 *
 *  • Listening / Reading: 35 ta savoldan to'g'ri javoblar soni → 0–75 standart ball.
 *  • Writing: 3 ta topshiriq bali yig'indisi (1.1: 0–5, 1.2: 0–6, 2: 0–6 → 0–17) → 0–75.
 *  • Speaking: 3 ta part uchun umumiy 0–75 ball.
 *  • Umumiy ball — 4 bo'lim o'rtachasi; C1 65–75, B2 51–64, B1 38–50.
 */

export const MAX_SCORE = 75;

/** To'g'ri javoblar soni (1..35) → standart ball */
export const LR_TABLE = {
  listening: [23, 26, 28, 30, 33, 34, 36, 38, 39, 41, 42, 44, 45, 47, 48, 50, 51, 53, 54, 55, 57, 58, 60, 61, 63, 65, 66, 68, 70, 72, 73, 74, 75, 75, 75],
  reading: [20, 24, 27, 29, 32, 34, 36, 38, 39, 41, 42, 44, 45, 46, 48, 49, 51, 52, 54, 55, 57, 58, 60, 61, 63, 65, 66, 68, 70, 71, 73, 74, 75, 75, 75],
} as const;

export function lrStandardScore(section: "listening" | "reading", correct: number): number {
  const n = Math.min(35, Math.round(correct));
  return n <= 0 ? 0 : LR_TABLE[section][n - 1];
}

/** Writing: ekspert bali (0–17, 0.5 qadam) → standart ball (rasmiy "Conversion table") */
const WRITING_TABLE: Record<string, number> = {
  "17": 75, "16.5": 74, "16": 72, "15.5": 69, "15": 67, "14.5": 65, "14": 63, "13.5": 62, "13": 61,
  "12.5": 59, "12": 57, "11.5": 56, "11": 54, "10.5": 53, "10": 51, "9.5": 50, "9": 49, "8.5": 47,
  "8": 45, "7.5": 43, "7": 42, "6.5": 40, "6": 38, "5.5": 35, "5": 32, "4.5": 29, "4": 26, "3.5": 23,
  "3": 21, "2.5": 18, "2": 15, "1.5": 13, "1": 11, "0.5": 10, "0": 0,
};

export function writingStandardScore(expertMark: number): number {
  const m = Math.max(0, Math.min(17, Math.round(expertMark * 2) / 2));
  return WRITING_TABLE[String(m)] ?? 0;
}

/**
 * Speaking: 1–3 savollar (0–5), 4–6 savollar (0–5), 7-savol (0–5), 8-savol (0–6) → 0–21.
 * Rasmiy o'tkazish jadvali yuborilmagan — Writing jadvali bo'yicha mutanosib (taxminiy) hisob.
 */
export function speakingStandardScore(rawSum: number): number {
  return writingStandardScore((Math.max(0, Math.min(21, rawSum)) * 17) / 21);
}

export const LEVEL_BANDS = [
  { level: "C1", from: 65, to: 75 },
  { level: "B2", from: 51, to: 64 },
  { level: "B1", from: 38, to: 50 },
] as const;

/** 0–75 → 0–100 (halqa va chiziqlar uchun) */
export const scorePercent = (score: number | null | undefined) =>
  score == null ? 0 : Math.max(0, Math.min(100, (score / MAX_SCORE) * 100));
