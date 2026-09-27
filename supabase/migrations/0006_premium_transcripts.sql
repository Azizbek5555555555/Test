-- ============================================================================
-- LEVELX ENGLISH — 0006 LISTENING SKRIPTLARI FAQAT PREMIUM UCHUN
--
-- 0001–0005 dan KEYIN ishga tushiriladi. Qayta ishga tushirsa ham xavfsiz.
--
-- test_parts.transcript ustunini oddiy foydalanuvchi (anon/authenticated)
-- API orqali ham O'QIY OLMAYDI. Skript faqat get_part_transcripts()
-- funksiyasi orqali beriladi — u Premium foydalanuvchi va o'qituvchi/adminga
-- ochiq, qolganlarga bo'sh natija qaytaradi.
-- ============================================================================

revoke select on public.test_parts from anon, authenticated;
grant select (id, test_set_id, section, title, instructions, passage, audio_url,
              image_url, duration_minutes, order_index)
  on public.test_parts to anon, authenticated;

create or replace function public.get_part_transcripts(p_test_set_id uuid)
returns table (part_id uuid, transcript text)
language sql
stable
security definer
set search_path = public
as $$
  select tp.id, tp.transcript
  from public.test_parts tp
  join public.test_sets ts on ts.id = tp.test_set_id
  where tp.test_set_id = p_test_set_id
    and tp.transcript is not null
    and btrim(tp.transcript) <> ''
    and (public.has_premium() or public.is_staff())
    and (ts.published or public.is_staff())
  order by tp.order_index;
$$;

revoke execute on function public.get_part_transcripts(uuid) from public, anon;
grant execute on function public.get_part_transcripts(uuid) to authenticated;
