import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronRight, Settings, Star } from "react-feather";
import { getProfile, profileHasPremium } from "@/lib/auth";
import { getMyRank, getMyStats } from "@/lib/queries";
import { getDashboardData, type ActivityItem } from "@/lib/home";
import { SECTIONS, SECTION_LABEL } from "@/lib/constants";
import { formatDate, formatXp, timeAgo } from "@/lib/format";
import type { SkillSection } from "@/lib/types";
import { ButtonLink } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { FlameIcon } from "@/components/ui/icons";
import { Reveal } from "@/components/motion/Reveal";
import { MAX_SCORE, scorePercent } from "@/lib/scoring";
import { getT } from "@/i18n/server";
import type { Bi } from "@/i18n";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("Mening profilim", "My profile"), robots: { index: false, follow: false } };
}

/** Figma: har bir ko'nikma halqasining rangi */
const SKILL_COLOR: Record<SkillSection, string> = {
  reading: "var(--color-brand-400)",
  listening: "var(--color-gold-400)",
  writing: "var(--color-success)",
  speaking: "var(--color-warning)",
};

const SKILL_TEXT: Record<SkillSection, string> = {
  reading: "text-brand-400",
  listening: "text-gold-400",
  writing: "text-success",
  speaking: "text-warning",
};

const ACTIVITY_META: Record<ActivityItem["status"], { dot: string; label: Bi }> = {
  in_progress: { dot: "bg-gold-400", label: { uz: "davom etmoqda", en: "in progress" } },
  submitted: { dot: "bg-warning", label: { uz: "tekshiruvda", en: "in review" } },
  graded: { dot: "bg-success", label: { uz: "baholandi", en: "graded" } },
  abandoned: { dot: "bg-ink-500", label: { uz: "bekor qilingan", en: "cancelled" } },
};

function SectionEyebrow({ children }: { children: string }) {
  return (
    <p className="eyebrow mb-5">
      <span className="h-px w-6 bg-brand-400" aria-hidden />
      {children}
    </p>
  );
}

