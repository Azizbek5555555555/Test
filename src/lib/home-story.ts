/**
 * Bosh sahifadagi skroll-hikoya ("Natija varaqasi") sozlamalari.
 *
 * Hamma vaqtlar 0..1 oralig'idagi skroll ulushida (p): 0 — hikoya boshi,
 * 1 — varaqa to'liq yozilib bo'lgan payt. Matnlar, raqamlar, suzuvchi
 * elementlar va ularning harakati shu faylda — komponentga tegmasdan
 * o'zgartirish mumkin.
 */
import type { SiteStats } from "./home";
import type { Bi, T } from "@/i18n";

/* -------------------------------------------------------------------------
   Umumiy
   ------------------------------------------------------------------------- */

/** Pinned bo'lim balandligi (viewport balandligiga nisbatan) */
export const STORY_HEIGHT = { desktop: 620, mobile: 440 } as const;

/** Silliqlash: har kadrda joriy qiymat nishonga shu ulushda yaqinlashadi */
export const STORY_EASE = 0.12;

/* -------------------------------------------------------------------------
   Matn bloklari (chapdagi / pastdagi matn)
   ------------------------------------------------------------------------- */
export interface StoryChapter {
  id: string;
  /** Ko'rinish oralig'i. Har uchida 15% davomida yumshoq paydo bo'ladi / yo'qoladi */
  range: [number, number];
  eyebrow: string;
  title: string;
  body: string;
  /** Hero va yakunda — tugmalar */
  cta?: { primary: { label: string; href: string }; secondary?: { label: string; href: string } };
  /** Hero sarlavhasi H1 bo'ladi */
  hero?: boolean;
  /** Sarlavhadagi ajratib ko'rsatiladigan so'z (qo'lda chizilgan chiziq bilan) */
  highlight?: string;
}

/** Hero ostidagi kichik "isbot" qatori — faqat bazadagi haqiqiy sonlar */
export function heroProof(stats: SiteStats, t: T): string[] {
  const items: string[] = [];
  if (stats.fullMocks > 0) items.push(t(`${stats.fullMocks} ta Full Mock`, `${stats.fullMocks} Full Mocks`));
  if (stats.questions > 0) items.push(t(`${stats.questions.toLocaleString("ru-RU")} ta savol`, `${stats.questions.toLocaleString("en-US")} questions`));
  items.push(t("4 ko'nikma", "4 skills"));
  items.push(t("O'qituvchi tekshiruvi", "Teacher review"));
  return items;
}

/** Son bo'lsa — matnga qo'yiladi, bo'lmasa (baza bo'sh) muqobil matn */
const n = (value: number, withNumber: string, without: string) =>
  value > 0 ? withNumber.replace("{n}", value.toLocaleString("ru-RU")) : without;

