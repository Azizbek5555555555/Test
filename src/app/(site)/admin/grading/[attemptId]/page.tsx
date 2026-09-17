import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getGradingDetail, getSpeakingAudioUrl } from "@/lib/admin-queries";
import { SECTION_LABEL } from "@/lib/constants";
import { countWords, formatDateTime } from "@/lib/format";
import type { SkillSection } from "@/lib/types";
import { Badge, CefrBadge } from "@/components/ui/Badge";
import { Alert } from "@/components/ui/Card";
import { GradingForm } from "@/components/admin/GradingForm";

export const metadata: Metadata = {
  title: "Ishni tekshirish",
  robots: { index: false, follow: false },
};

export default async function GradingDetailPage({
  params,
}: {
  params: Promise<{ attemptId: string }>;
}) {
  const { attemptId } = await params;
  const detail = await getGradingDetail(attemptId);

  if (!detail.attempt) notFound();

  const { attempt, student, testTitle, manualQuestions, autoScores } = detail;

  const writingQuestions = manualQuestions.filter((q) => q.kind === "essay");
  const speakingQuestions = manualQuestions.filter(
    (q) => q.kind === "speaking_prompt",
  );

  // Audio uchun imzolangan havolalar
  const audioUrls = new Map<string, string>();
  for (const question of speakingQuestions) {
    if (question.audioPath) {
      const url = await getSpeakingAudioUrl(question.audioPath);
      if (url) audioUrls.set(question.id, url);
    }
  }

  const feedback = attempt.teacher_feedback ?? {};

  return (
    <div className="space-y-6">
      <Link
        href="/admin/grading"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-fg"
      >
        ← Tekshirish navbati
      </Link>

      {/* ------------------------------------------------ Sarlavha */}
      <div className="card p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-extrabold">
              {student?.full_name ?? "Ismsiz"}
            </h2>
            <p className="text-sm text-muted">{student?.email}</p>
            <p className="text-sm mt-1.5">{testTitle}</p>
            <p className="text-xs text-muted mt-1">
              Topshirilgan: {formatDateTime(attempt.submitted_at)}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {attempt.mode === "exam_checking" ? (
              <Badge tone="premium">🎯 Exam Full Checking</Badge>
            ) : (
              <Badge tone="neutral">Mock</Badge>
            )}
            {attempt.status === "graded" ? (
              <Badge tone="success">Baholangan</Badge>
            ) : (
              <Badge tone="warning">Tekshiruvda</Badge>
            )}
            {attempt.cefr_level ? (
              <CefrBadge level={attempt.cefr_level} />
            ) : null}
          </div>
        </div>

        {/* Avtomatik ballar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
          {(["listening", "reading", "writing", "speaking"] as SkillSection[]).map(
            (section) => (
              <div
                key={section}
                className="rounded-xl border border-line bg-[var(--bg-subtle)] p-3 text-center"
              >
                <p className="text-xs text-muted font-semibold">
                  {SECTION_LABEL[section]}
                </p>
                <p className="text-xl font-extrabold tabular-nums mt-0.5">
                  {autoScores[section] ?? "—"}
                </p>
              </div>
            ),
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_380px] gap-6 items-start">
        {/* -------------------------------------------- Javoblar */}
        <div className="space-y-5">
          {manualQuestions.length === 0 ? (
            <Alert tone="info">
              Bu urinishda qo&apos;lda tekshiriladigan savol yo&apos;q.
            </Alert>
          ) : null}

          {writingQuestions.length > 0 ? (
            <section>
              <h3 className="font-extrabold text-lg mb-3">✍️ Writing javoblari</h3>
              <div className="space-y-4">
                {writingQuestions.map((question, i) => (
                  <div key={question.id} className="card p-5">
                    <p className="text-xs font-bold text-muted uppercase tracking-wide">
                      Task {i + 1} · {question.partTitle}
                    </p>
                    <p className="font-semibold mt-1.5 leading-relaxed">
                      {question.prompt}
                    </p>

                    <div className="mt-4 rounded-xl border border-line bg-[var(--bg-subtle)] p-4">
                      {question.answerText ? (
                        <>
                          <p className="whitespace-pre-wrap leading-relaxed text-[15px]">
                            {question.answerText}
                          </p>
                          <p className="text-xs text-muted mt-3 pt-3 border-t border-line tabular-nums">
                            {countWords(question.answerText)} so&apos;z
                          </p>
                        </>
                      ) : (
                        <p className="text-sm text-muted italic">
                          Javob yozilmagan.
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {speakingQuestions.length > 0 ? (
            <section>
              <h3 className="font-extrabold text-lg mb-3">
                🎙️ Speaking javoblari
              </h3>
              <div className="space-y-4">
                {speakingQuestions.map((question, i) => {
                  const url = audioUrls.get(question.id);
                  return (
                    <div key={question.id} className="card p-5">
                      <p className="text-xs font-bold text-muted uppercase tracking-wide">
                        Part {i + 1} · {question.partTitle}
                      </p>
                      <p className="font-semibold mt-1.5 leading-relaxed">
                        {question.prompt}
                      </p>

                      {url ? (
                        <audio
                          src={url}
                          controls
                          preload="none"
                          className="w-full mt-4"
                        />
                      ) : question.audioPath ? (
                        <p className="text-sm text-amber-700 dark:text-amber-400 mt-4">
                          ⚠️ Audio mavjud, lekin havolani yaratib bo&apos;lmadi
                          (SUPABASE_SERVICE_ROLE_KEY yoki &quot;speaking&quot;
                          bucket tekshiring).
                        </p>
                      ) : (
                        <p className="text-sm text-muted mt-4 italic">
                          Audio yozilmagan.
                        </p>
                      )}

                      {question.answerText ? (
                        <div className="mt-4 rounded-xl border border-line bg-[var(--bg-subtle)] p-4">
                          <p className="text-xs font-bold text-muted mb-1.5">
                            Matn ko&apos;rinishidagi javob
                          </p>
                          <p className="whitespace-pre-wrap leading-relaxed text-[15px]">
                            {question.answerText}
                          </p>
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </section>
          ) : null}
        </div>

        {/* -------------------------------------------- Baholash formasi */}
        <aside className="lg:sticky lg:top-24 h-fit card p-5">
          <h3 className="font-extrabold text-lg mb-4">Baholash</h3>
          <GradingForm
            attemptId={attempt.id}
            hasWriting={writingQuestions.length > 0}
            hasSpeaking={speakingQuestions.length > 0}
            defaultWriting={autoScores.writing ?? null}
            defaultSpeaking={autoScores.speaking ?? null}
            defaultWritingNote={feedback.writing ?? ""}
            defaultSpeakingNote={feedback.speaking ?? ""}
          />
        </aside>
      </div>
    </div>
  );
}
