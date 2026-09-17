"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabase } from "@/lib/supabase/server";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { getProfile, isAdmin, isStaff } from "@/lib/auth";
import type { ActionResult } from "./profile";
import type { UserRole } from "@/lib/types";

export type { ActionResult };

/* -------------------------------------------------------------------------
   Yordamchilar
   ------------------------------------------------------------------------- */
async function requireStaffAction(): Promise<ActionResult | null> {
  const profile = await getProfile();
  if (!isStaff(profile)) {
    return { ok: false, message: "Ruxsat yo'q. Faqat admin/o'qituvchi." };
  }
  return null;
}

async function requireAdminAction(): Promise<ActionResult | null> {
  const profile = await getProfile();
  if (!isAdmin(profile)) {
    return { ok: false, message: "Ruxsat yo'q. Faqat administrator." };
  }
  return null;
}

function str(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

function optStr(formData: FormData, key: string): string | null {
  const value = str(formData, key);
  return value === "" ? null : value;
}

function num(formData: FormData, key: string, fallback = 0): number {
  const value = Number(formData.get(key));
  return Number.isFinite(value) ? value : fallback;
}

function bool(formData: FormData, key: string): boolean {
  const value = formData.get(key);
  return value === "on" || value === "true" || value === "1";
}

/** JSON matnini xavfsiz o'qiydi */
function parseJson(raw: string, fallback: unknown = null): unknown {
  const trimmed = raw.trim();
  if (!trimmed) return fallback;
  try {
    return JSON.parse(trimmed);
  } catch {
    return undefined; // xato — chaqiruvchi tekshiradi
  }
}

/* =========================================================================
   FOYDALANUVCHILAR — Premium va rollar
   RLS ustun darajasida bloklanganligi uchun service_role klienti ishlatiladi.
   ========================================================================= */

export async function setPremiumAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const denied = await requireAdminAction();
  if (denied) return denied;

  const userId = str(formData, "user_id");
  const months = num(formData, "months", 0);
  const enable = bool(formData, "enable");

  if (!userId) return { ok: false, message: "Foydalanuvchi tanlanmagan." };

  try {
    const admin = createAdminSupabase();

    let premiumUntil: string | null = null;
    if (enable && months > 0) {
      const until = new Date();
      until.setMonth(until.getMonth() + Math.min(60, Math.max(1, months)));
      premiumUntil = until.toISOString();
    }

    const { error } = await admin
      .from("profiles")
      .update({
        is_premium: enable,
        premium_until: enable ? premiumUntil : null,
      })
      .eq("id", userId);

    if (error) return { ok: false, message: error.message };
  } catch (error) {
    return { ok: false, message: describeError(error) };
  }

  revalidatePath("/admin/users");
  return {
    ok: true,
    message: enable
      ? `Premium yoqildi${months > 0 ? ` (${months} oy)` : " (muddatsiz)"}.`
      : "Premium o'chirildi.",
  };
}

export async function setRoleAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const denied = await requireAdminAction();
  if (denied) return denied;

  const userId = str(formData, "user_id");
  const role = str(formData, "role") as UserRole;

  if (!["student", "teacher", "admin"].includes(role)) {
    return { ok: false, message: "Noto'g'ri rol." };
  }

  const me = await getProfile();
  if (me?.id === userId && role !== "admin") {
    return {
      ok: false,
      message: "O'zingizning admin rolingizni olib tashlay olmaysiz.",
    };
  }

  try {
    const admin = createAdminSupabase();
    const { error } = await admin
      .from("profiles")
      .update({ role })
      .eq("id", userId);
    if (error) return { ok: false, message: error.message };
  } catch (error) {
    return { ok: false, message: describeError(error) };
  }

  revalidatePath("/admin/users");
  return { ok: true, message: "Rol yangilandi." };
}

/* =========================================================================
   PREMIUM SO'ROVLARI
   ========================================================================= */

