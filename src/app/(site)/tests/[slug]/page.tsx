import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProfile, profileHasPremium } from "@/lib/auth";
import {
  getOpenAttempt,
  getQuestionsForParts,
  getTestParts,
  getTestSetBySlug,
} from "@/lib/queries";
import { startAttemptAction } from "@/lib/actions/attempts";
import { SECTION_LABEL } from "@/lib/constants";
import { Clock, Edit3, Headphones, Lock, Save } from "react-feather";
import { SectionIcon } from "@/components/ui/icons";
import { formatDuration } from "@/lib/format";
import { Alert, PageHeader } from "@/components/ui/Card";
import { AccessBadge, Badge } from "@/components/ui/Badge";
import { Button, ButtonLink } from "@/components/ui/Button";
import { getT } from "@/i18n/server";
import type { Bi } from "@/i18n";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const testSet = await getTestSetBySlug(slug);
  return {
    title: testSet?.title ?? "Test",
    description: testSet?.description ?? undefined,
  };
}

const CATEGORY_BACK: Record<string, { href: string; label: Bi }> = {
  full_mock: { href: "/full-mock", label: { uz: "Full Mock", en: "Full Mock" } },
  latest_questions: { href: "/latest-questions", label: { uz: "Oxirgi savollar", en: "Latest questions" } },
  general_english: { href: "/boost/listening", label: { uz: "Listening Practice", en: "Listening Practice" } },
  exam_checking: { href: "/exam-checking", label: { uz: "Exam Full Checking", en: "Exam Full Checking" } },
};

const START_ERRORS: Record<string, Bi> = {
  empty: {
    uz: "Bu test hali to'ldirilmagan — savollar qo'shilgach boshlash mumkin bo'ladi.",
    en: "This test is not complete yet — you can start once the questions are added.",
  },
  start: {
    uz: "Testni boshlab bo'lmadi. Sahifani yangilab, qayta urinib ko'ring.",
    en: "Could not start the test. Refresh the page and try again.",
  },
};

