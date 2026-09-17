import "server-only";

import { createServerSupabase } from "./supabase/server";
import { createAdminSupabase } from "./supabase/admin";
import { isSupabaseConfigured } from "./supabase/env";
import type {
  Article,
  Attempt,
  ContactMessage,
  Course,
  CourseApplication,
  FullQuestion,
  PremiumRequest,
  Profile,
  TestPart,
  TestSet,
  VocabPack,
} from "./types";

/**
 * Admin panel uchun so'rovlar.
 *
 * To'g'ri javoblarni o'qish kerak bo'lgan joylarda service_role klienti
 * ishlatiladi, chunki `questions.correct_answer` ustuni oddiy
 * foydalanuvchilar uchun bloklangan (0002_policies.sql).
 * Har bir chaqiruvdan oldin sahifa darajasida admin/teacher tekshiruvi bo'ladi
 * (app/(site)/admin/layout.tsx).
 */

function adminOrNull() {
  try {
    return createAdminSupabase();
  } catch {
    return null;
  }
}

export interface AdminCounts {
  users: number;
  premiumUsers: number;
  pendingChecks: number;
  pendingPremium: number;
  newApplications: number;
  unreadMessages: number;
  testSets: number;
  articles: number;
}

export async function getAdminCounts(): Promise<AdminCounts> {
  const empty: AdminCounts = {
    users: 0,
    premiumUsers: 0,
    pendingChecks: 0,
    pendingPremium: 0,
    newApplications: 0,
    unreadMessages: 0,
    testSets: 0,
    articles: 0,
  };

  if (!isSupabaseConfigured()) return empty;

  try {
    const supabase = await createServerSupabase();
    const head = { count: "exact" as const, head: true };

    const [
      users,
      premiumUsers,
      pendingChecks,
      pendingPremium,
      newApplications,
      unreadMessages,
      testSets,
      articles,
    ] = await Promise.all([
      supabase.from("profiles").select("id", head),
      supabase.from("profiles").select("id", head).eq("is_premium", true),
      supabase
        .from("attempts")
        .select("id", head)
        .eq("needs_manual_check", true)
        .eq("status", "submitted"),
      supabase
        .from("premium_requests")
        .select("id", head)
        .eq("status", "pending"),
      supabase
        .from("course_applications")
        .select("id", head)
        .eq("status", "new"),
      supabase.from("contact_messages").select("id", head).eq("handled", false),
      supabase.from("test_sets").select("id", head),
      supabase.from("articles").select("id", head),
    ]);

    return {
      users: users.count ?? 0,
      premiumUsers: premiumUsers.count ?? 0,
      pendingChecks: pendingChecks.count ?? 0,
      pendingPremium: pendingPremium.count ?? 0,
      newApplications: newApplications.count ?? 0,
      unreadMessages: unreadMessages.count ?? 0,
      testSets: testSets.count ?? 0,
      articles: articles.count ?? 0,
    };
  } catch {
    return empty;
  }
}

/* ------------------------------------------------------------------ USERS */

export async function listProfiles(search?: string): Promise<Profile[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    const supabase = await createServerSupabase();
    let query = supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);

    if (search && search.trim()) {
      const term = search.trim().replace(/[%,]/g, "");
      query = query.or(`full_name.ilike.%${term}%,email.ilike.%${term}%`);
    }

    const { data } = await query;
    return (data ?? []) as Profile[];
  } catch {
    return [];
  }
}

/* --------------------------------------------------------------- PREMIUM */

export interface PremiumRequestWithUser extends PremiumRequest {
  profiles: { full_name: string | null; email: string | null } | null;
}

export async function listPremiumRequests(): Promise<PremiumRequestWithUser[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    const supabase = await createServerSupabase();
    const { data } = await supabase
      .from("premium_requests")
      .select("*, profiles(full_name, email)")
      .order("created_at", { ascending: false })
      .limit(100);
    return (data ?? []) as unknown as PremiumRequestWithUser[];
  } catch {
    return [];
  }
}

/* ----------------------------------------------------------- APPLICATIONS */

export interface ApplicationWithCourse extends CourseApplication {
  courses: { title: string; slug: string } | null;
}

