import { createHash, createHmac, timingSafeEqual } from 'node:crypto';

export const DOKU_CHECKOUT_PATH = '/checkout/v1/payment';
export const DOKU_WEBHOOK_PATH = '/api/doku-webhook';

export function dokuDigest(rawBody) {
  return createHash('sha256').update(rawBody).digest('base64');
}

export function dokuSignature({ clientId, requestId, timestamp, requestTarget, digest }, secret) {
  const components = [
    `Client-Id:${clientId}`,
    `Request-Id:${requestId}`,
    `Request-Timestamp:${timestamp}`,
    `Request-Target:${requestTarget}`,
    ...(digest ? [`Digest:${digest}`] : [])
  ].join('\n');
  return `HMACSHA256=${createHmac('sha256', secret).update(components).digest('base64')}`;
}

export function safeEqualText(a, b) {
  const left = Buffer.from(String(a || ''), 'utf8');
  const right = Buffer.from(String(b || ''), 'utf8');
  return left.length === right.length && left.length > 0 && timingSafeEqual(left, right);
}

export function verifyDokuNotification({ headers, rawBody, secret, expectedClientId, requestTarget = DOKU_WEBHOOK_PATH, now = Date.now(), maxAgeMs = 24 * 60 * 60 * 1000 }) {
  const clientId = String(headers['client-id'] || '');
  const requestId = String(headers['request-id'] || '');
  const timestamp = String(headers['request-timestamp'] || '');
  const signature = String(headers.signature || '');
  const parsedTime = Date.parse(timestamp);
  if (!clientId || clientId !== expectedClientId || !requestId || requestId.length > 128 || !Number.isFinite(parsedTime) || Math.abs(now - parsedTime) > maxAgeMs) return false;
  const expected = dokuSignature({ clientId, requestId, timestamp, requestTarget, digest: dokuDigest(rawBody) }, secret);
  return safeEqualText(signature, expected);
}
