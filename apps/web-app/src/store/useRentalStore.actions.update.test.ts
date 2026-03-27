import { beforeEach, describe, expect, it, vi } from 'vitest';
import { updateRentalAction } from './useRentalStore.actions.update';
import type { RentalState } from './useRentalStore.core';

const { replaceRentalSplitsMock, invalidateCacheMock } = vi.hoisted(() => ({
  replaceRentalSplitsMock: vi.fn(),
  invalidateCacheMock: vi.fn(),
}));

vi.mock('./useRentalStore.supabase', () => ({
  replaceRentalSplits: replaceRentalSplitsMock,
}));

vi.mock('@/services/RentalsDataService', () => ({
  rentalsDataService: {
    invalidateCache: invalidateCacheMock,
  },
}));

vi.mock('@/lib/supabaseClient', () => ({
  default: {
    from: vi.fn(() => ({
      update: vi.fn(() => ({
        eq: vi.fn().mockResolvedValue({ error: null }),
      })),
    })),
  },
}));

function buildState(): RentalState {
  return {
    rentals: [
      {
        id: 'rental-1',
        date: '2026-03-07',
        customerId: 'customer-1',
        customerName: 'Cliente Uno',
        customerPhone: '0414',
        customerAddress: 'Centro',
        machineId: 'machine-1',
        shift: 'medio',
        deliveryTime: '09:00',
        pickupTime: '13:00',
        pickupDate: '2026-03-07',
        deliveryFee: 1,
        totalUsd: 2,
        paymentMethod: 'efectivo',
        paymentSplits: [
          {
            method: 'efectivo',
            amountBs: 100,
            amountUsd: 2,
            exchangeRateUsed: 50,
          },
        ],
        status: 'agendado',
        isPaid: true,
        datePaid: '2026-03-07',
        notes: undefined,
        createdAt: '2026-03-07T12:00:00.000Z',
        updatedAt: '2026-03-07T12:00:00.000Z',
      },
    ],
    loadingRentalsByRange: {},
    addRental: vi.fn(),
    updateRental: vi.fn(),
    deleteRental: vi.fn(),
    getRentalsByDate: vi.fn(),
    getActiveRentalsForDate: vi.fn(),
    loadRentalsByDate: vi.fn(),
    loadRentalsByDateRange: vi.fn(),
  };
}

describe('updateRentalAction tip-aware recomputation guard', () => {
  beforeEach(() => {
    replaceRentalSplitsMock.mockReset();
    invalidateCacheMock.mockReset();

    Object.defineProperty(globalThis, 'navigator', {
      configurable: true,
      value: { onLine: false },
    });
  });

  it('keeps explicit totals and explicit splits when tipInput is provided', async () => {
    let state = buildState();
    const setState = vi.fn((partial) => {
      const next = typeof partial === 'function' ? partial(state) : partial;
      state = { ...state, ...next };
    });
    const getState = () => state;

    await updateRentalAction(
      'rental-1',
      {
        paymentMethod: 'pago_movil',
        totalUsd: 3,
        paymentSplits: [
          {
            method: 'pago_movil',
            amountBs: 90,
            amountUsd: 1.8,
            exchangeRateUsed: 50,
          },
          {
            method: 'efectivo',
            amountBs: 60,
            amountUsd: 1.2,
            exchangeRateUsed: 50,
          },
        ],
      },
      {
        amountBs: 50,
        capturePaymentMethod: 'efectivo',
      },
      setState,
      getState
    );

    const updated = state.rentals[0];
    expect(updated.totalUsd).toBe(3);
    expect(updated.paymentSplits).toEqual([
      {
        method: 'pago_movil',
        amountBs: 90,
        amountUsd: 1.8,
        exchangeRateUsed: 50,
      },
      {
        method: 'efectivo',
        amountBs: 60,
        amountUsd: 1.2,
        exchangeRateUsed: 50,
      },
    ]);
    expect(replaceRentalSplitsMock).not.toHaveBeenCalled();
  });
});
