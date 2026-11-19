# Garda OTP Security Review & Hardening Notes

## Scope
Source-level review of Vercel API routes, shared server helpers, Supabase SQL, payment UI, environment template, and documentation. No production Supabase account, merchant account, credentials, or deployment was accessed.

## Changes in this package
- Supabase access tokens are validated server-side with `auth.getUser`.
- Provider/payment/order/status routes use server-side authentication and atomic per-user rate limits where configured.
- NokosPusat order pricing is re-fetched and validated server-side before balance debit.
- Privileged database RPCs have explicit grants; direct client ledger mutation is revoked and RLS remains enabled.
- Top-up intent is persisted before the provider request and keyed by a per-user UUID idempotency key.
- SekaliPay webhook accepts raw JSON only, checks `X-Signature` HMAC-SHA256 against the raw body, validates reference and amount against the stored top-up, and credits through a row-locked atomic SQL function. Repeated paid callbacks do not credit the same top-up twice.
- Webhook request body size is limited and internal processing errors are not returned to the caller.
- SekaliPay credentials remain server-side.

## Payment contract caveat
The SekaliPay adapter is based on the payment request-signing and webhook field conventions already present in the user's original project archive. The exact merchant API contract, sandbox key format, signature header format, callback payload, and provider URL behavior have **not** been independently confirmed against current official SekaliPay documentation or a real merchant account. Verify these before production. The webhook format currently expects `X-Signature` as a hexadecimal HMAC-SHA256 of the raw JSON body.

## Verification performed
- `npm run check`: JavaScript syntax check passed.
- SQL reviewed statically; it has not been executed against Supabase.
- No real SekaliPay or NokosPusat sandbox transaction was run because merchant credentials were not provided.
- No claim of production readiness or certification is made.

## Before production
1. Back up Supabase. For an existing database, run `sql/security-hardening-sekalipay.sql`; for a fresh database, run `sql/schema.sql`. Review SQL against your current schema before execution.
2. Configure `SEKALIPAY_API_KEY`, `SEKALIPAY_SECRET_KEY`, `SEKALIPAY_BASE_URL`, `SEKALIPAY_PAYMENT_CODE`, `SEKALIPAY_IS_SANDBOX=true`, and `APP_URL` in Vercel.
3. Register `https://gardaotp.my.id/api/sekalipay-webhook` as the SekaliPay callback URL.
4. Verify the provider's signature specification and payload fields against merchant documentation.
5. Sandbox-test successful, failed, and expired payments; invalid signatures; incorrect amounts; duplicate callbacks; wrong references; and payment callbacks after expiry.
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

## Chat Public E2EE notes (2026-11-18)

New chat message bodies are encrypted client-side using Web Crypto AES-256-GCM. A room key is distributed to registered devices using ECDH P-256 and HKDF-SHA-256 derived per-device wrapping keys. Device private keys are non-extractable and persisted in IndexedDB; Supabase stores device public JWKs and recipient-specific encrypted room-key envelopes. A database trigger rejects new message rows that do not begin with the `E2EE1.` envelope prefix.

The encryption covers message body content only. User/profile metadata, timestamps, reply relationships, IP/request metadata, and message timing are not encrypted. Pre-migration message rows remain plaintext and are labeled as legacy in the UI. The group key is shared with all enrolled room members, has no forward secrecy or Double Ratchet, and uses a server-hosted public-key directory without out-of-band fingerprint verification. Therefore it provides client-side confidentiality against ordinary database content access, but is not a formally audited protocol and should not be advertised as equivalent to Signal/WhatsApp E2EE.
