import { describe, expect, it } from 'vitest';
import {
  calculateFinalRentalTotals,
  calculateFinalSaleTotals,
  deriveRentalTipAmountBs,
  deriveSaleTipAmountBs,
  mergeTipIntoPaymentSplits,
} from './transactionTotals';

describe('transactionTotals invariants', () => {
  it('calculates sale total as principal + tip', () => {
    const result = calculateFinalSaleTotals({
      principalBs: 200,
      tipAmountBs: 50,
      exchangeRate: 50,
    });

    expect(result.principalBs).toBe(200);
    expect(result.tipAmountBs).toBe(50);
    expect(result.totalBs).toBe(250);
    expect(result.totalUsd).toBe(5);
  });

  it('calculates rental total as principal USD + tip converted to USD', () => {
    const result = calculateFinalRentalTotals({
      principalUsd: 4,
      tipAmountBs: 50,
      exchangeRate: 50,
    });

    expect(result.principalUsd).toBe(4);
    expect(result.tipAmountBs).toBe(50);
    expect(result.totalUsd).toBe(5);
  });

  it('derives tip from persisted final and principal totals', () => {
    expect(deriveSaleTipAmountBs(250, 200)).toBe(50);
    expect(deriveRentalTipAmountBs(5, 4, 50)).toBe(50);
  });

  it('merges tip amount into existing split method', () => {
    const result = mergeTipIntoPaymentSplits({
      paymentSplits: [
        {
          method: 'efectivo',
          amountBs: 200,
          amountUsd: 4,
          exchangeRateUsed: 50,
        },
      ],
      fallbackMethod: 'efectivo',
      tipAmountBs: 50,
      tipPaymentMethod: 'efectivo',
      exchangeRate: 50,
    });

    expect(result).toEqual([
      {
        method: 'efectivo',
        amountBs: 250,
        amountUsd: 5,
        exchangeRateUsed: 50,
      },
    ]);
  });

  it('adds tip as new split method when missing', () => {
    const result = mergeTipIntoPaymentSplits({
      paymentSplits: [
        {
          method: 'pago_movil',
          amountBs: 200,
          amountUsd: 4,
          exchangeRateUsed: 50,
        },
      ],
      fallbackMethod: 'pago_movil',
      tipAmountBs: 50,
      tipPaymentMethod: 'efectivo',
      exchangeRate: 50,
    });

    expect(result).toEqual([
      {
        method: 'pago_movil',
        amountBs: 200,
        amountUsd: 4,
        exchangeRateUsed: 50,
      },
      {
        method: 'efectivo',
        amountBs: 50,
        amountUsd: 1,
        exchangeRateUsed: 50,
      },
    ]);
  });
});
