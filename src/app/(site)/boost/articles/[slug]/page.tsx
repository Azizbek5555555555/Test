import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProfile, profileHasPremium } from "@/lib/auth";
import { getArticleBySlug, getArticleQuestions } from "@/lib/queries";
import { topicMeta } from "@/lib/constants";
import { Badge, AccessBadge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { ArticleQuiz } from "@/components/article/ArticleQuiz";
import type { VocabularyEntry } from "@/lib/types";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  return {
    title: article?.title ?? "Maqola",
    description: article?.excerpt ?? undefined,
  };
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const profile = await getProfile();
  const unlocked = profileHasPremium(profile);

  const article = await getArticleBySlug(slug);

  // RLS tufayli Premium maqola bloklangan foydalanuvchiga umuman kelmaydi
  if (!article) {
    return <LockedArticle slug={slug} signedIn={Boolean(profile)} />;
  }
  if (!article.published) notFound();

  const questions = await getArticleQuestions(article.id);
  const meta = topicMeta(article.topic);
  const vocabulary = Array.isArray(article.vocabulary)
    ? (article.vocabulary as VocabularyEntry[])
    : [];

  return (
    <div className="container-page py-10">
      <Link
        href="/boost/articles"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-fg mb-6"
      >
        ← Barcha maqolalar
      </Link>

      <div className="grid lg:grid-cols-[1fr_300px] gap-10 items-start">
        <article className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <Badge tone="brand">
              {meta.emoji} {meta.label}
            </Badge>
            <AccessBadge isPremium={article.is_premium} unlocked={unlocked} />
            {article.level ? <Badge tone="neutral">{article.level}</Badge> : null}
            <span className="text-xs text-muted">
              ⏱ {article.read_minutes} daqiqa o&apos;qish
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold leading-tight text-balance-title">
            {article.title}
          </h1>

          {article.excerpt ? (
            <p className="text-lg text-muted mt-4 leading-relaxed">
              {article.excerpt}
            </p>
          ) : null}

          <div
            className="prose-exam mt-8"
            // Matn admin panel orqali kiritiladi (ishonchli manba)
            dangerouslySetInnerHTML={{ __html: article.body }}
          />

          <ArticleQuiz
            articleId={article.id}
            questions={questions}
            signedIn={Boolean(profile)}
            loginHref={`/login?next=${encodeURIComponent(`/boost/articles/${slug}`)}`}
          />
        </article>

        {/* ------------------------------------------- Yangi so'zlar */}
        <aside className="lg:sticky lg:top-24 h-fit space-y-4">
          {vocabulary.length > 0 ? (
            <div className="card p-5">
              <h2 className="font-extrabold text-lg mb-1">New vocabulary</h2>
              <p className="text-xs text-muted mb-4">
                Bu so&apos;zlarni yodlab oling — imtihonda ko&apos;p uchraydi.
              </p>

              <ul className="space-y-3">
                {vocabulary.map((entry, i) => (
                  <li
                    key={`${entry.word}-${i}`}
                    className="rounded-xl border border-line bg-[var(--bg-subtle)] p-3"
                  >
                    <p className="font-bold">{entry.word}</p>
                    <p className="text-sm text-brand-600 dark:text-brand-400 font-semibold">
                      {entry.meaning}
                    </p>
                    {entry.example ? (
                      <p className="text-xs text-muted mt-1.5 italic leading-relaxed">
                        “{entry.example}”
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="card p-5">
            <h2 className="font-bold text-sm mb-2">Keyingi qadam</h2>
            <p className="text-xs text-muted leading-relaxed mb-3">
              So&apos;zlarni mustahkamlash uchun Vocabulary Battle o&apos;yinini
              o&apos;ynang.
            </p>
            <ButtonLink href="/vocabulary-battle" fullWidth size="sm">
              🎮 O&apos;ynash
            </ButtonLink>
          </div>
        </aside>
      </div>
    </div>
  );
}

function LockedArticle({
  slug,
  signedIn,
}: {
  slug: string;
  signedIn: boolean;
}) {
  return (
    <div className="container-page py-16">
      <div className="card p-8 max-w-lg mx-auto text-center">
        <p className="text-5xl mb-4" aria-hidden>
          🔒
        </p>
        <h1 className="text-2xl font-extrabold">
          Bu maqola faqat Premium uchun
        </h1>
        <p className="text-muted mt-3 leading-relaxed">
          {signedIn
            ? "Bu maqola faqat Premium foydalanuvchilar uchun. Premiumga o'ting va barcha materiallarni oching."
            : "Maqolani o'qish uchun tizimga kiring. Agar maqola Premium bo'lsa, Premium obuna kerak bo'ladi."}
        </p>
        <div className="flex flex-wrap gap-3 justify-center mt-6">
          {signedIn ? (
            <ButtonLink href="/premium" variant="premium" size="lg">
              ⭐ Premiumga o&apos;tish
            </ButtonLink>
          ) : (
            <ButtonLink
              href={`/login?next=${encodeURIComponent(`/boost/articles/${slug}`)}`}
              size="lg"
            >
              Kirish
            </ButtonLink>
          )}
          <ButtonLink href="/boost/articles" variant="secondary" size="lg">
            Bepul maqolalar
          </ButtonLink>
        </div>
      </div>
    </div>
  );
}
