import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabaseAnonKey, getSupabaseUrl } from "./env";

/**
 * Server Component / Server Action / Route Handler uchun Supabase klienti.
 * Foydalanuvchi nomidan ishlaydi — ya'ni RLS qoidalari to'liq kuchda bo'ladi.
 */
export async function createServerSupabase() {
  const cookieStore = await cookies();

  return createServerClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Server Component ichidan cookie yozib bo'lmaydi.
          // Sessiyani middleware yangilab turadi, shuning uchun bu xavfsiz.
        }
      },
    },
  });
}
