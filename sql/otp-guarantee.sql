-- Garda OTP OTP status + 100% internal-balance refund guarantee migration.
-- Run this once in Supabase SQL Editor before deploying the updated frontend/backend.

alter table public.orders add column if not exists has_receipt boolean not null default false;
alter table public.orders add column if not exists can_cancel boolean not null default false;
alter table public.orders add column if not exists expires_at timestamptz;
alter table public.orders add column if not exists refund_eligible_at timestamptz;
alter table public.orders add column if not exists next_check_after_seconds integer not null default 5;
alter table public.orders add column if not exists cancel_requested_at timestamptz;
alter table public.orders add column if not exists provider_updated_at timestamptz;

create table if not exists public.nokos_webhook_events (
 event_id text primary key, event_type text not null, provider_order_id text not null,
 received_at timestamptz not null default now(), processed_at timestamptz
);
alter table public.nokos_webhook_events enable row level security;
revoke all on public.nokos_webhook_events from public,anon,authenticated;
grant all on public.nokos_webhook_events to service_role;

create or replace function public.refund_order_balance(p_custom_order_id text)
returns boolean language plpgsql security definer set search_path=pg_catalog,public as $$
declare o public.orders;
begin
 select * into o from public.orders where custom_order_id=p_custom_order_id for update;
 if not found or o.refunded_at is not null then return false; end if;
 -- A received OTP, saved receipt, or completed activation permanently blocks this refund.
 if o.otp is not null and length(trim(o.otp))>0 then return false; end if;
 if o.has_receipt is true then return false; end if;
 -- Refund only failed allocation or provider-confirmed cancelled/expired orders.
 if o.status not in ('allocating','allocation_uncertain','failed','cancelled','canceled','expired') then return false; end if;
 update public.profiles set balance=balance+o.amount where id=o.user_id;
 update public.orders set refunded_at=now() where id=o.id;
 return true;
end; $$;
revoke all on function public.refund_order_balance(text) from public,anon,authenticated;
grant execute on function public.refund_order_balance(text) to service_role;

create or replace function public.get_popular_services(p_limit integer default 500)
returns table(service_id text, service_name text, order_count bigint)
language sql security definer set search_path=pg_catalog,public as $$
 select o.service_id,o.service_name,count(*)::bigint as order_count
 from public.orders o
 where o.refunded_at is null and o.status in ('pending','awaiting_otp','completed','success')
 group by o.service_id,o.service_name
 order by count(*) desc, lower(o.service_name) asc
 limit greatest(1,least(coalesce(p_limit,500),500));
$$;
revoke all on function public.get_popular_services(integer) from public,anon,authenticated;
grant execute on function public.get_popular_services(integer) to service_role;
