-- Enable private, low-latency leaderboard refresh notifications.
-- Run this once in Supabase SQL Editor after schema.sql has been applied.
-- Only a generic refresh event is broadcast; profile/order/payment rows are never sent.

create or replace view public.leaderboard_public as
select
  p.display_name,
  p.total_deposit,
  coalesce(
    sum(o.amount) filter (
      where o.refunded_at is null
        and o.status not in ('failed', 'cancelled')
    ),
    0
  )::bigint as total_order_value
from public.profiles p
left join public.orders o on o.user_id = p.id
where p.total_deposit > 0
group by p.id, p.display_name, p.total_deposit
order by p.total_deposit desc, p.display_name asc
limit 50;

grant select on public.leaderboard_public to anon, authenticated;

-- Allow signed-in users to subscribe to this one non-sensitive refresh topic.
drop policy if exists "authenticated receive leaderboard refresh" on realtime.messages;
create policy "authenticated receive leaderboard refresh"
on realtime.messages
for select
to authenticated
using (realtime.topic() = 'leaderboard:global');

create or replace function public.broadcast_leaderboard_refresh()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform realtime.send(
    payload => jsonb_build_object('refresh', true),
    event => 'leaderboard-update',
    topic => 'leaderboard:global',
    private => true
  );
  return null;
end;
$$;

revoke all on function public.broadcast_leaderboard_refresh() from public, anon, authenticated;

drop trigger if exists leaderboard_refresh_profiles on public.profiles;
create trigger leaderboard_refresh_profiles
after insert or update or delete on public.profiles
for each row execute function public.broadcast_leaderboard_refresh();

drop trigger if exists leaderboard_refresh_orders on public.orders;
create trigger leaderboard_refresh_orders
after insert or update or delete on public.orders
for each row execute function public.broadcast_leaderboard_refresh();

drop trigger if exists leaderboard_refresh_topups on public.topups;
create trigger leaderboard_refresh_topups
after insert or update or delete on public.topups
for each row execute function public.broadcast_leaderboard_refresh();
