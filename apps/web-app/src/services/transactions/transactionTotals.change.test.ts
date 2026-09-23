import { describe, expect, it } from 'vitest';
import type { PaymentSplit } from '@aqua-guest/domain';
import { mergeTipIntoPaymentSplits } from './transactionTotals';

const changeSplits: PaymentSplit[] = [
  { method: 'divisa', amountBs: 4250, amountUsd: 5, kind: 'payment' },
  { method: 'divisa', amountBs: -3400, amountUsd: -4, kind: 'change' },
  { method: 'efectivo', amountBs: -250, amountUsd: -0.29, kind: 'change' },
];

describe('mergeTipIntoPaymentSplits — divisa-with-change bypass', () => {
  it('returns change splits untouched instead of merging the tip into a leg', () => {
    // The tendered amount is physically fixed by the bills handed over — a
    // tip must never inflate it. If this guard were absent, a Bs 100 tip
    // captured on the divisa method would add to the +4250 tendered leg,
    // recording a physically impossible cash amount.
    const result = mergeTipIntoPaymentSplits({
      paymentSplits: changeSplits,
      fallbackMethod: 'divisa',
      tipAmountBs: 100,
      tipPaymentMethod: 'divisa',
      exchangeRate: 850,
      principalBs: 600,
    });

    expect(result).toEqual(changeSplits);
  });

  it('returns change splits untouched even when the tip method is the Bs remainder leg', () => {
    const result = mergeTipIntoPaymentSplits({
      paymentSplits: changeSplits,
      fallbackMethod: 'divisa',
      tipAmountBs: 40,
      tipPaymentMethod: 'efectivo',
      exchangeRate: 850,
      principalBs: 600,
    });

    expect(result).toEqual(changeSplits);
  });

  it('keeps merging the tip normally when there are no change splits (unchanged behavior)', () => {
    const ordinarySplits: PaymentSplit[] = [
      { method: 'efectivo', amountBs: 300 },
      { method: 'pago_movil', amountBs: 300 },
    ];

    const result = mergeTipIntoPaymentSplits({
      paymentSplits: ordinarySplits,
      fallbackMethod: 'efectivo',
      tipAmountBs: 50,
      tipPaymentMethod: 'efectivo',
      exchangeRate: 850,
      principalBs: 600,
    });

    expect(result.find((s) => s.method === 'efectivo')?.amountBs).toBe(350);
  });
});
