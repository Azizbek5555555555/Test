import type { Metadata } from "next";
import { getProfile } from "@/lib/auth";
import { getLeaderboard, getMyRank } from "@/lib/queries";
import { LEADERBOARD_PERIODS, type LeaderboardPeriod } from "@/lib/constants";
import { formatXp, cn } from "@/lib/format";
import { EmptyState } from "@/components/ui/Card";
import { PageHero } from "@/components/marketing/PageHero";
import { ChipLink, ChipRow } from "@/components/ui/ChipLink";
import { Avatar } from "@/components/ui/Avatar";
import { ButtonLink } from "@/components/ui/Button";
import { getT } from "@/i18n/server";
import type { Bi } from "@/i18n";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return {
    title: "Vocabulary Leaderboard",
    description: t(
      "Vocabulary Battle reytingi: Daily, Weekly, Monthly va All Time bo'yicha eng yaxshi o'yinchilar.",
      "Vocabulary Battle leaderboard: the best players Daily, Weekly, Monthly and All Time.",
    ),
  };
}

const PERIOD_LABEL: Record<LeaderboardPeriod, Bi> = {
  daily: { uz: "Bugungi", en: "Today's" },
  weekly: { uz: "Haftalik", en: "Weekly" },
  monthly: { uz: "Oylik", en: "Monthly" },
  all: { uz: "Umumiy", en: "All-time" },
};

