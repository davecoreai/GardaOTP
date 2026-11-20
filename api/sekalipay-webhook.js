import { json, method, supabaseAdmin, safeEqualHex, hmac, bodyRaw } from '../lib/server.js';
export const config = { api: { bodyParser: false } };

const TERMINAL_FAILURES = new Set(['expired', 'failed', 'cancelled', 'canceled']);
export default async function handler(req, res) {
  if (!method(req, res, ['POST'])) return;
  try {
    if (!String(req.headers['content-type'] || '').toLowerCase().includes('application/json')) return json(res, 415, { error: 'Unsupported content type' });
    const raw = await bodyRaw(req, 65536);
    if (!raw || !process.env.SEKALIPAY_SECRET_KEY) return json(res, 400, { error: 'Invalid webhook request' });
    const signature = req.headers['x-signature'];
    if (!safeEqualHex(signature, hmac(raw, process.env.SEKALIPAY_SECRET_KEY))) return json(res, 401, { error: 'Invalid signature' });
    const event = JSON.parse(raw);
    const ref = String(event?.merchant_ref_id || '');
    const status = String(event?.status || '').toLowerCase();
    if (!/^SORA-[A-F0-9]{32}$/.test(ref)) return json(res, 400, { error: 'Invalid merchant reference' });

    if (status === 'paid' || status === 'completed') {
      const amount = event.amount;
      if (!Number.isSafeInteger(amount) || amount <= 0) return json(res, 400, { error: 'Invalid payment amount' });
      const paidAt = event.paid_at && Number.isFinite(Date.parse(event.paid_at)) ? new Date(event.paid_at).toISOString() : new Date().toISOString();
      const { data: topup, error: lookupError } = await supabaseAdmin.from('topups')
        .select('merchant_ref_id,amount,is_sandbox,invoice,status').eq('merchant_ref_id', ref).maybeSingle();
      if (lookupError) throw lookupError;
      if (!topup) return json(res, 404, { error: 'Top up not found' });
      if (topup.amount !== amount) return json(res, 400, { error: 'Payment amount mismatch' });
      if (event.is_sandbox !== undefined && Boolean(event.is_sandbox) !== Boolean(topup.is_sandbox)) return json(res, 400, { error: 'Payment mode mismatch' });
      if (event.invoice && topup.invoice && String(event.invoice) !== String(topup.invoice)) return json(res, 400, { error: 'Invoice mismatch' });
      const { error } = await supabaseAdmin.rpc('credit_sekalipay_topup_once', {
        p_merchant_ref_id: ref,
        p_invoice: typeof event.invoice === 'string' ? event.invoice.slice(0, 180) : null,
        p_paid_amount: amount,
        p_paid_at: paidAt,
        p_is_sandbox: Boolean(topup.is_sandbox)
      });
      if (error) throw error;
      return json(res, 200, { received: true });
    }

    if (TERMINAL_FAILURES.has(status)) {
      const { error } = await supabaseAdmin.from('topups').update({ status }).eq('merchant_ref_id', ref).eq('status', 'pending');
      if (error) throw error;
      return json(res, 200, { received: true });
    }
    return json(res, 200, { received: true, ignored: true });
  } catch (error) {
    if (error?.message === 'Payload too large') return json(res, 413, { error: 'Payload too large' });
    if (error instanceof SyntaxError) return json(res, 400, { error: 'Invalid JSON' });
    return json(res, 500, { error: 'Webhook processing failed' });
  }
}
