import Link from "next/link";
import { TrendingUp } from "react-feather";
import type { LeaderboardRow, MyRankRow } from "@/lib/types";
import { LEADERBOARD_PERIODS, type LeaderboardPeriod } from "@/lib/constants";
import { cn, formatXp } from "@/lib/format";
import { Avatar } from "@/components/ui/Avatar";

/** Figma 08: "Top Climbers" — davr tablari, TOP ro'yxat va "Siz" qatori */
export function TopClimbers({
  rows,
  period,
  me,
  myName,
  myAvatar,
  hrefFor,
  limit = 5,
}: {
  rows: LeaderboardRow[];
  period: LeaderboardPeriod;
  me: MyRankRow | null;
  myName?: string | null;
  myAvatar?: string | null;
  hrefFor: (period: LeaderboardPeriod) => string;
  limit?: number;
}) {
  const top = rows.slice(0, limit);
  const meInTop = me ? top.some((r) => r.rank === me.rank) : false;

  return (
    <div className="rounded-2xl border border-line bg-ink-800 p-6 sm:p-7">
      <div className="flex items-center justify-between">
        <h2 className="display-title text-[26px]">Top Climbers</h2>
        <Link href="/leaderboard" aria-label="To'liq reyting" className="text-brand-400 hover:text-brand-300">
          <TrendingUp size={18} aria-hidden />
        </Link>
      </div>

      <div className="mt-5 grid grid-cols-4 rounded-full border border-line bg-ink-900 p-1">
        {LEADERBOARD_PERIODS.map((p) => (
          <Link
            key={p.id}
            href={hrefFor(p.id)}
            scroll={false}
            aria-current={p.id === period ? "true" : undefined}
            className={cn(
              "rounded-full py-1.5 text-center text-xs font-medium transition-colors",
              p.id === period ? "bg-brand-400 text-ink-950" : "text-muted hover:text-fg",
            )}
          >
            {p.label}
          </Link>
        ))}
      </div>

      {top.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted">Bu davrda hali hech kim o&apos;ynamadi.</p>
      ) : (
        <ol className="mt-5 space-y-2.5">
          {top.map((r) => (
            <li
              key={r.user_id}
              className="flex items-center gap-3 rounded-lg bg-ink-900/70 px-3 py-2.5"
            >
              <span className="w-5 font-display text-sm text-muted lining-nums">{r.rank}</span>
              <Avatar name={r.full_name} src={r.avatar_url} size="sm" ring={r.is_premium} />
              <span className="min-w-0 flex-1 truncate text-sm text-fg">{r.full_name}</span>
              <span className="text-sm font-semibold tabular-nums text-brand-400">{formatXp(r.xp)} XP</span>
            </li>
          ))}
        </ol>
      )}

      {me && !meInTop ? (
        <div className="mt-5 flex items-center gap-3 rounded-lg border border-brand-400/70 bg-brand-400/10 px-3 py-2.5">
          <span className="w-5 font-display text-sm text-muted lining-nums">{me.rank}</span>
          <Avatar name={myName ?? "Siz"} src={myAvatar ?? null} size="sm" />
          <span className="flex-1 text-sm font-semibold text-fg">Siz</span>
          <span className="text-sm font-semibold tabular-nums text-brand-400">{formatXp(me.xp)} XP</span>
        </div>
      ) : null}
    </div>
  );
}
