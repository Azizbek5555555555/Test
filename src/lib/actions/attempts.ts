"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createServerSupabase } from "@/lib/supabase/server";
import { getProfile, profileHasPremium } from "@/lib/auth";
import type { AnswerMap, Attempt, AttemptMode } from "@/lib/types";

export interface AttemptActionResult {
  ok: boolean;
  message?: string;
  attemptId?: string;
}

/* -------------------------------------------------------------------------
   TESTNI BOSHLASH
   ------------------------------------------------------------------------- */
export async function startAttemptAction(formData: FormData): Promise<void> {
  const testSetId = String(formData.get("test_set_id") ?? "");
  const mode = (String(formData.get("mode") ?? "practice") ||
    "practice") as AttemptMode;

  if (!testSetId) redirect("/full-mock");

  const profile = await getProfile();
  if (!profile) {
    redirect(`/login?next=${encodeURIComponent("/full-mock")}`);
  }

  const supabase = await createServerSupabase();

  // Testni va uning Premium holatini tekshiramiz
  const { data: testSet } = await supabase
    .from("test_sets")
    .select("id, is_premium, published, category, duration_minutes")
    .eq("id", testSetId)
    .maybeSingle();

  const set = testSet as {
    id: string;
    is_premium: boolean;
    published: boolean;
    category: string;
    duration_minutes: number;
  } | null;

  if (!set || !set.published) redirect("/full-mock");

  if (set.is_premium && !profileHasPremium(profile)) {
    redirect("/premium?reason=locked");
  }

  const isExam = set.category === "exam_checking";
  const targetBase = isExam ? "/exam" : "/test";

  // Tugallanmagan urinish bo'lsa — o'shani davom ettiramiz
  const { data: existing } = await supabase
    .from("attempts")
    .select("id")
    .eq("test_set_id", set.id)
    .eq("user_id", profile.id)
    .eq("status", "in_progress")
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const openAttempt = existing as { id: string } | null;
  if (openAttempt) {
    redirect(`${targetBase}/${openAttempt.id}`);
  }

  const expiresAt = new Date(
    Date.now() + (set.duration_minutes || 60) * 60_000 + 5 * 60_000,
  ).toISOString();

  const { data: created, error } = await supabase
    .from("attempts")
    .insert({
      user_id: profile.id,
      test_set_id: set.id,
      mode: isExam ? "exam_checking" : mode,
      expires_at: expiresAt,
    })
    .select("id")
    .single();

  if (error || !created) {
    redirect("/full-mock?error=start");
  }

  redirect(`${targetBase}/${(created as { id: string }).id}`);
}

/* -------------------------------------------------------------------------
   JAVOBLARNI SAQLASH (avtomatik, har bir o'zgarishda)
   ------------------------------------------------------------------------- */
export async function saveAnswersAction(
  attemptId: string,
  answers: AnswerMap,
  currentPartIndex: number,
): Promise<AttemptActionResult> {
  const profile = await getProfile();
  if (!profile) return { ok: false, message: "Sessiya tugagan. Qayta kiring." };

  try {
    const supabase = await createServerSupabase();
    const { error } = await supabase
      .from("attempts")
      .update({
        answers,
        current_part_index: Math.max(0, currentPartIndex),
      })
      .eq("id", attemptId)
      .eq("user_id", profile.id)
      .eq("status", "in_progress");

    if (error) return { ok: false, message: error.message };
    return { ok: true };
  } catch {
    return { ok: false, message: "Saqlab bo'lmadi. Internetni tekshiring." };
  }
}

/* -------------------------------------------------------------------------
   TESTNI YAKUNLASH VA BAHOLASH
   ------------------------------------------------------------------------- */
export async function submitAttemptAction(
  attemptId: string,
  answers: AnswerMap,
): Promise<AttemptActionResult> {
  const profile = await getProfile();
  if (!profile) return { ok: false, message: "Sessiya tugagan. Qayta kiring." };

  try {
    const supabase = await createServerSupabase();

    // Oxirgi javoblarni saqlaymiz
    await supabase
      .from("attempts")
      .update({ answers })
      .eq("id", attemptId)
      .eq("user_id", profile.id)
      .eq("status", "in_progress");

    // Baholash butunlay serverda bajariladi
    const { error } = await supabase.rpc("score_attempt", {
      p_attempt_id: attemptId,
    });

    if (error) return { ok: false, message: error.message };

    revalidatePath("/profile/results");
    return { ok: true, attemptId };
  } catch {
    return { ok: false, message: "Yakunlashda xatolik yuz berdi." };
  }
}

/* -------------------------------------------------------------------------
   URINISHNI BEKOR QILISH
   ------------------------------------------------------------------------- */
export async function abandonAttemptAction(formData: FormData): Promise<void> {
  const attemptId = String(formData.get("attempt_id") ?? "");
  const profile = await getProfile();

  if (profile && attemptId) {
    const supabase = await createServerSupabase();
    await supabase
      .from("attempts")
      .delete()
      .eq("id", attemptId)
      .eq("user_id", profile.id)
      .eq("status", "in_progress");
  }

  redirect("/profile/results");
}

/* -------------------------------------------------------------------------
   Natijani qayta o'qish (client uchun)
   ------------------------------------------------------------------------- */
export async function fetchAttemptAction(
  attemptId: string,
): Promise<Attempt | null> {
  try {
    const supabase = await createServerSupabase();
    const { data } = await supabase
      .from("attempts")
      .select("*")
      .eq("id", attemptId)
      .maybeSingle();
    return (data as Attempt | null) ?? null;
  } catch {
    return null;
  }
}
