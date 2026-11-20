# Profile / banner upload troubleshooting

## Findings from the project source

The earlier `sql/doku-payment-migration.sql` migration revokes all direct `UPDATE` privileges on `public.profiles`, then grants only `UPDATE(display_name)`. The profile editor also writes `username`, `avatar_url`, and `banner_url`. Therefore, even when the image upload itself succeeds, the subsequent profile-row update can fail with a permission error and the uploaded object may be left unreferenced in Storage.

The old browser uploader used `upsert: true` with a timestamp-only object key. Storage upsert may need object update permission in addition to insert permission. The updated uploader creates a UUID path under `<auth-user-id>/<avatar-or-banner>/` and uses `upsert: false`, so a new upload only needs insert permission.

A missing `profile-assets` bucket or missing/mismatched Storage RLS policy can independently cause a bucket-not-found or row-level-security error. The UI now gives a clearer message for those responses.

## Required migration

Run `sql/profile-verification-storage-fix.sql` in Supabase SQL Editor **after all other migrations**, especially `sql/doku-payment-migration.sql`. It restores only the four intended profile presentation column grants, ensures a self-only profile update policy, backfills missing profile rows, creates/updates the public `profile-assets` bucket, and installs per-user folder policies.

Do not grant users update access to `balance` or other privileged/ledger fields.

## Verify in Supabase

1. Storage → Buckets: confirm a bucket named `profile-assets` exists and is public.
2. Storage → Policies: confirm authenticated users can insert only under their own UUID folder, and objects are publicly readable.
3. Table Editor → `profiles`: confirm `avatar_url` and `banner_url` store a path such as `<uuid>/banner/<uuid>.jpg` after upload.
4. Try saving one small JPG avatar and one banner while signed in. If it still fails, inspect the browser console's `Profile update failed` message; this project cannot inspect the live Supabase project's logs from this local ZIP.
