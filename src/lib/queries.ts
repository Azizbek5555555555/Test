import { createServerSupabase } from "./supabase/server";
import { isSupabaseConfigured } from "./supabase/env";
import type {
  Article,
  ArticleListItem,
  ArticleQuestionPublic,
  Attempt,
  AttemptReviewRow,
  PendingCheckRow,
  Course,
  LeaderboardRow,
  MyRankRow,
  Profile,
  PublicQuestion,
  SkillSection,
  TestCategory,
  TestPart,
  TestSet,
  UserStats,
  VocabPack,
} from "./types";

/**
 * MUHIM: `questions`, `article_questions` va `vocab_words` jadvallarida
 * to'g'ri javob ustunlari bloklangan (0002_policies.sql). Shuning uchun
 * bu jadvallardan `select('*')` QILMANG — ustunlarni aniq sanab o'ting.
 */
const QUESTION_COLUMNS =
  "id, part_id, kind, prompt, help_text, options, points, order_index";

const ARTICLE_QUESTION_COLUMNS = "id, article_id, kind, prompt, options, order_index";

async function db() {
  return createServerSupabase();
}

/* =========================================================================
   TESTLAR
   ========================================================================= */

export async function getTestSets(filter: {
  category: TestCategory;
  section?: SkillSection | null;
  year?: string | null;
  limit?: number;
}): Promise<TestSet[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    const supabase = await db();
    let query = supabase
      .from("test_sets")
      .select("*")
      .eq("category", filter.category)
      .eq("published", true)
      .order("order_index", { ascending: true })
      .order("created_at", { ascending: false });

    if (filter.section) query = query.eq("section", filter.section);
    if (filter.year) query = query.eq("year_label", filter.year);
    if (filter.limit) query = query.limit(filter.limit);

    const { data } = await query;
    return (data ?? []) as TestSet[];
  } catch {
    return [];
  }
}

export async function getTestSetBySlug(slug: string): Promise<TestSet | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const supabase = await db();
    const { data } = await supabase
      .from("test_sets")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();
    return (data as TestSet | null) ?? null;
  } catch {
    return null;
  }
}

export async function getTestSetById(id: string): Promise<TestSet | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const supabase = await db();
    const { data } = await supabase
      .from("test_sets")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    return (data as TestSet | null) ?? null;
  } catch {
    return null;
  }
}

export async function getTestParts(testSetId: string): Promise<TestPart[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    const supabase = await db();
    const { data } = await supabase
      .from("test_parts")
      .select("*")
      .eq("test_set_id", testSetId)
      .order("order_index", { ascending: true });
    return (data ?? []) as TestPart[];
  } catch {
    return [];
  }
}

export async function getQuestionsForParts(
  partIds: string[],
): Promise<PublicQuestion[]> {
  if (!isSupabaseConfigured() || partIds.length === 0) return [];
  try {
    const supabase = await db();
    const { data } = await supabase
      .from("questions")
      .select(QUESTION_COLUMNS)
      .in("part_id", partIds)
      .order("order_index", { ascending: true });
    return (data ?? []) as unknown as PublicQuestion[];
  } catch {
    return [];
  }
}

/** Test bo'yicha savollar sonini bo'limlar kesimida sanaydi */
export async function countQuestionsByTestSet(
  testSetIds: string[],
): Promise<Record<string, number>> {
  if (!isSupabaseConfigured() || testSetIds.length === 0) return {};
  try {
    const supabase = await db();
    const { data: parts } = await supabase
      .from("test_parts")
      .select("id, test_set_id")
      .in("test_set_id", testSetIds);

    const partRows = (parts ?? []) as { id: string; test_set_id: string }[];
    if (partRows.length === 0) return {};

    const { data: questions } = await supabase
      .from("questions")
      .select("id, part_id")
      .in(
        "part_id",
        partRows.map((p) => p.id),
      );

    const partToSet = new Map(partRows.map((p) => [p.id, p.test_set_id]));
    const counts: Record<string, number> = {};
    for (const q of (questions ?? []) as { part_id: string }[]) {
      const setId = partToSet.get(q.part_id);
      if (setId) counts[setId] = (counts[setId] ?? 0) + 1;
    }
    return counts;
  } catch {
    return {};
  }
}

/** Oxirgi tushgan savollar: yil + bo'lim bo'yicha testlar soni */
export async function getYearSectionCounts(): Promise<
  Record<string, Partial<Record<SkillSection, number>>>
> {
  if (!isSupabaseConfigured()) return {};
  try {
    const supabase = await db();
    const { data } = await supabase
      .from("test_sets")
      .select("year_label, section")
      .eq("category", "latest_questions")
      .eq("published", true);

    const result: Record<string, Partial<Record<SkillSection, number>>> = {};
    for (const row of (data ?? []) as {
      year_label: string | null;
      section: SkillSection | null;
    }[]) {
      if (!row.year_label || !row.section) continue;
      result[row.year_label] ??= {};
      result[row.year_label][row.section] =
        (result[row.year_label][row.section] ?? 0) + 1;
    }
    return result;
  } catch {
    return {};
  }
}

/* =========================================================================
   URINISHLAR (attempts)
   ========================================================================= */

export async function getAttempt(id: string): Promise<Attempt | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const supabase = await db();
    const { data } = await supabase
      .from("attempts")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    return (data as Attempt | null) ?? null;
  } catch {
    return null;
  }
}

export async function getMyAttempts(limit = 50): Promise<Attempt[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    const supabase = await db();
    const { data } = await supabase
      .from("attempts")
      .select("*")
      .order("started_at", { ascending: false })
      .limit(limit);
    return (data ?? []) as Attempt[];
  } catch {
    return [];
  }
}

