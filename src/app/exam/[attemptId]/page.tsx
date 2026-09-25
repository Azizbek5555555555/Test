import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getProfile, profileHasPremium } from "@/lib/auth";
import {
  getAttempt,
  getQuestionsForParts,
  getTestParts,
  getTestSetById,
} from "@/lib/queries";
import { EXAM_SECTION_ORDER } from "@/lib/constants";
import {
  attemptMinutesLeft,
  finalizeAttempt,
  isAttemptTimeOver,
} from "@/lib/attempt-time";
import type { PublicQuestion, TestPart } from "@/lib/types";
import { TestPlayer } from "@/components/test/TestPlayer";

export const metadata: Metadata = {
  title: "Multilevel Exam",
  robots: { index: false, follow: false },
};

export default async function ExamRunnerPage({
  params,
}: {
  params: Promise<{ attemptId: string }>;
}) {
  const { attemptId } = await params;

  const profile = await getProfile();
  if (!profile) {
    redirect(`/login?next=${encodeURIComponent(`/exam/${attemptId}`)}`);
  }
  if (!profileHasPremium(profile)) {
    redirect("/premium?reason=locked");
  }

  const attempt = await getAttempt(attemptId);
  if (!attempt || attempt.user_id !== profile.id) notFound();

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

  const rawParts = await getTestParts(testSet.id);

  // Hujjatning 11-bo'limi: Listening → Reading → Writing → Speaking
  const ordered: TestPart[] = [];
  for (const section of EXAM_SECTION_ORDER) {
    for (const part of rawParts) {
      if (part.section === section) ordered.push(part);
    }
  }
  for (const part of rawParts) {
    if (!ordered.includes(part)) ordered.push(part);
  }

  const questions = await getQuestionsForParts(ordered.map((p) => p.id));

  const questionsByPart: Record<string, PublicQuestion[]> = {};
  for (const part of ordered) questionsByPart[part.id] = [];
  for (const question of questions) {
    questionsByPart[question.part_id]?.push(question);
  }

  const minutesLeft = attemptMinutesLeft(
    attempt.expires_at,
    testSet.duration_minutes,
  );

  return (
    <TestPlayer
      attemptId={attempt.id}
      userId={profile.id}
      testTitle={`${testSet.title} — Multilevel Exam`}
      parts={ordered}
      questionsByPart={questionsByPart}
      initialAnswers={attempt.answers ?? {}}
      initialPartIndex={attempt.current_part_index ?? 0}
      sequential
      totalMinutes={minutesLeft}
      resultHref={`/results/${attempt.id}`}
      singlePlayAudio
    />
  );
}
