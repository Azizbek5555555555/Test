import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getProfile, profileHasPremium } from "@/lib/auth";
import {
  countQuestionsByTestSet,
  getOpenAttempt,
  getTestParts,
  getTestSetBySlug,
} from "@/lib/queries";
import { startAttemptAction } from "@/lib/actions/attempts";
import { Check } from "react-feather";
import { EXAM_SECTION_ORDER } from "@/lib/constants";
import type { SkillSection } from "@/lib/types";
import { Alert } from "@/components/ui/Card";
import { Button, ButtonLink } from "@/components/ui/Button";
import { PageHero } from "@/components/marketing/PageHero";
import { ExamGateHeader, ExamRules, ExamSequence } from "@/components/exam/ExamGate";
import { getT } from "@/i18n/server";
import type { Bi } from "@/i18n";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const exam = await getTestSetBySlug(slug);
  return { title: exam?.title ?? "Exam Full Checking" };
}

const START_ERRORS: Record<string, Bi> = {
  empty: {
    uz: "Bu imtihon hali to'ldirilmagan — savollar qo'shilgach boshlash mumkin bo'ladi.",
    en: "This exam is not complete yet — you can start once the questions are added.",
  },
  start: {
    uz: "Imtihonni boshlab bo'lmadi. Sahifani yangilab, qayta urinib ko'ring.",
    en: "Could not start the exam. Refresh the page and try again.",
  },
};

export default async function ExamIntroPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { slug } = await params;
  const { error: errorKey } = await searchParams;
  const [profile, t] = await Promise.all([getProfile(), getT()]);
  const startError = errorKey && START_ERRORS[errorKey] ? t(START_ERRORS[errorKey]) : undefined;

  if (!profile) {
    redirect(`/login?next=${encodeURIComponent(`/exam-checking/${slug}`)}`);
  }
  if (!profileHasPremium(profile)) {
    redirect("/premium?reason=locked");
  }

  const exam = await getTestSetBySlug(slug);
  if (!exam || exam.category !== "exam_checking" || !exam.published) notFound();

  const parts = await getTestParts(exam.id);
  const counts = await countQuestionsByTestSet([exam.id]);
  const openAttempt = await getOpenAttempt(exam.id, profile.id);

  // Bo'limlar imtihon tartibida va ularning vaqti
  const sections = EXAM_SECTION_ORDER.filter((section) => parts.some((p) => p.section === section));
  const minutes: Partial<Record<SkillSection, number>> = {};
  for (const part of parts) {
    minutes[part.section] = (minutes[part.section] ?? 0) + (part.duration_minutes ?? 0);
  }

  return (
    <div>
      <PageHero eyebrow={t("Imtihon simulyatori", "Exam simulator")} title={exam.title} hand="Real exam. Real result." className="pb-10">
        {exam.description ?? t("Real Multilevel kompyuter imtihoni simulyatsiyasi.", "A real Multilevel computer-based exam simulation.")}{" "}
        <Link href="/exam-checking" className="text-brand-400 hover:text-brand-300">
          ← Exam Full Checking
        </Link>
      </PageHero>

      <section className="border-y border-line bg-ink-900/40">
        <div className="container-page py-12">
          <ExamGateHeader
            title={openAttempt ? t("Tugallanmagan imtihon", "Unfinished exam") : t("Imtihonga tayyormisiz?", "Ready for the exam?")}
            description={
              openAttempt
                ? t("Siz bu imtihonni boshlagansiz. Qoldirgan joyingizdan davom eting.", "You have already started this exam. Continue where you left off.")
                : t(
                    `Imtihon ${sections.length || 4} bo'limdan iborat, jami ${counts[exam.id] ?? 0} ta savol. Tinch joy va ishonchli internet tavsiya etiladi.`,
                    `The exam has ${sections.length || 4} sections and ${counts[exam.id] ?? 0} questions in total. A quiet place and a reliable internet connection are recommended.`,
                  )
            }
            totalMinutes={exam.duration_minutes}
          />

          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <ExamSequence minutes={minutes} sections={sections.length ? sections : undefined} />
            <ExamRules />
          </div>

          {startError ? (
            <div className="mt-6 max-w-xl">
              <Alert tone="danger">{startError}</Alert>
            </div>
          ) : null}

          <div className="mt-8 flex flex-wrap items-center gap-4">
            {parts.length === 0 ? (
              <p className="text-sm font-semibold text-muted">
                {t("Bu imtihon hali tayyor emas. Tez orada qo'shiladi.", "This exam is not ready yet. It will be added soon.")}
              </p>
            ) : (
              <form action={startAttemptAction}>
                <input type="hidden" name="test_set_id" value={exam.id} />
                <Button type="submit" size="lg">
                  {openAttempt ? t("Davom ettirish", "Continue") : t("Imtihonni boshlash", "Start the exam")}
                </Button>
              </form>
            )}
            {openAttempt ? (
              <p className="text-xs text-muted">{t("Yangi urinish boshlash uchun avvalgisini yakunlang.", "Finish the previous attempt to start a new one.")}</p>
            ) : null}
          </div>
        </div>
      </section>

      <section className="container-page grid gap-6 py-14 md:grid-cols-2">
        <div className="card-glass rounded-2xl p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-brand-400">
            {t("Tayyorgarlik ro'yxati", "Preparation checklist")}
          </p>
          <ul className="mt-4 space-y-2.5 text-sm text-muted">
            {[
              t("Naushnik ulangan va ishlayapti", "Headphones are connected and working"),
              t("Mikrofonga ruxsat berilgan (Speaking uchun)", "Microphone access is allowed (for Speaking)"),
              t("Qurilma quvvati yetarli, internet barqaror", "Your device is charged and the internet is stable"),
              t("Atrofda shovqin yo'q", "No noise around you"),
            ].map((line) => (
              <li key={line} className="flex items-center gap-2.5">
                <Check size={15} className="shrink-0 text-success" aria-hidden /> {line}
              </li>
            ))}
          </ul>
        </div>
        <div className="card-glass rounded-2xl p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-brand-400">
            {t("Natija qanday chiqadi?", "How is the result produced?")}
          </p>
          <p className="mt-4 text-sm leading-relaxed text-muted">
            {t(
              "Listening va Reading darhol avtomatik baholanadi. Writing va Speaking javoblaringizni o'qituvchi tekshirib, izoh bilan ball qo'yadi. Shundan keyin yakuniy Overall ball va CEFR daraja profilingizda paydo bo'ladi.",
              "Listening and Reading are marked automatically right away. A teacher reviews your Writing and Speaking answers and scores them with feedback. After that, your final Overall score and CEFR level appear in your profile.",
            )}
          </p>
          <ButtonLink href="/full-mock" variant="secondary" size="sm" className="mt-5">
            {t("Avval bepul mashq qilish", "Practise for free first")}
          </ButtonLink>
        </div>
      </section>
    </div>
  );
}