export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const { period } = await searchParams;
  const active = (
    LEADERBOARD_PERIODS.some((p) => p.id === period) ? period : "weekly"
  ) as LeaderboardPeriod;

  const [profile, rows, myRank, t] = await Promise.all([
    getProfile(),
    getLeaderboard(active, 100),
    getMyRank(active),
    getT(),
  ]);

  const tabs = LEADERBOARD_PERIODS.map((p) => ({
    id: p.id,
    label: p.label,
    href: `/leaderboard?period=${p.id}`,
  }));

  const podium = rows.slice(0, 3);
  const rest = rows.slice(3);

  return (
    <div className="bg-gradient-to-b from-[#221d2e] via-[#141a2c] via-40% to-ink-950">
      <PageHero
        eyebrow="Vocabulary Battle"
        title="Top Climbers"
        highlight="Climbers"
        hand="Climb to the top"
        words={["weekly", "+250 XP", "streak", "rank #1"]}
        className="pb-10"
        bare
      >
        {t(
          "Vocabulary Battle reytingi: eng faol o'quvchilar. Har kuni o'ynang va cho'qqiga ko'tariling.",
          "The Vocabulary Battle leaderboard: the most active learners. Play every day and climb to the top.",
        )}
      </PageHero>
      <div className="container-page">
        <ChipRow className="mb-8">
          {tabs.map((tab) => (
            <ChipLink key={tab.id} href={tab.href} active={tab.id === active}>
              {tab.label}
            </ChipLink>
          ))}
        </ChipRow>

        {rows.length === 0 ? (
          <EmptyState
            icon="🏆"
            title={t(`${t(PERIOD_LABEL[active])} reyting hali bo'sh`, `The ${t(PERIOD_LABEL[active]).toLowerCase()} leaderboard is empty`)}
            description={t("Birinchi bo'lib o'ynang va reytingni boshlang!", "Be the first to play and start the leaderboard!")}
            action={
              <ButtonLink href="/vocabulary-battle">{t("O'ynash", "Play")}</ButtonLink>
            }
          />
        ) : (
          <>
            {/* --------------------------------------------- Podium */}
            {podium.length >= 3 ? (
              <div className="grid grid-cols-3 gap-3 sm:gap-5 mb-8 items-end">
                {[podium[1], podium[0], podium[2]].map((player, i) => {
                  const place = [2, 1, 3][i];
                  const heights = ["pt-8", "pt-2", "pt-12"];
                  const medals = ["2", "1", "3"];
                  const isMe = player.user_id === profile?.id;

                  return (
                    <div key={player.user_id} className={heights[i]}>
                      <div
                        className={cn(
                          "card rounded-2xl p-4 text-center sm:p-6",
                          place === 1 &&
                            "border-gold-400/60 bg-gradient-to-b from-gold-400/15 to-ink-900",
                          isMe && "ring-2 ring-brand-400",
                        )}
                      >
                        <p
                          className={cn(
                            "mb-3 font-display text-3xl lining-nums",
                            place === 1 ? "text-gold-400" : "text-muted",
                          )}
                          aria-label={t(`${place}-o'rin`, `Place ${place}`)}
                        >
                          {medals[i]}
                        </p>
                        <Avatar
                          name={player.full_name}
                          src={player.avatar_url}
                          size="lg"
                          ring={player.is_premium}
                          className="mx-auto"
                        />
                        <p className="font-bold text-sm mt-2.5 truncate">
                          {player.full_name}
                        </p>
                        <p className="mt-1 text-lg font-semibold tabular-nums text-brand-400">
                          {formatXp(player.xp)}
                        </p>
                        <p className="text-xs text-muted">
                          {player.games} {t("o'yin", "games")}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : null}

            {/* --------------------------------------------- Ro'yxat */}
            <div className="card overflow-hidden rounded-2xl p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-line bg-ink-800 text-[11px] uppercase tracking-[0.08em] text-muted">
                    <th className="text-left font-bold px-4 py-3 w-16">#</th>
                    <th className="text-left font-bold px-4 py-3">
                      {t("O'yinchi", "Player")}
                    </th>
                    <th className="text-right font-bold px-4 py-3 hidden sm:table-cell">
                      {t("O'yinlar", "Games")}
                    </th>
                    <th className="text-right font-bold px-4 py-3">XP</th>
                  </tr>
                </thead>
                <tbody>
                  {(podium.length >= 3 ? rest : rows).map((player) => {
                    const isMe = player.user_id === profile?.id;
                    return (
                      <tr
                        key={player.user_id}
                        className={cn(
                          "border-b border-line last:border-0",
                          isMe && "bg-brand-400/10",
                        )}
                      >
                        <td className="px-4 py-3 font-bold tabular-nums text-muted">
                          {player.rank}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <Avatar
                              name={player.full_name}
                              src={player.avatar_url}
                              size="sm"
                              ring={player.is_premium}
                            />
                            <span className="font-semibold truncate">
                              {player.full_name}
                            </span>
                            {player.is_premium ? (
                              <span
                                className="shrink-0 text-xs text-gold-400"
                                title="Premium"
                              >
                                ★
                              </span>
                            ) : null}
                            {isMe ? (
                              <span className="text-xs font-bold text-brand-400 shrink-0">
                                ({t("siz", "you")})
                              </span>
                            ) : null}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums text-muted hidden sm:table-cell">
                          {player.games}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold tabular-nums text-brand-400">
                          {formatXp(player.xp)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* --------------------------------------------- Mening o'rnim */}
            {profile ? (
              <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-brand-400/70 bg-brand-400/10 p-5">
                <div className="flex items-center gap-3">
                  <Avatar
                    name={profile.full_name}
                    src={profile.avatar_url}
                    size="md"
                  />
                  <div>
                    <p className="font-bold">{profile.full_name ?? t("Siz", "You")}</p>
                    <p className="text-xs text-muted">
                      {t(`${t(PERIOD_LABEL[active])} reyting`, `${t(PERIOD_LABEL[active])} leaderboard`)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <p className="text-xs font-semibold text-muted">
                      {t("O'rningiz", "Your rank")}
                    </p>
                    <p className="font-display text-2xl lining-nums">
                      {myRank ? `#${myRank.rank}` : "—"}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-semibold text-muted">XP</p>
                    <p className="font-display text-2xl text-gold-400 lining-nums">
                      {formatXp(myRank?.xp ?? 0)}
                    </p>
                  </div>
                  <ButtonLink href="/vocabulary-battle">
                    {t("O'ynash", "Play")}
                  </ButtonLink>
                </div>
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
