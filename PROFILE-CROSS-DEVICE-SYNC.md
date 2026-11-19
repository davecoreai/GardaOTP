# Profile cross-device sync fix

The previous profile RLS policy allowed a user to read only their own profile row.
That prevented other signed-in users from reading the updated public profile fields.
This patch adds a safe authenticated read policy and column-level SELECT grants for
only `id`, `display_name`, `username`, `avatar_url`, `banner_url`, `admin_role`,
and `is_verified`. It does not expose `balance`, deposits, private flags, or other
profile columns. Profile writes remain restricted to the user's own row and only
the four presentation columns.

The browser also subscribes to UPDATE events for the currently signed-in profile,
so the same account on another device updates without requiring a manual refresh.

## Apply
1. Open Supabase Dashboard -> SQL Editor.
2. Run `sql/profile-cross-device-sync.sql`.
3. Ensure `profiles` is included in the `supabase_realtime` publication (the SQL
   attempts to add it automatically).
4. Deploy this project. Sign out and back in on each device once to refresh auth
   and Realtime permissions.

If your Supabase project uses additional custom policies, review them before
running this migration. The policy is intentionally public only to authenticated
users, not anonymous visitors.
