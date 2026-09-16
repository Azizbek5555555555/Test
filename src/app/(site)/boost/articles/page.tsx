import type { Metadata } from "next";
import Link from "next/link";
import { getProfile, profileHasPremium } from "@/lib/auth";
import { listArticles } from "@/lib/queries";
import { ARTICLE_TOPICS, topicMeta } from "@/lib/constants";
import { PageHeader, EmptyState } from "@/components/ui/Card";
import { LinkTabs } from "@/components/ui/Tabs";
import { AccessBadge, Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "Articles",
  description:
    "Science, Technology, Health, Education, Psychology, History, Environment va Society mavzularidagi maqolalar.",
};

export default async function ArticlesPage({
  searchParams,
}: {
  searchParams: Promise<{ topic?: string }>;
}) {
  const { topic } = await searchParams;
  const activeTopic = ARTICLE_TOPICS.some((t) => t.slug === topic)
    ? (topic as string)
    : "all";

  const [profile, all] = await Promise.all([getProfile(), listArticles()]);
  const unlocked = profileHasPremium(profile);

  const visible =
    activeTopic === "all" ? all : all.filter((a) => a.topic === activeTopic);

  const tabs = [
    { id: "all", label: "Barchasi", href: "/boost/articles", count: all.length },
    ...ARTICLE_TOPICS.filter((t) => all.some((a) => a.topic === t.slug)).map(
      (t) => ({
        id: t.slug,
        label: `${t.emoji} ${t.label}`,
        href: `/boost/articles?topic=${t.slug}`,
        count: all.filter((a) => a.topic === t.slug).length,
      }),
    ),
  ];

  return (
    <div className="container-page py-10">
      <Link
        href="/boost"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-fg mb-6"
      >
        ← Boost Your General English
      </Link>

      <PageHeader
        eyebrow="Learn"
        title="Articles"
        description="Har bir maqola ichida: matn, yangi vocabulary va Reading savollari (True/False/Not Given, Multiple Choice, Gap Filling)."
      >
        {tabs.length > 1 ? (
          <LinkTabs items={tabs} activeId={activeTopic} />
        ) : null}
      </PageHeader>

      {visible.length === 0 ? (
        <EmptyState
          icon="📰"
          title="Maqolalar topilmadi"
          description="Bu mavzuda hali maqola yo'q. Admin panel orqali qo'shishingiz mumkin."
          action={
            <ButtonLink href="/boost/articles" variant="secondary">
              Barcha maqolalar
            </ButtonLink>
          }
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {visible.map((article) => {
            const meta = topicMeta(article.topic);
            const locked = article.is_premium && !unlocked;

            return (
              <Link
                key={article.id}
                href={
                  locked
                    ? "/premium?reason=locked"
                    : `/boost/articles/${article.slug}`
                }
                className="group card p-5 flex flex-col
                           hover:shadow-[var(--shadow-lift)] hover:-translate-y-0.5 transition-all duration-200"
              >
                <div className="flex items-start justify-between gap-3">
                  <Badge tone="brand">
                    {meta.emoji} {meta.label}
                  </Badge>
                  <AccessBadge
                    isPremium={article.is_premium}
                    unlocked={unlocked}
                  />
                </div>

                <h2 className="font-bold text-lg mt-3 leading-snug">
                  {article.title}
                </h2>

                {article.excerpt ? (
                  <p className="text-sm text-muted mt-2 leading-relaxed line-clamp-3 flex-1">
                    {article.excerpt}
                  </p>
                ) : null}

                <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mt-4 pt-4 border-t border-line text-xs text-muted">
                  <span>⏱ {article.read_minutes} daqiqa</span>
                  {article.word_count > 0 ? (
                    <span>📖 {article.word_count} ta so&apos;z</span>
                  ) : null}
                  {article.question_count > 0 ? (
                    <span>❓ {article.question_count} ta savol</span>
                  ) : null}
                  {article.level ? <Badge tone="neutral">{article.level}</Badge> : null}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
