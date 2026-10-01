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
import { getT } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return {
    title: "Vocabulary Battle",
    description: t(
      "Kahoot uslubidagi so'z o'yini: tez javob bering, ball to'plang va haftalik reytingda yuqoriga chiqing.",
      "A Kahoot-style word game: answer fast, score points and climb the weekly leaderboard.",
    ),
  };
}

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

  const [profile, packs, top, me, stats, t] = await Promise.all([
    getProfile(),
    getVocabPacks(),
    getLeaderboard(period, 5),
    getMyRank(period),
    getMyStats(),
    getT(),
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
    <div className="bg-gradient-to-b from-[#0f2a3d] via-[#0c1c33] via-40% to-ink-950">
      <PageHero
        eyebrow={t("Jonli so'z maydoni", "Live word arena")}
        title="Vocabulary Battle"
        highlight="Battle"
        hand="Learn words. Win points."
        words={["eloquent", "resilient", "+100 XP", "coherent"]}
        className="pb-10"
        bare
      >
        {t(
          "O'rgan. O'yna. Bellash. O's. Akademik so'zlarni vaqt bosimi ostida mustahkamlang.",
          "Learn. Play. Compete. Grow. Master academic words under time pressure.",
        )}
      </PageHero>

      <div className="container-page">
        {packs.length === 0 ? (
          <EmptyState
            icon="📘"
            title={t("To'plamlar hali qo'shilmagan", "No word packs yet")}
            description={t("Tez orada yangi so'z to'plamlari qo'shiladi.", "New word packs are coming soon.")}
          />
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-[1fr_1fr_1fr_1.35fr]">
            {/* ------------------------------------------------ Lobby */}
            <Reveal className="card flex flex-col items-center justify-center rounded-2xl p-7 text-center">
              <span className="rounded bg-ink-700 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-brand-300">
                Lobby
              </span>
              <h2 className="display-title mt-4 text-[28px]">{t("Cho'qqiga tayyormisiz?", "Ready for the summit?")}</h2>
              <p className="mt-2 text-sm text-muted">{t("Jangni boshlash uchun to'plamni tanlang.", "Choose a pack to start the battle.")}</p>
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
                  <p className="text-xs text-muted">{wordCounts[selected.id] ?? 0} {t("ta so'z", "words")}</p>
                  <ButtonLink href={playHref(selected)} size="lg" fullWidth className="mt-5">
                    {isLocked(selected) ? t("Premiumni ochish", "Unlock Premium") : t("Jangni boshlash", "Start the battle")}
                  </ButtonLink>
                </>
              ) : null}
              <p className="mt-4 text-[13px] italic text-muted">
                {stats?.best_game
                  ? t(
                      `Eng yaxshi natijangizni yangilang: ${formatXp(stats.best_game)} XP`,
                      `Beat your best score: ${formatXp(stats.best_game)} XP`,
                    )
                  : t("Birinchi o'yiningiz — birinchi rekordingiz!", "Your first game — your first record!")}
              </p>
            </Reveal>

            {/* ------------------------------------------------ Namuna savol */}
            <Reveal delay={80} className="rounded-2xl border-[1.5px] border-brand-400/80 bg-ink-900 p-7 shadow-[0_24px_60px_-30px_rgba(16, 191, 166,0.35)]">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold text-gold-400">{t("Savol", "Question")} 1 / {GAME_QUESTION_COUNT}</span>
                <span className="inline-flex items-center gap-1 rounded bg-ink-700 px-2 py-1 text-[11px] font-semibold text-gold-400">
                  <Zap size={11} aria-hidden /> {t("Namuna", "Sample")}
                </span>
              </div>
              <div className="mt-4 h-1 overflow-hidden rounded-full bg-ink-700">
                <div className="h-full w-[5%] rounded-full bg-brand-400" />
              </div>
              <div className="mt-3 flex justify-between text-[13px]">
                <span className="text-muted">{t("Qolgan vaqt", "Time left")}</span>
                <span className="font-semibold tabular-nums text-brand-400">00:15</span>
              </div>
              <p className="display-title mt-3 text-[24px] leading-snug">
                {t("“Achievement” so'zining ma'nosi?", "What does “Achievement” mean?")}
              </p>
              <ul className="mt-5 space-y-2.5" aria-label={t("Namuna javoblar", "Sample answers")}>
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
                {t("To'g'ri javob", "Correct answer")}: <strong className="text-fg">+{GAME_BASE_POINTS}</strong>{" "}
                {t("ball, tezlik bonusi", "points, speed bonus up to")}:{" "}
                <strong className="text-fg">+{GAME_MAX_BONUS}</strong>
                {t(" gacha.", ".")}
              </p>
            </Reveal>

            {/* ------------------------------------------------ Sizning natijangiz */}
            <Reveal delay={160} className="card flex flex-col justify-center rounded-2xl p-7">
              <span className="self-center rounded bg-success/15 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-success">
                {profile ? t("Sizning natijangiz", "Your stats") : t("Reytingga qo'shiling", "Join the leaderboard")}
              </span>
              <p className="mt-4 text-center text-[13px] uppercase tracking-wide text-muted">{t("Umumiy XP", "Total XP")}</p>
              <p className="text-center font-display text-5xl text-gold-400 lining-nums">
                {formatXp(stats?.total_xp ?? profile?.total_xp ?? 0)}
              </p>
              <span aria-hidden className="my-5 block h-px bg-line" />
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted">{t("O'yinlar", "Games")}:</dt>
                  <dd className="font-semibold text-fg tabular-nums">{stats?.games_played ?? 0}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted">{t("Eng yaxshi o'yin", "Best game")}:</dt>
                  <dd className="font-semibold text-success tabular-nums">
                    {stats?.best_game ? `${formatXp(stats.best_game)} XP` : "—"}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted">{t("O'rningiz", "Your rank")}:</dt>
                  <dd className="font-semibold text-brand-400 tabular-nums">{me ? `#${me.rank}` : "—"}</dd>
                </div>
              </dl>
              <div className="mt-6 space-y-3">
                {selected ? (
                  <ButtonLink href={playHref(selected)} fullWidth>
                    {profile ? t("O'ynash", "Play") : t("Kirish va o'ynash", "Log in and play")}
                  </ButtonLink>
                ) : null}
                <ButtonLink href="/leaderboard" variant="secondary" fullWidth>
                  {t("To'liq reyting", "Full leaderboard")}
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
              <h2 className="display-title text-[34px]">{t("Barcha to'plamlar", "All packs")}</h2>
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
                          <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-success">{t("Bepul", "Free")}</span>
                        )}
                      </div>
                      <h3 className="display-title mt-3 text-[24px]">{pack.title}</h3>
                      {pack.description ? (
                        <p className="mt-1.5 text-sm leading-relaxed text-muted line-clamp-2">{pack.description}</p>
                      ) : null}
                      <div className="mt-auto flex items-center justify-between pt-5 text-[13px]">
                        <span className="text-muted">{wordCounts[pack.id] ?? 0} {t("ta so'z", "words")}</span>
                        <span className="font-semibold text-brand-400 transition-transform group-hover:translate-x-1">
                          {locked ? "Premium →" : `${t("O'ynash", "Play")} →`}
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
