-- Garda OTP Chat Public: global realtime room with client-side end-to-end encryption.
-- Run this complete file in Supabase SQL Editor. Re-running is safe/idempotent.
-- Message bodies are encrypted in the browser with Web Crypto AES-256-GCM.
-- Supabase stores ciphertext, public device keys and ECDH-wrapped room-key envelopes only.

create table if not exists public.public_chat_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  display_name text not null default 'Pengguna',
  username text,
  avatar_url text,
  body text not null,
  reply_to uuid references public.public_chat_messages(id) on delete set null,
  reply_to_name text,
  reply_to_body text,
  created_at timestamptz not null default now()
);

-- Encrypted payloads can be larger than their plaintext due to AES-GCM and Base64.
alter table public.public_chat_messages drop constraint if exists public_chat_messages_body_check;
alter table public.public_chat_messages add constraint public_chat_messages_body_check
  check (char_length(body) between 1 and 8000);

create index if not exists public_chat_messages_created_idx
  on public.public_chat_messages(created_at desc);
create index if not exists public_chat_messages_user_created_idx
  on public.public_chat_messages(user_id, created_at desc);

alter table public.public_chat_messages enable row level security;
revoke all on public.public_chat_messages from public, anon;
grant select, insert on public.public_chat_messages to authenticated;

drop policy if exists "Authenticated users can read public chat" on public.public_chat_messages;
create policy "Authenticated users can read public chat"
  on public.public_chat_messages for select to authenticated
  using (true);

drop policy if exists "Users can send as themselves in public chat" on public.public_chat_messages;
create policy "Users can send as themselves in public chat"
  on public.public_chat_messages for insert to authenticated
  with check (auth.uid() = user_id);