export function storyChapters(stats: SiteStats, t: T): StoryChapter[] {
  return [
    {
      id: "hero",
      range: [0, 0.12],
      hero: true,
      eyebrow: t("Multilevel imtihoniga tayyorlov platformasi", "Multilevel exam preparation platform"),
      title: t("Natijangizni o'zingiz yozasiz", "You write your own result"),
      highlight: t("o'zingiz", "own"),
      body: t(
        "O'rganing. Mashq qiling. Imtihon topshiring. O'sing. Multilevel imtihoniga kerak bo'lgan hamma narsa — bitta platformada.",
        "Learn. Practise. Take the exam. Grow. Everything you need for the Multilevel exam — on one platform.",
      ),
      cta: {
        primary: { label: t("Bepul boshlash", "Start free"), href: "/login" },
        secondary: { label: t("Premiumni ko'rish", "See Premium"), href: "/premium" },
      },
    },
    {
      id: "name",
      range: [0.12, 0.26],
      eyebrow: t("01 · Boshlanish", "01 · The start"),
      title: t("Har bir natija ismingizdan boshlanadi", "Every result starts with your name"),
      body: t(
        "Bepul ro'yxatdan o'ting — har bir test, ball va o'qituvchi izohi profilingizda saqlanib boradi.",
        "Sign up for free — every test, score and teacher comment is saved in your profile.",
      ),
    },
    {
      id: "listening",
      range: [0.26, 0.335],
      eyebrow: "02 · Listening",
      title: t("Tinglab tushunish", "Listening comprehension"),
      body: t.locale === "en"
        ? n(
            stats.listeningSets,
            "{n} listening practices and real audio in every Full Mock. With the script you find exactly which words you missed.",
            "Real exam audio and scripts show you exactly which words you missed.",
          )
        : n(
            stats.listeningSets,
            "{n} ta listening mashqi va har bir Full Mock'da real audio. Skript bilan qaysi so'zni eshitmaganingizni topasiz.",
            "Real imtihon audiolari va skriptlar bilan qaysi so'zni eshitmaganingizni topasiz.",
          ),
    },
    {
      id: "reading",
      range: [0.335, 0.41],
      eyebrow: "03 · Reading",
      title: t("O'qib tushunish", "Reading comprehension"),
      body: t.locale === "en"
        ? n(
            stats.fullMocks,
            `{n} Full Mocks${stats.articles > 0 ? ` and ${stats.articles} articles` : ""} — real exam texts with new vocabulary.`,
            "Practise with real exam texts, articles and new vocabulary.",
          )
        : n(
            stats.fullMocks,
            `{n} ta Full Mock${stats.articles > 0 ? ` va ${stats.articles} ta maqola` : ""} — real imtihon matnlari, yangi so'zlar bilan.`,
            "Real imtihon matnlari, maqolalar va yangi so'zlar bilan mashq qiling.",
          ),
    },
    {
      id: "writing",
      range: [0.41, 0.485],
      eyebrow: "04 · Writing",
      title: t("Yozish — o'qituvchi nazoratida", "Writing — checked by a teacher"),
      body: t(
        "Task 1 va Task 2 esselaringizni o'qituvchi tekshiradi, har biriga izoh qoldiradi.",
        "A teacher checks your Task 1 and Task 2 essays and comments on each one.",
      ),
    },
    {
      id: "speaking",
      range: [0.485, 0.56],
      eyebrow: "05 · Speaking",
      title: t("Gapiring — biz eshitamiz", "Speak — we are listening"),
      body: t(
        "Mikrofon orqali javob bering. O'qituvchi talaffuz, ravonlik va lug'atingizni baholaydi.",
        "Answer through your microphone. A teacher assesses your pronunciation, fluency and vocabulary.",
      ),
    },
    {
      id: "result",
      range: [0.56, 0.68],
      eyebrow: t("06 · Natija", "06 · The result"),
      title: t("Aniq CEFR daraja — bir qarashda", "A clear CEFR level — at a glance"),
      body: t.locale === "en"
        ? n(
            stats.questions,
            "Every section is scored out of 100, with an overall level from A1 to C1. {n} real questions in the bank.",
            "Every section is scored out of 100, with an overall level from A1 to C1.",
          )
        : n(
            stats.questions,
            "Har bir bo'lim 100 ballik tizimda, umumiy daraja A1 dan C1 gacha. Bazada {n} ta real savol.",
            "Har bir bo'lim 100 ballik tizimda, umumiy daraja A1 dan C1 gacha.",
          ),
    },
    {
      id: "teacher",
      range: [0.68, 0.8],
      eyebrow: t("07 · O'qituvchi izohi", "07 · Teacher feedback"),
      title: t("Xatolaringiz — qizil ruchka bilan", "Your mistakes — in red pen"),
      body: t(
        "Nima yaxshi chiqqani va nimani tuzatish kerakligi — har bir ish bo'yicha aniq izoh.",
        "What went well and what to fix — clear feedback on every piece of work.",
      ),
    },
    {
      id: "improve",
      range: [0.8, 0.92],
      eyebrow: t("08 · O'sish", "08 · Growth"),
      title: t("B2 dan C1 ga — qadam-baqadam", "From B2 to C1 — step by step"),
      body: t(
        "Zaif bo'limingizni mashq qiling, qayta topshiring va ballaringiz qanday ko'tarilayotganini kuzating.",
        "Practise your weakest section, retake the test and watch your scores rise.",
      ),
    },
    {
      id: "final",
      range: [0.92, 1],
      eyebrow: t("Sizning navbatingiz", "Your turn"),
      title: t("Keyingi natija varaqasi — sizniki", "The next result sheet is yours"),
      body: t(
        "Bugun bepul boshlang. Birinchi Full Mock testingiz 2 daqiqada tayyor.",
        "Start free today. Your first Full Mock test is ready in 2 minutes.",
      ),
      cta: {
        primary: { label: t("Bepul boshlash", "Start free"), href: "/login" },
        secondary: { label: t("Full Mock testlar", "Full Mock tests"), href: "/full-mock" },
      },
    },
  ];
}

