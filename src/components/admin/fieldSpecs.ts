import { ARTICLE_TOPICS, SECTIONS, SECTION_LABEL } from "@/lib/constants";
import type { AdminField } from "./AdminForm";

/** Admin formalarining maydon ta'riflari — bitta joyda saqlanadi */

export const CATEGORY_LABEL: Record<string, string> = {
  full_mock: "Full Mock",
  latest_questions: "Oxirgi savollar",
  general_english: "General English",
  exam_checking: "Exam Checking",
};

export const QUESTION_KINDS = [
  { value: "mcq", label: "Multiple choice (1 javob)" },
  { value: "multi_select", label: "Multiple choice (bir necha javob)" },
  { value: "true_false_ng", label: "True / False / Not Given" },
  { value: "gap_fill", label: "Gap filling (bo'sh joy)" },
  { value: "short_answer", label: "Qisqa javob" },
  { value: "matching", label: "Matching (moslashtirish)" },
  { value: "essay", label: "Essay / Writing task (qo'lda tekshiriladi)" },
  { value: "speaking_prompt", label: "Speaking topic (qo'lda tekshiriladi)" },
];

type Defaults = Record<string, unknown> | undefined;

const s = (d: Defaults, key: string, fallback = ""): string =>
  (d?.[key] as string | null | undefined) ?? fallback;

const n = (d: Defaults, key: string, fallback: number): number =>
  typeof d?.[key] === "number" ? (d[key] as number) : fallback;

const j = (d: Defaults, key: string, fallback = "[]"): string => {
  const value = d?.[key];
  if (value === undefined || value === null) return fallback;
  if (typeof value === "string") return value;
  return JSON.stringify(value, null, 2);
};

/* ----------------------------------------------------------------- TESTLAR */

export function testSetFields(d?: Defaults): AdminField[] {
  return [
    { name: "id", label: "", type: "hidden", defaultValue: s(d, "id") },
    {
      name: "title",
      label: "Sarlavha",
      type: "text",
      required: true,
      defaultValue: s(d, "title"),
      placeholder: "Full Mock Test 5",
    },
    {
      name: "slug",
      label: "Slug (URL manzili)",
      type: "text",
      required: true,
      defaultValue: s(d, "slug"),
      placeholder: "full-mock-5",
      hint: "Faqat kichik lotin harflari, raqam va '-'",
    },
    {
      name: "category",
      label: "Turkum",
      type: "select",
      defaultValue: s(d, "category", "full_mock"),
      options: Object.entries(CATEGORY_LABEL).map(([value, label]) => ({
        value,
        label,
      })),
    },
    {
      name: "section",
      label: "Bo'lim",
      type: "select",
      defaultValue: s(d, "section"),
      hint: "Full Mock / Exam uchun bo'sh qoldiring",
      options: [
        { value: "", label: "— yo'q (to'liq test) —" },
        ...SECTIONS.map((x) => ({ value: x, label: SECTION_LABEL[x] })),
      ],
    },
    {
      name: "year_label",
      label: "Yil",
      type: "text",
      defaultValue: s(d, "year_label"),
      placeholder: "2025–2026",
      hint: "Faqat 'Oxirgi savollar' turkumi uchun",
    },
    {
      name: "level",
      label: "Daraja",
      type: "text",
      defaultValue: s(d, "level"),
      placeholder: "B1–C1",
    },
    {
      name: "duration_minutes",
      label: "Davomiyligi (daqiqa)",
      type: "number",
      defaultValue: n(d, "duration_minutes", 60),
    },
    {
      name: "order_index",
      label: "Tartib raqami",
      type: "number",
      defaultValue: n(d, "order_index", 0),
    },
    {
      name: "description",
      label: "Tavsif",
      type: "textarea",
      rows: 3,
      defaultValue: s(d, "description"),
    },
    {
      name: "is_premium",
      label: "🔒 Premium test",
      type: "checkbox",
      defaultValue: Boolean(d?.is_premium),
    },
    {
      name: "published",
      label: "✅ Saytda ko'rinsin",
      type: "checkbox",
      defaultValue: d ? Boolean(d.published) : true,
    },
  ];
}

