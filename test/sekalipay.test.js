import test from 'node:test';
import assert from 'node:assert/strict';
import { createHmac, timingSafeEqual } from 'node:crypto';

function verify(raw, signature, secret) {
  if (!/^[a-f0-9]{64}$/i.test(String(signature || ''))) return false;
  const expected = createHmac('sha256', secret).update(raw).digest();
  const supplied = Buffer.from(signature, 'hex');
  return supplied.length === expected.length && timingSafeEqual(supplied, expected);
}

test('SekaliPay raw-body HMAC accepts an unchanged signed body', () => {
  const raw = JSON.stringify({ merchant_ref_id: 'SORA-' + 'A'.repeat(32), amount: 10000, status: 'paid' });
  const sig = createHmac('sha256', 'test-secret').update(raw).digest('hex');
  assert.equal(verify(raw, sig, 'test-secret'), true);
});

test('SekaliPay raw-body HMAC rejects tampered bodies and malformed signatures', () => {
  const raw = '{"status":"paid"}';
  const sig = createHmac('sha256', 'test-secret').update(raw).digest('hex');
  assert.equal(verify(raw + ' ', sig, 'test-secret'), false);
  assert.equal(verify(raw, 'bad-signature', 'test-secret'), false);
});
