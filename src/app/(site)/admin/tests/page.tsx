import type { Metadata } from "next";
import Link from "next/link";
import { listAllTestSets } from "@/lib/admin-queries";
import { upsertTestSetAction, deleteTestSetAction } from "@/lib/actions/admin";
import { SECTION_LABEL } from "@/lib/constants";
import { Badge, AccessBadge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/Card";
import { AdminForm } from "@/components/admin/AdminForm";
import { Collapsible } from "@/components/admin/Collapsible";
import { CATEGORY_LABEL, testSetFields } from "@/components/admin/fieldSpecs";

export const metadata: Metadata = {
  title: "Testlar",
  robots: { index: false, follow: false },
};

export default async function AdminTestsPage() {
  const testSets = await listAllTestSets();

  const grouped = Object.keys(CATEGORY_LABEL).map((category) => ({
    category,
    label: CATEGORY_LABEL[category],
    items: testSets.filter((t) => t.category === category),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-extrabold">Testlar</h2>
        <p className="text-sm text-muted mt-0.5">
          Avval testni yarating, keyin uning ichiga bo&apos;lim va savollarni
          qo&apos;shing.
        </p>
      </div>

      <Collapsible
        title="➕ Yangi test qo'shish"
        subtitle="Full Mock · Oxirgi savollar · Listening Practice · Exam Checking"
        tone="accent"
      >
        <AdminForm
          action={upsertTestSetAction}
          fields={testSetFields()}
          submitLabel="Testni yaratish"
          resetOnSuccess
        />
      </Collapsible>

      {testSets.length === 0 ? (
        <EmptyState
          icon="📝"
          title="Testlar yo'q"
          description="Yuqoridagi forma orqali birinchi testni yarating."
        />
      ) : (
        grouped
          .filter((group) => group.items.length > 0)
          .map((group) => (
            <section key={group.category}>
              <h3 className="font-bold mb-3">
                {group.label}{" "}
                <span className="text-muted tabular-nums">
                  ({group.items.length})
                </span>
              </h3>

              <div className="space-y-2">
                {group.items.map((testSet) => (
                  <div
                    key={testSet.id}
                    className="card p-4 flex flex-wrap items-center gap-3"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-bold truncate">{testSet.title}</p>
                        <AccessBadge isPremium={testSet.is_premium} unlocked />
                        {!testSet.published ? (
                          <Badge tone="warning">Yashirin</Badge>
                        ) : null}
                        {testSet.section ? (
                          <Badge tone="neutral">
                            {SECTION_LABEL[testSet.section]}
                          </Badge>
                        ) : null}
                        {testSet.year_label ? (
                          <Badge tone="info">{testSet.year_label}</Badge>
                        ) : null}
                      </div>
                      <p className="text-xs text-muted mt-1 font-mono">
                        /{testSet.slug} · {testSet.duration_minutes} daq
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        href={`/admin/tests/${testSet.id}`}
                        className="rounded-lg border border-line bg-[var(--bg-subtle)]
                                   px-3 py-1.5 text-sm font-semibold hover:border-brand-400 transition-colors"
                      >
                        Tahrirlash →
                      </Link>
                      <form action={deleteTestSetAction}>
                        <input type="hidden" name="id" value={testSet.id} />
                        <button
                          type="submit"
                          className="rounded-lg border border-rose-200 dark:border-rose-800
                                     px-3 py-1.5 text-sm font-semibold text-rose-600 dark:text-rose-400
                                     hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                          title="O'chirish"
                        >
                          🗑
                        </button>
                      </form>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))
      )}
    </div>
  );
}