export default async function ProfilePage() {
  const profile = await getProfile();
  if (!profile) redirect(`/login?next=${encodeURIComponent("/profile")}`);

  const [stats, rank, data, t] = await Promise.all([
    getMyStats(),
    getMyRank("weekly"),
    getDashboardData(),
    getT(),
  ]);

  const isPremium = profileHasPremium(profile);
  const firstName = profile.full_name?.trim().split(/\s+/)[0] ?? t("o'quvchi", "learner");
  const level = stats?.last_level ?? null;

  // Eng kuchli va eng zaif bo'lim — maslahat matni uchun
  const scored = SECTIONS.filter((s) => data.skills[s] != null).sort(
    (a, b) => (data.skills[b] ?? 0) - (data.skills[a] ?? 0),
  );
  const strongest = scored[0];
  const weakest = scored.length > 1 ? scored[scored.length - 1] : undefined;

  const statCards = [
    {
      value: stats?.tests_taken ?? data.taken,
      label: t("Topshirilgan testlar", "Tests taken"),
      hint: t("Barcha bo'limlar bo'yicha", "Across all sections"),
    },
    { value: data.graded, label: t("Baholangan", "Graded"), hint: t("Natijasi tayyor testlar", "Tests with results ready") },
    { value: data.inProgress, label: t("Tugallanmagan", "Unfinished"), hint: t("Davom ettirish mumkin", "Can be continued") },
    {
      value: formatXp(stats?.total_xp ?? profile.total_xp),
      label: "Vocabulary XP",
      hint: rank ? t(`Haftalik reytingda #${rank.rank}`, `#${rank.rank} on the weekly leaderboard`) : t("Vocabulary Battle ochkolari", "Vocabulary Battle points"),
    },
  ];

  return (
    <div className="bg-gradient-to-b from-[#172431] via-[#141f2d] to-ink-950">
      <div className="container-page pb-20 pt-12 sm:pt-16">
        {/* ------------------------------------------------ Hero */}
        <section className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0 animate-fade-up">
            <p className="eyebrow">
              <span className="h-px w-6 bg-brand-400" aria-hidden />
              {t("Shaxsiy kabinet", "My dashboard")}
            </p>
            <h1 className="display-title mt-4 text-[40px] sm:text-[52px]">
              {t("Xush kelibsiz", "Welcome")}, {firstName}
            </h1>
            <p className="mt-4 font-display text-lg italic text-brand-400 sm:text-xl">
              “{t("Muvaffaqiyat — har kuni takrorlanadigan kichik harakatlar yig'indisi.", "Success is the sum of small efforts repeated every day.")}”
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-ink-800/70 px-3.5 py-2 text-[13px] text-muted">
                {t("Joriy daraja", "Current level")}:
                <strong className="font-semibold text-gold-400">
                  {level ? t(`${level} o'quvchi`, `${level} learner`) : t("aniqlanmagan", "not set yet")}
                </strong>
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-ink-800/70 px-3.5 py-2 text-[13px] text-muted">
                <FlameIcon className="size-4 text-gold-400" />
                Streak:
                <strong className="font-semibold text-gold-400">
                  {data.streakDays} {t("kun", data.streakDays === 1 ? "day" : "days")}
                </strong>
              </span>
            </div>
          </div>

          <div className="card-glass grid shrink-0 place-items-center self-center rounded-2xl p-5 md:self-auto animate-pop">
            <ProgressRing value={scorePercent(data.overall)} size={180} stroke={10}>
              <div>
                <p className="font-display text-5xl leading-none text-fg lining-nums">
                  {data.overall != null ? data.overall : "—"}
                  {data.overall != null ? <small className="text-lg text-muted">/{MAX_SCORE}</small> : null}
                </p>
                <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">
                  {t("Umumiy natija", "Overall result")}
                </p>
              </div>
            </ProgressRing>
          </div>
        </section>

        {/* ------------------------------------------------ Statistika */}
        <section className="mt-12 grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-5">
          {statCards.map((card, i) => (
            <Reveal key={card.label} delay={i * 70} className="card-glass rounded-xl p-5 sm:p-6">
              <p className="font-display text-4xl leading-none text-fg lining-nums">{card.value}</p>
              <p className="mt-4 text-sm font-medium text-fg">{card.label}</p>
              <p className="mt-1 text-xs text-muted">{card.hint}</p>
            </Reveal>
          ))}
        </section>

        {/* ------------------------------------------------ Ko'nikmalar + faollik */}
        <section className="mt-14 grid gap-10 lg:grid-cols-[1.45fr_1fr] lg:gap-8">
          <Reveal>
            <SectionEyebrow>{t("CEFR ko'nikmalar darajasi", "CEFR skill levels")}</SectionEyebrow>
            <div className="card rounded-2xl p-6 sm:p-8">
              <div className="grid grid-cols-2 gap-y-8 sm:grid-cols-4">
                {SECTIONS.map((section) => {
                  const value = data.skills[section];
                  return (
                    <div key={section} className="flex flex-col items-center gap-3">
                      <ProgressRing value={scorePercent(value)} size={100} stroke={8} color={SKILL_COLOR[section]}>
                        <span className="font-display text-xl text-fg lining-nums">
                          {value != null ? value : "—"}
                          {value != null ? <small className="text-xs text-muted">/{MAX_SCORE}</small> : null}
                        </span>
                      </ProgressRing>
                      <span className="text-sm font-semibold text-fg">{SECTION_LABEL[section]}</span>
                    </div>
                  );
                })}
              </div>
              <div className="mt-8 border-t border-line pt-6 text-sm leading-relaxed text-muted">
                {strongest ? (
                  <>
                    {t("Eng kuchli bo'limingiz —", "Your strongest section is")}{" "}
                    <strong className={`font-semibold ${SKILL_TEXT[strongest]}`}>
                      {SECTION_LABEL[strongest]}
                    </strong>
                    .
                    {weakest ? (
                      <>
                        {" "}
                        {t("CEFR darajangizni oshirish uchun", "To raise your CEFR level, practise")}{" "}
                        <strong className={`font-semibold ${SKILL_TEXT[weakest]}`}>
                          {SECTION_LABEL[weakest]}
                        </strong>{" "}
                        {t("bo'limini ko'proq mashq qiling.", "more.")}
                      </>
                    ) : null}
                  </>
                ) : (
                  <>
                    {t(
                      "Birinchi mock testni ishlang — har bir bo'lim bo'yicha natijangiz shu yerda ko'rinadi.",
                      "Take your first mock test — your result for each section will appear here.",
                    )}{" "}
                    <Link href="/full-mock" className="font-semibold text-brand-400 hover:underline">
                      {t("Full Mock testlar", "Full Mock tests")} →
                    </Link>
                  </>
                )}
              </div>
            </div>
          </Reveal>

          <Reveal delay={100}>
            <SectionEyebrow>{t("So'nggi faollik", "Recent activity")}</SectionEyebrow>
            <div className="card rounded-2xl p-4 sm:p-6">
              {data.recent.length === 0 ? (
                <p className="px-2 py-6 text-center text-sm text-muted">
                  {t("Hali faollik yo'q. Birinchi testni boshlang!", "No activity yet. Start your first test!")}
                </p>
              ) : (
                <ul className="space-y-3">
                  {data.recent.map((item) => {
                    const meta = ACTIVITY_META[item.status];
                    return (
                      <li key={item.id}>
                        <Link
                          href={item.href}
                          className="group flex items-center gap-4 rounded-lg bg-ink-800 px-4 py-3.5 transition-colors hover:bg-ink-700"
                        >
                          <span className={`size-2 shrink-0 rounded-full ${meta.dot}`} aria-hidden />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm text-fg">{item.title}</span>
                            <span className="mt-0.5 block text-xs text-muted">
                              {t(meta.label)} · {timeAgo(item.at, undefined, t.locale)}
                            </span>
                          </span>
                          <ChevronRight
                            size={16}
                            className="shrink-0 text-muted transition-transform group-hover:translate-x-0.5"
                            aria-hidden
                          />
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
              <Link
                href="/profile/results"
                className="mt-4 flex items-center justify-center gap-1 text-sm font-semibold text-brand-400 hover:text-brand-300"
              >
                {t("Barcha natijalar", "All results")} <ChevronRight size={15} aria-hidden />
              </Link>
            </div>
          </Reveal>
        </section>

        {/* ------------------------------------------------ Hisob ma'lumotlari */}
        <Reveal as="section" className="card-glass mt-14 flex flex-col items-start gap-5 rounded-2xl p-5 sm:flex-row sm:items-center sm:p-6">
          <Avatar name={profile.full_name} src={profile.avatar_url} size="lg" ring={isPremium} />
          <div className="min-w-0 w-full flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-display text-2xl text-fg">{profile.full_name ?? t("Foydalanuvchi", "User")}</p>
              {isPremium ? <Badge tone="premium">PREMIUM</Badge> : <Badge tone="neutral">FREE</Badge>}
              {profile.role !== "student" ? (
                <Badge tone="brand">{profile.role === "admin" ? "Admin" : t("O'qituvchi", "Teacher")}</Badge>
              ) : null}
            </div>
            <p className="mt-1 truncate text-sm text-muted">{profile.email}</p>
            <p className="mt-1 text-xs text-muted">
              {t("Ro'yxatdan o'tgan", "Joined")}: {formatDate(profile.created_at, t.locale)}
              {isPremium && profile.premium_until
                ? ` · ${t("Premium muddati", "Premium until")}: ${formatDate(profile.premium_until, t.locale)}`
                : ""}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <ButtonLink href="/profile/settings" variant="glass" size="sm">
              <Settings size={15} aria-hidden /> {t("Sozlamalar", "Settings")}
            </ButtonLink>
            {!isPremium ? (
              <ButtonLink href="/premium" variant="premium" size="sm">
                <Star size={15} aria-hidden /> {t("Premium olish", "Get Premium")}
              </ButtonLink>
            ) : null}
          </div>
        </Reveal>
      </div>
    </div>
  );
}
