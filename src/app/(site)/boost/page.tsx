import type { Metadata } from "next";
import Link from "next/link";
import { Award, BookOpen, Headphones, Play } from "react-feather";
import { getProfile, profileHasPremium } from "@/lib/auth";
import {
  getArticleBySlug,
  getArticleQuestions,
  getTestSets,
  getVocabPacks,
  listArticles,
} from "@/lib/queries";
import { getTestOutlines } from "@/lib/test-outlines";
import { ARTICLE_TOPICS, KIND_LABEL, topicMeta } from "@/lib/constants";
import type { ArticleListItem, QuestionKind, VocabularyEntry } from "@/lib/types";
import { PageHero } from "@/components/marketing/PageHero";
import { ChipLink, ChipRow } from "@/components/ui/ChipLink";
import { ArticleCard } from "@/components/boost/ArticleCard";
import { Waveform } from "@/components/boost/Waveform";
import { Reveal } from "@/components/motion/Reveal";
import { getT } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return {
    title: "Boost Your General English",
    description: t(
      "Maqolalar, Listening Practice va Vocabulary — imtihondan tashqari umumiy ingliz tilingizni kuchaytiring.",
      "Articles, Listening Practice and Vocabulary — strengthen your general English beyond the exam.",
    ),
  };
}

/** HTML matndan birinchi paragraflarni oddiy matn sifatida oladi */
function leadParagraphs(html: string, count: number): string[] {
  const decode = (t: string) =>
    t
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&quot;/g, '"')
      .replace(/&#39;|&apos;/g, "'")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">");
  const paragraphs = Array.from(html.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi))
    .map((m) => decode(m[1].replace(/<[^>]+>/g, "")).replace(/\s+/g, " ").trim())
    .filter((p) => p.length > 40);
  if (paragraphs.length > 0) return paragraphs.slice(0, count);
  const plain = decode(html.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
  return plain ? [plain.slice(0, 600)] : [];
}

/** Kun maqolasi — bepul maqolalar orasidan har kuni boshqasi */
function pickDaily(articles: ArticleListItem[]): ArticleListItem | undefined {
  const free = articles.filter((a) => !a.is_premium);
  if (free.length === 0) return undefined;
  const day = Math.floor(Date.now() / 86_400_000);
  return free[day % free.length];
}

