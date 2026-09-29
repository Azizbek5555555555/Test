import type { Metadata } from "next";
import { getProfile, profileHasPremium } from "@/lib/auth";
import { getTestSets } from "@/lib/queries";
import { getTestOutlines } from "@/lib/test-outlines";
import type { Attempt } from "@/lib/types";
import { EmptyState } from "@/components/ui/Card";
import { ButtonLink } from "@/components/ui/Button";
import { PageHero } from "@/components/marketing/PageHero";
import { TestSetCard } from "@/components/test/TestSetCard";
import { FeedbackCards, ResultCard } from "@/components/test/ResultCard";
import { ExamGateHeader, ExamRules, ExamSequence } from "@/components/exam/ExamGate";
import { Reveal } from "@/components/motion/Reveal";

export const metadata: Metadata = {
  title: "Exam Full Checking",
  description:
    "Real Multilevel kompyuter imtihoni simulyatsiyasi: Listening → Reading → Writing → Speaking va to'liq natija.",
};

/** "Natija namunasi" bo'limi uchun ko'rgazmali (haqiqiy bo'lmagan) natija */
const SAMPLE_ATTEMPT: Attempt = {
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
    writing:
      "Esselaringiz izchil va mantiqiy. 2-paragrafda bir nechta uzun, bo'linmagan gaplar bor. C1 ga chiqish uchun murakkab ergash gaplarni ko'proq ishlating.",
    speaking:
      "Talaffuz aniq. 3-qismda kichik to'xtalishlar bor. Ravonlikni saqlash uchun 1 daqiqalik taymer bilan javob berishni mashq qiling.",
  },
  needs_manual_check: false,
  graded_by: null,
  graded_at: null,
  started_at: "2026-01-01T00:00:00.000Z",
  submitted_at: "2026-01-01T02:20:00.000Z",
  expires_at: null,
};

export default async function ExamCheckingPage() {
  const [profile, exams] = await Promise.all([
    getProfile(),
    getTestSets({ category: "exam_checking" }),
  ]);

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
      <PageHero eyebrow="Imtihon simulyatori" title="Bosqichma-bosqich natija tizimi">
        Uch bosqichli imtihon muhiti: tayyorgarlik va vaqt rejasi, real kompyuter
        imtihonidek ishlash oynasi va har bir ko&apos;nikma bo&apos;yicha batafsil natija.
      </PageHero>

      {/* ------------------------------------------------ 1-bosqich: kirish */}
      <section className="border-y border-line bg-ink-900/40">
        <div className="container-page py-12">
          <Reveal>
            <ExamGateHeader
              title="Exam Full Checking"
              description="Multilevel imtihonini xuddi real kompyuter imtihonidek topshiring — Listening va Reading darhol baholanadi, Writing va Speaking'ni o'qituvchi tekshiradi."
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
              {unlocked ? "Imtihonni boshlash" : "Premium bilan ochish"}
            </ButtonLink>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------ Imtihonlar */}
      <section id="imtihonlar" className="container-page scroll-mt-28 py-16">
        <Reveal>
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-brand-400">
            2-bosqich: imtihon
          </p>
          <h2 className="display-title mt-1 text-[32px]">Mavjud imtihonlar</h2>
        </Reveal>
        {exams.length === 0 ? (
          <div className="mt-6">
            <EmptyState
              icon="🎯"
              title="Imtihonlar hali qo'shilmagan"
              description="Admin panel orqali 'Exam Checking' turkumida imtihon yarating."
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
      <section className="border-t border-line bg-gradient-to-b from-[#16213a] to-ink-950">
        <div className="container-page py-16">
          <Reveal>
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-success">
              3-bosqich: batafsil natija
            </p>
            <h2 className="display-title mt-1 text-[32px]">Natija qanday ko&apos;rinadi</h2>
            <p className="mt-2 text-sm text-muted">Quyidagi natija — namuna (haqiqiy o&apos;quvchi natijasi emas).</p>
          </Reveal>
          <div className="mt-8 grid items-start gap-8 lg:grid-cols-[440px_1fr] lg:gap-10">
            <Reveal>
              <ResultCard attempt={SAMPLE_ATTEMPT} testTitle="Namuna imtihon" />
            </Reveal>
            <Reveal delay={100}>
              <FeedbackCards attempt={SAMPLE_ATTEMPT} />
            </Reveal>
          </div>
        </div>
      </section>
    </div>
  );
}
