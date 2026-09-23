import { describe, expect, it } from 'vitest';
import { isChangeSplit, resolveSplitKind } from '../payments';
import type { PaymentSplit } from '../payments';

describe('resolveSplitKind', () => {
  it('defaults to payment when kind is absent (pre-existing rows)', () => {
    const split: PaymentSplit = { method: 'efectivo', amountBs: 100 };
    expect(resolveSplitKind(split)).toBe('payment');
  });

  it('returns the explicit kind when present', () => {
    const split: PaymentSplit = {
      method: 'efectivo',
      amountBs: -250,
      kind: 'change',
    };
    expect(resolveSplitKind(split)).toBe('change');
  });
});

describe('isChangeSplit', () => {
  it('is true when kind is explicitly change', () => {
    expect(
      isChangeSplit({ method: 'divisa', amountBs: -3400, kind: 'change' })
    ).toBe(true);
  });

  it('is false when kind is explicitly payment, even if amountBs is 0', () => {
    expect(
      isChangeSplit({ method: 'divisa', amountBs: 0, kind: 'payment' })
    ).toBe(false);
  });

  it('falls back to the sign of amountBs when kind is absent (legacy rows)', () => {
    expect(isChangeSplit({ method: 'efectivo', amountBs: -250 })).toBe(true);
    expect(isChangeSplit({ method: 'efectivo', amountBs: 250 })).toBe(false);
  });
});
