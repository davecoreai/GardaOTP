import test from 'node:test';
import assert from 'node:assert/strict';
import { balanceDisplay, formatBalanceParts } from '../lib/balance-format.js';

test('balance formatting separates Rp prefix from numeric amount', () => {
  const result = formatBalanceParts(125000);
  assert.equal(result.currency, 'Rp');
  assert.equal(result.amount, '125.000');
});

test('hiding balance masks only the numeric amount and preserves Rp', () => {
  const result = balanceDisplay(125000, true);
  assert.equal(result.currency, 'Rp');
  assert.equal(result.amount, '•••••');
  assert.equal(result.ariaLabel, 'Saldo disembunyikan');
});

test('showing balance restores numeric amount and accessible label', () => {
  const result = balanceDisplay(125000, false);
  assert.equal(result.currency, 'Rp');
  assert.equal(result.amount, '125.000');
  assert.equal(result.ariaLabel, 'Rp 125.000');
});

test('invalid balance values safely render as zero', () => {
  assert.equal(formatBalanceParts(Number.NaN).amount, '0');
});
