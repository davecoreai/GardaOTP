# SoraOTP Security Review & Hardening Notes

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
3. Register `https://YOUR-DOMAIN.vercel.app/api/sekalipay-webhook` as the SekaliPay callback URL.
4. Verify the provider's signature specification and payload fields against merchant documentation.
5. Sandbox-test successful, failed, and expired payments; invalid signatures; incorrect amounts; duplicate callbacks; wrong references; and payment callbacks after expiry.
6. Switch to live credentials only after successful sandbox verification.

## Remaining design decisions
- `leaderboard_public` intentionally exposes display names and aggregate deposit/order values. Confirm this is acceptable for your users.
- `username_available(text)` remains callable by `anon` for registration and can reveal username availability; add rate limiting if enumeration is a concern.
