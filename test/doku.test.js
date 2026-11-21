import test from 'node:test';
import assert from 'node:assert/strict';
import {
  detectDokuPaymentMethodLabel,
  dokuDigest,
  dokuOrderStatusPath,
  dokuSignature,
  generateQrDataUrl,
  isAllowedTopupAmount,
  isDokuPaidStatus,
  isDokuTerminalFailureStatus,
  parseDokuAmount,
  parseDokuExpiredDate,
  resolveDokuPaymentMethod,
  verifyDokuNotification,
  DOKU_WEBHOOK_PATH
} from '../lib/doku.js';

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
  assert.equal(verifyDokuNotification({ headers: signedHeaders(), rawBody, secret: ` ${secret}\n`, expectedClientId: ` ${clientId} `, now: Date.parse(timestamp) }), true);
});
test('DOKU notification signature rejects tampered body', () => {
  assert.equal(verifyDokuNotification({ headers: signedHeaders(), rawBody: rawBody + ' ', secret, expectedClientId: clientId, now: Date.parse(timestamp) }), false);
});
test('DOKU notification signature rejects wrong merchant and timestamps older than retry horizon', () => {
  assert.equal(verifyDokuNotification({ headers: signedHeaders(), rawBody, secret, expectedClientId: 'other', now: Date.parse(timestamp) }), false);
  assert.equal(verifyDokuNotification({ headers: signedHeaders(), rawBody, secret, expectedClientId: clientId, now: Date.parse(timestamp) + 25 * 60 * 60 * 1000 }), false);
});
test('DOKU signature digest is base64 SHA-256 and GET check-status signature omits Digest', () => {
  assert.match(dokuDigest('{}'), /^[A-Za-z0-9+/]{43}=$/);
  const path = dokuOrderStatusPath('GDO-' + 'B'.repeat(32));
  assert.equal(path, `/orders/v1/status/GDO-${'B'.repeat(32)}`);
  const withDigest = dokuSignature({ clientId, requestId: 'req-1', timestamp, requestTarget: path, digest: dokuDigest('') }, secret);
  const withoutDigest = dokuSignature({ clientId, requestId: 'req-1', timestamp, requestTarget: path }, secret);
  assert.notEqual(withoutDigest, withDigest);
  assert.match(withoutDigest, /^HMACSHA256=/);
});
test('DOKU amount parser accepts integer numbers and .00 decimal strings and rejects invalid values', () => {
  assert.equal(parseDokuAmount(100000), 100000);
  assert.equal(parseDokuAmount('100000'), 100000);
  assert.equal(parseDokuAmount('100000.00'), 100000);
  assert.equal(parseDokuAmount(' 50000.0 '), 50000);
  assert.equal(Number.isNaN(parseDokuAmount('100000.50')), true);
  assert.equal(Number.isNaN(parseDokuAmount(0)), true);
  assert.equal(Number.isNaN(parseDokuAmount('-10000')), true);
  assert.equal(Number.isNaN(parseDokuAmount('')), true);
});
test('DOKU transaction status classifiers distinguish paid and terminal failures', () => {
  assert.equal(isDokuPaidStatus('SUCCESS'), true);
  assert.equal(isDokuPaidStatus('paid'), true);
  assert.equal(isDokuPaidStatus('SETTLED'), true);
  assert.equal(isDokuPaidStatus('PENDING'), false);
  assert.equal(isDokuTerminalFailureStatus('EXPIRED'), true);
  assert.equal(isDokuTerminalFailureStatus('FAILED'), true);
  assert.equal(isDokuTerminalFailureStatus('SUCCESS'), false);
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
test('Topup amount validator allows presets 10k/20k/50k/100k/1M and custom >= 50k', () => {
  assert.equal(isAllowedTopupAmount(10000), true);
  assert.equal(isAllowedTopupAmount(20000), true);
  assert.equal(isAllowedTopupAmount(50000), true);
  assert.equal(isAllowedTopupAmount(100000), true);
  assert.equal(isAllowedTopupAmount(1000000), true);
  assert.equal(isAllowedTopupAmount(75000), true);
  assert.equal(isAllowedTopupAmount(150000), true);
  assert.equal(isAllowedTopupAmount(5000), false);
  assert.equal(isAllowedTopupAmount(49999), false);
  assert.equal(isAllowedTopupAmount(0), false);
  assert.equal(isAllowedTopupAmount(-50000), false);
  assert.equal(isAllowedTopupAmount(10000001), false);
  assert.equal(isAllowedTopupAmount(55000.5), false);
});
test('Payment method auto-detector classifies DANA and QRIS reliably', () => {
  assert.equal(detectDokuPaymentMethodLabel({ channelId: 'EMONEY_DANA' }), 'DANA');
  assert.equal(detectDokuPaymentMethodLabel({ channelId: 'QRIS' }), 'QRIS');
  assert.equal(detectDokuPaymentMethodLabel({ paymentMethod: 'dana' }), 'DANA');
  assert.equal(detectDokuPaymentMethodLabel({ paymentMethod: 'QRIS' }), 'QRIS');
  assert.equal(detectDokuPaymentMethodLabel({ qrLink: 'https://checkout.doku.com/qris/123' }), 'QRIS');
  assert.equal(detectDokuPaymentMethodLabel({}), null);
});
test('DOKU compact expired_date is parsed as WIB (+07:00) ISO timestamp', () => {
  assert.equal(parseDokuExpiredDate('20261120235959'), '2026-11-20T16:59:59.000Z');
  assert.equal(parseDokuExpiredDate('invalid-date'), null);
});
test('QR generator produces PNG data URL for valid payment payload', async () => {
  const dataUrl = await generateQrDataUrl('https://checkout.doku.com/example');
  assert.match(dataUrl || '', /^data:image\/png;base64,/);
});

