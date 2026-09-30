import Link from "next/link";
import { Lock } from "react-feather";
import type { ArticleListItem } from "@/lib/types";
import { topicMeta } from "@/lib/constants";
import { getT } from "@/i18n/server";

/** Figma 07: maqola kartasi — mavzu belgisi, o'qish vaqti, sarlavha, yangi so'zlar */
export async function ArticleCard({
  article,
  unlocked,
}: {
  article: ArticleListItem;
  unlocked: boolean;
}) {
  const t = await getT();
  const meta = topicMeta(article.topic);
  const locked = article.is_premium && !unlocked;

  return (
    <Link
      href={locked ? "/premium?reason=locked" : `/boost/articles/${article.slug}`}
      data-spot
      className="spot group card lift relative flex h-full flex-col p-7 hover:border-brand-400/40"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="rounded-md border border-line bg-ink-800 px-2.5 py-1 text-[11px] font-medium text-muted">
            {meta.label}
          </span>
          {article.level ? (
            <span className="text-[11px] font-semibold text-muted">{article.level}</span>
          ) : null}
        </div>
        <span className="flex items-center gap-1.5 text-xs text-muted">
          {article.is_premium ? (
            <Lock size={12} className={locked ? "text-gold-400" : "text-muted"} aria-label="Premium" />
          ) : null}
          {article.read_minutes} {t("daqiqa", "min")}
        </span>
      </div>

      <h3 className="display-title mt-4 text-[22px] leading-snug text-fg line-clamp-2">{article.title}</h3>

      <div className="mt-auto flex items-center justify-between gap-3 pt-5 text-[13px]">
        <span className="text-brand-400">
          {article.word_count > 0
            ? t(`${article.word_count} ta yangi so'z`, `${article.word_count} new words`)
            : t(`${article.question_count} ta savol`, `${article.question_count} questions`)}
        </span>
        <span className="font-semibold text-fg transition-transform group-hover:translate-x-1">
          {locked ? "Premium →" : `${t("O'qish", "Read")} →`}
        </span>
      </div>
    </Link>
  );
}
