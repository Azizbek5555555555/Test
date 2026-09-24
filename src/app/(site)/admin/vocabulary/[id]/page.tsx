import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getVocabPackForAdmin } from "@/lib/admin-queries";
import {
  deleteVocabWordAction,
  upsertVocabPackAction,
  upsertVocabWordAction,
} from "@/lib/actions/admin";
import { Badge, AccessBadge } from "@/components/ui/Badge";
import { Alert } from "@/components/ui/Card";
import { AdminForm } from "@/components/admin/AdminForm";
import { Collapsible } from "@/components/admin/Collapsible";
import {
  vocabPackFields,
  vocabWordFields,
} from "@/components/admin/fieldSpecs";
import { ConfirmSubmitButton } from "@/components/admin/ConfirmSubmitButton";

export const metadata: Metadata = {
  title: "So'zlar",
  robots: { index: false, follow: false },
};

export default async function AdminVocabPackPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { pack, words } = await getVocabPackForAdmin(id);

  if (!pack) notFound();

  return (
    <div className="space-y-6">
      <Link
        href="/admin/vocabulary"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-fg"
      >
        ← Barcha to&apos;plamlar
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-2xl" aria-hidden>
              {pack.emoji ?? "📘"}
            </span>
            <h2 className="text-xl font-extrabold">{pack.title}</h2>
            <AccessBadge isPremium={pack.is_premium} unlocked />
            <Badge tone="info">{words.length} ta so&apos;z</Badge>
          </div>
          <p className="text-sm text-muted mt-1 font-mono">/{pack.slug}</p>
        </div>

        <Link
          href={`/vocabulary-battle/play/${pack.slug}`}
          className="rounded-lg border border-line bg-[var(--bg-subtle)]
                     px-3 py-2 text-sm font-semibold hover:border-brand-400 transition-colors"
        >
          🎮 O&apos;ynab ko&apos;rish
        </Link>
      </div>

      <Collapsible title="⚙️ To'plam sozlamalari">
        <AdminForm
          action={upsertVocabPackAction}
          fields={vocabPackFields(pack as unknown as Record<string, unknown>)}
          submitLabel="Saqlash"
        />
      </Collapsible>

      <Collapsible
        title="➕ Yangi so'z qo'shish"
        subtitle="So'z, tarjimasi va 4 ta variant"
        tone="accent"
        defaultOpen={words.length === 0}
      >
        <AdminForm
          action={upsertVocabWordAction}
          fields={vocabWordFields(pack.id)}
          submitLabel="So'zni qo'shish"
          resetOnSuccess
        />
      </Collapsible>

      {words.length === 0 ? (
        <Alert tone="info">
          Bu to&apos;plamda hali so&apos;z yo&apos;q. O&apos;yin ishlashi uchun
          kamida 5–10 ta so&apos;z qo&apos;shing.
        </Alert>
      ) : (
        <section>
          <h3 className="font-bold mb-3">So&apos;zlar</h3>
          <div className="space-y-2">
            {words.map((word, i) => (
              <Collapsible
                key={word.id}
                title={`${i + 1}. ${word.word} — ${word.meaning_uz}`}
                subtitle={`To'g'ri variant: ${word.correct_index} (${
                  word.options?.[word.correct_index] ?? "?"
                })`}
              >
                <div className="space-y-4">
                  <AdminForm
                    action={upsertVocabWordAction}
                    fields={vocabWordFields(
                      pack.id,
                      word as unknown as Record<string, unknown>,
                    )}
                    submitLabel="So'zni saqlash"
                  />

                  <form
                    action={deleteVocabWordAction}
                    className="pt-3 border-t border-line"
                  >
                    <input type="hidden" name="id" value={word.id} />
                    <input type="hidden" name="pack_id" value={pack.id} />
                    <ConfirmSubmitButton
                      message="Bu so'zni o'chirasizmi?"
                      className="text-sm font-semibold text-rose-600 dark:text-rose-400 hover:underline"
                    >
                      🗑 Bu so&apos;zni o&apos;chirish
                    </ConfirmSubmitButton>
                  </form>
                </div>
              </Collapsible>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
