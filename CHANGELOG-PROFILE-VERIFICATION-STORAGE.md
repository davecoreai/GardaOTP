# Profile verification and Storage update

- Badge checkmark now renders immediately after usernames (profile, editor preview, admin user list, and public chat).
- Admin user list opens a dedicated Verifikasi screen for the selected account.
- Verification options: blue verified, tricolor admin, black moderator, or clear badge.
- Desktop profile/banner and editor layouts resize fluidly; desktop form uses a two-column layout.
- Storage uploads use a unique path and `upsert: false`; database errors explain likely missing privileges.
- Added `sql/profile-verification-storage-fix.sql` as the final migration after DOKU payment migration.
