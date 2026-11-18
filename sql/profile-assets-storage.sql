-- Jalankan sekali di Supabase SQL Editor untuk fitur Edit Profile.
-- Menyimpan URL foto profil dan banner pada baris profiles milik pengguna.
alter table public.profiles add column if not exists avatar_url text;
alter table public.profiles add column if not exists banner_url text;
grant update(display_name, avatar_url, banner_url) on public.profiles to authenticated;

-- Bucket public agar browser dapat menampilkan gambar; upload/update/delete tetap dibatasi per folder user.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('profile-assets', 'profile-assets', true, 4194304, array['image/png','image/jpeg','image/webp'])
on conflict (id) do update set
  public = true,
  file_size_limit = 4194304,
  allowed_mime_types = array['image/png','image/jpeg','image/webp'];

drop policy if exists "Profile images are publicly readable" on storage.objects;
create policy "Profile images are publicly readable"
on storage.objects for select
using (bucket_id = 'profile-assets');

drop policy if exists "Users can upload their own profile images" on storage.objects;
create policy "Users can upload their own profile images"
on storage.objects for insert to authenticated
with check (bucket_id = 'profile-assets' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Users can update their own profile images" on storage.objects;
create policy "Users can update their own profile images"
on storage.objects for update to authenticated
using (bucket_id = 'profile-assets' and (storage.foldername(name))[1] = auth.uid()::text)
with check (bucket_id = 'profile-assets' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Users can delete their own profile images" on storage.objects;
create policy "Users can delete their own profile images"
on storage.objects for delete to authenticated
using (bucket_id = 'profile-assets' and (storage.foldername(name))[1] = auth.uid()::text);
