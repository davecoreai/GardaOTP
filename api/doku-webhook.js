import { json, method, supabaseAdmin, bodyRaw } from '../lib/server.js';
import { DOKU_WEBHOOK_PATH, verifyDokuNotification } from '../lib/doku.js';
export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  if (!method(req, res, ['POST'])) return;
  try {
    if (!String(req.headers['content-type'] || '').toLowerCase().includes('application/json')) return json(res, 415, { error: 'Unsupported content type' });
    const raw = await bodyRaw(req, 65536);
    const secret = process.env.DOKU_SECRET_KEY;
    const clientId = process.env.DOKU_CLIENT_ID;
    if (!raw || !secret || !clientId) return json(res, 400, { error: 'Invalid webhook request' });
    if (!verifyDokuNotification({ headers: req.headers, rawBody: raw, secret, expectedClientId: clientId, requestTarget: DOKU_WEBHOOK_PATH })) return json(res, 401, { error: 'Invalid signature' });

    const event = JSON.parse(raw);
    const ref = String(event?.order?.invoice_number || '');
    const status = String(event?.transaction?.status || '').toUpperCase();
    if (!/^GDO-[A-F0-9]{32}$/.test(ref)) return json(res, 400, { error: 'Invalid invoice number' });
    if (status !== 'SUCCESS') return json(res, 200, { received: true, ignored: true });

    const amountRaw = event?.order?.amount;
    const amount = typeof amountRaw === 'number' ? amountRaw : (typeof amountRaw === 'string' && /^\d+$/.test(amountRaw) ? Number(amountRaw) : NaN);
    if (!Number.isSafeInteger(amount) || amount <= 0) return json(res, 400, { error: 'Invalid payment amount' });
    const paidAtValue = event?.transaction?.date;
    const paidAt = paidAtValue && Number.isFinite(Date.parse(paidAtValue)) ? new Date(paidAtValue).toISOString() : new Date().toISOString();
    const { data: topup, error: lookupError } = await supabaseAdmin.from('topups')
      .select('merchant_ref_id,amount,is_sandbox,invoice,status').eq('merchant_ref_id', ref).maybeSingle();
    if (lookupError) throw lookupError;
    if (!topup) return json(res, 404, { error: 'Top up not found' });
    if (topup.amount !== amount) return json(res, 400, { error: 'Payment amount mismatch' });
    const mode = process.env.DOKU_ENV || 'sandbox';
    if (!['sandbox', 'production'].includes(mode)) return json(res, 503, { error: 'Payment mode misconfigured' });
    const expectedSandbox = mode === 'sandbox';
    if (Boolean(topup.is_sandbox) !== expectedSandbox) return json(res, 400, { error: 'Payment mode mismatch' });
    if (topup.invoice && topup.invoice !== ref) return json(res, 400, { error: 'Invoice mismatch' });

    const { error } = await supabaseAdmin.rpc('credit_doku_topup_once', {
      p_merchant_ref_id: ref,
      p_invoice: ref,
      p_paid_amount: amount,
      p_paid_at: paidAt,
      p_is_sandbox: Boolean(topup.is_sandbox)
    });
    if (error) throw error;
    return json(res, 200, { received: true });
  } catch (error) {
    if (error?.message === 'Payload too large') return json(res, 413, { error: 'Payload too large' });
    if (error instanceof SyntaxError) return json(res, 400, { error: 'Invalid JSON' });
    return json(res, 500, { error: 'Webhook processing failed' });
  }
}
