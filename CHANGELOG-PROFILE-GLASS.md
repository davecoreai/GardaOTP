# SoraOTP — Profile & UI Fixes

## UI fixes
- Styled the landing-page “Lihat cara penggunaan” link as a glass secondary action.
- Restored a consistent search-field layout and prevented global input styles from covering the catalog search component.
- Raised the country selector card and popup layer so the country menu opens above adjacent cards.
- Forced the “Saldo setelah beli” amount to use a visible, high-contrast text style.
- Added rounded corners and a subtle glass edge to the SoraOTP logo mark.

## Authentication and session behavior
- The Google sign-in button is re-enabled when the browser restores the page (`pageshow`) or returns to the foreground.
- The button resets when opening the auth screen or returning to the landing screen, and remains protected against duplicate clicks while OAuth is starting.
- Existing dashboard-page persistence remains active; the new Edit Profile screen is also included in the saved dashboard state.

## Profile
- Redesigned the profile screen with a cover banner, overlapping round avatar, display name, `@username`, account status, and an Edit Profile action.
- Added an Edit Profile screen for the display name, profile image, and cover banner.
- Username is shown as read-only; only the display name can be changed.
- Profile images upload to the Supabase Storage bucket `profile-assets` and their public URLs are stored in `profiles.avatar_url` and `profiles.banner_url`.

## Required Supabase migration
Run `sql/profile-assets-storage.sql` once in Supabase Dashboard → SQL Editor before using profile photo/banner uploads. This creates the profile URL columns, bucket, and per-user storage policies. The bucket is public for rendering profile images; write access is scoped to each authenticated user's UUID folder.

## Verification
- `npm run check` — passed.
- `npm test` — 6 tests passed.
- CSS parsing — no top-level syntax errors.
- HTML ID check — no duplicate IDs.
