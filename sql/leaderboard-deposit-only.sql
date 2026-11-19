-- Garda OTP: tampilkan hanya pengguna yang sudah berhasil deposit.
-- Aman dijalankan ulang (CREATE OR REPLACE VIEW).
create or replace view public.leaderboard_public as
select
  p.display_name,
  p.total_deposit,
  coalesce(
    sum(o.amount) filter (
      where o.refunded_at is null
        and o.status not in ('failed', 'cancelled', 'canceled')
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