export async function listApplications(): Promise<ApplicationWithCourse[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    const supabase = await createServerSupabase();
    const { data } = await supabase
      .from("course_applications")
      .select("*, courses(title, slug)")
      .order("created_at", { ascending: false })
      .limit(200);
    return (data ?? []) as unknown as ApplicationWithCourse[];
  } catch {
    return [];
  }
}

export async function listMessages(): Promise<ContactMessage[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    const supabase = await createServerSupabase();
    const { data } = await supabase
      .from("contact_messages")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    return (data ?? []) as ContactMessage[];
  } catch {
    return [];
  }
}

/* ---------------------------------------------------------------- TESTLAR */

export async function listAllTestSets(): Promise<TestSet[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    const supabase = await createServerSupabase();
    const { data } = await supabase
      .from("test_sets")
      .select("*")
      .order("category", { ascending: true })
      .order("order_index", { ascending: true });
    return (data ?? []) as TestSet[];
  } catch {
    return [];
  }
}

export async function getTestSetForAdmin(id: string): Promise<{
  testSet: TestSet | null;
  parts: TestPart[];
  questions: FullQuestion[];
}> {
  const empty = { testSet: null, parts: [], questions: [] };
  if (!isSupabaseConfigured()) return empty;

  try {
    const supabase = await createServerSupabase();

    const { data: testSet } = await supabase
      .from("test_sets")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (!testSet) return empty;

    const { data: parts } = await supabase
      .from("test_parts")
      .select("*")
      .eq("test_set_id", id)
      .order("order_index", { ascending: true });

    const partRows = (parts ?? []) as TestPart[];

    // To'g'ri javoblarni ko'rish uchun service_role kerak
    const admin = adminOrNull();
    let questions: FullQuestion[] = [];

    if (admin && partRows.length > 0) {
      const { data } = await admin
        .from("questions")
        .select("*")
        .in(
          "part_id",
          partRows.map((p) => p.id),
        )
        .order("order_index", { ascending: true });
      questions = (data ?? []) as unknown as FullQuestion[];
    }

    return { testSet: testSet as TestSet, parts: partRows, questions };
  } catch {
    return empty;
  }
}

/* --------------------------------------------------------------- BAHOLASH */

export interface GradingDetail {
  attempt: Attempt | null;
  student: { full_name: string | null; email: string | null } | null;
  testTitle: string;
  manualQuestions: {
    id: string;
    section: string;
    partTitle: string;
    kind: string;
    prompt: string;
    answerText: string;
    audioPath: string | null;
  }[];
  autoScores: Record<string, number>;
}

export async function getGradingDetail(
  attemptId: string,
): Promise<GradingDetail> {
  const empty: GradingDetail = {
    attempt: null,
    student: null,
    testTitle: "",
    manualQuestions: [],
    autoScores: {},
  };

  if (!isSupabaseConfigured()) return empty;

  try {
    const supabase = await createServerSupabase();

    const { data: attemptRow } = await supabase
      .from("attempts")
      .select("*, profiles(full_name, email), test_sets(title)")
      .eq("id", attemptId)
      .maybeSingle();

    if (!attemptRow) return empty;

    const row = attemptRow as unknown as Attempt & {
      profiles: { full_name: string | null; email: string | null } | null;
      test_sets: { title: string } | null;
    };

    const { data: parts } = await supabase
      .from("test_parts")
      .select("id, title, section")
      .eq("test_set_id", row.test_set_id)
      .order("order_index", { ascending: true });

    const partRows = (parts ?? []) as {
      id: string;
      title: string;
      section: string;
    }[];

    const { data: questions } = await supabase
      .from("questions")
      .select("id, part_id, kind, prompt, order_index")
      .in(
        "part_id",
        partRows.map((p) => p.id),
      )
      .in("kind", ["essay", "speaking_prompt"])
      .order("order_index", { ascending: true });

    const partMap = new Map(partRows.map((p) => [p.id, p]));
    const answers = row.answers ?? {};

    const manualQuestions = (
      (questions ?? []) as {
        id: string;
        part_id: string;
        kind: string;
        prompt: string;
      }[]
    ).map((question) => {
      const part = partMap.get(question.part_id);
      const value = answers[question.id];

      let answerText = "";
      let audioPath: string | null = null;

      if (typeof value === "string") {
        answerText = value;
      } else if (value && typeof value === "object" && !Array.isArray(value)) {
        const record = value as Record<string, string>;
        answerText = record.text ?? "";
        audioPath = record.audio || null;
      }

      return {
        id: question.id,
        section: part?.section ?? "writing",
        partTitle: part?.title ?? "",
        kind: question.kind,
        prompt: question.prompt,
        answerText,
        audioPath,
      };
    });

    return {
      attempt: row,
      student: row.profiles,
      testTitle: row.test_sets?.title ?? "Test",
      manualQuestions,
      autoScores: (row.section_scores ?? {}) as Record<string, number>,
    };
  } catch {
    return empty;
  }
}