export async function reviewPremiumRequestAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const denied = await requireAdminAction();
  if (denied) return denied;

  const requestId = str(formData, "request_id");
  const decision = str(formData, "decision"); // approve | reject
  const userId = str(formData, "user_id");
  const months = num(formData, "months", 1);

  if (!requestId || !userId)
    return { ok: false, message: "So'rov topilmadi." };

  const me = await getProfile();

  try {
    const admin = createAdminSupabase();

    const { error: reqError } = await admin
      .from("premium_requests")
      .update({
        status: decision === "approve" ? "approved" : "rejected",
        reviewed_by: me?.id ?? null,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", requestId);

    if (reqError) return { ok: false, message: reqError.message };

    if (decision === "approve") {
      // Mavjud muddatni hisobga olamiz — uzaytirish
      const { data: existing } = await admin
        .from("profiles")
        .select("premium_until")
        .eq("id", userId)
        .maybeSingle();

      const current = (existing as { premium_until: string | null } | null)
        ?.premium_until;
      const base =
        current && new Date(current).getTime() > Date.now()
          ? new Date(current)
          : new Date();

      base.setMonth(base.getMonth() + Math.min(60, Math.max(1, months)));

      const { error: profError } = await admin
        .from("profiles")
        .update({ is_premium: true, premium_until: base.toISOString() })
        .eq("id", userId);

      if (profError) return { ok: false, message: profError.message };
    }
  } catch (error) {
    return { ok: false, message: describeError(error) };
  }

  revalidatePath("/admin/premium");
  revalidatePath("/admin/users");
  return {
    ok: true,
    message:
      decision === "approve"
        ? "So'rov tasdiqlandi va Premium faollashtirildi."
        : "So'rov rad etildi.",
  };
}

/* =========================================================================
   O'QITUVCHI BAHOSI (Writing / Speaking)
   ========================================================================= */

export async function gradeAttemptAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const denied = await requireStaffAction();
  if (denied) return denied;

  const attemptId = str(formData, "attempt_id");
  const writingRaw = str(formData, "writing");
  const speakingRaw = str(formData, "speaking");
  const writingNote = str(formData, "writing_note");
  const speakingNote = str(formData, "speaking_note");

  if (!attemptId) return { ok: false, message: "Urinish topilmadi." };

  const writing = writingRaw === "" ? null : Number(writingRaw);
  const speaking = speakingRaw === "" ? null : Number(speakingRaw);

  if (writing !== null && (!Number.isFinite(writing) || writing < 0 || writing > 100))
    return { ok: false, message: "Writing bali 0–100 oralig'ida bo'lsin." };
  if (speaking !== null && (!Number.isFinite(speaking) || speaking < 0 || speaking > 100))
    return { ok: false, message: "Speaking bali 0–100 oralig'ida bo'lsin." };

  try {
    const supabase = await createServerSupabase();
    const { error } = await supabase.rpc("grade_attempt_manual", {
      p_attempt_id: attemptId,
      p_writing: writing,
      p_speaking: speaking,
      p_feedback: {
        ...(writingNote ? { writing: writingNote } : {}),
        ...(speakingNote ? { speaking: speakingNote } : {}),
      },
    });

    if (error) return { ok: false, message: error.message };
  } catch (error) {
    return { ok: false, message: describeError(error) };
  }

  revalidatePath("/admin/grading");
  revalidatePath(`/results/${attemptId}`);
  return { ok: true, message: "Baho saqlandi va o'quvchiga ko'rinadi." };
}

/* =========================================================================
   KONTENT: TESTLAR
   ========================================================================= */

export async function upsertTestSetAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const denied = await requireStaffAction();
  if (denied) return denied;

  const id = optStr(formData, "id");
  const slug = str(formData, "slug");
  const title = str(formData, "title");

  if (!slug || !/^[a-z0-9-]+$/.test(slug))
    return {
      ok: false,
      message: "Slug faqat kichik lotin harflari, raqam va '-' dan iborat bo'lsin.",
    };
  if (title.length < 3) return { ok: false, message: "Sarlavhani kiriting." };

  const payload = {
    slug,
    title,
    description: optStr(formData, "description"),
    category: str(formData, "category"),
    section: optStr(formData, "section"),
    year_label: optStr(formData, "year_label"),
    level: optStr(formData, "level"),
    duration_minutes: Math.max(1, num(formData, "duration_minutes", 60)),
    is_premium: bool(formData, "is_premium"),
    published: bool(formData, "published"),
    order_index: num(formData, "order_index", 0),
  };

  try {
    const supabase = await createServerSupabase();
    const query = id
      ? supabase.from("test_sets").update(payload).eq("id", id)
      : supabase.from("test_sets").insert(payload);

    const { error } = await query;
    if (error) return { ok: false, message: error.message };
  } catch (error) {
    return { ok: false, message: describeError(error) };
  }

  revalidatePath("/admin/tests");
  return { ok: true, message: id ? "Test yangilandi." : "Test qo'shildi." };
}

