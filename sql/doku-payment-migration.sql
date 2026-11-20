-- DOKU payment migration for an existing Garda OTP database.
-- Take a Supabase backup before running this migration. Safe to re-run.
alter table public.topups add column if not exists request_key text;
alter table public.topups add column if not exists is_sandbox boolean not null default true;
create unique index if not exists topups_user_request_key_unique
  on public.topups(user_id, request_key) where request_key is not null;

drop function if exists public.credit_sekalipay_topup_once(text,text,bigint,timestamptz,boolean);

create or replace function public.credit_doku_topup_once(
  p_merchant_ref_id text, p_invoice text, p_paid_amount bigint,
  p_paid_at timestamptz, p_is_sandbox boolean
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
revoke all on function public.credit_doku_topup_once(text,text,bigint,timestamptz,boolean) from public, anon, authenticated;
grant execute on function public.credit_doku_topup_once(text,text,bigint,timestamptz,boolean) to service_role;
