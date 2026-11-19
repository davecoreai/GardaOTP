-- Garda OTP: remove legacy Admin Dashboard schema.
-- BACK UP YOUR DATABASE FIRST. This permanently deletes admin-only records.
begin;

drop function if exists public.admin_paid_topup_stats();
drop function if exists public.admin_adjust_balance(uuid, uuid, bigint, text);

drop table if exists public.admin_audit_log cascade;
drop table if exists public.admin_balance_adjustments cascade;
drop table if exists public.admin_provider_settings cascade;
drop table if exists public.admin_service_settings cascade;
drop table if exists public.admin_website_settings cascade;

alter table if exists public.profiles
  drop column if exists admin_role,
  drop column if exists is_verified,
  drop column if exists is_blocked,
  drop column if exists blocked_reason,
  drop column if exists blocked_at;


commit;
