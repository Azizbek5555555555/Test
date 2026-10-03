-- ============================================================================
-- 0009 · Spamdan himoya — "Aloqa" va "Kursga yozilish" formalari
--
-- Muammo: avval bu jadvallarga ochiq (anon) kalit bilan TO'G'RIDAN-TO'G'RI yozish
-- mumkin edi. Anon kalit saytning JS kodida ochiq turadi, ya'ni bot saytimizni
-- chetlab o'tib, Supabase'ga minglab soxta xabar yubora olardi.
--
-- Yechim:
--   1) anon / authenticated uchun INSERT butunlay yopiladi — yozuvlar faqat
--      saytning serveri orqali (tekshiruv, IP-limit va bot-tuzoqdan keyin) tushadi;
--   2) baza darajasida qo'shimcha "to'siq": bir xil telefon/email'dan qisqa vaqtda
--      ko'p yozuv kelsa, baza o'zi rad etadi (server xatosi bo'lsa ham ishlaydi).
-- Qayta ishga tushirish xavfsiz.
-- ============================================================================

-- 1) To'g'ridan-to'g'ri yozish yopiladi
revoke insert on public.contact_messages    from anon, authenticated;
revoke insert on public.course_applications from anon, authenticated;
drop policy if exists "contact_insert_any"     on public.contact_messages;
drop policy if exists "course_apps_insert_any" on public.course_applications;

grant insert on public.contact_messages, public.course_applications to service_role;

-- Tezkor qidiruv uchun indekslar
create index if not exists contact_messages_created_idx on public.contact_messages (created_at desc);
create index if not exists course_apps_phone_idx on public.course_applications (phone, created_at desc);

-- 2) Baza darajasidagi chegaralar
create or replace function public.lx_contact_flood_guard()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Bir xil email yoki telefondan 1 soatda 3 tadan ortiq xabar
  if (select count(*) from public.contact_messages m
      where m.created_at > now() - interval '1 hour'
        and ((new.email is not null and lower(m.email) = lower(new.email))
          or (new.phone is not null and m.phone = new.phone))) >= 3 then
    raise exception 'too_many_messages' using errcode = 'P0001';
  end if;
  -- Umumiy oqim: 10 daqiqada 60 tadan ortiq xabar — hujum belgisi
  if (select count(*) from public.contact_messages m
      where m.created_at > now() - interval '10 minutes') >= 60 then
    raise exception 'too_many_messages' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

drop trigger if exists contact_flood_guard on public.contact_messages;
create trigger contact_flood_guard
  before insert on public.contact_messages
  for each row execute function public.lx_contact_flood_guard();

create or replace function public.lx_application_flood_guard()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Bir telefon raqamidan 1 kunda bitta kursga 2 tadan ortiq ariza
  if (select count(*) from public.course_applications a
      where a.created_at > now() - interval '1 day'
        and a.phone = new.phone and a.course_id = new.course_id) >= 2 then
    raise exception 'too_many_applications' using errcode = 'P0001';
  end if;
  if (select count(*) from public.course_applications a
      where a.created_at > now() - interval '10 minutes') >= 60 then
    raise exception 'too_many_applications' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

drop trigger if exists application_flood_guard on public.course_applications;
create trigger application_flood_guard
  before insert on public.course_applications
  for each row execute function public.lx_application_flood_guard();

revoke all on function public.lx_contact_flood_guard()     from public, anon, authenticated;
revoke all on function public.lx_application_flood_guard() from public, anon, authenticated;
