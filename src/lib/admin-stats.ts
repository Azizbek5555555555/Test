import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminSupabase } from "./supabase/admin";
import { createServerSupabase } from "./supabase/server";
import { isSupabaseConfigured } from "./supabase/env";
import { getPaymentSettings } from "./settings";

/**
 * Admin boshqaruv paneli statistikasi.
 * Barcha kunlar Toshkent vaqti bo'yicha (UTC+5) hisoblanadi.
 * Ma'lumotlar service_role orqali o'qiladi (sahifa darajasida admin/o'qituvchi tekshiriladi).
 */

export type RangeKey = "week" | "7" | "30" | "90" | "365";

export const RANGES: { key: RangeKey; label: string }[] = [
  { key: "week", label: "Bu hafta" },
  { key: "7", label: "7 kun" },
  { key: "30", label: "30 kun" },
  { key: "90", label: "90 kun" },
  { key: "365", label: "1 yil" },
];

export function parseRange(value: string | undefined): RangeKey {
  return RANGES.some((r) => r.key === value) ? (value as RangeKey) : "30";
}

const TZ_MS = 5 * 3600 * 1000; // Asia/Tashkent
const DAY = 86400 * 1000;
const MONTHS = ["Yan", "Fev", "Mar", "Apr", "May", "Iyn", "Iyl", "Avg", "Sen", "Okt", "Noy", "Dek"];
const WEEKDAYS = ["Du", "Se", "Ch", "Pa", "Ju", "Sh", "Ya"];

