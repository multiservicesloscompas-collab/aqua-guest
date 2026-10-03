import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  LEGACY_SHIFT_DEFINITIONS,
  RENTAL_SHIFT,
  type RentalShiftDefinition,
} from '@aqua-guest/domain';
import { useSyncStore } from './useSyncStore';
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

  it('adds the tip to the total and to the capture-method split when tipInput is provided (inputs are principal-only)', async () => {
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
    // Principal $3 (150 Bs) + tip 50 Bs ($1) = $4; tip lands on the efectivo split.
    expect(updated.totalUsd).toBe(4);
    expect(updated.paymentSplits).toEqual([
      {
        method: 'pago_movil',
        amountBs: 90,
        amountUsd: 1.8,
        exchangeRateUsed: 50,
      },
      {
        method: 'efectivo',
        amountBs: 110,
        amountUsd: 2.2,
        exchangeRateUsed: 50,
      },
    ]);
    expect(replaceRentalSplitsMock).not.toHaveBeenCalled();
  });
});

describe('updateRentalAction shift snapshot', () => {
  const DOBLE_ESPECIAL: RentalShiftDefinition = {
    ...LEGACY_SHIFT_DEFINITIONS[RENTAL_SHIFT.doble],
    label: 'Doble Especial',
    priceUsd: 10,
  };

  function run(
    updates: Parameters<typeof updateRentalAction>[1],
    seed?: Partial<RentalState['rentals'][number]>
  ) {
    let state = buildState();
    if (seed) state = { ...state, rentals: [{ ...state.rentals[0], ...seed }] };
    const setState = vi.fn((partial) => {
      const next = typeof partial === 'function' ? partial(state) : partial;
      state = { ...state, ...next };
    });
    return updateRentalAction(
      'rental-1',
      updates,
      null,
      setState,
      () => state
    ).then(() => ({
      rental: state.rentals[0],
      payload: useSyncStore.getState().queue.at(-1)?.payload ?? {},
    }));
  }

  beforeEach(() => {
    useSyncStore.setState({ queue: [] });
    Object.defineProperty(globalThis, 'navigator', {
      configurable: true,
      value: { onLine: false },
    });
  });

  it('writes the snapshot of the new shift when the shift changes', async () => {
    // Arrange / Act
    const { rental, payload } = await run({ shift: RENTAL_SHIFT.completo });

    // Assert
    expect(rental.shiftSnapshot).toEqual(
      LEGACY_SHIFT_DEFINITIONS[RENTAL_SHIFT.completo]
    );
    expect(payload).toMatchObject({
      shift: RENTAL_SHIFT.completo,
      shift_label: 'Completo',
      shift_hours: 24,
      shift_price_usd: 6,
      shift_divisa_discount_usd: 1,
    });
  });

  it('uses the snapshot passed with the update when the shift changes', async () => {
    // Arrange / Act
    const { rental, payload } = await run({
      shift: RENTAL_SHIFT.doble,
      shiftSnapshot: DOBLE_ESPECIAL,
    });

    // Assert
    expect(rental.shiftSnapshot).toEqual(DOBLE_ESPECIAL);
    expect(payload).toMatchObject({
      shift_label: 'Doble Especial',
      shift_price_usd: 10,
    });
  });

  it('leaves the snapshot columns alone when the shift does not change', async () => {
    // Arrange / Act
    const { rental, payload } = await run({
      shift: RENTAL_SHIFT.medio,
      notes: 'x',
    });

    // Assert
    expect(rental.shiftSnapshot).toBeUndefined();
    expect(
      Object.keys(payload).filter((key) => key.startsWith('shift_'))
    ).toEqual([]);
  });

  it('keeps the stored snapshot when the edit saves the same shift', async () => {
    // Arrange / Act
    const { rental, payload } = await run(
      { shift: RENTAL_SHIFT.doble, notes: 'x' },
      { shift: RENTAL_SHIFT.doble, shiftSnapshot: DOBLE_ESPECIAL }
    );

    // Assert
    expect(rental.shiftSnapshot).toEqual(DOBLE_ESPECIAL);
    expect(
      Object.keys(payload).filter((key) => key.startsWith('shift_'))
    ).toEqual([]);
  });
});
