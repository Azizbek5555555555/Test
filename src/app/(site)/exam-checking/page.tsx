import type { Metadata } from "next";
import { getProfile, profileHasPremium } from "@/lib/auth";
import { getTestSets } from "@/lib/queries";
import { getTestOutlines } from "@/lib/test-outlines";
import type { Attempt } from "@/lib/types";
import { EmptyState } from "@/components/ui/Card";
import { ButtonLink } from "@/components/ui/Button";
import { CertReveal } from "@/components/story/CertReveal";
import { TestSetCard } from "@/components/test/TestSetCard";
import { FeedbackCards, ResultCard } from "@/components/test/ResultCard";
import { ExamGateHeader, ExamRules, ExamSequence } from "@/components/exam/ExamGate";
import { Reveal } from "@/components/motion/Reveal";
import { ScoringGuide } from "@/components/exam/ScoringGuide";
import { getT } from "@/i18n/server";
import type { T } from "@/i18n";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return {
    title: "Exam Full Checking",
    description: t(
      "Real Multilevel kompyuter imtihoni simulyatsiyasi: Listening → Reading → Writing → Speaking va to'liq natija.",
      "A real Multilevel computer-based exam simulation: Listening → Reading → Writing → Speaking with a full result.",
    ),
  };
}

/** "Natija namunasi" bo'limi uchun ko'rgazmali (haqiqiy bo'lmagan) natija */
const sampleAttempt = (t: T): Attempt => ({
  id: "namuna",
  user_id: "namuna",
  test_set_id: "namuna",
  mode: "exam_checking",
  status: "graded",
  current_part_index: 0,
  answers: {},
  section_scores: { listening: 62, reading: 68, writing: 58, speaking: 61 },
  section_breakdown: {},
  overall_score: 62,
  cefr_level: "B2",
  teacher_feedback: {
    writing: t(
      "Esselaringiz izchil va mantiqiy. 2-paragrafda bir nechta uzun, bo'linmagan gaplar bor. C1 ga chiqish uchun murakkab ergash gaplarni ko'proq ishlating.",
      "Your essays are coherent and logical. Paragraph 2 has a few long run-on sentences. To reach C1, use more complex subordinate clauses.",
    ),
    speaking: t(
      "Talaffuz aniq. 3-qismda kichik to'xtalishlar bor. Ravonlikni saqlash uchun 1 daqiqalik taymer bilan javob berishni mashq qiling.",
      "Clear pronunciation. There are small hesitations in Part 3. Practise answering with a 1-minute timer to keep your fluency.",
    ),
  },
  needs_manual_check: false,
  graded_by: null,
  graded_at: null,
  started_at: "2026-01-01T00:00:00.000Z",
  submitted_at: "2026-01-01T02:20:00.000Z",
  expires_at: null,
});

