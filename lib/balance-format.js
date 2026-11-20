export function formatBalanceParts(value) {
  const amount = Number(value ?? 0);
  const safeAmount = Number.isFinite(amount) ? amount : 0;
  const parts = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).formatToParts(safeAmount);
  return {
    currency: parts.find(part => part.type === 'currency')?.value || 'Rp',
    amount: parts.filter(part => part.type !== 'currency').map(part => part.value).join('').trim()
  };
}

export function balanceDisplay(value, hidden = false) {
  const parts = formatBalanceParts(value);
  return {
    currency: parts.currency,
    amount: hidden ? '•••••' : parts.amount,
    ariaLabel: hidden ? 'Saldo disembunyikan' : `${parts.currency} ${parts.amount}`
  };
}
