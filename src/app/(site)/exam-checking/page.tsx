import type { Metadata } from "next";
import Link from "next/link";
import { getProfile, profileHasPremium } from "@/lib/auth";
import { countQuestionsByTestSet, getTestSets } from "@/lib/queries";
import { EXAM_SECTION_ORDER, SECTION_ICON, SECTION_LABEL } from "@/lib/constants";
import { formatDuration } from "@/lib/format";
import { PageHeader, EmptyState } from "@/components/ui/Card";
import { AccessBadge, Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "Exam Full Checking",
  description:
    "Real Multilevel kompyuter imtihoni simulyatsiyasi: Listening → Reading → Writing → Speaking va to'liq natija.",
};

export default async function ExamCheckingPage() {
  const [profile, exams] = await Promise.all([
    getProfile(),
    getTestSets({ category: "exam_checking" }),
  ]);

  const unlocked = profileHasPremium(profile);
  const counts = await countQuestionsByTestSet(exams.map((e) => e.id));

  return (
    <div className="container-page py-10">
      {/* --------------------------------------------------- Hero */}
      <div className="card p-0 overflow-hidden mb-10">
        <div className="bg-gradient-to-br from-gold-500 via-gold-600 to-amber-700 p-8 sm:p-12 text-white">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <Badge tone="premium" className="bg-white/20 text-white border-white/30">
              🔒 PREMIUM
            </Badge>
            {unlocked ? (
              <Badge tone="premium" className="bg-white/20 text-white border-white/30">
                ⭐ Sizda ochiq
              </Badge>
            ) : null}
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold leading-tight text-balance-title">
            EXAM FULL CHECKING
          </h1>
          <p className="text-white/90 mt-4 text-base sm:text-lg leading-relaxed max-w-2xl">
            Bu bo&apos;lim faqat Premium foydalanuvchilar uchun ochiladi.
            O&apos;quvchi bu yerda Multilevel imtihonini xuddi real kompyuter
            imtihonidek topshiradi va yakunda to&apos;liq natijani oladi.
          </p>

          <ol className="flex flex-wrap items-center gap-2 mt-7">
            {EXAM_SECTION_ORDER.map((section, i) => (
              <li key={section} className="flex items-center gap-2">
                <span className="rounded-xl bg-white/15 border border-white/25 px-3 py-1.5 text-sm font-bold">
                  {SECTION_ICON[section]} {SECTION_LABEL[section]}
                </span>
                {i < EXAM_SECTION_ORDER.length - 1 ? (
                  <span aria-hidden className="text-white/60">
                    →
                  </span>
                ) : null}
              </li>
            ))}
          </ol>
        </div>

        <div className="grid sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-[var(--border)]">
          {[
            {
              icon: "🖥️",
              title: "Real imtihon muhiti",
              text: "Bo'limlar ketma-ket ochiladi, orqaga qaytib bo'lmaydi, audio bir marta ijro etiladi.",
            },
            {
              icon: "📊",
              title: "To'liq natija",
              text: "Har bir bo'lim uchun alohida ball va umumiy CEFR darajasi (A1–C1).",
            },
            {
              icon: "👩‍🏫",
              title: "O'qituvchi tekshiruvi",
              text: "Writing va Speaking javoblaringizni o'qituvchi tekshirib, izoh yozadi.",
            },
          ].map((item) => (
            <div key={item.title} className="p-6">
              <p className="text-2xl" aria-hidden>
                {item.icon}
              </p>
              <h2 className="font-bold mt-2">{item.title}</h2>
              <p className="text-sm text-muted mt-1.5 leading-relaxed">
                {item.text}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* --------------------------------------------------- Imtihonlar */}
      <PageHeader
        title="Mavjud imtihonlar"
        description="Har bir imtihon to'liq to'rt bo'limdan iborat va taxminan 3 soat davom etadi."
      />

      {!unlocked ? (
        <div
          className="card p-6 mb-6 border-gold-300 dark:border-gold-800
                     bg-gradient-to-r from-gold-50 to-surface dark:from-gold-950/30"
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="font-extrabold text-lg">
                🔒 Bu bo&apos;lim Premium foydalanuvchilar uchun
              </h3>
              <p className="text-sm text-muted mt-1.5 max-w-xl leading-relaxed">
                Premiumga o&apos;tsangiz, imtihon simulyatsiyasi, barcha mock
                testlar, oxirgi tushgan savollar va Premium materiallar
                ochiladi.
              </p>
            </div>
            <ButtonLink href="/premium" variant="premium" size="lg">
              ⭐ Premiumga o&apos;tish
            </ButtonLink>
          </div>
        </div>
      ) : null}

      {exams.length === 0 ? (
        <EmptyState
          icon="🎯"
          title="Imtihonlar hali qo'shilmagan"
          description="Admin panel orqali 'Exam Checking' turkumida imtihon yarating."
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {exams.map((exam) => (
            <Link
              key={exam.id}
              href={unlocked ? `/exam-checking/${exam.slug}` : "/premium?reason=locked"}
              className="group card p-5 flex flex-col
                         hover:shadow-[var(--shadow-lift)] hover:-translate-y-0.5 transition-all duration-200"
            >
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-bold text-lg leading-snug">{exam.title}</h3>
                <AccessBadge isPremium={exam.is_premium} unlocked={unlocked} />
              </div>

              {exam.description ? (
                <p className="text-sm text-muted mt-2 leading-relaxed flex-1">
                  {exam.description}
                </p>
              ) : null}

              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-4 pt-4 border-t border-line text-xs text-muted">
                <span>⏱ {formatDuration(exam.duration_minutes)}</span>
                <span>❓ {counts[exam.id] ?? 0} ta savol</span>
                {exam.level ? <Badge tone="neutral">{exam.level}</Badge> : null}
              </div>

              <span
                className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold
                           text-gold-700 dark:text-gold-400 group-hover:gap-2.5 transition-all"
              >
                {unlocked ? "START EXAM" : "🔒 Premium kerak"}
                <span aria-hidden>→</span>
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
