import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import QRCode from 'qrcode';

export const DOKU_CHECKOUT_PATH = '/checkout/v1/payment';
export const DOKU_WEBHOOK_PATH = '/api/doku-webhook';

export async function generateQrDataUrl(text) {
  const value = String(text || '').trim();
  if (!value) return null;
  return QRCode.toDataURL(value, {
    width: 320,
    margin: 2,
    errorCorrectionLevel: 'M',
    color: { dark: '#111216', light: '#FFFFFF' }
  });
}

export function parseDokuExpiredDate(value) {
  const raw = String(value || '').trim();
  if (!raw) return null;
  const compact = raw.match(/^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})$/);
  if (compact) {
    const isoWib = `${compact[1]}-${compact[2]}-${compact[3]}T${compact[4]}:${compact[5]}:${compact[6]}+07:00`;
    const ms = Date.parse(isoWib);
    return Number.isFinite(ms) ? new Date(ms).toISOString() : null;
  }
  const ms = Date.parse(raw);
  return Number.isFinite(ms) ? new Date(ms).toISOString() : null;
}

export const DOKU_PAYMENT_METHODS = Object.freeze({
  dana: Object.freeze({
    id: 'dana',
    label: 'DANA',
    paymentMethodTypes: Object.freeze(['EMONEY_DANA'])
  }),
  qris: Object.freeze({
    id: 'qris',
    label: 'QRIS',
    paymentMethodTypes: Object.freeze(['QRIS'])
  }),
  default: Object.freeze({
    id: 'default',
    label: 'Pembayaran Digital',
    paymentMethodTypes: null
  })
});

export function resolveDokuPaymentMethod(value) {
  if (value === undefined || value === null || String(value).trim() === '') {
    return DOKU_PAYMENT_METHODS.default;
  }
  const key = String(value).trim().toLowerCase();
  return Object.hasOwn(DOKU_PAYMENT_METHODS, key) ? DOKU_PAYMENT_METHODS[key] : null;
}

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
