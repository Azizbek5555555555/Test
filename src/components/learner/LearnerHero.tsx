"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, type CSSProperties, type ComponentType } from "react";
import {
  ArrowUpRight,
  BookOpen,
  Calendar,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  FileText,
  Headphones,
  Layers,
  Mic,
  Edit3,
  Search,
  Zap,
} from "react-feather";
import { useT } from "@/i18n/client";
import { useTilt } from "@/components/motion/useTilt";
import { SECTIONS, SECTION_LABEL, SITE_TAGLINE } from "@/lib/constants";
import { MAX_SCORE } from "@/lib/scoring";
import type { LearnerCalendar, NextStep } from "@/lib/learner-home";
import type { SkillSection } from "@/lib/types";

/**
 * Kirgan o'quvchining bosh sahifasi — "oyna" kompozitsiyasi:
 * katta yumaloq ramka ichida tog' manzarasi, yuqorida shisha pill'lar (daraja, ball, seriya),
 * chapda tezkor yo'llar paneli, markazda katta shaffof shior, pastda shisha kartalar:
 * faollik kalendari va "keyingi qadam". O'rtada aylanuvchi brend muhri.
 *
 * Kirish animatsiyasi — sof CSS (JS kutmaydi). JS faqat sichqoncha/skroll parallaksi uchun.
 */

type IconType = ComponentType<{ size?: number; className?: string; strokeWidth?: number }>;

export interface LearnerHeroProps {
  firstName: string | null;
  avatarUrl: string | null;
  greeting: string;
  level: string | null;
  overall: number | null;
  streak: number;
  bestStreak: number;
  calendars: LearnerCalendar[];
  next: NextStep;
  skills: Record<SkillSection, number | null>;
}

const SKILL_ICON: Record<SkillSection, IconType> = {
  reading: BookOpen,
  listening: Headphones,
  writing: Edit3,
  speaking: Mic,
};

const MONTHS = {
  uz: ["Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun", "Iyul", "Avgust", "Sentyabr", "Oktyabr", "Noyabr", "Dekabr"],
  en: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
};
const WEEKDAYS = {
  uz: ["Du", "Se", "Ch", "Pa", "Ju", "Sh", "Ya"],
  en: ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"],
};

/** Faollik darajasi: 0 — yo'q, 1 — bitta mashq, 2 — 2–3 ta, 3 — 4 va undan ko'p */
const intensity = (n: number) => (n <= 0 ? 0 : n === 1 ? 1 : n <= 3 ? 2 : 3);

