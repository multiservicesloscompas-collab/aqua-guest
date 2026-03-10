import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useRentalStore } from './useRentalStore';
import { useSyncStore } from './useSyncStore';

const washerRentalsInsertMock = vi.fn();
const washerRentalsUpdateEqMock = vi.fn();
const washerRentalsUpdateMock = vi.fn(() => ({
  eq: washerRentalsUpdateEqMock,
}));
const washerRentalsDeleteEqMock = vi.fn();
const washerRentalsDeleteMock = vi.fn(() => ({
  eq: washerRentalsDeleteEqMock,
}));
const rentalSplitsDeleteEqMock = vi.fn();
const rentalSplitsDeleteMock = vi.fn(() => ({ eq: rentalSplitsDeleteEqMock }));
const rentalSplitsInsertMock = vi.fn();

vi.mock('@/services/RentalsDataService', () => ({
  rentalsDataService: {
    invalidateCache: vi.fn(),
  },
}));

vi.mock('./useCustomerStore', () => ({
  useCustomerStore: {
    getState: () => ({ customers: [] }),
    setState: vi.fn(),
  },
}));

vi.mock('@/lib/supabaseClient', () => {
  const from = vi.fn((table: string) => {
    if (table === 'washer_rentals') {
      return {
        insert: washerRentalsInsertMock,
        update: washerRentalsUpdateMock,
        delete: washerRentalsDeleteMock,
      };
    }

    if (table === 'rental_payment_splits') {
      return {
        delete: rentalSplitsDeleteMock,
        insert: rentalSplitsInsertMock,
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

describe('useRentalStore offline queueing', () => {
  beforeEach(() => {
    washerRentalsInsertMock.mockReset();
    washerRentalsUpdateEqMock.mockReset();
    washerRentalsUpdateMock.mockReset();
    washerRentalsDeleteEqMock.mockReset();
    washerRentalsDeleteMock.mockReset();
    rentalSplitsDeleteEqMock.mockReset();
    rentalSplitsDeleteMock.mockReset();
    rentalSplitsInsertMock.mockReset();
    useSyncStore.getState().clearQueue();
    useRentalStore.setState({ rentals: [], loadingRentalsByRange: {} });

    Object.defineProperty(globalThis, 'navigator', {
      configurable: true,
      value: { onLine: false },
    });
  });

  it('queues rental + splits and does not call supabase when offline', async () => {
    await useRentalStore.getState().addRental({
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
      paymentSplits: [
        {
          method: 'efectivo',
          amountBs: 30,
          amountUsd: 0.6,
          exchangeRateUsed: 50,
        },
        {
          method: 'pago_movil',
          amountBs: 70,
          amountUsd: 1.4,
          exchangeRateUsed: 50,
        },
      ],
      status: 'agendado',
      isPaid: true,
      datePaid: '2026-03-09',
      notes: undefined,
    });

    expect(washerRentalsInsertMock).not.toHaveBeenCalled();

    const queue = useSyncStore.getState().queue;
    expect(queue).toHaveLength(2);
    expect(queue.some((entry) => entry.table === 'washer_rentals')).toBe(true);
    expect(queue.some((entry) => entry.table === 'rental_payment_splits')).toBe(
      true
    );
    expect(useRentalStore.getState().rentals).toHaveLength(1);
  });

  it('queues rental update + split replacement and avoids supabase when offline', async () => {
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

    await useRentalStore.getState().updateRental('rental-1', {
      paymentMethod: 'pago_movil',
      paymentSplits: [
        {
          method: 'pago_movil',
          amountBs: 100,
          amountUsd: 2,
          exchangeRateUsed: 50,
        },
      ],
    });

    expect(washerRentalsUpdateMock).not.toHaveBeenCalled();
    expect(rentalSplitsDeleteMock).not.toHaveBeenCalled();
    expect(rentalSplitsInsertMock).not.toHaveBeenCalled();

    const queue = useSyncStore.getState().queue;
    expect(queue).toHaveLength(3);
    expect(queue.map((q) => q.table)).toEqual([
      'washer_rentals',
      'rental_payment_splits',
      'rental_payment_splits',
    ]);
    expect(queue.map((q) => q.type)).toEqual(['UPDATE', 'DELETE', 'INSERT']);
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

    const queue = useSyncStore.getState().queue;
    expect(queue).toHaveLength(2);
    expect(queue.map((q) => q.table)).toEqual([
      'washer_rentals',
      'rental_payment_splits',
    ]);
    expect(queue.map((q) => q.type)).toEqual(['DELETE', 'DELETE']);
    expect(useRentalStore.getState().rentals).toHaveLength(0);
  });
});
