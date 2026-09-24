import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getProfile, isStaff } from "@/lib/auth";
import {
  getAttempt,
  getAttemptReview,
  getTestParts,
  getTestSetById,
} from "@/lib/queries";
import { ButtonLink } from "@/components/ui/Button";
import { ResultCard } from "@/components/test/ResultCard";
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

  // Listening transkriptlari — test yakunlangach o'quvchiga ochiladi
  const transcripts = testSet
    ? (await getTestParts(testSet.id)).filter(
        (part) => part.section === "listening" && part.transcript,
      )
    : [];

  return (
    <div className="container-page py-10">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 print:hidden">
        <Link
          href="/profile/results"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-fg"
        >
          ← Barcha natijalar
        </Link>
        <div className="flex flex-wrap gap-2">
          <PrintButton />
          {testSet ? (
            <ButtonLink href={`/tests/${testSet.slug}`} variant="secondary">
              Qayta ishlash
            </ButtonLink>
          ) : null}
        </div>
      </div>

      <div className="grid lg:grid-cols-[400px_1fr] gap-8 items-start">
        <div className="lg:sticky lg:top-24">
          <ResultCard
            attempt={attempt}
            testTitle={testSet?.title ?? "Test"}
            studentName={profile.full_name}
          />
        </div>

        <div className="print:hidden">
          <h2 className="text-2xl font-extrabold mb-1">
            Javoblar tahlili
          </h2>
          <p className="text-muted text-sm mb-6">
            Har bir savol bo&apos;yicha to&apos;g&apos;ri javob va izohni
            ko&apos;ring — bu keyingi safar xatoni takrorlamaslikka yordam
            beradi.
          </p>

          {transcripts.length > 0 ? (
            <div className="space-y-3 mb-8">
              {transcripts.map((part) => (
                <details key={part.id} className="card p-0 overflow-hidden">
                  <summary className="cursor-pointer select-none p-4 font-bold text-sm hover:bg-[var(--bg-subtle)]">
                    📄 Transkript — {part.title}
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
  );
}
