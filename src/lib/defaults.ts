/**
 * Standart sozlamalar — bu fayl server modullarini import QILMAYDI,
 * shuning uchun uni client komponentlarda ham ishlatsa bo'ladi.
 * Haqiqiy qiymatlar `site_settings` jadvalidan olinadi (lib/settings.ts).
 */

import type {
  CefrBands,
  ContactSettings,
  PaymentSettings,
  PremiumPlan,
} from "./types";

export const DEFAULT_CONTACT: ContactSettings = {
  telegram: "https://t.me/levelxenglish",
  telegram_label: "@levelxenglish",
  telegram_admin: "https://t.me/assistant_boo",
  telegram_admin_label: "@assistant_boo",
  instagram: "https://instagram.com/levelxenglish",
  instagram_label: "@levelxenglish",
  phone: "+998 90 166 09 58",
  email: "levelxenglishash@gmail.com",
  // Manzil hozircha yo'q — bo'sh bo'lsa saytda ko'rsatilmaydi
  address: "",
  working_hours: "Onlayn platforma",
};

export const DEFAULT_PLANS: PremiumPlan[] = [
  { id: "monthly", title: "1 oylik", months: 1, amount: 39000, reviews: 0 },
  { id: "quarterly", title: "3 oylik", months: 3, amount: 109000, reviews: 1, popular: true },
  { id: "halfyear", title: "6 oylik", months: 6, amount: 219000, reviews: 3 },
  { id: "yearly", title: "12 oylik", months: 12, amount: 429000, reviews: 6 },
];

export const DEFAULT_PAYMENT: PaymentSettings = {
  card_number: "8600 0000 0000 0000",
  card_owner: "LEVELXENGLISH",
  instruction:
    "To'lovni amalga oshirgach, chek rasmini Telegram orqali yuboring. " +
    "Admin tasdiqlagach Premium faollashadi.",
};

/** Rasmiy Multilevel shkalasi (0–75): C1 65–75, B2 51–64, B1 38–50, 38 dan past — B1 dan quyi */
export const DEFAULT_CEFR_BANDS: CefrBands = { C1: 65, B2: 51, B1: 38, A2: 0 };
