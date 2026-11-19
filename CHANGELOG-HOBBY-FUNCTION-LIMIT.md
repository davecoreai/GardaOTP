# Vercel Hobby Function Limit Update

- Combined the countries lookup into `api/offers.js` using `resource=countries`.
- Updated the frontend to request `offers?resource=countries&service_id=...&provider=...`.
- Removed the standalone `api/countries.js` function.
- The API folder now contains 12 JavaScript Serverless Function entry points, down from 13.
- The countries response remains `{ data }`, and it retains its separate `countries` rate-limit bucket.

No database migration or environment-variable change is required for this consolidation.
