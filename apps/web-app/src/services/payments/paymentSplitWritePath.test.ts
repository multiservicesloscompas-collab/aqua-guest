import { describe, expect, it } from 'vitest';
import type { PaymentSplit } from '@aqua-guest/domain';
import {
  buildDualPaymentSplits,
  preparePaymentWritePayload,
} from './paymentSplitWritePath';
import type { PaymentMethod } from '@/types';

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
            method: 'otro' as unknown as PaymentMethod,
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

  it('accepts a divisa payment with change (negative splits) and keeps divisa as the legacy method', () => {
    const payload = preparePaymentWritePayload({
      paymentMethod: 'divisa',
      paymentSplits: [
        {
          method: 'divisa',
          amountBs: 4250,
          amountUsd: 5,
          exchangeRateUsed: 850,
          kind: 'payment',
        },
        {
          method: 'divisa',
          amountBs: -3400,
          amountUsd: -4,
          exchangeRateUsed: 850,
          kind: 'change',
        },
        {
          method: 'efectivo',
          amountBs: -250,
          amountUsd: -0.29,
          exchangeRateUsed: 850,
          kind: 'change',
        },
      ],
      totalBs: 600,
      totalUsd: 0.71,
      exchangeRate: 850,
    });

    expect(payload.validation.ok).toBe(true);
    expect(payload.paymentMethod).toBe('divisa');
    expect(payload.paymentSplits).toHaveLength(3);

    const sumBs = payload.paymentSplits.reduce((s, x) => s + x.amountBs, 0);
    expect(sumBs).toBe(600);
  });

  it('lands a forced USD rounding residual on the non-divisa change leg for a divisa-with-change payload', () => {
    const payload = preparePaymentWritePayload({
      paymentMethod: 'divisa',
      paymentSplits: [
        {
          method: 'divisa',
          amountBs: 4250,
          amountUsd: 5,
          exchangeRateUsed: 850,
          kind: 'payment',
        },
        {
          method: 'divisa',
          amountBs: -3400,
          amountUsd: -4,
          exchangeRateUsed: 850,
          kind: 'change',
        },
        {
          method: 'efectivo',
          amountBs: -250,
          amountUsd: -0.29,
          exchangeRateUsed: 850,
          kind: 'change',
        },
      ],
      totalBs: 600,
      // Force a 0.01 USD residual against the splits' own sum of 0.71.
      totalUsd: 0.72,
      exchangeRate: 850,
    });

    const tendered = payload.paymentSplits.find(
      (s) => s.method === 'divisa' && s.amountBs > 0
    );
    const divisaChange = payload.paymentSplits.find(
      (s) => s.method === 'divisa' && s.amountBs < 0
    );
    const remainder = payload.paymentSplits.find(
      (s) => s.method === 'efectivo'
    );

    expect(tendered?.amountUsd).toBe(5);
    expect(divisaChange?.amountUsd).toBe(-4);
    expect(remainder?.amountUsd).toBe(-0.28);
  });
});
