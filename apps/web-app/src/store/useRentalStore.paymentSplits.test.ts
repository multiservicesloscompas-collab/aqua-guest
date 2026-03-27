import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useRentalStore } from './useRentalStore';

const washerRentalsInsertSingleMock = vi.fn();
const washerRentalsInsertSelectMock = vi.fn(() => ({
  single: washerRentalsInsertSingleMock,
}));
const washerRentalsInsertMock = vi.fn(() => ({
  select: washerRentalsInsertSelectMock,
}));

const washerRentalsUpdateEqMock = vi.fn();
const washerRentalsUpdateMock = vi.fn(() => ({
  eq: washerRentalsUpdateEqMock,
}));

const rentalSplitsDeleteEqMock = vi.fn();
const rentalSplitsDeleteMock = vi.fn(() => ({ eq: rentalSplitsDeleteEqMock }));

const rentalSplitsInsertMock = vi.fn();

const rentalSplitsSelectEqMock = vi.fn();
const rentalSplitsSelectMock = vi.fn(() => ({ eq: rentalSplitsSelectEqMock }));

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
      };
    }

    if (table === 'rental_payment_splits') {
      return {
        delete: rentalSplitsDeleteMock,
        insert: rentalSplitsInsertMock,
        select: rentalSplitsSelectMock,
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

describe('useRentalStore payment split persistence', () => {
  beforeEach(() => {
    washerRentalsInsertSingleMock.mockResolvedValue({
      data: {
        id: 'rental-1',
        date: '2026-03-07',
        customer_id: 'customer-1',
        machine_id: 'machine-1',
        shift: 'medio',
        delivery_time: '09:00',
        pickup_time: '13:00',
        pickup_date: '2026-03-07',
        delivery_fee: 1,
        total_usd: 2,
        payment_method: 'pago_movil',
        status: 'agendado',
        is_paid: true,
        date_paid: '2026-03-07',
        notes: null,
        created_at: '2026-03-07T12:00:00.000Z',
        updated_at: '2026-03-07T12:00:00.000Z',
      },
      error: null,
    });

    washerRentalsUpdateEqMock.mockResolvedValue({ error: null });
    rentalSplitsDeleteEqMock.mockResolvedValue({ error: null });
    rentalSplitsInsertMock.mockResolvedValue({ error: null });
    rentalSplitsSelectEqMock.mockResolvedValue({
      data: [
        {
          payment_method: 'pago_movil',
          amount_bs: 70,
          amount_usd: 1.4,
          exchange_rate_used: 50,
        },
        {
          payment_method: 'efectivo',
          amount_bs: 30,
          amount_usd: 0.6,
          exchange_rate_used: 50,
        },
      ],
      error: null,
    });

    washerRentalsInsertMock.mockClear();
    washerRentalsInsertSelectMock.mockClear();
    washerRentalsInsertSingleMock.mockClear();
    washerRentalsUpdateMock.mockClear();
    washerRentalsUpdateEqMock.mockClear();
    rentalSplitsDeleteMock.mockClear();
    rentalSplitsDeleteEqMock.mockClear();
    rentalSplitsInsertMock.mockClear();
    rentalSplitsSelectMock.mockClear();
    rentalSplitsSelectEqMock.mockClear();

    useRentalStore.setState({
      rentals: [
        {
          id: 'rental-1',
          date: '2026-03-07',
          customerId: 'customer-1',
          customerName: 'Cliente Uno',
          customerPhone: '0414-0000000',
          customerAddress: 'Direccion',
          machineId: 'machine-1',
          shift: 'medio',
          deliveryTime: '09:00',
          pickupTime: '13:00',
          pickupDate: '2026-03-07',
          deliveryFee: 1,
          totalUsd: 2,
          paymentMethod: 'efectivo',
          status: 'agendado',
          isPaid: true,
          datePaid: '2026-03-07',
          notes: undefined,
          createdAt: '2026-03-07T12:00:00.000Z',
          updatedAt: '2026-03-07T12:00:00.000Z',
        },
      ],
      loadingRentalsByRange: {},
    });
  });

  it('creates rental with mixed splits and persists split rows', async () => {
    await useRentalStore.getState().addRental({
      date: '2026-03-07',
      customerId: 'customer-1',
      customerName: 'Cliente Uno',
      customerPhone: '0414-0000000',
      customerAddress: 'Direccion',
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
      datePaid: '2026-03-07',
      notes: undefined,
    });

    const insertPayload = (
      washerRentalsInsertMock.mock.calls as unknown as Array<
        Array<{ payment_method: string }>
      >
    )[0]?.[0];
    expect(insertPayload).toBeDefined();
    expect(insertPayload.payment_method).toBe('pago_movil');

    expect(rentalSplitsDeleteEqMock).toHaveBeenCalledWith(
      'rental_id',
      'rental-1'
    );
    expect(rentalSplitsInsertMock).toHaveBeenCalledWith([
      {
        rental_id: 'rental-1',
        payment_method: 'efectivo',
        amount_bs: 30,
        amount_usd: 0.6,
        exchange_rate_used: 50,
      },
      {
        rental_id: 'rental-1',
        payment_method: 'pago_movil',
        amount_bs: 70,
        amount_usd: 1.4,
        exchange_rate_used: 50,
      },
    ]);
  });

  it('edits rental to single-method split and persists one split row', async () => {
    useRentalStore.setState({
      rentals: [
        {
          ...useRentalStore.getState().rentals[0],
          paymentMethod: 'pago_movil',
          paymentSplits: [
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
          ],
        },
      ],
    });

    await useRentalStore.getState().updateRental('rental-1', {
      paymentMethod: 'divisa',
      paymentSplits: [
        { method: 'divisa', amountBs: 100, amountUsd: 2, exchangeRateUsed: 50 },
      ],
    });

    const updatePayload = (
      washerRentalsUpdateMock.mock.calls as unknown as Array<
        Array<{ payment_method: string }>
      >
    )[0]?.[0];
    expect(updatePayload).toBeDefined();
    expect(updatePayload.payment_method).toBe('divisa');

    expect(rentalSplitsDeleteEqMock).toHaveBeenCalledWith(
      'rental_id',
      'rental-1'
    );
    expect(rentalSplitsInsertMock).toHaveBeenCalledWith([
      {
        rental_id: 'rental-1',
        payment_method: 'divisa',
        amount_bs: 100,
        amount_usd: 2,
        exchange_rate_used: 50,
      },
    ]);

    const updatedRental = useRentalStore
      .getState()
      .rentals.find((rental) => rental.id === 'rental-1');
    expect(updatedRental?.paymentMethod).toBe('divisa');
    expect(updatedRental?.paymentSplits).toEqual([
      { method: 'divisa', amountBs: 100, amountUsd: 2, exchangeRateUsed: 50 },
    ]);
  });
});
