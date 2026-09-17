/**
 * Ma'lumotlar bazasi turlari.
 * supabase/migrations/*.sql fayllaridagi jadvallarga to'liq mos keladi.
 */

export type UserRole = "student" | "teacher" | "admin";

export type SkillSection = "reading" | "listening" | "writing" | "speaking";

export type TestCategory =
  | "full_mock"
  | "latest_questions"
  | "general_english"
  | "exam_checking";

export type QuestionKind =
  | "mcq"
  | "multi_select"
  | "true_false_ng"
  | "gap_fill"
  | "matching"
  | "short_answer"
  | "essay"
  | "speaking_prompt";

export type AttemptMode = "practice" | "full_mock" | "exam_checking";

export type AttemptStatus = "in_progress" | "submitted" | "graded" | "abandoned";

export type ApplicationStatus = "new" | "contacted" | "enrolled" | "rejected";

export type PremiumRequestStatus = "pending" | "approved" | "rejected";

/** Foydalanuvchi javobi: matn, variantlar ro'yxati yoki moslashtirish jadvali */
export type AnswerValue = string | string[] | Record<string, string> | null;

export type AnswerMap = Record<string, AnswerValue>;

export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  role: UserRole;
  is_premium: boolean;
  premium_until: string | null;
  total_xp: number;
  onboarded: boolean;
  created_at: string;
  updated_at: string;
}

export interface TestSet {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  category: TestCategory;
  section: SkillSection | null;
  year_label: string | null;
  level: string | null;
  duration_minutes: number;
  is_premium: boolean;
  published: boolean;
  order_index: number;
  cover_url: string | null;
  created_at: string;
}

export interface TestPart {
  id: string;
  test_set_id: string;
  section: SkillSection;
  title: string;
  instructions: string | null;
  passage: string | null;
  audio_url: string | null;
  transcript: string | null;
  image_url: string | null;
  duration_minutes: number;
  order_index: number;
}

/** Matching savolidagi bitta qator */
export interface MatchingOption {
  left: string;
  label: string;
  right: string[];
}

/** Savol — to'g'ri javobsiz (foydalanuvchiga yuboriladigan ko'rinish) */
export interface PublicQuestion {
  id: string;
  part_id: string;
  kind: QuestionKind;
  prompt: string;
  help_text: string | null;
  options: string[] | MatchingOption[];
  points: number;
  order_index: number;
}

/** Savol — to'g'ri javob bilan (faqat admin/server uchun) */
export interface FullQuestion extends PublicQuestion {
  correct_answer: unknown;
  explanation: string | null;
}

export interface VocabularyEntry {
  word: string;
  meaning: string;
  example?: string;
}

export interface Article {
  id: string;
  slug: string;
  title: string;
  topic: string;
  excerpt: string | null;
  cover_url: string | null;
  body: string;
  level: string | null;
  read_minutes: number;
  vocabulary: VocabularyEntry[];
  is_premium: boolean;
  published: boolean;
  order_index: number;
  created_at: string;
}

/** list_articles() RPC natijasi — matnsiz */
export interface ArticleListItem {
  id: string;
  slug: string;
  title: string;
  topic: string;
  excerpt: string | null;
  cover_url: string | null;
  level: string | null;
  read_minutes: number;
  is_premium: boolean;
  word_count: number;
  question_count: number;
  created_at: string;
}

export interface ArticleQuestionPublic {
  id: string;
  article_id: string;
  kind: QuestionKind;
  prompt: string;
  options: string[];
  order_index: number;
}

export interface VocabPack {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  level: string | null;
  emoji: string | null;
  is_premium: boolean;
  published: boolean;
  order_index: number;
  created_at: string;
}

export interface VocabRoundWord {
  id: string;
  word: string;
  options: string[];
}

export interface VocabSession {
  id: string;
  user_id: string;
  pack_id: string | null;
  score: number;
  correct_count: number;
  total_count: number;
  duration_ms: number;
  created_at: string;
}

export type SectionScores = Partial<Record<SkillSection, number>>;

export interface SectionBreakdownEntry {
  correct: number;
  total: number;
  earned: number;
  max: number;
  manual: boolean;
}

export type SectionBreakdown = Partial<
  Record<SkillSection, SectionBreakdownEntry>
>;

export interface Attempt {
  id: string;
  user_id: string;
  test_set_id: string;
  mode: AttemptMode;
  status: AttemptStatus;
  current_part_index: number;
  answers: AnswerMap;
  section_scores: SectionScores;
  section_breakdown: SectionBreakdown;
  overall_score: number | null;
  cefr_level: string | null;
  teacher_feedback: Partial<Record<SkillSection, string>>;
  needs_manual_check: boolean;
  graded_by: string | null;
  graded_at: string | null;
  started_at: string;
  submitted_at: string | null;
  expires_at: string | null;
}

export interface Course {
  id: string;
  slug: string;
  title: string;
  level: string | null;
  summary: string | null;
  description: string | null;
  duration: string | null;
  days: string | null;
  time_text: string | null;
  price: string | null;
  address: string | null;
  image_url: string | null;
  seats: number | null;
  published: boolean;
  order_index: number;
  created_at: string;
}

export interface CourseApplication {
  id: string;
  course_id: string;
  user_id: string | null;
  full_name: string;
  phone: string;
  note: string | null;
  status: ApplicationStatus;
  created_at: string;
}

export interface PremiumRequest {
  id: string;
  user_id: string;
  plan: string;
  months: number;
  amount: number | null;
  status: PremiumRequestStatus;
  receipt_url: string | null;
  note: string | null;
  created_at: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  message: string;
  handled: boolean;
  created_at: string;
}

export interface LeaderboardRow {
  rank: number;
  user_id: string;
  full_name: string;
  avatar_url: string | null;
  is_premium: boolean;
  xp: number;
  games: number;
}

export interface MyRankRow {
  rank: number;
  xp: number;
  games: number;
}

export interface UserStats {
  tests_taken: number;
  exams_taken: number;
  best_overall: number | null;
  last_level: string | null;
  articles_done: number;
  games_played: number;
  total_xp: number;
  best_game: number | null;
}

/* -------------------------------------------------------------------------
   Sayt sozlamalari (site_settings jadvali)
   ------------------------------------------------------------------------- */
export interface ContactSettings {
  telegram: string;
  telegram_label: string;
  instagram: string;
  instagram_label: string;
  phone: string;
  phone_2?: string;
  email: string;
  address: string;
  map_url?: string;
  working_hours?: string;
}

export interface PremiumPlan {
  id: string;
  title: string;
  months: number;
  amount: number;
  note?: string;
  popular?: boolean;
}

export interface PaymentSettings {
  card_number: string;
  card_owner: string;
  instruction: string;
}

export interface CefrBands {
  C1: number;
  B2: number;
  B1: number;
  A2: number;
}

/** get_attempt_review() RPC natijasi — test yakunlangach javoblarni ko'rib chiqish */
export interface AttemptReviewRow {
  question_id: string;
  part_id: string;
  section: SkillSection;
  part_title: string;
  kind: QuestionKind;
  prompt: string;
  options: string[] | MatchingOption[];
  points: number;
  correct_answer: unknown;
  explanation: string | null;
  given_answer: AnswerValue;
  ratio: number | null;
  order_index: number;
}

/** list_pending_checks() RPC natijasi — o'qituvchi uchun navbat */
export interface PendingCheckRow {
  attempt_id: string;
  user_id: string;
  full_name: string | null;
  email: string | null;
  test_title: string;
  mode: AttemptMode;
  submitted_at: string | null;
  section_scores: SectionScores;
}
