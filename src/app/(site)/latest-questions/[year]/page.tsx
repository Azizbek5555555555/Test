import { redirect } from "next/navigation";
import { SECTIONS } from "@/lib/constants";
import type { SkillSection } from "@/lib/types";

/** Eski manzil (/latest-questions/2025-2026) → yangi yagona sahifa */
export default async function YearRedirect({
  params,
  searchParams,
}: {
  params: Promise<{ year: string }>;
  searchParams: Promise<{ section?: string }>;
}) {
  const { year } = await params;
  const { section } = await searchParams;
  const query = new URLSearchParams({ year });
  if (SECTIONS.includes(section as SkillSection)) query.set("section", section as string);
  redirect(`/latest-questions?${query.toString()}`);
}
