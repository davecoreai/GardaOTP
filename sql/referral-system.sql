-- Garda OTP referral rewards: run once in the Supabase SQL Editor.
-- Each referred user's verified top-up creates one 5% reward for the referrer.

alter table public.profiles
  add column if not exists referral_code text,
  add column if not exists referred_by uuid references public.profiles(id) on delete set null,
  add column if not exists referral_bonus_total bigint not null default 0 check(referral_bonus_total>=0);

create unique index if not exists profiles_referral_code_unique
  on public.profiles(referral_code) where referral_code is not null;
create index if not exists profiles_referred_by_idx
  on public.profiles(referred_by) where referred_by is not null;

create or replace function public.generate_profile_referral_code()
returns trigger
language plpgsql
security definer
set search_path=pg_catalog,public
as $$
declare candidate text;
begin
  if new.referral_code is null or btrim(new.referral_code) = '' then
    loop
      candidate := upper(substr(encode(gen_random_bytes(6),'hex'),1,8));
      exit when not exists(select 1 from public.profiles p where p.referral_code=candidate);
    end loop;
    new.referral_code := candidate;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_generate_referral_code on public.profiles;
create trigger profiles_generate_referral_code
before insert on public.profiles
for each row execute function public.generate_profile_referral_code();

-- Backfill referral codes for accounts created before this migration.
do $$
declare row_profile record; candidate text;
begin
  for row_profile in select id from public.profiles where referral_code is null or btrim(referral_code)='' loop
    loop
      candidate := upper(substr(encode(gen_random_bytes(6),'hex'),1,8));
      exit when not exists(select 1 from public.profiles p where p.referral_code=candidate);
    end loop;
    update public.profiles set referral_code=candidate where id=row_profile.id;
  end loop;
end;
$$;

create table if not exists public.referral_rewards (
  id uuid primary key default gen_random_uuid(),
  referrer_id uuid not null references public.profiles(id) on delete cascade,
  referred_user_id uuid not null references public.profiles(id) on delete cascade,
  topup_id uuid not null unique references public.topups(id) on delete cascade,
  topup_amount bigint not null check(topup_amount>0),
  bonus_amount bigint not null check(bonus_amount>0),
  created_at timestamptz not null default now(),
  constraint referral_rewards_no_self check(referrer_id<>referred_user_id)
);
create index if not exists referral_rewards_referrer_created_idx
  on public.referral_rewards(referrer_id,created_at desc);

update public.profiles p
set referral_bonus_total=coalesce((select sum(r.bonus_amount) from public.referral_rewards r where r.referrer_id=p.id),0)
where p.referral_bonus_total=0;

alter table public.referral_rewards enable row level security;
revoke all on public.referral_rewards from public,anon,authenticated;
grant all on public.referral_rewards to service_role;

-- Replace settlement with a version that credits the referral bonus exactly once.
create or replace function public.credit_sekalipay_topup_once(
  p_merchant_ref_id text,
  p_invoice text,
  p_paid_amount bigint,
  p_paid_at timestamptz,
  p_is_sandbox boolean
) returns boolean
language plpgsql
security definer
set search_path=pg_catalog,public
as $$
declare
  t public.topups;
  referrer uuid;
  bonus bigint;
begin
  if p_merchant_ref_id is null or length(p_merchant_ref_id)>100
     or p_paid_amount is null or p_paid_amount<=0 or p_is_sandbox is null then
    raise exception 'Invalid payment data';
  end if;

  select * into t from public.topups where merchant_ref_id=p_merchant_ref_id for update;
  if not found then raise exception 'Top up not found'; end if;
  if t.amount<>p_paid_amount or t.is_sandbox is distinct from p_is_sandbox then
    raise exception 'Payment attributes mismatch';
  end if;
  if t.status in ('paid','completed') then return false; end if;

  update public.topups
    set status='paid',invoice=coalesce(p_invoice,invoice),paid_at=coalesce(p_paid_at,now())
    where id=t.id;
  update public.profiles
    set balance=balance+t.amount,total_deposit=total_deposit+t.amount
    where id=t.user_id;

  select referred_by into referrer from public.profiles where id=t.user_id;
  if referrer is not null then
    bonus := floor(t.amount::numeric*0.05)::bigint;
    if bonus>0 then
      insert into public.referral_rewards(referrer_id,referred_user_id,topup_id,topup_amount,bonus_amount)
      values(referrer,t.user_id,t.id,t.amount,bonus)
      on conflict(topup_id) do nothing;
      if found then
        update public.profiles set balance=balance+bonus,referral_bonus_total=referral_bonus_total+bonus where id=referrer;
      end if;
    end if;
  end if;
  return true;
end;
$$;

revoke all on function public.credit_sekalipay_topup_once(text,text,bigint,timestamptz,boolean) from public,anon,authenticated;
grant execute on function public.credit_sekalipay_topup_once(text,text,bigint,timestamptz,boolean) to service_role;
revoke all on function public.generate_profile_referral_code() from public,anon,authenticated;
