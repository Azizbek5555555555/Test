import type { Metadata } from "next";
import Link from "next/link";
import { listAllArticles } from "@/lib/admin-queries";
import { upsertArticleAction, deleteArticleAction } from "@/lib/actions/admin";
import { topicMeta } from "@/lib/constants";
import { Badge, AccessBadge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/Card";
import { AdminForm } from "@/components/admin/AdminForm";
import { Collapsible } from "@/components/admin/Collapsible";
import { articleFields } from "@/components/admin/fieldSpecs";
import { ConfirmSubmitButton } from "@/components/admin/ConfirmSubmitButton";

export const metadata: Metadata = {
  title: "Maqolalar",
  robots: { index: false, follow: false },
};

export default async function AdminArticlesPage() {
  const articles = await listAllArticles();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-extrabold">Maqolalar</h2>
        <p className="text-sm text-muted mt-0.5">
          Boost Your General English → Articles bo&apos;limidagi maqolalar
        </p>
      </div>

      <Collapsible
        title="➕ Yangi maqola qo'shish"
        subtitle="Matn, yangi so'zlar va Reading savollari"
        tone="accent"
      >
        <AdminForm
          action={upsertArticleAction}
          fields={articleFields()}
          submitLabel="Maqolani yaratish"
          resetOnSuccess
        />
      </Collapsible>

      {articles.length === 0 ? (
        <EmptyState
          icon="📰"
          title="Maqolalar yo'q"
          description="Yuqoridagi forma orqali birinchi maqolani qo'shing."
        />
      ) : (
        <div className="space-y-2">
          {articles.map((article) => {
            const meta = topicMeta(article.topic);
            return (
              <div
                key={article.id}
                className="card p-4 flex flex-wrap items-center gap-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-bold truncate">{article.title}</p>
                    <Badge tone="brand">
                      {meta.emoji} {meta.label}
                    </Badge>
                    <AccessBadge isPremium={article.is_premium} unlocked />
                    {!article.published ? (
                      <Badge tone="warning">Yashirin</Badge>
                    ) : null}
                  </div>
                  <p className="text-xs text-muted mt-1 font-mono">
                    /{article.slug} · {article.read_minutes} daq
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    href={`/admin/articles/${article.id}`}
                    className="rounded-lg border border-line bg-[var(--bg-subtle)]
                               px-3 py-1.5 text-sm font-semibold hover:border-brand-400 transition-colors"
                  >
                    Tahrirlash →
                  </Link>
                  <form action={deleteArticleAction}>
                    <input type="hidden" name="id" value={article.id} />
                    <ConfirmSubmitButton
                      message="Bu maqolani va uning barcha savollarini o'chirasizmi?"
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
            );
          })}
        </div>
      )}
    </div>
  );
}
