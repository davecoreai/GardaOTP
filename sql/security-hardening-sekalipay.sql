-- Apply this migration to an existing Garda OTP Supabase project after taking a database backup.


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
