import { randomUUID } from 'node:crypto';
import { json, method, auth, supabaseAdmin, enforceRateLimit, hmac } from '../lib/server.js';

const ALLOWED_AMOUNTS = new Set([5000, 10000, 20000, 50000, 100000]);
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function phpEncode(value) {
  return encodeURIComponent(String(value)).replace(/[!'()*~]/g, c => '%' + c.charCodeAt(0).toString(16).toUpperCase()).replace(/%20/g, '+');
}
function publicPayment(row) {
  return { status: row.status, payment_link: row.payment_link, qr_link: row.qr_link, expired_at: row.expires_at };
}

export default async function handler(req, res) {
  if (!method(req, res, ['POST'])) return;
  try {
    const user = await auth(req);
    await enforceRateLimit(user.id, 'create-payment', 5, 60);
    const amount = req.body?.amount;
    const requestKey = String(req.headers['idempotency-key'] || '');
    if (!Number.isSafeInteger(amount) || !ALLOWED_AMOUNTS.has(amount)) return json(res, 400, { error: 'Nominal top up tidak tersedia.' });
    if (!UUID_RE.test(requestKey)) return json(res, 400, { error: 'Kunci idempotensi tidak valid. Silakan ulangi.' });
    const apiKey = process.env.SEKALIPAY_API_KEY;
    const secret = process.env.SEKALIPAY_SECRET_KEY;
    if (!apiKey || !secret) throw Object.assign(new Error('Payment provider belum dikonfigurasi.'), { status: 503 });

    let { data: row, error } = await supabaseAdmin.from('topups')
      .select('id,user_id,merchant_ref_id,amount,status,invoice,payment_link,qr_link,expires_at,is_sandbox')
      .eq('user_id', user.id).eq('request_key', requestKey).maybeSingle();
    if (error) throw error;

    if (!row) {
      const merchantRef = `SORA-${randomUUID().replaceAll('-', '').toUpperCase()}`;
      const { data: created, error: insertError } = await supabaseAdmin.from('topups').insert({
        user_id: user.id, merchant_ref_id: merchantRef, request_key: requestKey,
        amount, status: 'pending', is_sandbox: process.env.SEKALIPAY_IS_SANDBOX === 'true'
      }).select('id,user_id,merchant_ref_id,amount,status,invoice,payment_link,qr_link,expires_at,is_sandbox').single();
      if (insertError) {
        const retry = await supabaseAdmin.from('topups').select('id,user_id,merchant_ref_id,amount,status,invoice,payment_link,qr_link,expires_at,is_sandbox')
          .eq('user_id', user.id).eq('request_key', requestKey).maybeSingle();
        if (retry.error || !retry.data) throw insertError;
        row = retry.data;
      } else row = created;
    }
    if (row.amount !== amount) return json(res, 409, { error: 'Kunci transaksi sudah digunakan untuk nominal berbeda.' });
    if (row.status === 'paid' || row.status === 'completed') return json(res, 200, { merchant_ref_id: row.merchant_ref_id, payment: publicPayment(row), already_paid: true });
    if (row.payment_link || row.qr_link) return json(res, 200, { merchant_ref_id: row.merchant_ref_id, payment: publicPayment(row) });

    const { data: profile, error: profileError } = await supabaseAdmin.from('profiles').select('display_name').eq('id', user.id).single();
    if (profileError) throw profileError;
    let appUrl;
    try {
      const parsed = new URL(process.env.APP_URL || '');
      if (parsed.protocol !== 'https:' || parsed.username || parsed.password) throw new Error('invalid');
      appUrl = parsed.origin;
    } catch { throw Object.assign(new Error('APP_URL harus berupa URL HTTPS yang valid.'), { status: 503 }); }

    const payload = {
      merchant_ref_id: row.merchant_ref_id,
      amount,
      payment_code: process.env.SEKALIPAY_PAYMENT_CODE || 'QRIS',
      customer_name: String(profile.display_name || user.email?.split('@')[0] || 'Garda OTP User').slice(0, 120),
      customer_email: user.email || '',
      callback_url: `${appUrl}/api/sekalipay-webhook`,
      return_url: `${appUrl}/?topup=${encodeURIComponent(row.merchant_ref_id)}`
    };
    const params = Object.keys(payload).sort().map(k => `${phpEncode(k)}=${phpEncode(typeof payload[k] === 'string' ? payload[k].trim() : payload[k])}`).join('&');
    const timestamp = Math.floor(Date.now() / 1000);
    const signature = hmac(`POST|api/v1/gateway/payment|${params}|${timestamp}`, secret);
    const baseUrl = new URL(process.env.SEKALIPAY_BASE_URL || 'https://sekalipay.com/api/v1/gateway');
    if (baseUrl.protocol !== 'https:' || baseUrl.hostname !== 'sekalipay.com' || baseUrl.username || baseUrl.password) throw Object.assign(new Error('Konfigurasi endpoint SekaliPay tidak valid.'), { status: 503 });
    const base = baseUrl.toString().replace(/\/$/, '');
    const response = await fetch(`${base}/payment`, {
      method: 'POST', signal: AbortSignal.timeout(15000),
      headers: { 'X-API-Key': apiKey, 'X-Signature': signature, 'X-Timestamp': String(timestamp), 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(payload)
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw Object.assign(new Error('SekaliPay gagal membuat tagihan.'), { status: response.status >= 500 ? 502 : 400 });
    const payment = result?.data;
    if (!payment || typeof payment !== 'object' || (!payment.payment_link && !payment.qr_link) || (typeof payment.is_sandbox === 'boolean' && payment.is_sandbox !== (process.env.SEKALIPAY_IS_SANDBOX === 'true')) || ![payment.payment_link, payment.qr_link].filter(Boolean).every(value => { try { const u = new URL(value); return u.protocol === 'https:' && (u.hostname === 'sekalipay.com' || u.hostname.endsWith('.sekalipay.com')) && !u.username && !u.password; } catch { return false; } })) {
      throw Object.assign(new Error('Respons SekaliPay tidak valid.'), { status: 502 });
    }
    const { data: updated, error: updateError } = await supabaseAdmin.from('topups').update({
      status: 'pending',
      invoice: typeof payment.invoice === 'string' ? payment.invoice.slice(0, 180) : null,
      payment_link: payment.payment_link || null,
      qr_link: payment.qr_link || null,
      expires_at: payment.expired_at || null,
      is_sandbox: process.env.SEKALIPAY_IS_SANDBOX === 'true'
    }).eq('id', row.id).eq('status', 'pending')
      .select('id,user_id,merchant_ref_id,amount,status,invoice,payment_link,qr_link,expires_at,is_sandbox').single();
    if (updateError) throw updateError;
    return json(res, 201, { merchant_ref_id: updated.merchant_ref_id, payment: publicPayment(updated) });
  } catch (error) {
    const status = Number.isInteger(error.status) ? error.status : 500;
    return json(res, status, { error: status >= 500 ? 'Pembayaran belum dapat dibuat. Coba lagi dengan tombol yang sama.' : error.message });
  }
}