/* -------------------------------------------------------------------------
   Varaqa (namuna) — ko'rsatiladigan ma'lumotlar
   ------------------------------------------------------------------------- */
export const SHEET = {
  title: { uz: "Natija varaqasi", en: "Result sheet" },
  subtitle: { uz: "Multilevel · CEFR", en: "Multilevel · CEFR" },
  nameLabel: { uz: "Ism, familiya", en: "Full name" },
  name: { uz: "Sizning ismingiz", en: "Your name" },
  examLabel: { uz: "Imtihon", en: "Exam" },
  dateLabel: { uz: "Sana", en: "Date" },
  overallLabel: { uz: "Umumiy ball", en: "Overall score" },
  teacherLabel: { uz: "O'qituvchi izohi", en: "Teacher's comment" },
  teacherNote: { uz: "Coherence a'lo! Murakkab gaplarni mashq qiling.", en: "Great coherence! Practise complex sentences." },
  signatureLabel: { uz: "Imzo", en: "Signature" },
  sample: { uz: "Namuna", en: "Sample" },
} satisfies Record<string, Bi>;

export type SkillKey = "listening" | "reading" | "writing" | "speaking";

export const SHEET_SKILLS: { key: SkillKey; label: string }[] = [
  { key: "listening", label: "Listening" },
  { key: "reading", label: "Reading" },
  { key: "writing", label: "Writing" },
  { key: "speaking", label: "Speaking" },
];

/* -------------------------------------------------------------------------
   Vaqt jadvallari
   ------------------------------------------------------------------------- */
export type Range = [number, number];

/** Sanaladigan raqamlar: har bir oraliqda from → to */
export const COUNTS: Record<SkillKey | "overall", { range: Range; from: number; to: number }[]> = {
  listening: [
    { range: [0.265, 0.33], from: 0, to: 68 },
    { range: [0.8, 0.88], from: 68, to: 79 },
  ],
  reading: [
    { range: [0.34, 0.405], from: 0, to: 71 },
    { range: [0.81, 0.89], from: 71, to: 82 },
  ],
  writing: [
    { range: [0.415, 0.48], from: 0, to: 62 },
    { range: [0.82, 0.9], from: 62, to: 76 },
  ],
  speaking: [
    { range: [0.49, 0.555], from: 0, to: 66 },
    { range: [0.83, 0.91], from: 66, to: 77 },
  ],
  overall: [
    { range: [0.56, 0.62], from: 0, to: 67 },
    { range: [0.84, 0.92], from: 67, to: 79 },
  ],
};

/** Qatorni ajratib ko'rsatish (hozir gap qaysi ko'nikma haqida) */
export const HIGHLIGHTS: Record<SkillKey, Range> = {
  listening: [0.26, 0.335],
  reading: [0.335, 0.41],
  writing: [0.41, 0.485],
  speaking: [0.485, 0.56],
};

/** Chapdan o'ngga "yozilib" chiqadigan matnlar (ruchka bilan) */
export const REVEALS: Record<"name" | "note", Range> = {
  name: [0.13, 0.24],
  note: [0.7, 0.79],
};

/** Chiziladigan chiziqlar (SVG) */
export const DRAWS: Record<"ulWriting" | "ulSpeaking" | "circle" | "signature", Range> = {
  ulWriting: [0.69, 0.73],
  ulSpeaking: [0.72, 0.76],
  circle: [0.62, 0.67],
  signature: [0.93, 0.985],
};

/* -------------------------------------------------------------------------
   Kalit kadrlar: x, y — sahnaning eni/bo'yiga nisbatan ulush; burchaklar gradusda
   ------------------------------------------------------------------------- */
