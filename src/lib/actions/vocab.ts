"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabase } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";
import { GAME_QUESTION_COUNT } from "@/lib/constants";
import type { VocabRoundWord, VocabSession } from "@/lib/types";

export interface RoundResult {
  ok: boolean;
  message?: string;
  roundId?: string;
  words?: VocabRoundWord[];
}

/**
 * Yangi raund boshlaydi. Baza so'zlarni tanlab, ularni "raund" sifatida
 * eslab qoladi (0005: start_vocab_round). To'g'ri javoblar brauzerga chiqmaydi.
 */
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
    const { data, error } = await supabase.rpc("start_vocab_round", {
      p_pack_id: packId,
      p_limit: GAME_QUESTION_COUNT,
    });

    if (error) return { ok: false, message: error.message };

    const round = data as {
      round_id?: string;
      words?: VocabRoundWord[] | null;
    } | null;
    const words = round?.words ?? [];
    if (!round?.round_id || words.length === 0) {
      return { ok: false, message: "Bu to'plamda hali so'zlar yo'q." };
    }

    return { ok: true, roundId: round.round_id, words };
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
 * MUHIM: ball SERVERDA hisoblanadi — faqat shu raundda berilgan so'zlar,
 * har biri bir marta, va har bir raund faqat bir marta qabul qilinadi.
 */
export async function submitVocabSessionAction(
  roundId: string,
  answers: GameAnswer[],
): Promise<SubmitGameResult> {
  const user = await getUser();
  if (!user) return { ok: false, message: "Sessiya tugagan. Qayta kiring." };

  try {
    const supabase = await createServerSupabase();

    const { data, error } = await supabase.rpc("finish_vocab_round", {
      p_round_id: roundId,
      p_answers: answers,
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