export function testPartFields(testSetId: string, d?: Defaults): AdminField[] {
  return [
    { name: "id", label: "", type: "hidden", defaultValue: s(d, "id") },
    {
      name: "test_set_id",
      label: "",
      type: "hidden",
      defaultValue: testSetId,
    },
    {
      name: "title",
      label: "Bo'lim nomi",
      type: "text",
      required: true,
      defaultValue: s(d, "title"),
      placeholder: "Reading — Part 1",
    },
    {
      name: "section",
      label: "Ko'nikma",
      type: "select",
      defaultValue: s(d, "section", "reading"),
      options: SECTIONS.map((x) => ({ value: x, label: SECTION_LABEL[x] })),
    },
    {
      name: "duration_minutes",
      label: "Davomiyligi (daqiqa)",
      type: "number",
      defaultValue: n(d, "duration_minutes", 15),
    },
    {
      name: "order_index",
      label: "Tartib raqami",
      type: "number",
      defaultValue: n(d, "order_index", 0),
    },
    {
      name: "instructions",
      label: "Ko'rsatma (o'quvchiga)",
      type: "textarea",
      rows: 2,
      defaultValue: s(d, "instructions"),
      placeholder: "Matnni o'qing va savollarga javob bering.",
    },
    {
      name: "passage",
      label: "Reading matni (HTML)",
      type: "textarea",
      rows: 8,
      defaultValue: s(d, "passage"),
      placeholder: "<h2>Sarlavha</h2>\n<p>Matn…</p>",
      hint: "HTML teglardan foydalaning: <h2>, <p>, <ul>, <strong>",
    },
    {
      name: "audio_url",
      label: "Audio manzili (URL)",
      type: "text",
      defaultValue: s(d, "audio_url"),
      placeholder: "https://…/audio.mp3",
      hint: "Supabase Storage → audio bucket dagi ochiq havola",
    },
    {
      name: "transcript",
      label: "Transkript",
      type: "textarea",
      rows: 6,
      defaultValue: s(d, "transcript"),
    },
    {
      name: "image_url",
      label: "Rasm manzili (Writing Task 1 uchun)",
      type: "text",
      defaultValue: s(d, "image_url"),
    },
  ];
}

export function questionFields(
  partId: string,
  testSetId: string,
  d?: Defaults,
): AdminField[] {
  return [
    { name: "id", label: "", type: "hidden", defaultValue: s(d, "id") },
    { name: "part_id", label: "", type: "hidden", defaultValue: partId },
    {
      name: "test_set_id",
      label: "",
      type: "hidden",
      defaultValue: testSetId,
    },
    {
      name: "kind",
      label: "Savol turi",
      type: "select",
      defaultValue: s(d, "kind", "mcq"),
      options: QUESTION_KINDS,
    },
    {
      name: "points",
      label: "Ball",
      type: "number",
      defaultValue: n(d, "points", 1),
    },
    {
      name: "prompt",
      label: "Savol matni",
      type: "textarea",
      rows: 3,
      required: true,
      defaultValue: s(d, "prompt"),
      full: true,
    },
    {
      name: "options",
      label: "Variantlar (JSON)",
      type: "json",
      defaultValue: j(d, "options"),
      hint: 'Misol: ["Maqsad","Yutuq","Imkoniyat","Mas\'uliyat"] · Gap filling uchun: []',
    },
    {
      name: "correct_answer",
      label: "To'g'ri javob (JSON)",
      type: "json",
      defaultValue: j(d, "correct_answer", '""'),
      hint: 'Misol: "Yutuq" · bir necha variant: ["colour","color"] · matching: {"1":"A","2":"C"} · Essay/Speaking uchun bo\'sh qoldiring',
    },
    {
      name: "help_text",
      label: "Qo'shimcha ko'rsatma",
      type: "text",
      defaultValue: s(d, "help_text"),
    },
    {
      name: "order_index",
      label: "Tartib raqami",
      type: "number",
      defaultValue: n(d, "order_index", 0),
    },
    {
      name: "explanation",
      label: "Izoh (javobdan keyin ko'rsatiladi)",
      type: "textarea",
      rows: 2,
      defaultValue: s(d, "explanation"),
    },
  ];
}

/* --------------------------------------------------------------- MAQOLALAR */