export interface Keyframe {
  p: number;
  x?: number;
  y?: number;
  r?: number;
  rx?: number;
  ry?: number;
  s?: number;
  o?: number;
}

export const KEYFRAMES: Record<string, Keyframe[]> = {
  // Varaqaning o'zi: havoda qiyshiq suzib turadi → to'g'rilanadi → muhr "zarbi" → yakun
  sheet: [
    { p: 0, x: 0.03, y: 0.05, r: -9, rx: 26, ry: -20, s: 0.9 },
    { p: 0.12, x: 0.005, y: 0.01, r: -4, rx: 7, ry: -6, s: 0.97 },
    { p: 0.26, x: 0, y: 0, r: -2, rx: 0, ry: 0, s: 1 },
    { p: 0.6, r: -1.5, s: 1 },
    { p: 0.625, r: -1.2, s: 1.02 },
    { p: 0.65, r: -1.5, s: 1 },
    { p: 0.9, r: -2.2, s: 1 },
    { p: 0.915, r: -1.8, s: 1.02 },
    { p: 0.94, r: -1.5, s: 1 },
    { p: 1, x: 0, y: -0.015, r: -0.5, s: 0.97 },
  ],
  // Varaqa ostidagi soya — varaqa ko'tarilganda kattalashadi
  shadow: [
    { p: 0, x: 0.06, y: 0.1, s: 0.8, o: 0.35 },
    { p: 0.26, x: 0.01, y: 0.02, s: 1, o: 0.6 },
    { p: 1, x: 0.01, y: 0.02, s: 1, o: 0.55 },
  ],
  // Ism yozadigan ruchka (varaqa ichida, ism qatoriga nisbatan)
  pen: [
    { p: 0.1, x: 0.02, y: -0.08, r: 8, o: 0 },
    { p: 0.13, x: 0, y: 0, r: 0, o: 1 },
    { p: 0.24, x: 0, y: 0, r: 0, o: 1 },
    { p: 0.28, x: 0.05, y: -0.1, r: 14, o: 0 },
  ],
  // O'qituvchining qizil ruchkasi (izoh qatoriga nisbatan)
  redPen: [
    { p: 0.66, x: 0.03, y: -0.08, r: 8, o: 0 },
    { p: 0.7, x: 0, y: 0, r: 0, o: 1 },
    { p: 0.79, x: 0, y: 0, r: 0, o: 1 },
    { p: 0.83, x: 0.05, y: -0.1, r: 14, o: 0 },
  ],
  // Muhrlar: "zarb" — kattadan kichrayib urilib tushadi
  stampB2: [
    { p: 0.6, s: 2.4, r: -24, o: 0 },
    { p: 0.625, s: 0.94, r: -12, o: 1 },
    { p: 0.64, s: 1, r: -12, o: 1 },
    { p: 0.85, s: 1, r: -12, o: 1 },
    { p: 0.88, s: 1.1, r: -12, o: 0 },
  ],
  stampC1: [
    { p: 0.88, s: 2.4, r: -2, o: 0 },
    { p: 0.905, s: 0.94, r: 8, o: 1 },
    { p: 0.92, s: 1, r: 8, o: 1 },
  ],
  // Fon ranglari: sovuq (a) → iliq (b) → aralash
  auroraA: [
    { p: 0, o: 1 },
    { p: 0.3, o: 0.85 },
    { p: 0.58, o: 0.25 },
    { p: 0.8, o: 0.7 },
    { p: 1, o: 0.5 },
  ],
  auroraB: [
    { p: 0, o: 0.1 },
    { p: 0.3, o: 0.35 },
    { p: 0.6, o: 1 },
    { p: 0.8, o: 0.45 },
    { p: 1, o: 0.9 },
  ],
  // "Pastga suring" belgisi
  hint: [
    { p: 0, o: 1, y: 0 },
    { p: 0.05, o: 0, y: 0.02 },
  ],
};

/* -------------------------------------------------------------------------
   Varaqa atrofida suzuvchi elementlar
   ------------------------------------------------------------------------- */
export type FloaterKind = "word" | "note" | "letter" | "card" | "chip";

