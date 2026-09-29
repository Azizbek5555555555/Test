import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getProfile, isStaff, profileHasPremium } from "@/lib/auth";
import {
  getAttempt,
  getAttemptReview,
  getPartTranscripts,
  getTestParts,
  getTestSetById,
  withTranscripts,
} from "@/lib/queries";
import { ButtonLink } from "@/components/ui/Button";
import { FeedbackCards, ResultCard } from "@/components/test/ResultCard";
import { AnswerReview } from "@/components/test/AnswerReview";
import { PrintButton } from "@/components/test/PrintButton";

export const metadata: Metadata = {
  title: "Natija",
  robots: { index: false, follow: false },
};

export default async function ResultPage({
  params,
}: {
  params: Promise<{ attemptId: string }>;
}) {
  const { attemptId } = await params;

  const profile = await getProfile();
  if (!profile) {
    redirect(`/login?next=${encodeURIComponent(`/results/${attemptId}`)}`);
  }

  const attempt = await getAttempt(attemptId);
  if (!attempt) notFound();
  if (attempt.user_id !== profile.id && !isStaff(profile)) notFound();

  if (attempt.status === "in_progress") {
    redirect(`/test/${attempt.id}`);
  }

  const testSet = await getTestSetById(attempt.test_set_id);
  const review = await getAttemptReview(attempt.id);

  // Listening skriptlari — faqat Premium (va o'qituvchi) uchun, baza tekshiradi
  const listeningParts = testSet
    ? (await getTestParts(testSet.id)).filter(
        (part) => part.section === "listening",
      )
    : [];
  const transcriptMap =
    testSet && listeningParts.length > 0
      ? await getPartTranscripts(testSet.id)
      : {};
  const transcripts = withTranscripts(listeningParts, transcriptMap).filter(
    (part) => part.transcript,
  );
  const scriptLocked =
    listeningParts.length > 0 &&
    transcripts.length === 0 &&
    !profileHasPremium(profile);

  return (
    <div className="bg-gradient-to-b from-[#16213a] to-ink-950 to-30% print:bg-none">
      <div className="container-page pb-10 pt-10 sm:pt-14">
        <div className="mb-8 print:hidden">
          <Link
            href="/profile/results"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-fg"
          >
            ← Barcha natijalar
          </Link>
          <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.12em] text-success">
            Batafsil natija
          </p>
          <h1 className="display-title mt-1 text-[34px] sm:text-[40px]">
            Natijalar tahlili
          </h1>
        </div>

        <div className="grid items-start gap-8 lg:grid-cols-[440px_1fr] lg:gap-10">
          <div className="animate-fade-up lg:sticky lg:top-28">
            <ResultCard
              attempt={attempt}
              testTitle={testSet?.title ?? "Test"}
              studentName={profile.full_name}
              actions={
                <>
                  <PrintButton fullWidth />
                  {testSet ? (
                    <ButtonLink href={`/tests/${testSet.slug}`} fullWidth>
                      Qayta ishlash
                    </ButtonLink>
                  ) : (
                    <ButtonLink href="#tahlil" fullWidth>
                      Tahlil
                    </ButtonLink>
                  )}
                </>
              }
            />
          </div>

          <div>
            <FeedbackCards attempt={attempt} />
            <div id="tahlil" className="print:hidden">
              <p className="mb-1 text-xs font-semibold uppercase tracking-[0.12em] text-brand-400">
                Javoblar tahlili
              </p>
              <p className="text-muted text-sm mb-6">
                Har bir savol bo&apos;yicha to&apos;g&apos;ri javob va izohni
                ko&apos;ring — bu keyingi safar xatoni takrorlamaslikka yordam
                beradi.
              </p>

              {scriptLocked ? (
                <div className="card mb-8 flex flex-wrap items-center justify-between gap-3 p-4">
                  <p className="text-sm">
                    <strong>Audio skripti</strong> — faqat Premium
                    foydalanuvchilar uchun. Qaysi so&apos;zni eshitmaganingizni
                    skript orqali aniqlang.
                  </p>
                  <ButtonLink href="/premium" size="sm" variant="premium">
                    Premiumga o&apos;tish
                  </ButtonLink>
                </div>
              ) : null}

              {transcripts.length > 0 ? (
                <div className="space-y-3 mb-8">
                  {transcripts.map((part) => (
                    <details key={part.id} className="card overflow-hidden p-0">
                      <summary className="cursor-pointer select-none p-4 text-sm font-semibold hover:bg-ink-800">
                        Audio skripti — {part.title}
                      </summary>
                      <p className="px-4 pb-4 text-sm leading-relaxed whitespace-pre-line">
                        {part.transcript}
                      </p>
                    </details>
                  ))}
                </div>
              ) : null}

              {review.length > 0 ? (
                <AnswerReview rows={review} />
              ) : (
                <div className="card p-6 text-sm text-muted">
                  Tahlil mavjud emas.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
