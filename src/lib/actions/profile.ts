"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabase } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";

export interface ActionResult {
  ok: boolean;
  message?: string;
}

/** Profil ma'lumotlarini yangilash (ism, telefon) */
export async function updateProfileAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const user = await getUser();
  if (!user) return { ok: false, message: "Avval tizimga kiring." };

  const fullName = String(formData.get("full_name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();

  if (fullName.length < 2) {
    return { ok: false, message: "Ism-familiyani to'liq kiriting." };
  }
  if (fullName.length > 80) {
    return { ok: false, message: "Ism-familiya juda uzun." };
  }
  if (phone && !/^[\d\s+()-]{7,20}$/.test(phone)) {
    return { ok: false, message: "Telefon raqamini to'g'ri kiriting." };
  }

  try {
    const supabase = await createServerSupabase();
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: fullName,
        phone: phone || null,
        onboarded: true,
      })
      .eq("id", user.id);

    if (error) return { ok: false, message: error.message };
  } catch {
    return { ok: false, message: "Saqlashda xatolik yuz berdi." };
  }

  revalidatePath("/profile");
  revalidatePath("/", "layout");
  return { ok: true, message: "Saqlandi." };
}
