-- ============================================================================
-- MULTILEVEL PLUS — 0001 SCHEMA
-- Bu faylni Supabase → SQL Editor ga to'liq nusxalab "Run" bosing.
-- Tartib: 0001_schema.sql → 0002_policies.sql → 0003_functions.sql → seed.sql
-- ============================================================================

create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- ENUM turlari
-- ----------------------------------------------------------------------------
do $$ begin
  create type user_role as enum ('student', 'teacher', 'admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type skill_section as enum ('reading', 'listening', 'writing', 'speaking');
exception when duplicate_object then null; end $$;

do $$ begin
  create type test_category as enum (
    'full_mock',         -- 3-bo'lim: FULL MOCK
    'latest_questions',  -- 4-bo'lim: Oxirgi tushgan savollar
    'general_english',   -- 5-bo'lim: Boost Your General English (listening practice)
    'exam_checking'      -- 10-bo'lim: Exam Full Checking
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type question_kind as enum (
    'mcq',             -- Multiple choice (bitta to'g'ri javob)
    'multi_select',    -- Bir nechta to'g'ri javob
    'true_false_ng',   -- True / False / Not Given
    'gap_fill',        -- Bo'sh joyni to'ldirish
    'matching',        -- Moslashtirish
    'short_answer',    -- Qisqa yozma javob
    'essay',           -- Writing task (qo'lda tekshiriladi)
    'speaking_prompt'  -- Speaking topic (audio javob, qo'lda tekshiriladi)
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type attempt_mode as enum ('practice', 'full_mock', 'exam_checking');
exception when duplicate_object then null; end $$;

do $$ begin
  create type attempt_status as enum ('in_progress', 'submitted', 'graded', 'abandoned');
exception when duplicate_object then null; end $$;

do $$ begin
  create type application_status as enum ('new', 'contacted', 'enrolled', 'rejected');
exception when duplicate_object then null; end $$;

do $$ begin
  create type premium_request_status as enum ('pending', 'approved', 'rejected');
exception when duplicate_object then null; end $$;

-- ----------------------------------------------------------------------------
-- 1. PROFILES — har bir foydalanuvchining shaxsiy profili (hujjat: 1-bo'lim)
-- ----------------------------------------------------------------------------
create table if not exists public.profiles (
  id            uuid primary key references auth.users (id) on delete cascade,
  email         text,
  full_name     text,
  avatar_url    text,
  phone         text,
  role          user_role   not null default 'student',
  is_premium    boolean     not null default false,
  premium_until timestamptz,
  total_xp      integer     not null default 0,
  onboarded     boolean     not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists profiles_role_idx on public.profiles (role);
create index if not exists profiles_xp_idx on public.profiles (total_xp desc);

-- ----------------------------------------------------------------------------
-- 2. TEST_SETS — barcha testlar ombori
--    category = full_mock         → 3-bo'lim
--    category = latest_questions  → 4-bo'lim (year_label bilan)
--    category = general_english   → 5-bo'lim Listening Practice
--    category = exam_checking     → 10-bo'lim (Premium imtihon)
-- ----------------------------------------------------------------------------
create table if not exists public.test_sets (
  id               uuid primary key default gen_random_uuid(),
  slug             text unique not null,
  title            text not null,
  description      text,
  category         test_category not null,
  -- section NULL bo'lsa → test ichida 4 ta bo'lim bor (Full Mock / Exam Checking)
  section          skill_section,
  year_label       text,
  level            text,
  duration_minutes integer not null default 60,
  is_premium       boolean not null default false,
  published        boolean not null default true,
  order_index      integer not null default 0,
  cover_url        text,
  created_at       timestamptz not null default now()
);

create index if not exists test_sets_category_idx on public.test_sets (category, published);
create index if not exists test_sets_year_idx on public.test_sets (year_label, section);
create index if not exists test_sets_order_idx on public.test_sets (order_index);

-- ----------------------------------------------------------------------------
-- 3. TEST_PARTS — test ichidagi bo'limlar (Reading Part 1, Listening Part 2 ...)
-- ----------------------------------------------------------------------------
create table if not exists public.test_parts (
  id               uuid primary key default gen_random_uuid(),
  test_set_id      uuid not null references public.test_sets (id) on delete cascade,
  section          skill_section not null,
  title            text not null,
  instructions     text,
  passage          text,   -- Reading matni / Writing topshiriq matni
  audio_url        text,   -- Listening audio (Supabase Storage URL)
  transcript       text,   -- Listening transkript (Premium uchun ko'rsatiladi)
  image_url        text,   -- Writing Task 1 grafik/jadval rasmi
  duration_minutes integer not null default 15,
  order_index      integer not null default 0
);

create index if not exists test_parts_set_idx on public.test_parts (test_set_id, order_index);

-- ----------------------------------------------------------------------------
-- 4. QUESTIONS — savollar
--    options:        ["Maqsad","Yutuq","Imkoniyat","Mas'uliyat"]
--    correct_answer: "B" | ["A","C"] | "TRUE" | {"1":"cat","2":"dog"}
-- ----------------------------------------------------------------------------
create table if not exists public.questions (
  id             uuid primary key default gen_random_uuid(),
  part_id        uuid not null references public.test_parts (id) on delete cascade,
  kind           question_kind not null,
  prompt         text not null,
  help_text      text,
  options        jsonb not null default '[]'::jsonb,
  correct_answer jsonb,
  points         numeric(6, 2) not null default 1,
  explanation    text,
  order_index    integer not null default 0
);

create index if not exists questions_part_idx on public.questions (part_id, order_index);

-- ----------------------------------------------------------------------------
-- 5. ARTICLES — Boost Your General English → Articles (hujjat: 5A-bo'lim)
-- ----------------------------------------------------------------------------
create table if not exists public.articles (
  id           uuid primary key default gen_random_uuid(),
  slug         text unique not null,
  title        text not null,
  topic        text not null,  -- science | technology | health | education |
                               -- psychology | history | environment | society
  excerpt      text,
  cover_url    text,
  body         text not null,
  level        text,
  read_minutes integer not null default 5,
  -- [{ "word": "achievement", "meaning": "yutuq", "example": "..." }]
  vocabulary   jsonb not null default '[]'::jsonb,
  is_premium   boolean not null default false,
  published    boolean not null default true,
  order_index  integer not null default 0,
  created_at   timestamptz not null default now()
);

create index if not exists articles_topic_idx on public.articles (topic, published);

create table if not exists public.article_questions (
  id             uuid primary key default gen_random_uuid(),
  article_id     uuid not null references public.articles (id) on delete cascade,
  kind           question_kind not null,
  prompt         text not null,
  options        jsonb not null default '[]'::jsonb,
  correct_answer jsonb,
  explanation    text,
  order_index    integer not null default 0
);

create index if not exists article_questions_article_idx
  on public.article_questions (article_id, order_index);

-- ----------------------------------------------------------------------------
-- 6. VOCABULARY BATTLE (hujjat: 6- va 7-bo'limlar)
-- ----------------------------------------------------------------------------
create table if not exists public.vocab_packs (
  id          uuid primary key default gen_random_uuid(),
  slug        text unique not null,
  title       text not null,
  description text,
  level       text,
  emoji       text default '📘',
  is_premium  boolean not null default false,
  published   boolean not null default true,
  order_index integer not null default 0,
  created_at  timestamptz not null default now()
);

create table if not exists public.vocab_words (
  id            uuid primary key default gen_random_uuid(),
  pack_id       uuid not null references public.vocab_packs (id) on delete cascade,
  word          text not null,
  meaning_uz    text not null,
  meaning_en    text,
  example       text,
  options       jsonb not null,             -- 4 ta variant (o'zbekcha)
  correct_index integer not null check (correct_index between 0 and 9),
  order_index   integer not null default 0
);

create index if not exists vocab_words_pack_idx on public.vocab_words (pack_id, order_index);

create table if not exists public.vocab_sessions (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles (id) on delete cascade,
  pack_id       uuid references public.vocab_packs (id) on delete set null,
  score         integer not null default 0,
  correct_count integer not null default 0,
  total_count   integer not null default 0,
  duration_ms   integer not null default 0,
  created_at    timestamptz not null default now()
);

create index if not exists vocab_sessions_user_idx on public.vocab_sessions (user_id, created_at desc);
create index if not exists vocab_sessions_created_idx on public.vocab_sessions (created_at desc);

-- ----------------------------------------------------------------------------
-- 7. ATTEMPTS — test/imtihon urinishlari va natijalari (hujjat: 12-bo'lim)
-- ----------------------------------------------------------------------------
create table if not exists public.attempts (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references public.profiles (id) on delete cascade,
  test_set_id        uuid not null references public.test_sets (id) on delete cascade,
  mode               attempt_mode   not null default 'practice',
  status             attempt_status not null default 'in_progress',
  current_part_index integer not null default 0,
  -- { "<question_id>": "B" | ["A","C"] | "matn" }
  answers            jsonb not null default '{}'::jsonb,
  -- { "reading": 68, "listening": 62, "writing": 58, "speaking": 61 }
  section_scores     jsonb not null default '{}'::jsonb,
  -- { "reading": {"correct": 12, "total": 15} , ... }
  section_breakdown  jsonb not null default '{}'::jsonb,
  overall_score      numeric(6, 2),
  cefr_level         text,
  -- { "writing": "O'qituvchi izohi", "speaking": "..." }
  teacher_feedback   jsonb not null default '{}'::jsonb,
  needs_manual_check boolean not null default false,
  graded_by          uuid references public.profiles (id) on delete set null,
  graded_at          timestamptz,
  started_at         timestamptz not null default now(),
  submitted_at       timestamptz,
  expires_at         timestamptz
);

create index if not exists attempts_user_idx on public.attempts (user_id, started_at desc);
create index if not exists attempts_status_idx on public.attempts (status, needs_manual_check);
create index if not exists attempts_set_idx on public.attempts (test_set_id);

-- ----------------------------------------------------------------------------
-- 8. ARTICLE / PRACTICE PROGRESS — o'qilgan maqolalar va natijalari
-- ----------------------------------------------------------------------------
create table if not exists public.article_progress (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles (id) on delete cascade,
  article_id    uuid not null references public.articles (id) on delete cascade,
  correct_count integer not null default 0,
  total_count   integer not null default 0,
  answers       jsonb not null default '{}'::jsonb,
  completed_at  timestamptz not null default now(),
  unique (user_id, article_id)
);

-- ----------------------------------------------------------------------------
-- 9. OFFLINE COURSES (hujjat: 14-bo'lim)
-- ----------------------------------------------------------------------------
create table if not exists public.courses (
  id          uuid primary key default gen_random_uuid(),
  slug        text unique not null,
  title       text not null,
  level       text,
  summary     text,
  description text,
  duration    text,   -- "3 oy"
  days        text,   -- "Dushanba / Chorshanba / Juma"
  time_text   text,   -- "18:00 – 20:00"
  price       text,   -- "600 000 so'm / oy"
  address     text,
  image_url   text,
  seats       integer,
  published   boolean not null default true,
  order_index integer not null default 0,
  created_at  timestamptz not null default now()
);

create table if not exists public.course_applications (
  id         uuid primary key default gen_random_uuid(),
  course_id  uuid not null references public.courses (id) on delete cascade,
  user_id    uuid references public.profiles (id) on delete set null,
  full_name  text not null,
  phone      text not null,
  note       text,
  status     application_status not null default 'new',
  created_at timestamptz not null default now()
);

create index if not exists course_apps_course_idx
  on public.course_applications (course_id, created_at desc);

-- ----------------------------------------------------------------------------
-- 10. PREMIUM SO'ROVLARI (hujjat: 8/9-bo'limlar)
-- ----------------------------------------------------------------------------
create table if not exists public.premium_requests (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles (id) on delete cascade,
  plan        text not null,          -- monthly | quarterly | yearly
  months      integer not null default 1,
  amount      integer,
  status      premium_request_status not null default 'pending',
  receipt_url text,
  note        text,
  created_at  timestamptz not null default now(),
  reviewed_by uuid references public.profiles (id) on delete set null,
  reviewed_at timestamptz
);

create index if not exists premium_requests_status_idx
  on public.premium_requests (status, created_at desc);

-- ----------------------------------------------------------------------------
-- 11. CONTACT (hujjat: 13-bo'lim)
-- ----------------------------------------------------------------------------
create table if not exists public.contact_messages (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  email      text,
  phone      text,
  message    text not null,
  handled    boolean not null default false,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 12. SAYT SOZLAMALARI — kontaktlar, CEFR chegaralari, Premium narxlari
-- ----------------------------------------------------------------------------
create table if not exists public.site_settings (
  key        text primary key,
  value      jsonb not null,
  updated_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- updated_at avtomatik yangilanishi
-- ----------------------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists profiles_touch_updated_at on public.profiles;
create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row execute function public.touch_updated_at();

drop trigger if exists site_settings_touch_updated_at on public.site_settings;
create trigger site_settings_touch_updated_at
  before update on public.site_settings
  for each row execute function public.touch_updated_at();
