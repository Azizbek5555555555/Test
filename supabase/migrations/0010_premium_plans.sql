-- ============================================================================
-- 0010 · Premium tariflari va o'qituvchi tekshiruvi limiti
--
-- Yangi tariflar (mijoz talabi):
--   1 oylik  —  39 000 so'm — o'qituvchi tekshiruvisiz
--   3 oylik  — 109 000 so'm — 1 ta Full Mock o'qituvchi tekshiruvi va izohi bilan
--   6 oylik  — 219 000 so'm — 3 ta Full Mock o'qituvchi tekshiruvi bilan
--   12 oylik — 429 000 so'm — 6 ta Full Mock o'qituvchi tekshiruvi bilan
--
-- profiles.review_credits — o'quvchida qolgan "o'qituvchi tekshiruvi" soni.
--   * Payme/Click to'lovi yoki admin tasdiqlagan karta to'lovida tarifdagi son qo'shiladi.
--   * Writing/Speaking bo'lgan test topshirilganda bittasi sarflanadi.
--   * Qolmagan bo'lsa — Reading/Listening natijasi darhol chiqadi, Writing/Speaking tekshirilmaydi.
--   * Admin uni Foydalanuvchilar sahifasida qo'lda o'zgartira oladi.
--
-- Supabase → SQL Editor → shu faylni to'liq joylab RUN bosing (bir marta).
-- ============================================================================

-- ---------------------------------------------------------------- 1. ustunlar
alter table public.profiles
  add column if not exists review_credits integer not null default 0;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'profiles_review_credits_nonneg') then
    alter table public.profiles
      add constraint profiles_review_credits_nonneg check (review_credits >= 0);
  end if;
end $$;

-- foydalanuvchi o'zi o'zgartira olmaydi: profiles'da faqat ruxsat berilgan ustunlar yangilanadi (0002)

alter table public.payment_orders
  add column if not exists reviews integer not null default 0;

-- ---------------------------------------------------------------- 2. yangi tariflar
insert into public.site_settings (key, value)
values ('premium_plans', '[
  {"id": "monthly",   "title": "1 oylik",  "months": 1,  "amount": 39000,  "reviews": 0},
  {"id": "quarterly", "title": "3 oylik",  "months": 3,  "amount": 109000, "reviews": 1, "popular": true},
  {"id": "halfyear",  "title": "6 oylik",  "months": 6,  "amount": 219000, "reviews": 3},
  {"id": "yearly",    "title": "12 oylik", "months": 12, "amount": 429000, "reviews": 6}
]'::jsonb)
on conflict (key) do update set value = excluded.value, updated_at = now();

create or replace function public.resolve_premium_plan(p_plan text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_plans jsonb;
  v_plan  jsonb;
begin
  select value into v_plans from public.site_settings where key = 'premium_plans';
  if v_plans is null or jsonb_typeof(v_plans) <> 'array' then
    v_plans := '[{"id":"monthly","title":"1 oylik","months":1,"amount":39000,"reviews":0},
                 {"id":"quarterly","title":"3 oylik","months":3,"amount":109000,"reviews":1},
                 {"id":"halfyear","title":"6 oylik","months":6,"amount":219000,"reviews":3},
                 {"id":"yearly","title":"12 oylik","months":12,"amount":429000,"reviews":6}]'::jsonb;
  end if;

  select p into v_plan from jsonb_array_elements(v_plans) p
  where p ->> 'id' = p_plan limit 1;

  return v_plan;
end;
$$;

-- ---------------------------------------------------------------- 3. buyurtma: tekshiruvlar soni ham yoziladi
create or replace function public.create_payment_order(p_plan text, p_provider text)
returns public.payment_orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid     uuid := auth.uid();
  v_plan    jsonb;
  v_amount  integer;
  v_months  integer;
  v_reviews integer;
  v_order   public.payment_orders;
