-- ============================================================================
-- MULTILEVEL PLUS — 0002 XAVFSIZLIK (RLS) VA HUQUQLAR
--
-- Bu fayl eng muhim fayllardan biri. U quyidagilarni kafolatlaydi:
--   1) To'g'ri javoblar (correct_answer) HECH QACHON brauzerga chiqmaydi.
--   2) Premium kontentni faqat Premium foydalanuvchi o'qiy oladi.
--   3) Foydalanuvchi o'zini o'zi Premium qilib qo'ya olmaydi.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- YORDAMCHI FUNKSIYALAR
-- security definer → RLS ni chetlab o'tadi, shuning uchun rekursiya bo'lmaydi
-- ----------------------------------------------------------------------------
create or replace function public.auth_role()
returns user_role
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select p.role from public.profiles p where p.id = auth.uid()),
    'student'::user_role
  );
$$;

create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.auth_role() in ('admin'::user_role, 'teacher'::user_role);
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.auth_role() = 'admin'::user_role;
$$;

-- Premium aktivmi? (muddati o'tgan Premium hisobga olinmaydi)
create or replace function public.has_premium()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (
      select p.is_premium
         and (p.premium_until is null or p.premium_until > now())
      from public.profiles p
      where p.id = auth.uid()
    ),
    false
  );
$$;

-- Kontentga kirish huquqi: bepul bo'lsa hamma, premium bo'lsa faqat premium/xodim
create or replace function public.can_access(is_premium_content boolean)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select (not is_premium_content) or public.has_premium() or public.is_staff();
$$;

-- ----------------------------------------------------------------------------
-- YANGI FOYDALANUVCHI → PROFIL AVTOMATIK YARATILADI
-- (Google orqali kirganda ism va rasm ham olinadi)
-- ----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url, onboarded)
  values (
    new.id,
    new.email,
    nullif(trim(coalesce(
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name',
      ''
    )), ''),
    nullif(trim(coalesce(
      new.raw_user_meta_data ->> 'avatar_url',
      new.raw_user_meta_data ->> 'picture',
      ''
    )), ''),
    coalesce(
      nullif(trim(coalesce(
        new.raw_user_meta_data ->> 'full_name',
        new.raw_user_meta_data ->> 'name',
        ''
      )), '') is not null,
      false
    )
  )
  on conflict (id) do update
    set email      = excluded.email,
        avatar_url = coalesce(public.profiles.avatar_url, excluded.avatar_url),
        full_name  = coalesce(public.profiles.full_name, excluded.full_name);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ----------------------------------------------------------------------------
-- API HUQUQLARI — aniq beriladi
--
-- Supabase ko'p loyihalarda bu huquqlarni o'zi beradi, lekin loyiha
-- sozlamasiga ("Automatically expose new tables") bog'liq. Sayt har qanday
-- sozlamada ishlashi uchun ularni shu yerda aniq yozamiz.
--
-- Bu HIMOYANI ZAIFLASHTIRMAYDI: kim nimani ko'rishi va o'zgartirishi
-- pastdagi RLS qoidalari va ustun cheklovlari bilan belgilanadi.
-- Ular shu blokdan KEYIN keladi, shuning uchun tartib muhim.
-- ----------------------------------------------------------------------------
grant usage on schema public to anon, authenticated, service_role;

grant select, insert, update, delete
  on all tables in schema public to anon, authenticated;
grant all on all tables in schema public to service_role;

grant usage, select on all sequences in schema public
  to anon, authenticated, service_role;

-- RLS qoidalari ichida chaqiriladigan yordamchi funksiyalar
grant execute on function
  public.auth_role(),
  public.is_staff(),
  public.is_admin(),
  public.has_premium(),
  public.can_access(boolean)
to anon, authenticated, service_role;

-- ----------------------------------------------------------------------------
-- RLS NI YOQISH
-- ----------------------------------------------------------------------------
alter table public.profiles            enable row level security;
alter table public.test_sets           enable row level security;
alter table public.test_parts          enable row level security;
alter table public.questions           enable row level security;
alter table public.articles            enable row level security;
alter table public.article_questions   enable row level security;
alter table public.vocab_packs         enable row level security;
alter table public.vocab_words         enable row level security;
alter table public.vocab_sessions      enable row level security;
alter table public.attempts            enable row level security;
alter table public.article_progress    enable row level security;
alter table public.courses             enable row level security;
alter table public.course_applications enable row level security;
alter table public.premium_requests    enable row level security;
alter table public.contact_messages    enable row level security;
alter table public.site_settings       enable row level security;

-- ----------------------------------------------------------------------------
-- PROFILES
-- ----------------------------------------------------------------------------
drop policy if exists "profiles_select_own_or_staff" on public.profiles;
create policy "profiles_select_own_or_staff" on public.profiles
  for select using (id = auth.uid() or public.is_staff());

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists "profiles_staff_update" on public.profiles;
create policy "profiles_staff_update" on public.profiles
  for update using (public.is_admin()) with check (public.is_admin());

