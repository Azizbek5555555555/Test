import type { Metadata } from "next";
import Link from "next/link";
import { getTestSets, getVocabPacks, listArticles } from "@/lib/queries";
import { ARTICLE_TOPICS } from "@/lib/constants";
import { PageHeader } from "@/components/ui/Card";

export const metadata: Metadata = {
  title: "Boost Your General English",
  description:
    "Maqolalar, Listening Practice va Vocabulary — imtihondan tashqari umumiy ingliz tilingizni kuchaytiring.",
};

export default async function BoostPage() {
  const [articles, listening, packs] = await Promise.all([
    listArticles(),
    getTestSets({ category: "general_english", section: "listening" }),
    getVocabPacks(),
  ]);

  const cards = [
    {
      href: "/boost/articles",
      emoji: "📰",
      title: "Articles",
      description:
        "Turli mavzulardagi maqolalar: matn, yangi lug'at va Reading savollari (True/False/Not Given, Multiple Choice, Gap Filling).",
      count: `${articles.length} ta maqola`,
      accent: "from-brand-400 to-brand-600",
      items: ARTICLE_TOPICS.slice(0, 5).map((t) => t.label),
    },
    {
      href: "/boost/listening",
      emoji: "🎧",
      title: "Listening Practice",
      description:
        "Audio, transkript, gap filling, multiple choice, matching va comprehension savollari.",
      count: `${listening.length} ta mashg'ulot`,
      accent: "from-brand-700 to-brand-900",
      items: ["Audio", "Transcript", "Gap filling", "Matching"],
    },
    {
      href: "/vocabulary-battle",
      emoji: "🎮",
      title: "Vocabulary",
      description:
        "So'z boyligini o'yin tarzida oshiring: Vocabulary Battle va haftalik reyting.",
      count: `${packs.length} ta to'plam`,
      accent: "from-brand-500 to-brand-700",
      items: ["Game format", "Points", "Ranking"],
    },
  ];

  return (
    <div className="container-page py-10">
      <PageHeader
        eyebrow="Learn"
        title="Boost Your General English"
        description="Bu bo'limning maqsadi faqat imtihon ishlash emas, balki umumiy ingliz tilingizni kuchaytirish. Kuchli General English — yuqori imtihon balliga eng ishonchli yo'l."
      />

      <div className="grid md:grid-cols-3 gap-5">
        {cards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="group card p-0 overflow-hidden flex flex-col
                       hover:shadow-[var(--shadow-lift)] hover:-translate-y-1 transition-all duration-200"
          >
            <div className={`h-1.5 bg-gradient-to-r ${card.accent}`} aria-hidden />
            <div className="p-6 flex-1 flex flex-col">
              <div
                className={`w-12 h-12 rounded-2xl grid place-items-center text-2xl
                            bg-gradient-to-br ${card.accent} text-white shadow-sm`}
                aria-hidden
              >
                {card.emoji}
              </div>

              <h2 className="font-extrabold text-xl mt-4">{card.title}</h2>
              <p className="text-sm text-muted mt-2 leading-relaxed flex-1">
                {card.description}
              </p>

              <div className="flex flex-wrap gap-1.5 mt-4">
                {card.items.map((item) => (
                  <span
                    key={item}
                    className="text-xs font-semibold text-muted bg-[var(--bg-subtle)]
                               border border-line rounded-full px-2.5 py-1"
                  >
                    {item}
                  </span>
                ))}
              </div>

              <div className="flex items-center justify-between mt-5 pt-4 border-t border-line">
                <span className="text-xs font-bold text-muted">
                  {card.count}
                </span>
                <span
                  className="inline-flex items-center gap-1.5 text-sm font-bold
                             text-brand-600 dark:text-brand-400 group-hover:gap-2.5 transition-all"
                >
                  START <span aria-hidden>→</span>
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