export function articleFields(d?: Defaults): AdminField[] {
  return [
    { name: "id", label: "", type: "hidden", defaultValue: s(d, "id") },
    {
      name: "title",
      label: "Sarlavha",
      type: "text",
      required: true,
      defaultValue: s(d, "title"),
    },
    {
      name: "slug",
      label: "Slug",
      type: "text",
      required: true,
      defaultValue: s(d, "slug"),
      placeholder: "how-sleep-works",
    },
    {
      name: "topic",
      label: "Mavzu",
      type: "select",
      defaultValue: s(d, "topic", "science"),
      options: ARTICLE_TOPICS.map((t) => ({
        value: t.slug,
        label: `${t.emoji} ${t.label}`,
      })),
    },
    {
      name: "level",
      label: "Daraja",
      type: "text",
      defaultValue: s(d, "level"),
      placeholder: "B2",
    },
    {
      name: "read_minutes",
      label: "O'qish vaqti (daqiqa)",
      type: "number",
      defaultValue: n(d, "read_minutes", 5),
    },
    {
      name: "order_index",
      label: "Tartib raqami",
      type: "number",
      defaultValue: n(d, "order_index", 0),
    },
    {
      name: "excerpt",
      label: "Qisqacha tavsif",
      type: "textarea",
      rows: 2,
      defaultValue: s(d, "excerpt"),
    },
    {
      name: "cover_url",
      label: "Muqova rasmi (URL)",
      type: "text",
      defaultValue: s(d, "cover_url"),
    },
    {
      name: "body",
      label: "Maqola matni (HTML)",
      type: "textarea",
      rows: 12,
      required: true,
      defaultValue: s(d, "body"),
      placeholder: "<p>Birinchi xatboshi…</p>\n<h2>Bo'lim</h2>\n<p>…</p>",
    },
    {
      name: "vocabulary",
      label: "Yangi so'zlar (JSON)",
      type: "json",
      defaultValue: j(d, "vocabulary"),
      hint: '[{"word":"achievement","meaning":"yutuq","example":"..."}]',
    },
    {
      name: "is_premium",
      label: "🔒 Premium maqola",
      type: "checkbox",
      defaultValue: Boolean(d?.is_premium),
    },
    {
      name: "published",
      label: "✅ Saytda ko'rinsin",
      type: "checkbox",
      defaultValue: d ? Boolean(d.published) : true,
    },
  ];
}

export function articleQuestionFields(
  articleId: string,
  d?: Defaults,
): AdminField[] {
  return [
    { name: "id", label: "", type: "hidden", defaultValue: s(d, "id") },
    {
      name: "article_id",
      label: "",
      type: "hidden",
      defaultValue: articleId,
    },
    {
      name: "kind",
      label: "Savol turi",
      type: "select",
      defaultValue: s(d, "kind", "mcq"),
      options: QUESTION_KINDS.filter(
        (k) => k.value !== "essay" && k.value !== "speaking_prompt",
      ),
    },
    {
      name: "order_index",
      label: "Tartib raqami",
      type: "number",
      defaultValue: n(d, "order_index", 0),
    },
    {
      name: "prompt",
      label: "Savol matni",
      type: "textarea",
      rows: 2,
      required: true,
      defaultValue: s(d, "prompt"),
      full: true,
    },
    {
      name: "options",
      label: "Variantlar (JSON)",
      type: "json",
      defaultValue: j(d, "options"),
      hint: '["TRUE","FALSE","NOT GIVEN"] yoki ["A","B","C","D"]',
    },
    {
      name: "correct_answer",
      label: "To'g'ri javob (JSON)",
      type: "json",
      defaultValue: j(d, "correct_answer", '""'),
      hint: '"TRUE" yoki ["hippocampus"]',
    },
    {
      name: "explanation",
      label: "Izoh",
      type: "textarea",
      rows: 2,
      defaultValue: s(d, "explanation"),
    },
  ];
}

/* -------------------------------------------------------------- VOCABULARY */

export function vocabPackFields(d?: Defaults): AdminField[] {
  return [
    { name: "id", label: "", type: "hidden", defaultValue: s(d, "id") },
    {
      name: "title",
      label: "To'plam nomi",
      type: "text",
      required: true,
      defaultValue: s(d, "title"),
      placeholder: "Multilevel Essentials",
    },
    {
      name: "slug",
      label: "Slug",
      type: "text",
      required: true,
      defaultValue: s(d, "slug"),
      placeholder: "multilevel-essentials",
    },
    {
      name: "level",
      label: "Daraja",
      type: "text",
      defaultValue: s(d, "level"),
      placeholder: "B1",
    },
    {
      name: "emoji",
      label: "Emoji",
      type: "text",
      defaultValue: s(d, "emoji", "📘"),
    },
    {
      name: "order_index",
      label: "Tartib raqami",
      type: "number",
      defaultValue: n(d, "order_index", 0),
    },
    {
      name: "description",
      label: "Tavsif",
      type: "textarea",
      rows: 2,
      defaultValue: s(d, "description"),
    },
    {
      name: "is_premium",
      label: "🔒 Premium to'plam",
      type: "checkbox",
      defaultValue: Boolean(d?.is_premium),
    },
    {
      name: "published",
      label: "✅ Saytda ko'rinsin",
      type: "checkbox",
      defaultValue: d ? Boolean(d.published) : true,
    },
  ];
}

