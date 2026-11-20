-- SoraOTP: safe cross-device profile visibility and realtime sync.
-- Run once in Supabase SQL Editor after the existing profile/storage migrations.
-- Only presentation fields are readable by signed-in users; balance and private fields stay hidden.

begin;

-- Remove table-wide SELECT so authenticated clients cannot read balance or private columns.
revoke select on table public.profiles from anon, authenticated;
grant select (id, display_name, username, avatar_url, banner_url, admin_role, is_verified)
  on table public.profiles to authenticated;

-- Users can read safe profile presentation fields for other users.
drop policy if exists "read own profile" on public.profiles;
drop policy if exists "read public profile fields" on public.profiles;
create policy "read public profile fields"
  on public.profiles
  for select
  to authenticated
  using (true);

-- Keep profile edits restricted to the signed-in account.
drop policy if exists "update own profile name" on public.profiles;
create policy "update own profile name"
  on public.profiles
  for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Explicitly limit editable columns; role, verification, balance and flags are not user-editable.
revoke update on table public.profiles from anon, authenticated;
grant update (display_name, username, avatar_url, banner_url)
  on table public.profiles to authenticated;

-- Enable UPDATE events for Supabase Realtime (safe to run if already included).
do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'profiles'
  ) then
    alter publication supabase_realtime add table public.profiles;
  end if;
end
$$;

commit;