export default async function TestOverviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { slug } = await params;
  const { error: errorKey } = await searchParams;
  const [testSet, t] = await Promise.all([getTestSetBySlug(slug), getT()]);
  const startError = errorKey && START_ERRORS[errorKey] ? t(START_ERRORS[errorKey]) : undefined;

  if (!testSet || !testSet.published) notFound();

  const profile = await getProfile();
  const unlocked = profileHasPremium(profile);
  const locked = testSet.is_premium && !unlocked;

  const parts = await getTestParts(testSet.id);
  const questions = await getQuestionsForParts(parts.map((p) => p.id));

  // Moslashtirish savolidagi har bir qator alohida savol sifatida sanaladi
  const weightOf = (question: (typeof questions)[number]) =>
    question.kind === "matching" && Array.isArray(question.options) && question.options.length > 0
      ? question.options.length
      : 1;
  const totalQuestions = questions.reduce((sum, q) => sum + weightOf(q), 0);
  const questionsByPart = new Map<string, number>();
  for (const question of questions) {
    questionsByPart.set(
      question.part_id,
      (questionsByPart.get(question.part_id) ?? 0) + weightOf(question),
    );
  }

  const openAttempt = profile
    ? await getOpenAttempt(testSet.id, profile.id)
    : null;

  const back = CATEGORY_BACK[testSet.category] ?? {
    href: "/",
    label: { uz: "Bosh sahifa", en: "Home" },
  };

  return (
    <div className="container-page py-10">
      <Link
        href={back.href}
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-fg mb-6"
      >
        ← {t(back.label)}
      </Link>

      <div className="grid lg:grid-cols-[1fr_340px] gap-8">
        <div>
          <PageHeader
            eyebrow={
              testSet.year_label ??
              (testSet.section ? SECTION_LABEL[testSet.section] : "Mock test")
            }
            title={testSet.title}
            description={testSet.description ?? undefined}
          >
            <div className="flex flex-wrap items-center gap-2">
              <AccessBadge isPremium={testSet.is_premium} unlocked={unlocked} />
              {testSet.level ? (
                <Badge tone="neutral">{testSet.level}</Badge>
              ) : null}
              <Badge tone="info">{formatDuration(testSet.duration_minutes, t.locale)}</Badge>
              <Badge tone="neutral">
                {totalQuestions} {t("ta savol", "questions")}
              </Badge>
            </div>
          </PageHeader>

          {/* Bo'limlar ro'yxati */}
          <h2 className="font-extrabold text-lg mb-4">{t("Test tuzilishi", "Test structure")}</h2>

          {parts.length === 0 ? (
            <Alert tone="warning" title={t("Bu testda hali bo'limlar yo'q", "This test has no sections yet")}>
              {locked
                ? t("Bo'limlar Premium foydalanuvchilarga ko'rinadi.", "Sections are visible to Premium members.")
                : t("Bo'limlar tez orada qo'shiladi.", "Sections will be added soon.")}
            </Alert>
          ) : (
            <ol className="space-y-3">
              {parts.map((part, i) => (
                <li key={part.id} className="card p-4">
                  <div className="flex items-start gap-3">
                    <span className="grid size-9 shrink-0 place-items-center rounded-lg border border-line bg-ink-800 text-brand-400">
                      <SectionIcon section={part.section} size={16} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-bold text-muted tabular-nums">
                          {i + 1}.
                        </span>
                        <h3 className="font-display text-lg text-fg">{part.title}</h3>
                        <Badge tone="neutral">
                          {SECTION_LABEL[part.section]}
                        </Badge>
                      </div>
                      {part.instructions ? (
                        <p className="text-sm text-muted mt-1.5 leading-relaxed">
                          {part.instructions}
                        </p>
                      ) : null}
                      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-muted">
                        <span className="inline-flex items-center gap-1.5">
                          <Clock size={12} className="text-brand-400" aria-hidden />
                          {formatDuration(part.duration_minutes, t.locale)}
                        </span>
                        <span>
                          {questionsByPart.get(part.id) ?? 0} {t("ta savol", "questions")}
                        </span>
                        {part.audio_url ? (
                          <span className="inline-flex items-center gap-1.5">
                            <Headphones size={12} className="text-brand-400" aria-hidden /> {t("Audio bor", "Has audio")}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>

        {/* ---------------------------------------------- Yon panel */}
        <aside className="lg:sticky lg:top-24 h-fit space-y-4">
          <div className="card p-5">
            {locked ? (
              <>
                <span className="mb-3 grid size-12 place-items-center rounded-xl border border-line bg-ink-800 text-gold-400">
                  <Lock size={20} aria-hidden />
                </span>
                <h3 className="font-extrabold text-lg">
                  {t("Bu test faqat Premium uchun", "This test is Premium only")}
                </h3>
                <p className="text-sm text-muted mt-2 leading-relaxed">
                  {t(
                    "Bu test faqat Premium foydalanuvchilar uchun. Premiumga o'ting va barcha testlarni oching.",
                    "This test is for Premium members only. Go Premium to unlock every test.",
                  )}
                </p>
                <ButtonLink
                  href="/premium"
                  variant="premium"
                  size="lg"
                  fullWidth
                  className="mt-4"
                >
                  {t("Premiumga o'tish", "Go Premium")}
                </ButtonLink>
              </>
            ) : !profile ? (
              <>
                <h3 className="font-extrabold text-lg">{t("Testni boshlash", "Start the test")}</h3>
                <p className="text-sm text-muted mt-2 leading-relaxed">
                  {t("Natijalaringiz saqlanishi uchun avval tizimga kiring.", "Log in first so your results are saved.")}
                </p>
                <ButtonLink
                  href={`/login?next=${encodeURIComponent(`/tests/${slug}`)}`}
                  size="lg"
                  fullWidth
                  className="mt-4"
                >
                  {t("Kirish va boshlash", "Log in and start")}
                </ButtonLink>
              </>
            ) : (
              <>
                <h3 className="font-extrabold text-lg">
                  {openAttempt ? t("Tugallanmagan urinish", "Unfinished attempt") : t("Testni boshlash", "Start the test")}
                </h3>
                <p className="text-sm text-muted mt-2 leading-relaxed">
                  {openAttempt
                    ? t(
                        "Siz bu testni oldin boshlagansiz. Davom ettirishingiz mumkin — javoblaringiz saqlangan.",
                        "You started this test before. You can continue — your answers are saved.",
                      )
                    : t(
                        "Boshlagach taymer ishga tushadi. Javoblaringiz avtomatik saqlanadi.",
                        "The timer starts once you begin. Your answers are saved automatically.",
                      )}
                </p>

                {startError ? (
                  <div className="mt-4">
                    <Alert tone="danger">{startError}</Alert>
                  </div>
                ) : null}

                {parts.length === 0 ? (
                  <p className="mt-4 text-sm font-semibold text-muted">
                    ⏳ {t("Bu test hali tayyor emas. Tez orada qo'shiladi.", "This test is not ready yet. It will be added soon.")}
                  </p>
                ) : (
                  <form action={startAttemptAction} className="mt-4">
                    <input type="hidden" name="test_set_id" value={testSet.id} />
                    <Button type="submit" size="lg" fullWidth>
                      {openAttempt ? `${t("Davom ettirish", "Continue")} →` : t("Testni boshlash", "Start the test")}
                    </Button>
                  </form>
                )}
              </>
            )}
          </div>

          <div className="card p-5">
            <h3 className="font-bold text-sm mb-3">{t("Qoidalar", "Rules")}</h3>
            <ul className="space-y-2 text-sm text-muted">
              <li className="flex gap-2">
                <Clock size={15} className="mt-0.5 shrink-0 text-brand-400" aria-hidden />
                <span>{t("Vaqt tugaganda test avtomatik yakunlanadi.", "The test ends automatically when time runs out.")}</span>
              </li>
              <li className="flex gap-2">
                <Save size={15} className="mt-0.5 shrink-0 text-brand-400" aria-hidden />
                <span>{t("Javoblar har o'zgarishda o'zi saqlanadi.", "Answers save themselves on every change.")}</span>
              </li>
              <li className="flex gap-2">
                <Headphones size={15} className="mt-0.5 shrink-0 text-brand-400" aria-hidden />
                <span>{t("Listening audiosi bir marta ijro etiladi.", "Listening audio plays only once.")}</span>
              </li>
              <li className="flex gap-2">
                <Edit3 size={15} className="mt-0.5 shrink-0 text-brand-400" aria-hidden />
                <span>
                  {t("Writing va Speaking javoblarini o'qituvchi tekshiradi.", "A teacher reviews Writing and Speaking answers.")}
                </span>
              </li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