export async function deleteTestSetAction(formData: FormData): Promise<void> {
  const denied = await requireStaffAction();
  if (denied) return;

  const id = str(formData, "id");
  if (!id) return;

  const supabase = await createServerSupabase();
  await supabase.from("test_sets").delete().eq("id", id);
  revalidatePath("/admin/tests");
}

export async function upsertTestPartAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const denied = await requireStaffAction();
  if (denied) return denied;

  const id = optStr(formData, "id");
  const testSetId = str(formData, "test_set_id");
  const title = str(formData, "title");

  if (!testSetId) return { ok: false, message: "Test tanlanmagan." };
  if (title.length < 2) return { ok: false, message: "Bo'lim nomini kiriting." };

  const payload = {
    test_set_id: testSetId,
    section: str(formData, "section"),
    title,
    instructions: optStr(formData, "instructions"),
    passage: optStr(formData, "passage"),
    audio_url: optStr(formData, "audio_url"),
    transcript: optStr(formData, "transcript"),
    image_url: optStr(formData, "image_url"),
    duration_minutes: Math.max(1, num(formData, "duration_minutes", 15)),
    order_index: num(formData, "order_index", 0),
  };

  try {
    const supabase = await createServerSupabase();
    const query = id
      ? supabase.from("test_parts").update(payload).eq("id", id)
      : supabase.from("test_parts").insert(payload);

    const { error } = await query;
    if (error) return { ok: false, message: error.message };
  } catch (error) {
    return { ok: false, message: describeError(error) };
  }

  revalidatePath(`/admin/tests/${testSetId}`);
  return { ok: true, message: id ? "Bo'lim yangilandi." : "Bo'lim qo'shildi." };
}

export async function deleteTestPartAction(formData: FormData): Promise<void> {
  const denied = await requireStaffAction();
  if (denied) return;

  const id = str(formData, "id");
  const testSetId = str(formData, "test_set_id");
  if (!id) return;

  const supabase = await createServerSupabase();
  await supabase.from("test_parts").delete().eq("id", id);
  revalidatePath(`/admin/tests/${testSetId}`);
}

export async function upsertQuestionAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const denied = await requireStaffAction();
  if (denied) return denied;

  const id = optStr(formData, "id");
  const partId = str(formData, "part_id");
  const testSetId = str(formData, "test_set_id");
  const kind = str(formData, "kind");
  const prompt = str(formData, "prompt");

  if (!partId) return { ok: false, message: "Bo'lim tanlanmagan." };
  if (prompt.length < 3) return { ok: false, message: "Savol matnini kiriting." };

  const options = parseJson(str(formData, "options"), []);
  if (options === undefined)
    return {
      ok: false,
      message: 'Variantlar JSON formatida bo\'lsin. Misol: ["A","B","C","D"]',
    };

  const manual = kind === "essay" || kind === "speaking_prompt";
  const correctRaw = str(formData, "correct_answer");
  const correct = manual ? null : parseJson(correctRaw, null);

  if (correct === undefined)
    return {
      ok: false,
      message: 'To\'g\'ri javob JSON formatida bo\'lsin. Misol: "B" yoki ["colour","color"]',
    };

  const payload = {
    part_id: partId,
    kind,
    prompt,
    help_text: optStr(formData, "help_text"),
    options,
    correct_answer: correct,
    points: Math.max(0, num(formData, "points", 1)),
    explanation: optStr(formData, "explanation"),
    order_index: num(formData, "order_index", 0),
  };

  try {
    const supabase = await createServerSupabase();
    const query = id
      ? supabase.from("questions").update(payload).eq("id", id)
      : supabase.from("questions").insert(payload);

    const { error } = await query;
    if (error) return { ok: false, message: error.message };
  } catch (error) {
    return { ok: false, message: describeError(error) };
  }

  revalidatePath(`/admin/tests/${testSetId}`);
  return { ok: true, message: id ? "Savol yangilandi." : "Savol qo'shildi." };
}

