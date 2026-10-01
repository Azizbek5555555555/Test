import "server-only";

import type { T } from "@/i18n";
import { createServerSupabase } from "./supabase/server";
import { createAdminSupabase } from "./supabase/admin";
import { isSupabaseConfigured } from "./supabase/env";
import { countQuestionsByTestSet, getMyAttemptsWithTests, type AttemptWithTest } from "./queries";
import { SECTIONS } from "./constants";
import type { SkillSection } from "./types";

/** Bosh sahifadagi statistika lentasi — haqiqiy kontent soni (bazadan) */
export interface SiteStats {
  fullMocks: number;
  listeningSets: number;
  articles: number;
  /** Bazadagi jami savollar (Premium testlar ham) */
  questions: number;
}

export async function getSiteStats(): Promise<SiteStats> {
  const empty = { fullMocks: 0, listeningSets: 0, articles: 0, questions: 0 };
  if (!isSupabaseConfigured()) return empty;
  try {
    const supabase = await createServerSupabase();
    const count = async (query: PromiseLike<{ count: number | null }>) => (await query).count ?? 0;
    const [fullMocks, listeningSets, articles] = await Promise.all([
      count(
        supabase
          .from("test_sets")
          .select("id", { count: "exact", head: true })
          .eq("category", "full_mock")
          .eq("published", true),
      ),
      count(
        supabase
          .from("test_sets")
          .select("id", { count: "exact", head: true })
          .eq("category", "general_english")
          .eq("section", "listening")
          .eq("published", true),
      ),
      count(
        supabase
          .from("articles")
          .select("id", { count: "exact", head: true })
          .eq("published", true),
      ),
    ]);
    return { fullMocks, listeningSets, articles, questions: await countAllQuestions() };
  } catch {
    return empty;
  }
}

/**
 * Jami savollar soni. Premium savollar mehmonga RLS tufayli ko'rinmaydi,
 * shuning uchun faqat SONI serverda service_role orqali olinadi (matn qaytmaydi).
 */
async function countAllQuestions(): Promise<number> {
  try {
    let supabase;
    try {
      supabase = createAdminSupabase();
    } catch {
      supabase = await createServerSupabase();
    }
    const { count } = await supabase.from("questions").select("id", { count: "exact", head: true });
    return count ?? 0;
  } catch {
    return 0;
  }
}

/** "Davom ettirish" kartasi — oxirgi tugallanmagan test */
export interface ContinueCard {
  attemptId: string;
  title: string;
  percent: number;
  href: string;
}

/** Kirgan foydalanuvchining bosh sahifasi uchun ma'lumotlar */
export async function getLearnerSnapshot(): Promise<{
  continueCard: ContinueCard | null;
  streakDays: number;
}> {
  const attempts = await getMyAttemptsWithTests(60);

  const open = attempts.find(
    (a) =>
      a.status === "in_progress" &&
      (!a.expires_at || new Date(a.expires_at).getTime() > Date.now()),
  );

  let continueCard: ContinueCard | null = null;
  if (open) {
    const totals = await countQuestionsByTestSet([open.test_set_id]);
    const total = totals[open.test_set_id] ?? 0;
    const answered = Object.values(open.answers ?? {}).filter(
      (v) => v !== null && v !== "" && !(Array.isArray(v) && v.length === 0),
    ).length;
    continueCard = {
      attemptId: open.id,
      title: open.test_sets?.title ?? "Test",
      percent: total > 0 ? Math.min(100, Math.round((answered / total) * 100)) : 0,
      href:
        open.test_sets?.category === "exam_checking"
          ? `/exam/${open.id}`
          : `/test/${open.id}`,
    };
  }

  return { continueCard, streakDays: studyStreak(attempts.map((a) => a.started_at)) };
}

/** Ketma-ket faol kunlar soni (Toshkent vaqti bo'yicha, bugun yoki kechadan boshlab) */
export function studyStreak(dates: string[]): number {
  const dayKey = (d: Date) =>
    new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tashkent" }).format(d);
  const days = new Set(dates.map((iso) => dayKey(new Date(iso))));
  if (days.size === 0) return 0;

  const cursor = new Date();
  if (!days.has(dayKey(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
    if (!days.has(dayKey(cursor))) return 0;
  }
  let streak = 0;
  while (days.has(dayKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

/** Toshkent vaqti bo'yicha salomlashish */
export function greeting(t: T): string {
  const hour = Number(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Tashkent",
      hour: "numeric",
      hour12: false,
    }).format(new Date()),
  );
  if (hour < 5) return t("Xayrli tun", "Good night");
  if (hour < 12) return t("Xayrli tong", "Good morning");
  if (hour < 18) return t("Xayrli kun", "Good afternoon");
  return t("Xayrli kech", "Good evening");
}

/* -------------------------------------------------------------------------
   Shaxsiy kabinet (Figma 04 — Dashboard)
   ------------------------------------------------------------------------- */
export interface ActivityItem {
  id: string;
  title: string;
  status: AttemptWithTest["status"];
  at: string;
  href: string;
}

export interface DashboardData {
  /** Har bo'lim bo'yicha oxirgi 5 ta natijaning o'rtachasi (rasmiy 0–75 shkala), natija bo'lmasa null */
  skills: Record<SkillSection, number | null>;
  /** Bo'limlar o'rtachasi (0–75) */
  overall: number | null;
  taken: number;
  graded: number;
  inProgress: number;
  streakDays: number;
  recent: ActivityItem[];
}

function attemptHref(a: AttemptWithTest): string {
  if (a.status === "in_progress") {
    return a.mode === "exam_checking" ? `/exam/${a.id}` : `/test/${a.id}`;
  }
  return `/results/${a.id}`;
}

export async function getDashboardData(): Promise<DashboardData> {
  const attempts = await getMyAttemptsWithTests(100);
  const done = attempts.filter((a) => a.status === "graded" || a.status === "submitted");

  const skills = {} as Record<SkillSection, number | null>;
  for (const section of SECTIONS) {
    const values = done
      .map((a) => a.section_scores?.[section])
      .filter((v): v is number => typeof v === "number")
      .slice(0, 5);
    skills[section] = values.length
      ? Math.round(values.reduce((sum, v) => sum + v, 0) / values.length)
      : null;
  }
  const present = SECTIONS.map((s) => skills[s]).filter((v): v is number => v != null);
  const overall = present.length
    ? Math.round(present.reduce((sum, v) => sum + v, 0) / present.length)
    : null;

  const now = Date.now();
  const inProgress = attempts.filter(
    (a) =>
      a.status === "in_progress" &&
      (!a.expires_at || new Date(a.expires_at).getTime() > now),
  ).length;

  const recent = attempts
    .filter((a) => a.status !== "abandoned")
    .slice(0, 5)
    .map((a) => ({
      id: a.id,
      title: a.test_sets?.title ?? "Test",
      status: a.status,
      at: a.submitted_at ?? a.started_at,
      href: attemptHref(a),
    }));

  return {
    skills,
    overall,
    taken: done.length,
    graded: done.filter((a) => a.status === "graded").length,
    inProgress,
    streakDays: studyStreak(attempts.map((a) => a.started_at)),
    recent,
  };
}
