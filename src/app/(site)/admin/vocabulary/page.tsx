import type { Metadata } from "next";
import Link from "next/link";
import { listAllVocabPacks } from "@/lib/admin-queries";
import {
  upsertVocabPackAction,
  deleteVocabPackAction,
} from "@/lib/actions/admin";
import { Badge, AccessBadge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/Card";
import { AdminForm } from "@/components/admin/AdminForm";
import { Collapsible } from "@/components/admin/Collapsible";
import { vocabPackFields } from "@/components/admin/fieldSpecs";
import { ConfirmSubmitButton } from "@/components/admin/ConfirmSubmitButton";

export const metadata: Metadata = {
  title: "Vocabulary",
  robots: { index: false, follow: false },
};

export default async function AdminVocabularyPage() {
  const packs = await listAllVocabPacks();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-extrabold">Vocabulary to&apos;plamlari</h2>
        <p className="text-sm text-muted mt-0.5">
          Vocabulary Battle o&apos;yini uchun so&apos;z to&apos;plamlari
        </p>
      </div>

      <Collapsible
        title="➕ Yangi to'plam qo'shish"
        subtitle="Keyin ichiga so'zlarni qo'shasiz"
        tone="accent"
      >
        <AdminForm
          action={upsertVocabPackAction}
          fields={vocabPackFields()}
          submitLabel="To'plamni yaratish"
          resetOnSuccess
        />
      </Collapsible>

      {packs.length === 0 ? (
        <EmptyState
          icon="📘"
          title="To'plamlar yo'q"
          description="Yuqoridagi forma orqali birinchi to'plamni yarating."
        />
      ) : (
        <div className="space-y-2">
          {packs.map((pack) => (
            <div
              key={pack.id}
              className="card p-4 flex flex-wrap items-center gap-3"
            >
              <span className="text-2xl" aria-hidden>
                {pack.emoji ?? "📘"}
              </span>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-bold truncate">{pack.title}</p>
                  <AccessBadge isPremium={pack.is_premium} unlocked />
                  {!pack.published ? (
                    <Badge tone="warning">Yashirin</Badge>
                  ) : null}
                  {pack.level ? <Badge tone="neutral">{pack.level}</Badge> : null}
                </div>
                <p className="text-xs text-muted mt-1 font-mono">/{pack.slug}</p>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href={`/admin/vocabulary/${pack.id}`}
                  className="rounded-lg border border-line bg-[var(--bg-subtle)]
                             px-3 py-1.5 text-sm font-semibold hover:border-brand-400 transition-colors"
                >
                  So&apos;zlar →
                </Link>
                <form action={deleteVocabPackAction}>
                  <input type="hidden" name="id" value={pack.id} />
                  <ConfirmSubmitButton
                    message="Bu to'plamni va ichidagi barcha so'zlarni o'chirasizmi?"
                    className="rounded-lg border border-rose-200 dark:border-rose-800
                               px-3 py-1.5 text-sm font-semibold text-rose-600 dark:text-rose-400
                               hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                    title="O'chirish"
                  >
                    🗑
                  </ConfirmSubmitButton>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