export async function deleteQuestionAction(formData: FormData): Promise<void> {
  const denied = await requireStaffAction();
  if (denied) return;

  const id = str(formData, "id");
  const testSetId = str(formData, "test_set_id");
  if (!id) return;

  const supabase = await createServerSupabase();
  await supabase.from("questions").delete().eq("id", id);
  revalidatePath(`/admin/tests/${testSetId}`);
}

/* =========================================================================
   KONTENT: MAQOLALAR
   ========================================================================= */

export async function upsertArticleAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const denied = await requireStaffAction();
  if (denied) return denied;

  const id = optStr(formData, "id");
  const slug = str(formData, "slug");
  const title = str(formData, "title");
  const body = str(formData, "body");

  if (!slug || !/^[a-z0-9-]+$/.test(slug))
    return { ok: false, message: "Slug noto'g'ri formatda." };
  if (title.length < 3) return { ok: false, message: "Sarlavhani kiriting." };
  if (body.length < 20) return { ok: false, message: "Maqola matnini kiriting." };

  const vocabulary = parseJson(str(formData, "vocabulary"), []);
  if (vocabulary === undefined)
    return {
      ok: false,
      message:
        'Lug\'at JSON formatida bo\'lsin. Misol: [{"word":"achievement","meaning":"yutuq"}]',
    };

  const payload = {
    slug,
    title,
    topic: str(formData, "topic") || "science",
    excerpt: optStr(formData, "excerpt"),
    cover_url: optStr(formData, "cover_url"),
    body,
    level: optStr(formData, "level"),
    read_minutes: Math.max(1, num(formData, "read_minutes", 5)),
    vocabulary,
    is_premium: bool(formData, "is_premium"),
    published: bool(formData, "published"),
    order_index: num(formData, "order_index", 0),
  };

  try {
    const supabase = await createServerSupabase();
    const query = id
      ? supabase.from("articles").update(payload).eq("id", id)
      : supabase.from("articles").insert(payload);

    const { error } = await query;
    if (error) return { ok: false, message: error.message };
  } catch (error) {
    return { ok: false, message: describeError(error) };
  }

  revalidatePath("/admin/articles");
  return { ok: true, message: id ? "Maqola yangilandi." : "Maqola qo'shildi." };
}

export async function deleteArticleAction(formData: FormData): Promise<void> {
  const denied = await requireStaffAction();
  if (denied) return;

  const id = str(formData, "id");
  if (!id) return;

  const supabase = await createServerSupabase();
  await supabase.from("articles").delete().eq("id", id);
  revalidatePath("/admin/articles");
}

export async function upsertArticleQuestionAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const denied = await requireStaffAction();
  if (denied) return denied;

  const id = optStr(formData, "id");
  const articleId = str(formData, "article_id");
  const prompt = str(formData, "prompt");

  if (!articleId) return { ok: false, message: "Maqola tanlanmagan." };
  if (prompt.length < 3) return { ok: false, message: "Savol matnini kiriting." };

  const options = parseJson(str(formData, "options"), []);
  const correct = parseJson(str(formData, "correct_answer"), null);

  if (options === undefined || correct === undefined)
    return { ok: false, message: "Variantlar yoki javob JSON formatida emas." };

  const payload = {
    article_id: articleId,
    kind: str(formData, "kind") || "mcq",
    prompt,
    options,
    correct_answer: correct,
    explanation: optStr(formData, "explanation"),
    order_index: num(formData, "order_index", 0),
  };

  try {
    const supabase = await createServerSupabase();
    const query = id
      ? supabase.from("article_questions").update(payload).eq("id", id)
      : supabase.from("article_questions").insert(payload);

    const { error } = await query;
    if (error) return { ok: false, message: error.message };
  } catch (error) {
    return { ok: false, message: describeError(error) };
  }

  revalidatePath(`/admin/articles/${articleId}`);
  return { ok: true, message: id ? "Savol yangilandi." : "Savol qo'shildi." };
}

