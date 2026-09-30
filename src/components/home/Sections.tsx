import Image from "next/image";
import Link from "next/link";
import type { ComponentType, ReactNode } from "react";
import {
  ArrowRight,
  BookOpen,
  Download,
  Edit,
  FileText,
  Headphones,
  Lock,
  Search,
  Star,
  TrendingUp,
  Volume2,
  Zap,
} from "react-feather";
import { cn } from "@/lib/format";
import { Reveal } from "@/components/motion/Reveal";
import type { Course } from "@/lib/types";

type IconType = ComponentType<{ size?: number; className?: string; strokeWidth?: number }>;

/* ----------------------------------------------------------------------------
   Umumiy: bo'lim sarlavhasi (Figma: 11px accent eyebrow + 48px Cormorant)
   ---------------------------------------------------------------------------- */
export function SectionTitle({
  eyebrow,
  title,
  align = "center",
  action,
}: {
  eyebrow: string;
  title: string;
  align?: "center" | "left";
  action?: ReactNode;
}) {
  return (
    <Reveal
      className={cn(
        "flex flex-col gap-4 mb-10 lg:mb-12",
        align === "center" ? "items-center text-center" : "items-start",
      )}
    >
      <p className="eyebrow">
        {align === "left" ? <span className="h-px w-5 bg-brand-400" aria-hidden /> : null}
        {eyebrow}
      </p>
      <div
        className={cn(
          "w-full flex flex-wrap gap-4",
          align === "center" ? "justify-center" : "items-end justify-between",
        )}
      >
        <h2 className="display-title text-4xl sm:text-5xl lg:text-[48px] text-balance-title">{title}</h2>
        {action}
      </div>
    </Reveal>
  );
}

/* ----------------------------------------------------------------------------
   Statistika lentasi (Figma: stats-glass-strip)
   ---------------------------------------------------------------------------- */
export function StatsRibbon({ items }: { items: { value: string; label: string }[] }) {
  return (
    <section className="container-page pt-12 pb-16 lg:pb-20">
      <Reveal className="card-glass grid grid-cols-2 lg:grid-cols-4 gap-y-8 px-6 sm:px-12 py-8">
        {items.map((item) => (
          <div key={item.label} className="flex flex-col items-center gap-1.5 text-center">
            <p className="font-display font-semibold text-[32px] leading-none text-brand-400 tabular-nums">
              {item.value}
            </p>
            <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-faint">
              {item.label}
            </p>
          </div>
        ))}
      </Reveal>
    </section>
  );
}

/* ----------------------------------------------------------------------------
   Asosiy vositalar — 6 ta karta (Figma: features-section / quick-access)
   ---------------------------------------------------------------------------- */
export interface FeatureItem {
  href: string;
  title: string;
  text: string;
  icon: IconType;
  badge?: { label: string; tone: "accent" | "gold" | "success" };
  premium?: boolean;
}

const BADGE_TONE = {
  accent: "bg-brand-400",
  gold: "bg-gold-400",
  success: "bg-success",
} as const;

export function FeatureGrid({ items, glass = true }: { items: FeatureItem[]; glass?: boolean }) {
  return (
    <div className="grid gap-5 lg:gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item, i) => {
        const Icon = item.icon;
        return (
          <Reveal key={item.href} delay={(i % 3) * 90}>
            <Link
              href={item.href}
              data-spot
              className={cn(
                "spot group relative flex h-full flex-col gap-5 overflow-hidden p-8 lift",
                glass ? "card-glass" : "card",
              )}
            >
              <div className="flex items-center justify-between">
                <Icon
                  size={24}
                  strokeWidth={1.75}
                  className={item.premium ? "text-gold-400" : "text-brand-400"}
                />
                {item.badge ? (
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-1 text-[9px] font-bold uppercase leading-none text-ink-950",
                      BADGE_TONE[item.badge.tone],
                    )}
                  >
                    {item.badge.label}
                  </span>
                ) : null}
              </div>
              <h3 className="display-title text-[28px]">{item.title}</h3>
              <p className="text-sm leading-relaxed text-muted flex-1">{item.text}</p>
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 text-[13px] font-semibold",
                  item.premium ? "text-gold-400" : "text-brand-400",
                )}
              >
                Ochish
                <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
          </Reveal>
        );
      })}
    </div>
  );
}

