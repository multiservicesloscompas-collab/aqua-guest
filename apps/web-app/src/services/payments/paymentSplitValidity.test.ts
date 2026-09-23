import { describe, expect, it } from 'vitest';
import type { PaymentSplit } from '@aqua-guest/domain';
import {
  hasChangeSplits,
  hasPersistedPaymentSplits,
  hasValidMixedPaymentSplits,
} from './paymentSplitValidity';

const canonicalChangeSplits: PaymentSplit[] = [
  { method: 'divisa', amountBs: 4250, amountUsd: 5, kind: 'payment' },
  { method: 'divisa', amountBs: -3400, amountUsd: -4, kind: 'change' },
  { method: 'efectivo', amountBs: -250, amountUsd: -0.29, kind: 'change' },
];

const legacyMixedSplits: PaymentSplit[] = [
  { method: 'efectivo', amountBs: 300 },
  { method: 'pago_movil', amountBs: 300 },
];

describe('hasValidMixedPaymentSplits', () => {
  it('returns false for a divisa payment with change — it is not a mixed payment', () => {
    expect(hasValidMixedPaymentSplits(canonicalChangeSplits)).toBe(false);
  });

  it('returns true for an ordinary two-method mixed payment (unchanged behavior)', () => {
    expect(hasValidMixedPaymentSplits(legacyMixedSplits)).toBe(true);
  });

  it('returns false for fewer than two splits', () => {
    expect(
      hasValidMixedPaymentSplits([{ method: 'efectivo', amountBs: 100 }])
    ).toBe(false);
  });

  it('returns false when splits are undefined', () => {
    expect(hasValidMixedPaymentSplits(undefined)).toBe(false);
  });

  it('returns false when a payment-kind split has a non-positive amount', () => {
    expect(
      hasValidMixedPaymentSplits([
        { method: 'efectivo', amountBs: 0 },
        { method: 'pago_movil', amountBs: 300 },
      ])
    ).toBe(false);
  });
});

describe('hasPersistedPaymentSplits', () => {
  it('returns true for a divisa-with-change record (attribution must see all rows)', () => {
    expect(hasPersistedPaymentSplits(canonicalChangeSplits)).toBe(true);
  });

  it('returns true for an ordinary mixed payment', () => {
    expect(hasPersistedPaymentSplits(legacyMixedSplits)).toBe(true);
  });

  it('returns true for a single legacy split', () => {
    expect(
      hasPersistedPaymentSplits([{ method: 'efectivo', amountBs: 100 }])
    ).toBe(true);
  });

  it('returns false when splits are undefined or empty', () => {
    expect(hasPersistedPaymentSplits(undefined)).toBe(false);
    expect(hasPersistedPaymentSplits([])).toBe(false);
  });

  it('returns false for an invalid method', () => {
    expect(
      hasPersistedPaymentSplits([
        { method: 'otro' as never, amountBs: 100 },
      ])
    ).toBe(false);
  });
});

describe('hasChangeSplits', () => {
  it('detects an explicit kind: change row', () => {
    expect(hasChangeSplits(canonicalChangeSplits)).toBe(true);
  });

  it('detects a legacy negative row with no kind field', () => {
    expect(
      hasChangeSplits([
        { method: 'divisa', amountBs: 4250 },
        { method: 'efectivo', amountBs: -250 },
      ])
    ).toBe(true);
  });

  it('is false for an ordinary mixed payment', () => {
    expect(hasChangeSplits(legacyMixedSplits)).toBe(false);
  });

  it('is false when splits are undefined', () => {
    expect(hasChangeSplits(undefined)).toBe(false);
  });
});
