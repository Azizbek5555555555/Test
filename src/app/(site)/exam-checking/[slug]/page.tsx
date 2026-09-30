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

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const exam = await getTestSetBySlug(slug);
  return { title: exam?.title ?? "Exam Full Checking" };
}

const START_ERRORS: Record<string, string> = {
  empty: "Bu imtihon hali to'ldirilmagan — savollar qo'shilgach boshlash mumkin bo'ladi.",
  start: "Imtihonni boshlab bo'lmadi. Sahifani yangilab, qayta urinib ko'ring.",
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
  const startError = errorKey ? START_ERRORS[errorKey] : undefined;

  const profile = await getProfile();
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
      <PageHero eyebrow="Imtihon simulyatori" title={exam.title} hand="Real exam. Real result." className="pb-10">
        {exam.description ?? "Real Multilevel kompyuter imtihoni simulyatsiyasi."}{" "}
        <Link href="/exam-checking" className="text-brand-400 hover:text-brand-300">
          ← Exam Full Checking
        </Link>
      </PageHero>

      <section className="border-y border-line bg-ink-900/40">
        <div className="container-page py-12">
          <ExamGateHeader
            title={openAttempt ? "Tugallanmagan imtihon" : "Imtihonga tayyormisiz?"}
            description={
              openAttempt
                ? "Siz bu imtihonni boshlagansiz. Qoldirgan joyingizdan davom eting."
                : `Imtihon ${sections.length || 4} bo'limdan iborat, jami ${counts[exam.id] ?? 0} ta savol. Tinch joy va ishonchli internet tavsiya etiladi.`
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
                Bu imtihon hali tayyor emas. Tez orada qo&apos;shiladi.
              </p>
            ) : (
              <form action={startAttemptAction}>
                <input type="hidden" name="test_set_id" value={exam.id} />
                <Button type="submit" size="lg">
                  {openAttempt ? "Davom ettirish" : "Imtihonni boshlash"}
                </Button>
              </form>
            )}
            {openAttempt ? (
              <p className="text-xs text-muted">Yangi urinish boshlash uchun avvalgisini yakunlang.</p>
            ) : null}
          </div>
        </div>
      </section>

      <section className="container-page grid gap-6 py-14 md:grid-cols-2">
        <div className="card-glass rounded-2xl p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-brand-400">
            Tayyorgarlik ro&apos;yxati
          </p>
          <ul className="mt-4 space-y-2.5 text-sm text-muted">
            {[
              "Naushnik ulangan va ishlayapti",
              "Mikrofonga ruxsat berilgan (Speaking uchun)",
              "Qurilma quvvati yetarli, internet barqaror",
              "Atrofda shovqin yo'q",
            ].map((t) => (
              <li key={t} className="flex items-center gap-2.5">
                <Check size={15} className="shrink-0 text-success" aria-hidden /> {t}
              </li>
            ))}
          </ul>
        </div>
        <div className="card-glass rounded-2xl p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-brand-400">
            Natija qanday chiqadi?
          </p>
          <p className="mt-4 text-sm leading-relaxed text-muted">
            Listening va Reading darhol avtomatik baholanadi. Writing va Speaking javoblaringizni
            o&apos;qituvchi tekshirib, izoh bilan ball qo&apos;yadi. Shundan keyin yakuniy{" "}
            <strong className="text-fg">Overall</strong> ball va{" "}
            <strong className="text-fg">CEFR daraja</strong> profilingizda paydo bo&apos;ladi.
          </p>
          <ButtonLink href="/full-mock" variant="secondary" size="sm" className="mt-5">
            Avval bepul mashq qilish
          </ButtonLink>
        </div>
      </section>
    </div>
  );
}
