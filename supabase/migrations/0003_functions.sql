-- ============================================================================
-- MULTILEVEL PLUS — 0003 SERVER FUNKSIYALARI
--
-- Bu yerda baholash (scoring) mantiqi joylashgan. Barchasi SERVERDA ishlaydi,
-- shuning uchun foydalanuvchi javoblarni oldindan bila olmaydi va ballni
-- o'zgartira olmaydi.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Matnni solishtirish uchun normalizatsiya: "  The   Cat " → "the cat"
-- ----------------------------------------------------------------------------
create or replace function public.norm_text(t text)
returns text
language sql
immutable
as $$
  select lower(regexp_replace(btrim(coalesce(t, '')), '\s+', ' ', 'g'));
$$;

-- ----------------------------------------------------------------------------
-- CEFR darajasi — hujjatdagi 12-bo'limga mos
--   Misol: L 62 · R 68 · W 58 · S 61 → o'rtacha 62.25 → B2
-- Chegaralarni site_settings.cefr_bands orqali o'zgartirish mumkin.
-- ----------------------------------------------------------------------------
create or replace function public.cefr_from_score(p numeric)
returns text
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  bands jsonb;
begin
  if p is null then
    return null;
  end if;

  select value into bands from public.site_settings where key = 'cefr_bands';

  if bands is null then
    bands := '{"C1": 75, "B2": 60, "B1": 45, "A2": 30}'::jsonb;
  end if;

  if p >= (bands ->> 'C1')::numeric then return 'C1';
  elsif p >= (bands ->> 'B2')::numeric then return 'B2';
  elsif p >= (bands ->> 'B1')::numeric then return 'B1';
  elsif p >= (bands ->> 'A2')::numeric then return 'A2';
  else return 'A1';
  end if;
end;
$$;

-- ----------------------------------------------------------------------------
-- Bitta javobni tekshirish.
-- Qaytaradi: 0..1 oralig'idagi ulush, yoki NULL (qo'lda tekshiriladigan savol)
-- ----------------------------------------------------------------------------
create or replace function public.answer_ratio(
  p_kind    question_kind,
  p_correct jsonb,
  p_given   jsonb
)
returns numeric
language plpgsql
immutable
as $$
declare
  accepted   text[];
  given_txt  text;
  given_arr  text[];
  correct_arr text[];
  hit        int := 0;
  miss       int := 0;
  total_keys int := 0;
  k          text;
