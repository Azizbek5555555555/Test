import type { Metadata } from "next";
import Link from "next/link";
import { getProfile, profileHasPremium } from "@/lib/auth";
import { listArticles } from "@/lib/queries";
import { ARTICLE_TOPICS } from "@/lib/constants";
import { EmptyState } from "@/components/ui/Card";
import { ButtonLink } from "@/components/ui/Button";
import { ChipLink, ChipRow } from "@/components/ui/ChipLink";
import { PageHero } from "@/components/marketing/PageHero";
import { ArticleCard } from "@/components/boost/ArticleCard";
import { Reveal } from "@/components/motion/Reveal";

export const metadata: Metadata = {
  title: "Articles",
  description:
    "Science, Technology, Health, Education, Psychology, History, Environment va Society mavzularidagi maqolalar.",
};

export default async function ArticlesPage({
  searchParams,
}: {
  searchParams: Promise<{ topic?: string; level?: string }>;
}) {
  const { topic, level } = await searchParams;
  const activeTopic = ARTICLE_TOPICS.some((t) => t.slug === topic)
    ? (topic as string)
    : "all";

  const [profile, all] = await Promise.all([getProfile(), listArticles()]);
  const unlocked = profileHasPremium(profile);

  // Mavjud darajalar (A2, B1, B2, C1 ...) — tartib bilan
  const levels = Array.from(
    new Set(all.map((a) => a.level).filter((l): l is string => Boolean(l))),
  ).sort();
  const activeLevel = level && levels.includes(level) ? level : "all";

  const byLevel =
    activeLevel === "all" ? all : all.filter((a) => a.level === activeLevel);
  const visible =
    activeTopic === "all"
      ? byLevel
      : byLevel.filter((a) => a.topic === activeTopic);

  const href = (next: { topic?: string; level?: string }) => {
    const params = new URLSearchParams();
    const t = next.topic ?? activeTopic;
    const l = next.level ?? activeLevel;
    if (t !== "all") params.set("topic", t);
    if (l !== "all") params.set("level", l);
    const qs = params.toString();
    return qs ? `/boost/articles?${qs}` : "/boost/articles";
  };

  const topics = ARTICLE_TOPICS.filter((t) => byLevel.some((a) => a.topic === t.slug));

  return (
    <div>
      <PageHero
        eyebrow="Boost Your General English"
        title="Maqolalar o'qish zali"
        highlight="o'qish zali"
        hand="Read. Learn. Grow."
        words={["context", "summary", "True / False", "paraphrase"]}
      >
        Har bir maqolada: matn, yangi so&apos;zlar va Reading savollari (True/False/Not Given,
        Multiple Choice, Gap Filling).{" "}
        <Link href="/boost" className="text-brand-400 hover:text-brand-300">
          ← Bo&apos;lim sahifasi
        </Link>
      </PageHero>

      <div className="container-page">
        <div className="space-y-3">
          {levels.length > 1 ? (
            <ChipRow>
              <ChipLink href={href({ level: "all" })} active={activeLevel === "all"}>
                Barcha darajalar
              </ChipLink>
              {levels.map((l) => (
                <ChipLink key={l} href={href({ level: l })} active={activeLevel === l}>
                  {l}
                </ChipLink>
              ))}
            </ChipRow>
          ) : null}
          {topics.length > 0 ? (
            <ChipRow>
              <ChipLink href={href({ topic: "all" })} active={activeTopic === "all"}>
                Barchasi · {byLevel.length}
              </ChipLink>
              {topics.map((t) => (
                <ChipLink key={t.slug} href={href({ topic: t.slug })} active={activeTopic === t.slug}>
                  {t.label} · {byLevel.filter((a) => a.topic === t.slug).length}
                </ChipLink>
              ))}
            </ChipRow>
          ) : null}
        </div>

        {visible.length === 0 ? (
          <div className="mt-8">
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
          </div>
        ) : (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((article, i) => (
              <Reveal key={article.id} delay={(i % 3) * 70}>
                <ArticleCard article={article} unlocked={unlocked} />
              </Reveal>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
