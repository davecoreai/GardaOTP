# Garda OTP Security Review & Hardening Notes

## Scope
Source-level review of Vercel API routes, shared server helpers, Supabase SQL, payment UI, environment template, and documentation. No production Supabase account, merchant account, credentials, or deployment was accessed.

## Changes in this package
- Supabase access tokens are validated server-side with `auth.getUser`.
- Provider/payment/order/status routes use server-side authentication and atomic per-user rate limits where configured.
- NokosPusat order pricing is re-fetched and validated server-side before balance debit.
- Privileged database RPCs have explicit grants; direct client ledger mutation is revoked and RLS remains enabled.
- Top-up intent is persisted before the provider request and keyed by a per-user UUID idempotency key.
- DOKU webhook accepts raw JSON only, verifies the Non-SNAP HMAC-SHA256 Base64 signature over the documented header components and raw-body digest, enforces a 24-hour timestamp window to accommodate DOKU retry delivery, validates invoice and amount against the stored top-up, and credits through a row-locked atomic SQL function. Repeated SUCCESS callbacks do not credit the same top-up twice.
- Webhook request body size is limited and internal processing errors are not returned to the caller.
- DOKU credentials remain server-side.

## Payment integration basis
The DOKU Checkout adapter follows the official Non-SNAP Checkout endpoint and signature guidance: `POST /checkout/v1/payment`, request signing with Client-Id, Request-Id, Request-Timestamp, Request-Target, and Digest, and webhook verification using the same signed components. The implementation is source-reviewed only; merchant-specific activation, dashboard notification configuration, and real sandbox callbacks have not been verified.

## Verification performed
- `npm run check`: JavaScript syntax check passed.
- SQL reviewed statically; it has not been executed against Supabase.
- No DOKU or NokosPusat sandbox transaction was run because merchant credentials were not provided.
- No claim of production readiness or certification is made.

## Before production
1. Back up Supabase. For an existing database, run `sql/doku-payment-migration.sql`; for a fresh database, run `sql/schema.sql`. Review SQL against your current schema before execution.
2. Configure `DOKU_CLIENT_ID`, `DOKU_SECRET_KEY`, `DOKU_ENV=sandbox`, and `APP_URL` in Vercel.
3. Register `https://gardaotp.my.id/api/doku-webhook` as the DOKU notification URL.
4. Register the DOKU notification URL in the DOKU Dashboard and verify the account-specific payment methods are enabled.
5. Sandbox-test checkout creation, SUCCESS notification, invalid signatures, stale timestamps, incorrect amounts, duplicate callbacks, and unknown invoice references.
6. Switch to live credentials only after successful sandbox verification.

## Remaining design decisions
- `leaderboard_public` intentionally exposes display names and aggregate deposit/order values. Confirm this is acceptable for your users.
- `username_available(text)` remains callable by `anon` for registration and can reveal username availability; add rate limiting if enumeration is a concern.


## OTP warranty implementation notes
- `api/order-status.js` fetches the current order for the authenticated owner, normalizes OTP payloads, and stores provider receipt/cancel eligibility metadata.
- `api/cancel-order.js` reads the provider snapshot before cancellation, requires `can_cancel === true`, marks the request before issuing DELETE, and will not issue a second DELETE if the result is uncertain.
- Internal balance refunds are credited only for provider-confirmed `cancelled`/`expired` (or known failed allocation) states and only when there is no OTP or receipt evidence. `refunded_at` plus a row lock makes the wallet credit idempotent.
- The 100% refund is to the Garda OTP internal wallet, not a reversal to the original QRIS funding instrument. Provider-side confirmation may take time; a pending/uncertain status is not a completed refund.
- Run `sql/otp-guarantee.sql` on an existing database before deployment. The browser UI alone does not install the new columns or RPCs.

- NokosPusat webhook endpoint validates the timestamped HMAC against the raw body, compares optional event headers, deduplicates event IDs, and rejects events that cannot yet be mapped to a local order so the provider can retry.
- The webhook ledger is service-role-only. `provider_updated_at` prevents older events from overwriting newer provider snapshots.

- NokosPusat event payloads may arrive out of order or omit fields in older queued events. The webhook handler therefore verifies the signature, deduplicates the event ID, then GETs the current provider order before persisting status or refunding.
- A definite NokosPusat 409/429 cancellation rejection clears the pending marker so the user may request a new cancellation after eligibility/cooldown; ambiguous upstream failures preserve the marker and never reissue DELETE automatically.