export function vocabWordFields(packId: string, d?: Defaults): AdminField[] {
  return [
    { name: "id", label: "", type: "hidden", defaultValue: s(d, "id") },
    { name: "pack_id", label: "", type: "hidden", defaultValue: packId },
    {
      name: "word",
      label: "So'z (inglizcha)",
      type: "text",
      required: true,
      defaultValue: s(d, "word"),
      placeholder: "achievement",
    },
    {
      name: "meaning_uz",
      label: "Tarjimasi (o'zbekcha)",
      type: "text",
      required: true,
      defaultValue: s(d, "meaning_uz"),
      placeholder: "yutuq",
    },
    {
      name: "options",
      label: "4 ta variant (JSON)",
      type: "json",
      defaultValue: j(d, "options"),
      hint: '["Maqsad","Yutuq","Imkoniyat","Mas\'uliyat"]',
    },
    {
      name: "correct_index",
      label: "To'g'ri variant raqami",
      type: "number",
      defaultValue: n(d, "correct_index", 0),
      hint: "0 = birinchi, 1 = ikkinchi, 2 = uchinchi, 3 = to'rtinchi",
    },
    {
      name: "meaning_en",
      label: "Inglizcha izoh",
      type: "text",
      defaultValue: s(d, "meaning_en"),
    },
    {
      name: "order_index",
      label: "Tartib raqami",
      type: "number",
      defaultValue: n(d, "order_index", 0),
    },
    {
      name: "example",
      label: "Misol gap",
      type: "textarea",
      rows: 2,
      defaultValue: s(d, "example"),
      placeholder: "Winning the scholarship was a great achievement.",
    },
  ];
}

/* ----------------------------------------------------------------- KURSLAR */

export function courseFields(d?: Defaults): AdminField[] {
  return [
    { name: "id", label: "", type: "hidden", defaultValue: s(d, "id") },
    {
      name: "title",
      label: "Kurs nomi",
      type: "text",
      required: true,
      defaultValue: s(d, "title"),
      placeholder: "Multilevel B2 Course",
    },
    {
      name: "slug",
      label: "Slug",
      type: "text",
      required: true,
      defaultValue: s(d, "slug"),
      placeholder: "multilevel-b2",
    },
    {
      name: "level",
      label: "Daraja",
      type: "text",
      defaultValue: s(d, "level"),
      placeholder: "B2",
    },
    {
      name: "duration",
      label: "Davomiyligi",
      type: "text",
      defaultValue: s(d, "duration"),
      placeholder: "4 oy",
    },
    {
      name: "days",
      label: "Dars kunlari",
      type: "text",
      defaultValue: s(d, "days"),
      placeholder: "Dushanba · Chorshanba · Juma",
    },
    {
      name: "time_text",
      label: "Vaqti",
      type: "text",
      defaultValue: s(d, "time_text"),
      placeholder: "18:00 – 20:00",
    },
    {
      name: "price",
      label: "Narxi",
      type: "text",
      defaultValue: s(d, "price"),
      placeholder: "700 000 so'm / oy",
    },
    {
      name: "seats",
      label: "Guruhdagi o'rinlar",
      type: "number",
      defaultValue: n(d, "seats", 12),
    },
    {
      name: "address",
      label: "Manzil",
      type: "text",
      defaultValue: s(d, "address"),
      full: true,
    },
    {
      name: "summary",
      label: "Qisqacha tavsif",
      type: "textarea",
      rows: 2,
      defaultValue: s(d, "summary"),
    },
    {
      name: "description",
      label: "To'liq tavsif",
      type: "textarea",
      rows: 6,
      defaultValue: s(d, "description"),
    },
    {
      name: "image_url",
      label: "Rasm (URL)",
      type: "text",
      defaultValue: s(d, "image_url"),
    },
    {
      name: "order_index",
      label: "Tartib raqami",
      type: "number",
      defaultValue: n(d, "order_index", 0),
    },
    {
      name: "published",
      label: "✅ Saytda ko'rinsin",
      type: "checkbox",
      defaultValue: d ? Boolean(d.published) : true,
    },
  ];
}