export interface Floater {
  id: string;
  kind: FloaterKind;
  text: string | Bi;
  sub?: string | Bi;
  /** Qaysi ikonka (faqat "chip" uchun) */
  icon?: "headphones" | "book" | "pen" | "mic" | "spark";
  /** Sahna ichidagi joyi, % (varaqa atrofi). Mobil uchun alohida bo'lishi mumkin */
  at: [number, number];
  atMobile?: [number, number];
  /** Parallaks chuqurligi: qancha katta bo'lsa, skroll bilan shuncha tez ko'chadi */
  depth: number;
  /** Boshlang'ich burilish, gradus */
  rot: number;
  /** Ko'rinish oralig'i */
  show: Range;
  /** Mobil ekranda ko'rsatilsinmi */
  mobile?: boolean;
  /** Kompyuterda faqat shu kenglikdan boshlab (tor ekranda varaqqa tegib qoladi) */
  minWidth?: 1200 | 1400;
}

export const FLOATERS: Floater[] = [
  { id: "w-fluent", kind: "word", text: "fluent", at: [-6, 10], depth: 0.35, rot: -8, show: [0, 0.3], mobile: true, atMobile: [2, 4] },
  { id: "w-coherent", kind: "word", text: "coherent", at: [80, 6], depth: 0.5, rot: 6, show: [0, 0.45], mobile: true, atMobile: [70, 2], minWidth: 1400 },
  { id: "l-aa", kind: "letter", text: "Aa", at: [-20, 56], depth: 0.7, rot: -6, show: [0, 1] },
  { id: "w-paraphrase", kind: "word", text: "paraphrase", at: [-14, 44], depth: 0.25, rot: -4, show: [0, 0.24], minWidth: 1200 },
  { id: "c-listening", kind: "chip", icon: "headphones", text: "Listening", sub: { uz: "audio · skript", en: "audio · script" }, at: [84, 24], depth: 0.3, rot: 4, show: [0.26, 0.345], mobile: true, atMobile: [66, 10] },
  { id: "c-reading", kind: "chip", icon: "book", text: "Reading", sub: { uz: "matn · savollar", en: "text · questions" }, at: [-18, 34], depth: 0.3, rot: -4, show: [0.335, 0.42], mobile: true, atMobile: [0, 12] },
  { id: "c-writing", kind: "chip", icon: "pen", text: "Writing", sub: "Task 1 · Task 2", at: [86, 44], depth: 0.3, rot: 3, show: [0.41, 0.495], mobile: true, atMobile: [66, 18] },
  { id: "c-speaking", kind: "chip", icon: "mic", text: "Speaking", sub: { uz: "yozib olish", en: "recording" }, at: [-16, 62], depth: 0.3, rot: -3, show: [0.485, 0.57], mobile: true, atMobile: [0, 20] },
  { id: "n-task2", kind: "note", text: "Task 2", sub: { uz: "250 so'z · 40 daqiqa", en: "250 words · 40 min" }, at: [80, 66], depth: 0.45, rot: 7, show: [0.4, 0.62] },
  { id: "k-resilient", kind: "card", text: "resilient", sub: { uz: "chidamli", en: "tough, adaptable" }, at: [-22, 22], depth: 0.55, rot: -10, show: [0.6, 0.96] },
  { id: "k-eloquent", kind: "card", text: "eloquent", sub: { uz: "notiq", en: "well-spoken" }, at: [88, 58], depth: 0.4, rot: 8, show: [0.66, 1], mobile: true, atMobile: [68, 70] },
  { id: "l-c1", kind: "letter", text: "C1", at: [92, 82], depth: 0.8, rot: 6, show: [0.8, 1] },
  { id: "s-spark", kind: "chip", icon: "spark", text: { uz: "+13 ball", en: "+13 points" }, sub: { uz: "qayta topshirish", en: "retake" }, at: [-14, 76], depth: 0.35, rot: -5, show: [0.82, 0.97], mobile: true, atMobile: [2, 72] },
];

/* -------------------------------------------------------------------------
   Ranglar: hikoya ortidagi "aurora" va undan keyingi sahifa foni
   ------------------------------------------------------------------------- */
