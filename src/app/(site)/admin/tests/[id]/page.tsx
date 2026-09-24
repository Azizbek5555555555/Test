import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTestSetForAdmin } from "@/lib/admin-queries";
import {
  deleteQuestionAction,
  deleteTestPartAction,
  upsertQuestionAction,
  upsertTestPartAction,
  upsertTestSetAction,
} from "@/lib/actions/admin";
import { SECTION_ICON, SECTION_LABEL } from "@/lib/constants";
import { Badge, AccessBadge } from "@/components/ui/Badge";
import { Alert } from "@/components/ui/Card";
import { AdminForm } from "@/components/admin/AdminForm";
import { Collapsible } from "@/components/admin/Collapsible";
import {
  questionFields,
  testPartFields,
  testSetFields,
} from "@/components/admin/fieldSpecs";
import { ConfirmSubmitButton } from "@/components/admin/ConfirmSubmitButton";

export const metadata: Metadata = {
  title: "Testni tahrirlash",
  robots: { index: false, follow: false },
};

export default async function AdminTestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { testSet, parts, questions } = await getTestSetForAdmin(id);

  if (!testSet) notFound();

  const questionsByPart = new Map<string, typeof questions>();
  for (const part of parts) questionsByPart.set(part.id, []);
  for (const question of questions) {
    questionsByPart.get(question.part_id)?.push(question);
  }

  const serviceKeyMissing = questions.length === 0 && parts.length > 0;

  return (
    <div className="space-y-6">
      <Link
        href="/admin/tests"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-fg"
      >
        ← Barcha testlar
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-extrabold">{testSet.title}</h2>
            <AccessBadge isPremium={testSet.is_premium} unlocked />
            {!testSet.published ? <Badge tone="warning">Yashirin</Badge> : null}
          </div>
          <p className="text-sm text-muted mt-1 font-mono">/{testSet.slug}</p>
        </div>

        <Link
          href={
            testSet.category === "exam_checking"
              ? `/exam-checking/${testSet.slug}`
              : `/tests/${testSet.slug}`
          }
          className="rounded-lg border border-line bg-[var(--bg-subtle)]
                     px-3 py-2 text-sm font-semibold hover:border-brand-400 transition-colors"
        >
          👁 Saytda ko&apos;rish
        </Link>
      </div>

      {serviceKeyMissing ? (
        <Alert tone="warning" title="Savollar ko'rinmayapti">
          Agar bu testda savollar bo&apos;lsa-yu, ular ko&apos;rinmasa —{" "}
          <code>SUPABASE_SERVICE_ROLE_KEY</code> sozlanmagan bo&apos;lishi
          mumkin. To&apos;g&apos;ri javoblarni ko&apos;rsatish uchun shu kalit
          kerak (SETUP.md).
        </Alert>
      ) : null}

      {/* ------------------------------------------- Test sozlamalari */}
      <Collapsible
        title="⚙️ Test sozlamalari"
        subtitle="Sarlavha, turkum, Premium holati, davomiyligi"
      >
        <AdminForm
          action={upsertTestSetAction}
          fields={testSetFields(testSet as unknown as Record<string, unknown>)}
          submitLabel="Sozlamalarni saqlash"
        />
      </Collapsible>

      {/* ------------------------------------------- Yangi bo'lim */}
      <Collapsible
        title="➕ Yangi bo'lim qo'shish"
        subtitle="Reading / Listening / Writing / Speaking"
        tone="accent"
      >
        <AdminForm
          action={upsertTestPartAction}
          fields={testPartFields(testSet.id)}
          submitLabel="Bo'limni qo'shish"
          resetOnSuccess
        />
      </Collapsible>

      {/* ------------------------------------------- Bo'limlar */}
      {parts.length === 0 ? (
        <Alert tone="info">
          Bu testda hali bo&apos;lim yo&apos;q. Yuqoridagi forma orqali birinchi
          bo&apos;limni qo&apos;shing.
        </Alert>
      ) : (
        <div className="space-y-4">
          {parts.map((part) => {
            const partQuestions = questionsByPart.get(part.id) ?? [];

            return (
              <div key={part.id} className="card p-0 overflow-hidden">
                <div className="p-4 bg-[var(--bg-subtle)] border-b border-line">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span aria-hidden>{SECTION_ICON[part.section]}</span>
                        <h3 className="font-bold">{part.title}</h3>
                        <Badge tone="neutral">
                          {SECTION_LABEL[part.section]}
                        </Badge>
                        <Badge tone="info">
                          {partQuestions.length} ta savol
                        </Badge>
                      </div>
                      <p className="text-xs text-muted mt-1">
                        {part.duration_minutes} daqiqa
                        {part.audio_url ? " · 🎧 audio bor" : ""}
                        {part.passage ? " · 📖 matn bor" : ""}
                      </p>
                    </div>

                    <form action={deleteTestPartAction}>
                      <input type="hidden" name="id" value={part.id} />
                      <input
                        type="hidden"
                        name="test_set_id"
                        value={testSet.id}
                      />
                      <ConfirmSubmitButton
                        message="Bu bo'limni o'chirasizmi? Ichidagi barcha savollar ham o'chadi."
                        className="rounded-lg border border-rose-200 dark:border-rose-800
                                   px-3 py-1.5 text-sm font-semibold text-rose-600 dark:text-rose-400
                                   hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                        title="Bo'limni o'chirish"
                      >
                        🗑 Bo&apos;limni o&apos;chirish
                      </ConfirmSubmitButton>
                    </form>
                  </div>
                </div>

                <div className="p-4 space-y-3">
                  <Collapsible
                    title="✏️ Bo'limni tahrirlash"
                    subtitle="Matn, audio, transkript, ko'rsatma"
                  >
                    <AdminForm
                      action={upsertTestPartAction}
                      fields={testPartFields(
                        testSet.id,
                        part as unknown as Record<string, unknown>,
                      )}
                      submitLabel="Bo'limni saqlash"
                    />
                  </Collapsible>

                  <Collapsible
                    title="➕ Savol qo'shish"
                    subtitle="MCQ · True/False/NG · Gap filling · Matching · Essay · Speaking"
                    tone="accent"
                  >
                    <AdminForm
                      action={upsertQuestionAction}
                      fields={questionFields(part.id, testSet.id)}
                      submitLabel="Savolni qo'shish"
                      resetOnSuccess
                    />
                  </Collapsible>

                  {partQuestions.length > 0 ? (
                    <div className="space-y-2 pt-1">
                      {partQuestions.map((question, i) => (
                        <Collapsible
                          key={question.id}
                          title={`${i + 1}. ${truncate(question.prompt, 70)}`}
                          subtitle={`${question.kind} · ${question.points} ball · javob: ${formatAnswer(question.correct_answer)}`}
                        >
                          <div className="space-y-4">
                            <AdminForm
                              action={upsertQuestionAction}
                              fields={questionFields(
                                part.id,
                                testSet.id,
                                question as unknown as Record<string, unknown>,
                              )}
                              submitLabel="Savolni saqlash"
                            />

                            <form
                              action={deleteQuestionAction}
                              className="pt-3 border-t border-line"
                            >
                              <input
                                type="hidden"
                                name="id"
                                value={question.id}
                              />
                              <input
                                type="hidden"
                                name="test_set_id"
                                value={testSet.id}
                              />
                              <ConfirmSubmitButton
                                message="Bu savolni o'chirasizmi?"
                                className="text-sm font-semibold text-rose-600 dark:text-rose-400 hover:underline"
                              >
                                🗑 Bu savolni o&apos;chirish
                              </ConfirmSubmitButton>
                            </form>
                          </div>
                        </Collapsible>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function truncate(text: string, length: number): string {
  return text.length > length ? `${text.slice(0, length)}…` : text;
}

function formatAnswer(value: unknown): string {
  if (value == null) return "qo'lda tekshiriladi";
  if (typeof value === "string") return value || "—";
  return JSON.stringify(value);
}