export function featureItems(opts: { coursesEnabled: boolean; icons: "stars" | "specific" }): FeatureItem[] {
  const star = opts.icons === "stars";
  const items: FeatureItem[] = [
    {
      href: "/full-mock",
      title: "Full Mock",
      text: "Real Multilevel imtihoni formatidagi to'liq mock testni bir o'tirishda ishlang.",
      icon: star ? Star : FileText,
      badge: { label: "Ommabop", tone: "accent" },
    },
    {
      href: "/latest-questions",
      title: "Oxirgi savollar",
      text: "Real imtihonlarda tushgan savollar — yillar bo'yicha jamlangan.",
      icon: star ? Star : Zap,
      badge: star ? undefined : { label: "Yangi", tone: "success" },
    },
    {
      href: "/boost",
      title: "Boost Your English",
      text: "Maqolalar, listening va lug'at — umumiy ingliz tilini mustahkamlang.",
      icon: star ? Star : TrendingUp,
    },
    {
      href: "/vocabulary-battle",
      title: "Vocabulary Battle",
      text: "Taymerli so'z o'yini: tez javob bering, ball to'plang va reytingda ko'tariling.",
      icon: star ? Star : Zap,
      badge: star ? undefined : { label: "Qiziqarli", tone: "gold" },
    },
    {
      href: "/exam-checking",
      title: "Exam Full Checking",
      text: "Real kompyuter imtihoni simulyatsiyasi va Writing/Speaking bo'yicha o'qituvchi bahosi.",
      icon: Lock,
      badge: { label: "Premium", tone: "gold" },
      premium: true,
    },
  ];
  if (opts.coursesEnabled) {
    items.push({
      href: "/courses",
      title: "Offline kurslar",
      text: "Toshkentdagi o'quv markazimizda o'qituvchi bilan intensiv tayyorgarlik.",
      icon: star ? Star : Download,
    });
  } else {
    items.push({
      href: "/leaderboard",
      title: "Reyting",
      text: "Haftalik va oylik reyting: eng faol o'quvchilar qatoriga kiring.",
      icon: star ? Star : TrendingUp,
    });
  }
  return items;
}

/* ----------------------------------------------------------------------------
   Iqtibos (Figma: pull-quote-wrapper — 38px Cormorant italic, accent)
   ---------------------------------------------------------------------------- */
export function PullQuote({ children }: { children: ReactNode }) {
  return (
    <section className="container-page py-20 lg:py-24">
      <Reveal className="flex flex-col items-center gap-8">
        <p className="max-w-3xl text-center font-display italic text-3xl sm:text-[38px] leading-snug text-brand-400">
          “{children}”
        </p>
        <span className="h-px w-20 bg-brand-400/30" aria-hidden />
      </Reveal>
    </section>
  );
}

/* ----------------------------------------------------------------------------
   Yo'l xaritasi — 5 qadam (Figma: how-it-works-section)
   ---------------------------------------------------------------------------- */
const ROADMAP = [
  { title: "Learn", text: "General English, maqolalar va lug'at bilan poydevor quring." },
  { title: "Practice", text: "Reading, Listening, Writing va Speaking bo'yicha mashq qiling." },
  { title: "Take Exam", text: "Full Mock va Exam Checking — qat'iy taymerli real sharoit." },
  { title: "See Result", text: "Ballar, CEFR darajasi va har bir savol bo'yicha tahlil." },
  { title: "Improve", text: "Zaif tomonlaringiz ustida ishlab, keyingi cho'qqiga chiqing." },
];

