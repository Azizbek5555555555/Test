import type { Metadata } from "next";
import { getProfile } from "@/lib/auth";
import { getLeaderboard, getMyRank } from "@/lib/queries";
import { LEADERBOARD_PERIODS, type LeaderboardPeriod } from "@/lib/constants";
import { formatXp, cn } from "@/lib/format";
import { PageHeader, EmptyState } from "@/components/ui/Card";
import { LinkTabs } from "@/components/ui/Tabs";
import { Avatar } from "@/components/ui/Avatar";
import { ButtonLink } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "Vocabulary Leaderboard",
  description:
    "Vocabulary Battle reytingi: Daily, Weekly, Monthly va All Time bo'yicha eng yaxshi o'yinchilar.",
};

const PERIOD_LABEL: Record<LeaderboardPeriod, string> = {
  daily: "Bugungi",
  weekly: "Haftalik",
  monthly: "Oylik",
  all: "Umumiy",
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

  const [profile, rows, myRank] = await Promise.all([
    getProfile(),
    getLeaderboard(active, 100),
    getMyRank(active),
  ]);

  const tabs = LEADERBOARD_PERIODS.map((p) => ({
    id: p.id,
    label: p.label,
    href: `/leaderboard?period=${p.id}`,
  }));

  const podium = rows.slice(0, 3);
  const rest = rows.slice(3);

  return (
    <div className="container-page py-10">
      <PageHeader
        eyebrow="Vocabulary Battle"
        title="Leaderboard"
        description="Vocabulary game uchun alohida reyting. Bu tizim o'quvchilar orasida musobaqa va doimiy qaytib kirish motivatsiyasini yaratadi."
      >
        <LinkTabs items={tabs} activeId={active} />
      </PageHeader>

      {rows.length === 0 ? (
        <EmptyState
          icon="🏆"
          title={`${PERIOD_LABEL[active]} reyting hali bo'sh`}
          description="Birinchi bo'lib o'ynang va reytingni boshlang!"
          action={<ButtonLink href="/vocabulary-battle">🎮 O&apos;ynash</ButtonLink>}
        />
      ) : (
        <>
          {/* --------------------------------------------- Podium */}
          {podium.length >= 3 ? (
            <div className="grid grid-cols-3 gap-3 sm:gap-5 mb-8 items-end">
              {[podium[1], podium[0], podium[2]].map((player, i) => {
                const place = [2, 1, 3][i];
                const heights = ["pt-8", "pt-2", "pt-12"];
                const medals = ["🥈", "🥇", "🥉"];
                const isMe = player.user_id === profile?.id;

                return (
                  <div key={player.user_id} className={heights[i]}>
                    <div
                      className={cn(
                        "card p-4 text-center",
                        place === 1 &&
                          "border-gold-300 dark:border-gold-700 bg-gradient-to-b from-gold-50 to-surface dark:from-gold-950/40",
                        isMe && "ring-2 ring-brand-500",
                      )}
                    >
                      <p className="text-3xl mb-2" aria-hidden>
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
                      <p className="text-lg font-extrabold tabular-nums text-brand-600 dark:text-brand-400 mt-1">
                        {formatXp(player.xp)}
                      </p>
                      <p className="text-xs text-muted">
                        {player.games} o&apos;yin
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : null}

          {/* --------------------------------------------- Ro'yxat */}
          <div className="card p-0 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line bg-[var(--bg-subtle)]">
                  <th className="text-left font-bold px-4 py-3 w-16">#</th>
                  <th className="text-left font-bold px-4 py-3">O&apos;yinchi</th>
                  <th className="text-right font-bold px-4 py-3 hidden sm:table-cell">
                    O&apos;yinlar
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
                        isMe && "bg-brand-50 dark:bg-brand-950/40",
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
                              className="text-xs text-gold-600 dark:text-gold-400 shrink-0"
                              title="Premium"
                            >
                              ⭐
                            </span>
                          ) : null}
                          {isMe ? (
                            <span className="text-xs font-bold text-brand-600 dark:text-brand-400 shrink-0">
                              (siz)
                            </span>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-muted hidden sm:table-cell">
                        {player.games}
                      </td>
                      <td className="px-4 py-3 text-right font-extrabold tabular-nums">
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
            <div className="card p-5 mt-6 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Avatar
                  name={profile.full_name}
                  src={profile.avatar_url}
                  size="md"
                />
                <div>
                  <p className="font-bold">
                    {profile.full_name ?? "Siz"}
                  </p>
                  <p className="text-xs text-muted">
                    {PERIOD_LABEL[active]} reyting
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="text-center">
                  <p className="text-xs text-muted font-semibold">Your Rank</p>
                  <p className="text-xl font-extrabold tabular-nums">
                    {myRank ? `#${myRank.rank}` : "—"}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted font-semibold">XP</p>
                  <p className="text-xl font-extrabold tabular-nums">
                    {formatXp(myRank?.xp ?? 0)}
                  </p>
                </div>
                <ButtonLink href="/vocabulary-battle">🎮 O&apos;ynash</ButtonLink>
              </div>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
