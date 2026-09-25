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
import { EXAM_SECTION_ORDER, SECTION_ICON, SECTION_LABEL } from "@/lib/constants";
import { formatDuration } from "@/lib/format";
import { PageHeader, Alert } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button, ButtonLink } from "@/components/ui/Button";

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

  // Bo'limlarni imtihon tartibiga keltiramiz
  const ordered = EXAM_SECTION_ORDER.map((section) =>
    parts.find((p) => p.section === section),
  ).filter((p): p is NonNullable<typeof p> => Boolean(p));

  const rest = parts.filter((p) => !ordered.includes(p));
  const sequence = [...ordered, ...rest];

  return (
    <div className="container-page py-10">
      <Link
        href="/exam-checking"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-fg mb-6"
      >
        ← Exam Full Checking
      </Link>

      <div className="grid lg:grid-cols-[1fr_340px] gap-8 items-start">
        <div>
          <PageHeader
            eyebrow="Premium · Real exam simulation"
            title={exam.title}
            description={exam.description ?? undefined}
          >
            <div className="flex flex-wrap gap-2">
              <Badge tone="premium">⭐ PREMIUM</Badge>
              <Badge tone="info">⏱ {formatDuration(exam.duration_minutes)}</Badge>
              <Badge tone="neutral">❓ {counts[exam.id] ?? 0} ta savol</Badge>
              {exam.level ? <Badge tone="neutral">{exam.level}</Badge> : null}
            </div>
          </PageHeader>

          <h2 className="font-extrabold text-lg mb-4">Imtihon tartibi</h2>

          <ol className="space-y-3">
            {sequence.map((part, i) => (
              <li key={part.id} className="card p-4">
                <div className="flex items-center gap-3">
                  <span
                    className="shrink-0 w-9 h-9 rounded-xl bg-brand-600 text-white
                               grid place-items-center font-bold text-sm"
                    aria-hidden
                  >
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold">
                      {SECTION_ICON[part.section]}{" "}
                      {SECTION_LABEL[part.section]}
                    </p>
                    <p className="text-xs text-muted mt-0.5">
                      {part.title} · ⏱ {formatDuration(part.duration_minutes)}
                    </p>
                  </div>
                  {i < sequence.length - 1 ? (
                    <span className="text-muted shrink-0" aria-hidden>
                      ↓
                    </span>
                  ) : null}
                </div>
              </li>
            ))}
          </ol>

          <div className="mt-8 space-y-4">
            <Alert tone="warning" title="Imtihon qoidalari">
              <ul className="space-y-1.5 mt-1">
                <li>• Bo&apos;limlar ketma-ket ochiladi — orqaga qaytib bo&apos;lmaydi.</li>
                <li>• Listening audiosi faqat <strong>bir marta</strong> ijro etiladi.</li>
                <li>• Vaqt tugaganda imtihon avtomatik yakunlanadi.</li>
                <li>• Sahifani yopsangiz ham javoblaringiz saqlanadi.</li>
              </ul>
            </Alert>

            <Alert tone="info" title="Natija qanday chiqadi?">
              Listening va Reading darhol avtomatik baholanadi. Writing va
              Speaking javoblaringizni o&apos;qituvchi tekshirib, izoh bilan ball
              qo&apos;yadi. Shundan keyin yakuniy <strong>Overall</strong> ball va{" "}
              <strong>CEFR daraja</strong> profilingizda paydo bo&apos;ladi.
            </Alert>
          </div>
        </div>

        {/* ---------------------------------------------- Yon panel */}
        <aside className="lg:sticky lg:top-24 h-fit space-y-4">
          <div className="card p-5">
            <h3 className="font-extrabold text-lg">
              {openAttempt ? "Tugallanmagan imtihon" : "Imtihonni boshlash"}
            </h3>
            <p className="text-sm text-muted mt-2 leading-relaxed">
              {openAttempt
                ? "Siz bu imtihonni boshlagansiz. Qoldirgan joyingizdan davom eting."
                : "Tayyor bo'lsangiz boshlang. Tinch joy va ishonchli internet tavsiya etiladi."}
            </p>

            {startError ? (
              <div className="mt-4">
                <Alert tone="danger">{startError}</Alert>
              </div>
            ) : null}

            {parts.length === 0 ? (
              <p className="mt-4 text-sm font-semibold text-muted">
                ⏳ Bu imtihon hali tayyor emas. Tez orada qo&apos;shiladi.
              </p>
            ) : (
              <form action={startAttemptAction} className="mt-4">
                <input type="hidden" name="test_set_id" value={exam.id} />
                <Button type="submit" size="lg" fullWidth variant="premium">
                  {openAttempt ? "Davom ettirish →" : "🎯 START EXAM"}
                </Button>
              </form>
            )}

            {openAttempt ? (
              <p className="text-xs text-muted mt-3 text-center">
                Yangi urinish boshlash uchun avvalgisini yakunlang.
              </p>
            ) : null}
          </div>

          <div className="card p-5">
            <h3 className="font-bold text-sm mb-3">Tayyorgarlik ro&apos;yxati</h3>
            <ul className="space-y-2 text-sm text-muted">
              <li>🎧 Naushnik ulangan va ishlayapti</li>
              <li>🎙️ Mikrofonga ruxsat berilgan (Speaking uchun)</li>
              <li>🔋 Qurilma quvvati yetarli</li>
              <li>📶 Internet barqaror</li>
              <li>🤫 Atrofda shovqin yo&apos;q</li>
            </ul>
          </div>

          <div className="card p-5">
            <p className="text-sm text-muted leading-relaxed">
              Avval bepul mashq qilmoqchimisiz?
            </p>
            <ButtonLink
              href="/full-mock"
              variant="secondary"
              size="sm"
              fullWidth
              className="mt-3"
            >
              Full Mock testlar
            </ButtonLink>
          </div>
        </aside>
      </div>
    </div>
  );
}