export async function deleteArticleQuestionAction(
  formData: FormData,
): Promise<void> {
  const denied = await requireStaffAction();
  if (denied) return;

  const id = str(formData, "id");
  const articleId = str(formData, "article_id");
  if (!id) return;

  const supabase = await createServerSupabase();
  await supabase.from("article_questions").delete().eq("id", id);
  revalidatePath(`/admin/articles/${articleId}`);
}

/* =========================================================================
   KONTENT: VOCABULARY
   ========================================================================= */

export async function upsertVocabPackAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const denied = await requireStaffAction();
  if (denied) return denied;

  const id = optStr(formData, "id");
  const slug = str(formData, "slug");
  const title = str(formData, "title");

  if (!slug || !/^[a-z0-9-]+$/.test(slug))
    return { ok: false, message: "Slug noto'g'ri formatda." };
  if (title.length < 2) return { ok: false, message: "To'plam nomini kiriting." };

  const payload = {
    slug,
    title,
    description: optStr(formData, "description"),
    level: optStr(formData, "level"),
    emoji: optStr(formData, "emoji") ?? "📘",
    is_premium: bool(formData, "is_premium"),
    published: bool(formData, "published"),
    order_index: num(formData, "order_index", 0),
  };

  try {
    const supabase = await createServerSupabase();
    const query = id
      ? supabase.from("vocab_packs").update(payload).eq("id", id)
      : supabase.from("vocab_packs").insert(payload);

    const { error } = await query;
    if (error) return { ok: false, message: error.message };
  } catch (error) {
    return { ok: false, message: describeError(error) };
  }

  revalidatePath("/admin/vocabulary");
  return { ok: true, message: id ? "To'plam yangilandi." : "To'plam qo'shildi." };
}

export async function deleteVocabPackAction(formData: FormData): Promise<void> {
  const denied = await requireStaffAction();
  if (denied) return;

  const id = str(formData, "id");
  if (!id) return;

  const supabase = await createServerSupabase();
  await supabase.from("vocab_packs").delete().eq("id", id);
  revalidatePath("/admin/vocabulary");
}

export async function upsertVocabWordAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const denied = await requireStaffAction();
  if (denied) return denied;

  const id = optStr(formData, "id");
  const packId = str(formData, "pack_id");
  const word = str(formData, "word");
  const meaning = str(formData, "meaning_uz");

  if (!packId) return { ok: false, message: "To'plam tanlanmagan." };
  if (!word) return { ok: false, message: "So'zni kiriting." };
  if (!meaning) return { ok: false, message: "Tarjimani kiriting." };

  const options = parseJson(str(formData, "options"), []);
  if (options === undefined || !Array.isArray(options) || options.length < 2)
    return {
      ok: false,
      message: 'Variantlar kamida 2 ta bo\'lsin. Misol: ["Maqsad","Yutuq","Imkoniyat","Mas\'uliyat"]',
    };

  const correctIndex = num(formData, "correct_index", 0);
  if (correctIndex < 0 || correctIndex >= options.length)
    return {
      ok: false,
      message: `To'g'ri javob raqami 0 dan ${options.length - 1} gacha bo'lsin.`,
    };

  const payload = {
    pack_id: packId,
    word,
    meaning_uz: meaning,
    meaning_en: optStr(formData, "meaning_en"),
    example: optStr(formData, "example"),
    options,
    correct_index: correctIndex,
    order_index: num(formData, "order_index", 0),
  };

  try {
    const supabase = await createServerSupabase();
    const query = id
      ? supabase.from("vocab_words").update(payload).eq("id", id)
      : supabase.from("vocab_words").insert(payload);

    const { error } = await query;
    if (error) return { ok: false, message: error.message };
  } catch (error) {
    return { ok: false, message: describeError(error) };
  }

  revalidatePath(`/admin/vocabulary/${packId}`);
  return { ok: true, message: id ? "So'z yangilandi." : "So'z qo'shildi." };
}

export async function deleteVocabWordAction(formData: FormData): Promise<void> {
  const denied = await requireStaffAction();
  if (denied) return;

  const id = str(formData, "id");
  const packId = str(formData, "pack_id");
  if (!id) return;

  const supabase = await createServerSupabase();
  await supabase.from("vocab_words").delete().eq("id", id);
  revalidatePath(`/admin/vocabulary/${packId}`);
}

