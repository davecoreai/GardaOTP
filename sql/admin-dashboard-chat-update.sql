-- SoraOTP Admin Dashboard + account badges + chat hardening
-- Run once after the existing schema.sql and public-chat-e2ee-migration.sql.

alter table public.profiles
  add column if not exists admin_role text not null default 'user',
  add column if not exists is_verified boolean not null default false,
  add column if not exists is_blocked boolean not null default false,
  add column if not exists blocked_reason text,
  add column if not exists blocked_at timestamptz;

alter table public.profiles drop constraint if exists profiles_admin_role_check;
-- Keep account permissions server-controlled. Users may only edit profile presentation fields.
revoke update on public.profiles from anon, authenticated;
grant update(display_name, username, avatar_url, banner_url) on public.profiles to authenticated;

alter table public.profiles add constraint profiles_admin_role_check
  check (admin_role in ('user','moderator','admin'));

alter table public.public_chat_messages
  add column if not exists admin_role text not null default 'user',
  add column if not exists is_verified boolean not null default false;

create table if not exists public.admin_provider_settings (
  provider_id text primary key check (provider_id ~ '^provider_[1-5]$'),
  label text not null,
  enabled boolean not null default true,
  markup_idr bigint not null default 0 check (markup_idr between 0 and 1000000),
  updated_at timestamptz not null default now()
);
insert into public.admin_provider_settings(provider_id,label)
select 'provider_' || n, 'Provider ' || n from generate_series(1,5) n
on conflict (provider_id) do nothing;

create table if not exists public.admin_service_settings (
  service_id text primary key,
  service_name text not null,
  enabled boolean not null default true,
  updated_at timestamptz not null default now()
);

create table if not exists public.admin_website_settings (
  id boolean primary key default true check (id),
  settings jsonb not null default '{"announcement":"","maintenance_mode":false,"chat_enabled":true}'::jsonb,
  updated_at timestamptz not null default now()
);
insert into public.admin_website_settings(id) values(true) on conflict (id) do nothing;

create or replace function public.admin_paid_topup_stats()
returns table(paid_count bigint, paid_amount numeric)
language sql
security definer
set search_path = pg_catalog, public
as $$
  select count(*)::bigint, coalesce(sum(t.amount),0)::numeric
  from public.topups t
  where t.status in ('paid','completed');
$$;
revoke all on function public.admin_paid_topup_stats() from public, anon, authenticated;
grant execute on function public.admin_paid_topup_stats() to service_role;

create table if not exists public.admin_balance_adjustments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  actor_id uuid not null references public.profiles(id),
  amount bigint not null check (amount <> 0),
  reason text not null,
  balance_after bigint not null check (balance_after >= 0),
  created_at timestamptz not null default now()
);
create index if not exists admin_balance_adjustments_created_idx
  on public.admin_balance_adjustments(created_at desc);

create table if not exists public.admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid not null references public.profiles(id),
  action text not null,
  target_id text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists admin_audit_log_created_idx
  on public.admin_audit_log(created_at desc);

-- The RPC can only be invoked by the server's service_role. The API checks the actor's role.
create or replace function public.admin_adjust_balance(
  p_user_id uuid,
  p_actor_id uuid,
  p_amount bigint,
  p_reason text
) returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare v_balance bigint;
begin
  if p_amount is null or p_amount = 0 or abs(p_amount) > 1000000000
     or p_reason is null or length(btrim(p_reason)) < 3 or length(p_reason) > 240 then
    raise exception 'Invalid adjustment';
  end if;
  update public.profiles
     set balance = balance + p_amount
   where id = p_user_id and balance + p_amount >= 0
   returning balance into v_balance;
  if not found then raise exception 'User not found or balance would become negative'; end if;
  insert into public.admin_balance_adjustments(user_id,actor_id,amount,reason,balance_after)
  values(p_user_id,p_actor_id,p_amount,btrim(p_reason),v_balance);
  return jsonb_build_object('user_id',p_user_id,'balance_after',v_balance,'amount',p_amount);
end;
$$;
revoke all on function public.admin_adjust_balance(uuid,uuid,bigint,text) from public, anon, authenticated;
grant execute on function public.admin_adjust_balance(uuid,uuid,bigint,text) to service_role;

alter table public.admin_provider_settings enable row level security;
alter table public.admin_service_settings enable row level security;
alter table public.admin_website_settings enable row level security;
alter table public.admin_balance_adjustments enable row level security;
alter table public.admin_audit_log enable row level security;
revoke all on public.admin_provider_settings from public, anon, authenticated;
revoke all on public.admin_service_settings from public, anon, authenticated;
revoke all on public.admin_website_settings from public, anon, authenticated;
revoke all on public.admin_balance_adjustments from public, anon, authenticated;
revoke all on public.admin_audit_log from public, anon, authenticated;
grant all on public.admin_provider_settings to service_role;
grant all on public.admin_service_settings to service_role;
grant all on public.admin_website_settings to service_role;
grant all on public.admin_balance_adjustments to service_role;
grant all on public.admin_audit_log to service_role;

