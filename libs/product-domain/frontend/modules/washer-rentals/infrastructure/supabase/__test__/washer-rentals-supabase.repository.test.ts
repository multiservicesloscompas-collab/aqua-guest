import { describe, expect, it, vi } from 'vitest';

import { createWasherRentalsSupabaseRepositories } from '../create-washer-rentals-supabase-repositories';

describe('createWasherRentalsSupabaseRepositories', () => {
  it('returns the expected repository bundle', () => {
    const supabase = {
      from: vi.fn(),
    };

    const repositories = createWasherRentalsSupabaseRepositories({ supabase });

    expect(repositories.customersRepository).toBeDefined();
    expect(repositories.washingMachinesRepository).toBeDefined();
    expect(repositories.prepaidOrdersRepository).toBeDefined();
    expect(repositories.washerRentalsRepository).toBeDefined();
  });

  it('creates rentals with split replacement semantics', async () => {
    const paymentSplitDeleteEq = vi.fn().mockResolvedValue({ error: null });
    const paymentSplitInsert = vi.fn().mockResolvedValue({ error: null });
    const rentalInsertSelect = vi.fn().mockResolvedValue({
      data: [
        {
          id: 'rental-1',
          date: '2026-03-13',
          customerId: 'customer-1',
          machineId: 'machine-1',
          shift: 'medio',
          deliveryTime: '09:00',
          pickupTime: '13:00',
          pickupDate: '2026-03-13',
          deliveryFee: '1',
          totalUsd: '2',
          paymentMethod: 'efectivo',
          status: 'agendado',
          isPaid: true,
          datePaid: '2026-03-13',
          createdAt: '2026-03-13T10:00:00.000Z',
          updatedAt: '2026-03-13T10:00:00.000Z',
          customers: { name: 'Cliente Uno', phone: '0414', address: 'Dir' },
        },
      ],
      error: null,
    });

    const rentalInsert = vi.fn(() => ({ select: rentalInsertSelect }));
    const supabase = {
      from: vi.fn((table: string) => {
        if (table === 'washer_rentals') {
          return {
            select: vi.fn(),
            insert: rentalInsert,
            update: vi.fn(),
            delete: vi.fn(),
          };
        }

        if (table === 'rental_payment_splits') {
          return {
            delete: vi.fn(() => ({ eq: paymentSplitDeleteEq })),
            insert: paymentSplitInsert,
            select: vi.fn(),
          };
        }

        throw new Error(`Unexpected table ${table}`);
      }),
    };

    const repository = createWasherRentalsSupabaseRepositories({ supabase })
      .washerRentalsRepository;

    const created = await repository.create({
      date: '2026-03-13',
      customerId: 'customer-1',
      customerName: 'Cliente Uno',
      customerPhone: '0414',
      customerAddress: 'Dir',
      machineId: 'machine-1',
      shift: 'medio',
      deliveryTime: '09:00',
      pickupTime: '13:00',
      pickupDate: '2026-03-13',
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
      datePaid: '2026-03-13',
      notes: undefined,
      extensions: [],
      originalPickupTime: undefined,
      originalPickupDate: undefined,
    });

    expect(paymentSplitDeleteEq).toHaveBeenCalledWith('rental_id', 'rental-1');
    expect(paymentSplitInsert).toHaveBeenCalledWith([
      {
        rental_id: 'rental-1',
        payment_method: 'efectivo',
        amount_bs: 100,
        amount_usd: 2,
        exchange_rate_used: 50,
      },
    ]);
    expect(created.paymentSplits).toHaveLength(1);
  });

  it('rolls back the created rental when payment split persistence fails', async () => {
    const rollbackEq = vi.fn().mockResolvedValue({ error: null });
    const paymentSplitDeleteEq = vi.fn().mockResolvedValue({ error: null });
    const splitError = new Error('split insert failed');
    const paymentSplitInsert = vi.fn().mockResolvedValue({ error: splitError });
    const rentalInsertSelect = vi.fn().mockResolvedValue({
      data: [
        {
          id: 'rental-1',
          date: '2026-03-13',
          customerId: 'customer-1',
          machineId: 'machine-1',
          shift: 'medio',
          deliveryTime: '09:00',
          pickupTime: '13:00',
          pickupDate: '2026-03-13',
          deliveryFee: '1',
          totalUsd: '2',
          paymentMethod: 'efectivo',
          status: 'agendado',
          isPaid: true,
          datePaid: '2026-03-13',
          createdAt: '2026-03-13T10:00:00.000Z',
          updatedAt: '2026-03-13T10:00:00.000Z',
          customers: { name: 'Cliente Uno', phone: '0414', address: 'Dir' },
        },
      ],
      error: null,
    });

    const rentalInsert = vi.fn(() => ({ select: rentalInsertSelect }));
    const supabase = {
      from: vi.fn((table: string) => {
        if (table === 'washer_rentals') {
          return {
            select: vi.fn(),
            insert: rentalInsert,
            update: vi.fn(),
            delete: vi.fn(() => ({ eq: rollbackEq })),
          };
        }

        if (table === 'rental_payment_splits') {
          return {
            delete: vi.fn(() => ({ eq: paymentSplitDeleteEq })),
            insert: paymentSplitInsert,
            select: vi.fn(),
          };
        }

        throw new Error(`Unexpected table ${table}`);
      }),
    };

    const repository = createWasherRentalsSupabaseRepositories({ supabase })
      .washerRentalsRepository;

    await expect(
      repository.create({
        date: '2026-03-13',
        customerId: 'customer-1',
        customerName: 'Cliente Uno',
        customerPhone: '0414',
        customerAddress: 'Dir',
        machineId: 'machine-1',
        shift: 'medio',
        deliveryTime: '09:00',
        pickupTime: '13:00',
        pickupDate: '2026-03-13',
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
        datePaid: '2026-03-13',
        notes: undefined,
        extensions: [],
        originalPickupTime: undefined,
        originalPickupDate: undefined,
      })
    ).rejects.toBe(splitError);

    expect(paymentSplitDeleteEq).toHaveBeenCalledWith('rental_id', 'rental-1');
    expect(rollbackEq).toHaveBeenCalledWith('id', 'rental-1');
  });
});
