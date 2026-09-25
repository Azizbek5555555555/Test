-- ============================================================================
-- MULTILEVEL PLUS — 0005 XAVFSIZLIKNI KUCHAYTIRISH
--
-- 0001–0004 dan KEYIN ishga tushiriladi. Qayta ishga tushirsa ham xavfsiz.
--
-- Nimani tuzatadi (API orqali to'g'ridan-to'g'ri hujumlar sinab topilgan):
--   1. O'quvchi o'ziga soxta natija (masalan "C1") yozib qo'ya olardi
--   2. Premium'siz o'quvchi Premium test urinishini ocha olardi
--   3. Vocabulary: bitta javobni ko'p marta yuborib cheksiz ball olish mumkin edi
--   4. Premium so'rovni "approved" holatida yoki soxta muddat bilan yaratish
--      mumkin edi
--   5. Kurs arizasini boshqa foydalanuvchi nomidan yuborish mumkin edi
--   6. Test vaqti tugagandan keyin ham javob saqlash mumkin edi
--   7. Leaderboard kun/hafta chegarasi UTC bo'yicha edi (Toshkentda 05:00)
-- ============================================================================

-- ============================================================================
-- 1–2. ATTEMPTS — urinish yaratishni serverga bo'ysundirish
-- ============================================================================

-- Foydalanuvchi faqat "qaysi test" ekanini aytadi, qolganini server belgilaydi
revoke insert on public.attempts from anon, authenticated;
grant insert (user_id, test_set_id) on public.attempts to authenticated;

create or replace function public.prepare_attempt()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_set public.test_sets;
begin
  select * into v_set from public.test_sets where id = new.test_set_id;
  if v_set.id is null then
    raise exception 'Test topilmadi';
  end if;

  -- Bu qiymatlarni foydalanuvchi o'zgartira olmaydi
  new.status             := 'in_progress';
  new.mode               := case v_set.category
                              when 'exam_checking' then 'exam_checking'::attempt_mode
                              when 'full_mock'     then 'full_mock'::attempt_mode
                              else 'practice'::attempt_mode
                            end;
  new.started_at         := now();
  new.expires_at         := now() + make_interval(mins => coalesce(v_set.duration_minutes, 60) + 5);
  new.current_part_index := 0;
  new.answers            := '{}'::jsonb;
  new.section_scores     := '{}'::jsonb;
  new.section_breakdown  := '{}'::jsonb;
  new.teacher_feedback   := '{}'::jsonb;
  new.overall_score      := null;
  new.cefr_level         := null;
  new.needs_manual_check := false;
  new.graded_by          := null;
  new.graded_at          := null;
  new.submitted_at       := null;
  return new;
end;
$$;

drop trigger if exists attempts_prepare on public.attempts;
create trigger attempts_prepare
  before insert on public.attempts
  for each row execute function public.prepare_attempt();

-- Faqat ochiq (published) va ruxsat etilgan (bepul yoki Premium bo'lsa) testga
drop policy if exists "attempts_insert_own" on public.attempts;
create policy "attempts_insert_own" on public.attempts
  for insert with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.test_sets ts
      where ts.id = test_set_id
        and ts.published
        and public.can_access(ts.is_premium)
    )
  );

-- 6. Vaqt tugagach (5 daqiqa zaxira bilan) javoblarni o'zgartirib bo'lmaydi
drop policy if exists "attempts_update_own_in_progress" on public.attempts;
create policy "attempts_update_own_in_progress" on public.attempts
  for update using (
    user_id = auth.uid()
    and status = 'in_progress'
    and (expires_at is null or now() <= expires_at)
  )
  with check (user_id = auth.uid());

-- O'quvchi faqat tugallanmagan urinishini o'chira oladi (natijani emas)
drop policy if exists "attempts_delete_own" on public.attempts;
create policy "attempts_delete_own" on public.attempts
  for delete using (
    (user_id = auth.uid() and status = 'in_progress') or public.is_staff()
  );

