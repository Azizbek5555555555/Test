import "server-only";

import { createServerSupabase } from "./supabase/server";
import { isSupabaseConfigured } from "./supabase/env";
import { countQuestionsByTestSet, type AttemptWithTest } from "./queries";
import { getCefrBands } from "./settings";
import { SECTIONS } from "./constants";
import type { CefrBands, SkillSection } from "./types";

/**
 * Kirgan o'quvchining bosh sahifasi uchun barcha ma'lumotlar.
 * Hammasi faqat SHU foydalanuvchiga tegishli yozuvlar (user_id bilan aniq filtr —
 * o'qituvchi/admin RLS bo'yicha boshqalarnikini ham ko'radi, bu yerda kerak emas).
 */

const TZ = "Asia/Tashkent";
const dayKey = (d: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(d);

export interface CalendarDay {
  /** YYYY-MM-DD */
  key: string;
  day: number;
  /** Shu kuni bajarilgan mashqlar soni */
  count: number;
  today: boolean;
  future: boolean;
}

export interface LearnerCalendar {
  year: number;
  /** 1..12 */
  month: number;
  /** Oyning 1-kuni haftaning qaysi kuni (Dushanba = 0) */
  offset: number;
  days: CalendarDay[];
  activeThisMonth: number;
}

export interface TrendPoint {
  id: string;
  title: string;
  at: string;
  score: number;
}

export interface RecentItem {
  id: string;
  title: string;
  status: AttemptWithTest["status"];
  score: number | null;
  cefr: string | null;
  at: string;
  href: string;
}

export interface NextStep {
  kind: "continue" | "weak" | "start";
  title: string;
  href: string;
  percent: number | null;
  section: SkillSection | null;
}

export interface TodayPlan {
  vocab: boolean;
  reading: boolean;
  practice: boolean;
}

export interface LearnerHomeData {
  /** Joriy oy va undan oldingi 2 oy (yangisi birinchi) */
  calendars: LearnerCalendar[];
  streak: number;
  bestStreak: number;
  activeDays30: number;
  skills: Record<SkillSection, number | null>;
  overall: number | null;
  level: string | null;
  /** Keyingi daraja va unga yetish uchun qolgan ball */
  target: { level: string; need: number; from: number; to: number } | null;
  trend: TrendPoint[];
  recent: RecentItem[];
  next: NextStep;
  today: TodayPlan;
  totals: { tests: number; graded: number; pending: number; words: number; articles: number };
}

/* --------------------------------------------------------------------------- */

export function levelFor(score: number | null, bands: CefrBands): string | null {
  if (score == null) return null;
  if (score >= bands.C1) return "C1";
  if (score >= bands.B2) return "B2";
  if (score >= bands.B1) return "B1";
  return "A2";
}

function targetFor(score: number | null, bands: CefrBands): LearnerHomeData["target"] {
  if (score == null) return null;
  const steps = [
    { level: "B1", at: bands.B1 },
    { level: "B2", at: bands.B2 },
    { level: "C1", at: bands.C1 },
  ];
  const next = steps.find((s) => score < s.at);
  if (!next) return null;
  const prevAt = steps[steps.indexOf(next) - 1]?.at ?? 0;
  return { level: next.level, need: Math.ceil(next.at - score), from: prevAt, to: next.at };
}

function streaks(keys: Set<string>): { current: number; best: number } {
  if (keys.size === 0) return { current: 0, best: 0 };
  // Eng uzun seriya
  const sorted = [...keys].sort();
  let best = 1;
  let run = 1;
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1] + "T12:00:00Z");
    const cur = new Date(sorted[i] + "T12:00:00Z");
    run = Math.round((cur.getTime() - prev.getTime()) / 86_400_000) === 1 ? run + 1 : 1;
    best = Math.max(best, run);
  }
  // Joriy seriya — bugun yoki kechadan boshlab
  const cursor = new Date();
  if (!keys.has(dayKey(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
    if (!keys.has(dayKey(cursor))) return { current: 0, best };
  }
  let current = 0;
  while (keys.has(dayKey(cursor))) {
    current += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return { current, best };
}

/** Oy kalendari; `back` — joriy oydan necha oy oldin (0 — joriy oy) */
function buildCalendar(counts: Map<string, number>, back: number): LearnerCalendar {
  const todayKey = dayKey(new Date());
  const [ty, tm] = todayKey.split("-").map(Number);
  const first = new Date(Date.UTC(ty, tm - 1 - back, 1));
  const year = first.getUTCFullYear();
  const month = first.getUTCMonth() + 1;
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  // getUTCDay: Yakshanba = 0 → Dushanba = 0 ga o'tkazamiz
  const offset = (first.getUTCDay() + 6) % 7;
  const days: CalendarDay[] = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const key = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    days.push({ key, day: d, count: counts.get(key) ?? 0, today: key === todayKey, future: key > todayKey });
  }
  return { year, month, offset, days, activeThisMonth: days.filter((d) => d.count > 0).length };
}

function attemptHref(a: AttemptWithTest): string {
  if (a.status === "in_progress") return a.mode === "exam_checking" ? `/exam/${a.id}` : `/test/${a.id}`;
  return `/results/${a.id}`;
}

const SKILL_PRACTICE: Record<SkillSection, string> = {
  reading: "/boost/articles",
  listening: "/boost/listening",
  writing: "/latest-questions?section=writing",
  speaking: "/exam-checking",
};

export function practiceHref(section: SkillSection): string {
  return SKILL_PRACTICE[section];
}

/* --------------------------------------------------------------------------- */

export async function getLearnerHome(userId: string): Promise<LearnerHomeData> {
  const since = new Date(Date.now() - 120 * 86_400_000).toISOString();

  let attempts: AttemptWithTest[] = [];
  let vocab: { created_at: string; correct_count: number }[] = [];
  let articles: { completed_at: string }[] = [];

  if (isSupabaseConfigured()) {
    try {
      const supabase = await createServerSupabase();
      const [a, v, ar] = await Promise.all([
        supabase
          .from("attempts")
          .select("*, test_sets(title, slug, category, year_label)")
          .eq("user_id", userId)
          .order("started_at", { ascending: false })
          .limit(120),
        supabase
          .from("vocab_sessions")
          .select("created_at, correct_count")
          .eq("user_id", userId)
          .gte("created_at", since)
          .order("created_at", { ascending: false })
          .limit(500),
        supabase
          .from("article_progress")
          .select("completed_at")
          .eq("user_id", userId)
          .gte("completed_at", since)
          .limit(500),
      ]);
      attempts = (a.data ?? []) as unknown as AttemptWithTest[];
      vocab = (v.data ?? []) as typeof vocab;
      articles = (ar.data ?? []) as typeof articles;
    } catch {
      /* bo'sh holat ko'rsatiladi */
    }
  }

  const bands = await getCefrBands();
  const live = attempts.filter((a) => a.status !== "abandoned");

  /* ---- Faollik: test boshlangan/topshirilgan kunlar, so'z o'yini, maqolalar ---- */
  const counts = new Map<string, number>();
  const bump = (iso: string | null | undefined) => {
    if (!iso) return;
    const k = dayKey(new Date(iso));
    counts.set(k, (counts.get(k) ?? 0) + 1);
  };
  for (const a of live) bump(a.submitted_at ?? a.started_at);
  for (const v of vocab) bump(v.created_at);
  for (const ar of articles) bump(ar.completed_at);

  const keys = new Set(counts.keys());
  const { current, best } = streaks(keys);
  const today = dayKey(new Date());
  const monthAgo = dayKey(new Date(Date.now() - 29 * 86_400_000));
  const activeDays30 = [...keys].filter((k) => k >= monthAgo && k <= today).length;

  /* ---- Natijalar ---- */
  const done = live.filter((a) => a.status === "graded" || a.status === "submitted");
  const skills = {} as Record<SkillSection, number | null>;
  for (const s of SECTIONS) {
    const values = done
      .map((a) => a.section_scores?.[s])
      .filter((v): v is number => typeof v === "number")
      .slice(0, 5);
    skills[s] = values.length ? Math.round(values.reduce((x, y) => x + y, 0) / values.length) : null;
  }
  const present = SECTIONS.map((s) => skills[s]).filter((v): v is number => v != null);
  const overall = present.length ? Math.round(present.reduce((x, y) => x + y, 0) / present.length) : null;

  const trend: TrendPoint[] = done
    .filter((a) => a.overall_score != null)
    .slice(0, 12)
    .reverse()
    .map((a) => ({
      id: a.id,
      title: a.test_sets?.title ?? "Test",
      at: a.submitted_at ?? a.started_at,
      score: Math.round(Number(a.overall_score) * 10) / 10,
    }));

  const recent: RecentItem[] = live.slice(0, 5).map((a) => ({
    id: a.id,
    title: a.test_sets?.title ?? "Test",
    status: a.status,
    score: a.status === "graded" && a.overall_score != null ? Math.round(Number(a.overall_score)) : null,
    cefr: a.status === "graded" ? a.cefr_level : null,
    at: a.submitted_at ?? a.started_at,
    href: attemptHref(a),
  }));

  /* ---- Keyingi qadam ---- */
  const open = live.find(
    (a) => a.status === "in_progress" && (!a.expires_at || new Date(a.expires_at).getTime() > Date.now()),
  );
  let next: NextStep;
  if (open) {
    const totals = await countQuestionsByTestSet([open.test_set_id]);
    const total = totals[open.test_set_id] ?? 0;
    const answered = Object.values(open.answers ?? {}).filter(
      (v) => v !== null && v !== "" && !(Array.isArray(v) && v.length === 0),
    ).length;
    next = {
      kind: "continue",
      title: open.test_sets?.title ?? "Test",
      href: attemptHref(open),
      percent: total > 0 ? Math.min(100, Math.round((answered / total) * 100)) : 0,
      section: null,
    };
  } else if (present.length) {
    // Hali ishlanmagan bo'lim birinchi, keyin eng past ball
    const weakest = [...SECTIONS].sort((x, y) => (skills[x] ?? -1) - (skills[y] ?? -1))[0];
    next = { kind: "weak", title: weakest, href: practiceHref(weakest), percent: null, section: weakest };
  } else {
    next = { kind: "start", title: "Full Mock", href: "/full-mock", percent: null, section: null };
  }

  const isToday = (iso: string | null | undefined) => !!iso && dayKey(new Date(iso)) === today;

  return {
    calendars: [0, 1, 2].map((back) => buildCalendar(counts, back)),
    streak: current,
    bestStreak: best,
    activeDays30,
    skills,
    overall,
    level: levelFor(overall, bands),
    target: targetFor(overall, bands),
    trend,
    recent,
    next,
    today: {
      vocab: vocab.some((v) => isToday(v.created_at)),
      reading: articles.some((a) => isToday(a.completed_at)),
      practice: live.some((a) => isToday(a.submitted_at ?? a.started_at)),
    },
    totals: {
      tests: done.length,
      graded: done.filter((a) => a.status === "graded").length,
      pending: done.filter((a) => a.status === "submitted").length,
      words: vocab.reduce((n, v) => n + (v.correct_count ?? 0), 0),
      articles: articles.length,
    },
  };
}
