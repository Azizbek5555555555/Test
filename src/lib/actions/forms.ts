"use server";

import { getT } from "@/i18n/server";

import { revalidatePath } from "next/cache";
import { createServerSupabase } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth";
import type { ActionResult } from "./profile";

export type { ActionResult };

const PHONE_RE = /^[\d\s+()-]{7,20}$/;

/* -------------------------------------------------------------------------
   KURSGA YOZILISH (hujjat: 14-bo'lim)
   ------------------------------------------------------------------------- */
export async function applyToCourseAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const t = await getT();
  const courseId = String(formData.get("course_id") ?? "");
  const fullName = String(formData.get("full_name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const note = String(formData.get("note") ?? "").trim();

  if (!courseId) return { ok: false, message: t("Kurs tanlanmagan.", "No course selected.") };
  if (fullName.length < 2)
    return { ok: false, message: t("Ism-familiyani to'liq kiriting.", "Enter your full name.") };
  if (!PHONE_RE.test(phone))
    return { ok: false, message: t("Telefon raqamini to'g'ri kiriting.", "Enter a valid phone number.") };

  try {
    const profile = await getProfile();
    const supabase = await createServerSupabase();

    const { error } = await supabase.from("course_applications").insert({
      course_id: courseId,
      user_id: profile?.id ?? null,
      full_name: fullName.slice(0, 120),
      phone: phone.slice(0, 30),
      note: note ? note.slice(0, 1000) : null,
    });

    if (error) return { ok: false, message: error.message };
  } catch {
    return { ok: false, message: t("Arizani yuborib bo'lmadi.", "Could not send the application.") };
  }

  revalidatePath("/admin/applications");
  return {
    ok: true,
    message:
      t("Arizangiz qabul qilindi! Tez orada siz bilan bog'lanamiz.", "Your application has been received! We will contact you soon."),
  };
}

/* -------------------------------------------------------------------------
   BIZ BILAN BOG'LANISH (hujjat: 13-bo'lim)
   ------------------------------------------------------------------------- */
export async function sendContactMessageAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const t = await getT();
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();

  if (name.length < 2) return { ok: false, message: t("Ismingizni kiriting.", "Enter your name.") };
  if (message.length < 10)
    return { ok: false, message: t("Xabar kamida 10 ta belgidan iborat bo'lsin.", "The message must be at least 10 characters long.") };
  if (!email && !phone)
    return {
      ok: false,
      message: t("Email yoki telefon raqamdan birini kiriting.", "Enter an email or a phone number."),
    };
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return { ok: false, message: t("Email manzilini to'g'ri kiriting.", "Enter a valid email address.") };
  if (phone && !PHONE_RE.test(phone))
    return { ok: false, message: t("Telefon raqamini to'g'ri kiriting.", "Enter a valid phone number.") };

  try {
    const supabase = await createServerSupabase();
    const { error } = await supabase.from("contact_messages").insert({
      name: name.slice(0, 120),
      email: email ? email.slice(0, 160) : null,
      phone: phone ? phone.slice(0, 30) : null,
      message: message.slice(0, 3000),
    });

    if (error) return { ok: false, message: error.message };
  } catch {
    return { ok: false, message: t("Xabarni yuborib bo'lmadi.", "Could not send the message.") };
  }

  revalidatePath("/admin/messages");
  return {
    ok: true,
    message: t("Xabaringiz yuborildi! Tez orada javob beramiz.", "Your message has been sent! We will reply soon."),
  };
}

/* -------------------------------------------------------------------------
   PREMIUM SO'ROVI (hujjat: 8–9-bo'limlar)
   ------------------------------------------------------------------------- */
export async function requestPremiumAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const t = await getT();
  const plan = String(formData.get("plan") ?? "").trim();
  const note = String(formData.get("note") ?? "").trim();

  if (!plan) return { ok: false, message: t("Tarifni tanlang.", "Choose a plan.") };

  const profile = await getProfile();
  if (!profile)
    return { ok: false, message: t("Avval tizimga kiring.", "Please log in first.") };

  try {
    const supabase = await createServerSupabase();

    // Kutilayotgan so'rov bormi?
    const { data: existing } = await supabase
      .from("premium_requests")
      .select("id")
      .eq("user_id", profile.id)
      .eq("status", "pending")
      .limit(1)
      .maybeSingle();

    if (existing) {
      return {
        ok: true,
        message:
          t("Sizda allaqachon ko'rib chiqilayotgan so'rov bor. Admin tasdiqlashini kuting.", "You already have a request under review. Please wait for an admin to approve it."),
      };
    }

    // Muddat va narxni baza tarif sozlamalaridan o'zi qo'yadi
    // (0005: prepare_premium_request) — brauzerdan kelgan narxga ishonilmaydi
    const { error } = await supabase.from("premium_requests").insert({
      user_id: profile.id,
      plan: plan.slice(0, 40),
      note: note ? note.slice(0, 500) : null,
    });

    if (error) return { ok: false, message: error.message };
  } catch {
    return { ok: false, message: t("So'rovni yuborib bo'lmadi.", "Could not send the request.") };
  }

  revalidatePath("/admin/premium");
  revalidatePath("/premium");
  return {
    ok: true,
    message:
      t("So'rovingiz yuborildi! To'lovni amalga oshirib, chekni Telegram orqali yuboring — admin tasdiqlagach Premium faollashadi.", "Your request has been sent! Make the payment and send the receipt via Telegram — Premium activates once an admin approves it."),
  };
}
