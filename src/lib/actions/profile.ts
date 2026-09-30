"use server";

import { getT } from "@/i18n/server";

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
  const t = await getT();
  const user = await getUser();
  if (!user) return { ok: false, message: t("Avval tizimga kiring.", "Please log in first.") };

  const fullName = String(formData.get("full_name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();

  if (fullName.length < 2) {
    return { ok: false, message: t("Ism-familiyani to'liq kiriting.", "Enter your full name.") };
  }
  if (fullName.length > 80) {
    return { ok: false, message: t("Ism-familiya juda uzun.", "The name is too long.") };
  }
  if (phone && !/^[\d\s+()-]{7,20}$/.test(phone)) {
    return { ok: false, message: t("Telefon raqamini to'g'ri kiriting.", "Enter a valid phone number.") };
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
    return { ok: false, message: t("Saqlashda xatolik yuz berdi.", "Something went wrong while saving.") };
  }

  revalidatePath("/profile");
  revalidatePath("/", "layout");
  return { ok: true, message: t("Saqlandi.", "Saved.") };
}
