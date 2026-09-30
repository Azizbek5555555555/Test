import Image from "next/image";
import Link from "next/link";
import type { ComponentType, ReactNode } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Calendar,
  Clock,
  Download,
  Edit,
  FileText,
  Headphones,
  Lock,
  Search,
  Star,
  TrendingUp,
  Users,
  Volume2,
  Zap,
} from "react-feather";
import { cn } from "@/lib/format";
import { Reveal } from "@/components/motion/Reveal";
import type { Course } from "@/lib/types";
import { getT } from "@/i18n/server";
import type { Bi, T } from "@/i18n";

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

export async function FeatureGrid({ items, glass = true }: { items: FeatureItem[]; glass?: boolean }) {
  const t = await getT();
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
                {t("Ochish", "Open")}
                <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
          </Reveal>
        );
      })}
    </div>
  );
}

export function featureItems(opts: { coursesEnabled: boolean; icons: "stars" | "specific" }, t: T): FeatureItem[] {
  const star = opts.icons === "stars";
  const items: FeatureItem[] = [
    {
      href: "/full-mock",
      title: "Full Mock",
      text: t("Real Multilevel imtihoni formatidagi to'liq mock testni bir o'tirishda ishlang.", "Take a complete mock test in the real Multilevel exam format in one sitting."),
      icon: star ? Star : FileText,
      badge: { label: t("Ommabop", "Popular"), tone: "accent" },
    },
    {
      href: "/latest-questions",
      title: t("Oxirgi savollar", "Latest questions"),
      text: t("Real imtihonlarda tushgan savollar — yillar bo'yicha jamlangan.", "Questions from real exams — collected year by year."),
      icon: star ? Star : Zap,
      badge: star ? undefined : { label: t("Yangi", "New"), tone: "success" },
    },
    {
      href: "/boost",
      title: "Boost Your English",
      text: t("Maqolalar, listening va lug'at — umumiy ingliz tilini mustahkamlang.", "Articles, listening and vocabulary — strengthen your general English."),
      icon: star ? Star : TrendingUp,
    },
    {
      href: "/vocabulary-battle",
      title: "Vocabulary Battle",
      text: t("Taymerli so'z o'yini: tez javob bering, ball to'plang va reytingda ko'tariling.", "A timed word game: answer fast, score points and climb the leaderboard."),
      icon: star ? Star : Zap,
      badge: star ? undefined : { label: t("Qiziqarli", "Fun"), tone: "gold" },
    },
    {
      href: "/exam-checking",
      title: "Exam Full Checking",
      text: t("Real kompyuter imtihoni simulyatsiyasi va Writing/Speaking bo'yicha o'qituvchi bahosi.", "A real computer-based exam simulation with teacher grading for Writing/Speaking."),
      icon: Lock,
      badge: { label: "Premium", tone: "gold" },
      premium: true,
    },
  ];
  if (opts.coursesEnabled) {
    items.push({
      href: "/courses",
      title: t("Offline kurslar", "Offline courses"),
      text: t("Toshkentdagi o'quv markazimizda o'qituvchi bilan intensiv tayyorgarlik.", "Intensive preparation with a teacher at our learning centre in Tashkent."),
      icon: star ? Star : Download,
    });
  } else {
    items.push({
      href: "/leaderboard",
      title: t("Reyting", "Leaderboard"),
      text: t("Haftalik va oylik reyting: eng faol o'quvchilar qatoriga kiring.", "Weekly and monthly rankings: join the most active learners."),
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
  { title: "Learn", text: { uz: "General English, maqolalar va lug'at bilan poydevor quring.", en: "Build a foundation with General English, articles and vocabulary." } },
  { title: "Practice", text: { uz: "Reading, Listening, Writing va Speaking bo'yicha mashq qiling.", en: "Practise Reading, Listening, Writing and Speaking." } },
  { title: "Take Exam", text: { uz: "Full Mock va Exam Checking — qat'iy taymerli real sharoit.", en: "Full Mock and Exam Checking — real conditions with a strict timer." } },
  { title: "See Result", text: { uz: "Ballar, CEFR darajasi va har bir savol bo'yicha tahlil.", en: "Scores, CEFR level and a question-by-question breakdown." } },
  { title: "Improve", text: { uz: "Zaif tomonlaringiz ustida ishlab, keyingi cho'qqiga chiqing.", en: "Work on your weak spots and climb to the next peak." } },
];

export async function Roadmap() {
  const t = await getT();
  return (
    <section className="container-page py-20 lg:py-20">
      <SectionTitle eyebrow={t("Metodologiya", "Methodology")} title={t("Cho'qqiga olib boruvchi yo'l", "The path to the summit")} />
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
            <p className="text-[13px] leading-normal text-muted">{t(step.text)}</p>
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

export async function CoursesStrip({ courses }: { courses: Course[] }) {
  if (courses.length === 0) return null;
  const t = await getT();
  return (
    <section className="container-page pt-20 pb-28 lg:pb-36">
      <SectionTitle
        align="left"
        eyebrow={t("Offline mashg'ulotlar", "Offline classes")}
        title={t("Intensiv kurslarimiz", "Our intensive courses")}
        action={
          <Link
            href="/courses"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-400 hover:text-brand-300 transition-colors"
          >
            {t("Barcha kurslar", "All courses")} <ArrowRight size={14} />
          </Link>
        }
      />
      <p className="course-hand">{t("Ustoz bilan yuzma-yuz — kichik guruhlarda", "Face to face with a teacher — in small groups")}</p>
      <div className="grid gap-6 lg:gap-7 md:grid-cols-3">
        {courses.slice(0, 3).map((course, i) => (
          <Reveal key={course.id} delay={i * 120} className="h-full">
            {/* o'rtadagi karta biroz pastda — shablon "qatori" taassurotini buzadi */}
            <div className={cn("h-full", i === 1 && "md:translate-y-10")}>
              <article data-spot className="course-card spot group">
                <div className="course-media">
                  <Image
                    src={course.image_url || COURSE_IMAGES[i % COURSE_IMAGES.length]}
                    alt=""
                    fill
                    sizes="(min-width: 768px) 33vw, 100vw"
                    className="object-cover"
                  />
                  <span className="course-chip course-chip-level">{course.level ?? "Multilevel"}</span>
                  {course.duration ? (
                    <span className="course-chip course-chip-time">
                      <Clock size={12} aria-hidden />
                      {course.duration}
                    </span>
                  ) : null}
                  <span className="course-num" aria-hidden>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                </div>
                <div className="course-body">
                  <h3 className="display-title text-[26px] font-semibold leading-tight">{course.title}</h3>
                  {course.summary ? <p className="text-sm leading-relaxed text-muted">{course.summary}</p> : null}
                  {course.days || course.time_text || course.seats ? (
                    <ul className="course-meta">
                      {course.days ? (
                        <li>
                          <Calendar size={13} aria-hidden />
                          {course.days}
                        </li>
                      ) : null}
                      {course.time_text ? (
                        <li>
                          <Clock size={13} aria-hidden />
                          {course.time_text}
                        </li>
                      ) : null}
                      {course.seats ? (
                        <li>
                          <Users size={13} aria-hidden />
                          {course.seats} {t("o'rin", "seats")}
                        </li>
                      ) : null}
                    </ul>
                  ) : null}
                  <div className="course-foot">
                    {course.price ? (
                      <p className="course-price">
                        <small>{t("Narxi", "Price")}</small>
                        {course.price}
                      </p>
                    ) : (
                      <span />
                    )}
                    <Link href={`/courses/${course.slug}`} className="course-cta">
                      {t("Batafsil", "Details")}
                      <ArrowUpRight size={16} aria-hidden />
                    </Link>
                  </div>
                </div>
              </article>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ----------------------------------------------------------------------------
   To'rt asosiy ko'nikma (Figma: skills-section)
   ---------------------------------------------------------------------------- */
const SKILLS: { title: string; text: Bi; href: string; icon: IconType; tone: string }[] = [
  { title: "Reading", text: { uz: "Matn tuzilishi va tushunib o'qish", en: "Text structure and reading comprehension" }, href: "/latest-questions", icon: BookOpen, tone: "text-brand-400" },
  { title: "Listening", text: { uz: "Kundalik suhbatlar va turli talaffuzlar", en: "Everyday conversations and a range of accents" }, href: "/boost/listening", icon: Headphones, tone: "text-gold-400" },
  { title: "Writing", text: { uz: "Esse va xat yozish ko'nikmasi", en: "Essay and letter writing skills" }, href: "/latest-questions", icon: Edit, tone: "text-success" },
  { title: "Speaking", text: { uz: "Savollarga ravon va aniq javob berish", en: "Answering questions fluently and accurately" }, href: "/latest-questions", icon: Volume2, tone: "text-warning" },
];

export async function SkillModules() {
  const t = await getT();
  return (
    <section className="container-page pt-5 pb-10">
      <Reveal>
        <p className="eyebrow mb-6">
          <span className="h-px w-5 bg-brand-400" aria-hidden />
          {t("To'rt asosiy ko'nikma", "Four core skills")}
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
                <p className="text-sm leading-normal text-muted flex-1">{t(skill.text)}</p>
                <span className={cn("inline-flex items-center gap-1.5 text-[13px] font-semibold", skill.tone)}>
                  {t("Mashq qilish", "Practise")}
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
export async function SearchBar() {
  const t = await getT();
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
          placeholder={t("Mock testlar, maqolalar yoki mavzularni qidiring…", "Search mock tests, articles or topics…")}
          className="min-w-0 flex-1 bg-transparent text-[15px] text-fg placeholder:text-faint focus:outline-none"
          aria-label={t("Qidirish", "Search")}
        />
      </form>
    </section>
  );
}

/* ----------------------------------------------------------------------------
   Bepul va Premium — taqqoslash jadvali
   ---------------------------------------------------------------------------- */
const COMPARE: { label: Bi; free: boolean | Bi; premium: boolean | Bi }[] = [
  { label: { uz: "Bepul Full Mock testlar", en: "Free Full Mock tests" }, free: true, premium: true },
  { label: { uz: "Barcha Full Mock testlar", en: "All Full Mock tests" }, free: false, premium: true },
  { label: { uz: "Oxirgi tushgan savollar arxivi", en: "Archive of the latest exam questions" }, free: { uz: "qisman", en: "partial" }, premium: { uz: "to'liq", en: "full" } },
  { label: { uz: "Maqolalar va listening mashqlari", en: "Articles and listening practice" }, free: { uz: "bepullari", en: "free ones" }, premium: { uz: "hammasi", en: "all" } },
  { label: { uz: "Listening skriptlari", en: "Listening transcripts" }, free: false, premium: true },
  { label: { uz: "Writing va Speaking — o'qituvchi tekshiruvi", en: "Writing and Speaking — teacher review" }, free: false, premium: true },
  { label: { uz: "Exam Full Checking (real imtihon simulyatsiyasi)", en: "Exam Full Checking (real exam simulation)" }, free: false, premium: true },
  { label: { uz: "Vocabulary Battle va reyting", en: "Vocabulary Battle and leaderboard" }, free: true, premium: true },
  { label: { uz: "Natijalar tarixi va CEFR daraja", en: "Result history and CEFR level" }, free: true, premium: true },
];

function CompareCell({ value, gold, t }: { value: boolean | Bi; gold?: boolean; t: T }) {
  if (typeof value === "object") {
    return <span className={cn("text-[13px] font-semibold", gold ? "text-gold-400" : "text-muted")}>{t(value)}</span>;
  }
  return value ? (
    <span
      className={cn(
        "inline-grid size-6 place-items-center rounded-full text-[13px] font-bold",
        gold ? "bg-gold-400 text-ink-950" : "bg-success/20 text-success",
      )}
      aria-label={t("bor", "included")}
    >
      ✓
    </span>
  ) : (
    <span className="text-faint" aria-label={t("yo'q", "not included")}>
      —
    </span>
  );
}

export async function CompareTable() {
  const t = await getT();
  return (
    <section className="container-page py-20">
      <SectionTitle align="center" eyebrow={t("Tariflar", "Plans")} title={t("Bepul va Premium", "Free and Premium")} />
      <Reveal className="mx-auto max-w-4xl overflow-hidden rounded-2xl border border-line bg-ink-900/70">
        <div className="grid grid-cols-[1fr_88px_104px] items-center border-b border-line px-5 py-4 text-[11px] font-semibold uppercase tracking-[0.12em] sm:grid-cols-[1fr_140px_160px] sm:px-8">
          <span className="text-muted">{t("Imkoniyat", "Feature")}</span>
          <span className="text-center text-muted">{t("Bepul", "Free")}</span>
          <span className="text-center text-gold-400">Premium</span>
        </div>
        <ul>
          {COMPARE.map((row) => (
            <li
              key={row.label.uz}
              className="grid grid-cols-[1fr_88px_104px] items-center border-b border-line/60 px-5 py-3.5 text-sm transition-colors last:border-0 hover:bg-white/[0.02] sm:grid-cols-[1fr_140px_160px] sm:px-8"
            >
              <span className="pr-3 text-fg">{t(row.label)}</span>
              <span className="text-center">
                <CompareCell value={row.free} t={t} />
              </span>
              <span className="relative text-center">
                <CompareCell value={row.premium} gold t={t} />
              </span>
            </li>
          ))}
        </ul>
        <div className="flex flex-col items-center justify-between gap-4 border-t border-line bg-gradient-to-r from-gold-400/10 to-transparent px-5 py-5 sm:flex-row sm:px-8">
          <p className="text-sm text-muted">{t("Ro'yxatdan o'tish bepul — Premiumni istalgan payt yoqasiz.", "Signing up is free — turn on Premium whenever you like.")}</p>
          <Link
            href="/premium"
            className="inline-flex items-center gap-2 rounded-full bg-gold-400 px-6 py-3 text-sm font-semibold text-ink-950 transition-colors hover:bg-gold-300"
          >
            {t("Premiumni ko'rish", "See Premium")} <ArrowRight size={15} />
          </Link>
        </div>
      </Reveal>
    </section>
  );
}
