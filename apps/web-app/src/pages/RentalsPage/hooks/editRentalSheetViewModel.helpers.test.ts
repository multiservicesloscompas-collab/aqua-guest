import { describe, expect, it } from 'vitest';
import type { WasherRental } from '@/types';
import { resolveRentalSplitState } from './editRentalSheetViewModel.helpers';

function buildRental(overrides: Partial<WasherRental> = {}): WasherRental {
  return {
    id: 'rental-1',
    date: '2026-03-15',
    customerId: 'customer-1',
    customerName: 'Cliente',
    customerPhone: '0414',
    customerAddress: 'Centro',
    machineId: 'machine-1',
    shift: 'medio',
    deliveryTime: '09:00',
    pickupTime: '13:00',
    pickupDate: '2026-03-15',
    deliveryFee: 0,
    totalUsd: 4.2,
    paymentMethod: 'efectivo',
    status: 'agendado',
    isPaid: true,
    createdAt: '2026-03-15T08:00:00.000Z',
    updatedAt: '2026-03-15T08:00:00.000Z',
    ...overrides,
  };
}

describe('resolveRentalSplitState', () => {
  it('hydrates a rental paid in efectivo with a pago movil tip as non-mixed efectivo (B3b)', () => {
    // Arrange: stored splits include the tip on its capture method
    const rental = buildRental({
      paymentSplits: [
        { method: 'efectivo', amountBs: 4000, amountUsd: 4 },
        { method: 'pago_movil', amountBs: 200, amountUsd: 0.2 },
      ],
    });

    // Act
    const state = resolveRentalSplitState(rental, 1000, {
      amountBs: 200,
      paymentMethod: 'pago_movil',
    });

    // Assert
    expect(state.isMixedPayment).toBe(false);
    expect(state.paymentMethod).toBe('efectivo');
    expect(state.split1Amount).toBe('');
  });

  it('keeps a mixed principal mixed after removing the tip (B3b)', () => {
    const rental = buildRental({
      paymentSplits: [
        { method: 'efectivo', amountBs: 2800, amountUsd: 2.8 },
        { method: 'pago_movil', amountBs: 1400, amountUsd: 1.4 },
      ],
    });

    const state = resolveRentalSplitState(rental, 1000, {
      amountBs: 200,
      paymentMethod: 'pago_movil',
    });

    expect(state.isMixedPayment).toBe(true);
    expect(state.paymentMethod).toBe('efectivo');
    expect(state.split1Amount).toBe('1200');
    expect(state.split2Method).toBe('pago_movil');
  });

  it('keeps the stored splits as they are when no tip is given', () => {
    const rental = buildRental({
      paymentSplits: [
        { method: 'efectivo', amountBs: 4000, amountUsd: 4 },
        { method: 'pago_movil', amountBs: 200, amountUsd: 0.2 },
      ],
    });

    const state = resolveRentalSplitState(rental, 1000);

    expect(state.isMixedPayment).toBe(true);
    expect(state.split1Amount).toBe('200');
  });
});