export interface Glow {
  color: string;
  /** Joyi (% konteyner) va radiusi (% konteyner) */
  at: [number, number];
  radius: number;
}

/** Hikoya sahnasi ortida ikki qatlam: skroll bilan bir-biriga o'tadi (KEYFRAMES.auroraA/B) */
export const STORY_AURORA: { a: Glow[]; b: Glow[] } = {
  // Sovuq: indigo + shaftoli + firuza
  a: [
    { color: "rgba(92, 107, 255, 0.45)", at: [82, 10], radius: 55 },
    { color: "rgba(227, 167, 155, 0.30)", at: [10, 42], radius: 45 },
    { color: "rgba(43, 179, 163, 0.22)", at: [28, 96], radius: 45 },
  ],
  // Iliq: oltin + qizg'ish + shaftoli
  b: [
    { color: "rgba(217, 179, 130, 0.40)", at: [74, 72], radius: 50 },
    { color: "rgba(212, 87, 107, 0.26)", at: [48, 22], radius: 42 },
    { color: "rgba(227, 167, 155, 0.30)", at: [14, 18], radius: 40 },
  ],
};

/** Hikoyadan keyingi bo'limlar foni — bir marta chiziladi, kontent bilan birga siljiydi */
export const PAGE_GLOWS: Glow[] = [
  { color: "rgba(92, 107, 255, 0.20)", at: [85, 4], radius: 22 },
  { color: "rgba(227, 167, 155, 0.16)", at: [8, 16], radius: 24 },
  { color: "rgba(43, 179, 163, 0.12)", at: [90, 30], radius: 22 },
  { color: "rgba(217, 179, 130, 0.16)", at: [12, 46], radius: 24 },
  { color: "rgba(212, 87, 107, 0.12)", at: [80, 60], radius: 22 },
  { color: "rgba(92, 107, 255, 0.16)", at: [15, 74], radius: 24 },
  { color: "rgba(217, 179, 130, 0.14)", at: [85, 90], radius: 24 },
];

export const glowBackground = (glows: Glow[]) =>
  glows.map((g) => `radial-gradient(circle at ${g.at[0]}% ${g.at[1]}%, ${g.color}, transparent ${g.radius}%)`).join(", ");

/* =========================================================================
   2-bo'lim: "Varaq aylanadi" — natija varaqasi teskari holda tushadi,
   oltin chiziqlar bilan birga aylanib, natijalar yoziladi
   ========================================================================= */
export const REVEAL_HEIGHT = { desktop: 320, mobile: 260 } as const;
/** Bo'lim ekranga qancha kirganda (ekran balandligi ulushi) animatsiya boshlanadi */
export const REVEAL_LEAD = 0.75;

export const REVEAL_RESULT = {
  brand: "LevelX English",
  form: "Test Report Form",
  exam: "Multilevel · CEFR",
  ref: "№ LX-2026-0079",
  name: { uz: "Sizning ismingiz", en: "Your name" } as Bi,
  date: "2026",
  centre: "LevelX Online",
  scores: [
    { key: "listening", label: "Listening", value: 79 },
    { key: "reading", label: "Reading", value: 82 },
    { key: "writing", label: "Writing", value: 76 },
    { key: "speaking", label: "Speaking", value: 77 },
  ],
  overall: 79,
  level: "C1",
  comment: { uz: "Ajoyib natija! Keyingi maqsad — C1 dan ham yuqori.", en: "Excellent result! Next goal — beyond C1." } as Bi,
  sample: { uz: "Namuna", en: "Sample" } as Bi,
} as const;

/** Vaqtlar (0..1 — shu bo'lim ichidagi skroll ulushi) */
export const REVEAL_TIMES = {
  intro: [0, 0.12] as Range,
  outro: [0.84, 1] as Range,
  name: [0.5, 0.6] as Range,
  scores: [0.55, 0.76] as Range,
  overall: [0.72, 0.8] as Range,
  comment: [0.8, 0.9] as Range,
  signature: [0.88, 0.96] as Range,
};