-- Keep identity and badge metadata server-authored. Blocked accounts cannot send chat messages.
create or replace function public.prepare_public_chat_message()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_profile record;
  v_reply record;
  v_last timestamptz;
begin
  if auth.uid() is null then
    raise exception 'Login diperlukan untuk mengirim pesan.' using errcode = '42501';
  end if;
  if exists (select 1 from public.admin_website_settings s where s.id=true and coalesce((s.settings->>'chat_enabled')::boolean,true)=false) then
    raise exception 'Chat Public sedang dinonaktifkan oleh administrator.' using errcode='42501';
  end if;
  new.id := gen_random_uuid();
  new.user_id := auth.uid();
  new.body := btrim(coalesce(new.body, ''));
  if char_length(new.body) < 1 or char_length(new.body) > 8000 or left(new.body, 6) <> 'E2EE1.' then
    raise exception 'Payload pesan terenkripsi tidak valid.' using errcode = '22023';
  end if;

  select p.display_name,p.username,p.avatar_url,p.admin_role,p.is_verified,p.is_blocked
    into v_profile from public.profiles p where p.id=new.user_id;
  if not found then
    insert into public.profiles(id,display_name,username)
    select u.id,coalesce(nullif(u.raw_user_meta_data->>'display_name',''),split_part(u.email,'@',1),'Pengguna'),
      case when u.raw_user_meta_data->>'username' ~ '^[a-z0-9]{3,20}$' then u.raw_user_meta_data->>'username' else null end
    from auth.users u where u.id=new.user_id on conflict(id) do nothing;
    select p.display_name,p.username,p.avatar_url,p.admin_role,p.is_verified,p.is_blocked
      into v_profile from public.profiles p where p.id=new.user_id;
  end if;
  if coalesce(v_profile.is_blocked,false) then
    raise exception 'Akun ini dibatasi untuk mengirim pesan.' using errcode='42501';
  end if;

  new.display_name := coalesce(v_profile.display_name,'Pengguna');
  new.username := v_profile.username;
  new.avatar_url := v_profile.avatar_url;
  new.admin_role := coalesce(v_profile.admin_role,'user');
  new.is_verified := coalesce(v_profile.is_verified,false);

  if new.reply_to is not null then
    select m.username into v_reply from public.public_chat_messages m where m.id=new.reply_to;
    if not found then raise exception 'Pesan yang ingin dibalas sudah tidak tersedia.' using errcode='23503'; end if;
    new.reply_to_name := coalesce(v_reply.username,'user');
    new.reply_to_body := '[Pesan terenkripsi]';
  else
    new.reply_to_name := null;
    new.reply_to_body := null;
  end if;

  perform pg_advisory_xact_lock(hashtextextended(new.user_id::text,0));
  select max(m.created_at) into v_last from public.public_chat_messages m where m.user_id=new.user_id;
  if v_last is not null and v_last > clock_timestamp()-interval '1.2 seconds' then
    raise exception 'Tunggu sebentar sebelum mengirim pesan berikutnya.' using errcode='P0001';
  end if;
  new.created_at := now();
  return new;
end;
$$;
revoke all on function public.prepare_public_chat_message() from public, anon, authenticated;
drop trigger if exists prepare_public_chat_message on public.public_chat_messages;
create trigger prepare_public_chat_message before insert on public.public_chat_messages
for each row execute function public.prepare_public_chat_message();

-- Blocked status is enforced by the chat table's RLS as an additional guard.
drop policy if exists "Users can send as themselves in public chat" on public.public_chat_messages;
drop policy if exists "Authenticated users can read public chat" on public.public_chat_messages;
create policy "Authenticated users can read public chat"
  on public.public_chat_messages for select to authenticated
  using (not exists (select 1 from public.profiles p where p.id=auth.uid() and p.is_blocked=true));

create policy "Users can send as themselves in public chat"
  on public.public_chat_messages for insert to authenticated
  with check (
    auth.uid() = user_id
    and not exists (select 1 from public.profiles p where p.id=auth.uid() and p.is_blocked=true)
  );

-- Owner provisioning (manual, after setting the same UUID in Vercel as SORAOTP_OWNER_ID):
-- UPDATE public.profiles SET admin_role='admin', is_verified=true WHERE id='YOUR_SUPABASE_AUTH_USER_UUID';
-- Keep SORAOTP_OWNER_ID as the authoritative owner check; do not store the secret in frontend code.
