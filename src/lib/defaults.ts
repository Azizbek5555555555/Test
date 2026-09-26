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
  { id: "monthly", title: "1 oylik", months: 1, amount: 99000 },
  {
    id: "quarterly",
    title: "3 oylik",
    months: 3,
    amount: 249000,
    popular: true,
  },
  { id: "yearly", title: "12 oylik", months: 12, amount: 790000 },
];

export const DEFAULT_PAYMENT: PaymentSettings = {
  card_number: "8600 0000 0000 0000",
  card_owner: "LEVELX ENGLISH",
  instruction:
    "To'lovni amalga oshirgach, chek rasmini Telegram orqali yuboring. " +
    "Admin tasdiqlagach Premium faollashadi.",
};

/** Hujjatning 12-bo'limidagi misolga mos: o'rtacha 62.25 → B2 */
export const DEFAULT_CEFR_BANDS: CefrBands = { C1: 75, B2: 60, B1: 45, A2: 30 };
