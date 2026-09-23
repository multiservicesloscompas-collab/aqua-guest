import { describe, expect, it } from 'vitest';
import { resolveSplitFormHydrationState } from './paymentSplitFormHydration';

const canonicalChangeSplits = [
  {
    method: 'divisa' as const,
    amountBs: 4250,
    amountUsd: 5,
    kind: 'payment' as const,
  },
  {
    method: 'divisa' as const,
    amountBs: -3400,
    amountUsd: -4,
    kind: 'change' as const,
  },
  {
    method: 'efectivo' as const,
    amountBs: -250,
    amountUsd: -0.29,
    kind: 'change' as const,
  },
];

describe('resolveSplitFormHydrationState — divisa payment with change', () => {
  it('hydrates as a single (non-mixed) divisa payment with a populated changeState summary', () => {
    const state = resolveSplitFormHydrationState({
      paymentMethod: 'divisa',
      paymentSplits: canonicalChangeSplits,
      totalBs: 600,
    });

    expect(state.isMixedPayment).toBe(false);
    expect(state.paymentMethod).toBe('divisa');
    expect(state.split1Amount).toBe('');
    expect(state.changeState).toEqual({
      tenderedUsd: 5,
      changeUsd: 4,
      remainderBs: 250,
      remainderMethod: 'efectivo',
    });
  });

  it('does not run the tip-unwind filter on change splits — the change legs survive untouched', () => {
    // If the tip-unwind guard were absent, this would filter out the two
    // negative legs (amountBs <= 0.01) and destroy the change record.
    const state = resolveSplitFormHydrationState({
      paymentMethod: 'divisa',
      paymentSplits: canonicalChangeSplits,
      totalBs: 600,
      tipAmountBs: 40,
      tipPaymentMethod: 'efectivo',
    });

    expect(state.changeState).toEqual({
      tenderedUsd: 5,
      changeUsd: 4,
      remainderBs: 250,
      remainderMethod: 'efectivo',
    });
  });

  it('omits changeState for an ordinary mixed payment', () => {
    const state = resolveSplitFormHydrationState({
      paymentMethod: 'efectivo',
      paymentSplits: [
        { method: 'efectivo', amountBs: 60, amountUsd: 1.2 },
        { method: 'pago_movil', amountBs: 40, amountUsd: 0.8 },
      ],
      totalBs: 100,
    });

    expect(state.changeState).toBeUndefined();
  });
});
