-- Jalankan seluruh file ini di Supabase SQL Editor.
create extension if not exists pgcrypto;
create table if not exists public.profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 display_name text not null default 'Sora User',
 username text unique check (username is null or username ~ '^[a-z0-9]{3,20}$'),
 balance bigint not null default 0 check(balance >= 0),
 total_deposit bigint not null default 0 check(total_deposit >= 0),
 created_at timestamptz not null default now()
);
create table if not exists public.orders (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id),
 custom_order_id text not null unique, provider_order_id text, service_id text not null, service_name text not null,
 provider text not null, country_code text not null, provider_id text not null, phone text, amount bigint not null,
 status text not null default 'pending', otp text, refunded_at timestamptz, created_at timestamptz not null default now()
);
create table if not exists public.topups (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id),
 merchant_ref_id text not null unique, invoice text, amount bigint not null, status text not null default 'pending',
 payment_link text, qr_link text, expires_at timestamptz, is_sandbox boolean not null default false,
 paid_at timestamptz, created_at timestamptz not null default now()
);
create table if not exists public.global_stats (id integer primary key default 1 check(id=1), total_orders bigint not null default 0);
insert into public.global_stats(id,total_orders) values(1,0) on conflict(id) do nothing;

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path=public as $$
begin insert into public.profiles(id,display_name,username) values(new.id,coalesce(new.raw_user_meta_data->>'display_name',split_part(new.email,'@',1)),nullif(new.raw_user_meta_data->>'username','')) on conflict(id) do update set display_name=excluded.display_name, username=coalesce(excluded.username,public.profiles.username); return new; end; $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

alter table public.profiles add column if not exists username text;
create unique index if not exists profiles_username_unique on public.profiles(username) where username is not null;
alter table public.profiles drop constraint if exists profiles_username_format;
alter table public.profiles add constraint profiles_username_format check (username is null or username ~ '^[a-z0-9]{3,20}$');
create or replace function public.username_available(p_username text) returns boolean language sql security definer set search_path=public as $$ select p_username ~ '^[a-z0-9]{3,20}$' and not exists(select 1 from public.profiles where username=p_username); $$;
grant execute on function public.username_available(text) to anon,authenticated;

create or replace function public.reserve_order_balance(p_user_id uuid,p_amount bigint)
returns boolean language plpgsql security definer set search_path=public as $$
begin
 if p_amount is null or p_amount <= 0 then raise exception 'Invalid amount'; end if;
 update public.profiles set balance=balance-p_amount where id=p_user_id and balance>=p_amount;
 return found;
end; $$;

create or replace function public.refund_reserved_balance(p_user_id uuid,p_amount bigint)
returns boolean language plpgsql security definer set search_path=public as $$
begin if p_amount is null or p_amount <= 0 then raise exception 'Invalid amount'; end if; update public.profiles set balance=balance+p_amount where id=p_user_id; return found; end; $$;

create or replace function public.refund_order_balance(p_custom_order_id text)
returns boolean language plpgsql security definer set search_path=public as $$
declare o public.orders; begin
 select * into o from public.orders where custom_order_id=p_custom_order_id for update;
 if not found or o.refunded_at is not null or o.status not in ('allocating','allocation_uncertain') then return false; end if;
 update public.profiles set balance=balance+o.amount where id=o.user_id;
 update public.orders set status='failed',refunded_at=now() where id=o.id;
 return true;
end; $$;

create or replace function public.finalize_nokos_order(p_custom_order_id text,p_provider_order_id text,p_phone text,p_status text)
returns jsonb language plpgsql security definer set search_path=public as $$
declare result public.orders; begin
 update public.orders set provider_order_id=p_provider_order_id,phone=p_phone,status=coalesce(p_status,'pending')
 where custom_order_id=p_custom_order_id and status='allocating' and refunded_at is null returning * into result;
 if not found then raise exception 'Order reservation not found'; end if;
 update public.global_stats set total_orders=total_orders+1 where id=1;
 return to_jsonb(result);
end; $$;

create or replace function public.credit_topup_once(p_merchant_ref_id text,p_invoice text,p_paid_amount bigint,p_paid_at timestamptz)
returns boolean language plpgsql security definer set search_path=public as $$
declare t public.topups; begin
 select * into t from public.topups where merchant_ref_id=p_merchant_ref_id for update;
 if not found then raise exception 'Topup reference not found'; end if;
 if t.status in ('paid','completed') then return false; end if;
 if t.amount<>p_paid_amount then raise exception 'Paid amount mismatch'; end if;
 update public.topups set status='paid',invoice=coalesce(p_invoice,invoice),paid_at=p_paid_at where id=t.id;
 update public.profiles set balance=balance+t.amount,total_deposit=total_deposit+t.amount where id=t.user_id;
 return true;
end; $$;

alter table public.profiles enable row level security;
alter table public.orders enable row level security;
alter table public.topups enable row level security;
alter table public.global_stats enable row level security;
create policy "read own profile" on public.profiles for select to authenticated using(auth.uid()=id);
create policy "update own profile name" on public.profiles for update to authenticated using(auth.uid()=id) with check(auth.uid()=id);
revoke update on public.profiles from anon,authenticated;
grant update(display_name) on public.profiles to authenticated;
create policy "read own orders" on public.orders for select to authenticated using(auth.uid()=user_id);
create policy "read own topups" on public.topups for select to authenticated using(auth.uid()=user_id);
create or replace view public.leaderboard_public as
 select p.display_name,p.total_deposit,coalesce(sum(o.amount),0)::bigint as total_order_value
 from public.profiles p left join public.orders o on o.user_id=p.id
 group by p.id,p.display_name,p.total_deposit order by p.total_deposit desc limit 50;