-- MUHIM: foydalanuvchi o'z rolini yoki Premium statusini O'ZGARTIRA OLMAYDI.
-- Faqat quyidagi ustunlarni yangilashga ruxsat beriladi.
revoke update on public.profiles from authenticated;
grant update (full_name, avatar_url, phone, onboarded) on public.profiles to authenticated;

-- ----------------------------------------------------------------------------
-- TEST_SETS — ro'yxat (sarlavhalar) hammaga ochiq, qulf faqat ichkarida
-- ----------------------------------------------------------------------------
drop policy if exists "test_sets_read_published" on public.test_sets;
create policy "test_sets_read_published" on public.test_sets
  for select using (published or public.is_staff());

drop policy if exists "test_sets_staff_write" on public.test_sets;
create policy "test_sets_staff_write" on public.test_sets
  for all using (public.is_staff()) with check (public.is_staff());

-- ----------------------------------------------------------------------------
-- TEST_PARTS — matn/audio. Premium testniki faqat Premium foydalanuvchiga.
-- ----------------------------------------------------------------------------
drop policy if exists "test_parts_read_allowed" on public.test_parts;
create policy "test_parts_read_allowed" on public.test_parts
  for select using (
    exists (
      select 1 from public.test_sets ts
      where ts.id = test_parts.test_set_id
        and (ts.published or public.is_staff())
        and public.can_access(ts.is_premium)
    )
  );

drop policy if exists "test_parts_staff_write" on public.test_parts;
create policy "test_parts_staff_write" on public.test_parts
  for all using (public.is_staff()) with check (public.is_staff());

-- ----------------------------------------------------------------------------
-- QUESTIONS — savollar. correct_answer ustuni pastda BLOKLANADI.
-- ----------------------------------------------------------------------------
drop policy if exists "questions_read_allowed" on public.questions;
create policy "questions_read_allowed" on public.questions
  for select using (
    exists (
      select 1
      from public.test_parts tp
      join public.test_sets ts on ts.id = tp.test_set_id
      where tp.id = questions.part_id
        and (ts.published or public.is_staff())
        and public.can_access(ts.is_premium)
    )
  );

drop policy if exists "questions_staff_write" on public.questions;
create policy "questions_staff_write" on public.questions
  for all using (public.is_staff()) with check (public.is_staff());

-- >>> TO'G'RI JAVOBLARNI YASHIRISH <<<
-- Oddiy foydalanuvchi API orqali ham correct_answer ni KO'RA OLMAYDI.
-- Tekshirish faqat serverdagi score_attempt() funksiyasida bo'ladi.
revoke select on public.questions from anon, authenticated;
grant select (id, part_id, kind, prompt, help_text, options, points, order_index)
  on public.questions to anon, authenticated;

-- ----------------------------------------------------------------------------
-- ARTICLES — Premium maqola matni faqat Premium uchun.
-- Ro'yxat (qulf bilan) list_articles() funksiyasi orqali ko'rsatiladi.
-- ----------------------------------------------------------------------------
drop policy if exists "articles_read_allowed" on public.articles;
create policy "articles_read_allowed" on public.articles
  for select using (
    (published or public.is_staff()) and public.can_access(is_premium)
  );

drop policy if exists "articles_staff_write" on public.articles;
create policy "articles_staff_write" on public.articles
  for all using (public.is_staff()) with check (public.is_staff());

drop policy if exists "article_questions_read_allowed" on public.article_questions;
create policy "article_questions_read_allowed" on public.article_questions
  for select using (
    exists (
      select 1 from public.articles a
      where a.id = article_questions.article_id
        and (a.published or public.is_staff())
        and public.can_access(a.is_premium)
    )
  );

drop policy if exists "article_questions_staff_write" on public.article_questions;
create policy "article_questions_staff_write" on public.article_questions
  for all using (public.is_staff()) with check (public.is_staff());

revoke select on public.article_questions from anon, authenticated;
grant select (id, article_id, kind, prompt, options, order_index)
  on public.article_questions to anon, authenticated;

-- ----------------------------------------------------------------------------
-- VOCABULARY
-- ----------------------------------------------------------------------------
drop policy if exists "vocab_packs_read_published" on public.vocab_packs;
create policy "vocab_packs_read_published" on public.vocab_packs
  for select using (published or public.is_staff());

drop policy if exists "vocab_packs_staff_write" on public.vocab_packs;
create policy "vocab_packs_staff_write" on public.vocab_packs
  for all using (public.is_staff()) with check (public.is_staff());

drop policy if exists "vocab_words_read_allowed" on public.vocab_words;
create policy "vocab_words_read_allowed" on public.vocab_words
  for select using (
    exists (
      select 1 from public.vocab_packs vp
      where vp.id = vocab_words.pack_id
        and (vp.published or public.is_staff())
        and public.can_access(vp.is_premium)
    )
  );