-- Public keys are intentionally readable by authenticated room participants.
-- The matching ECDH private key never leaves the user's browser IndexedDB.
create table if not exists public.public_chat_devices (
  device_id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  public_key jsonb not null,
  device_label text not null default 'Garda OTP browser',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists public_chat_devices_user_idx
  on public.public_chat_devices(user_id);
alter table public.public_chat_devices enable row level security;
revoke all on public.public_chat_devices from public, anon;
grant select, insert, update on public.public_chat_devices to authenticated;
drop policy if exists "Authenticated users can discover chat public keys" on public.public_chat_devices;
create policy "Authenticated users can discover chat public keys"
  on public.public_chat_devices for select to authenticated using (true);
drop policy if exists "Users can register their own chat devices" on public.public_chat_devices;
create policy "Users can register their own chat devices"
  on public.public_chat_devices for insert to authenticated
  with check (auth.uid() = user_id);
drop policy if exists "Users can update their own chat devices" on public.public_chat_devices;
create policy "Users can update their own chat devices"
  on public.public_chat_devices for update to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Singleton room metadata contains no secret: only the key version and first device ID.
create table if not exists public.public_chat_room_state (
  room_id text primary key check (room_id = 'global'),
  key_version integer not null default 1 check (key_version > 0),
  owner_device_id uuid not null references public.public_chat_devices(device_id) on delete restrict,
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.public_chat_room_state enable row level security;
revoke all on public.public_chat_room_state from public, anon;
grant select, insert on public.public_chat_room_state to authenticated;
drop policy if exists "Authenticated users can read public chat room state" on public.public_chat_room_state;
create policy "Authenticated users can read public chat room state"
  on public.public_chat_room_state for select to authenticated using (true);
drop policy if exists "Users can initialize public chat room" on public.public_chat_room_state;
create policy "Users can initialize public chat room"
  on public.public_chat_room_state for insert to authenticated
  with check (
    auth.uid() = owner_user_id
    and exists (
      select 1 from public.public_chat_devices d
      where d.device_id = owner_device_id and d.user_id = auth.uid()
    )
  );

-- A room key is wrapped separately for each recipient device using ECDH P-256 + AES-GCM.
-- RLS allows recipients to read only envelopes addressed to their own registered devices.
create table if not exists public.public_chat_key_envelopes (
  id uuid primary key default gen_random_uuid(),
  room_id text not null references public.public_chat_room_state(room_id) on delete cascade,
  key_version integer not null check (key_version > 0),
  sender_device_id uuid not null references public.public_chat_devices(device_id) on delete cascade,
  sender_user_id uuid not null references auth.users(id) on delete cascade,
  recipient_device_id uuid not null references public.public_chat_devices(device_id) on delete cascade,
  iv text not null,
  wrapped_key text not null,
  created_at timestamptz not null default now(),
  unique(room_id, recipient_device_id, sender_device_id, key_version)
);
create index if not exists public_chat_key_envelopes_recipient_idx
  on public.public_chat_key_envelopes(room_id, recipient_device_id, key_version, created_at desc);
alter table public.public_chat_key_envelopes enable row level security;
revoke all on public.public_chat_key_envelopes from public, anon;
grant select, insert on public.public_chat_key_envelopes to authenticated;
drop policy if exists "Users can read chat keys wrapped for their devices" on public.public_chat_key_envelopes;
create policy "Users can read chat keys wrapped for their devices"
  on public.public_chat_key_envelopes for select to authenticated
  using (
    exists (
      select 1 from public.public_chat_devices d
      where d.device_id = recipient_device_id and d.user_id = auth.uid()
    )
  );
drop policy if exists "Users can share chat keys from their own devices" on public.public_chat_key_envelopes;
create policy "Users can share chat keys from their own devices"
  on public.public_chat_key_envelopes for insert to authenticated
  with check (
    auth.uid() = sender_user_id
    and exists (
      select 1 from public.public_chat_devices d
      where d.device_id = sender_device_id and d.user_id = auth.uid()
    )
    and exists (
      select 1 from public.public_chat_devices d
      where d.device_id = recipient_device_id
    )
  );

-- Server trigger sets identity metadata, rejects plaintext new messages, and rate-limits sends.
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

  new.id := gen_random_uuid();
  new.user_id := auth.uid();
  new.body := btrim(coalesce(new.body, ''));
  if char_length(new.body) < 1 or char_length(new.body) > 8000 then
    raise exception 'Payload pesan terenkripsi tidak valid.' using errcode = '22023';
  end if;
  if left(new.body, 6) <> 'E2EE1.' then
    raise exception 'Pesan wajib dienkripsi end-to-end sebelum dikirim.' using errcode = '22023';
  end if;

  select p.display_name, p.username, p.avatar_url
    into v_profile
    from public.profiles p
    where p.id = new.user_id;

  if not found then
    insert into public.profiles(id, display_name, username)
    select u.id,
           coalesce(nullif(u.raw_user_meta_data->>'display_name',''), split_part(u.email,'@',1), 'Pengguna'),
           case when u.raw_user_meta_data->>'username' ~ '^[a-z0-9]{3,20}$' then u.raw_user_meta_data->>'username' else null end
      from auth.users u where u.id = new.user_id
    on conflict (id) do nothing;
    select p.display_name, p.username, p.avatar_url
      into v_profile from public.profiles p where p.id = new.user_id;
  end if;

  new.display_name := coalesce(v_profile.display_name, 'Pengguna');
  new.username := v_profile.username;
  new.avatar_url := v_profile.avatar_url;

  if new.reply_to is not null then
    select m.display_name into v_reply
      from public.public_chat_messages m where m.id = new.reply_to;
    if not found then
      raise exception 'Pesan yang ingin dibalas sudah tidak tersedia.' using errcode = '23503';
    end if;
    new.reply_to_name := coalesce(v_reply.display_name, 'Pengguna');
    new.reply_to_body := '[Pesan terenkripsi]';
  else
    new.reply_to_name := null;
    new.reply_to_body := null;
  end if;

  perform pg_advisory_xact_lock(hashtextextended(new.user_id::text, 0));
  select max(m.created_at) into v_last
    from public.public_chat_messages m where m.user_id = new.user_id;
  if v_last is not null and v_last > clock_timestamp() - interval '1.2 seconds' then
    raise exception 'Tunggu sebentar sebelum mengirim pesan berikutnya.' using errcode = 'P0001';
  end if;

  new.created_at := now();
  return new;
end;
$$;
revoke all on function public.prepare_public_chat_message() from public, anon, authenticated;
drop trigger if exists prepare_public_chat_message on public.public_chat_messages;
create trigger prepare_public_chat_message
  before insert on public.public_chat_messages
  for each row execute function public.prepare_public_chat_message();

-- Private Realtime channel: presence + broadcast key requests, authenticated users only.
drop policy if exists "Authenticated users can receive public chat presence" on realtime.messages;
create policy "Authenticated users can receive public chat presence"
  on realtime.messages for select to authenticated
  using (realtime.topic() = 'public-chat:global' and realtime.messages.extension = 'presence');
drop policy if exists "Authenticated users can publish public chat presence" on realtime.messages;
create policy "Authenticated users can publish public chat presence"
  on realtime.messages for insert to authenticated
  with check (realtime.topic() = 'public-chat:global' and realtime.messages.extension = 'presence');
drop policy if exists "Authenticated users can receive public chat key requests" on realtime.messages;
create policy "Authenticated users can receive public chat key requests"
  on realtime.messages for select to authenticated
  using (realtime.topic() = 'public-chat:global' and realtime.messages.extension = 'broadcast');
drop policy if exists "Authenticated users can publish public chat key requests" on realtime.messages;
create policy "Authenticated users can publish public chat key requests"
  on realtime.messages for insert to authenticated
  with check (realtime.topic() = 'public-chat:global' and realtime.messages.extension = 'broadcast');

-- Publish durable chat messages to Supabase Realtime.
do $$
begin
  alter publication supabase_realtime add table public.public_chat_messages;
exception
  when duplicate_object then null;
  when undefined_object then
    raise notice 'Publication supabase_realtime is unavailable; enable Realtime for public_chat_messages in Supabase Dashboard.';
end;
$$;

-- Existing rows from before E2EE remain readable as legacy plaintext. They cannot be
-- retroactively encrypted without client-side keys; all NEW inserts are forced to E2EE1.
