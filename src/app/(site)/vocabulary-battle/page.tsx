import type { Metadata } from "next";
import Link from "next/link";
import { Lock, Zap } from "react-feather";
import { getProfile, profileHasPremium } from "@/lib/auth";
import { getLeaderboard, getMyRank, getMyStats, getVocabPacks, getWordCounts } from "@/lib/queries";
import {
  GAME_BASE_POINTS,
  GAME_MAX_BONUS,
  GAME_QUESTION_COUNT,
  LEADERBOARD_PERIODS,
  type LeaderboardPeriod,
} from "@/lib/constants";
import { cn, formatXp } from "@/lib/format";
import type { VocabPack } from "@/lib/types";
import { EmptyState } from "@/components/ui/Card";
import { ButtonLink } from "@/components/ui/Button";
import { PageHero } from "@/components/marketing/PageHero";
import { TopClimbers } from "@/components/vocab/TopClimbers";
import { Reveal } from "@/components/motion/Reveal";

export const metadata: Metadata = {
  title: "Vocabulary Battle",
  description:
    "Kahoot uslubidagi so'z o'yini: tez javob bering, ball to'plang va haftalik reytingda yuqoriga chiqing.",
};

const DEMO_OPTIONS = ["A. Maqsad", "B. Yutuq", "C. Imkoniyat", "D. Mas'uliyat"];

