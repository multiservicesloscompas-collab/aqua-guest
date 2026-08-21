import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useRentalStore } from '../useRentalStore';
import { useConfigStore } from '../useConfigStore';
import { useSyncStore } from '../useSyncStore';

const washerRentalsDeleteEqMock = vi.fn();
const washerRentalsDeleteMock = vi.fn(() => ({
  eq: washerRentalsDeleteEqMock,
}));
const rentalSplitsDeleteEqMock = vi.fn();
const rentalSplitsDeleteMock = vi.fn(() => ({ eq: rentalSplitsDeleteEqMock }));
const rentalSplitsInsertMock = vi.fn();
const tipsDeleteEqMock = vi.fn();
const tipsDeleteScopeEqMock = vi.fn();
const tipsDeleteMock = vi.fn(() => ({ eq: tipsDeleteEqMock }));

vi.mock('@/services/RentalsDataService', () => ({
  rentalsDataService: {
    invalidateCache: vi.fn(),
  },
}));

vi.mock('./../useCustomerStore', () => ({
  useCustomerStore: {
    getState: () => ({ customers: [] }),
    setState: vi.fn(),
  },
}));

vi.mock('@/lib/supabaseClient', () => {
  const from = vi.fn((table: string) => {
    if (table === 'washer_rentals') {
      return {
        delete: washerRentalsDeleteMock,
      };
    }

    if (table === 'rental_payment_splits') {
      return {
        delete: rentalSplitsDeleteMock,
        insert: rentalSplitsInsertMock,
      };
    }

    if (table === 'tips') {
      return {
        delete: tipsDeleteMock,
      };
    }

    throw new Error(`Unexpected table ${table}`);
  });

  const client = { from };
  return {
    default: client,
    supabase: client,
  };
});

