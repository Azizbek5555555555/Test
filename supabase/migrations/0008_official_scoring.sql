-- ============================================================================
-- 0008 — Rasmiy Multilevel baholash shkalasi (Bilimni baholash agentligi)
--
--  • Listening va Reading: to'g'ri javoblar soni (35 tadan) → standart ball (0–75)
--    rasmiy jadval bo'yicha. Savollar soni 35 dan farq qilsa, natija avval
--    35 savollik ekvivalentga keltiriladi (masalan 6 tadan 3 → 35 tadan 18).
--  • Writing va Speaking: o'qituvchi 0–75 shkalada baho qo'yadi (admin panelda
--    rasmiy mezonlar bo'yicha hisoblagich bor).
--  • Umumiy ball — 4 bo'lim o'rtachasi (0–75).
--  • Daraja: C1 65–75, B2 51–64, B1 38–50, 38 dan past — "B1 dan quyi" (A2).
--  • Avvalgi 0–100 shkaladagi natijalar yangi shkalaga o'tkaziladi.
-- ============================================================================

-- ---------------------------------------------------------------- jadval
create or replace function public.mlv_standard_score(p_section text, p_correct numeric)
returns integer
language plpgsql
immutable
set search_path = public
as $$
declare
  -- indeks = to'g'ri javoblar soni (1..35)
  listening int[] := array[23,26,28,30,33,34,36,38,39,41,42,44,45,47,48,50,51,53,
                           54,55,57,58,60,61,63,65,66,68,70,72,73,74,75,75,75];
  reading   int[] := array[20,24,27,29,32,34,36,38,39,41,42,44,45,46,48,49,51,52,
                           54,55,57,58,60,61,63,65,66,68,70,71,73,74,75,75,75];
  n int;
begin
  if p_correct is null then
    return null;
  end if;
  n := round(p_correct)::int;
  if n <= 0 then
    return 0;
  end if;
  if n > 35 then
    n := 35;
  end if;
  if p_section = 'listening' then
    return listening[n];
  end if;
  return reading[n];
end;
$$;

grant execute on function public.mlv_standard_score(text, numeric) to anon, authenticated;

-- ---------------------------------------------------------------- CEFR chegaralari
insert into public.site_settings (key, value)
values ('cefr_bands', '{"C1": 65, "B2": 51, "B1": 38, "A2": 0}'::jsonb)
on conflict (key) do update set value = excluded.value;

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
    bands := '{"C1": 65, "B2": 51, "B1": 38, "A2": 0}'::jsonb;
  end if;

  if p >= (bands ->> 'C1')::numeric then return 'C1';
  elsif p >= (bands ->> 'B2')::numeric then return 'B2';
  elsif p >= (bands ->> 'B1')::numeric then return 'B1';
  elsif p >= coalesce((bands ->> 'A2')::numeric, 0) then return 'A2';
  else return 'A1';
  end if;
end;
$$;

-- ---------------------------------------------------------------- avtomatik baholash
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
      -- 35 savollik ekvivalent → rasmiy standart ball (0–75)
      v_val := public.mlv_standard_score(v_section::text, (v_earned / v_max) * 35);
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

-- ---------------------------------------------------------------- o'qituvchi bahosi (0–75)
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

  if (p_writing is not null and (p_writing < 0 or p_writing > 75))
     or (p_speaking is not null and (p_speaking < 0 or p_speaking > 75)) then
    raise exception 'Ball 0–75 oralig''ida bo''lishi kerak';
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

-- ---------------------------------------------------------------- eski natijalarni ko'chirish
-- Bir martalik: "scale" belgisi qo'yilmagan urinishlar yangi shkalaga o'tkaziladi.
do $$
declare
  a record;
  v_scores jsonb;
  v_key text;
  v_val numeric;
  v_entry jsonb;
  v_sum numeric;
  v_count int;
begin
  for a in
    select id, section_scores, section_breakdown
    from public.attempts
    where section_scores is not null
      and section_scores <> '{}'::jsonb
      and coalesce(section_breakdown ->> '_scale', '') <> 'mlv75'
  loop
    v_scores := '{}'::jsonb;
    v_sum := 0;
    v_count := 0;
    for v_key in select jsonb_object_keys(a.section_scores) loop
      v_entry := a.section_breakdown -> v_key;
      if v_key in ('listening', 'reading')
         and v_entry is not null
         and coalesce((v_entry ->> 'max')::numeric, 0) > 0 then
        v_val := public.mlv_standard_score(
          v_key, ((v_entry ->> 'earned')::numeric / (v_entry ->> 'max')::numeric) * 35);
      else
        v_val := round((a.section_scores ->> v_key)::numeric * 0.75, 0);
      end if;
      v_scores := v_scores || jsonb_build_object(v_key, v_val);
      v_sum := v_sum + v_val;
      v_count := v_count + 1;
    end loop;

    update public.attempts
    set section_scores    = v_scores,
        section_breakdown = coalesce(section_breakdown, '{}'::jsonb) || '{"_scale": "mlv75"}'::jsonb,
        overall_score     = case when v_count > 0 then round(v_sum / v_count, 2) else null end,
        cefr_level        = case when v_count > 0 then public.cefr_from_score(round(v_sum / v_count, 2)) else null end
    where id = a.id;
  end loop;
end;
$$;