export function LearnerHero(props: LearnerHeroProps) {
  const t = useT();
  const frameRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLElement>(null);
  useTilt(frameRef);

  // Doimiy animatsiyalar (muhr, nur) faqat ko'rinib turganda
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const io = new IntersectionObserver(([e]) => root.classList.toggle("is-live", e.isIntersecting));
    io.observe(root);
    return () => io.disconnect();
  }, []);

  const rail: { href: string; label: string; icon: IconType }[] = [
    { href: "/full-mock", label: "Full Mock", icon: FileText },
    { href: "/latest-questions", label: t("Oxirgi savollar", "Latest questions"), icon: Zap },
    { href: "/boost", label: "General English", icon: BookOpen },
    { href: "/vocabulary-battle", label: "Vocabulary Battle", icon: Layers },
    { href: "/exam-checking", label: "Exam Checking", icon: CheckCircle },
    { href: "/search", label: t("Qidirish", "Search"), icon: Search },
  ];

  const words = SITE_TAGLINE.split(" ");

  return (
    <section ref={rootRef} className="lh is-live">
      {/* Ramka ortidagi xira, oqartirilgan manzara (rasmdagi kabi) */}
      <div className="lh-backdrop" aria-hidden>
        <Image src="/design/ambient-peak.jpg" alt="" fill sizes="100vw" className="object-cover" />
      </div>

      <div className="container-page">
        <div ref={frameRef} className="lh-frame">
          <div className="lh-bg" aria-hidden>
            <Image
              src="/design/ambient-peak.jpg"
              alt=""
              fill
              priority
              sizes="(min-width: 1280px) 1280px, 100vw"
              className="object-cover"
            />
          </div>
          <div className="lh-glow" aria-hidden />
          <div className="lh-shade" aria-hidden />

          {/* ------------------------------------------------ Yuqori qator */}
          <header className="lh-top">
            <p className="lh-pill lh-hello" style={{ "--d": 1 } as CSSProperties}>
              <span aria-hidden>👋</span>
              <span className="truncate">
                {props.greeting}
                {props.firstName ? `, ${props.firstName}` : ""}
              </span>
            </p>

            <dl className="lh-stats lh-glass" style={{ "--d": 2 } as CSSProperties}>
              <div>
                <dt>{t("Daraja", "Level")}</dt>
                <dd>{props.level ?? "—"}</dd>
              </div>
              <div>
                <dt>{t("O'rtacha ball", "Average score")}</dt>
                <dd>
                  {props.overall ?? "—"}
                  <small>/{MAX_SCORE}</small>
                </dd>
              </div>
              <div>
                <dt>{t("Seriya", "Streak")}</dt>
                <dd>
                  {props.streak}
                  <small> {t("kun", props.streak === 1 ? "day" : "days")}</small>
                </dd>
              </div>
            </dl>

            <Link href="/full-mock" className="lh-pill lh-cta" style={{ "--d": 3 } as CSSProperties}>
              <span className="lh-cta-long">{t("Full Mock ishlash", "Take a Full Mock")}</span>
              <span className="lh-cta-short">Full Mock</span>
              <ArrowUpRight size={16} aria-hidden />
            </Link>
          </header>

          {/* ------------------------------------------------ Chap panel */}
          <nav className="lh-rail" aria-label={t("Tezkor yo'llar", "Quick links")}>
            <div className="lh-glass lh-rail-group">
              {rail.map((item, i) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="lh-rail-btn"
                    aria-label={item.label}
                    style={{ "--i": i } as CSSProperties}
                  >
                    <Icon size={18} strokeWidth={1.8} aria-hidden />
                    <span className="lh-tip">{item.label}</span>
                  </Link>
                );
              })}
            </div>
            <div className="lh-glass lh-rail-group lh-rail-me">
              <Link href="/profile" className="lh-rail-btn lh-avatar" aria-label={t("Shaxsiy kabinet", "My dashboard")}>
                {props.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={props.avatarUrl} alt="" referrerPolicy="no-referrer" />
                ) : (
                  <span>{(props.firstName ?? "?").slice(0, 1).toUpperCase()}</span>
                )}
                <span className="lh-tip">{t("Shaxsiy kabinet", "My dashboard")}</span>
              </Link>
            </div>
          </nav>

          {/* ------------------------------------------------ Shior */}
          <div className="lh-title">
            <h1 aria-label={SITE_TAGLINE}>
              {[words.slice(0, 2), words.slice(2)].map((line, li) => (
                <span key={li} className="lh-line" aria-hidden>
                  {line.map((w, wi) => (
                    <span key={w} className="lh-word" style={{ "--w": li * 2 + wi } as CSSProperties}>
                      <span>{w}</span>
                    </span>
                  ))}
                </span>
              ))}
            </h1>
            <p className="lh-lead">
              {t(
                "Davom eting — siz yorqinroq kelajakni qurayapsiz. Har kungi kichik mashq cho'qqiga olib boradi.",
                "Keep going — you are building a brighter future. Small daily practice is what reaches the summit.",
              )}
            </p>
          </div>

          {/* ------------------------------------------------ Kartalar */}
          <div className="lh-cards">
            <ActivityCalendar calendars={props.calendars} streak={props.streak} best={props.bestStreak} />
            <div className="lh-badge" aria-hidden>
              <svg viewBox="0 0 120 120" className="lh-badge-ring">
                <defs>
                  <path id="lh-ring-path" d="M60 60 m-47 0 a47 47 0 1 1 94 0 a47 47 0 1 1 -94 0" />
                </defs>
                <text>
                  <textPath href="#lh-ring-path" startOffset="0">
                    LEVELXENGLISH · PUSH PAST YOUR LIMITS ·
                  </textPath>
                </text>
              </svg>
              <span className="lh-badge-core">
                <Image src="/brand/lx-mark-128.png" alt="" width={44} height={44} />
              </span>
            </div>
            <NextCard next={props.next} skills={props.skills} />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============================================================================
   Faollik kalendari — qaysi kunlari mashq qilingan
   ============================================================================ */
