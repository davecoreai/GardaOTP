import { randomUUID } from 'node:crypto';
import { json, method, auth, supabaseAdmin, enforceRateLimit } from '../lib/server.js';
import { DOKU_CHECKOUT_PATH, dokuDigest, dokuSignature, resolveDokuPaymentMethod } from '../lib/doku.js';

const ALLOWED_AMOUNTS = new Set([5000, 10000, 20000, 50000, 100000]);
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function publicPayment(row) {
  return { status: row.status, payment_link: row.payment_link, expired_at: row.expires_at };
}

function isDokuSandbox() {
  const mode = String(process.env.DOKU_ENV || '').trim() || 'sandbox';
  if (!['sandbox', 'production'].includes(mode)) throw Object.assign(new Error('DOKU_ENV hanya boleh sandbox atau production.'), { status: 503 });
  return mode === 'sandbox';
}

function dokuBaseUrl() {
  const sandbox = isDokuSandbox();
  const expected = sandbox ? 'api-sandbox.doku.com' : 'api.doku.com';
  const url = new URL(String(process.env.DOKU_BASE_URL || '').trim() || `https://${expected}`);
  if (url.protocol !== 'https:' || url.hostname !== expected || url.username || url.password || url.port || url.pathname !== '/') {
    throw Object.assign(new Error('Konfigurasi endpoint DOKU tidak valid.'), { status: 503 });
  }
  return url.origin;
}

