const TERMINAL_NO_OTP_STATUSES = new Set(['cancelled', 'canceled', 'expired']);

export function normalizeOrderStatus(value) {
  return String(value || 'pending').toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 32) || 'pending';
}

export function normalizeOtpCode(value) {
  if (typeof value === 'string') return value.trim() || null;
  if (value && typeof value === 'object') return String(value.code ?? value.otp ?? '').trim() || null;
  return null;
}

export function orderHasReceipt(snapshot = {}) {
  return snapshot.has_receipt === true || Boolean(normalizeOtpCode(snapshot.otp)) || Boolean(snapshot.completed_at);
}

export function providerSnapshotAllowsRefund(snapshot = {}) {
  const status = normalizeOrderStatus(snapshot.status);
  return TERMINAL_NO_OTP_STATUSES.has(status)
    && !normalizeOtpCode(snapshot.otp)
    && snapshot.has_receipt !== true
    && !snapshot.completed_at;
}
