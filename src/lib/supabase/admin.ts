import "server-only";

import { createClient } from "@supabase/supabase-js";
import { getServiceRoleKey, getSupabaseUrl } from "./env";

/**
 * ADMIN (service_role) klienti — RLS ni chetlab o'tadi.
 *
 * ⚠️ Faqat serverda ishlatiladi. "server-only" importi tufayli bu fayl
 * xatolik bilan brauzer paketiga tushib qolsa, build darhol to'xtaydi.
 *
 * Qayerda kerak:
 *  - test savollarining to'g'ri javoblarini o'qish (admin panelda)
 *  - foydalanuvchiga Premium berish / rolni o'zgartirish
 */
export function createAdminSupabase() {
  return createClient(getSupabaseUrl(), getServiceRoleKey(), {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