function ActivityCalendar({
  calendars,
  streak,
  best,
}: {
  calendars: LearnerCalendar[];
  streak: number;
  best: number;
}) {
  const t = useT();
  // 0 — joriy oy, 1 — o'tgan oy, ...
  const [index, setIndex] = useState(0);
  const [touched, setTouched] = useState(false);
  const calendar = calendars[index];
  const go = (step: number) => {
    setTouched(true);
    setIndex((i) => Math.max(0, Math.min(calendars.length - 1, i + step)));
  };
  const months = MONTHS[t.locale];
  const weekdays = WEEKDAYS[t.locale];
  const monthName = months[calendar.month - 1];

  return (
    <article className="lh-card lh-cal" style={{ "--d": 5 } as CSSProperties}>
      <div className="lh-cal-side">
        <p className="lh-k">
          <Calendar size={14} aria-hidden />
          {t("Faollik kalendari", "Activity calendar")}
        </p>
        <div className="lh-cal-nav">
          <button
            type="button"
            onClick={() => go(1)}
            disabled={index >= calendars.length - 1}
            aria-label={t("Oldingi oy", "Previous month")}
          >
            <ChevronLeft size={16} aria-hidden />
          </button>
          <p className="lh-cal-month" aria-live="polite">
            {monthName} {calendar.year}
          </p>
          <button
            type="button"
            onClick={() => go(-1)}
            disabled={index === 0}
            aria-label={t("Keyingi oy", "Next month")}
          >
            <ChevronRight size={16} aria-hidden />
          </button>
        </div>
        <p className="lh-big">
          {streak}
          <span>{t("kunlik seriya", "day streak")}</span>
        </p>
        <ul className="lh-cal-facts">
          <li>
            {index === 0 ? t("Bu oy faol", "Active this month") : t("Faol kunlar", "Active days")}:{" "}
            <b>{calendar.activeThisMonth}</b> {t("kun", calendar.activeThisMonth === 1 ? "day" : "days")}
          </li>
          <li>
            {t("Eng uzun seriya", "Longest streak")}: <b>{best}</b> {t("kun", best === 1 ? "day" : "days")}
          </li>
        </ul>
      </div>

      <div className="lh-cal-main">
        <div
          key={`${calendar.year}-${calendar.month}`}
          className="lh-cal-grid"
          data-switched={touched || undefined}
          role="list"
          aria-label={`${monthName} ${calendar.year}`}
        >
          {weekdays.map((d) => (
            <span key={d} className="lh-cal-wd" aria-hidden>
              {d}
            </span>
          ))}
          {Array.from({ length: calendar.offset }, (_, i) => (
            <span key={`b${i}`} aria-hidden />
          ))}
          {calendar.days.map((d, i) => {
            const label = d.future
              ? `${d.day} ${monthName}`
              : d.count > 0
                ? t(`${d.day} ${monthName}: ${d.count} ta mashq`, `${monthName} ${d.day}: ${d.count} ${d.count === 1 ? "activity" : "activities"}`)
                : t(`${d.day} ${monthName}: mashq qilinmagan`, `${monthName} ${d.day}: no practice`);
            return (
              <span
                key={d.key}
                role="listitem"
                className="lh-day"
                data-level={intensity(d.count)}
                data-today={d.today || undefined}
                data-future={d.future || undefined}
                aria-label={label}
                title={label}
                style={{ "--c": i } as CSSProperties}
              >
                {d.day}
              </span>
            );
          })}
        </div>
        <p className="lh-cal-legend" aria-hidden>
          <span>{t("Kam", "Less")}</span>
          <i data-level="0" />
          <i data-level="1" />
          <i data-level="2" />
          <i data-level="3" />
          <span>{t("Ko'p", "More")}</span>
          <i className="lh-legend-today" />
          <span>{t("Bugun", "Today")}</span>
        </p>
      </div>
    </article>
  );
}

/* ============================================================================
   Keyingi qadam — davom ettirish / zaif bo'lim / birinchi test
   ============================================================================ */
function NextCard({ next, skills }: { next: NextStep; skills: Record<SkillSection, number | null> }) {
  const t = useT();
  const weak = next.section ? SECTION_LABEL[next.section] : "";
  const eyebrow =
    next.kind === "continue"
      ? t("Davom ettiring", "Pick up where you left off")
      : next.kind === "weak"
        ? t("Keyingi qadam", "Next step")
        : t("Boshlashga tayyormisiz?", "Ready to start?");
  const title =
    next.kind === "continue"
      ? next.title
      : next.kind === "weak"
        ? t(`${weak} ko'nikmasini kuchaytiring`, `Strengthen your ${weak}`)
        : t("Birinchi Full Mock testingiz", "Your first Full Mock test");
  const sub =
    next.kind === "continue"
      ? t(`Jarayonda — ${next.percent ?? 0}% bajarildi`, `In progress — ${next.percent ?? 0}% done`)
      : next.kind === "weak"
        ? skills[next.section!] == null
          ? t("Bu bo'limda hali natijangiz yo'q — bitta mashqdan boshlang.", "No result in this section yet — start with one practice.")
          : t("Eng past natijangiz shu bo'limda. Bugun bitta mashq qiling.", "This is your lowest section. Do one practice today.")
        : t("Darajangizni bilib oling va shaxsiy reja oling.", "Find out your level and get a personal plan.");

  return (
    <article className="lh-card lh-next" style={{ "--d": 6 } as CSSProperties}>
      <div className="lh-next-head">
        <p className="lh-k">{eyebrow}</p>
        <Link href={next.href} className="lh-round" aria-label={title}>
          <ArrowUpRight size={18} aria-hidden />
        </Link>
      </div>
      <h2 className="lh-next-title">{title}</h2>
      <p className="lh-next-sub">{sub}</p>
      {next.kind === "continue" ? (
        <div className="lh-progress" aria-hidden>
          <span style={{ width: `${next.percent ?? 0}%` }} />
        </div>
      ) : null}
      <ul className="lh-skills">
        {SECTIONS.map((s) => {
          const Icon = SKILL_ICON[s];
          const v = skills[s];
          return (
            <li key={s} data-weak={next.section === s || undefined}>
              <Icon size={13} strokeWidth={2} aria-hidden />
              <span className="lh-skill-name">{SECTION_LABEL[s]}</span>
              <b>{v ?? "—"}</b>
            </li>
          );
        })}
      </ul>
    </article>
  );
}
