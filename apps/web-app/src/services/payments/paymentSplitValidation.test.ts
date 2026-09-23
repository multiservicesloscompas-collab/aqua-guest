import { describe, expect, it } from 'vitest';
import type { PaymentSplit } from '@aqua-guest/domain';
import { validatePaymentSplits } from './paymentSplitValidation';

const canonicalChangeSplits: PaymentSplit[] = [
  { method: 'divisa', amountBs: 4250, amountUsd: 5, kind: 'payment' },
  { method: 'divisa', amountBs: -3400, amountUsd: -4, kind: 'change' },
  { method: 'efectivo', amountBs: -250, amountUsd: -0.29, kind: 'change' },
];

describe('validatePaymentSplits — sign checks', () => {
  it('characterizes today’s behavior: a negative amountBs with no kind is rejected', () => {
    const result = validatePaymentSplits({
      splits: [{ method: 'efectivo', amountBs: -100 }],
      totalBs: -100,
    });

    expect(result.ok).toBe(false);
    expect(result.errors[0]).toContain('Monto Bs negativo');
  });

  it('accepts a kind: change split with a negative amount', () => {
    const result = validatePaymentSplits({
      splits: [{ method: 'efectivo', amountBs: -250, kind: 'change' }],
      totalBs: -250,
    });

    expect(result.ok).toBe(true);
  });

  it('rejects a kind: change split with a positive amount', () => {
    const result = validatePaymentSplits({
      splits: [{ method: 'efectivo', amountBs: 250, kind: 'change' }],
      totalBs: 250,
    });

    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.includes('vuelto'))).toBe(true);
  });

  it('still rejects a kind: payment split with a negative amount', () => {
    const result = validatePaymentSplits({
      splits: [{ method: 'efectivo', amountBs: -100, kind: 'payment' }],
      totalBs: -100,
    });

    expect(result.ok).toBe(false);
  });

  it('applies the same sign rules to amountUsd', () => {
    const rejectPositiveChangeUsd = validatePaymentSplits({
      splits: [
        {
          method: 'efectivo',
          amountBs: -250,
          amountUsd: 0.29,
          kind: 'change',
        },
      ],
      totalBs: -250,
    });
    expect(rejectPositiveChangeUsd.ok).toBe(false);

    const acceptNegativeChangeUsd = validatePaymentSplits({
      splits: [
        {
          method: 'efectivo',
          amountBs: -250,
          amountUsd: -0.29,
          kind: 'change',
        },
      ],
      totalBs: -250,
    });
    expect(acceptNegativeChangeUsd.ok).toBe(true);
  });

  it('passes the canonical divisa-with-change set (sum and signs all valid)', () => {
    const result = validatePaymentSplits({
      splits: canonicalChangeSplits,
      totalBs: 600,
      totalUsd: 0.71,
    });

    expect(result.ok).toBe(true);
  });
});

describe('validatePaymentSplits — allowedKinds (Expenses isolation)', () => {
  it('rejects any change row when allowedKinds is restricted to payment', () => {
    const result = validatePaymentSplits({
      splits: [
        { method: 'efectivo', amountBs: 100, kind: 'payment' },
        { method: 'pago_movil', amountBs: -20, kind: 'change' },
      ],
      totalBs: 80,
      allowedKinds: ['payment'],
    });

    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.includes('vuelto'))).toBe(true);
  });

  it('accepts an all-payment split set when allowedKinds is restricted', () => {
    const result = validatePaymentSplits({
      splits: [
        { method: 'efectivo', amountBs: 40 },
        { method: 'pago_movil', amountBs: 60 },
      ],
      totalBs: 100,
      allowedKinds: ['payment'],
    });

    expect(result.ok).toBe(true);
  });

  it('defaults to allowing both kinds when allowedKinds is omitted', () => {
    const result = validatePaymentSplits({
      splits: canonicalChangeSplits,
      totalBs: 600,
    });

    expect(result.ok).toBe(true);
  });
});
