-- Garda OTP: perbaikan penyimpanan profil.
-- Jalankan satu kali di Supabase SQL Editor setelah sql/schema.sql.
-- Aman dijalankan ulang. Tidak memberikan izin mengubah saldo atau data transaksi.

begin;

alter table public.profiles add column if not exists username text;
alter table public.profiles add column if not exists avatar_url text;
alter table public.profiles add column if not exists banner_url text;

-- Pastikan semua akun Auth mempunyai satu baris profil.
insert into public.profiles (id, display_name, username)
select u.id,
       coalesce(nullif(u.raw_user_meta_data->>'display_name',''), nullif(split_part(coalesce(u.email,''),'@',1),''), 'Pengguna'),
       case when coalesce(u.raw_user_meta_data->>'username','') ~ '^[a-z0-9]{3,20}$'
                  and not exists (select 1 from public.profiles p where p.username=u.raw_user_meta_data->>'username' and p.id<>u.id)
            then u.raw_user_meta_data->>'username' else null end
from auth.users u
on conflict (id) do nothing;

alter table public.profiles drop constraint if exists profiles_username_format;
alter table public.profiles add constraint profiles_username_format
  check (username is null or username ~ '^[a-z0-9]{3,20}$');
create unique index if not exists profiles_username_unique
  on public.profiles(username) where username is not null;

alter table public.profiles enable row level security;
drop policy if exists "read own profile" on public.profiles;
create policy "read own profile" on public.profiles
  for select to authenticated using (auth.uid() = id);
drop policy if exists "update own profile name" on public.profiles;
create policy "update own profile name" on public.profiles
  for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

-- Cabut izin umum, lalu izinkan hanya kolom tampilan profil.
revoke update on public.profiles from public, anon, authenticated;
grant select on public.profiles to authenticated;
grant update (display_name, username, avatar_url, banner_url)
  on public.profiles to authenticated;

create or replace function public.username_available_for_current_user(p_username text)
returns boolean
language sql stable security definer set search_path = public as $$
  select auth.uid() is not null
    and p_username ~ '^[a-z0-9]{3,20}$'
    and not exists (
      select 1 from public.profiles
      where username = p_username and id <> auth.uid()
    );
$$;
revoke all on function public.username_available_for_current_user(text) from public, anon;
grant execute on function public.username_available_for_current_user(text) to authenticated;

-- Storage bucket dan policy upload profil.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('profile-assets', 'profile-assets', true, 4194304, array['image/png','image/jpeg','image/webp'])
on conflict (id) do update set
  public = true,
  file_size_limit = 4194304,
  allowed_mime_types = array['image/png','image/jpeg','image/webp'];

alter table storage.objects enable row level security;
drop policy if exists "Profile images are publicly readable" on storage.objects;
create policy "Profile images are publicly readable" on storage.objects
  for select using (bucket_id = 'profile-assets');
drop policy if exists "Users can upload their own profile images" on storage.objects;
create policy "Users can upload their own profile images" on storage.objects
  for insert to authenticated with check (
    bucket_id = 'profile-assets' and (storage.foldername(name))[1] = auth.uid()::text
  );
drop policy if exists "Users can update their own profile images" on storage.objects;
create policy "Users can update their own profile images" on storage.objects
  for update to authenticated using (
    bucket_id = 'profile-assets' and (storage.foldername(name))[1] = auth.uid()::text
  ) with check (
    bucket_id = 'profile-assets' and (storage.foldername(name))[1] = auth.uid()::text
  );
drop policy if exists "Users can delete their own profile images" on storage.objects;
create policy "Users can delete their own profile images" on storage.objects
  for delete to authenticated using (
    bucket_id = 'profile-assets' and (storage.foldername(name))[1] = auth.uid()::text
  );

commit;