begin
  if v_uid is null then
    raise exception 'Avval tizimga kiring';
  end if;

  if p_provider not in ('payme', 'click') then
    raise exception 'Noma''lum to''lov tizimi';
  end if;

  v_plan := public.resolve_premium_plan(p_plan);
  if v_plan is null then
    raise exception 'Noma''lum tarif';
  end if;

  v_amount := (v_plan ->> 'amount')::integer;
  v_months := greatest(1, least(60, coalesce((v_plan ->> 'months')::integer, 1)));
  v_reviews := greatest(0, least(100, coalesce((v_plan ->> 'reviews')::integer, 0)));
  if v_amount is null or v_amount < 1000 then
    raise exception 'Tarif narxi noto''g''ri';
  end if;

  -- Suiiste'moldan himoya: bir soatda 20 tadan ortiq buyurtma yaratib bo'lmaydi
  if (select count(*) from public.payment_orders
      where user_id = v_uid and created_at > now() - interval '1 hour') >= 20 then
    raise exception 'Juda ko''p urinish. Birozdan keyin qayta urinib ko''ring';
  end if;

  insert into public.payment_orders (user_id, plan, plan_title, months, amount, provider, reviews)
  values (v_uid, p_plan, v_plan ->> 'title', v_months, v_amount, p_provider, v_reviews)
  returning * into v_order;

  return v_order;
end;
$$;

-- ---------------------------------------------------------------- 4. to'lov tasdiqlanganda / bekor qilinganda
create or replace function public.lx_apply_order_premium(p_order_id uuid, p_grant boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.payment_orders;
begin
  select * into v_order from public.payment_orders where id = p_order_id;
  if v_order.id is null or v_order.user_id is null then
    return;
  end if;

  if p_grant then
    -- Muddatsiz Premium (premium_until = null) bo'lsa — muddatga tegmaymiz
    update public.profiles
    set is_premium    = true,
        premium_until = greatest(coalesce(premium_until, now()), now())
                        + make_interval(months => v_order.months)
    where id = v_order.user_id
      and not (is_premium and premium_until is null);

    update public.profiles
    set review_credits = review_credits + coalesce(v_order.reviews, 0)
    where id = v_order.user_id;
  else
    update public.profiles
    set premium_until = premium_until - make_interval(months => v_order.months)
    where id = v_order.user_id
      and premium_until is not null;

    update public.profiles
    set review_credits = greatest(0, review_credits - coalesce(v_order.reviews, 0))
    where id = v_order.user_id;
  end if;
end;
$$;

-- ---------------------------------------------------------------- 5. test topshirilganda limit sarflanadi
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
  v_credits       int;
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

  -- Writing/Speaking o'qituvchi tekshiruvi tarifdagi limit bo'yicha (profiles.review_credits).
  -- Limit bor — bittasi sarflanadi va ish "Tekshirish navbati"ga tushadi.
  -- Limit tugagan — Reading/Listening natijasi darhol chiqadi, Writing/Speaking tekshirilmaydi.
  -- Admin va o'qituvchilar (sinov uchun) limitsiz.
  if v_manual and not public.is_staff() then
    select review_credits into v_credits
    from public.profiles
    where id = v_attempt.user_id
    for update;

    if coalesce(v_credits, 0) > 0 then
      update public.profiles
      set review_credits = review_credits - 1
      where id = v_attempt.user_id;
      v_breakdown := v_breakdown || '{"_review": "credit"}'::jsonb;
    else
      v_manual := false;
      v_breakdown := v_breakdown || '{"_review": "none"}'::jsonb;
    end if;
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

-- ---------------------------------------------------------------- 6. hozirgi Premium a'zolarga bitta tekshiruv
-- (eski tariflarda limit yo'q edi — ular bitta Full Mock'ni o'qituvchiga tekshirtira oladi)
update public.profiles
set review_credits = greatest(review_credits, 1)
where is_premium
  and (premium_until is null or premium_until > now())
  and role = 'student';