/* -------------------------------------------------------------- MAQOLALAR */

export async function listAllArticles(): Promise<Article[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    const supabase = await createServerSupabase();
    const { data } = await supabase
      .from("articles")
      .select("*")
      .order("order_index", { ascending: true })
      .order("created_at", { ascending: false });
    return (data ?? []) as Article[];
  } catch {
    return [];
  }
}

export async function getArticleForAdmin(id: string): Promise<{
  article: Article | null;
  questions: FullQuestion[];
}> {
  if (!isSupabaseConfigured()) return { article: null, questions: [] };
  try {
    const supabase = await createServerSupabase();
    const { data: article } = await supabase
      .from("articles")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (!article) return { article: null, questions: [] };

    const admin = adminOrNull();
    let questions: FullQuestion[] = [];

    if (admin) {
      const { data } = await admin
        .from("article_questions")
        .select("*")
        .eq("article_id", id)
        .order("order_index", { ascending: true });
      questions = (data ?? []) as unknown as FullQuestion[];
    }

    return { article: article as Article, questions };
  } catch {
    return { article: null, questions: [] };
  }
}

/* ------------------------------------------------------------ VOCABULARY */

export async function listAllVocabPacks(): Promise<VocabPack[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    const supabase = await createServerSupabase();
    const { data } = await supabase
      .from("vocab_packs")
      .select("*")
      .order("order_index", { ascending: true });
    return (data ?? []) as VocabPack[];
  } catch {
    return [];
  }
}

export interface AdminVocabWord {
  id: string;
  pack_id: string;
  word: string;
  meaning_uz: string;
  meaning_en: string | null;
  example: string | null;
  options: string[];
  correct_index: number;
  order_index: number;
}

export async function getVocabPackForAdmin(id: string): Promise<{
  pack: VocabPack | null;
  words: AdminVocabWord[];
}> {
  if (!isSupabaseConfigured()) return { pack: null, words: [] };
  try {
    const supabase = await createServerSupabase();
    const { data: pack } = await supabase
      .from("vocab_packs")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (!pack) return { pack: null, words: [] };

    const admin = adminOrNull();
    let words: AdminVocabWord[] = [];

    if (admin) {
      const { data } = await admin
        .from("vocab_words")
        .select("*")
        .eq("pack_id", id)
        .order("order_index", { ascending: true });
      words = (data ?? []) as unknown as AdminVocabWord[];
    }

    return { pack: pack as VocabPack, words };
  } catch {
    return { pack: null, words: [] };
  }
}

/* ---------------------------------------------------------------- KURSLAR */

export async function listAllCourses(): Promise<Course[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    const supabase = await createServerSupabase();
    const { data } = await supabase
      .from("courses")
      .select("*")
      .order("order_index", { ascending: true });
    return (data ?? []) as Course[];
  } catch {
    return [];
  }
}

/* -------------------------------------------------------------- SOZLAMALAR */

export async function listSettings(): Promise<
  { key: string; value: unknown }[]
> {
  if (!isSupabaseConfigured()) return [];
  try {
    const supabase = await createServerSupabase();
    const { data } = await supabase
      .from("site_settings")
      .select("key, value")
      .order("key", { ascending: true });
    return (data ?? []) as { key: string; value: unknown }[];
  } catch {
    return [];
  }
}

/** Speaking audio uchun vaqtinchalik (imzolangan) havola */
export async function getSpeakingAudioUrl(
  path: string,
): Promise<string | null> {
  const admin = adminOrNull();
  if (!admin || !path) return null;
  try {
    const { data } = await admin.storage
      .from("speaking")
      .createSignedUrl(path, 60 * 60);
    return data?.signedUrl ?? null;
  } catch {
    return null;
  }
}
