# GardaOTP Security Review — 2026-11-20

## Scope
Reviewed the uploaded source archive locally: frontend (`app.js`, `index.html`, `style.css`), Vercel API routes, shared server helpers, SQL migrations, package manifest, and Vercel configuration. This is a source review, not a live penetration test or a certification.

## Fixes applied
- `api/public-config.js` no longer imports `lib/server.js`. That import initialized the privileged Supabase admin client as a side effect and could prevent the public configuration route from loading when server-only environment variables were missing.
- Public config now accepts GET only, disables caching, validates the Supabase project URL and anon key, returns an explicit 503 configuration error when settings are absent, and returns only the browser-safe URL and anon key.
- Balance hiding now replaces the entire formatted currency string in both balance elements with `•••••`. This avoids depending on CSS pseudo-elements/blur, which could leave the `Rp` prefix visible. The visibility toggle remains synchronized across both displays.
- Auth initialization errors are no longer silently swallowed. The login UI reports the configuration failure and does not clear persisted Supabase auth storage. Once configuration is corrected, Supabase can restore its persisted session.
- Added regression tests for public-config method handling, missing configuration, and ensuring service-role credentials are not returned.

## Verification
- `npm run check`: passed.
- `npm test`: 12 tests passed, 0 failed.
- JavaScript syntax checks: passed for all API and library JavaScript files and `app.js`.

## Security observations requiring owner-side verification
- Supabase RLS and Storage policies are present in several SQL migrations, but source inspection cannot establish which migrations were applied to the live project or whether Data API grants/views/functions are correctly configured. Verify live schema, grants, RLS policies, Storage policies, and SECURITY DEFINER functions before production.
- Confirm Vercel environment variables are configured separately for Production and Preview: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, provider credentials, and webhook signing secrets as required. Never put service-role or provider secrets in frontend variables.
- Rotate any credential that has ever been committed to a public repository or shared archive. No secret values are reproduced in this report.
- Webhook endpoints require live provider dashboard verification of signing secrets, callback URLs, and replay/idempotency behavior. Source tests do not prove provider-side configuration.
- No live Supabase database, Vercel deployment, payment provider, or Nokos provider was accessed or modified.

## Residual limitations
This review did not run dependency vulnerability scanning against the network, dynamic browser testing, authenticated API integration tests against a staging database, or a live RLS adversarial test. Do not treat this report as a clean bill of security.