begin
  -- Qo'lda tekshiriladigan savollar
  if p_kind in ('essay', 'speaking_prompt') then
    return null;
  end if;

  if p_given is null or p_correct is null or p_given = 'null'::jsonb then
    return 0;
  end if;

  case p_kind
    -- ---------------------------------------------------------------- MCQ / TFNG / GAP / SHORT
    when 'mcq', 'true_false_ng', 'gap_fill', 'short_answer' then
      -- p_correct: "B"  yoki  ["B"]  yoki  ["colour","color"] (bir necha variant)
      if jsonb_typeof(p_correct) = 'array' then
        select array_agg(public.norm_text(x)) into accepted
        from jsonb_array_elements_text(p_correct) as x;
      else
        accepted := array[public.norm_text(p_correct #>> '{}')];
      end if;

      given_txt := public.norm_text(p_given #>> '{}');

      if given_txt = '' then
        return 0;
      end if;

      return case when given_txt = any (accepted) then 1 else 0 end;

    -- ---------------------------------------------------------------- MULTI SELECT
    when 'multi_select' then
      if jsonb_typeof(p_correct) <> 'array' or jsonb_typeof(p_given) <> 'array' then
        return 0;
      end if;

      select array_agg(public.norm_text(x)) into correct_arr
      from jsonb_array_elements_text(p_correct) as x;

      select array_agg(public.norm_text(x)) into given_arr
      from jsonb_array_elements_text(p_given) as x;

      if correct_arr is null or array_length(correct_arr, 1) is null then
        return 0;
      end if;

      if given_arr is null then
        return 0;
      end if;

      foreach k in array given_arr loop
        if k = any (correct_arr) then
          hit := hit + 1;
        else
          miss := miss + 1;
        end if;
      end loop;

      return greatest(
        0,
        (hit - miss)::numeric / array_length(correct_arr, 1)::numeric
      );

    -- ---------------------------------------------------------------- MATCHING
    when 'matching' then
      -- p_correct: {"1": "A", "2": "C"} ; p_given: {"1": "A", "2": "B"}
      if jsonb_typeof(p_correct) <> 'object' then
        return 0;
      end if;

      for k in select jsonb_object_keys(p_correct) loop
        total_keys := total_keys + 1;
        if public.norm_text(p_given ->> k) <> ''
           and public.norm_text(p_given ->> k) = public.norm_text(p_correct ->> k) then
          hit := hit + 1;
        end if;
      end loop;

      if total_keys = 0 then
        return 0;
      end if;

      return hit::numeric / total_keys::numeric;

    else
      return 0;
  end case;
end;
$$;

-- ----------------------------------------------------------------------------
-- URINISHNI BAHOLASH — testni yakunlaganda chaqiriladi
-- Har bir bo'lim uchun 0–100 ball beradi, Writing/Speaking ni o'qituvchiga
-- tekshirish uchun belgilaydi.
-- ----------------------------------------------------------------------------
create or replace function public.score_attempt(p_attempt_id uuid)
returns public.attempts
language plpgsql
security definer
set search_path = public
as $$
declare
  v_attempt       public.attempts;
  v_answers       jsonb;
  v_section       skill_section;
  v_earned        numeric;
  v_max           numeric;
  v_correct_cnt   int;
  v_total_cnt     int;
  v_scores        jsonb := '{}'::jsonb;
  v_breakdown     jsonb := '{}'::jsonb;
  v_manual        boolean := false;
  v_overall       numeric;
  v_sum           numeric := 0;
  v_count         int := 0;
  v_val           numeric;
begin
  select * into v_attempt from public.attempts where id = p_attempt_id;

  if v_attempt.id is null then
    raise exception 'Urinish topilmadi';
  end if;

  if v_attempt.user_id <> auth.uid() and not public.is_staff() then
    raise exception 'Ruxsat yo''q';
  end if;

  if v_attempt.status <> 'in_progress' then
    return v_attempt;  -- allaqachon yakunlangan
  end if;

  v_answers := coalesce(v_attempt.answers, '{}'::jsonb);

  -- Har bir bo'lim (reading / listening / writing / speaking) bo'yicha
  for v_section in
    select distinct tp.section
    from public.test_parts tp
    where tp.test_set_id = v_attempt.test_set_id
  loop
    v_earned := 0;
    v_max := 0;
    v_correct_cnt := 0;
    v_total_cnt := 0;

    declare
      q record;
      r numeric;
    begin
      for q in
        select qq.id, qq.kind, qq.correct_answer, qq.points
        from public.questions qq
        join public.test_parts tp on tp.id = qq.part_id
        where tp.test_set_id = v_attempt.test_set_id
          and tp.section = v_section
      loop
        v_total_cnt := v_total_cnt + 1;
        r := public.answer_ratio(q.kind, q.correct_answer, v_answers -> (q.id::text));

        if r is null then
          -- Writing / Speaking → o'qituvchi tekshiradi
          v_manual := true;
        else
          v_max := v_max + q.points;
          v_earned := v_earned + (q.points * r);
          if r >= 0.999 then
            v_correct_cnt := v_correct_cnt + 1;
          end if;
        end if;
      end loop;
    end;

    if v_max > 0 then
      v_val := round((v_earned / v_max) * 100, 0);
      v_scores := v_scores || jsonb_build_object(v_section::text, v_val);
      v_sum := v_sum + v_val;
      v_count := v_count + 1;
    end if;

    v_breakdown := v_breakdown || jsonb_build_object(
      v_section::text,
      jsonb_build_object(
        'correct', v_correct_cnt,
        'total', v_total_cnt,
        'earned', round(v_earned, 2),
        'max', round(v_max, 2),
        'manual', (v_max = 0 and v_total_cnt > 0)
      )
    );
  end loop;

  if v_count > 0 then
    v_overall := round(v_sum / v_count, 2);
  end if;

  update public.attempts
  set status             = (case when v_manual then 'submitted' else 'graded' end)::attempt_status,
      section_scores     = v_scores,
      section_breakdown  = v_breakdown,
      overall_score      = v_overall,
      cefr_level         = public.cefr_from_score(v_overall),
      needs_manual_check = v_manual,
      submitted_at       = now(),
      graded_at          = case when v_manual then null else now() end
  where id = p_attempt_id
  returning * into v_attempt;

  return v_attempt;
end;
$$;

-- ----------------------------------------------------------------------------
-- O'QITUVCHI BAHOSI — Writing / Speaking uchun
-- ----------------------------------------------------------------------------
create or replace function public.grade_attempt_manual(
  p_attempt_id uuid,
  p_writing    numeric,
  p_speaking   numeric,
  p_feedback   jsonb
)
returns public.attempts
language plpgsql
security definer
set search_path = public
as $$
declare
  v_attempt public.attempts;
  v_scores  jsonb;
  v_sum     numeric := 0;
  v_count   int := 0;
  v_key     text;
  v_overall numeric;
begin
  if not public.is_staff() then
    raise exception 'Faqat o''qituvchi yoki admin baholay oladi';
  end if;

  select * into v_attempt from public.attempts where id = p_attempt_id;
  if v_attempt.id is null then
    raise exception 'Urinish topilmadi';
  end if;

  v_scores := coalesce(v_attempt.section_scores, '{}'::jsonb);

  if p_writing is not null then
    v_scores := v_scores || jsonb_build_object('writing', round(p_writing, 0));
  end if;

  if p_speaking is not null then
    v_scores := v_scores || jsonb_build_object('speaking', round(p_speaking, 0));
  end if;

  for v_key in select jsonb_object_keys(v_scores) loop
    v_sum := v_sum + (v_scores ->> v_key)::numeric;
    v_count := v_count + 1;
  end loop;

  if v_count > 0 then
    v_overall := round(v_sum / v_count, 2);
  end if;

  update public.attempts
  set section_scores     = v_scores,
      teacher_feedback   = coalesce(p_feedback, '{}'::jsonb),
      overall_score      = v_overall,
      cefr_level         = public.cefr_from_score(v_overall),
      status             = 'graded',
      needs_manual_check = false,
      graded_by          = auth.uid(),
      graded_at          = now()
  where id = p_attempt_id
  returning * into v_attempt;

  return v_attempt;
end;
$$;

-- ----------------------------------------------------------------------------
-- VOCABULARY BATTLE — natijani serverda hisoblash (hujjat: 6-bo'lim)
-- p_answers: [{"word_id": "...", "choice": 2, "ms": 3400}, ...]
-- Ball: to'g'ri javob 300 + tezlik bonusi 200 gacha (jami 500 gacha)
-- ----------------------------------------------------------------------------
create or replace function public.submit_vocab_session(
  p_pack_id     uuid,
  p_answers     jsonb,
  p_duration_ms integer
)
returns public.vocab_sessions
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid         uuid := auth.uid();
  v_is_premium  boolean;
  v_published   boolean;
  v_score       int := 0;
  v_correct     int := 0;
  v_total       int := 0;
  v_row         jsonb;
  v_word_id     uuid;
  v_choice      int;
  v_ms          int;
  v_correct_idx int;
  v_bonus       int;
  v_session     public.vocab_sessions;
  c_time_limit  constant int := 15000;   -- 15 soniya
  c_base        constant int := 300;
  c_max_bonus   constant int := 200;
begin
  if v_uid is null then
    raise exception 'Faqat ro''yxatdan o''tgan foydalanuvchilar o''ynay oladi';
  end if;

  select vp.is_premium, vp.published into v_is_premium, v_published
  from public.vocab_packs vp where vp.id = p_pack_id;

  if v_published is null then
    raise exception 'To''plam topilmadi';
  end if;

  if not v_published then
    raise exception 'To''plam mavjud emas';
  end if;

  if v_is_premium and not public.has_premium() and not public.is_staff() then
    raise exception 'Bu to''plam faqat Premium foydalanuvchilar uchun';
  end if;

  for v_row in select * from jsonb_array_elements(coalesce(p_answers, '[]'::jsonb))
  loop
    v_total := v_total + 1;

    begin
      v_word_id := (v_row ->> 'word_id')::uuid;
    exception when others then
      continue;
    end;

    v_choice := coalesce((v_row ->> 'choice')::int, -1);
    v_ms := greatest(0, coalesce((v_row ->> 'ms')::int, c_time_limit));

    select w.correct_index into v_correct_idx
    from public.vocab_words w
    where w.id = v_word_id and w.pack_id = p_pack_id;

    if v_correct_idx is not null and v_correct_idx = v_choice then
      v_correct := v_correct + 1;
      v_bonus := floor(
        c_max_bonus * greatest(0, (c_time_limit - least(v_ms, c_time_limit))::numeric / c_time_limit)
      );
      v_score := v_score + c_base + v_bonus;
    end if;
  end loop;

  insert into public.vocab_sessions
    (user_id, pack_id, score, correct_count, total_count, duration_ms)
  values
    (v_uid, p_pack_id, v_score, v_correct, v_total, greatest(0, coalesce(p_duration_ms, 0)))
  returning * into v_session;

  update public.profiles
  set total_xp = total_xp + v_score
  where id = v_uid;

  return v_session;
end;
$$;

-- ----------------------------------------------------------------------------
-- O'yin savollarini to'g'ri javobsiz olish (tartib aralashtirilgan)
-- ----------------------------------------------------------------------------
create or replace function public.get_vocab_round(
  p_pack_id uuid,
  p_limit   int default 20
)
returns table (
  id      uuid,
  word    text,
  options jsonb
)
language sql
stable
security definer
set search_path = public
as $$
  select w.id, w.word, w.options
  from public.vocab_words w
  join public.vocab_packs vp on vp.id = w.pack_id
  where w.pack_id = p_pack_id
    and vp.published
    and ((not vp.is_premium) or public.has_premium() or public.is_staff())
  order by random()
  limit greatest(1, least(coalesce(p_limit, 20), 50));
$$;

-- ----------------------------------------------------------------------------
-- LEADERBOARD (hujjat: 7-bo'lim) — Daily / Weekly / Monthly / All Time
-- ----------------------------------------------------------------------------
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
  with bounded as (
    select s.user_id, s.score
    from public.vocab_sessions s
    where case lower(coalesce(p_period, 'weekly'))
            when 'daily'   then s.created_at >= date_trunc('day', now())
            when 'weekly'  then s.created_at >= date_trunc('week', now())
            when 'monthly' then s.created_at >= date_trunc('month', now())
            else true
          end
  ),
  agg as (
    select b.user_id, sum(b.score)::bigint as xp, count(*)::bigint as games
    from bounded b
    group by b.user_id
  )
  select
    rank() over (order by a.xp desc, a.games asc) as rank,
    a.user_id,
    coalesce(p.full_name, 'Foydalanuvchi') as full_name,
    p.avatar_url,
    coalesce(p.is_premium and (p.premium_until is null or p.premium_until > now()), false)
      as is_premium,
    a.xp,
    a.games
  from agg a
  join public.profiles p on p.id = a.user_id
  order by a.xp desc, a.games asc
  limit greatest(1, least(coalesce(p_limit, 50), 200));
$$;

-- Joriy foydalanuvchining o'rni (ro'yxatning 50 taligiga kirmasa ham)
create or replace function public.get_my_rank(p_period text default 'weekly')
returns table (
  rank  bigint,
  xp    bigint,
  games bigint
)
language sql
stable
security definer
set search_path = public
as $$
  with bounded as (
    select s.user_id, s.score
    from public.vocab_sessions s
    where case lower(coalesce(p_period, 'weekly'))
            when 'daily'   then s.created_at >= date_trunc('day', now())
            when 'weekly'  then s.created_at >= date_trunc('week', now())
            when 'monthly' then s.created_at >= date_trunc('month', now())
            else true
          end
  ),
  agg as (
    select b.user_id, sum(b.score)::bigint as xp, count(*)::bigint as games
    from bounded b
    group by b.user_id
  ),
  ranked as (
    select rank() over (order by a.xp desc, a.games asc) as rank, a.*
    from agg a
  )
  select r.rank, r.xp, r.games
  from ranked r
  where r.user_id = auth.uid();
$$;

-- ----------------------------------------------------------------------------
-- MAQOLALAR RO'YXATI — matnsiz (qulflangan maqolalar ham ko'rinadi)
-- ----------------------------------------------------------------------------
create or replace function public.list_articles(
  p_topic text default null,
  p_limit int default 60
)
returns table (
  id           uuid,
  slug         text,
  title        text,
  topic        text,
  excerpt      text,
  cover_url    text,
  level        text,
  read_minutes integer,
  is_premium   boolean,
  word_count   integer,
  question_count bigint,
  created_at   timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    a.id, a.slug, a.title, a.topic, a.excerpt, a.cover_url, a.level,
    a.read_minutes, a.is_premium,
    jsonb_array_length(a.vocabulary) as word_count,
    (select count(*) from public.article_questions q where q.article_id = a.id) as question_count,
    a.created_at
  from public.articles a
  where a.published
    and (p_topic is null or p_topic = '' or a.topic = p_topic)
  order by a.order_index, a.created_at desc
  limit greatest(1, least(coalesce(p_limit, 60), 200));
$$;

-- ----------------------------------------------------------------------------
-- MAQOLA SAVOLLARINI TEKSHIRISH
-- ----------------------------------------------------------------------------
create or replace function public.submit_article_answers(
  p_article_id uuid,
  p_answers    jsonb
)
returns table (
  correct_count int,
  total_count   int,
  results       jsonb
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid     uuid := auth.uid();
  q         record;
  r         numeric;
  v_correct int := 0;
  v_total   int := 0;
  v_results jsonb := '{}'::jsonb;
begin
  if v_uid is null then
    raise exception 'Avval tizimga kiring';
  end if;

  for q in
    select aq.id, aq.kind, aq.correct_answer, aq.explanation
    from public.article_questions aq
    where aq.article_id = p_article_id
    order by aq.order_index
  loop
    v_total := v_total + 1;
    r := coalesce(public.answer_ratio(q.kind, q.correct_answer, p_answers -> (q.id::text)), 0);
    if r >= 0.999 then
      v_correct := v_correct + 1;
    end if;
    v_results := v_results || jsonb_build_object(
      q.id::text,
      jsonb_build_object(
        'correct', r >= 0.999,
        'answer', q.correct_answer,
        'explanation', q.explanation
      )
    );
  end loop;

  insert into public.article_progress
    (user_id, article_id, correct_count, total_count, answers, completed_at)
  values
    (v_uid, p_article_id, v_correct, v_total, coalesce(p_answers, '{}'::jsonb), now())
  on conflict (user_id, article_id) do update
    set correct_count = excluded.correct_count,
        total_count   = excluded.total_count,
        answers       = excluded.answers,
        completed_at  = now();

  return query select v_correct, v_total, v_results;
end;
$$;

-- ----------------------------------------------------------------------------
-- PROFIL STATISTIKASI (hujjat: 1-bo'lim — umumiy progress)
-- ----------------------------------------------------------------------------
create or replace function public.get_my_stats()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'tests_taken', (
      select count(*) from public.attempts
      where user_id = auth.uid() and status in ('submitted', 'graded')
    ),
    'exams_taken', (
      select count(*) from public.attempts
      where user_id = auth.uid() and mode = 'exam_checking' and status in ('submitted','graded')
    ),
    'best_overall', (
      select max(overall_score) from public.attempts
      where user_id = auth.uid() and status = 'graded'
    ),
    'last_level', (
      select cefr_level from public.attempts
      where user_id = auth.uid() and cefr_level is not null
      order by coalesce(graded_at, submitted_at, started_at) desc limit 1
    ),
    'articles_done', (
      select count(*) from public.article_progress where user_id = auth.uid()
    ),
    'games_played', (
      select count(*) from public.vocab_sessions where user_id = auth.uid()
    ),
    'total_xp', (
      select total_xp from public.profiles where id = auth.uid()
    ),
    'best_game', (
      select max(score) from public.vocab_sessions where user_id = auth.uid()
    )
  );
$$;

-- ----------------------------------------------------------------------------
-- FUNKSIYALARGA RUXSAT
-- ----------------------------------------------------------------------------
grant execute on function public.get_leaderboard(text, int) to anon, authenticated;
grant execute on function public.get_my_rank(text) to authenticated;
grant execute on function public.list_articles(text, int) to anon, authenticated;
grant execute on function public.get_vocab_round(uuid, int) to authenticated;
grant execute on function public.submit_vocab_session(uuid, jsonb, integer) to authenticated;
grant execute on function public.submit_article_answers(uuid, jsonb) to authenticated;
grant execute on function public.score_attempt(uuid) to authenticated;
grant execute on function public.grade_attempt_manual(uuid, numeric, numeric, jsonb) to authenticated;
grant execute on function public.get_my_stats() to authenticated;
grant execute on function public.cefr_from_score(numeric) to anon, authenticated;

-- Foydalanuvchi to'g'ridan-to'g'ri baholash funksiyalarini "aldab" bo'lmasligi uchun
revoke execute on function public.answer_ratio(question_kind, jsonb, jsonb) from anon, authenticated;

-- ----------------------------------------------------------------------------
-- NATIJANI KO'RIB CHIQISH
-- To'g'ri javoblar FAQAT test yakunlangandan keyin va faqat test egasiga
-- (yoki o'qituvchiga) ochiladi.
-- ----------------------------------------------------------------------------
create or replace function public.get_attempt_review(p_attempt_id uuid)
returns table (
  question_id    uuid,
  part_id        uuid,
  section        skill_section,
  part_title     text,
  kind           question_kind,
  prompt         text,
  options        jsonb,
  points         numeric,
  correct_answer jsonb,
  explanation    text,
  given_answer   jsonb,
  ratio          numeric,
  order_index    integer
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_attempt public.attempts;
begin
  select * into v_attempt from public.attempts where id = p_attempt_id;

  if v_attempt.id is null then
    raise exception 'Urinish topilmadi';
  end if;

  if v_attempt.user_id <> auth.uid() and not public.is_staff() then
    raise exception 'Ruxsat yo''q';
  end if;

  if v_attempt.status = 'in_progress' then
    raise exception 'Test hali yakunlanmagan';
  end if;

  return query
  select
    q.id,
    tp.id,
    tp.section,
    tp.title,
    q.kind,
    q.prompt,
    q.options,
    q.points,
    q.correct_answer,
    q.explanation,
    v_attempt.answers -> (q.id::text),
    public.answer_ratio(q.kind, q.correct_answer, v_attempt.answers -> (q.id::text)),
    q.order_index
  from public.questions q
  join public.test_parts tp on tp.id = q.part_id
  where tp.test_set_id = v_attempt.test_set_id
  order by tp.order_index, q.order_index;
end;
$$;

grant execute on function public.get_attempt_review(uuid) to authenticated;

-- ----------------------------------------------------------------------------
-- O'QITUVCHI UCHUN: tekshirish kutayotgan ishlar ro'yxati
-- ----------------------------------------------------------------------------
create or replace function public.list_pending_checks(p_limit int default 100)
returns table (
  attempt_id   uuid,
  user_id      uuid,
  full_name    text,
  email        text,
  test_title   text,
  mode         attempt_mode,
  submitted_at timestamptz,
  section_scores jsonb
)
language sql
stable
security definer
set search_path = public
as $$
  select
    a.id, a.user_id, p.full_name, p.email, ts.title, a.mode,
    a.submitted_at, a.section_scores
  from public.attempts a
  join public.profiles p on p.id = a.user_id
  join public.test_sets ts on ts.id = a.test_set_id
  where public.is_staff()
    and a.status = 'submitted'
    and a.needs_manual_check
  order by a.submitted_at asc nulls last
  limit greatest(1, least(coalesce(p_limit, 100), 500));
$$;

grant execute on function public.list_pending_checks(int) to authenticated;