export default async function handler(req, res) {
  if (!method(req, res, ['POST'])) return;
  try {
    const user = await auth(req);
    await enforceRateLimit(user.id, 'create-payment', 5, 60);
    const amount = req.body?.amount;
    const paymentMethod = resolveDokuPaymentMethod(req.body?.payment_method);
    const requestKey = String(req.headers['idempotency-key'] || '');
    if (!Number.isSafeInteger(amount) || !ALLOWED_AMOUNTS.has(amount)) return json(res, 400, { error: 'Nominal top up tidak tersedia.' });
    if (!paymentMethod) return json(res, 400, { error: 'Metode pembayaran tidak tersedia.' });
    if (!UUID_RE.test(requestKey)) return json(res, 400, { error: 'Kunci idempotensi tidak valid. Silakan ulangi.' });

    const clientId = process.env.DOKU_CLIENT_ID;
    const secret = process.env.DOKU_SECRET_KEY;
    if (!clientId || !secret) throw Object.assign(new Error('DOKU_CLIENT_ID dan DOKU_SECRET_KEY belum dikonfigurasi.'), { status: 503 });

    let { data: row, error } = await supabaseAdmin.from('topups')
      .select('id,user_id,merchant_ref_id,amount,status,invoice,payment_link,expires_at,is_sandbox')
      .eq('user_id', user.id).eq('request_key', requestKey).maybeSingle();
    if (error) throw error;

    if (!row) {
      const merchantRef = `GDO-${randomUUID().replaceAll('-', '').toUpperCase()}`;
      const sandbox = isDokuSandbox();
      const { data: created, error: insertError } = await supabaseAdmin.from('topups').insert({
        user_id: user.id, merchant_ref_id: merchantRef, request_key: requestKey,
        amount, status: 'pending', is_sandbox: sandbox
      }).select('id,user_id,merchant_ref_id,amount,status,invoice,payment_link,expires_at,is_sandbox').single();
      if (insertError) {
        const retry = await supabaseAdmin.from('topups').select('id,user_id,merchant_ref_id,amount,status,invoice,payment_link,expires_at,is_sandbox')
          .eq('user_id', user.id).eq('request_key', requestKey).maybeSingle();
        if (retry.error || !retry.data) throw insertError;
        row = retry.data;
      } else row = created;
    }
    if (row.amount !== amount) return json(res, 409, { error: 'Kunci transaksi sudah digunakan untuk nominal berbeda.' });
    if (row.status === 'paid' || row.status === 'completed') return json(res, 200, { merchant_ref_id: row.merchant_ref_id, payment: publicPayment(row), already_paid: true });
    if (row.payment_link) return json(res, 200, { merchant_ref_id: row.merchant_ref_id, payment: publicPayment(row) });

    let appUrl;
    try {
      const parsed = new URL(String(process.env.APP_URL || '').trim());
      if (parsed.protocol !== 'https:' || parsed.username || parsed.password) throw new Error('invalid');
      appUrl = parsed.origin;
    } catch { throw Object.assign(new Error('APP_URL harus berupa URL HTTPS yang valid.'), { status: 503 }); }

    const paymentConfig = { payment_due_date: 60 };
    if (Array.isArray(paymentMethod.paymentMethodTypes) && paymentMethod.paymentMethodTypes.length > 0) {
      paymentConfig.payment_method_types = [...paymentMethod.paymentMethodTypes];
    }

    const customerName = String(user.email?.split('@')[0] || 'Garda OTP User')
      .replace(/[^A-Za-z0-9 ]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 120) || 'Garda OTP User';
    const callbackUrl = `${appUrl}/?topup=${encodeURIComponent(row.merchant_ref_id)}`;

    const payload = {
      order: {
        amount,
        invoice_number: row.merchant_ref_id,
        currency: 'IDR',
        callback_url: callbackUrl,
        callback_url_cancel: callbackUrl,
        line_items: [
          {
            id: 'TOPUP-IDR',
            name: 'Top Up Saldo Garda OTP',
            price: amount,
            quantity: 1
          }
        ]
      },
      payment: paymentConfig,
      customer: {
        id: String(user.id).slice(0, 64),
        name: customerName,
        email: String(user.email || '').slice(0, 120)
      }
    };
    const rawBody = JSON.stringify(payload);
    const requestId = requestKey;
    const timestamp = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
    const digest = dokuDigest(rawBody);
    const signature = dokuSignature({ clientId, requestId, timestamp, requestTarget: DOKU_CHECKOUT_PATH, digest }, secret);
    const response = await fetch(`${dokuBaseUrl()}${DOKU_CHECKOUT_PATH}`, {
      method: 'POST', signal: AbortSignal.timeout(15000),
      headers: {
        'Client-Id': clientId,
        'Request-Id': requestId,
        'Request-Timestamp': timestamp,
        'Signature': signature,
        'Digest': digest,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: rawBody
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      const dokuReason = String(result?.error?.message || result?.message || '').trim();
      console.warn('DOKU create-payment rejected:', response.status, paymentMethod.id, dokuReason || 'unknown');
      const userMessage = paymentMethod.id !== 'default' && response.status < 500
        ? `Metode pembayaran ${paymentMethod.label} belum aktif atau sedang bermasalah. Silakan coba metode lain.`
        : 'Gagal membuat halaman pembayaran. Silakan coba lagi.';
      throw Object.assign(new Error(userMessage), { status: response.status >= 500 ? 502 : 400 });
    }
    const paymentUrl = result?.response?.payment?.url;
    let safePaymentUrl;
    try {
      safePaymentUrl = new URL(paymentUrl);
      if (safePaymentUrl.protocol !== 'https:' || !(safePaymentUrl.hostname === 'doku.com' || safePaymentUrl.hostname.endsWith('.doku.com')) || safePaymentUrl.username || safePaymentUrl.password) throw new Error('invalid');
    } catch { throw Object.assign(new Error('URL halaman pembayaran tidak valid.'), { status: 502 }); }

    const { data: updated, error: updateError } = await supabaseAdmin.from('topups').update({
      status: 'pending', invoice: row.merchant_ref_id, payment_link: safePaymentUrl.toString(),
      expires_at: null, is_sandbox: isDokuSandbox()
    }).eq('id', row.id).eq('status', 'pending')
      .select('id,user_id,merchant_ref_id,amount,status,invoice,payment_link,expires_at,is_sandbox').single();
    if (updateError) throw updateError;
    return json(res, 201, { merchant_ref_id: updated.merchant_ref_id, payment_method: paymentMethod.id, payment_method_label: paymentMethod.label, payment: publicPayment(updated) });
  } catch (error) {
    const status = Number.isInteger(error.status) ? error.status : 500;
    return json(res, status, { error: status >= 500 ? 'Pembayaran belum dapat dibuat. Coba lagi dengan tombol yang sama.' : error.message });
  }
}