/* =========================================================================
   KONTENT: KURSLAR
   ========================================================================= */

export async function upsertCourseAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const denied = await requireStaffAction();
  if (denied) return denied;

  const id = optStr(formData, "id");
  const slug = str(formData, "slug");
  const title = str(formData, "title");

  if (!slug || !/^[a-z0-9-]+$/.test(slug))
    return { ok: false, message: "Slug noto'g'ri formatda." };
  if (title.length < 3) return { ok: false, message: "Kurs nomini kiriting." };

  const payload = {
    slug,
    title,
    level: optStr(formData, "level"),
    summary: optStr(formData, "summary"),
    description: optStr(formData, "description"),
    duration: optStr(formData, "duration"),
    days: optStr(formData, "days"),
    time_text: optStr(formData, "time_text"),
    price: optStr(formData, "price"),
    address: optStr(formData, "address"),
    image_url: optStr(formData, "image_url"),
    seats: formData.get("seats") ? num(formData, "seats", 0) : null,
    published: bool(formData, "published"),
    order_index: num(formData, "order_index", 0),
  };

  try {
    const supabase = await createServerSupabase();
    const query = id
      ? supabase.from("courses").update(payload).eq("id", id)
      : supabase.from("courses").insert(payload);

    const { error } = await query;
    if (error) return { ok: false, message: error.message };
  } catch (error) {
    return { ok: false, message: describeError(error) };
  }

  revalidatePath("/admin/courses");
  revalidatePath("/courses");
  return { ok: true, message: id ? "Kurs yangilandi." : "Kurs qo'shildi." };
}

export async function deleteCourseAction(formData: FormData): Promise<void> {
  const denied = await requireStaffAction();
  if (denied) return;

  const id = str(formData, "id");
  if (!id) return;

  const supabase = await createServerSupabase();
  await supabase.from("courses").delete().eq("id", id);
  revalidatePath("/admin/courses");
}

/* =========================================================================
   ARIZALAR VA XABARLAR
   ========================================================================= */

export async function updateApplicationStatusAction(
  formData: FormData,
): Promise<void> {
  const denied = await requireStaffAction();
  if (denied) return;

  const id = str(formData, "id");
  const status = str(formData, "status");
  if (!id || !["new", "contacted", "enrolled", "rejected"].includes(status))
    return;

  const supabase = await createServerSupabase();
  await supabase.from("course_applications").update({ status }).eq("id", id);
  revalidatePath("/admin/applications");
}

export async function toggleMessageHandledAction(
  formData: FormData,
): Promise<void> {
  const denied = await requireStaffAction();
  if (denied) return;

  const id = str(formData, "id");
  const handled = bool(formData, "handled");
  if (!id) return;

  const supabase = await createServerSupabase();
  await supabase.from("contact_messages").update({ handled }).eq("id", id);
  revalidatePath("/admin/messages");
}

/* =========================================================================
   SAYT SOZLAMALARI
   ========================================================================= */

export async function updateSettingAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const denied = await requireAdminAction();
  if (denied) return denied;

  const key = str(formData, "key");
  const raw = str(formData, "value");

  if (!key) return { ok: false, message: "Kalit ko'rsatilmagan." };

  const value = parseJson(raw, null);
  if (value === undefined)
    return { ok: false, message: "Qiymat to'g'ri JSON formatida emas." };

  try {
    const supabase = await createServerSupabase();
    const { error } = await supabase
      .from("site_settings")
      .upsert({ key, value }, { onConflict: "key" });

    if (error) return { ok: false, message: error.message };
  } catch (error) {
    return { ok: false, message: describeError(error) };
  }

  revalidatePath("/", "layout");
  revalidatePath("/admin/settings");
  return { ok: true, message: "Sozlama saqlandi." };
}

/* ------------------------------------------------------------------------- */

function describeError(error: unknown): string {
  if (error instanceof Error) {
    if (error.message.includes("SUPABASE_SERVICE_ROLE_KEY")) {
      return "SUPABASE_SERVICE_ROLE_KEY sozlanmagan. .env.local ga qo'shing (SETUP.md).";
    }
    return error.message;
  }
  return "Kutilmagan xatolik yuz berdi.";
}
