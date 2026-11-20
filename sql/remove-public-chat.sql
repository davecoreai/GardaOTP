-- Menghapus objek database lama untuk fitur chat publik Garda OTP.
-- Backup database dahulu jika riwayat percakapan perlu disimpan.
-- Jalankan satu kali melalui Supabase SQL Editor.

begin;

-- Hapus tabel beserta trigger, RLS policies, dan foreign-key dependency-nya.
drop table if exists public.public_chat_key_envelopes cascade;
drop table if exists public.public_chat_devices cascade;
drop table if exists public.public_chat_room_state cascade;
drop table if exists public.public_chat_messages cascade;

-- Fungsi trigger tidak ikut terhapus otomatis ketika tabel dihapus.
drop function if exists public.prepare_public_chat_message() cascade;

-- Hapus policy Realtime khusus channel chat, tanpa menyentuh policy Realtime lain.
drop policy if exists "Authenticated users can receive public chat presence" on realtime.messages;
drop policy if exists "Authenticated users can publish public chat presence" on realtime.messages;
drop policy if exists "Authenticated users can receive public chat key requests" on realtime.messages;
drop policy if exists "Authenticated users can publish public chat key requests" on realtime.messages;

-- Lepaskan tabel lama dari publication bila masih tercatat.
do $$
begin
  if exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='public_chat_messages') then
    alter publication supabase_realtime drop table public.public_chat_messages;
  end if;
exception when undefined_object then
  raise notice 'Publication supabase_realtime tidak ditemukan; tidak ada yang perlu dilepas.';
end;
$$;

commit;
