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

  describe('Tip Hydration Scenarios (SDD Specs)', () => {
    it('Escenario 1: Pago único sin propina', () => {
      const state = resolveSplitFormHydrationState({
        paymentMethod: 'efectivo',
        paymentSplits: [{ method: 'efectivo', amountBs: 100, amountUsd: 2 }],
        totalBs: 100,
        tipAmountBs: 0,
      });
      expect(state.isMixedPayment).toBe(false);
      expect(state.paymentMethod).toBe('efectivo');
      expect(state.split1Amount).toBe('');
    });

    it('Escenario 2: Pago único con propina en método diferente', () => {
      const state = resolveSplitFormHydrationState({
        paymentMethod: 'efectivo',
        paymentSplits: [
          { method: 'efectivo', amountBs: 100, amountUsd: 2 },
          { method: 'pago_movil', amountBs: 20, amountUsd: 0.4 },
        ],
        totalBs: 120,
        tipAmountBs: 20,
        tipPaymentMethod: 'pago_movil',
      });
      expect(state.isMixedPayment).toBe(false);
      expect(state.paymentMethod).toBe('efectivo');
      expect(state.split1Amount).toBe('');
    });

    it('Escenario 3: Pago mixto real sin propina', () => {
      const state = resolveSplitFormHydrationState({
        paymentMethod: 'pago_movil',
        paymentSplits: [
          { method: 'efectivo', amountBs: 60, amountUsd: 1.2 },
          { method: 'pago_movil', amountBs: 40, amountUsd: 0.8 },
        ],
        totalBs: 100,
      });
      expect(state.isMixedPayment).toBe(true);
      expect(state.paymentMethod).toBe('efectivo');
      expect(state.split1Amount).toBe('40');
      expect(state.split2Method).toBe('pago_movil');
    });

    it('Escenario 4: Pago mixto con propina en un tercer método de pago', () => {
      const state = resolveSplitFormHydrationState({
        paymentMethod: 'efectivo',
        paymentSplits: [
          { method: 'efectivo', amountBs: 60, amountUsd: 1.2 },
          { method: 'punto_venta', amountBs: 40, amountUsd: 0.8 },
          { method: 'pago_movil', amountBs: 15, amountUsd: 0.3 },
        ],
        totalBs: 115,
        tipAmountBs: 15,
        tipPaymentMethod: 'pago_movil',
      });
      expect(state.isMixedPayment).toBe(true);
      expect(state.paymentMethod).toBe('efectivo');
      expect(state.split1Amount).toBe('40');
      expect(state.split2Method).toBe('punto_venta');
    });

    it('Escenario 5: Pago mixto con propina en el mismo método que el split secundario', () => {
      const state = resolveSplitFormHydrationState({
        paymentMethod: 'efectivo',
        paymentSplits: [
          { method: 'efectivo', amountBs: 60, amountUsd: 1.2 },
          { method: 'pago_movil', amountBs: 55, amountUsd: 1.1 },
        ],
        totalBs: 115,
        tipAmountBs: 15,
        tipPaymentMethod: 'pago_movil',
      });
      expect(state.isMixedPayment).toBe(true);
      expect(state.paymentMethod).toBe('efectivo');
      expect(state.split1Amount).toBe('40');
      expect(state.split2Method).toBe('pago_movil');
    });
  });
});
