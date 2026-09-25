import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getProfile } from "@/lib/auth";
import {
  getAttempt,
  getQuestionsForParts,
  getTestParts,
  getTestSetById,
} from "@/lib/queries";
import {
  attemptMinutesLeft,
  finalizeAttempt,
  isAttemptTimeOver,
} from "@/lib/attempt-time";
import type { PublicQuestion } from "@/lib/types";
import { TestPlayer } from "@/components/test/TestPlayer";

export const metadata: Metadata = {
  title: "Test",
  robots: { index: false, follow: false },
};

export default async function TestRunnerPage({
  params,
}: {
  params: Promise<{ attemptId: string }>;
}) {
  const { attemptId } = await params;

  const profile = await getProfile();
  if (!profile) {
    redirect(`/login?next=${encodeURIComponent(`/test/${attemptId}`)}`);
  }

  const attempt = await getAttempt(attemptId);
  if (!attempt || attempt.user_id !== profile.id) notFound();

  // Yakunlangan bo'lsa — natijalar sahifasiga
  if (attempt.status !== "in_progress") {
    redirect(`/results/${attempt.id}`);
  }

  // Vaqt tugagan bo'lsa — saqlangan javoblar bilan yakunlab, natijaga o'tamiz.
  // (Yakunlab bo'lmasa, pleyer 1 daqiqa bilan ochiladi va o'zi yakunlaydi.)
  if (
    isAttemptTimeOver(attempt.expires_at) &&
    (await finalizeAttempt(attempt.id))
  ) {
    redirect(`/results/${attempt.id}`);
  }

  const testSet = await getTestSetById(attempt.test_set_id);
  if (!testSet) notFound();

  // Exam Full Checking o'zining alohida sahifasida ishlaydi
  if (testSet.category === "exam_checking") {
    redirect(`/exam/${attempt.id}`);
  }

  const parts = await getTestParts(testSet.id);
  const questions = await getQuestionsForParts(parts.map((p) => p.id));

  const questionsByPart: Record<string, PublicQuestion[]> = {};
  for (const part of parts) questionsByPart[part.id] = [];
  for (const question of questions) {
    questionsByPart[question.part_id]?.push(question);
  }

  // Qolgan vaqtni hisoblaymiz
  const minutesLeft = attemptMinutesLeft(
    attempt.expires_at,
    testSet.duration_minutes,
  );

  return (
    <TestPlayer
      attemptId={attempt.id}
      userId={profile.id}
      testTitle={testSet.title}
      parts={parts}
      questionsByPart={questionsByPart}
      initialAnswers={attempt.answers ?? {}}
      initialPartIndex={attempt.current_part_index ?? 0}
      sequential={false}
      totalMinutes={minutesLeft}
      resultHref={`/results/${attempt.id}`}
      singlePlayAudio={false}
    />
  );
}
