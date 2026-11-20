import { json, method, auth, supabaseAdmin, enforceRateLimit } from '../lib/server.js';
import {
  checkDokuOrderStatus,
  dokuBaseUrl,
  generateQrDataUrl,
  getDokuCredentials,
  isDokuPaidStatus,
  isDokuSandbox,
  isDokuTerminalFailureStatus,
  parseDokuAmount
} from '../lib/doku.js';

const SYNC_MAX_AGE_MS = 48 * 60 * 60 * 1000;
const SYNC_MAX_ITEMS = 3;

async function reconcilePendingTopups(rows, preferredRef) {
  let creds;
  let baseUrl;
  let expectedSandbox;
  try {
    creds = getDokuCredentials();
    if (!creds.clientId || !creds.secret) return;
    expectedSandbox = isDokuSandbox();
    baseUrl = dokuBaseUrl();
  } catch {
    return;
  }

  const now = Date.now();
  const eligible = (rows || []).filter((row) => {
    if (String(row.status || '').toLowerCase() !== 'pending') return false;
    if (!row.payment_link) return false;
    if (Boolean(row.is_sandbox) !== expectedSandbox) return false;
    const createdMs = Date.parse(row.created_at || '');
    return !Number.isFinite(createdMs) || (now - createdMs) <= SYNC_MAX_AGE_MS;
  });

  if (!eligible.length) return;
  eligible.sort((a, b) => {
    if (preferredRef) {
      if (a.merchant_ref_id === preferredRef) return -1;
      if (b.merchant_ref_id === preferredRef) return 1;
    }
    return Date.parse(b.created_at || 0) - Date.parse(a.created_at || 0);
  });

  const targets = eligible.slice(0, SYNC_MAX_ITEMS);
  await Promise.allSettled(targets.map(async (row) => {
    const statusRes = await checkDokuOrderStatus({
      invoiceNumber: row.merchant_ref_id,
      clientId: creds.clientId,
      secret: creds.secret,
      baseUrl
    });
    if (!statusRes) return;

    const remoteRef = String(statusRes?.order?.invoice_number || '').trim();
    if (remoteRef && remoteRef !== row.merchant_ref_id) return;

    const remoteStatus = String(statusRes?.transaction?.status || '').trim().toUpperCase();
    if (isDokuPaidStatus(remoteStatus)) {
      const rawAmount = statusRes?.order?.amount;
      if (rawAmount !== undefined && rawAmount !== null && rawAmount !== '') {
        const parsedAmount = parseDokuAmount(rawAmount);
        if (parsedAmount !== row.amount) {
          console.warn('[history-sync] amount mismatch:', { ref: row.merchant_ref_id, expected: row.amount, received: parsedAmount });
          return;
        }
      }
      const paidAtRaw = statusRes?.transaction?.date;
      const paidAt = paidAtRaw && Number.isFinite(Date.parse(paidAtRaw)) ? new Date(paidAtRaw).toISOString() : new Date().toISOString();
      const { error } = await supabaseAdmin.rpc('credit_doku_topup_once', {
        p_merchant_ref_id: row.merchant_ref_id,
        p_invoice: row.invoice || row.merchant_ref_id,
        p_paid_amount: row.amount,
        p_paid_at: paidAt,
        p_is_sandbox: Boolean(row.is_sandbox)
      });
      if (error) {
        console.error('[history-sync] credit_doku_topup_once failed:', { ref: row.merchant_ref_id, message: error.message, code: error.code });
        return;
      }
      row.status = 'paid';
      row.paid_at = paidAt;
      console.info('[history-sync] reconciled paid topup:', row.merchant_ref_id);
      return;
    }

    if (isDokuTerminalFailureStatus(remoteStatus)) {
      const nextStatus = remoteStatus === 'EXPIRED' ? 'expired' : 'failed';
      const { error } = await supabaseAdmin.from('topups')
        .update({ status: nextStatus })
        .eq('merchant_ref_id', row.merchant_ref_id)
        .eq('status', 'pending');
      if (!error) {
        row.status = nextStatus;
      }
    }
  }));
}

export default async function handler(req, res) {
  if (!method(req, res, ['GET'])) return;
  try {
    const user = await auth(req);
    await enforceRateLimit(user.id, 'history', 40, 60);
    const [{ data: orders, error: oErr }, { data: topups, error: tErr }] = await Promise.all([
      supabaseAdmin.from('orders')
        .select('custom_order_id,provider_order_id,service_name,phone,amount,status,otp,has_receipt,can_cancel,expires_at,refund_eligible_at,cancel_requested_at,refunded_at,created_at')
        .eq('user_id', user.id).order('created_at', { ascending: false }).limit(50),
      supabaseAdmin.from('topups')
        .select('merchant_ref_id,invoice,amount,status,payment_link,qr_link,expires_at,is_sandbox,paid_at,created_at')
        .eq('user_id', user.id).order('created_at', { ascending: false }).limit(30)
    ]);
    if (oErr) throw oErr;
    if (tErr) throw tErr;

    const urlRef = new URL(req.url || '/', 'http://localhost').searchParams.get('ref');
    const preferredRef = /^GDO-[A-F0-9]{32}$/.test(String(urlRef || '').trim()) ? String(urlRef).trim() : null;
    await reconcilePendingTopups(topups || [], preferredRef);

    const enrichedTopups = await Promise.all((topups || []).map(async (row) => {
      const isPending = String(row.status || '').toLowerCase() === 'pending';
      const qrSource = isPending ? (row.qr_link || row.payment_link || '') : '';
      const qr_data_url = qrSource ? await generateQrDataUrl(qrSource).catch(() => null) : null;
      return {
        merchant_ref_id: row.merchant_ref_id,
        amount: row.amount,
        status: row.status,
        payment_link: row.payment_link,
        qr_link: row.qr_link,
        expires_at: row.expires_at,
        paid_at: row.paid_at,
        created_at: row.created_at,
        qr_data_url,
        is_direct_qris: Boolean(row.qr_link)
      };
    }));
    json(res, 200, { orders, topups: enrichedTopups });
  } catch (e) {
    json(res, e.status || 500, { error: (e.status && e.status < 500) ? e.message : 'Layanan sementara tidak tersedia. Coba lagi.' });
  }
}
