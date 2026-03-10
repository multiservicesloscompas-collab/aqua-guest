import { describe, expect, it } from 'vitest';
import {
  buildDualPaymentSplits,
  preparePaymentWritePayload,
} from './paymentSplitWritePath';
import type { PaymentSplit } from '@/types/paymentSplits';

describe('buildDualPaymentSplits', () => {
  it('returns single split when mixed payments are disabled', () => {
    const splits = buildDualPaymentSplits({
      enableMixedPayment: false,
      primaryMethod: 'efectivo',
      secondaryMethod: 'pago_movil',
      amountInput: '25',
      totalBs: 100,
      totalUsd: 2,
      exchangeRate: 50,
    });

    expect(splits).toEqual([
      {
        method: 'efectivo',
        amountBs: 100,
        amountUsd: 2,
        exchangeRateUsed: 50,
      },
    ]);
  });

  it('falls back to single split when primary amount is empty', () => {
    const splits = buildDualPaymentSplits({
      enableMixedPayment: true,
      primaryMethod: 'pago_movil',
      secondaryMethod: 'efectivo',
      amountInput: '',
      totalBs: 150,
      totalUsd: 3,
      exchangeRate: 50,
    });

    expect(splits).toHaveLength(1);
    expect(splits[0]).toMatchObject({
      method: 'pago_movil',
      amountBs: 150,
      amountUsd: 3,
    });
  });

  it('builds and rounds dual splits preserving total', () => {
    const splits = buildDualPaymentSplits({
      enableMixedPayment: true,
      primaryMethod: 'efectivo',
      secondaryMethod: 'punto_venta',
      amountInput: '60.237',
      totalBs: 100,
      totalUsd: 2,
      exchangeRate: 50,
    });

    expect(splits).toEqual([
      {
        method: 'efectivo',
        amountBs: 60.24,
        amountUsd: 1.2,
        exchangeRateUsed: 50,
      },
      {
        method: 'punto_venta',
        amountBs: 39.76,
        amountUsd: 0.8,
        exchangeRateUsed: 50,
      },
    ]);

    expect(
      splits.reduce(
        (sum: number, split: PaymentSplit) => sum + split.amountBs,
        0
      )
    ).toBe(100);
  });

  it('computes primary as total minus secondary when amount mode is secondary', () => {
    const splits = buildDualPaymentSplits({
      enableMixedPayment: true,
      primaryMethod: 'pago_movil',
      secondaryMethod: 'efectivo',
      amountInput: '30',
      amountInputMode: 'secondary',
      totalBs: 100,
      totalUsd: 2,
      exchangeRate: 50,
    });

    expect(splits).toEqual([
      {
        method: 'pago_movil',
        amountBs: 70,
        amountUsd: 1.4,
        exchangeRateUsed: 50,
      },
      {
        method: 'efectivo',
        amountBs: 30,
        amountUsd: 0.6,
        exchangeRateUsed: 50,
      },
    ]);
  });
});

describe('preparePaymentWritePayload', () => {
  it('keeps legacy compatibility field aligned to dominant split', () => {
    const payload = preparePaymentWritePayload({
      paymentMethod: 'pago_movil',
      paymentSplits: [
        {
          method: 'efectivo',
          amountBs: 70,
          amountUsd: 1.4,
          exchangeRateUsed: 50,
        },
        {
          method: 'pago_movil',
          amountBs: 30,
          amountUsd: 0.6,
          exchangeRateUsed: 50,
        },
      ],
      totalBs: 100,
      totalUsd: 2,
      exchangeRate: 50,
    });

    expect(payload.paymentMethod).toBe('efectivo');
    expect(payload.paymentSplits).toHaveLength(2);
    expect(payload.validation.ok).toBe(true);
  });

  it('throws when split data is invalid', () => {
    expect(() =>
      preparePaymentWritePayload({
        paymentMethod: 'efectivo',
        paymentSplits: [
          {
            method: 'otro' as any,
            amountBs: 70,
            amountUsd: 1.4,
            exchangeRateUsed: 50,
          },
        ],
        totalBs: 100,
        totalUsd: 2,
        exchangeRate: 50,
      })
    ).toThrow();
  });
});
