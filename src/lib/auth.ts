import { cache } from "react";
import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createServerSupabase } from "./supabase/server";
import { isSupabaseConfigured } from "./supabase/env";
import type { Profile } from "./types";

/** Joriy foydalanuvchi (Supabase Auth) — sozlanmagan bo'lsa null */
export const getUser = cache(async (): Promise<User | null> => {
  if (!isSupabaseConfigured()) return null;
  try {
    const supabase = await createServerSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user;
  } catch {
    return null;
  }
});

/** Joriy foydalanuvchining profili (profiles jadvali) */
export const getProfile = cache(async (): Promise<Profile | null> => {
  const user = await getUser();
  if (!user) return null;

  try {
    const supabase = await createServerSupabase();
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (data) return data as Profile;

    // Trigger biror sababga ko'ra ishlamagan bo'lsa — profilni yaratamiz
    const { data: created } = await supabase
      .from("profiles")
      .insert({
        id: user.id,
        email: user.email ?? null,
        full_name:
          (user.user_metadata?.full_name as string | undefined) ??
          (user.user_metadata?.name as string | undefined) ??
          null,
        avatar_url:
          (user.user_metadata?.avatar_url as string | undefined) ??
          (user.user_metadata?.picture as string | undefined) ??
          null,
      })
      .select("*")
      .maybeSingle();

    return (created as Profile | null) ?? null;
  } catch {
    return null;
  }
});

/** Premium muddati hisobga olingan holda tekshiradi */
export function profileHasPremium(profile: Profile | null): boolean {
  if (!profile) return false;
  if (profile.role === "admin" || profile.role === "teacher") return true;
  if (!profile.is_premium) return false;
  if (!profile.premium_until) return true;
  return new Date(profile.premium_until).getTime() > Date.now();
}

export function isStaff(profile: Profile | null): boolean {
  return profile?.role === "admin" || profile?.role === "teacher";
}

export function isAdmin(profile: Profile | null): boolean {
  return profile?.role === "admin";
}

/** Kirishni majburiy qiladi — aks holda /login ga yo'naltiradi */
export async function requireUser(nextPath?: string): Promise<User> {
  const user = await getUser();
  if (!user) {
    redirect(
      nextPath ? `/login?next=${encodeURIComponent(nextPath)}` : "/login",
    );
  }
  return user;
}

/** Profil bilan birga kirishni majburiy qiladi */
export async function requireProfile(nextPath?: string): Promise<Profile> {
  await requireUser(nextPath);
  const profile = await getProfile();
  if (!profile) redirect("/login");
  return profile;
}

/** Faqat admin/teacher uchun */
export async function requireStaff(): Promise<Profile> {
  const profile = await requireProfile("/admin");
  if (!isStaff(profile)) redirect("/");
  return profile;
}

/** Faqat admin uchun */
export async function requireAdmin(): Promise<Profile> {
  const profile = await requireProfile("/admin");
  if (!isAdmin(profile)) redirect("/admin");
  return profile;
}