-- ============================================================================
-- 3. VOCABULARY BATTLE — server bergan "raund" orqaligina ball olish
-- ============================================================================
create table if not exists public.vocab_rounds (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles (id) on delete cascade,
  pack_id      uuid not null references public.vocab_packs (id) on delete cascade,
  word_ids     uuid[] not null,
  started_at   timestamptz not null default now(),
  submitted_at timestamptz
);

create index if not exists vocab_rounds_user_idx
  on public.vocab_rounds (user_id, started_at desc);

-- Jadvalga to'g'ridan-to'g'ri kirish yo'q — faqat pastdagi funksiyalar orqali
alter table public.vocab_rounds enable row level security;
revoke all on public.vocab_rounds from anon, authenticated;

-- Eski (himoyasiz) funksiyalar o'chiriladi
drop function if exists public.submit_vocab_session(uuid, jsonb, integer);
drop function if exists public.get_vocab_round(uuid, int);

-- Raund boshlash: so'zlar tanlanadi va serverda eslab qolinadi
create or replace function public.start_vocab_round(
  p_pack_id uuid,
  p_limit   int default 20
)
returns jsonb
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_uid      uuid := auth.uid();
  v_pack     public.vocab_packs;
  v_recent   int;
  v_round_id uuid;
  v_ids      uuid[];
  v_words    jsonb;
begin
  if v_uid is null then
    raise exception 'Faqat ro''yxatdan o''tgan foydalanuvchilar o''ynay oladi';
  end if;

  select * into v_pack from public.vocab_packs where id = p_pack_id;
  if v_pack.id is null or not v_pack.published then
    raise exception 'To''plam topilmadi';
  end if;
  if v_pack.is_premium and not public.has_premium() and not public.is_staff() then
    raise exception 'Bu to''plam faqat Premium foydalanuvchilar uchun';
  end if;

  -- Soatiga 40 tadan ortiq raund boshlab bo'lmaydi (bot/skriptdan himoya)
  select count(*) into v_recent from public.vocab_rounds
  where user_id = v_uid and started_at > now() - interval '1 hour';
  if v_recent >= 40 then
    raise exception 'Juda ko''p o''yin. Birozdan keyin qayta urinib ko''ring.';
  end if;

  select array_agg(id) into v_ids from (
    select w.id from public.vocab_words w
    where w.pack_id = p_pack_id
    order by random()
    limit greatest(1, least(coalesce(p_limit, 20), 50))
  ) picked;

  if v_ids is null then
    raise exception 'Bu to''plamda hali so''zlar yo''q';
  end if;

  insert into public.vocab_rounds (user_id, pack_id, word_ids)
  values (v_uid, p_pack_id, v_ids)
  returning id into v_round_id;

  select jsonb_agg(jsonb_build_object('id', w.id, 'word', w.word, 'options', w.options)
                   order by array_position(v_ids, w.id))
  into v_words
  from public.vocab_words w
  where w.id = any (v_ids);

  return jsonb_build_object('round_id', v_round_id, 'words', v_words);
end;
$$;

-- Raundni yakunlash: ball SERVERDA hisoblanadi, har bir raund bir marta
create or replace function public.finish_vocab_round(
  p_round_id uuid,
  p_answers  jsonb
)
returns public.vocab_sessions
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_uid         uuid := auth.uid();
  v_round       public.vocab_rounds;
  v_seen        uuid[] := '{}';
  v_row         jsonb;
  v_word_id     uuid;
  v_choice      int;
  v_ms          int;
  v_correct_idx int;
  v_score       int := 0;
  v_correct     int := 0;
  v_answered    int := 0;
  v_total       int;
  v_elapsed_ms  bigint;
  v_session     public.vocab_sessions;
  c_time_limit  constant int := 15000;
  c_base        constant int := 300;
  c_max_bonus   constant int := 200;
