-- ============================================================================
-- LEVELX ENGLISH — 0007 ONLAYN TO'LOV: PAYME VA CLICK (Uzcard, Humo)
--
-- 0001–0006 dan KEYIN ishga tushiriladi. Qayta ishga tushirsa ham xavfsiz.
--
-- Oqim:
--   1. O'quvchi tarifni tanlaydi → create_payment_order() buyurtma yaratadi
--      (narx va muddat serverdagi tarifdan olinadi, brauzerdan emas).
--   2. O'quvchi Payme yoki Click sahifasida karta bilan to'laydi.
--   3. Payme / Click serveri saytimizga xabar beradi (/api/payments/...).
--      Bu yerdagi payme_handle() / click_prepare() / click_complete()
--      funksiyalari tranzaksiyani qayd qiladi va to'lov o'tgach Premium'ni
--      avtomatik yoqadi. Funksiyalarni faqat server (service_role) chaqiradi.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. JADVALLAR
-- ----------------------------------------------------------------------------
create table if not exists public.payment_orders (
  id           uuid primary key default gen_random_uuid(),
  -- To'lov tizimlariga beriladigan qisqa raqam (Payme: order_id, Click: transaction_param)
  order_number bigint generated always as identity (start with 100001) unique,
  user_id      uuid references public.profiles (id) on delete set null,
  plan         text not null,
  plan_title   text,
  months       integer not null check (months between 1 and 60),
  amount       integer not null check (amount >= 1000),   -- so'm
  provider     text not null check (provider in ('payme', 'click')),
  status       text not null default 'pending'
               check (status in ('pending', 'paid', 'cancelled')),
  created_at   timestamptz not null default now(),
  paid_at      timestamptz,
  cancelled_at timestamptz
);

create index if not exists payment_orders_user_idx
  on public.payment_orders (user_id, created_at desc);
create index if not exists payment_orders_status_idx
  on public.payment_orders (status, created_at desc);

-- Payme tranzaksiyalari (Merchant API holatlari: 1, 2, -1, -2)
create table if not exists public.payme_transactions (
  id           bigint generated always as identity primary key,
  payme_id     text not null unique,
  order_id     uuid not null references public.payment_orders (id),
  amount       bigint not null,            -- tiyin
  state        smallint not null,
  reason       smallint,
  payme_time   bigint not null,            -- Payme yuborgan vaqt (ms)
  create_time  bigint not null,            -- bizda yaratilgan vaqt (ms)
  perform_time bigint not null default 0,
  cancel_time  bigint not null default 0
);

create index if not exists payme_transactions_order_idx
  on public.payme_transactions (order_id);
create index if not exists payme_transactions_time_idx
  on public.payme_transactions (payme_time);

-- Click tranzaksiyalari (Prepare → Complete)
create table if not exists public.click_transactions (
  id              bigint generated always as identity primary key,  -- merchant_prepare_id
  click_trans_id  bigint not null unique,
  click_paydoc_id bigint,
  order_id        uuid not null references public.payment_orders (id),
  amount          numeric(14, 2) not null,
  status          text not null check (status in ('prepared', 'completed', 'cancelled')),
  error_code      integer,
  created_at      timestamptz not null default now(),
  completed_at    timestamptz,
  cancelled_at    timestamptz
);

create index if not exists click_transactions_order_idx
  on public.click_transactions (order_id);

-- ----------------------------------------------------------------------------
-- 2. HUQUQLAR — o'quvchi faqat o'z buyurtmalarini ko'radi.
--    Yozish faqat quyidagi funksiyalar orqali.
-- ----------------------------------------------------------------------------
alter table public.payment_orders     enable row level security;
alter table public.payme_transactions enable row level security;
alter table public.click_transactions enable row level security;

revoke all on public.payment_orders     from anon, authenticated;
revoke all on public.payme_transactions from anon, authenticated;
revoke all on public.click_transactions from anon, authenticated;
grant select on public.payment_orders to authenticated;
-- Server (service_role) — to'lov tizimlari so'rovlarini qayta ishlash uchun
grant all on public.payment_orders, public.payme_transactions, public.click_transactions to service_role;

drop policy if exists "payment_orders_read_own_or_staff" on public.payment_orders;
create policy "payment_orders_read_own_or_staff" on public.payment_orders
  for select using (user_id = auth.uid() or public.is_staff());