export function Roadmap() {
  return (
    <section className="container-page py-20 lg:py-20">
      <SectionTitle eyebrow="Metodologiya" title="Cho'qqiga olib boruvchi yo'l" />
      <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-5 lg:gap-5">
        {ROADMAP.map((step, i) => (
          <Reveal key={step.title} delay={i * 110} className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-4">
              <span className="font-display font-semibold text-[32px] leading-none text-brand-400/50 tabular-nums">
                {String(i + 1).padStart(2, "0")}
              </span>
              {i < ROADMAP.length - 1 ? (
                <span className="hidden lg:block h-px w-[100px] bg-line" aria-hidden />
              ) : null}
            </div>
            <h3 className="display-title text-[22px] font-semibold">{step.title}</h3>
            <p className="text-[13px] leading-normal text-muted">{step.text}</p>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ----------------------------------------------------------------------------
   Kurslar (Figma: courses-section — rasmli kartalar)
   ---------------------------------------------------------------------------- */
const COURSE_IMAGES = ["/design/course-1.jpg", "/design/course-2.jpg", "/design/course-3.jpg"];

export function CoursesStrip({ courses }: { courses: Course[] }) {
  if (courses.length === 0) return null;
  return (
    <section className="container-page pt-20 pb-24 lg:pb-28">
      <SectionTitle
        align="left"
        eyebrow="Offline mashg'ulotlar"
        title="Intensiv kurslarimiz"
        action={
          <Link
            href="/courses"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-400 hover:text-brand-300 transition-colors"
          >
            Barcha kurslar <ArrowRight size={14} />
          </Link>
        }
      />
      <div className="grid gap-6 md:grid-cols-3">
        {courses.slice(0, 3).map((course, i) => (
          <Reveal key={course.id} delay={i * 100}>
            <article className="card overflow-hidden h-full flex flex-col lift">
              <div className="relative h-[180px] overflow-hidden">
                <Image
                  src={course.image_url || COURSE_IMAGES[i % COURSE_IMAGES.length]}
                  alt=""
                  fill
                  sizes="(min-width: 768px) 33vw, 100vw"
                  className="object-cover transition-transform duration-700 hover:scale-105"
                />
              </div>
              <div className="flex flex-1 flex-col gap-4 p-6">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold uppercase tracking-[0.08em] text-gold-400">
                    {course.level ?? "Multilevel"}
                  </span>
                  {course.duration ? <span className="text-xs text-faint">{course.duration}</span> : null}
                </div>
                <h3 className="display-title text-2xl font-semibold">{course.title}</h3>
                {course.summary ? (
                  <p className="text-sm leading-normal text-muted flex-1">{course.summary}</p>
                ) : (
                  <span className="flex-1" />
                )}
                <div className="pt-2">
                  <Link
                    href={`/courses/${course.slug}`}
                    className="inline-flex items-center justify-center rounded-full border-[1.5px] border-brand-400 px-6 py-3 text-sm font-semibold text-fg transition-colors hover:bg-brand-400 hover:text-ink-950"
                  >
                    Batafsil
                  </Link>
                </div>
              </div>
            </article>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ----------------------------------------------------------------------------
   To'rt asosiy ko'nikma (Figma: skills-section)
   ---------------------------------------------------------------------------- */
const SKILLS: { title: string; text: string; href: string; icon: IconType; tone: string }[] = [
  { title: "Reading", text: "Matn tuzilishi va tushunib o'qish", href: "/latest-questions", icon: BookOpen, tone: "text-brand-400" },
  { title: "Listening", text: "Kundalik suhbatlar va turli talaffuzlar", href: "/boost/listening", icon: Headphones, tone: "text-gold-400" },
  { title: "Writing", text: "Esse va xat yozish ko'nikmasi", href: "/latest-questions", icon: Edit, tone: "text-success" },
  { title: "Speaking", text: "Savollarga ravon va aniq javob berish", href: "/latest-questions", icon: Volume2, tone: "text-warning" },
];

export function SkillModules() {
  return (
    <section className="container-page pt-5 pb-10">
      <Reveal>
        <p className="eyebrow mb-6">
          <span className="h-px w-5 bg-brand-400" aria-hidden />
          To&apos;rt asosiy ko&apos;nikma
        </p>
      </Reveal>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {SKILLS.map((skill, i) => {
          const Icon = skill.icon;
          return (
            <Reveal key={skill.title} delay={i * 80}>
              <Link href={skill.href} className="card group flex h-full flex-col gap-4 p-7 lift">
                <div className="flex items-center justify-between">
                  <span className="grid place-items-center rounded-full bg-ink-800 p-3">
                    <Icon size={22} strokeWidth={1.75} className="text-brand-400" />
                  </span>
                  <span className="text-xs font-semibold text-faint">CEFR B1–C1</span>
                </div>
                <h3 className="display-title text-[26px] font-semibold">{skill.title}</h3>
                <p className="text-sm leading-normal text-muted flex-1">{skill.text}</p>
                <span className={cn("inline-flex items-center gap-1.5 text-[13px] font-semibold", skill.tone)}>
                  Mashq qilish
                  <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
                </span>
              </Link>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}

/* ----------------------------------------------------------------------------
   Qidiruv (Figma: search-bar)
   ---------------------------------------------------------------------------- */
export function SearchBar() {
  return (
    <section className="container-page pt-5 pb-10">
      <form
        action="/search"
        className="flex items-center gap-4 rounded-full border border-line bg-surface px-6 py-4 transition-colors focus-within:border-brand-400"
        role="search"
      >
        <Search size={20} strokeWidth={1.75} className="shrink-0 text-faint" aria-hidden />
        <input
          type="search"
          name="q"
          placeholder="Mock testlar, maqolalar yoki mavzularni qidiring…"
          className="min-w-0 flex-1 bg-transparent text-[15px] text-fg placeholder:text-faint focus:outline-none"
          aria-label="Qidirish"
        />
      </form>
    </section>
  );
}

/* ----------------------------------------------------------------------------
   Bepul va Premium — taqqoslash jadvali
   ---------------------------------------------------------------------------- */
const COMPARE: { label: string; free: boolean | string; premium: boolean | string }[] = [
  { label: "Bepul Full Mock testlar", free: true, premium: true },
  { label: "Barcha Full Mock testlar", free: false, premium: true },
  { label: "Oxirgi tushgan savollar arxivi", free: "qisman", premium: "to'liq" },
  { label: "Maqolalar va listening mashqlari", free: "bepullari", premium: "hammasi" },
  { label: "Listening skriptlari", free: false, premium: true },
  { label: "Writing va Speaking — o'qituvchi tekshiruvi", free: false, premium: true },
  { label: "Exam Full Checking (real imtihon simulyatsiyasi)", free: false, premium: true },
  { label: "Vocabulary Battle va reyting", free: true, premium: true },
  { label: "Natijalar tarixi va CEFR daraja", free: true, premium: true },
];

function CompareCell({ value, gold }: { value: boolean | string; gold?: boolean }) {
  if (typeof value === "string") {
    return <span className={cn("text-[13px] font-semibold", gold ? "text-gold-400" : "text-muted")}>{value}</span>;
  }
  return value ? (
    <span
      className={cn(
        "inline-grid size-6 place-items-center rounded-full text-[13px] font-bold",
        gold ? "bg-gold-400 text-ink-950" : "bg-success/20 text-success",
      )}
      aria-label="bor"
    >
      ✓
    </span>
  ) : (
    <span className="text-faint" aria-label="yo'q">
      —
    </span>
  );
}

export function CompareTable() {
  return (
    <section className="container-page py-20">
      <SectionTitle align="center" eyebrow="Tariflar" title="Bepul va Premium" />
      <Reveal className="mx-auto max-w-4xl overflow-hidden rounded-2xl border border-line bg-ink-900/70">
        <div className="grid grid-cols-[1fr_88px_104px] items-center border-b border-line px-5 py-4 text-[11px] font-semibold uppercase tracking-[0.12em] sm:grid-cols-[1fr_140px_160px] sm:px-8">
          <span className="text-muted">Imkoniyat</span>
          <span className="text-center text-muted">Bepul</span>
          <span className="text-center text-gold-400">Premium</span>
        </div>
        <ul>
          {COMPARE.map((row) => (
            <li
              key={row.label}
              className="grid grid-cols-[1fr_88px_104px] items-center border-b border-line/60 px-5 py-3.5 text-sm transition-colors last:border-0 hover:bg-white/[0.02] sm:grid-cols-[1fr_140px_160px] sm:px-8"
            >
              <span className="pr-3 text-fg">{row.label}</span>
              <span className="text-center">
                <CompareCell value={row.free} />
              </span>
              <span className="relative text-center">
                <CompareCell value={row.premium} gold />
              </span>
            </li>
          ))}
        </ul>
        <div className="flex flex-col items-center justify-between gap-4 border-t border-line bg-gradient-to-r from-gold-400/10 to-transparent px-5 py-5 sm:flex-row sm:px-8">
          <p className="text-sm text-muted">Ro&apos;yxatdan o&apos;tish bepul — Premiumni istalgan payt yoqasiz.</p>
          <Link
            href="/premium"
            className="inline-flex items-center gap-2 rounded-full bg-gold-400 px-6 py-3 text-sm font-semibold text-ink-950 transition-colors hover:bg-gold-300"
          >
            Premiumni ko&apos;rish <ArrowRight size={15} />
          </Link>
        </div>
      </Reveal>
    </section>
  );
}
