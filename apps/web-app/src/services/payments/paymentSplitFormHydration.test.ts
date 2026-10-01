import { describe, expect, it } from 'vitest';
import type { PaymentMethod } from '@/types';
import { resolveSplitFormHydrationState } from './paymentSplitFormHydration';

describe('resolveSplitFormHydrationState', () => {
  it('prefills secondary amount from dominant split when legacy method mismatches', () => {
    const state = resolveSplitFormHydrationState({
      paymentMethod: 'efectivo',
      paymentSplits: [
        { method: 'pago_movil', amountBs: 140, amountUsd: 2.8 },
        { method: 'efectivo', amountBs: 60, amountUsd: 1.2 },
      ],
      totalBs: 200,
    });

    expect(state.paymentMethod).toBe('pago_movil');
    expect(state.split1Amount).toBe('60');
    expect(state.split2Method).toBe('efectivo');
    expect(state.isMixedPayment).toBe(true);
  });

  it('keeps the secondary amount empty for non-mixed fallback state', () => {
    const state = resolveSplitFormHydrationState({
      paymentMethod: 'punto_venta',
      paymentSplits: [{ method: 'punto_venta', amountBs: 200, amountUsd: 4 }],
      totalBs: 200,
    });

    expect(state.paymentMethod).toBe('punto_venta');
    expect(state.split1Amount).toBe('');
    expect(state.split2Method).toBe('efectivo');
    expect(state.isMixedPayment).toBe(false);
  });

  it('uses fallback primary method when splits are absent', () => {
    const state = resolveSplitFormHydrationState({
      paymentMethod: 'efectivo',
      totalBs: 75,
    });

    expect(state.paymentMethod).toBe('efectivo');
    expect(state.split1Amount).toBe('');
    expect(state.split2Method).toBe('pago_movil');
    expect(state.isMixedPayment).toBe(false);
  });

  it('stays consistent across modules with same split payload', () => {
    const method: PaymentMethod = 'divisa';
    const splits = [
      { method: 'divisa' as const, amountBs: 90, amountUsd: 1.8 },
      { method: 'pago_movil' as const, amountBs: 110, amountUsd: 2.2 },
    ];

    const salesState = resolveSplitFormHydrationState({
      paymentMethod: method,
      paymentSplits: splits,
      totalBs: 200,
    });

    const rentalsState = resolveSplitFormHydrationState({
      paymentMethod: method,
      paymentSplits: splits,
      totalBs: 200,
    });

    expect(rentalsState).toEqual(salesState);
    expect(salesState.paymentMethod).toBe('pago_movil');
    expect(salesState.split1Amount).toBe('90');
    expect(salesState.split2Method).toBe('divisa');
    expect(salesState.isMixedPayment).toBe(true);
  });

  it('hydrates a sale paid in efectivo with a pago movil tip as non-mixed efectivo (B3)', () => {
    // Arrange: stored splits include the tip on its capture method
    const input = {
      paymentMethod: 'efectivo' as PaymentMethod,
      paymentSplits: [
        { method: 'efectivo' as const, amountBs: 1000, amountUsd: 20 },
        { method: 'pago_movil' as const, amountBs: 200, amountUsd: 4 },
      ],
      totalBs: 1200,
      tip: { amountBs: 200, paymentMethod: 'pago_movil' as PaymentMethod },
    };

    // Act
    const state = resolveSplitFormHydrationState(input);

    // Assert
    expect(state.isMixedPayment).toBe(false);
    expect(state.paymentMethod).toBe('efectivo');
    expect(state.split1Amount).toBe('');
  });

  it('keeps a mixed principal mixed after removing the tip (B3)', () => {
    const state = resolveSplitFormHydrationState({
      paymentMethod: 'efectivo',
      paymentSplits: [
        { method: 'efectivo', amountBs: 700, amountUsd: 14 },
        { method: 'pago_movil', amountBs: 500, amountUsd: 10 },
      ],
      totalBs: 1200,
      tip: { amountBs: 200, paymentMethod: 'pago_movil' },
    });

    expect(state.isMixedPayment).toBe(true);
    expect(state.paymentMethod).toBe('efectivo');
    expect(state.split1Amount).toBe('300');
    expect(state.split2Method).toBe('pago_movil');
  });

  it('does not change the result when no tip is given', () => {
    const state = resolveSplitFormHydrationState({
      paymentMethod: 'efectivo',
      paymentSplits: [
        { method: 'efectivo', amountBs: 1000, amountUsd: 20 },
        { method: 'pago_movil', amountBs: 200, amountUsd: 4 },
      ],
      totalBs: 1200,
    });

    expect(state.isMixedPayment).toBe(true);
    expect(state.split1Amount).toBe('200');
  });
});
