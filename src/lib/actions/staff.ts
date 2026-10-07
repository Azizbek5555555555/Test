"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { getProfile, isAdmin } from "@/lib/auth";
import { clientIp, recordFailure, tooManyFailures } from "@/lib/rate-limit";
import { STAFF_LOGIN_RE, STAFF_PASSWORD_MIN, isStaffLoginEmail, loginToEmail } from "@/lib/staff-login";
import type { ActionResult } from "./profile";

const str = (formData: FormData, key: string) => String(formData.get(key) ?? "").trim();

/** Faqat sayt ichidagi manzilga qaytaramiz (ochiq redirect bo'lmasin) */
function safeNext(raw: string): string {
  return raw.startsWith("/admin") && !raw.startsWith("//") ? raw : "/admin";
}

/* =========================================================================
   KIRISH: login + parol (faqat admin va o'qituvchilar)
   ========================================================================= */
export async function staffSignInAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const login = str(formData, "login");
  const password = String(formData.get("password") ?? "");
  const next = safeNext(str(formData, "next"));

  const email = loginToEmail(login);
  if (!email || !password) return { ok: false, message: "Login va parolni kiriting." };

  // Parolni taxmin qilib ko'rishdan himoya: 10 daqiqada bitta IP'dan 8 ta, bitta loginga 20 ta xato urinish
  const ip = await clientIp();
  const tenMin = 10 * 60 * 1000;
  const ipKey = `staff-login:ip:${ip}`;
  const userKey = `staff-login:user:${email}`;
  if (tooManyFailures(ipKey, 8, tenMin) || tooManyFailures(userKey, 20, tenMin)) {
    return { ok: false, message: "Juda ko'p noto'g'ri urinish. 10 daqiqadan keyin qayta urinib ko'ring." };
  }

  const supabase = await createServerSupabase();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) {
    recordFailure(ipKey);
    recordFailure(userKey);
    // qaysi biri noto'g'ri ekanini aytmaymiz — login borligini bilib bo'lmasin
    return { ok: false, message: "Login yoki parol noto'g'ri." };
  }

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", data.user.id).maybeSingle();
  const role = (profile as { role?: string } | null)?.role;
  if (role !== "admin" && role !== "teacher") {
    await supabase.auth.signOut();
    return { ok: false, message: "Bu kirish faqat admin va o'qituvchilar uchun." };
  }

  redirect(next);
}

/* =========================================================================
   XODIMLAR: login va parol bilan akkaunt yaratish / parolni almashtirish
   ========================================================================= */
async function requireAdmin(): Promise<ActionResult | null> {
  return isAdmin(await getProfile()) ? null : { ok: false, message: "Ruxsat yo'q. Faqat administrator." };
}

function checkPassword(password: string): string | null {
  if (password.length < STAFF_PASSWORD_MIN) return `Parol kamida ${STAFF_PASSWORD_MIN} ta belgidan iborat bo'lsin.`;
  if (password.length > 72) return "Parol juda uzun (ko'pi bilan 72 ta belgi).";
  if (!/[a-zA-Z]/.test(password) || !/\d/.test(password)) return "Parolda harf ham, raqam ham bo'lsin.";
  return null;
}

export async function createStaffAccountAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const denied = await requireAdmin();
  if (denied) return denied;

  const fullName = str(formData, "full_name");
  const login = str(formData, "login").toLowerCase();
  const password = String(formData.get("password") ?? "");
  const role = str(formData, "role") === "admin" ? "admin" : "teacher";

  if (!fullName) return { ok: false, message: "Ism-familiyani kiriting." };
  if (!STAFF_LOGIN_RE.test(login))
    return { ok: false, message: "Login 3–32 ta belgi: lotin harflari, raqamlar, nuqta, chiziqcha (bo'sh joysiz)." };
  const weak = checkPassword(password);
  if (weak) return { ok: false, message: weak };

  const email = loginToEmail(login)!;
  try {
    const admin = createAdminSupabase();
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    });
    if (error || !data.user) {
      const taken = /already|registered|exists/i.test(error?.message ?? "");
      return { ok: false, message: taken ? "Bu login band. Boshqasini tanlang." : `Akkaunt yaratilmadi: ${error?.message ?? "noma'lum xato"}` };
    }

    // Profil qatorini trigger yaratadi — rol va ism shu yerda yoziladi
    const { error: roleError } = await admin
      .from("profiles")
      .upsert({ id: data.user.id, email, full_name: fullName, role, onboarded: true }, { onConflict: "id" });
    if (roleError) {
      await admin.auth.admin.deleteUser(data.user.id);
      return { ok: false, message: `Rol berilmadi: ${roleError.message}` };
    }
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Akkaunt yaratilmadi." };
  }

  revalidatePath("/admin/staff");
  revalidatePath("/admin/users");
  return { ok: true, message: `Tayyor! Login: ${login} — ${role === "admin" ? "administrator" : "o'qituvchi"} sifatida kira oladi.` };
}

export async function setStaffPasswordAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const denied = await requireAdmin();
  if (denied) return denied;

  const userId = str(formData, "user_id");
  const password = String(formData.get("password") ?? "");
  if (!userId) return { ok: false, message: "Xodim tanlanmagan." };
  const weak = checkPassword(password);
  if (weak) return { ok: false, message: weak };

  try {
    const admin = createAdminSupabase();
    // Parol faqat xodimlarga beriladi (o'quvchilar Google / e-mail kod bilan kiradi)
    const { data: profile } = await admin.from("profiles").select("role").eq("id", userId).maybeSingle();
    const role = (profile as { role?: string } | null)?.role;
    if (role !== "admin" && role !== "teacher") return { ok: false, message: "Parol faqat admin va o'qituvchilarga beriladi." };

    const { error } = await admin.auth.admin.updateUserById(userId, { password });
    if (error) return { ok: false, message: `Parol saqlanmadi: ${error.message}` };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Parol saqlanmadi." };
  }

  revalidatePath("/admin/staff");
  return { ok: true, message: "Yangi parol saqlandi." };
}

/** Login bilan yaratilgan (ichki manzilli) akkauntni o'chirish. Google akkauntlariga tegilmaydi. */
export async function deleteStaffAccountAction(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const denied = await requireAdmin();
  if (denied) return denied;

  const userId = str(formData, "user_id");
  const me = await getProfile();
  if (!userId) return { ok: false, message: "Xodim tanlanmagan." };
  if (me?.id === userId) return { ok: false, message: "O'zingizning akkauntingizni o'chira olmaysiz." };

  try {
    const admin = createAdminSupabase();
    const { data } = await admin.auth.admin.getUserById(userId);
    if (!isStaffLoginEmail(data.user?.email)) {
      return { ok: false, message: "Faqat login bilan yaratilgan akkauntlarni o'chirish mumkin." };
    }
    const { error } = await admin.auth.admin.deleteUser(userId);
    if (error) return { ok: false, message: error.message };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "O'chirilmadi." };
  }

  revalidatePath("/admin/staff");
  revalidatePath("/admin/users");
  return { ok: true, message: "Akkaunt o'chirildi." };
}