describe('useRentalStore offline queueing tip and delete flows', () => {
  beforeEach(() => {
    washerRentalsDeleteEqMock.mockReset();
    washerRentalsDeleteMock.mockReset();
    rentalSplitsDeleteEqMock.mockReset();
    rentalSplitsDeleteMock.mockReset();
    rentalSplitsInsertMock.mockReset();
    tipsDeleteEqMock.mockReset();
    tipsDeleteScopeEqMock.mockReset();
    tipsDeleteMock.mockReset();

    tipsDeleteEqMock.mockImplementation(() => ({ eq: tipsDeleteScopeEqMock }));
    tipsDeleteScopeEqMock.mockResolvedValue({ error: null });

    useSyncStore.getState().clearQueue();
    useConfigStore.setState((state) => ({
      config: {
        ...state.config,
        exchangeRate: 50,
      },
    }));

    Object.defineProperty(globalThis, 'navigator', {
      configurable: true,
      value: { onLine: false },
    });
  });

  it('queues edited rental tip upsert with recomputed final totals and merged mixed splits payload', async () => {
    useRentalStore.setState({
      rentals: [
        {
          id: 'rental-1',
          date: '2026-03-09',
          customerId: 'customer-1',
          customerName: 'Cliente Uno',
          customerPhone: '0414-0000000',
          customerAddress: 'Dirección',
          machineId: 'machine-1',
          shift: 'medio',
          deliveryTime: '09:00',
          pickupTime: '13:00',
          pickupDate: '2026-03-09',
          deliveryFee: 1,
          totalUsd: 2,
          paymentMethod: 'efectivo',
          status: 'agendado',
          isPaid: true,
          datePaid: '2026-03-09',
          notes: undefined,
          paymentSplits: [
            {
              method: 'efectivo',
              amountBs: 100,
              amountUsd: 2,
              exchangeRateUsed: 50,
            },
          ],
          extensions: [],
          originalPickupTime: undefined,
          originalPickupDate: undefined,
          createdAt: '2026-03-09T10:00:00.000Z',
          updatedAt: '2026-03-09T10:00:00.000Z',
        },
      ],
      loadingRentalsByRange: {},
    });

    await useRentalStore.getState().updateRental(
      'rental-1',
      {
        paymentMethod: 'pago_movil',
        totalUsd: 2,
        paymentSplits: [
          {
            method: 'pago_movil',
            amountBs: 90,
            amountUsd: 1.8,
            exchangeRateUsed: 50,
          },
          {
            method: 'efectivo',
            amountBs: 10,
            amountUsd: 0.2,
            exchangeRateUsed: 50,
          },
        ],
      },
      {
        amountBs: 50,
        capturePaymentMethod: 'efectivo',
        notes: 'edicion offline',
      }
    );

    const queue = useSyncStore.getState().queue;
    expect(queue.map((q) => `${q.table}:${q.type}`)).toEqual([
      'washer_rentals:UPDATE',
      'rental_payment_splits:UPDATE',
      'tips:INSERT',
    ]);

    expect(queue[0].payload).toMatchObject({
      id: 'rental-1',
      total_usd: 3,
      payment_method: 'pago_movil',
      __repository: 'washerRentals',
      __operation: 'update',
    });
    expect(
      (
        queue[1].payload as {
          __repository: string;
          __operation: string;
          __input: { updates: { paymentSplits: Array<{ amountBs: number }> } };
        }
      ).__input.updates.paymentSplits
    ).toEqual([
      expect.objectContaining({ amountBs: 90, method: 'pago_movil' }),
      expect.objectContaining({ amountBs: 60, method: 'efectivo' }),
    ]);
    expect(queue[1].payload).toMatchObject({
      __repository: 'washerRentals',
      __operation: 'update',
    });
    expect(queue[2].payload).toMatchObject({
      __repository: 'tips',
      __operation: 'upsertByOrigin',
      __input: {
        originType: 'rental',
        originId: 'rental-1',
        amountBs: 50,
        capturePaymentMethod: 'efectivo',
        notes: 'edicion offline',
      },
    });
  });

  it('queues rental delete + split delete when offline', async () => {
    useRentalStore.setState({
      rentals: [
        {
          id: 'rental-1',
          date: '2026-03-09',
          customerId: 'customer-1',
          customerName: 'Cliente Uno',
          customerPhone: '0414-0000000',
          customerAddress: 'Dirección',
          machineId: 'machine-1',
          shift: 'medio',
          deliveryTime: '09:00',
          pickupTime: '13:00',
          pickupDate: '2026-03-09',
          deliveryFee: 1,
          totalUsd: 2,
          paymentMethod: 'efectivo',
          status: 'agendado',
          isPaid: true,
          datePaid: '2026-03-09',
          notes: undefined,
          extensions: [],
          originalPickupTime: undefined,
          originalPickupDate: undefined,
          createdAt: '2026-03-09T10:00:00.000Z',
          updatedAt: '2026-03-09T10:00:00.000Z',
        },
      ],
      loadingRentalsByRange: {},
    });

    await useRentalStore.getState().deleteRental('rental-1');

    expect(washerRentalsDeleteMock).not.toHaveBeenCalled();
    expect(rentalSplitsDeleteMock).not.toHaveBeenCalled();
    expect(tipsDeleteMock).not.toHaveBeenCalled();

    const queue = useSyncStore.getState().queue;
    expect(queue).toHaveLength(3);
    expect(queue.map((q) => q.table)).toEqual([
      'washer_rentals',
      'rental_payment_splits',
      'tips',
    ]);
    expect(queue.map((q) => q.type)).toEqual(['DELETE', 'UPDATE', 'DELETE']);
    expect(queue[0].payload.__repository).toBe('washerRentals');
    expect(queue[0].payload.__operation).toBe('delete');
    expect(queue[1].payload.__repository).toBe('washerRentals');
    expect(queue[1].payload.__operation).toBe('update');
    expect(queue[1].payload.__input).toEqual({
      id: 'rental-1',
      updates: { paymentSplits: [] },
    });
    expect(queue[2].payload.__repository).toBe('tips');
    expect(queue[2].payload.__operation).toBe('deleteByOrigin');
    expect(useRentalStore.getState().rentals).toHaveLength(0);
  });
});
