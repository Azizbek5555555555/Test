import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getProfile, profileHasPremium } from "@/lib/auth";
import { getVocabPackBySlug } from "@/lib/queries";
import { VocabGame } from "@/components/vocab/VocabGame";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const pack = await getVocabPackBySlug(slug);
  return {
    title: pack ? `${pack.title} — Vocabulary Battle` : "Vocabulary Battle",
    robots: { index: false, follow: false },
  };
}

export default async function PlayPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const profile = await getProfile();
  if (!profile) {
    redirect(
      `/login?next=${encodeURIComponent(`/vocabulary-battle/play/${slug}`)}`,
    );
  }

  const pack = await getVocabPackBySlug(slug);
  if (!pack || !pack.published) notFound();

  if (pack.is_premium && !profileHasPremium(profile)) {
    redirect("/premium?reason=locked");
  }

  return (
    <div className="container-page py-10">
      <Link
        href="/vocabulary-battle"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-fg mb-6"
      >
        ← Vocabulary Battle
      </Link>

      <VocabGame
        packId={pack.id}
        packTitle={pack.title}
        packEmoji={pack.emoji ?? "📘"}
      />
    </div>
  );
}
