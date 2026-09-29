import "server-only";

import { createServerSupabase } from "./supabase/server";
import { isSupabaseConfigured } from "./supabase/env";
import { countQuestionsByTestSet, getMyAttemptsWithTests } from "./queries";

/** Bosh sahifadagi statistika lentasi — haqiqiy kontent soni (bazadan) */
export interface SiteStats {
  fullMocks: number;
  listeningSets: number;
  articles: number;
}

export async function getSiteStats(): Promise<SiteStats> {
  const empty = { fullMocks: 0, listeningSets: 0, articles: 0 };
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
    return { fullMocks, listeningSets, articles };
  } catch {
    return empty;
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
function studyStreak(dates: string[]): number {
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
export function greeting(): string {
  const hour = Number(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Tashkent",
      hour: "numeric",
      hour12: false,
    }).format(new Date()),
  );
  if (hour < 5) return "Xayrli tun";
  if (hour < 12) return "Xayrli tong";
  if (hour < 18) return "Xayrli kun";
  return "Xayrli kech";
}
