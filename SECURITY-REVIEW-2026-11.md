# Garda OTP security and regression review — 2026-11-20

## Scope

Reviewed the supplied project archive's frontend, Vercel API routes, shared server helpers, SQL schema/migrations, payment flow, static assets, and automated tests. This is a source-level review plus local Node test execution, not a live penetration test or validation of the deployed Supabase/DOKU accounts.

## Changes made

- Replaced the previous payment gateway adapter and webhook with DOKU Checkout and `/api/doku-webhook`.
- Added DOKU Non-SNAP request signing and notification signature verification using SHA-256 body digest and HMAC-SHA256 Base64.
- Added a 24-hour notification timestamp acceptance window to support DOKU's documented delayed retry schedule; duplicate credit is prevented by a row-locked SQL settlement RPC.
- Reused the top-up idempotency UUID as DOKU `Request-Id`, so retried checkout requests keep the same DOKU request identity.
- Validated merchant ID, request timestamp, request signature, invoice reference, amount, payment mode, and HTTPS DOKU checkout URL.
- Kept DOKU credentials server-side. The browser receives only the hosted checkout URL.
- Replaced the old gateway-specific webhook, test, and SQL migration with DOKU equivalents; removed clearly unreferenced legacy image assets.
- Balance visibility now keeps `Rp` visible, masks the amount as `•••`, lowers the eye toggle slightly, and limits the eye sweep to the numeric amount so it stops immediately after the `Rp` prefix.

## Automated verification

- `npm run check`: passed.
- `npm test`: passed, 18 tests, 0 failures.
- Added tests for DOKU digest/signature validation, tampered bodies, wrong merchant IDs, stale timestamps, and the balance masking behavior.
- `unzip -t` should be run on the final archive after packaging.

## Limitations / follow-up

- No DOKU merchant credentials were supplied. Checkout creation and real DOKU sandbox notifications were not executed.
- SQL was reviewed statically; it was not executed against the user's live Supabase project.
- The archive has no `package-lock.json`; a reproducible dependency install and `npm audit` could not be completed.
- Browser automation is not claimed as passed. The prior attempt was blocked by the environment's localhost navigation restriction.
- The archive does not include Git history, so files associated with features removed only in the remote GitHub repository cannot be identified with certainty. Cleanup was limited to gateway-specific remnants and assets not referenced by the supplied source.

## Required setup before deployment

1. Back up Supabase. For an existing database, run `sql/doku-payment-migration.sql`, then ensure the required OTP and leaderboard migrations are applied. For a fresh database, run `sql/schema.sql` and `sql/leaderboard-realtime.sql`.
2. Configure server-side Vercel variables: `DOKU_CLIENT_ID`, `DOKU_SECRET_KEY`, `DOKU_ENV=sandbox`, and `APP_URL`.
3. Register `https://gardaotp.my.id/api/doku-webhook` as the DOKU Notification URL and enable the intended payment method(s) in DOKU Back Office.
4. Test successful checkout, SUCCESS notification, invalid signature, stale timestamp, wrong amount, duplicate notification, and unknown invoice in DOKU sandbox.
5. Switch to `DOKU_ENV=production` and production credentials only after sandbox verification.

## Residual risk

This review does not establish that the deployed application is vulnerability-free or production-certified. Compare the live database schema/RLS, Vercel environment variables, DOKU merchant configuration, and browser flows before release. Existing pending invoices created by the retired gateway should be reconciled separately; the new DOKU webhook does not settle them.