grant select on public.leaderboard_public to anon,authenticated;
create policy "global stats read" on public.global_stats for select to anon,authenticated using(true);
grant execute on function public.reserve_order_balance(uuid,bigint) to service_role;
grant execute on function public.refund_order_balance(text) to service_role;
grant execute on function public.refund_reserved_balance(uuid,bigint) to service_role;
grant execute on function public.finalize_nokos_order(text,text,text,text) to service_role;
revoke all on function public.credit_topup_once(text,text,bigint,timestamptz) from public, anon, authenticated;



-- General backend hardening + SekaliPay idempotent top-up settlement.
alter table public.topups add column if not exists request_key text;
create unique index if not exists topups_user_request_key_unique
  on public.topups(user_id, request_key) where request_key is not null;

create or replace function public.credit_sekalipay_topup_once(
  p_merchant_ref_id text,
  p_invoice text,
  p_paid_amount bigint,
  p_paid_at timestamptz,
  p_is_sandbox boolean
) returns boolean
language plpgsql security definer set search_path = pg_catalog, public as $$
declare t public.topups;
begin
  if p_merchant_ref_id is null or length(p_merchant_ref_id) > 100
     or p_paid_amount is null or p_paid_amount <= 0 or p_is_sandbox is null then
    raise exception 'Invalid payment data';
  end if;
  select * into t from public.topups where merchant_ref_id = p_merchant_ref_id for update;
  if not found then raise exception 'Top up not found'; end if;
  if t.amount <> p_paid_amount or t.is_sandbox is distinct from p_is_sandbox then
    raise exception 'Payment attributes mismatch';
  end if;
  if t.status in ('paid','completed') then return false; end if;
  update public.topups set status='paid', invoice=coalesce(p_invoice, invoice), paid_at=coalesce(p_paid_at, now()) where id=t.id;
  update public.profiles set balance=balance+t.amount, total_deposit=total_deposit+t.amount where id=t.user_id;
  return true;
end;
$$;
revoke all on function public.credit_sekalipay_topup_once(text,text,bigint,timestamptz,boolean) from public, anon, authenticated;
grant execute on function public.credit_sekalipay_topup_once(text,text,bigint,timestamptz,boolean) to service_role;

-- Restrict direct Data API access to ledger tables; users may read their own rows through RLS only.
revoke all on public.profiles from public, anon, authenticated;
revoke all on public.orders from public, anon, authenticated;
revoke all on public.topups from public, anon, authenticated;
revoke all on public.global_stats from public, anon, authenticated;
grant select on public.profiles, public.orders, public.topups to authenticated;
grant update(display_name) on public.profiles to authenticated;
grant select on public.global_stats to anon, authenticated;
grant select on public.leaderboard_public to anon, authenticated;

-- SECURITY DEFINER functions are server-only unless explicitly documented otherwise.
revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.reserve_order_balance(uuid,bigint) from public, anon, authenticated;
revoke all on function public.refund_reserved_balance(uuid,bigint) from public, anon, authenticated;
revoke all on function public.refund_order_balance(text) from public, anon, authenticated;
revoke all on function public.finalize_nokos_order(text,text,text,text) from public, anon, authenticated;
revoke all on function public.credit_topup_once(text,text,bigint,timestamptz) from public, anon, authenticated;
grant execute on function public.reserve_order_balance(uuid,bigint) to service_role;
grant execute on function public.refund_reserved_balance(uuid,bigint) to service_role;
grant execute on function public.refund_order_balance(text) to service_role;
grant execute on function public.finalize_nokos_order(text,text,text,text) to service_role;

create table if not exists public.api_rate_limits (
  bucket text not null, subject text not null, window_started_at timestamptz not null,
  hits integer not null check (hits >= 0), primary key (bucket, subject)
);
alter table public.api_rate_limits enable row level security;
revoke all on public.api_rate_limits from public, anon, authenticated;
create or replace function public.consume_api_rate_limit(p_bucket text,p_subject text,p_limit integer,p_window_seconds integer)
returns boolean language plpgsql security definer set search_path=pg_catalog,public as $$
declare v_hits integer; v_now timestamptz := clock_timestamp();
begin
  if p_bucket is null or length(p_bucket)<1 or length(p_bucket)>64 or p_subject is null or length(p_subject)<1 or length(p_subject)>128
     or p_limit is null or p_limit<1 or p_limit>1000 or p_window_seconds is null or p_window_seconds<1 or p_window_seconds>3600 then
    raise exception 'Invalid rate limit parameters';
  end if;
  insert into public.api_rate_limits(bucket,subject,window_started_at,hits) values(p_bucket,p_subject,v_now,1)
  on conflict(bucket,subject) do update set
    window_started_at=case when public.api_rate_limits.window_started_at <= v_now-make_interval(secs=>p_window_seconds) then v_now else public.api_rate_limits.window_started_at end,
    hits=case when public.api_rate_limits.window_started_at <= v_now-make_interval(secs=>p_window_seconds) then 1 else public.api_rate_limits.hits+1 end
  returning hits into v_hits;
  return v_hits<=p_limit;
end; $$;
revoke all on function public.consume_api_rate_limit(text,text,integer,integer) from public, anon, authenticated;
grant execute on function public.consume_api_rate_limit(text,text,integer,integer) to service_role;
