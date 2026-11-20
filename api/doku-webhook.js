import { json, method, supabaseAdmin, bodyRaw } from '../lib/server.js';
import {
  DOKU_WEBHOOK_PATH,
  getDokuCredentials,
  isDokuPaidStatus,
  isDokuSandbox,
  isDokuTerminalFailureStatus,
  parseDokuAmount,
  verifyDokuNotification
} from '../lib/doku.js';
export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  if (!method(req, res, ['POST'])) return;
  try {
    const contentType = String(req.headers['content-type'] || '').toLowerCase();
    if (!contentType.includes('application/json')) {
      console.warn('[doku-webhook] rejected unsupported content-type:', contentType || 'none');
      return json(res, 415, { error: 'Unsupported content type' });
    }
    const raw = await bodyRaw(req, 65536);
    const { clientId, secret } = getDokuCredentials();
    if (!raw || !secret || !clientId) {
      console.warn('[doku-webhook] missing raw body or gateway credentials', { hasRaw: Boolean(raw), hasSecret: Boolean(secret), hasClientId: Boolean(clientId) });
      return json(res, 400, { error: 'Invalid webhook request' });
    }
    if (!verifyDokuNotification({ headers: req.headers, rawBody: raw, secret, expectedClientId: clientId, requestTarget: DOKU_WEBHOOK_PATH })) {
      console.warn('[doku-webhook] invalid signature', {
        receivedClientId: String(req.headers['client-id'] || '').trim() || 'missing',
        hasRequestId: Boolean(req.headers['request-id']),
        timestamp: String(req.headers['request-timestamp'] || '').trim() || 'missing'
      });
      return json(res, 401, { error: 'Invalid signature' });
    }

    const event = JSON.parse(raw);
    const ref = String(event?.order?.invoice_number || '').trim();
    const status = String(event?.transaction?.status || '').trim().toUpperCase();
    if (!/^GDO-[A-F0-9]{32}$/.test(ref)) {
      console.warn('[doku-webhook] invalid invoice number:', ref || 'empty');
      return json(res, 400, { error: 'Invalid invoice number' });
    }

    if (!isDokuPaidStatus(status)) {
      if (isDokuTerminalFailureStatus(status)) {
        const nextStatus = status === 'EXPIRED' ? 'expired' : 'failed';
        await supabaseAdmin.from('topups').update({ status: nextStatus }).eq('merchant_ref_id', ref).eq('status', 'pending');
        console.info('[doku-webhook] marked terminal status:', { ref, status: nextStatus });
        return json(res, 200, { received: true, status: nextStatus });
      }
      console.info('[doku-webhook] ignored non-final status:', { ref, status });
      return json(res, 200, { received: true, ignored: true });
    }

    const amount = parseDokuAmount(event?.order?.amount);
    if (!Number.isSafeInteger(amount) || amount <= 0) {
      console.warn('[doku-webhook] invalid payment amount:', { ref, rawAmount: event?.order?.amount });
      return json(res, 400, { error: 'Invalid payment amount' });
    }
    const paidAtValue = event?.transaction?.date;
    const paidAt = paidAtValue && Number.isFinite(Date.parse(paidAtValue)) ? new Date(paidAtValue).toISOString() : new Date().toISOString();
    const { data: topup, error: lookupError } = await supabaseAdmin.from('topups')
      .select('merchant_ref_id,amount,is_sandbox,invoice,status').eq('merchant_ref_id', ref).maybeSingle();
    if (lookupError) throw lookupError;
    if (!topup) {
      console.warn('[doku-webhook] topup not found:', ref);
      return json(res, 404, { error: 'Top up not found' });
    }
    if (topup.amount !== amount) {
      console.warn('[doku-webhook] amount mismatch:', { ref, expected: topup.amount, received: amount });
      return json(res, 400, { error: 'Payment amount mismatch' });
    }

    let expectedSandbox;
    try {
      expectedSandbox = isDokuSandbox();
    } catch {
      console.error('[doku-webhook] payment mode misconfigured:', process.env.DOKU_ENV);
      return json(res, 503, { error: 'Payment mode misconfigured' });
    }
    if (Boolean(topup.is_sandbox) !== expectedSandbox) {
      console.warn('[doku-webhook] payment mode mismatch:', { ref, rowSandbox: Boolean(topup.is_sandbox), expectedSandbox });
      return json(res, 400, { error: 'Payment mode mismatch' });
    }
    if (topup.invoice && topup.invoice !== ref) {
      console.warn('[doku-webhook] invoice mismatch:', { ref, rowInvoice: topup.invoice });
      return json(res, 400, { error: 'Invoice mismatch' });
    }

    const { error } = await supabaseAdmin.rpc('credit_doku_topup_once', {
      p_merchant_ref_id: ref,
      p_invoice: ref,
      p_paid_amount: amount,
      p_paid_at: paidAt,
      p_is_sandbox: Boolean(topup.is_sandbox)
    });
    if (error) {
      console.error('[doku-webhook] credit_doku_topup_once failed:', { ref, message: error.message, code: error.code });
      throw error;
    }
    console.info('[doku-webhook] credited topup successfully:', { ref, amount });
    return json(res, 200, { received: true });
  } catch (error) {
    if (error?.message === 'Payload too large') return json(res, 413, { error: 'Payload too large' });
    if (error instanceof SyntaxError) {
      console.warn('[doku-webhook] invalid JSON payload');
      return json(res, 400, { error: 'Invalid JSON' });
    }
    console.error('[doku-webhook] unhandled error:', error?.message || error);
    return json(res, 500, { error: 'Webhook processing failed' });
  }
}
