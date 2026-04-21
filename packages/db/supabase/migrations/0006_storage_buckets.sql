-- =============================================================================
-- 0006: Private storage buckets for voice intros + photos
-- Admin (service_role) reads via signed URLs; anon can only INSERT (upload).
-- =============================================================================

insert into storage.buckets (id, name, public)
values
  ('voice-intros', 'voice-intros', false),
  ('photos',       'photos',       false)
on conflict (id) do nothing;

-- Allow anon (public form) to upload a file. No further restrictions at the
-- DB layer — the application layer validates file size/type/etc.
drop policy if exists "anon_upload_voice" on storage.objects;
create policy "anon_upload_voice"
  on storage.objects for insert to anon
  with check (bucket_id = 'voice-intros');

drop policy if exists "anon_upload_photo" on storage.objects;
create policy "anon_upload_photo"
  on storage.objects for insert to anon
  with check (bucket_id = 'photos');

-- No SELECT/DELETE/UPDATE policy for anon → effectively write-only.
-- service_role bypasses RLS (it's Supabase's admin role).
