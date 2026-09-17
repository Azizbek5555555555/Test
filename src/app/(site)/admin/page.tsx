import type { Metadata } from "next";
import Link from "next/link";
import { getAdminCounts } from "@/lib/admin-queries";
import { getPendingChecks } from "@/lib/queries";
import { getProfile, isAdmin } from "@/lib/auth";
import { formatDateTime } from "@/lib/format";
import { Stat, Alert } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export const metadata: Metadata = {
  title: "Admin panel",
  robots: { index: false, follow: false },
};

export default async function AdminDashboard() {
  const [counts, pending, profile] = await Promise.all([
    getAdminCounts(),
    getPendingChecks(),
    getProfile(),
  ]);

  const admin = isAdmin(profile);
  const hasServiceKey = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);

  const quickLinks = [
    { href: "/admin/tests", icon: "📝", label: "Test qo'shish" },
    { href: "/admin/articles", icon: "📰", label: "Maqola qo'shish" },
    { href: "/admin/vocabulary", icon: "📘", label: "So'z to'plami" },
    { href: "/admin/courses", icon: "🏫", label: "Kurs qo'shish" },
  ];

  return (
    <div className="space-y-6">
      {!isSupabaseConfigured() ? (
        <Alert tone="warning" title="Supabase ulanmagan">
          <code>.env.local</code> faylini to&apos;ldiring — SETUP.md ga qarang.
        </Alert>
      ) : null}

      {!hasServiceKey && admin ? (
        <Alert tone="warning" title="SUPABASE_SERVICE_ROLE_KEY topilmadi">
          Bu kalitsiz Premium berish, rollarni o&apos;zgartirish va savollarning
          to&apos;g&apos;ri javoblarini ko&apos;rish ishlamaydi. Kalitni{" "}
          <code>.env.local</code> ga qo&apos;shing (SETUP.md, 4-qadam).
        </Alert>
      ) : null}

      {/* -------------------------------------------------- Statistika */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat label="Foydalanuvchilar" value={counts.users} icon="👥" />
        <Stat
          label="Premium"
          value={counts.premiumUsers}
          hint={
            counts.users > 0
              ? `${Math.round((counts.premiumUsers / counts.users) * 100)}%`
              : undefined
          }
          icon="⭐"
        />
        <Stat label="Testlar" value={counts.testSets} icon="📝" />
        <Stat label="Maqolalar" value={counts.articles} icon="📰" />
      </div>

      {/* -------------------------------------------------- Diqqat talab */}
      <div className="grid sm:grid-cols-3 gap-4">
        <ActionCard
          href="/admin/grading"
          icon="✍️"
          count={counts.pendingChecks}
          label="Tekshirish kutilmoqda"
          hint="Writing / Speaking"
        />
        {admin ? (
          <ActionCard
            href="/admin/premium"
            icon="⭐"
            count={counts.pendingPremium}
            label="Premium so'rovlar"
            hint="Tasdiqlash kerak"
          />
        ) : null}
        <ActionCard
          href="/admin/applications"
          icon="📋"
          count={counts.newApplications}
          label="Yangi kurs arizalari"
          hint="Bog'lanish kerak"
        />
        <ActionCard
          href="/admin/messages"
          icon="✉️"
          count={counts.unreadMessages}
          label="O'qilmagan xabarlar"
          hint="Javob berish kerak"
        />
      </div>

      {/* -------------------------------------------------- Navbat */}
      <section className="card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h2 className="font-extrabold text-lg">Tekshirish navbati</h2>
          <ButtonLink href="/admin/grading" variant="secondary" size="sm">
            Barchasi →
          </ButtonLink>
        </div>

        {pending.length === 0 ? (
          <p className="text-sm text-muted">
            ✅ Hozircha tekshirilishi kerak bo&apos;lgan ish yo&apos;q.
          </p>
        ) : (
          <ul className="space-y-2">
            {pending.slice(0, 5).map((item) => (
              <li key={item.attempt_id}>
                <Link
                  href={`/admin/grading/${item.attempt_id}`}
                  className="flex flex-wrap items-center gap-3 rounded-xl border border-line
                             bg-[var(--bg-subtle)] p-3 hover:border-brand-400 transition-colors"
                >
                  <span className="font-semibold text-sm min-w-0 flex-1 truncate">
                    {item.full_name ?? item.email ?? "Foydalanuvchi"}
                  </span>
                  <span className="text-xs text-muted truncate max-w-[200px]">
                    {item.test_title}
                  </span>
                  {item.mode === "exam_checking" ? (
                    <Badge tone="premium">Exam</Badge>
                  ) : null}
                  <span className="text-xs text-muted">
                    {formatDateTime(item.submitted_at)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* -------------------------------------------------- Tez havolalar */}
      <section>
        <h2 className="font-extrabold text-lg mb-4">Tez havolalar</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {quickLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="card p-4 text-center hover:shadow-[var(--shadow-lift)] transition-shadow"
            >
              <span className="text-2xl" aria-hidden>
                {link.icon}
              </span>
              <p className="text-sm font-bold mt-2">{link.label}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

function ActionCard({
  href,
  icon,
  count,
  label,
  hint,
}: {
  href: string;
  icon: string;
  count: number;
  label: string;
  hint: string;
}) {
  return (
    <Link
      href={href}
      className={`card p-4 hover:shadow-[var(--shadow-lift)] transition-all ${
        count > 0 ? "border-brand-300 dark:border-brand-800" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-xl" aria-hidden>
          {icon}
        </span>
        <span
          className={`text-2xl font-extrabold tabular-nums ${
            count > 0 ? "text-brand-600 dark:text-brand-400" : "text-muted"
          }`}
        >
          {count}
        </span>
      </div>
      <p className="font-bold text-sm mt-2">{label}</p>
      <p className="text-xs text-muted mt-0.5">{hint}</p>
    </Link>
  );
}