export interface AttemptWithTest extends Attempt {
  test_sets: {
    title: string;
    slug: string;
    category: TestCategory;
    year_label: string | null;
  } | null;
}

/** Urinishlar + test nomlari (profil sahifasi uchun) */
export async function getMyAttemptsWithTests(
  limit = 60,
): Promise<AttemptWithTest[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    const supabase = await db();
    const { data } = await supabase
      .from("attempts")
      .select("*, test_sets(title, slug, category, year_label)")
      .order("started_at", { ascending: false })
      .limit(limit);
    return (data ?? []) as unknown as AttemptWithTest[];
  } catch {
    return [];
  }
}

/** Foydalanuvchining shu testdagi tugallanmagan urinishi bormi? */
export async function getOpenAttempt(
  testSetId: string,
  userId: string,
): Promise<Attempt | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const supabase = await db();
    const { data } = await supabase
      .from("attempts")
      .select("*")
      .eq("test_set_id", testSetId)
      .eq("user_id", userId)
      .eq("status", "in_progress")
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    return (data as Attempt | null) ?? null;
  } catch {
    return null;
  }
}

/** Test yakunlangach javoblarni to'g'ri javoblar bilan ko'rib chiqish */
export async function getAttemptReview(
  attemptId: string,
): Promise<AttemptReviewRow[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    const supabase = await db();
    const { data } = await supabase.rpc("get_attempt_review", {
      p_attempt_id: attemptId,
    });
    return (data ?? []) as AttemptReviewRow[];
  } catch {
    return [];
  }
}

/** O'qituvchi uchun: tekshirish kutayotgan ishlar */
export async function getPendingChecks(): Promise<PendingCheckRow[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    const supabase = await db();
    const { data } = await supabase.rpc("list_pending_checks", {
      p_limit: 100,
    });
    return (data ?? []) as PendingCheckRow[];
  } catch {
    return [];
  }
}

/* =========================================================================
   MAQOLALAR
   ========================================================================= */

export async function listArticles(
  topic?: string | null,
): Promise<ArticleListItem[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    const supabase = await db();
    const { data } = await supabase.rpc("list_articles", {
      p_topic: topic ?? null,
      p_limit: 60,
    });
    return (data ?? []) as ArticleListItem[];
  } catch {
    return [];
  }
}

export async function getArticleBySlug(slug: string): Promise<Article | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const supabase = await db();
    const { data } = await supabase
      .from("articles")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();
    return (data as Article | null) ?? null;
  } catch {
    return null;
  }
}

export async function getArticleQuestions(
  articleId: string,
): Promise<ArticleQuestionPublic[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    const supabase = await db();
    const { data } = await supabase
      .from("article_questions")
      .select(ARTICLE_QUESTION_COLUMNS)
      .eq("article_id", articleId)
      .order("order_index", { ascending: true });
    return (data ?? []) as unknown as ArticleQuestionPublic[];
  } catch {
    return [];
  }
}

/* =========================================================================
   VOCABULARY
   ========================================================================= */

export async function getVocabPacks(): Promise<VocabPack[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    const supabase = await db();
    const { data } = await supabase
      .from("vocab_packs")
      .select("*")
      .eq("published", true)
      .order("order_index", { ascending: true });
    return (data ?? []) as VocabPack[];
  } catch {
    return [];
  }
}

export async function getVocabPackBySlug(
  slug: string,
): Promise<VocabPack | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const supabase = await db();
    const { data } = await supabase
      .from("vocab_packs")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();
    return (data as VocabPack | null) ?? null;
  } catch {
    return null;
  }
}

export async function getWordCounts(
  packIds: string[],
): Promise<Record<string, number>> {
  if (!isSupabaseConfigured() || packIds.length === 0) return {};
  try {
    const supabase = await db();
    const { data } = await supabase
      .from("vocab_words")
      .select("id, pack_id")
      .in("pack_id", packIds);

    const counts: Record<string, number> = {};
    for (const row of (data ?? []) as { pack_id: string }[]) {
      counts[row.pack_id] = (counts[row.pack_id] ?? 0) + 1;
    }
    return counts;
  } catch {
    return {};
  }
}

export async function getLeaderboard(
  period: string,
  limit = 50,
): Promise<LeaderboardRow[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    const supabase = await db();
    const { data } = await supabase.rpc("get_leaderboard", {
      p_period: period,
      p_limit: limit,
    });
    return (data ?? []) as LeaderboardRow[];
  } catch {
    return [];
  }
}

export async function getMyRank(period: string): Promise<MyRankRow | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const supabase = await db();
    const { data } = await supabase.rpc("get_my_rank", { p_period: period });
    const rows = (data ?? []) as MyRankRow[];
    return rows[0] ?? null;
  } catch {
    return null;
  }
}

export async function getMyStats(): Promise<UserStats | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const supabase = await db();
    const { data } = await supabase.rpc("get_my_stats");
    return (data as UserStats | null) ?? null;
  } catch {
    return null;
  }
}

/* =========================================================================
   KURSLAR
   ========================================================================= */

export async function getCourses(): Promise<Course[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    const supabase = await db();
    const { data } = await supabase
      .from("courses")
      .select("*")
      .eq("published", true)
      .order("order_index", { ascending: true });
    return (data ?? []) as Course[];
  } catch {
    return [];
  }
}

export async function getCourseBySlug(slug: string): Promise<Course | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const supabase = await db();
    const { data } = await supabase
      .from("courses")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();
    return (data as Course | null) ?? null;
  } catch {
    return null;
  }
}

/* =========================================================================
   ADMIN
   ========================================================================= */

export async function getProfiles(search?: string): Promise<Profile[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    const supabase = await db();
    let query = supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);

    if (search) {
      query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    const { data } = await query;
    return (data ?? []) as Profile[];
  } catch {
    return [];
  }
}
