"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabase } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";
import { GAME_QUESTION_COUNT } from "@/lib/constants";
import type { VocabRoundWord, VocabSession } from "@/lib/types";

export interface RoundResult {
  ok: boolean;
  message?: string;
  words?: VocabRoundWord[];
}

/** O'yin uchun so'zlarni oladi — to'g'ri javoblarsiz, aralashtirilgan holda */
export async function startVocabRoundAction(
  packId: string,
): Promise<RoundResult> {
  const user = await getUser();
  if (!user) {
    return {
      ok: false,
      message: "Faqat ro'yxatdan o'tgan foydalanuvchilar o'ynay oladi.",
    };
  }

  try {
    const supabase = await createServerSupabase();
    const { data, error } = await supabase.rpc("get_vocab_round", {
      p_pack_id: packId,
      p_limit: GAME_QUESTION_COUNT,
    });

    if (error) return { ok: false, message: error.message };

    const words = (data ?? []) as VocabRoundWord[];
    if (words.length === 0) {
      return { ok: false, message: "Bu to'plamda hali so'zlar yo'q." };
    }

    return { ok: true, words };
  } catch {
    return { ok: false, message: "So'zlarni yuklab bo'lmadi." };
  }
}

export interface GameAnswer {
  word_id: string;
  choice: number;
  ms: number;
}

export interface SubmitGameResult {
  ok: boolean;
  message?: string;
  session?: VocabSession;
  rank?: number | null;
}

/**
 * O'yin natijasini yuboradi.
 * MUHIM: ball SERVERDA qayta hisoblanadi — brauzerdan kelgan ballga ishonilmaydi.
 */
export async function submitVocabSessionAction(
  packId: string,
  answers: GameAnswer[],
  durationMs: number,
): Promise<SubmitGameResult> {
  const user = await getUser();
  if (!user) return { ok: false, message: "Sessiya tugagan. Qayta kiring." };

  try {
    const supabase = await createServerSupabase();

    const { data, error } = await supabase.rpc("submit_vocab_session", {
      p_pack_id: packId,
      p_answers: answers,
      p_duration_ms: Math.max(0, Math.round(durationMs)),
    });

    if (error) return { ok: false, message: error.message };

    const session = data as VocabSession | null;
    if (!session) return { ok: false, message: "Natija saqlanmadi." };

    // Haftalik o'rinni olamiz (hujjatdagi "Your Rank: #14")
    const { data: rankRows } = await supabase.rpc("get_my_rank", {
      p_period: "weekly",
    });
    const rank = (rankRows ?? [])[0]?.rank ?? null;

    revalidatePath("/leaderboard");
    revalidatePath("/profile");

    return { ok: true, session, rank };
  } catch {
    return { ok: false, message: "Natijani saqlashda xatolik yuz berdi." };
  }
}
