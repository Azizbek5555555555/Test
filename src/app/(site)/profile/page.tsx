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

export const metadata: Metadata = {
  title: "Mening profilim",
  robots: { index: false, follow: false },
};

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

const ACTIVITY_META: Record<ActivityItem["status"], { dot: string; label: string }> = {
  in_progress: { dot: "bg-gold-400", label: "davom etmoqda" },
  submitted: { dot: "bg-warning", label: "tekshiruvda" },
  graded: { dot: "bg-success", label: "baholandi" },
  abandoned: { dot: "bg-ink-500", label: "bekor qilingan" },
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

  const [stats, rank, data] = await Promise.all([
    getMyStats(),
    getMyRank("weekly"),
    getDashboardData(),
  ]);

  const isPremium = profileHasPremium(profile);
  const firstName = profile.full_name?.trim().split(/\s+/)[0] ?? "o'quvchi";
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
      label: "Topshirilgan testlar",
      hint: "Barcha bo'limlar bo'yicha",
    },
    { value: data.graded, label: "Baholangan", hint: "Natijasi tayyor testlar" },
    { value: data.inProgress, label: "Tugallanmagan", hint: "Davom ettirish mumkin" },
    {
      value: formatXp(stats?.total_xp ?? profile.total_xp),
      label: "Vocabulary XP",
      hint: rank ? `Haftalik reytingda #${rank.rank}` : "Vocabulary Battle ochkolari",
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
              Shaxsiy kabinet
            </p>
            <h1 className="display-title mt-4 text-[40px] sm:text-[52px]">
              Xush kelibsiz, {firstName}
            </h1>
            <p className="mt-4 font-display text-lg italic text-brand-400 sm:text-xl">
              “Muvaffaqiyat — har kuni takrorlanadigan kichik harakatlar yig&apos;indisi.”
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-ink-800/70 px-3.5 py-2 text-[13px] text-muted">
                Joriy daraja:
                <strong className="font-semibold text-gold-400">
                  {level ? `${level} o'quvchi` : "aniqlanmagan"}
                </strong>
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-ink-800/70 px-3.5 py-2 text-[13px] text-muted">
                <FlameIcon className="size-4 text-gold-400" />
                Streak:
                <strong className="font-semibold text-gold-400">{data.streakDays} kun</strong>
              </span>
            </div>
          </div>

          <div className="card-glass grid shrink-0 place-items-center self-center rounded-2xl p-5 md:self-auto animate-pop">
            <ProgressRing value={data.overall ?? 0} size={180} stroke={10}>
              <div>
                <p className="font-display text-5xl leading-none text-fg lining-nums">
                  {data.overall != null ? `${data.overall}%` : "—"}
                </p>
                <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">
                  Umumiy natija
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
            <SectionEyebrow>CEFR ko&apos;nikmalar darajasi</SectionEyebrow>
            <div className="card rounded-2xl p-6 sm:p-8">
              <div className="grid grid-cols-2 gap-y-8 sm:grid-cols-4">
                {SECTIONS.map((section) => {
                  const value = data.skills[section];
                  return (
                    <div key={section} className="flex flex-col items-center gap-3">
                      <ProgressRing value={value ?? 0} size={100} stroke={8} color={SKILL_COLOR[section]}>
                        <span className="font-display text-xl text-fg lining-nums">
                          {value != null ? `${value}%` : "—"}
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
                    Eng kuchli bo&apos;limingiz —{" "}
                    <strong className={`font-semibold ${SKILL_TEXT[strongest]}`}>
                      {SECTION_LABEL[strongest]}
                    </strong>
                    .
                    {weakest ? (
                      <>
                        {" "}
                        CEFR darajangizni oshirish uchun{" "}
                        <strong className={`font-semibold ${SKILL_TEXT[weakest]}`}>
                          {SECTION_LABEL[weakest]}
                        </strong>{" "}
                        bo&apos;limini ko&apos;proq mashq qiling.
                      </>
                    ) : null}
                  </>
                ) : (
                  <>
                    Birinchi mock testni ishlang — har bir bo&apos;lim bo&apos;yicha
                    natijangiz shu yerda ko&apos;rinadi.{" "}
                    <Link href="/full-mock" className="font-semibold text-brand-400 hover:underline">
                      Full Mock testlar →
                    </Link>
                  </>
                )}
              </div>
            </div>
          </Reveal>

          <Reveal delay={100}>
            <SectionEyebrow>So&apos;nggi faollik</SectionEyebrow>
            <div className="card rounded-2xl p-4 sm:p-6">
              {data.recent.length === 0 ? (
                <p className="px-2 py-6 text-center text-sm text-muted">
                  Hali faollik yo&apos;q. Birinchi testni boshlang!
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
                              {meta.label} · {timeAgo(item.at)}
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
                Barcha natijalar <ChevronRight size={15} aria-hidden />
              </Link>
            </div>
          </Reveal>
        </section>

        {/* ------------------------------------------------ Hisob ma'lumotlari */}
        <Reveal as="section" className="card-glass mt-14 flex flex-col items-start gap-5 rounded-2xl p-5 sm:flex-row sm:items-center sm:p-6">
          <Avatar name={profile.full_name} src={profile.avatar_url} size="lg" ring={isPremium} />
          <div className="min-w-0 w-full flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-display text-2xl text-fg">{profile.full_name ?? "Foydalanuvchi"}</p>
              {isPremium ? <Badge tone="premium">PREMIUM</Badge> : <Badge tone="neutral">FREE</Badge>}
              {profile.role !== "student" ? (
                <Badge tone="brand">{profile.role === "admin" ? "Admin" : "O'qituvchi"}</Badge>
              ) : null}
            </div>
            <p className="mt-1 truncate text-sm text-muted">{profile.email}</p>
            <p className="mt-1 text-xs text-muted">
              Ro&apos;yxatdan o&apos;tgan: {formatDate(profile.created_at)}
              {isPremium && profile.premium_until
                ? ` · Premium muddati: ${formatDate(profile.premium_until)}`
                : ""}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <ButtonLink href="/profile/settings" variant="glass" size="sm">
              <Settings size={15} aria-hidden /> Sozlamalar
            </ButtonLink>
            {!isPremium ? (
              <ButtonLink href="/premium" variant="premium" size="sm">
                <Star size={15} aria-hidden /> Premium olish
              </ButtonLink>
            ) : null}
          </div>
        </Reveal>
      </div>
    </div>
  );
}