-- ----------------------------------------------------------------------------
-- 3. YORDAMCHI FUNKSIYALAR
-- ----------------------------------------------------------------------------
create or replace function public.lx_now_ms()
returns bigint
language sql
volatile
as $$
  select (extract(epoch from clock_timestamp()) * 1000)::bigint;
$$;

-- Tarifni serverdagi sozlamadan oladi (Admin → Sayt sozlamalari)
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
    v_plans := '[{"id":"monthly","title":"1 oylik","months":1,"amount":99000},
                 {"id":"quarterly","title":"3 oylik","months":3,"amount":249000},
                 {"id":"yearly","title":"12 oylik","months":12,"amount":790000}]'::jsonb;
  end if;

  select p into v_plan from jsonb_array_elements(v_plans) p
  where p ->> 'id' = p_plan limit 1;

  return v_plan;
end;
$$;

-- Premium muddatini uzaytirish (+) yoki qaytarish (-)
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
    -- Muddatsiz Premium (premium_until = null) bo'lsa — tegmaymiz
    update public.profiles
    set is_premium    = true,
        premium_until = greatest(coalesce(premium_until, now()), now())
                        + make_interval(months => v_order.months)
    where id = v_order.user_id
      and not (is_premium and premium_until is null);
  else
    update public.profiles
    set premium_until = premium_until - make_interval(months => v_order.months)
    where id = v_order.user_id
      and premium_until is not null;
  end if;
end;
$$;

-- ----------------------------------------------------------------------------
-- 4. BUYURTMA YARATISH — o'quvchi chaqiradi (server action orqali)
-- ----------------------------------------------------------------------------
create or replace function public.create_payment_order(p_plan text, p_provider text)
returns public.payment_orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid    uuid := auth.uid();
  v_plan   jsonb;
  v_amount integer;
  v_months integer;
  v_order  public.payment_orders;
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
  if v_amount is null or v_amount < 1000 then
    raise exception 'Tarif narxi noto''g''ri';
  end if;

  -- Suiiste'moldan himoya: bir soatda 20 tadan ortiq buyurtma yaratib bo'lmaydi
  if (select count(*) from public.payment_orders
      where user_id = v_uid and created_at > now() - interval '1 hour') >= 20 then
    raise exception 'Juda ko''p urinish. Birozdan keyin qayta urinib ko''ring';
  end if;

  insert into public.payment_orders (user_id, plan, plan_title, months, amount, provider)
  values (v_uid, p_plan, v_plan ->> 'title', v_months, v_amount, p_provider)
  returning * into v_order;

  return v_order;
end;
$$;

-- ----------------------------------------------------------------------------
-- 5. PAYME MERCHANT API (JSON-RPC)
--    Natija: {"result": {...}} yoki {"error": {"code", "message", "data"}}
-- ----------------------------------------------------------------------------
create or replace function public.lx_payme_error(p_code integer, p_uz text, p_ru text, p_en text, p_data text default null)
returns jsonb
language sql
immutable
as $$
  select jsonb_build_object('error', jsonb_strip_nulls(jsonb_build_object(
    'code', p_code,
    'message', jsonb_build_object('uz', p_uz, 'ru', p_ru, 'en', p_en),
    'data', p_data
  )));
$$;

