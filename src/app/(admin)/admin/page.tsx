import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Briefcase,
  CheckSquare,
  Clipboard,
  FileText,
  Grid,
  Mail,
  Plus,
  Star,
  Users,
} from "react-feather";
import { getAdminCounts } from "@/lib/admin-queries";
import { getDashboardStats, parseRange, RANGES } from "@/lib/admin-stats";
import { getPendingChecks } from "@/lib/queries";
import { getProfile, isAdmin } from "@/lib/auth";
import { cn, formatDateTime, formatSum, initials } from "@/lib/format";
import { COURSES_ENABLED } from "@/lib/constants";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { Alert } from "@/components/ui/Card";
import { AreaChart, Delta, Donut, fmt, HBars, Legend, METHOD_COLOR, PillBars } from "@/components/admin/charts";

export const metadata: Metadata = {
  title: "Admin panel",
  robots: { index: false, follow: false },
};

const CEFR_COLOR: Record<string, string> = {
  A1: "#6e7c93",
  A2: "#8b93c9",
  B1: "#7c89ff",
  B2: "#3cc3b1",
  C1: "#e3a79b",
  C2: "#d9b382",
};
const WEEK = ["Du", "Se", "Ch", "Pa", "Ju", "Sh", "Ya"];

export default async function AdminDashboard({ searchParams }: { searchParams: Promise<{ range?: string }> }) {
  const { range: rangeParam } = await searchParams;
  const rangeKey = parseRange(rangeParam);
  const profile = await getProfile();
  const admin = isAdmin(profile);
  const [counts, pending, stats] = await Promise.all([getAdminCounts(), getPendingChecks(), getDashboardStats(rangeKey, admin)]);

  const hasServiceKey = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
  const firstName = (profile?.full_name ?? "").split(" ")[0] || "Admin";
  const period = RANGES.find((r) => r.key === rangeKey)!.label.toLowerCase();

  const quick = [
    { href: "/admin/tests", label: "Test", icon: FileText },
    { href: "/admin/articles", label: "Maqola", icon: BookOpen },
    { href: "/admin/vocabulary", label: "So'zlar", icon: Grid },
    ...(COURSES_ENABLED ? [{ href: "/admin/courses", label: "Kurs", icon: Briefcase }] : []),
  ];

  const attention = [
    { href: "/admin/grading", label: "Tekshirish kutilmoqda", sub: "Writing / Speaking", count: counts.pendingChecks, icon: CheckSquare },
    ...(admin ? [{ href: "/admin/premium", label: "Premium so'rovlar", sub: "Chekni tasdiqlash", count: counts.pendingPremium, icon: Star }] : []),
    ...(COURSES_ENABLED
      ? [{ href: "/admin/applications", label: "Kurs arizalari", sub: "Bog'lanish kerak", count: counts.newApplications, icon: Clipboard }]
      : []),
    { href: "/admin/messages", label: "O'qilmagan xabarlar", sub: "Javob berish", count: counts.unreadMessages, icon: Mail },
  ];

  const pay = stats?.payments ?? null;
  const topMethod = pay ? [...pay.methods].sort((a, b) => b.count - a.count || b.amount - a.amount)[0] : null;

  return (
    <div className="space-y-5">
      {/* -------------------------------------------------- Sarlavha + davr filtri */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted">Xush kelibsiz, {firstName}</p>
          <h1 className="mt-1 text-[30px] font-light tracking-tight">Boshqaruv paneli</h1>
        </div>
        <nav className="flex flex-wrap gap-1.5" aria-label="Davr">
          {RANGES.map((r) => (
            <Link
              key={r.key}
              href={r.key === "30" ? "/admin" : `/admin?range=${r.key}`}
              scroll={false}
              className={cn("ag-pillbtn", r.key === rangeKey && "is-active")}
              aria-current={r.key === rangeKey ? "true" : undefined}
            >
              {r.label}
            </Link>
          ))}
        </nav>
      </div>

      {!isSupabaseConfigured() ? (
        <Alert tone="warning" title="Supabase ulanmagan">
          <code>.env.local</code> faylini to&apos;ldiring — SETUP.md ga qarang.
        </Alert>
      ) : null}
      {!hasServiceKey && admin ? (
        <Alert tone="warning" title="SUPABASE_SERVICE_ROLE_KEY topilmadi">
          Bu kalitsiz statistika to&apos;liq emas, Premium berish va rollarni o&apos;zgartirish ishlamaydi.
        </Alert>
      ) : null}

      {/* ================================================== 1-qator */}
      <div className="grid gap-5 xl:grid-cols-[1.2fr_1fr_1fr]">
        {/* Foydalanuvchilar (Payno: Available Balance) */}
        <section className="ag flex flex-col">
          <div className="flex items-center justify-between">
            <p className="flex items-center gap-2.5 text-sm text-muted">
              <span className="ag-circle">
                <Users size={16} />
              </span>
              Jami foydalanuvchilar
            </p>
            <span className="h-9 w-9 rounded-full bg-gradient-to-br from-brand-400 to-gold-400 shadow-[0_8px_20px_-8px_rgba(227,167,155,.8)]" aria-hidden />
          </div>
          <p className="ag-huge mt-7">{fmt(stats?.totals.users ?? counts.users)}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="ag-pillbtn">
              <Star size={12} /> Premium: <b className="font-semibold text-fg">{fmt(stats?.totals.premium ?? counts.premiumUsers)}</b>
              {stats && stats.totals.users > 0 ? ` · ${Math.round((stats.totals.premium / stats.totals.users) * 100)}%` : ""}
            </span>
            <span className="ag-pillbtn">
              Testlar: <b className="font-semibold text-fg">{fmt(stats?.totals.tests ?? counts.testSets)}</b>
            </span>
            <span className="ag-pillbtn">
              Maqolalar: <b className="font-semibold text-fg">{fmt(stats?.totals.articles ?? counts.articles)}</b>
            </span>
          </div>
          <p className="mt-7 text-sm text-muted">Tez qo&apos;shish</p>
          <div className="mt-3 grid grid-cols-4 gap-2">
            {quick.map((q) => (
              <Link key={q.href} href={q.href} className="group flex flex-col items-center gap-2 text-center text-[12.5px] text-muted hover:text-fg">
                <span className="ag-circle !h-14 !w-14 transition-colors group-hover:!bg-white/10">
                  <Plus size={18} className="text-fg" />
                </span>
                {q.label}
              </Link>
            ))}
          </div>
        </section>

        {/* KPI kartalari + haftalik faollik */}
        <div className="grid gap-5">
          <div className="grid grid-cols-2 gap-5">
            <KpiCard label="Yangi foydalanuvchilar" value={stats?.kpi.newUsers.value ?? 0} prev={stats?.kpi.newUsers.prev ?? 0} />
            <KpiCard label="Faol foydalanuvchilar" value={stats?.kpi.activeUsers.value ?? 0} prev={stats?.kpi.activeUsers.prev ?? 0} />
          </div>
          <section className="ag">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted">Tugatilgan testlar</p>
              <span className="ag-pillbtn">{RANGES.find((r) => r.key === rangeKey)!.label}</span>
            </div>
            <div className="mt-2 flex items-end justify-between gap-4">
              <div className="shrink-0">
                <p className="ag-big">{fmt(stats?.kpi.completed.value ?? 0)}</p>
                <div className="mt-2">
                  <Delta value={stats?.kpi.completed.value ?? 0} prev={stats?.kpi.completed.prev ?? 0} />
                </div>
                <p className="mt-2 text-[11px] text-faint">hafta kunlari bo&apos;yicha</p>
              </div>
              <div className="w-full max-w-[230px]">
                <PillBars values={stats?.weekday ?? new Array(7).fill(0)} labels={WEEK} />
              </div>
            </div>
          </section>
        </div>

        {/* Diqqat talab (Payno: Send Money) */}
        <section className="ag flex flex-col">
          <p className="ag-title">Diqqat talab</p>
          <ul className="mt-4 space-y-2.5">
            {attention.map((a) => (
              <li key={a.href}>
                <Link href={a.href} className="ag-row">
                  <span className="ag-circle">
                    <a.icon size={16} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[14px]">{a.label}</span>
                    <span className="ag-sub">{a.sub}</span>
                  </span>
                  <span className={cn("text-xl font-light tabular-nums", a.count > 0 ? "text-brand-400" : "text-faint")}>{a.count}</span>
                </Link>
              </li>
            ))}
          </ul>
          <Link href="/admin/grading" className="ag-primary mt-auto pt-3">
            Tekshirishni boshlash <ArrowRight size={16} />
          </Link>
        </section>
      </div>

      {/* ================================================== 2-qator: grafik + to'lov usullari */}
      <div className={cn("grid gap-5", pay ? "xl:grid-cols-[2.2fr_1fr]" : "")}>
        <section className="ag">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="ag-title">Ro&apos;yxatdan o&apos;tish va faollik</p>
              <p className="ag-sub">Oxirgi {period} · Toshkent vaqti bo&apos;yicha</p>
            </div>
            <div className="flex flex-wrap gap-3 text-[12px] text-muted">
              <LegendDot color="#e3a79b" label="Yangi foydalanuvchilar" />
              <LegendDot color="#7c89ff" label="Faol foydalanuvchilar" />
              <LegendDot color="#d9b382" label="Tugatilgan testlar" />
            </div>
          </div>
          <div className="mt-4">
            {stats ? (
              <AreaChart
                height={pay ? 330 : 260}
                labels={stats.series.labels}
                series={[
                  { name: "Yangi", color: "#e3a79b", values: stats.series.newUsers },
                  { name: "Faol", color: "#7c89ff", values: stats.series.active },
                  { name: "Testlar", color: "#d9b382", values: stats.series.completed },
                ]}
              />
            ) : (
              <p className="py-16 text-center text-sm text-muted">Ma&apos;lumot yo&apos;q</p>
            )}
          </div>
        </section>

        {pay ? (
          <section className="ag">
            <div className="flex items-center justify-between">
              <p className="ag-title">To&apos;lov usullari</p>
              <Link href={`/admin/payments${rangeKey === "30" ? "" : `?range=${rangeKey}`}`} className="ag-pillbtn">
                Batafsil
              </Link>
            </div>
            <div className="mt-4 flex flex-col items-center gap-5">
              <Donut size={172} stroke={18} segments={pay.methods.map((m) => ({ label: m.label, value: m.count, color: METHOD_COLOR[m.key] }))}>
                <span className="text-[26px] font-light tabular-nums">{fmt(pay.count)}</span>
                <span className="text-[11px] text-faint">ta to&apos;lov</span>
              </Donut>
              <Legend
                segments={pay.methods.map((m) => ({ label: m.label, value: m.count, color: METHOD_COLOR[m.key] }))}
                suffix={(s) => formatSum(pay.methods.find((m) => m.label === s.label)?.amount ?? 0)}
              />
            </div>
            {topMethod && topMethod.count > 0 ? (
              <p className="mt-4 rounded-2xl bg-white/5 px-3 py-2 text-center text-[12.5px] text-muted">
                Eng ko&apos;p ishlatilgan: <b className="font-semibold text-fg">{topMethod.label}</b>
              </p>
            ) : null}
          </section>
        ) : null}
      </div>

      {/* ================================================== 3-qator: CEFR, ko'nikmalar, testlar */}
      <div className="grid gap-5 lg:grid-cols-3">
        <section className="ag">
          <p className="ag-title">CEFR darajalari</p>
          <p className="ag-sub">Natija olingan urinishlar, {period}</p>
          {stats && stats.cefr.length > 0 ? (
            <div className="mt-5 flex items-center gap-5">
              <Donut size={150} stroke={16} segments={stats.cefr.map((c) => ({ label: c.level, value: c.count, color: CEFR_COLOR[c.level] ?? "#6e7c93" }))}>
                <span className="text-[22px] font-light tabular-nums">{fmt(stats.cefr.reduce((s, c) => s + c.count, 0))}</span>
                <span className="text-[10.5px] text-faint">natija</span>
              </Donut>
              <Legend segments={stats.cefr.map((c) => ({ label: c.level, value: c.count, color: CEFR_COLOR[c.level] ?? "#6e7c93" }))} />
            </div>
          ) : (
            <Empty />
          )}
        </section>

        <section className="ag">
          <p className="ag-title">Ko&apos;nikmalar bo&apos;yicha o&apos;rtacha ball</p>
          <p className="ag-sub">Rasmiy shkala (0–75), barcha urinishlar, {period}</p>
          <div className="mt-5">
            {stats && stats.skills.some((s) => s.count > 0) ? (
              <HBars
                max={75}
                items={stats.skills.map((s) => ({ label: s.label, value: s.avg, hint: `${fmt(s.count)} ta natija` }))}
              />
            ) : (
              <Empty />
            )}
          </div>
        </section>

        <section className="ag">
          <p className="ag-title">Eng ko&apos;p ishlangan testlar</p>
          <p className="ag-sub">{period}</p>
          {stats && stats.topTests.length > 0 ? (
            <ol className="mt-4 space-y-2">
              {stats.topTests.map((t, i) => (
                <li key={t.id} className="ag-row !py-2.5">
                  <span className="ag-circle !h-8 !w-8 text-[12px]">{i + 1}</span>
                  <Link href={`/admin/tests/${t.id}`} className="min-w-0 flex-1 truncate text-[13.5px] hover:text-brand-400">
                    {t.title}
                  </Link>
                  <span className="text-[13px] tabular-nums text-muted">{fmt(t.count)}</span>
                </li>
              ))}
            </ol>
          ) : (
            <Empty />
          )}
          {stats && stats.modes.length > 0 ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {stats.modes.map((m) => (
                <span key={m.key} className="ag-pillbtn">
                  {m.label}: <b className="font-semibold text-fg">{fmt(m.count)}</b>
                </span>
              ))}
            </div>
          ) : null}
        </section>
      </div>

      {/* ================================================== 4-qator: to'lovlar va navbat */}
      <div className={cn("grid gap-5", pay ? "xl:grid-cols-[1.25fr_1fr_1fr]" : "lg:grid-cols-2")}>
        {pay ? (
          <section className="ag">
            <div className="flex items-center justify-between">
              <p className="ag-title">Oxirgi to&apos;lovlar</p>
              <Link href="/admin/payments" className="text-[13px] text-muted hover:text-fg">
                Barchasi
              </Link>
            </div>
            {pay.recent.length > 0 ? (
              <ul className="mt-3 divide-y divide-white/5">
                {pay.recent.map((r) => (
                  <li key={r.id} className="flex items-center gap-3 py-2.5">
                    <span className="adm-avatar !h-10 !w-10 !text-[12px]">{initials(r.name)}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[14px]">{r.name}</span>
                      <span className="ag-sub">{formatDateTime(r.at)}</span>
                    </span>
                    <span className="text-right">
                      <span className="block text-[14px] tabular-nums">+{formatSum(r.amount)}</span>
                      <span className="text-[11px]" style={{ color: METHOD_COLOR[r.method] }}>
                        {pay.methods.find((m) => m.key === r.method)?.label}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <Empty text="Bu davrda to'lov yo'q" />
            )}
          </section>
        ) : null}

        <section className="ag">
          <div className="flex items-center justify-between">
            <p className="ag-title">Tekshirish navbati</p>
            <Link href="/admin/grading" className="text-[13px] text-muted hover:text-fg">
              Barchasi
            </Link>
          </div>
          {pending.length === 0 ? (
            <Empty text="Tekshiriladigan ish yo'q" />
          ) : (
            <ul className="mt-3 space-y-2.5">
              {pending.slice(0, 5).map((item) => (
                <li key={item.attempt_id}>
                  <Link href={`/admin/grading/${item.attempt_id}`} className="ag-row">
                    <span className="ag-circle text-[12px]">{initials(item.full_name ?? item.email)}</span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="truncate text-[14px]">{item.full_name ?? item.email ?? "Foydalanuvchi"}</span>
                        {item.mode === "exam_checking" ? <span className="ad-chip !text-gold-400">Exam</span> : null}
                      </span>
                      <span className="ag-sub block truncate">
                        {item.test_title} · {formatDateTime(item.submitted_at)}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Tushum — kredit karta ko'rinishida (Payno: Credit Card) */}
        {pay ? (
          <section className="ag flex flex-col">
            <p className="ag-title">Tushum</p>
            <div className="ad-cardviz mt-4">
              <div className="flex items-start justify-between">
                <span className="font-display text-[18px] font-semibold">
                  level<span className="text-[#10bfa6]">x</span>english <span className="text-brand-400">Premium</span>
                </span>
                <span className="ad-cardviz-chip" aria-hidden />
              </div>
              <p className="mt-auto text-[11px] uppercase tracking-[0.16em] text-white/60">{RANGES.find((r) => r.key === rangeKey)!.label}</p>
              <div className="flex items-end justify-between gap-3">
                <p className="whitespace-nowrap text-[23px] font-light tabular-nums">{formatSum(pay.amount)}</p>
                <Delta value={pay.amount} prev={pay.prevAmount} />
              </div>
            </div>
            <p className="mt-3 text-[12px] text-faint">Payme + Click + karta o&apos;tkazmalari (tasdiqlangan)</p>
          </section>
        ) : null}
      </div>
    </div>
  );
}

function KpiCard({ label, value, prev }: { label: string; value: number; prev: number }) {
  return (
    <section className="ag">
      <p className="text-[13px] text-muted">{label}</p>
      <div className="mt-6 flex items-end justify-between gap-2">
        <p className="ag-big">{fmt(value)}</p>
        <Delta value={value} prev={prev} />
      </div>
    </section>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <i className="h-2 w-2 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}

function Empty({ text = "Bu davrda ma'lumot yo'q" }: { text?: string }) {
  return <p className="py-10 text-center text-sm text-faint">{text}</p>;
}
