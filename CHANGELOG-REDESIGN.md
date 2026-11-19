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

## Catalogue and provider selection refinement
- Service names remove a trailing `Indonesia` suffix for display only; provider IDs and slugs remain unchanged.
- Replaced the full-width service catalogue with a compact two-column scroll area; service cards show only the app icon and name, not stock or indicative price.
- Country choices display country flags (ISO code, provider metadata, or country-name fallback).
- Switching providers keeps the selected service and rematches the selected country by country name because NokosPusat country codes differ across providers; the new server offer is then fetched.


## OTP experience and warranty update
- Added a dedicated OTP detail page showing the order ID, allocated number, `Menunggu OTP` state, and the OTP code when available. The Copy button is hidden until a code has been received.
- Successful number orders now open the OTP page immediately; order history can reopen an existing order.
- QRIS return flow checks the SekaliPay webhook-settled top-up status; once the wallet balance is credited it directs the user to the service catalogue to place an order. QRIS in this project is a wallet top-up, not direct per-number checkout.
- Added 5-second initial status polling, slower polling after the first two minutes, and provider-directed wait hints.
- Added a cancellation route that sends NokosPusat DELETE at most once and never repeats it automatically while the provider is still verifying cancellation.
- Added `api/nokos-webhook.js` for signed `order.status_changed` and `order.otp_received` events, with event deduplication and timestamp ordering. Configure the endpoint in NokosPusat and set `NOKOS_WEBHOOK_SECRET` in Vercel.
- The 100% warranty credits the full order value back to the SoraOTP internal balance only after NokosPusat confirms a terminal `cancelled`/`expired` status with no OTP or receipt evidence. The SQL refund function locks the row and blocks duplicate refunds.
- Added `sql/otp-guarantee.sql` for existing Supabase installations. Run it before deploying this version.
- Popular services are ranked from recorded order counts. The first two rows (4 cards) are visible; the remaining catalogue is inside the scroll area.

## Validation
- `npm run check` passed.
- `npm test` passed (6/6 tests).
- No live NokosPusat order, cancellation, or SekaliPay payment was executed during this source update.

- Refreshing the app with an active `sessionStorage` order reopens its OTP details automatically.
- The signed NokosPusat webhook now re-reads the latest provider order before applying changes, protecting against out-of-order or legacy event payloads.
- A provider-confirmed cooldown/eligibility rejection releases the cancellation lock; ambiguous cancellation outcomes remain locked against duplicate DELETE calls.
- OTP UI now distinguishes a blank code with recorded receipt evidence from a genuinely unreceived OTP; receipt evidence blocks the 100% refund guarantee.

## 2026-11-18 — Chat Public E2EE
- Added browser-side AES-256-GCM encryption for newly sent public chat message bodies.
- Added persistent per-device ECDH P-256 identity keys in IndexedDB and HKDF-derived envelope keys.
- Added global room-key state, per-device encrypted key envelopes, and Realtime key-request delivery.
- Added database validation that rejects new plaintext message inserts.
- Labeled messages from before E2EE rollout as legacy plaintext; metadata remains visible by design.