export const REVEAL_KEYFRAMES: Record<string, Keyframe[]> = {
  // Varaq: bo'lim ekranga kirayotganda yuqoridan teskari tushib paydo bo'ladi (ry=180 — orqa tomoni), keyin aylanadi
  card: [
    { p: 0, y: -0.42, rx: 40, ry: 180, r: -14, s: 0.76 },
    { p: 0.14, y: -0.2, rx: 30, ry: 180, r: -10, s: 0.84 },
    { p: 0.24, y: -0.03, rx: 16, ry: 180, r: -6, s: 0.9 },
    { p: 0.3, y: 0, rx: 10, ry: 172, r: -4, s: 0.94 },
    { p: 0.48, y: 0, rx: 0, ry: 0, r: -2, s: 1 },
    { p: 0.5, s: 1.02 },
    { p: 0.54, s: 1 },
    { p: 0.84, y: 0, rx: 0, ry: 0, r: -1, s: 1 },
    // Yakun: varaq biroz yuqoriga ko'tariladi — pastdagi shior va tugmaga joy
    { p: 0.94, y: -0.07, rx: 0, ry: 0, r: -1, s: 0.93 },
    { p: 1, y: -0.07, rx: 0, ry: 0, r: -1, s: 0.93 },
  ],
  shadow: [
    { p: 0, y: 0.1, s: 0.5, o: 0 },
    { p: 0.22, y: 0.04, s: 0.85, o: 0.5 },
    { p: 0.48, y: 0.02, s: 1, o: 0.65 },
    { p: 0.84, y: 0.02, s: 1, o: 0.6 },
    { p: 0.94, y: -0.09, s: 0.93, o: 0.6 },
    { p: 1, y: -0.09, s: 0.93, o: 0.6 },
  ],
  // Aylanish o'rtasida oltin chaqnash
  flash: [
    { p: 0.32, o: 0, s: 0.5 },
    { p: 0.4, o: 1, s: 1 },
    { p: 0.55, o: 0, s: 1.6 },
  ],
  // Varaq atrofidagi oltin nur: old tomoni ochilganda yonadi
  // (2D qatlam: varaq tekis bo'lgandagi harakatini takrorlaydi)
  rim: [
    { p: 0.47, y: 0, r: -2, s: 1, o: 0 },
    { p: 0.5, s: 1.02 },
    { p: 0.54, s: 1 },
    { p: 0.56, o: 1 },
    { p: 0.84, y: 0, r: -1, s: 1 },
    { p: 0.94, y: -0.07, r: -1, s: 0.93 },
    { p: 1, y: -0.07, r: -1, s: 0.93 },
  ],
  // Muhr "zarbi"
  stamp: [
    { p: 0.8, o: 0, s: 2.4, r: -30 },
    { p: 0.84, o: 1, s: 0.94, r: -10 },
    { p: 0.86, o: 1, s: 1, r: -10 },
  ],
};

/**
 * Oltin "sehrli" chiziqlar: SVG yo'llari (1440×900 koordinatada, ekranga cho'ziladi).
 * `draw` — qaysi oraliqda chizilib ochiladi. `width` — asosiy chiziq qalinligi.
 */
export interface Ribbon {
  d: string;
  draw: Range;
  width: number;
  /** Qo'shimcha ingichka "egizak" chiziqlar siljishi (px) */
  twins: number[];
  /** Atrofidagi uchqunlar soni */
  sparks: number;
}

export const RIBBONS: Ribbon[] = [
  {
    d: "M -60 830 C 180 790, 280 600, 410 540 S 640 640, 800 600 S 1010 300, 1160 250 S 1390 170, 1520 110",
    draw: [0.02, 0.42],
    width: 3.2,
    twins: [-10, 12],
    sparks: 30,
  },
  {
    d: "M -80 640 C 120 690, 240 430, 380 370 S 560 160, 760 190 S 990 430, 1130 390 S 1360 170, 1520 210",
    draw: [0.08, 0.48],
    width: 2.5,
    twins: [9],
    sparks: 24,
  },
  {
    d: "M 80 940 C 300 850, 400 720, 560 740 S 900 850, 1050 720 S 1250 440, 1520 380",
    draw: [0.14, 0.55],
    width: 2,
    twins: [-8],
    sparks: 19,
  },
];