begin
  if v_uid is null then
    raise exception 'Avval tizimga kiring';
  end if;

  -- Raundni qulflab olamiz — ikki marta yuborishning oldini olish uchun
  select * into v_round from public.vocab_rounds
  where id = p_round_id for update;

  if v_round.id is null or v_round.user_id <> v_uid then
    raise exception 'Raund topilmadi';
  end if;
  if v_round.submitted_at is not null then
    raise exception 'Bu raund natijasi allaqachon saqlangan';
  end if;
  if v_round.started_at < now() - interval '30 minutes' then
    raise exception 'Raund muddati tugagan. Yangi o''yin boshlang.';
  end if;

  v_total := coalesce(array_length(v_round.word_ids, 1), 0);
  v_elapsed_ms := (extract(epoch from (now() - v_round.started_at)) * 1000)::bigint;

  for v_row in select * from jsonb_array_elements(coalesce(p_answers, '[]'::jsonb))
  loop
    exit when v_answered >= v_total;

    begin
      v_word_id := (v_row ->> 'word_id')::uuid;
    exception when others then
      continue;
    end;

    -- Faqat shu raunddagi so'zlar va har biri FAQAT BIR MARTA hisoblanadi
    continue when not (v_word_id = any (v_round.word_ids));
    continue when v_word_id = any (v_seen);
    v_seen := v_seen || v_word_id;
    v_answered := v_answered + 1;

    v_choice := coalesce((v_row ->> 'choice')::int, -1);
    v_ms := least(c_time_limit, greatest(0, coalesce((v_row ->> 'ms')::int, c_time_limit)));

    select w.correct_index into v_correct_idx
    from public.vocab_words w where w.id = v_word_id;

    if v_correct_idx is not null and v_correct_idx = v_choice then
      v_correct := v_correct + 1;
      v_score := v_score + c_base
        + floor(c_max_bonus * (c_time_limit - v_ms)::numeric / c_time_limit)::int;
    end if;
  end loop;

  -- Inson har bir javobga kamida ~0.8 soniya sarflaydi (o'yinda 0.7 s pauza bor)
  if v_answered > 0 and v_elapsed_ms < v_answered * 800 then
    raise exception 'Natija qabul qilinmadi: javoblar juda tez yuborildi';
  end if;

  update public.vocab_rounds set submitted_at = now() where id = v_round.id;

  insert into public.vocab_sessions
    (user_id, pack_id, score, correct_count, total_count, duration_ms)
  values
    (v_uid, v_round.pack_id, v_score, v_correct, v_total, least(v_elapsed_ms, 2147483647)::int)
  returning * into v_session;

  update public.profiles set total_xp = total_xp + v_score where id = v_uid;

  return v_session;
end;
$$;

revoke execute on function public.start_vocab_round(uuid, int) from public, anon;
revoke execute on function public.finish_vocab_round(uuid, jsonb) from public, anon;
grant execute on function public.start_vocab_round(uuid, int) to authenticated;
grant execute on function public.finish_vocab_round(uuid, jsonb) to authenticated;

-- ============================================================================
-- 4. PREMIUM SO'ROVLARI — muddat va narx serverdagi tarifdan olinadi
-- ============================================================================
revoke insert on public.premium_requests from anon, authenticated;
grant insert (user_id, plan, note) on public.premium_requests to authenticated;

create or replace function public.prepare_premium_request()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_plans jsonb;
  v_plan  jsonb;
begin
  select value into v_plans from public.site_settings where key = 'premium_plans';
  if v_plans is null or jsonb_typeof(v_plans) <> 'array' then
    v_plans := '[{"id":"monthly","months":1,"amount":99000},
                 {"id":"quarterly","months":3,"amount":249000},
                 {"id":"yearly","months":12,"amount":790000}]'::jsonb;
  end if;

  select p into v_plan from jsonb_array_elements(v_plans) p
  where p ->> 'id' = new.plan limit 1;

  if v_plan is null then
    raise exception 'Noma''lum tarif';
  end if;

  new.months      := greatest(1, coalesce((v_plan ->> 'months')::int, 1));
  new.amount      := (v_plan ->> 'amount')::int;
  new.status      := 'pending';
  new.receipt_url := null;
  new.reviewed_by := null;
  new.reviewed_at := null;
  new.created_at  := now();
  return new;