export default async function VocabularyBattlePage({
  searchParams,
}: {
  searchParams: Promise<{ pack?: string; period?: string }>;
}) {
  const params = await searchParams;
  const period = (
    LEADERBOARD_PERIODS.some((p) => p.id === params.period) ? params.period : "weekly"
  ) as LeaderboardPeriod;

  const [profile, packs, top, me, stats] = await Promise.all([
    getProfile(),
    getVocabPacks(),
    getLeaderboard(period, 5),
    getMyRank(period),
    getMyStats(),
  ]);

  const unlocked = profileHasPremium(profile);
  const wordCounts = await getWordCounts(packs.map((p) => p.id));

  const isLocked = (p: VocabPack) => p.is_premium && !unlocked;
  const selected =
    packs.find((p) => p.slug === params.pack) ?? packs.find((p) => !isLocked(p)) ?? packs[0];

  const playHref = (p: VocabPack) =>
    isLocked(p)
      ? "/premium?reason=locked"
      : profile
        ? `/vocabulary-battle/play/${p.slug}`
        : `/login?next=${encodeURIComponent(`/vocabulary-battle/play/${p.slug}`)}`;

  const query = (next: { pack?: string; period?: string }) => {
    const q = new URLSearchParams();
    const pack = next.pack ?? selected?.slug;
    const per = next.period ?? period;
    if (pack) q.set("pack", pack);
    if (per !== "weekly") q.set("period", per);
    return `/vocabulary-battle?${q.toString()}`;
  };

  return (
    <div className="bg-gradient-to-b from-[#221d2e] via-[#141a2c] via-40% to-ink-950">
      <PageHero
        eyebrow="Jonli so'z maydoni"
        title="Vocabulary Battle"
        highlight="Battle"
        hand="Learn words. Win points."
        words={["eloquent", "resilient", "+100 XP", "coherent"]}
        className="pb-10"
        bare
      >
        O&apos;rgan. O&apos;yna. Bellash. O&apos;s. Akademik so&apos;zlarni vaqt bosimi ostida
        mustahkamlang.
      </PageHero>

      <div className="container-page">
        {packs.length === 0 ? (
          <EmptyState
            icon="📘"
            title="To'plamlar hali qo'shilmagan"
            description="Admin panel orqali so'z to'plamlarini qo'shing."
          />
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-[1fr_1fr_1fr_1.35fr]">
            {/* ------------------------------------------------ Lobby */}
            <Reveal className="card flex flex-col items-center justify-center rounded-2xl p-7 text-center">
              <span className="rounded bg-ink-700 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-brand-300">
                Lobby
              </span>
              <h2 className="display-title mt-4 text-[28px]">Cho&apos;qqiga tayyormisiz?</h2>
              <p className="mt-2 text-sm text-muted">Jangni boshlash uchun to&apos;plamni tanlang.</p>
              <div className="mt-5 flex flex-wrap justify-center gap-2">
                {packs.slice(0, 6).map((p) => (
                  <Link
                    key={p.id}
                    href={query({ pack: p.slug })}
                    scroll={false}
                    aria-current={p.id === selected?.id ? "true" : undefined}
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-colors",
                      p.id === selected?.id
                        ? "bg-brand-400 text-ink-950"
                        : "border border-line bg-ink-900 text-muted hover:text-fg",
                    )}
                  >
                    {isLocked(p) ? <Lock size={11} aria-hidden /> : null}
                    {p.level ?? p.title}
                  </Link>
                ))}
              </div>
              {selected ? (
                <>
                  <p className="mt-4 text-sm font-semibold text-fg">{selected.title}</p>
                  <p className="text-xs text-muted">{wordCounts[selected.id] ?? 0} ta so&apos;z</p>
                  <ButtonLink href={playHref(selected)} size="lg" fullWidth className="mt-5">
                    {isLocked(selected) ? "Premiumni ochish" : "Jangni boshlash"}
                  </ButtonLink>
                </>
              ) : null}
              <p className="mt-4 text-[13px] italic text-muted">
                {stats?.best_game
                  ? `Eng yaxshi natijangizni yangilang: ${formatXp(stats.best_game)} XP`
                  : "Birinchi o'yiningiz — birinchi rekordingiz!"}
              </p>
            </Reveal>

            {/* ------------------------------------------------ Namuna savol */}
            <Reveal delay={80} className="rounded-2xl border-[1.5px] border-brand-400/80 bg-ink-900 p-7 shadow-[0_24px_60px_-30px_rgba(227,167,155,0.35)]">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold text-gold-400">Savol 1 / {GAME_QUESTION_COUNT}</span>
                <span className="inline-flex items-center gap-1 rounded bg-ink-700 px-2 py-1 text-[11px] font-semibold text-gold-400">
                  <Zap size={11} aria-hidden /> Namuna
                </span>
              </div>
              <div className="mt-4 h-1 overflow-hidden rounded-full bg-ink-700">
                <div className="h-full w-[5%] rounded-full bg-brand-400" />
              </div>
              <div className="mt-3 flex justify-between text-[13px]">
                <span className="text-muted">Qolgan vaqt</span>
                <span className="font-semibold tabular-nums text-brand-400">00:15</span>
              </div>
              <p className="display-title mt-3 text-[24px] leading-snug">
                “Achievement” so&apos;zining ma&apos;nosi?
              </p>
              <ul className="mt-5 space-y-2.5" aria-label="Namuna javoblar">
                {DEMO_OPTIONS.map((o, i) => (
                  <li
                    key={o}
                    className={cn(
                      "rounded-lg border px-3.5 py-2.5 text-sm",
                      i === 1 ? "border-success bg-success/10 text-success" : "border-line bg-ink-800 text-fg",
                    )}
                  >
                    {o}
                  </li>
                ))}
              </ul>
              <p className="mt-5 text-xs leading-relaxed text-muted">
                To&apos;g&apos;ri javob: <strong className="text-fg">+{GAME_BASE_POINTS}</strong> ball,
                tezlik bonusi: <strong className="text-fg">+{GAME_MAX_BONUS}</strong> gacha.
              </p>
            </Reveal>

            {/* ------------------------------------------------ Sizning natijangiz */}
            <Reveal delay={160} className="card flex flex-col justify-center rounded-2xl p-7">
              <span className="self-center rounded bg-success/15 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-success">
                {profile ? "Sizning natijangiz" : "Reytingga qo'shiling"}
              </span>
              <p className="mt-4 text-center text-[13px] uppercase tracking-wide text-muted">Umumiy XP</p>
              <p className="text-center font-display text-5xl text-gold-400 lining-nums">
                {formatXp(stats?.total_xp ?? profile?.total_xp ?? 0)}
              </p>
              <span aria-hidden className="my-5 block h-px bg-line" />
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted">O&apos;yinlar:</dt>
                  <dd className="font-semibold text-fg tabular-nums">{stats?.games_played ?? 0}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted">Eng yaxshi o&apos;yin:</dt>
                  <dd className="font-semibold text-success tabular-nums">
                    {stats?.best_game ? `${formatXp(stats.best_game)} XP` : "—"}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted">O&apos;rningiz:</dt>
                  <dd className="font-semibold text-brand-400 tabular-nums">{me ? `#${me.rank}` : "—"}</dd>
                </div>
              </dl>
              <div className="mt-6 space-y-3">
                {selected ? (
                  <ButtonLink href={playHref(selected)} fullWidth>
                    {profile ? "O'ynash" : "Kirish va o'ynash"}
                  </ButtonLink>
                ) : null}
                <ButtonLink href="/leaderboard" variant="secondary" fullWidth>
                  To&apos;liq reyting
                </ButtonLink>
              </div>
            </Reveal>

            {/* ------------------------------------------------ Top Climbers */}
            <Reveal delay={240}>
              <TopClimbers
                rows={top}
                period={period}
                me={me}
                myName={profile?.full_name}
                myAvatar={profile?.avatar_url}
                hrefFor={(p) => query({ period: p })}
              />
            </Reveal>
          </div>
        )}

        {/* ------------------------------------------------ Barcha to'plamlar */}
        {packs.length > 0 ? (
          <section className="mt-20">
            <Reveal>
              <h2 className="display-title text-[34px]">Barcha to&apos;plamlar</h2>
            </Reveal>
            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {packs.map((pack, i) => {
                const locked = isLocked(pack);
                return (
                  <Reveal key={pack.id} delay={(i % 3) * 70}>
                    <Link
                      href={playHref(pack)}
                      className="group card lift flex h-full flex-col p-6 hover:border-brand-400/40"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted">
                          {pack.level ?? "Vocabulary"}
                        </span>
                        {pack.is_premium ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-gold-400">
                            {locked ? <Lock size={12} aria-hidden /> : null} Premium
                          </span>
                        ) : (
                          <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-success">Bepul</span>
                        )}
                      </div>
                      <h3 className="display-title mt-3 text-[24px]">{pack.title}</h3>
                      {pack.description ? (
                        <p className="mt-1.5 text-sm leading-relaxed text-muted line-clamp-2">{pack.description}</p>
                      ) : null}
                      <div className="mt-auto flex items-center justify-between pt-5 text-[13px]">
                        <span className="text-muted">{wordCounts[pack.id] ?? 0} ta so&apos;z</span>
                        <span className="font-semibold text-brand-400 transition-transform group-hover:translate-x-1">
                          {locked ? "Premium →" : "O'ynash →"}
                        </span>
                      </div>
                    </Link>
                  </Reveal>
                );
              })}
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}
