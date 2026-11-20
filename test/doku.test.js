import test from 'node:test';
import assert from 'node:assert/strict';
import { dokuDigest, dokuSignature, verifyDokuNotification, resolveDokuPaymentMethod, parseDokuExpiredDate, generateQrDataUrl, DOKU_WEBHOOK_PATH } from '../lib/doku.js';

const secret = 'doku-test-secret';
const clientId = 'BRN-TEST-123';
const timestamp = '2026-11-20T10:00:00Z';
const rawBody = JSON.stringify({ order: { invoice_number: 'GDO-' + 'A'.repeat(32), amount: 10000 }, transaction: { status: 'SUCCESS' } });
function signedHeaders(body = rawBody, overrides = {}) {
  const base = { 'client-id': clientId, 'request-id': 'req-test-1', 'request-timestamp': timestamp };
  const signature = dokuSignature({ clientId, requestId: base['request-id'], timestamp: base['request-timestamp'], requestTarget: DOKU_WEBHOOK_PATH, digest: dokuDigest(body) }, secret);
  return { ...base, signature, ...overrides };
}

test('DOKU notification signature accepts valid raw body and headers', () => {
  assert.equal(verifyDokuNotification({ headers: signedHeaders(), rawBody, secret, expectedClientId: clientId, now: Date.parse(timestamp) }), true);
});
test('DOKU notification signature rejects tampered body', () => {
  assert.equal(verifyDokuNotification({ headers: signedHeaders(), rawBody: rawBody + ' ', secret, expectedClientId: clientId, now: Date.parse(timestamp) }), false);
});
test('DOKU notification signature rejects wrong merchant and timestamps older than retry horizon', () => {
  assert.equal(verifyDokuNotification({ headers: signedHeaders(), rawBody, secret, expectedClientId: 'other', now: Date.parse(timestamp) }), false);
  assert.equal(verifyDokuNotification({ headers: signedHeaders(), rawBody, secret, expectedClientId: clientId, now: Date.parse(timestamp) + 25 * 60 * 60 * 1000 }), false);
});
test('DOKU signature digest is base64 SHA-256', () => {
  assert.match(dokuDigest('{}'), /^[A-Za-z0-9+/]{43}=$/);
});
test('DOKU payment method resolver maps DANA, QRIS, default fallback, and rejects removed/unknown values', () => {
  assert.deepEqual(resolveDokuPaymentMethod('dana')?.paymentMethodTypes, ['EMONEY_DANA']);
  assert.deepEqual(resolveDokuPaymentMethod('qris')?.paymentMethodTypes, ['QRIS']);
  assert.equal(resolveDokuPaymentMethod('shopeepay'), null);
  assert.equal(resolveDokuPaymentMethod(undefined)?.id, 'default');
  assert.equal(resolveDokuPaymentMethod(undefined)?.paymentMethodTypes, null);
  assert.equal(resolveDokuPaymentMethod('unknown_wallet'), null);
  assert.equal(resolveDokuPaymentMethod('toString'), null);
});
test('DOKU compact expired_date is parsed as WIB (+07:00) ISO timestamp', () => {
  assert.equal(parseDokuExpiredDate('20261120235959'), '2026-11-20T16:59:59.000Z');
  assert.equal(parseDokuExpiredDate('invalid-date'), null);
});
test('QR generator produces PNG data URL for valid payment payload', async () => {
  const dataUrl = await generateQrDataUrl('https://checkout.doku.com/example');
  assert.match(dataUrl || '', /^data:image\/png;base64,/);
});