end;
$$;

drop trigger if exists premium_requests_prepare on public.premium_requests;
create trigger premium_requests_prepare
  before insert on public.premium_requests
  for each row execute function public.prepare_premium_request();

-- ============================================================================
-- 5. KURS ARIZALARI VA XABARLAR — faqat kerakli ustunlar
-- ============================================================================
revoke insert on public.course_applications from anon, authenticated;
grant insert (course_id, user_id, full_name, phone, note)
  on public.course_applications to anon, authenticated;

drop policy if exists "course_apps_insert_any" on public.course_applications;
create policy "course_apps_insert_any" on public.course_applications
  for insert with check (
    (user_id is null or user_id = auth.uid())
    and exists (select 1 from public.courses c where c.id = course_id and c.published)
  );

revoke insert on public.contact_messages from anon, authenticated;
grant insert (name, email, phone, message) on public.contact_messages to anon, authenticated;

-- ============================================================================
-- 7. LEADERBOARD — kun/hafta/oy Toshkent vaqti bilan boshlanadi
-- ============================================================================
create or replace function public.period_start(p_period text)
returns timestamptz
language sql
stable
as $$
  select case lower(coalesce(p_period, 'weekly'))
    when 'daily'   then date_trunc('day',   now() at time zone 'Asia/Tashkent') at time zone 'Asia/Tashkent'
    when 'weekly'  then date_trunc('week',  now() at time zone 'Asia/Tashkent') at time zone 'Asia/Tashkent'
    when 'monthly' then date_trunc('month', now() at time zone 'Asia/Tashkent') at time zone 'Asia/Tashkent'
    else '-infinity'::timestamptz
  end;
$$;

create or replace function public.get_leaderboard(
  p_period text default 'weekly',
  p_limit  int  default 50
)
returns table (
  rank       bigint,
  user_id    uuid,
  full_name  text,
  avatar_url text,
  is_premium boolean,
  xp         bigint,
  games      bigint
)
language sql
stable
security definer
set search_path = public
as $$
  with agg as (
    select s.user_id, sum(s.score)::bigint as xp, count(*)::bigint as games
    from public.vocab_sessions s
    where s.created_at >= public.period_start(p_period)
    group by s.user_id
  )
  select
    rank() over (order by a.xp desc, a.games asc) as rank,
    a.user_id,
    coalesce(p.full_name, 'Foydalanuvchi') as full_name,
    p.avatar_url,
    coalesce(p.is_premium and (p.premium_until is null or p.premium_until > now()), false),
    a.xp,
    a.games
  from agg a
  join public.profiles p on p.id = a.user_id
  order by a.xp desc, a.games asc
  limit greatest(1, least(coalesce(p_limit, 50), 200));
$$;

create or replace function public.get_my_rank(p_period text default 'weekly')
returns table (rank bigint, xp bigint, games bigint)
language sql
stable
security definer
set search_path = public
as $$
  with agg as (
    select s.user_id, sum(s.score)::bigint as xp, count(*)::bigint as games
    from public.vocab_sessions s
    where s.created_at >= public.period_start(p_period)
    group by s.user_id
  ),
  ranked as (
    select rank() over (order by a.xp desc, a.games asc) as rank, a.*
    from agg a
  )
  select r.rank, r.xp, r.games from ranked r where r.user_id = auth.uid();
$$;

grant execute on function public.period_start(text) to anon, authenticated;
grant execute on function public.get_leaderboard(text, int) to anon, authenticated;
grant execute on function public.get_my_rank(text) to authenticated;
