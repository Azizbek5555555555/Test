-- ============================================================================
-- MULTILEVEL PLUS — 0004 FAYL SAQLASH (Storage)
--
-- Ikkita "bucket" (papka) yaratiladi:
--   audio    → Listening audio fayllari va rasmlar (HAMMAGA OCHIQ)
--   speaking → O'quvchilarning Speaking javoblari (YOPIQ, faqat o'zi va o'qituvchi)
--
-- Agar bu fayl xato bersa, bucketlarni Supabase → Storage bo'limidan
-- qo'lda ham yaratish mumkin (SETUP.md, 6-qadam).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- BUCKETLAR
-- ----------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit)
values ('audio', 'audio', true, 52428800)          -- 50 MB
on conflict (id) do update set public = true;

insert into storage.buckets (id, name, public, file_size_limit)
values ('speaking', 'speaking', false, 26214400)   -- 25 MB
on conflict (id) do update set public = false;

-- ----------------------------------------------------------------------------
-- AUDIO (ochiq): hamma o'qiy oladi, faqat xodimlar yuklaydi
-- ----------------------------------------------------------------------------
drop policy if exists "audio_public_read" on storage.objects;
create policy "audio_public_read" on storage.objects
  for select using (bucket_id = 'audio');

drop policy if exists "audio_staff_insert" on storage.objects;
create policy "audio_staff_insert" on storage.objects
  for insert with check (bucket_id = 'audio' and public.is_staff());

drop policy if exists "audio_staff_update" on storage.objects;
create policy "audio_staff_update" on storage.objects
  for update using (bucket_id = 'audio' and public.is_staff())
  with check (bucket_id = 'audio' and public.is_staff());

drop policy if exists "audio_staff_delete" on storage.objects;
create policy "audio_staff_delete" on storage.objects
  for delete using (bucket_id = 'audio' and public.is_staff());

-- ----------------------------------------------------------------------------
-- SPEAKING (yopiq): fayl yo'li "<user_id>/<attempt_id>/<question_id>.webm"
-- Foydalanuvchi faqat O'Z papkasiga yozadi va o'qiydi.
-- O'qituvchi/admin barchasini o'qiy oladi.
-- ----------------------------------------------------------------------------
drop policy if exists "speaking_own_insert" on storage.objects;
create policy "speaking_own_insert" on storage.objects
  for insert with check (
    bucket_id = 'speaking'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "speaking_own_update" on storage.objects;
create policy "speaking_own_update" on storage.objects
  for update using (
    bucket_id = 'speaking'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'speaking'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "speaking_read_own_or_staff" on storage.objects;
create policy "speaking_read_own_or_staff" on storage.objects
  for select using (
    bucket_id = 'speaking'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or public.is_staff()
    )
  );

drop policy if exists "speaking_delete_own_or_staff" on storage.objects;
create policy "speaking_delete_own_or_staff" on storage.objects
  for delete using (
    bucket_id = 'speaking'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or public.is_staff()
    )
  );
