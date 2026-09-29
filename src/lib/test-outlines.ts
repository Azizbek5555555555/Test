import "server-only";

import { createAdminSupabase } from "./supabase/admin";
import { createServerSupabase } from "./supabase/server";
import { isSupabaseConfigured } from "./supabase/env";
import { SECTIONS } from "./constants";
import type { SkillSection } from "./types";

export interface TestOutline {
  /** Testdagi bo'limlar (imtihon tartibida) */
  sections: SkillSection[];
  /** Savollar soni (moslashtirish savolining har bir qatori alohida) */
  questions: number;
}

/**
 * Ro'yxat kartalari uchun testlarning "tuzilishi": bo'limlar va savollar soni.
 *
 * Premium testlarning qismlari mehmon/Free foydalanuvchiga RLS tufayli
 * ko'rinmaydi, lekin kartada "Reading · Listening…" va savollar sonini
 * ko'rsatish kerak. Shuning uchun faqat shu metama'lumot serverda
 * service_role orqali o'qiladi — savol matni ham, javoblar ham qaytmaydi.
 * Faqat e'lon qilingan (published) testlar hisobga olinadi.
 */
export async function getTestOutlines(
  testSetIds: string[],
): Promise<Record<string, TestOutline>> {
  if (!isSupabaseConfigured() || testSetIds.length === 0) return {};
  try {
    let supabase;
    try {
      supabase = createAdminSupabase();
    } catch {
      // Kalit yo'q (lokal) — oddiy klient: faqat ochiq testlar ko'rinadi
      supabase = await createServerSupabase();
    }

    const { data: sets } = await supabase
      .from("test_sets")
      .select("id")
      .in("id", testSetIds)
      .eq("published", true);
    const ids = ((sets ?? []) as { id: string }[]).map((s) => s.id);
    if (ids.length === 0) return {};

    const { data: parts } = await supabase
      .from("test_parts")
      .select("id, test_set_id, section")
      .in("test_set_id", ids);
    const partRows = (parts ?? []) as { id: string; test_set_id: string; section: SkillSection }[];

    const result: Record<string, TestOutline> = {};
    for (const id of ids) result[id] = { sections: [], questions: 0 };
    const sectionSets: Record<string, Set<SkillSection>> = {};
    for (const p of partRows) {
      (sectionSets[p.test_set_id] ??= new Set()).add(p.section);
    }
    for (const [id, set] of Object.entries(sectionSets)) {
      result[id].sections = SECTIONS.filter((s) => set.has(s));
    }

    if (partRows.length > 0) {
      const { data: questions } = await supabase
        .from("questions")
        .select("part_id, kind, options")
        .in("part_id", partRows.map((p) => p.id));
      const partToSet = new Map(partRows.map((p) => [p.id, p.test_set_id]));
      for (const q of (questions ?? []) as { part_id: string; kind: string; options: unknown }[]) {
        const setId = partToSet.get(q.part_id);
        if (!setId) continue;
        const weight =
          q.kind === "matching" && Array.isArray(q.options) && q.options.length > 0
            ? q.options.length
            : 1;
        result[setId].questions += weight;
      }
    }
    return result;
  } catch {
    return {};
  }
}
