"use server";

import { createServerSupabase } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";
import type { AnswerMap } from "@/lib/types";

export interface ArticleResultEntry {
  correct: boolean;
  answer: unknown;
  explanation: string | null;
}

export interface ArticleSubmitResult {
  ok: boolean;
  message?: string;
  correctCount?: number;
  totalCount?: number;
  results?: Record<string, ArticleResultEntry>;
}

/** Maqola savollariga berilgan javoblarni serverda tekshiradi */
export async function submitArticleAnswersAction(
  articleId: string,
  answers: AnswerMap,
): Promise<ArticleSubmitResult> {
  const user = await getUser();
  if (!user) {
    return {
      ok: false,
      message: "Javoblarni tekshirish uchun avval tizimga kiring.",
    };
  }

  try {
    const supabase = await createServerSupabase();
    const { data, error } = await supabase.rpc("submit_article_answers", {
      p_article_id: articleId,
      p_answers: answers,
    });

    if (error) return { ok: false, message: error.message };

    const rows = (data ?? []) as {
      correct_count: number;
      total_count: number;
      results: Record<string, ArticleResultEntry>;
    }[];

    const row = rows[0];
    if (!row) return { ok: false, message: "Natija olinmadi." };

    return {
      ok: true,
      correctCount: row.correct_count,
      totalCount: row.total_count,
      results: row.results,
    };
  } catch {
    return { ok: false, message: "Tekshirishda xatolik yuz berdi." };
  }
}
