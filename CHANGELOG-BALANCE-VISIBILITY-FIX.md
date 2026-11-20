# Balance visibility fix

- Split the IDR currency prefix (`Rp`) from the numeric amount in both Home and Top Up balance readouts.
- Hide only the numeric amount; preserve the currency prefix and accessible labels.
- Move the eye toggle down by 4px without breaking its horizontal sweep animation.
- Load `app.js` as an ES module because it imports the shared balance formatter.
- Add regression tests for visible/hidden balance formatting and invalid numeric input.

Verification: `npm run check` passed; `npm test` passed (16/16). Browser automation could not navigate to the local HTTP test server in this environment (`ERR_BLOCKED_BY_ADMINISTRATOR`), so visual interaction testing remains unverified here.
