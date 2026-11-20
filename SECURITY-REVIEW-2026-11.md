# Garda OTP security and regression review — 2026-11-20

## Scope

Reviewed the supplied project archive's frontend entry points, API handlers, server helper, order policy, SQL schema/migrations, Vercel configuration, and existing automated tests. This is a static review plus local Node test execution, not a live penetration test or a verification of the deployed Supabase project.

## Confirmed checks

- API handlers use server-side Supabase service credentials through `lib/server.js`; the public config endpoint returns only the browser-safe Supabase URL and anon key.
- Authenticated API routes validate the bearer token with Supabase `auth.getUser()` and apply per-user rate limiting.
- Order creation re-fetches the provider offer and verifies the submitted quote before reserving balance.
- Payment webhook handlers validate signatures and use database settlement RPCs designed to avoid duplicate crediting.
- Core ledger tables have RLS enabled in `sql/schema.sql`; privileged balance and rate-limit RPCs are revoked from `public`, `anon`, and `authenticated` and granted to `service_role`.
- No hard-coded service-role key, provider API key, or payment secret was found in the scanned application source. Environment variable names and SQL role grants are expected references, not leaked credentials.

## Fixed defect

- `style.css` previously hid the entire `#homeBalance` / `#topupBalance` element and replaced it with a pseudo-element, hiding `Rp` as well as the digits.
- `app.js` now renders the currency prefix and amount as separate spans; only `.balance-amount` is obscured.
- `app.js` imports a shared formatter, so `index.html` now loads it as `type="module"`.
- Eye controls are positioned 4px lower while retaining their horizontal sweep animation.

## Automated verification

- `npm run check`: passed.
- `npm test`: passed, 16 tests, 0 failures.
- Added four regression tests covering currency prefix separation, hidden digits, restored digits/accessibility label, and invalid numeric values.

## Limitations / follow-up

- Browser automation was attempted with Chromium/Playwright but the environment blocked navigation to the local HTTP server (`ERR_BLOCKED_BY_ADMINISTRATOR`). The browser-level visual test is therefore not claimed as passed.
- The archive has no `package-lock.json`; a reproducible dependency install and `npm audit` could not be completed from this archive. Existing runtime dependency vulnerability status is therefore unverified.
- SQL policies and grants were reviewed as source text only. The live Supabase project's deployed schema, Data API exposure settings, Storage policies, and grants must be compared against these files before calling the database audit complete.
- Payment provider and NokosPusat webhook behavior was not tested against live or sandbox endpoints.

## Residual risk

This review does not establish that the deployed application is vulnerability-free. Validate environment variables, deployed SQL migrations, provider webhook configuration, and production browser flows in their authorized environments before release.