create or replace function public.payme_handle(p_method text, p_params jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  c_timeout constant bigint := 43200000;  -- 12 soat (Payme talabi)
  v_now     bigint := public.lx_now_ms();
  v_tx      public.payme_transactions;
  v_order   public.payment_orders;
  v_account text;
  v_amount  bigint;
  v_list    jsonb;
begin
  -- ---------------------------------------------------- Tranzaksiya bo'yicha
  if p_method in ('PerformTransaction', 'CancelTransaction', 'CheckTransaction') then
    select * into v_tx from public.payme_transactions
    where payme_id = p_params ->> 'id'
    for update;

    if v_tx.id is null then
      return public.lx_payme_error(-31003, 'Tranzaksiya topilmadi',
        'Транзакция не найдена', 'Transaction not found');
    end if;

    select * into v_order from public.payment_orders where id = v_tx.order_id for update;

    if p_method = 'CheckTransaction' then
      return jsonb_build_object('result', jsonb_build_object(
        'create_time', v_tx.create_time,
        'perform_time', v_tx.perform_time,
        'cancel_time', v_tx.cancel_time,
        'transaction', v_tx.id::text,
        'state', v_tx.state,
        'reason', v_tx.reason
      ));
    end if;

    if p_method = 'PerformTransaction' then
      if v_tx.state = 2 then
        return jsonb_build_object('result', jsonb_build_object(
          'transaction', v_tx.id::text, 'perform_time', v_tx.perform_time, 'state', 2));
      end if;

      if v_tx.state <> 1 then
        return public.lx_payme_error(-31008, 'Bu amalni bajarib bo''lmaydi',
          'Невозможно выполнить операцию', 'Unable to perform operation');
      end if;

      if v_now - v_tx.create_time > c_timeout then
        update public.payme_transactions
        set state = -1, reason = 4, cancel_time = v_now
        where id = v_tx.id;
        update public.payment_orders
        set status = 'cancelled', cancelled_at = now()
        where id = v_order.id and status = 'pending';
        return public.lx_payme_error(-31008, 'Tranzaksiya muddati o''tgan',
          'Истекло время ожидания транзакции', 'Transaction timed out');
      end if;

      update public.payme_transactions
      set state = 2, perform_time = v_now
      where id = v_tx.id;

      update public.payment_orders
      set status = 'paid', paid_at = now()
      where id = v_order.id;

      perform public.lx_apply_order_premium(v_order.id, true);

      return jsonb_build_object('result', jsonb_build_object(
        'transaction', v_tx.id::text, 'perform_time', v_now, 'state', 2));
    end if;

    -- CancelTransaction
    if v_tx.state = 1 then
      update public.payme_transactions
      set state = -1, reason = (p_params ->> 'reason')::smallint, cancel_time = v_now
      where id = v_tx.id
      returning * into v_tx;

      update public.payment_orders
      set status = 'cancelled', cancelled_at = now()
      where id = v_order.id and status = 'pending';
    elsif v_tx.state = 2 then
      -- To'lov qaytarildi — Premium muddatini ham qaytaramiz
      update public.payme_transactions
      set state = -2, reason = (p_params ->> 'reason')::smallint, cancel_time = v_now
      where id = v_tx.id
      returning * into v_tx;

      update public.payment_orders
      set status = 'cancelled', cancelled_at = now()
      where id = v_order.id;

      perform public.lx_apply_order_premium(v_order.id, false);
    end if;

    return jsonb_build_object('result', jsonb_build_object(
      'transaction', v_tx.id::text, 'cancel_time', v_tx.cancel_time, 'state', v_tx.state));
  end if;

  -- ---------------------------------------------------- Ro'yxat (hisobot)
  if p_method = 'GetStatement' then
    select coalesce(jsonb_agg(jsonb_build_object(
             'id', t.payme_id,
             'time', t.payme_time,
             'amount', t.amount,
             'account', jsonb_build_object('order_id', o.order_number::text),
             'create_time', t.create_time,
             'perform_time', t.perform_time,
             'cancel_time', t.cancel_time,
             'transaction', t.id::text,
             'state', t.state,
             'reason', t.reason,
             'receivers', null
           ) order by t.payme_time), '[]'::jsonb)
    into v_list
    from public.payme_transactions t
    join public.payment_orders o on o.id = t.order_id
    where t.payme_time between (p_params ->> 'from')::bigint and (p_params ->> 'to')::bigint;

    return jsonb_build_object('result', jsonb_build_object('transactions', v_list));
  end if;

  if p_method not in ('CheckPerformTransaction', 'CreateTransaction') then
    return public.lx_payme_error(-32601, 'Metod topilmadi',
      'Метод не найден', 'Method not found', p_method);
  end if;

  -- ---------------------------------------------------- CreateTransaction: takroriy so'rov
  if p_method = 'CreateTransaction' then
    select * into v_tx from public.payme_transactions
    where payme_id = p_params ->> 'id'
    for update;

    if v_tx.id is not null then
      if v_tx.state <> 1 then
        return public.lx_payme_error(-31008, 'Bu amalni bajarib bo''lmaydi',
          'Невозможно выполнить операцию', 'Unable to perform operation');
      end if;

      if v_now - v_tx.create_time > c_timeout then
        update public.payme_transactions
        set state = -1, reason = 4, cancel_time = v_now
        where id = v_tx.id;
        update public.payment_orders
        set status = 'cancelled', cancelled_at = now()
        where id = v_tx.order_id and status = 'pending';
        return public.lx_payme_error(-31008, 'Tranzaksiya muddati o''tgan',
          'Истекло время ожидания транзакции', 'Transaction timed out');
      end if;

      return jsonb_build_object('result', jsonb_build_object(
        'create_time', v_tx.create_time, 'transaction', v_tx.id::text, 'state', v_tx.state));
    end if;
  end if;

  -- ---------------------------------------------------- Buyurtmani tekshirish
  v_account := p_params -> 'account' ->> 'order_id';
  if v_account is null or v_account !~ '^\d{1,18}$' then
    return public.lx_payme_error(-31050, 'Buyurtma topilmadi',
      'Заказ не найден', 'Order not found', 'order_id');
  end if;

  select * into v_order from public.payment_orders
  where order_number = v_account::bigint and provider = 'payme'
  for update;

  if v_order.id is null then
    return public.lx_payme_error(-31050, 'Buyurtma topilmadi',
      'Заказ не найден', 'Order not found', 'order_id');
  end if;

  if v_order.status = 'paid' then
    return public.lx_payme_error(-31051, 'Buyurtma allaqachon to''langan',
      'Заказ уже оплачен', 'Order is already paid', 'order_id');
  end if;

  if v_order.status = 'cancelled' then
    return public.lx_payme_error(-31052, 'Buyurtma bekor qilingan',
      'Заказ отменён', 'Order is cancelled', 'order_id');
  end if;

  begin
    v_amount := (p_params ->> 'amount')::bigint;
  exception when others then
    v_amount := null;
  end;

  if v_amount is null or v_amount <> v_order.amount::bigint * 100 then
    return public.lx_payme_error(-31001, 'Noto''g''ri summa',
      'Неверная сумма', 'Incorrect amount');
  end if;

  -- Buyurtma boshqa tranzaksiya orqali to'lanish jarayonida
  if exists (select 1 from public.payme_transactions
             where order_id = v_order.id and state = 1) then
    return public.lx_payme_error(-31053, 'Buyurtma boshqa tranzaksiya orqali to''lanmoqda',
      'Заказ ожидает оплаты другой транзакцией', 'Order is being paid by another transaction',
      'order_id');
  end if;

  if p_method = 'CheckPerformTransaction' then
    return jsonb_build_object('result', jsonb_build_object('allow', true));
  end if;

  -- CreateTransaction: yangi tranzaksiya
  insert into public.payme_transactions
    (payme_id, order_id, amount, state, payme_time, create_time)
  values
    (p_params ->> 'id', v_order.id, v_amount, 1, (p_params ->> 'time')::bigint, v_now)
  returning * into v_tx;

  return jsonb_build_object('result', jsonb_build_object(
    'create_time', v_tx.create_time, 'transaction', v_tx.id::text, 'state', 1));
end;
$$;

-- ----------------------------------------------------------------------------
-- 6. CLICK SHOP API (Prepare / Complete)
--    Imzo (sign_string) serverda tekshiriladi, bu yerga faqat to'g'ri so'rov keladi.
--    Xato kodlari: 0 ok, -2 summa, -4 allaqachon to'langan, -5 buyurtma yo'q,
--                  -6 tranzaksiya yo'q, -9 bekor qilingan
-- ----------------------------------------------------------------------------
create or replace function public.click_prepare(
  p_click_trans_id  bigint,
  p_click_paydoc_id bigint,
  p_merchant_trans_id text,
  p_amount numeric,
  p_error  integer
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.payment_orders;
  v_tx    public.click_transactions;
begin
  if p_merchant_trans_id is null or p_merchant_trans_id !~ '^\d{1,18}$' then
    return jsonb_build_object('error', -5, 'error_note', 'Order not found');
  end if;

  select * into v_order from public.payment_orders
  where order_number = p_merchant_trans_id::bigint and provider = 'click'
  for update;

  if v_order.id is null then
    return jsonb_build_object('error', -5, 'error_note', 'Order not found');
  end if;

  -- Takroriy Prepare
  select * into v_tx from public.click_transactions where click_trans_id = p_click_trans_id;
  if v_tx.id is not null then
    if v_tx.order_id <> v_order.id then
      return jsonb_build_object('error', -6, 'error_note', 'Transaction does not exist');
    end if;
    if v_tx.status = 'completed' then
      return jsonb_build_object('error', -4, 'error_note', 'Already paid');
    end if;
    if v_tx.status = 'cancelled' then
      return jsonb_build_object('error', -9, 'error_note', 'Transaction cancelled');
    end if;
    return jsonb_build_object('error', 0, 'error_note', 'Success', 'merchant_prepare_id', v_tx.id);
  end if;

  if v_order.status = 'paid' then
    return jsonb_build_object('error', -4, 'error_note', 'Already paid');
  end if;
  if v_order.status = 'cancelled' then
    return jsonb_build_object('error', -9, 'error_note', 'Transaction cancelled');
  end if;
  if p_amount is null or abs(p_amount - v_order.amount) > 0.01 then
    return jsonb_build_object('error', -2, 'error_note', 'Incorrect parameter amount');
  end if;
  if coalesce(p_error, 0) < 0 then
    return jsonb_build_object('error', -9, 'error_note', 'Transaction cancelled');
  end if;

  insert into public.click_transactions (click_trans_id, click_paydoc_id, order_id, amount, status)
  values (p_click_trans_id, p_click_paydoc_id, v_order.id, p_amount, 'prepared')
  returning * into v_tx;

  return jsonb_build_object('error', 0, 'error_note', 'Success', 'merchant_prepare_id', v_tx.id);
end;
$$;

create or replace function public.click_complete(
  p_click_trans_id bigint,
  p_merchant_trans_id text,
  p_merchant_prepare_id bigint,
  p_amount numeric,
  p_error  integer
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.payment_orders;
  v_tx    public.click_transactions;
begin
  select * into v_tx from public.click_transactions
  where id = p_merchant_prepare_id
  for update;

  if v_tx.id is null or v_tx.click_trans_id <> p_click_trans_id then
    return jsonb_build_object('error', -6, 'error_note', 'Transaction does not exist');
  end if;

  select * into v_order from public.payment_orders where id = v_tx.order_id for update;

  if v_order.id is null or v_order.order_number::text <> coalesce(p_merchant_trans_id, '') then
    return jsonb_build_object('error', -5, 'error_note', 'Order not found');
  end if;

  if v_tx.status = 'completed' then
    return jsonb_build_object('error', -4, 'error_note', 'Already paid',
                              'merchant_confirm_id', v_tx.id);
  end if;
  if v_tx.status = 'cancelled' then
    return jsonb_build_object('error', -9, 'error_note', 'Transaction cancelled');
  end if;
  if p_amount is null or abs(p_amount - v_tx.amount) > 0.01 then
    return jsonb_build_object('error', -2, 'error_note', 'Incorrect parameter amount');
  end if;

  -- Click to'lov o'tmaganini bildirdi (error < 0) — bekor qilamiz
  if coalesce(p_error, 0) < 0 then
    update public.click_transactions
    set status = 'cancelled', error_code = p_error, cancelled_at = now()
    where id = v_tx.id;
    update public.payment_orders
    set status = 'cancelled', cancelled_at = now()
    where id = v_order.id and status = 'pending';
    return jsonb_build_object('error', -9, 'error_note', 'Transaction cancelled');
  end if;

  if v_order.status = 'paid' then
    return jsonb_build_object('error', -4, 'error_note', 'Already paid');
  end if;
  if v_order.status = 'cancelled' then
    return jsonb_build_object('error', -9, 'error_note', 'Transaction cancelled');
  end if;

  update public.click_transactions
  set status = 'completed', completed_at = now()
  where id = v_tx.id;

  update public.payment_orders
  set status = 'paid', paid_at = now()
  where id = v_order.id;

  perform public.lx_apply_order_premium(v_order.id, true);

  return jsonb_build_object('error', 0, 'error_note', 'Success', 'merchant_confirm_id', v_tx.id);
end;
$$;

-- ----------------------------------------------------------------------------
-- 7. FUNKSIYALARGA RUXSAT
-- ----------------------------------------------------------------------------
revoke execute on function public.resolve_premium_plan(text) from public, anon, authenticated;
revoke execute on function public.lx_apply_order_premium(uuid, boolean) from public, anon, authenticated;
revoke execute on function public.payme_handle(text, jsonb) from public, anon, authenticated;
revoke execute on function public.click_prepare(bigint, bigint, text, numeric, integer) from public, anon, authenticated;
revoke execute on function public.click_complete(bigint, text, bigint, numeric, integer) from public, anon, authenticated;
revoke execute on function public.create_payment_order(text, text) from public, anon;

grant execute on function public.create_payment_order(text, text) to authenticated;
grant execute on function public.payme_handle(text, jsonb) to service_role;
grant execute on function public.click_prepare(bigint, bigint, text, numeric, integer) to service_role;
grant execute on function public.click_complete(bigint, text, bigint, numeric, integer) to service_role;