drop policy if exists "vocab_words_staff_write" on public.vocab_words;
create policy "vocab_words_staff_write" on public.vocab_words
  for all using (public.is_staff()) with check (public.is_staff());

-- O'yin halol bo'lishi uchun to'g'ri javob indeksi ham yashiriladi
revoke select on public.vocab_words from anon, authenticated;
grant select (id, pack_id, word, options, order_index)
  on public.vocab_words to anon, authenticated;

-- Natijalar: o'zining sessiyalarini ko'radi; yozish faqat RPC orqali
drop policy if exists "vocab_sessions_read_own" on public.vocab_sessions;
create policy "vocab_sessions_read_own" on public.vocab_sessions
  for select using (user_id = auth.uid() or public.is_staff());

-- ----------------------------------------------------------------------------
-- ATTEMPTS — urinishlar
-- ----------------------------------------------------------------------------
drop policy if exists "attempts_read_own_or_staff" on public.attempts;
create policy "attempts_read_own_or_staff" on public.attempts
  for select using (user_id = auth.uid() or public.is_staff());

drop policy if exists "attempts_insert_own" on public.attempts;
create policy "attempts_insert_own" on public.attempts
  for insert with check (user_id = auth.uid());

drop policy if exists "attempts_update_own_in_progress" on public.attempts;
create policy "attempts_update_own_in_progress" on public.attempts
  for update using (user_id = auth.uid() and status = 'in_progress')
  with check (user_id = auth.uid());

drop policy if exists "attempts_staff_update" on public.attempts;
create policy "attempts_staff_update" on public.attempts
  for update using (public.is_staff()) with check (public.is_staff());

drop policy if exists "attempts_delete_own" on public.attempts;
create policy "attempts_delete_own" on public.attempts
  for delete using (user_id = auth.uid() or public.is_staff());

-- Foydalanuvchi o'z bahosini qo'lda yozib qo'ymasligi uchun:
-- ball ustunlarini faqat server (score_attempt / admin) yozadi.
revoke update on public.attempts from authenticated;
grant update (answers, current_part_index) on public.attempts to authenticated;

-- ----------------------------------------------------------------------------
-- ARTICLE PROGRESS
-- ----------------------------------------------------------------------------
drop policy if exists "article_progress_own" on public.article_progress;
create policy "article_progress_own" on public.article_progress
  for all using (user_id = auth.uid() or public.is_staff())
  with check (user_id = auth.uid());

-- ----------------------------------------------------------------------------
-- COURSES
-- ----------------------------------------------------------------------------
drop policy if exists "courses_read_published" on public.courses;
create policy "courses_read_published" on public.courses
  for select using (published or public.is_staff());

drop policy if exists "courses_staff_write" on public.courses;
create policy "courses_staff_write" on public.courses
  for all using (public.is_staff()) with check (public.is_staff());

drop policy if exists "course_apps_insert_any" on public.course_applications;
create policy "course_apps_insert_any" on public.course_applications
  for insert with check (true);

drop policy if exists "course_apps_read" on public.course_applications;
create policy "course_apps_read" on public.course_applications
  for select using (user_id = auth.uid() or public.is_staff());

drop policy if exists "course_apps_staff_write" on public.course_applications;
create policy "course_apps_staff_write" on public.course_applications
  for update using (public.is_staff()) with check (public.is_staff());

-- ----------------------------------------------------------------------------
-- PREMIUM REQUESTS
-- ----------------------------------------------------------------------------
drop policy if exists "premium_requests_insert_own" on public.premium_requests;
create policy "premium_requests_insert_own" on public.premium_requests
  for insert with check (user_id = auth.uid());

drop policy if exists "premium_requests_read" on public.premium_requests;
create policy "premium_requests_read" on public.premium_requests
  for select using (user_id = auth.uid() or public.is_staff());

drop policy if exists "premium_requests_staff_update" on public.premium_requests;
create policy "premium_requests_staff_update" on public.premium_requests
  for update using (public.is_admin()) with check (public.is_admin());

-- ----------------------------------------------------------------------------
-- CONTACT
-- ----------------------------------------------------------------------------
drop policy if exists "contact_insert_any" on public.contact_messages;
create policy "contact_insert_any" on public.contact_messages
  for insert with check (true);

drop policy if exists "contact_staff_read" on public.contact_messages;
create policy "contact_staff_read" on public.contact_messages
  for select using (public.is_staff());

drop policy if exists "contact_staff_update" on public.contact_messages;
create policy "contact_staff_update" on public.contact_messages
  for update using (public.is_staff()) with check (public.is_staff());

-- ----------------------------------------------------------------------------
-- SITE SETTINGS
-- ----------------------------------------------------------------------------
drop policy if exists "settings_read_all" on public.site_settings;
create policy "settings_read_all" on public.site_settings
  for select using (true);

drop policy if exists "settings_admin_write" on public.site_settings;
create policy "settings_admin_write" on public.site_settings
  for all using (public.is_admin()) with check (public.is_admin());
