import { createHash, createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import QRCode from 'qrcode';

export const DOKU_CHECKOUT_PATH = '/checkout/v1/payment';
export const DOKU_WEBHOOK_PATH = '/api/doku-webhook';

export function isDokuSandbox() {
  const mode = String(process.env.DOKU_ENV || '').trim().toLowerCase() || 'sandbox';
  if (!['sandbox', 'production'].includes(mode)) {
    throw Object.assign(new Error('Konfigurasi mode pembayaran tidak valid.'), { status: 503 });
  }
  return mode === 'sandbox';
}

export function dokuBaseUrl() {
  const sandbox = isDokuSandbox();
  const expected = sandbox ? 'api-sandbox.doku.com' : 'api.doku.com';
  const url = new URL(String(process.env.DOKU_BASE_URL || '').trim() || `https://${expected}`);
  if (url.protocol !== 'https:' || url.hostname !== expected || url.username || url.password || url.port || url.pathname !== '/') {
    throw Object.assign(new Error('Konfigurasi endpoint pembayaran tidak valid.'), { status: 503 });
  }
  return url.origin;
}

export function getDokuCredentials() {
  const clientId = String(process.env.DOKU_CLIENT_ID || '').trim();
  const secret = String(process.env.DOKU_SECRET_KEY || '').trim();
  return { clientId, secret };
}

export function parseDokuAmount(raw) {
  if (typeof raw === 'number') {
    return Number.isSafeInteger(raw) && raw > 0 ? raw : NaN;
  }
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (/^\d+(?:\.0+)?$/.test(trimmed)) {
      const value = Number(trimmed.split('.')[0]);
      return Number.isSafeInteger(value) && value > 0 ? value : NaN;
    }
  }
  return NaN;
}

export function isDokuPaidStatus(status) {
  return ['SUCCESS', 'PAID', 'SETTLED'].includes(String(status || '').trim().toUpperCase());
}

export function isDokuTerminalFailureStatus(status) {
  return ['EXPIRED', 'FAILED', 'CANCELLED', 'CANCELED'].includes(String(status || '').trim().toUpperCase());
}

export function dokuOrderStatusPath(invoiceNumber) {
  return `/orders/v1/status/${encodeURIComponent(String(invoiceNumber || '').trim())}`;
}

export async function checkDokuOrderStatus({ invoiceNumber, clientId, secret, baseUrl, timeoutMs = 4500 }) {
  const ref = String(invoiceNumber || '').trim();
  if (!ref || !clientId || !secret || !baseUrl) return null;
  const requestTarget = dokuOrderStatusPath(ref);
  const requestId = randomUUID();
  const timestamp = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
  const signature = dokuSignature({ clientId, requestId, timestamp, requestTarget }, secret);
  const response = await fetch(`${baseUrl}${requestTarget}`, {
    method: 'GET',
    signal: AbortSignal.timeout(timeoutMs),
    headers: {
      'Client-Id': clientId,
      'Request-Id': requestId,
      'Request-Timestamp': timestamp,
      'Signature': signature,
      'Accept': 'application/json'
    }
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    console.warn('[doku-status] check failed:', response.status, ref);
    return null;
  }
  return data;
}

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
  const clientId = String(headers['client-id'] || '').trim();
  const requestId = String(headers['request-id'] || '').trim();
  const timestamp = String(headers['request-timestamp'] || '').trim();
  const signature = String(headers.signature || '').trim();
  const parsedTime = Date.parse(timestamp);
  if (!clientId || clientId !== String(expectedClientId || '').trim() || !requestId || requestId.length > 128 || !Number.isFinite(parsedTime) || Math.abs(now - parsedTime) > maxAgeMs) return false;
  const expected = dokuSignature({ clientId, requestId, timestamp, requestTarget, digest: dokuDigest(rawBody) }, String(secret || '').trim());
  return safeEqualText(signature, expected);
}
