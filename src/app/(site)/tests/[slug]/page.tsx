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
import { SECTION_ICON, SECTION_LABEL } from "@/lib/constants";
import { formatDuration } from "@/lib/format";
import { Alert, PageHeader } from "@/components/ui/Card";
import { AccessBadge, Badge } from "@/components/ui/Badge";
import { Button, ButtonLink } from "@/components/ui/Button";

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

const CATEGORY_BACK: Record<string, { href: string; label: string }> = {
  full_mock: { href: "/full-mock", label: "Full Mock" },
  latest_questions: { href: "/latest-questions", label: "Oxirgi savollar" },
  general_english: { href: "/boost/listening", label: "Listening Practice" },
  exam_checking: { href: "/exam-checking", label: "Exam Full Checking" },
};

export default async function TestOverviewPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const testSet = await getTestSetBySlug(slug);

  if (!testSet || !testSet.published) notFound();

  const profile = await getProfile();
  const unlocked = profileHasPremium(profile);
  const locked = testSet.is_premium && !unlocked;

  const parts = await getTestParts(testSet.id);
  const questions = await getQuestionsForParts(parts.map((p) => p.id));

  const questionsByPart = new Map<string, number>();
  for (const question of questions) {
    questionsByPart.set(
      question.part_id,
      (questionsByPart.get(question.part_id) ?? 0) + 1,
    );
  }

  const openAttempt = profile
    ? await getOpenAttempt(testSet.id, profile.id)
    : null;

  const back = CATEGORY_BACK[testSet.category] ?? {
    href: "/",
    label: "Bosh sahifa",
  };

  return (
    <div className="container-page py-10">
      <Link
        href={back.href}
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-fg mb-6"
      >
        ← {back.label}
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
              <Badge tone="info">⏱ {formatDuration(testSet.duration_minutes)}</Badge>
              <Badge tone="neutral">❓ {questions.length} ta savol</Badge>
            </div>
          </PageHeader>

          {/* Bo'limlar ro'yxati */}
          <h2 className="font-extrabold text-lg mb-4">Test tuzilishi</h2>

          {parts.length === 0 ? (
            <Alert tone="warning" title="Bu testda hali bo'limlar yo'q">
              {locked
                ? "Bo'limlar Premium foydalanuvchilarga ko'rinadi."
                : "Admin panel orqali bo'lim va savollar qo'shing."}
            </Alert>
          ) : (
            <ol className="space-y-3">
              {parts.map((part, i) => (
                <li key={part.id} className="card p-4">
                  <div className="flex items-start gap-3">
                    <span
                      className="shrink-0 w-9 h-9 rounded-xl bg-[var(--bg-subtle)] border border-line
                                 grid place-items-center text-base"
                      aria-hidden
                    >
                      {SECTION_ICON[part.section]}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-bold text-muted tabular-nums">
                          {i + 1}.
                        </span>
                        <h3 className="font-bold">{part.title}</h3>
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
                        <span>⏱ {formatDuration(part.duration_minutes)}</span>
                        <span>
                          ❓ {questionsByPart.get(part.id) ?? 0} ta savol
                        </span>
                        {part.audio_url ? <span>🎧 Audio bor</span> : null}
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
                <p className="text-4xl mb-3" aria-hidden>
                  🔒
                </p>
                <h3 className="font-extrabold text-lg">
                  Bu test faqat Premium uchun
                </h3>
                <p className="text-sm text-muted mt-2 leading-relaxed">
                  Bu test faqat Premium foydalanuvchilar uchun. Premiumga
                  o&apos;ting va barcha testlarni oching.
                </p>
                <ButtonLink
                  href="/premium"
                  variant="premium"
                  size="lg"
                  fullWidth
                  className="mt-4"
                >
                  ⭐ Premiumga o&apos;tish
                </ButtonLink>
              </>
            ) : !profile ? (
              <>
                <h3 className="font-extrabold text-lg">Testni boshlash</h3>
                <p className="text-sm text-muted mt-2 leading-relaxed">
                  Natijalaringiz saqlanishi uchun avval tizimga kiring.
                </p>
                <ButtonLink
                  href={`/login?next=${encodeURIComponent(`/tests/${slug}`)}`}
                  size="lg"
                  fullWidth
                  className="mt-4"
                >
                  Kirish va boshlash
                </ButtonLink>
              </>
            ) : (
              <>
                <h3 className="font-extrabold text-lg">
                  {openAttempt ? "Tugallanmagan urinish" : "Testni boshlash"}
                </h3>
                <p className="text-sm text-muted mt-2 leading-relaxed">
                  {openAttempt
                    ? "Siz bu testni oldin boshlagansiz. Davom ettirishingiz mumkin — javoblaringiz saqlangan."
                    : "Boshlagach taymer ishga tushadi. Javoblaringiz avtomatik saqlanadi."}
                </p>

                <form action={startAttemptAction} className="mt-4">
                  <input type="hidden" name="test_set_id" value={testSet.id} />
                  <input
                    type="hidden"
                    name="mode"
                    value={
                      testSet.category === "full_mock" ? "full_mock" : "practice"
                    }
                  />
                  <Button type="submit" size="lg" fullWidth>
                    {openAttempt ? "Davom ettirish →" : "🚀 Testni boshlash"}
                  </Button>
                </form>
              </>
            )}
          </div>

          <div className="card p-5">
            <h3 className="font-bold text-sm mb-3">Qoidalar</h3>
            <ul className="space-y-2 text-sm text-muted">
              <li className="flex gap-2">
                <span aria-hidden>⏱</span>
                <span>Vaqt tugaganda test avtomatik yakunlanadi.</span>
              </li>
              <li className="flex gap-2">
                <span aria-hidden>💾</span>
                <span>Javoblar har o&apos;zgarishda o&apos;zi saqlanadi.</span>
              </li>
              <li className="flex gap-2">
                <span aria-hidden>🎧</span>
                <span>Listening audiosi bir marta ijro etiladi.</span>
              </li>
              <li className="flex gap-2">
                <span aria-hidden>✍️</span>
                <span>
                  Writing va Speaking javoblarini o&apos;qituvchi tekshiradi.
                </span>
              </li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
