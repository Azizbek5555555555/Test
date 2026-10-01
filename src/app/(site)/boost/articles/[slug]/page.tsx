import type { Metadata } from "next";
import Link from "next/link";
import { Lock } from "react-feather";
import { notFound } from "next/navigation";
import { getProfile, profileHasPremium } from "@/lib/auth";
import { getArticleBySlug, getArticleQuestions } from "@/lib/queries";
import { KIND_LABEL, topicMeta } from "@/lib/constants";
import { AccessBadge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { ArticleQuiz } from "@/components/article/ArticleQuiz";
import type { QuestionKind, VocabularyEntry } from "@/lib/types";
import { getT } from "@/i18n/server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const [article, t] = await Promise.all([getArticleBySlug(slug), getT()]);
  return {
    title: article?.title ?? t("Maqola", "Article"),
    description: article?.excerpt ?? undefined,
  };
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [profile, t] = await Promise.all([getProfile(), getT()]);
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

  // Mashq topshiriqlari: savol turlari bo'yicha
  const taskCounts = new Map<QuestionKind, number>();
  for (const q of questions) taskCounts.set(q.kind, (taskCounts.get(q.kind) ?? 0) + 1);

  return (
    <div className="bg-gradient-to-b from-[#0f2440] to-ink-950 to-40%">
      <div className="container-page pb-10 pt-10 sm:pt-14">
        <Link
          href="/boost/articles"
          className="mb-8 inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-fg"
        >
          ← {t("Barcha maqolalar", "All articles")}
        </Link>

        <div className="grid items-start gap-8 lg:grid-cols-[1fr_400px]">
          <div className="min-w-0 space-y-8">
            <article className="card animate-fade-up rounded-2xl p-6 sm:p-10">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-brand-400">
                  {meta.label}
                </p>
                {article.level ? (
                  <span className="rounded-full border border-line px-2 py-0.5 text-[11px] font-semibold text-muted">
                    {article.level}
                  </span>
                ) : null}
                <AccessBadge isPremium={article.is_premium} unlocked={unlocked} />
                <span className="text-xs text-muted">{article.read_minutes} {t("daqiqa o'qish", "min read")}</span>
              </div>

              <h1 className="display-title mt-3 text-[32px] leading-tight sm:text-[40px]">
                {article.title}
              </h1>
              <span aria-hidden className="mt-5 block h-px bg-line" />

              {article.excerpt && !bodyStartsWithExcerpt(article.body, article.excerpt) ? (
                <p className="mt-6 font-display text-xl italic leading-relaxed text-ink-200">
                  {article.excerpt}
                </p>
              ) : null}

              <div
                className="prose-exam mt-6 text-ink-100"
                // Matn admin panel orqali kiritiladi (ishonchli manba)
                dangerouslySetInnerHTML={{ __html: article.body }}
              />
            </article>

            <ArticleQuiz
              articleId={article.id}
              questions={questions}
              signedIn={Boolean(profile)}
              loginHref={`/login?next=${encodeURIComponent(`/boost/articles/${slug}`)}`}
            />
          </div>

          {/* ------------------------------------------- Yon panel */}
          <aside className="h-fit space-y-6 lg:sticky lg:top-28">
            {vocabulary.length > 0 ? (
              <div className="rounded-2xl border border-line bg-ink-800 p-7">
                <p className="text-xs font-semibold uppercase tracking-[0.1em] text-brand-400">
                  {t("Yangi so'zlar", "New words")} · {vocabulary.length}
                </p>
                {/* 40 tagacha so'z — ro'yxat o'z ichida aylanadi, sahifa cho'zilmaydi */}
                <ul className="-mx-2 mt-4 max-h-[52vh] space-y-3 overflow-y-auto px-2">
                  {vocabulary.map((entry, i) => (
                    <li key={`${entry.word}-${i}`}>
                      <p className="text-[15px] font-semibold text-fg">{entry.word}</p>
                      <p className="mt-0.5 text-[13px] text-muted">{entry.meaning}</p>
                      {entry.example ? (
                        <p className="mt-1 text-xs italic leading-relaxed text-faint">“{entry.example}”</p>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {taskCounts.size > 0 ? (
              <div className="rounded-2xl border border-line bg-ink-800 p-7">
                <p className="text-xs font-semibold uppercase tracking-[0.1em] text-brand-400">
                  {t("Mashq topshiriqlari", "Practice tasks")}
                </p>
                <ul className="mt-4 space-y-3">
                  {Array.from(taskCounts.entries()).map(([kind, n]) => (
                    <li
                      key={kind}
                      className="flex items-center justify-between rounded-lg border border-line bg-ink-900 px-3 py-2.5 text-sm"
                    >
                      <span className="text-fg">{KIND_LABEL[kind] ? t(KIND_LABEL[kind]) : kind}</span>
                      <span className="text-xs text-muted">{n} {t("ta savol", "questions")}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <div className="card-glass rounded-2xl p-6">
              <p className="display-title text-xl">{t("So'zlarni mustahkamlang", "Lock in the words")}</p>
              <p className="mt-2 text-[13px] leading-relaxed text-muted">
                {t("Yangi so'zlarni Vocabulary Battle o'yinida takrorlang va reytingga chiqing.", "Review new words in the Vocabulary Battle game and climb the leaderboard.")}
              </p>
              <ButtonLink href="/vocabulary-battle" fullWidth size="sm" className="mt-4">
                {t("O'ynash", "Play")}
              </ButtonLink>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

async function LockedArticle({
  slug,
  signedIn,
}: {
  slug: string;
  signedIn: boolean;
}) {
  const t = await getT();
  return (
    <div className="container-page py-16">
      <div className="card-glass mx-auto max-w-lg rounded-2xl p-8 text-center">
        <span className="mx-auto mb-5 grid size-14 place-items-center rounded-2xl border border-line bg-ink-800 text-gold-400">
          <Lock size={24} strokeWidth={1.75} aria-hidden />
        </span>
        <h1 className="display-title text-[32px]">
          {t("Bu maqola faqat Premium uchun", "This article is Premium only")}
        </h1>
        <p className="text-muted mt-3 leading-relaxed">
          {signedIn
            ? t(
                "Bu maqola faqat Premium foydalanuvchilar uchun. Premiumga o'ting va barcha materiallarni oching.",
                "This article is for Premium members only. Go Premium to unlock all materials.",
              )
            : t(
                "Maqolani o'qish uchun tizimga kiring. Agar maqola Premium bo'lsa, Premium obuna kerak bo'ladi.",
                "Log in to read the article. If it is a Premium article, you will need a Premium subscription.",
              )}
        </p>
        <div className="flex flex-wrap gap-3 justify-center mt-6">
          {signedIn ? (
            <ButtonLink href="/premium" variant="premium" size="lg">
              {t("Premiumga o'tish", "Go Premium")}
            </ButtonLink>
          ) : (
            <ButtonLink
              href={`/login?next=${encodeURIComponent(`/boost/articles/${slug}`)}`}
              size="lg"
            >
              {t("Kirish", "Log in")}
            </ButtonLink>
          )}
          <ButtonLink href="/boost/articles" variant="secondary" size="lg">
            {t("Bepul maqolalar", "Free articles")}
          </ButtonLink>
        </div>
      </div>
    </div>
  );
}

/** Qisqa tavsif matnning birinchi jumlalaridan olingan bo'lsa, uni ikki marta ko'rsatmaymiz */
function bodyStartsWithExcerpt(body: string, excerpt: string): boolean {
  const plain = (text: string) =>
    text.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().toLowerCase();
  const head = plain(excerpt).replace(/…$/, "").slice(0, 60);
  return head.length > 0 && plain(body).startsWith(head);
}