/** Toshkent bo'yicha kun boshi (UTC ms) */
function dayStart(ms: number) {
  return Math.floor((ms + TZ_MS) / DAY) * DAY - TZ_MS;
}
/** 0 = dushanba ... 6 = yakshanba (Toshkent bo'yicha) */
function weekdayOf(ms: number) {
  return (new Date(ms + TZ_MS).getUTCDay() + 6) % 7;
}
function dayLabel(ms: number) {
  const d = new Date(ms + TZ_MS);
  return `${String(d.getUTCDate()).padStart(2, "0")}.${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

interface Bucket {
  start: number;
  end: number;
  label: string;
}

export interface RangeInfo {
  key: RangeKey;
  label: string;
  since: number;
  prevSince: number;
  buckets: Bucket[];
}

export function rangeInfo(key: RangeKey, now = Date.now()): RangeInfo {
  const today = dayStart(now);
  const label = RANGES.find((r) => r.key === key)!.label;
  if (key === "365") {
    // 12 oy: joriy oy va undan oldingi 11 oy
    const d = new Date(now + TZ_MS);
    const buckets: Bucket[] = [];
    for (let i = 11; i >= 0; i--) {
      const y = d.getUTCFullYear();
      const m = d.getUTCMonth() - i;
      const start = Date.UTC(y, m, 1) - TZ_MS;
      const end = Date.UTC(y, m + 1, 1) - TZ_MS;
      buckets.push({ start, end, label: MONTHS[((m % 12) + 12) % 12] });
    }
    const since = buckets[0].start;
    return { key, label, since, prevSince: since - (now - since), buckets };
  }
  const days = key === "week" ? weekdayOf(now) + 1 : Number(key);
  const since = today - (days - 1) * DAY;
  const buckets: Bucket[] = [];
  for (let i = 0; i < days; i++) {
    const start = since + i * DAY;
    buckets.push({ start, end: start + DAY, label: key === "week" ? WEEKDAYS[i] : dayLabel(start) });
  }
  return { key, label, since, prevSince: since - days * DAY, buckets };
}

export interface Kpi {
  value: number;
  prev: number;
}

export type PayMethod = "payme" | "click" | "card";

export interface PaymentStats {
  methods: { key: PayMethod; label: string; count: number; amount: number }[];
  count: number;
  amount: number;
  prevAmount: number;
  cardLabel: string;
  recent: { id: string; name: string; email: string | null; method: PayMethod; amount: number; at: string; plan: string | null }[];
}

export interface DashboardStats {
  range: RangeInfo;
  totals: { users: number; premium: number; teachers: number; tests: number; articles: number; vocabPacks: number };
  kpi: { newUsers: Kpi; activeUsers: Kpi; completed: Kpi; vocabGames: Kpi };
  series: { labels: string[]; newUsers: number[]; completed: number[]; active: number[] };
  weekday: number[];
  cefr: { level: string; count: number }[];
  skills: { key: string; label: string; avg: number | null; count: number }[];
  topTests: { id: string; title: string; count: number }[];
  modes: { key: string; label: string; count: number }[];
  payments: PaymentStats | null;
}

/** PostgREST bir so'rovda ko'pi bilan 1000 qator qaytaradi — sahifalab o'qiymiz */
async function fetchAll<T>(build: (from: number, to: number) => PromiseLike<{ data: T[] | null }>, cap = 20000): Promise<T[]> {
  const out: T[] = [];
  for (let from = 0; from < cap; from += 1000) {
    const { data } = await build(from, from + 999);
    if (!data || data.length === 0) break;
    out.push(...data);
    if (data.length < 1000) break;
  }
  return out;
}

async function client(): Promise<SupabaseClient> {
  try {
    return createAdminSupabase();
  } catch {
    return (await createServerSupabase()) as unknown as SupabaseClient;
  }
}

function inRange(iso: string | null, a: number, b: number) {
  if (!iso) return false;
  const t = Date.parse(iso);
  return t >= a && t < b;
}

function bucketCounts(times: number[], buckets: Bucket[]) {
  const out = new Array(buckets.length).fill(0);
  for (const t of times) {
    // bakketlar tartiblangan — ikkilik qidiruv shart emas, ular ko'pi bilan 90 ta
    for (let i = 0; i < buckets.length; i++) {
      if (t >= buckets[i].start && t < buckets[i].end) {
        out[i]++;
        break;
      }
    }
  }
  return out;
}

/** Karta raqamidan tizim nomi: 8600 — Uzcard, 9860 — Humo */
export function cardSystem(cardNumber: string | null | undefined) {
  const digits = (cardNumber ?? "").replace(/\D/g, "");
  if (digits.startsWith("8600")) return "Uzcard";
  if (digits.startsWith("9860")) return "Humo";
  return "Karta";
}

const SKILLS = [
  { key: "listening", label: "Listening" },
  { key: "reading", label: "Reading" },
  { key: "writing", label: "Writing" },
  { key: "speaking", label: "Speaking" },
];
const MODE_LABEL: Record<string, string> = {
  full_mock: "Full Mock",
  practice: "Mashq",
  exam_checking: "Exam Checking",
};
const CEFR_ORDER = ["A1", "A2", "B1", "B2", "C1", "C2"];
const cefrRank = (level: string) => (CEFR_ORDER.includes(level) ? CEFR_ORDER.indexOf(level) : 99);

type AttemptRow = {
  user_id: string;
  test_set_id: string;
  mode: string;
  status: string;
  submitted_at: string | null;
  cefr_level: string | null;
  section_scores: Record<string, number | null> | null;
};

export async function getDashboardStats(key: RangeKey, withPayments: boolean): Promise<DashboardStats | null> {
  if (!isSupabaseConfigured()) return null;
  const range = rangeInfo(key);
  const now = Date.now();
  const sinceIso = new Date(range.prevSince).toISOString();
  const db = await client();
  const head = { count: "exact" as const, head: true };

  try {
    const [users, premium, teachers, tests, articles, packs, newProfiles, attempts, vocab, reads] = await Promise.all([
      db.from("profiles").select("id", head),
      db.from("profiles").select("id", head).eq("is_premium", true),
      db.from("profiles").select("id", head).in("role", ["teacher", "admin"]),
      db.from("test_sets").select("id", head),
      db.from("articles").select("id", head),
      db.from("vocab_packs").select("id", head),
      fetchAll<{ created_at: string }>((a, b) =>
        db.from("profiles").select("created_at").gte("created_at", sinceIso).order("created_at").range(a, b),
      ),
      fetchAll<AttemptRow>((a, b) =>
        db
          .from("attempts")
          .select("user_id,test_set_id,mode,status,submitted_at,cefr_level,section_scores")
          .in("status", ["submitted", "graded"])
          .gte("submitted_at", sinceIso)
          .order("submitted_at")
          .range(a, b),
      ),
      fetchAll<{ user_id: string; created_at: string }>((a, b) =>
        db.from("vocab_sessions").select("user_id,created_at").gte("created_at", sinceIso).order("created_at").range(a, b),
      ),
      fetchAll<{ user_id: string; completed_at: string }>((a, b) =>
        db.from("article_progress").select("user_id,completed_at").gte("completed_at", sinceIso).order("completed_at").range(a, b),
      ),
    ]);

    const cur = (iso: string | null) => inRange(iso, range.since, now + 1);
    const prev = (iso: string | null) => inRange(iso, range.prevSince, range.since);

    const curAttempts = attempts.filter((r) => cur(r.submitted_at));
    const activity = [
      ...attempts.map((r) => ({ u: r.user_id, t: r.submitted_at })),
      ...vocab.map((r) => ({ u: r.user_id, t: r.created_at })),
      ...reads.map((r) => ({ u: r.user_id, t: r.completed_at })),
    ];
    const activeIn = (test: (iso: string | null) => boolean) => new Set(activity.filter((x) => test(x.t)).map((x) => x.u)).size;

    // Grafik: har bir oraliqdagi faol foydalanuvchilar (takrorlanmas)
    const activeSeries = range.buckets.map(
      (b) => new Set(activity.filter((x) => inRange(x.t, b.start, b.end)).map((x) => x.u)).size,
    );

    const weekday = new Array(7).fill(0);
    for (const r of curAttempts) weekday[weekdayOf(Date.parse(r.submitted_at!))]++;

    const cefrMap = new Map<string, number>();
    for (const r of curAttempts) if (r.cefr_level) cefrMap.set(r.cefr_level, (cefrMap.get(r.cefr_level) ?? 0) + 1);
    const cefr = [...cefrMap.entries()]
      .map(([level, count]) => ({ level, count }))
      .sort((a, b) => cefrRank(a.level) - cefrRank(b.level));

    const skills = SKILLS.map((s) => {
      const vals = curAttempts
        .map((r) => r.section_scores?.[s.key])
        .filter((v): v is number => typeof v === "number" && Number.isFinite(v));
      return { ...s, count: vals.length, avg: vals.length ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10 : null };
    });

    const byTest = new Map<string, number>();
    for (const r of curAttempts) byTest.set(r.test_set_id, (byTest.get(r.test_set_id) ?? 0) + 1);
    const topIds = [...byTest.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
    let topTests: DashboardStats["topTests"] = [];
    if (topIds.length) {
      const { data } = await db.from("test_sets").select("id,title").in("id", topIds.map(([id]) => id));
      const titles = new Map((data ?? []).map((t: { id: string; title: string }) => [t.id, t.title]));
      topTests = topIds.map(([id, count]) => ({ id, title: titles.get(id) ?? "—", count }));
    }

    const modeMap = new Map<string, number>();
    for (const r of curAttempts) modeMap.set(r.mode, (modeMap.get(r.mode) ?? 0) + 1);
    const modes = [...modeMap.entries()].map(([k, count]) => ({ key: k, label: MODE_LABEL[k] ?? k, count }));

    return {
      range,
      totals: {
        users: users.count ?? 0,
        premium: premium.count ?? 0,
        teachers: teachers.count ?? 0,
        tests: tests.count ?? 0,
        articles: articles.count ?? 0,
        vocabPacks: packs.count ?? 0,
      },
      kpi: {
        newUsers: { value: newProfiles.filter((r) => cur(r.created_at)).length, prev: newProfiles.filter((r) => prev(r.created_at)).length },
        activeUsers: { value: activeIn(cur), prev: activeIn(prev) },
        completed: { value: curAttempts.length, prev: attempts.filter((r) => prev(r.submitted_at)).length },
        vocabGames: { value: vocab.filter((r) => cur(r.created_at)).length, prev: vocab.filter((r) => prev(r.created_at)).length },
      },
      series: {
        labels: range.buckets.map((b) => b.label),
        newUsers: bucketCounts(newProfiles.map((r) => Date.parse(r.created_at)), range.buckets),
        completed: bucketCounts(curAttempts.map((r) => Date.parse(r.submitted_at!)), range.buckets),
        active: activeSeries,
      },
      weekday,
      cefr,
      skills,
      topTests,
      modes,
      payments: withPayments ? await getPaymentStats(db, range) : null,
    };
  } catch {
    return null;
  }
}

/** To'lov usullari: Payme, Click (onlayn) va karta o'tkazmasi (chek bilan tasdiqlanadigan so'rovlar) */
export async function getPaymentStats(db: SupabaseClient, range: RangeInfo): Promise<PaymentStats> {
  const now = Date.now();
  const sinceIso = new Date(range.prevSince).toISOString();
  const [orders, manual, settings] = await Promise.all([
    fetchAll<{ id: string; user_id: string | null; provider: "payme" | "click"; amount: number; paid_at: string | null; plan_title: string | null }>((a, b) =>
      db
        .from("payment_orders")
        .select("id,user_id,provider,amount,paid_at,plan_title")
        .eq("status", "paid")
        .gte("paid_at", sinceIso)
        .order("paid_at", { ascending: false })
        .range(a, b),
    ),
    fetchAll<{ id: string; user_id: string; amount: number | null; plan: string; reviewed_at: string | null; created_at: string }>((a, b) =>
      db
        .from("premium_requests")
        .select("id,user_id,amount,plan,reviewed_at,created_at")
        .eq("status", "approved")
        .gte("created_at", sinceIso)
        .order("created_at", { ascending: false })
        .range(a, b),
    ),
    getPaymentSettings(),
  ]);

  const rows = [
    ...orders.map((o) => ({ id: o.id, user: o.user_id, method: o.provider as PayMethod, amount: o.amount, at: o.paid_at!, plan: o.plan_title })),
    ...manual.map((m) => ({ id: m.id, user: m.user_id, method: "card" as PayMethod, amount: m.amount ?? 0, at: m.reviewed_at ?? m.created_at, plan: m.plan })),
  ];
  const cur = rows.filter((r) => inRange(r.at, range.since, now + 1));
  const prevAmount = rows.filter((r) => inRange(r.at, range.prevSince, range.since)).reduce((s, r) => s + r.amount, 0);
  const cardLabel = cardSystem(settings.card_number);

  const methods = (
    [
      { key: "payme", label: "Payme" },
      { key: "click", label: "Click" },
      { key: "card", label: `Karta (${cardLabel})` },
    ] as const
  ).map((m) => {
    const list = cur.filter((r) => r.method === m.key);
    return { key: m.key, label: m.label, count: list.length, amount: list.reduce((s, r) => s + r.amount, 0) };
  });

  const recentRows = [...cur].sort((a, b) => Date.parse(b.at) - Date.parse(a.at)).slice(0, 6);
  const ids = [...new Set(recentRows.map((r) => r.user).filter((x): x is string => Boolean(x)))];
  const names = new Map<string, { full_name: string | null; email: string | null }>();
  if (ids.length) {
    const { data } = await db.from("profiles").select("id,full_name,email").in("id", ids);
    for (const p of (data ?? []) as { id: string; full_name: string | null; email: string | null }[]) names.set(p.id, p);
  }

  return {
    methods,
    count: cur.length,
    amount: cur.reduce((s, r) => s + r.amount, 0),
    prevAmount,
    cardLabel,
    recent: recentRows.map((r) => {
      const p = r.user ? names.get(r.user) : undefined;
      return {
        id: r.id,
        name: p?.full_name ?? p?.email ?? "Foydalanuvchi",
        email: p?.email ?? null,
        method: r.method,
        amount: r.amount,
        at: r.at,
        plan: r.plan,
      };
    }),
  };
}

/** To'lovlar sahifasi uchun (faqat to'lov statistikasi) */
export async function getPaymentStatsFor(key: RangeKey): Promise<PaymentStats | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    return await getPaymentStats(await client(), rangeInfo(key));
  } catch {
    return null;
  }
}
