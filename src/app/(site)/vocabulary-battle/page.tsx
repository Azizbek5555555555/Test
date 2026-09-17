import type { Metadata } from "next";
import Link from "next/link";
import { getProfile, profileHasPremium } from "@/lib/auth";
import { getLeaderboard, getVocabPacks, getWordCounts } from "@/lib/queries";
import { GAME_BASE_POINTS, GAME_MAX_BONUS } from "@/lib/constants";
import { formatXp } from "@/lib/format";
import { PageHeader, EmptyState, Alert } from "@/components/ui/Card";
import { AccessBadge, Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";

export const metadata: Metadata = {
  title: "Vocabulary Battle",
  description:
    "Kahoot uslubidagi so'z o'yini: tez javob bering, ball to'plang va haftalik reytingda yuqoriga chiqing.",
};

export default async function VocabularyBattlePage() {
  const [profile, packs, top] = await Promise.all([
    getProfile(),
    getVocabPacks(),
    getLeaderboard("weekly", 5),
  ]);

  const unlocked = profileHasPremium(profile);
  const wordCounts = await getWordCounts(packs.map((p) => p.id));

  return (
    <div className="container-page py-10">
      <PageHeader
        eyebrow="Play"
        title="Vocabulary Battle"
        description="Bu oddiy vocabulary test emas — bu o'yin. To'g'ri javob uchun ball, tez javob uchun qo'shimcha bonus beriladi. Har hafta reyting yangilanadi."
      />

      {!profile ? (
        <div className="mb-8">
          <Alert tone="warning" title="Faqat ro'yxatdan o'tganlar o'ynaydi">
            O&apos;yinni boshlash va reytingda qatnashish uchun{" "}
            <Link href="/login" className="font-bold underline">
              tizimga kiring
            </Link>
            .
          </Alert>
        </div>
      ) : null}

      <div className="grid lg:grid-cols-[1fr_320px] gap-8 items-start">
        <div>
          <h2 className="font-extrabold text-lg mb-4">To&apos;plamni tanlang</h2>

          {packs.length === 0 ? (
            <EmptyState
              icon="📘"
              title="To'plamlar hali qo'shilmagan"
              description="Admin panel orqali so'z to'plamlarini qo'shing yoki seed.sql ni ishga tushiring."
            />
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {packs.map((pack) => {
                const locked = pack.is_premium && !unlocked;
                const count = wordCounts[pack.id] ?? 0;

                return (
                  <Link
                    key={pack.id}
                    href={
                      locked
                        ? "/premium?reason=locked"
                        : profile
                          ? `/vocabulary-battle/play/${pack.slug}`
                          : `/login?next=${encodeURIComponent(`/vocabulary-battle/play/${pack.slug}`)}`
                    }
                    className="group card p-5 flex flex-col
                               hover:shadow-[var(--shadow-lift)] hover:-translate-y-0.5 transition-all duration-200"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <span className="text-3xl" aria-hidden>
                        {pack.emoji ?? "📘"}
                      </span>
                      <AccessBadge
                        isPremium={pack.is_premium}
                        unlocked={unlocked}
                      />
                    </div>

                    <h3 className="font-bold text-lg mt-3">{pack.title}</h3>
                    {pack.description ? (
                      <p className="text-sm text-muted mt-1.5 leading-relaxed flex-1">
                        {pack.description}
                      </p>
                    ) : null}

                    <div className="flex items-center gap-2 mt-4 pt-4 border-t border-line">
                      {pack.level ? (
                        <Badge tone="neutral">{pack.level}</Badge>
                      ) : null}
                      <span className="text-xs text-muted tabular-nums">
                        {count} ta so&apos;z
                      </span>
                      <span
                        className="ml-auto text-sm font-bold text-brand-600 dark:text-brand-400
                                   group-hover:translate-x-0.5 transition-transform"
                      >
                        {locked ? "🔒" : "PLAY →"}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* --------------------------------------------- Yon panel */}
        <aside className="space-y-4 lg:sticky lg:top-24 h-fit">
          <div className="card p-5">
            <h2 className="font-bold text-sm mb-3">Ball qanday hisoblanadi?</h2>
            <ul className="space-y-2.5 text-sm">
              <li className="flex items-center justify-between">
                <span className="text-muted">To&apos;g&apos;ri javob</span>
                <span className="font-extrabold tabular-nums">
                  +{GAME_BASE_POINTS}
                </span>
              </li>
              <li className="flex items-center justify-between">
                <span className="text-muted">Tezlik bonusi</span>
                <span className="font-extrabold tabular-nums">
                  +{GAME_MAX_BONUS} gacha
                </span>
              </li>
              <li className="flex items-center justify-between pt-2.5 border-t border-line">
                <span className="text-muted">Bitta savoldan maksimum</span>
                <span className="font-extrabold tabular-nums text-brand-600 dark:text-brand-400">
                  {GAME_BASE_POINTS + GAME_MAX_BONUS}
                </span>
              </li>
            </ul>
          </div>

          <div className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-sm">Haftalik TOP-5</h2>
              <Link
                href="/leaderboard"
                className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline"
              >
                Barchasi →
              </Link>
            </div>

            {top.length === 0 ? (
              <p className="text-sm text-muted">
                Bu hafta hali hech kim o&apos;ynamadi.
              </p>
            ) : (
              <ol className="space-y-2">
                {top.map((player, i) => (
                  <li key={player.user_id} className="flex items-center gap-2.5">
                    <span className="w-5 text-sm font-bold text-muted tabular-nums">
                      {["🥇", "🥈", "🥉"][i] ?? player.rank}
                    </span>
                    <Avatar
                      name={player.full_name}
                      src={player.avatar_url}
                      size="sm"
                      ring={player.is_premium}
                    />
                    <span className="text-sm font-semibold truncate flex-1">
                      {player.full_name}
                    </span>
                    <span className="text-sm font-bold tabular-nums text-brand-600 dark:text-brand-400">
                      {formatXp(player.xp)}
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </div>

          {profile ? (
            <div className="card p-5 text-center">
              <p className="text-xs font-bold uppercase tracking-wide text-muted">
                Sizning umumiy XP
              </p>
              <p className="text-3xl font-extrabold tabular-nums mt-1.5">
                {formatXp(profile.total_xp)}
              </p>
              <ButtonLink
                href="/leaderboard"
                variant="secondary"
                size="sm"
                fullWidth
                className="mt-4"
              >
                Reytingda o&apos;rnim
              </ButtonLink>
            </div>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