export default async function BoostPage() {
  const [profile, articles, listening, packs, t] = await Promise.all([
    getProfile(),
    listArticles(),
    getTestSets({ category: "general_english", section: "listening" }),
    getVocabPacks(),
    getT(),
  ]);
  const unlocked = profileHasPremium(profile);

  const daily = pickDaily(articles);
  const [dailyFull, dailyQuestions] = daily
    ? await Promise.all([getArticleBySlug(daily.slug), getArticleQuestions(daily.id)])
    : [null, []];
  const dailyVocab = (Array.isArray(dailyFull?.vocabulary) ? dailyFull.vocabulary : []) as VocabularyEntry[];
  const taskCounts = new Map<QuestionKind, number>();
  for (const q of dailyQuestions) taskCounts.set(q.kind, (taskCounts.get(q.kind) ?? 0) + 1);

  const lesson = listening.find((s) => !s.is_premium) ?? listening[0];
  const lessonOutline = lesson ? (await getTestOutlines([lesson.id]))[lesson.id] : undefined;

  const topics = ARTICLE_TOPICS.filter((tp) => articles.some((a) => a.topic === tp.slug));

  const categories = [
    {
      href: "/boost/articles",
      icon: BookOpen,
      title: t("Maqolalar", "Articles"),
      text: t(
        "Dunyo mavzularidagi maqolalar orqali o'qib tushunishni chuqurlashtiring: yangi so'zlar va Reading savollari bilan.",
        "Deepen your reading comprehension with articles on world topics — with new words and Reading questions.",
      ),
      count: t(`${articles.length} ta maqola`, `${articles.length} articles`),
    },
    {
      href: "/boost/listening",
      icon: Headphones,
      title: "Listening Practice",
      text: t(
        "Tabiiy talaffuzga quloq o'rgating. Audio, skript va gap filling, matching, multiple choice savollari.",
        "Train your ear to natural speech. Audio, transcripts and gap filling, matching and multiple choice questions.",
      ),
      count: t(`${listening.length} ta mashg'ulot`, `${listening.length} lessons`),
    },
    {
      href: "/vocabulary-battle",
      icon: Award,
      title: "Vocabulary Arena",
      text: t(
        "Idiomalar, akademik so'zlar va darajani oshiruvchi lug'atni o'yin orqali mustahkamlang.",
        "Master idioms, academic words and level-raising vocabulary through a game.",
      ),
      count: t(`${packs.length} ta to'plam`, `${packs.length} packs`),
    },
  ];

  return (
    <div>
      <PageHero
        eyebrow={t("CEFR mashq to'plami", "CEFR practice set")}
        title="Boost Your General English"
        highlight="General English"
        hand="A little better every day"
        words={["vocabulary", "fluent", "listening", "reading"]}
      >
        {t(
          "Har kungi ko'nikmalarni rivojlantiring — yanada ishonchli bo'ling. Kontekst, tushunish va ifodani tizimli egallang.",
          "Build your everyday skills and grow more confident. Master context, comprehension and expression step by step.",
        )}
      </PageHero>

      {/* ------------------------------------------------ Yo'nalishlar */}
      <section className="container-page grid gap-6 md:grid-cols-3">
        {categories.map((c, i) => (
          <Reveal key={c.href} delay={i * 80}>
            <Link href={c.href} data-spot className="spot group card-glass lift relative flex h-full flex-col rounded-2xl p-8 hover:border-brand-400/40">
              <span className="grid size-10 place-items-center rounded-lg border border-line bg-ink-800 text-brand-400">
                <c.icon size={20} strokeWidth={1.75} aria-hidden />
              </span>
              <h2 className="display-title mt-4 text-[28px]">{c.title}</h2>
              <p className="mt-3 flex-1 text-sm leading-relaxed text-muted">{c.text}</p>
              <div className="mt-5 flex items-center justify-between text-[13px]">
                <span className="font-semibold text-brand-400 transition-transform group-hover:translate-x-1">
                  {t("Ko'rish", "View")} →
                </span>
                <span className="text-muted">{c.count}</span>
              </div>
            </Link>
          </Reveal>
        ))}
      </section>

      {/* ------------------------------------------------ O'qish zali */}
      {articles.length > 0 ? (
        <section className="container-page mt-20">
          <Reveal>
            <h2 className="display-title text-[36px] sm:text-[40px]">{t("Maqolalar o'qish zali", "Article reading room")}</h2>
            <ChipRow className="mt-5">
              <ChipLink href="/boost/articles" active>
                {t("Barchasi", "All")}
              </ChipLink>
              {topics.map((tp) => (
                <ChipLink key={tp.slug} href={`/boost/articles?topic=${tp.slug}`} active={false}>
                  {tp.label}
                </ChipLink>
              ))}
            </ChipRow>
          </Reveal>
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {articles.slice(0, 6).map((a, i) => (
              <Reveal key={a.id} delay={(i % 3) * 70}>
                <ArticleCard article={a} unlocked={unlocked} />
              </Reveal>
            ))}
          </div>
          {articles.length > 6 ? (
            <p className="mt-8 text-center">
              <Link href="/boost/articles" className="text-sm font-semibold text-brand-400 hover:text-brand-300">
                {t(`Barcha ${articles.length} ta maqola`, `All ${articles.length} articles`)} →
              </Link>
            </p>
          ) : null}
        </section>
      ) : null}

      {/* ------------------------------------------------ Iqtibos */}
      <Reveal className="container-page mt-24 text-center">
        <p className="mx-auto max-w-3xl font-display text-2xl italic leading-snug text-brand-400 sm:text-[32px]">
          “{t("Ishonch har bir suhbat bilan o'sadi. Tilning tik yonbag'irlaridan qo'rqmang.", "Confidence grows with every conversation. Don't fear the steep slopes of a language.")}”
        </p>
        <span aria-hidden className="mx-auto mt-6 block h-px w-20 bg-brand-400/60" />
      </Reveal>

      {/* ------------------------------------------------ Kun matni */}
      {daily && dailyFull ? (
        <section className="container-page mt-20 grid items-start gap-8 lg:grid-cols-[1fr_440px]">
          <Reveal className="card rounded-2xl p-7 sm:p-10">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-brand-400">
              {t("Kun matni", "Text of the day")} · {topicMeta(daily.topic).label}
            </p>
            <h2 className="display-title mt-2 text-[30px] leading-tight sm:text-[36px]">{daily.title}</h2>
            <span aria-hidden className="mt-4 block h-px bg-line" />
            <div className="mt-6 space-y-5 text-[15px] leading-[1.8] text-ink-200">
              {leadParagraphs(dailyFull.body, 2).map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
            <Link
              href={`/boost/articles/${daily.slug}`}
              className="mt-6 inline-flex text-sm font-semibold text-brand-400 hover:text-brand-300"
            >
              {t("To'liq o'qish va savollarni ishlash", "Read in full and answer the questions")} →
            </Link>
          </Reveal>

          <Reveal delay={100} className="space-y-6">
            {dailyVocab.length > 0 ? (
              <div className="rounded-2xl border border-line bg-ink-800 p-7">
                <p className="text-xs font-semibold uppercase tracking-[0.1em] text-brand-400">{t("Yangi so'zlar", "New words")}</p>
                <ul className="mt-4 space-y-3">
                  {dailyVocab.slice(0, 4).map((w) => (
                    <li key={w.word}>
                      <p className="text-[15px] font-semibold text-fg">{w.word}</p>
                      <p className="mt-0.5 text-[13px] text-muted">{w.meaning}</p>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            {taskCounts.size > 0 ? (
              <div className="rounded-2xl border border-line bg-ink-800 p-7">
                <p className="text-xs font-semibold uppercase tracking-[0.1em] text-brand-400">{t("Mashq topshiriqlari", "Practice tasks")}</p>
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
          </Reveal>
        </section>
      ) : null}

      {/* ------------------------------------------------ Listening */}
      {lesson ? (
        <section className="container-page mt-24">
          <Reveal>
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-brand-400">
              {t("CEFR Listening mashqi", "CEFR Listening practice")}
            </p>
            <h2 className="display-title mt-2 text-[34px] sm:text-[36px]">{t("Faol tinglab tushunish", "Active listening comprehension")}</h2>
          </Reveal>
          <Reveal delay={80}>
            <Link
              href={lesson.is_premium && !unlocked ? "/premium?reason=locked" : `/tests/${lesson.slug}`}
              className="group card-glass mt-8 block rounded-2xl p-6 sm:p-8 hover:border-brand-400/40"
            >
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-full bg-brand-400 text-on-accent transition-transform group-hover:scale-110">
                    <Play size={16} fill="currentColor" aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-[15px] font-semibold text-fg">{lesson.title}</p>
                    <p className="text-xs text-muted">
                      {lesson.level ? `${t("Daraja", "Level")}: CEFR ${lesson.level}` : "Listening Practice"}
                      {lessonOutline?.questions ? ` · ${lessonOutline.questions} ${t("ta savol", "questions")}` : ""}
                    </p>
                  </div>
                </div>
                <span className="rounded-full border-[1.5px] border-brand-400 px-4 py-1.5 text-[13px] font-semibold text-fg transition-colors group-hover:bg-brand-400 group-hover:text-on-accent">
                  {t("Mashqni boshlash", "Start practice")}
                </span>
              </div>
              <Waveform className="mt-6" />
              <div className="mt-3 flex justify-between text-xs tabular-nums text-muted">
                <span>{t("Audio · Skript · Savollar", "Audio · Transcript · Questions")}</span>
                <span>{t(`${listening.length} ta mashg'ulot`, `${listening.length} lessons`)}</span>
              </div>
            </Link>
          </Reveal>
        </section>
      ) : null}
    </div>
  );
}
