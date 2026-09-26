import type { SkillSection } from "./types";

export const SITE_NAME = "LevelX English";
/** Brendning asosiy shiori */
export const SITE_TAGLINE = "Push Past Your Limits";
export const SITE_DESCRIPTION =
  "LevelX English — ingliz tilini tizimli o'rganish, real imtihon formatida mashq qilish " +
  "va natijangizni yangi bosqichga olib chiqish uchun yaratilgan zamonaviy ta'lim platformasi.";

/* -------------------------------------------------------------------------
   Ko'nikmalar (sections)
   ------------------------------------------------------------------------- */
export const SECTIONS: SkillSection[] = [
  "reading",
  "listening",
  "writing",
  "speaking",
];

export const SECTION_LABEL: Record<SkillSection, string> = {
  reading: "Reading",
  listening: "Listening",
  writing: "Writing",
  speaking: "Speaking",
};

export const SECTION_ICON: Record<SkillSection, string> = {
  reading: "📖",
  listening: "🎧",
  writing: "✍️",
  speaking: "🎙️",
};

/** Imtihon tartibi — hujjat 11-bo'lim: Listening → Reading → Writing → Speaking */
export const EXAM_SECTION_ORDER: SkillSection[] = [
  "listening",
  "reading",
  "writing",
  "speaking",
];

export const SECTION_ACCENT: Record<SkillSection, string> = {
  reading: "from-sky-500 to-blue-600",
  listening: "from-violet-500 to-purple-600",
  writing: "from-emerald-500 to-teal-600",
  speaking: "from-orange-500 to-rose-600",
};

/* -------------------------------------------------------------------------
   Maqola mavzulari (hujjat 5A-bo'lim)
   ------------------------------------------------------------------------- */
export interface TopicMeta {
  slug: string;
  label: string;
  emoji: string;
}

export const ARTICLE_TOPICS: TopicMeta[] = [
  { slug: "science", label: "Science", emoji: "🔬" },
  { slug: "technology", label: "Technology", emoji: "💻" },
  { slug: "health", label: "Health", emoji: "🫀" },
  { slug: "education", label: "Education", emoji: "🎓" },
  { slug: "psychology", label: "Psychology", emoji: "🧠" },
  { slug: "history", label: "History", emoji: "🏛️" },
  { slug: "environment", label: "Environment", emoji: "🌍" },
  { slug: "society", label: "Society", emoji: "🤝" },
];

export function topicMeta(slug: string): TopicMeta {
  return (
    ARTICLE_TOPICS.find((t) => t.slug === slug) ?? {
      slug,
      label: slug,
      emoji: "📄",
    }
  );
}

/* -------------------------------------------------------------------------
   Oxirgi tushgan savollar — yillar (hujjat 4-bo'lim)
   ------------------------------------------------------------------------- */
export const EXAM_YEARS = ["2025–2026", "2024–2025", "2023–2024"];

/** URL uchun: "2025–2026" → "2025-2026" */
export function yearToSlug(year: string): string {
  return year.replace(/[–—]/g, "-");
}

export function slugToYear(slug: string): string | null {
  const normalised = slug.replace(/-/g, "–");
  return EXAM_YEARS.find((y) => yearToSlug(y) === slug) ?? normalised ?? null;
}

/* -------------------------------------------------------------------------
   Vocabulary Battle sozlamalari
   ------------------------------------------------------------------------- */
export const GAME_QUESTION_COUNT = 20;
export const GAME_TIME_LIMIT_MS = 15_000;
export const GAME_BASE_POINTS = 300;
export const GAME_MAX_BONUS = 200;

export const LEADERBOARD_PERIODS = [
  { id: "daily", label: "Daily" },
  { id: "weekly", label: "Weekly" },
  { id: "monthly", label: "Monthly" },
  { id: "all", label: "All Time" },
] as const;

export type LeaderboardPeriod = (typeof LEADERBOARD_PERIODS)[number]["id"];

/* -------------------------------------------------------------------------
   CEFR
   ------------------------------------------------------------------------- */
export const CEFR_ORDER = ["A1", "A2", "B1", "B2", "C1"];

export const CEFR_COLOR: Record<string, string> = {
  A1: "bg-slate-500",
  A2: "bg-sky-500",
  B1: "bg-emerald-500",
  B2: "bg-brand-500",
  C1: "bg-gold-500",
};

/* -------------------------------------------------------------------------
   Asosiy navigatsiya
   ------------------------------------------------------------------------- */
export const MAIN_NAV = [
  { href: "/full-mock", label: "Full Mock" },
  { href: "/latest-questions", label: "Oxirgi savollar" },
  { href: "/boost", label: "General English" },
  { href: "/vocabulary-battle", label: "Vocabulary" },
  { href: "/exam-checking", label: "Exam Checking" },
  { href: "/courses", label: "Kurslar" },
];
