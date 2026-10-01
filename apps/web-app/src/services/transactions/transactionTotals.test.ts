import { describe, expect, it } from 'vitest';
import {
  calculateFinalRentalTotals,
  calculateFinalSaleTotals,
  deriveRentalTipAmountBs,
  deriveSaleTipAmountBs,
  mergeTipIntoPaymentSplits,
  removeTipFromPaymentSplits,
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

describe('removeTipFromPaymentSplits (inverse of mergeTipIntoPaymentSplits)', () => {
  it('drops the split that only held the tip', () => {
    // Arrange
    const splits = [
      { method: 'efectivo' as const, amountBs: 1000, amountUsd: 20 },
      { method: 'pago_movil' as const, amountBs: 200, amountUsd: 4 },
    ];

    // Act
    const result = removeTipFromPaymentSplits({
      paymentSplits: splits,
      tipAmountBs: 200,
      tipPaymentMethod: 'pago_movil',
    });

    // Assert
    expect(result).toEqual([
      { method: 'efectivo', amountBs: 1000, amountUsd: 20 },
    ]);
  });

  it('reduces the split when the tip shares the payment method', () => {
    const result = removeTipFromPaymentSplits({
      paymentSplits: [
        { method: 'efectivo', amountBs: 700, amountUsd: 14 },
        { method: 'pago_movil', amountBs: 500, amountUsd: 10 },
      ],
      tipAmountBs: 200,
      tipPaymentMethod: 'pago_movil',
    });

    expect(result).toEqual([
      { method: 'efectivo', amountBs: 700, amountUsd: 14 },
      { method: 'pago_movil', amountBs: 300, amountUsd: 6 },
    ]);
  });

  it('is the exact inverse of mergeTipIntoPaymentSplits', () => {
    const principal = [
      { method: 'efectivo' as const, amountBs: 700, amountUsd: 14 },
      { method: 'pago_movil' as const, amountBs: 300, amountUsd: 6 },
    ];
    const merged = mergeTipIntoPaymentSplits({
      paymentSplits: principal,
      fallbackMethod: 'efectivo',
      tipAmountBs: 200,
      tipPaymentMethod: 'pago_movil',
      exchangeRate: 50,
      principalBs: 1000,
    });

    const result = removeTipFromPaymentSplits({
      paymentSplits: merged,
      tipAmountBs: 200,
      tipPaymentMethod: 'pago_movil',
    });

    expect(
      result.map(({ method, amountBs }) => ({ method, amountBs }))
    ).toEqual([
      { method: 'efectivo', amountBs: 700 },
      { method: 'pago_movil', amountBs: 300 },
    ]);
  });

  it('never leaves a negative amount when the tip is larger than the split', () => {
    const result = removeTipFromPaymentSplits({
      paymentSplits: [{ method: 'efectivo', amountBs: 100, amountUsd: 2 }],
      tipAmountBs: 150,
      tipPaymentMethod: 'efectivo',
    });

    expect(result).toEqual([]);
  });

  it('leaves the splits untouched when the tip method is not present', () => {
    const splits = [
      { method: 'efectivo' as const, amountBs: 100, amountUsd: 2 },
    ];

    const result = removeTipFromPaymentSplits({
      paymentSplits: splits,
      tipAmountBs: 50,
      tipPaymentMethod: 'pago_movil',
    });

    expect(result).toEqual(splits);
  });
});