export default async function ExamCheckingPage() {
  const [profile, exams, t] = await Promise.all([
    getProfile(),
    getTestSets({ category: "exam_checking" }),
    getT(),
  ]);
  const sample = sampleAttempt(t);

  const unlocked = profileHasPremium(profile);
  const outlines = await getTestOutlines(exams.map((e) => e.id));
  const first = exams[0];
  const firstOutline = first ? outlines[first.id] : undefined;

  const startHref = !unlocked
    ? "/premium?reason=locked"
    : exams.length === 1 && first
      ? `/exam-checking/${first.slug}`
      : "#imtihonlar";

  return (
    <div>
      {/* 3D CEFR sertifikati: skroll bilan aylanadi, atrofida oltin halqalar */}
      <CertReveal
        eyebrow={t("Exam Full Checking · imtihon simulyatori", "Exam Full Checking · exam simulator")}
        title={t("Natijangiz CEFR darajasida", "Your result as a CEFR level")}
        highlight="CEFR"
        hand="Real exam. Real level."
        actions={
          <>
            <ButtonLink href={startHref} size="lg" variant={unlocked ? "primary" : "premium"}>
              {unlocked ? t("Imtihonni boshlash", "Start the exam") : t("Premium bilan ochish", "Unlock with Premium")}
            </ButtonLink>
            <ButtonLink href="#natija" size="lg" variant="secondary">
              {t("Natija namunasi", "Sample result")}
            </ButtonLink>
          </>
        }
      >
        {t(
          "Uch bosqichli imtihon muhiti: tayyorgarlik va vaqt rejasi, real kompyuter imtihonidek ishlash oynasi va har bir ko'nikma bo'yicha batafsil natija — umumiy ball va CEFR darajasi bilan.",
          "A three-stage exam environment: preparation and a time plan, a real computer-based exam window, and a detailed result for every skill — with an overall score and CEFR level.",
        )}
      </CertReveal>

      {/* ------------------------------------------------ 1-bosqich: kirish */}
      <section className="border-y border-line bg-ink-900/40">
        <div className="container-page py-12">
          <Reveal>
            <ExamGateHeader
              title="Exam Full Checking"
              description={t(
                "Multilevel imtihonini xuddi real kompyuter imtihonidek topshiring — Listening va Reading darhol baholanadi, Writing va Speaking'ni o'qituvchi tekshiradi.",
                "Take the Multilevel exam just like the real computer-based exam — Listening and Reading are marked instantly, and a teacher reviews Writing and Speaking.",
              )}
              totalMinutes={first?.duration_minutes}
            />
          </Reveal>
          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <Reveal delay={60}>
              <ExamSequence minutes={firstOutline?.minutes} />
            </Reveal>
            <Reveal delay={120}>
              <ExamRules />
            </Reveal>
          </div>
          <div className="mt-8">
            <ButtonLink href={startHref} size="lg" variant={unlocked ? "primary" : "premium"}>
              {unlocked ? t("Imtihonni boshlash", "Start the exam") : t("Premium bilan ochish", "Unlock with Premium")}
            </ButtonLink>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------ Rasmiy baholash tizimi */}
      <div className="container-page pt-16">
        <ScoringGuide />
      </div>

      {/* ------------------------------------------------ Imtihonlar */}
      <section id="imtihonlar" className="container-page scroll-mt-28 py-16">
        <Reveal>
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-brand-400">
            {t("2-bosqich: imtihon", "Stage 2: the exam")}
          </p>
          <h2 className="display-title mt-1 text-[32px]">{t("Mavjud imtihonlar", "Available exams")}</h2>
        </Reveal>
        {exams.length === 0 ? (
          <div className="mt-6">
            <EmptyState
              icon="🎯"
              title={t("Imtihonlar hali qo'shilmagan", "No exams yet")}
              description={t("Tez orada yangi imtihonlar qo'shiladi.", "New exams are coming soon.")}
            />
          </div>
        ) : (
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {exams.map((exam, i) => (
              <Reveal key={exam.id} delay={(i % 3) * 70}>
                <TestSetCard
                  testSet={exam}
                  questionCount={outlines[exam.id]?.questions}
                  unlocked={unlocked}
                  href={`/exam-checking/${exam.slug}`}
                  sections={outlines[exam.id]?.sections}
                />
              </Reveal>
            ))}
          </div>
        )}
      </section>

      {/* ------------------------------------------------ 3-bosqich: natija namunasi */}
      <section id="natija" className="scroll-mt-20 border-t border-line bg-gradient-to-b from-[var(--tint-top,#0f2440)] to-ink-950">
        <div className="container-page py-16">
          <Reveal>
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-success">
              {t("3-bosqich: batafsil natija", "Stage 3: detailed result")}
            </p>
            <h2 className="display-title mt-1 text-[32px]">{t("Natija qanday ko'rinadi", "What the result looks like")}</h2>
            <p className="mt-2 text-sm text-muted">{t("Quyidagi natija — namuna (haqiqiy o'quvchi natijasi emas).", "The result below is a sample (not a real learner's result).")}</p>
          </Reveal>
          <div className="mt-8 grid items-start gap-8 lg:grid-cols-[440px_1fr] lg:gap-10">
            <Reveal>
              <ResultCard attempt={sample} testTitle={t("Namuna imtihon", "Sample exam")} />
            </Reveal>
            <Reveal delay={100}>
              <FeedbackCards attempt={sample} />
            </Reveal>
          </div>
        </div>
      </section>
    </div>
  );
}
