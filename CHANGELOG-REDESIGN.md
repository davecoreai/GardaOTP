# SoraOTP UI and realtime update

## UI changes
- Replaced dashboard, service, navigation, and action glyphs with Font Awesome icons.
- Device locale selects Indonesian for `id-*` devices and English for other locales.
- Dashboard greeting uses the signed-in user's display name (`Selamat datang, {name}` on Indonesian devices; `Welcome, {name}` otherwise).
- Removed the requested promotional/account eyebrow copy from the dashboard.
- Changed the country selector to a downward-opening button menu. It contains no text input and does not open the mobile keyboard.
- Bottom navigation is a rounded glass pill with blur and a rounded active indicator.
- Top-up banner contains only the image and uses a 16:9 display ratio.

## Leaderboard
- `sql/leaderboard-realtime.sql` updates the leaderboard view and broadcasts a generic refresh event when profiles, orders, or top-ups change.
- The frontend listens on the authenticated private topic `leaderboard:global` and refreshes the dashboard on events, with a 30-second fallback refresh.
- Run the SQL migration in Supabase SQL Editor. Realtime updates will not become active from a frontend deployment alone.

## NokosPusat
- Existing server-side integration uses the official `https://nokospusat.com` API for services, countries, offers, wallet, and real order creation.
- Set `NOKOS_API_KEY` in Vercel Environment Variables. Keep the key out of frontend code and public repositories.
- Real order creation debits NokosPusat provider balance. No real order was placed during this update.

## Validation
- `npm run check` passed.
- `npm test` passed (2/2 tests).
- HTML parser check passed.
