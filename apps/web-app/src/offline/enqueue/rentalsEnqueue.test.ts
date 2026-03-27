import { beforeEach, describe, expect, it } from 'vitest';
import { useSyncStore } from '@/store/useSyncStore';
import {
  enqueueOfflineRental,
  enqueueOfflineRentalTipDelete,
} from './rentalsEnqueue';

describe('enqueueOfflineRental', () => {
  beforeEach(() => {
    useSyncStore.getState().clearQueue();
  });

  it('enqueues rental root and split action with dependency', () => {
    const rental = enqueueOfflineRental({
      payload: {
        date: '2026-03-09',
        customer_id: 'customer-1',
        machine_id: 'machine-1',
        shift: 'medio',
        delivery_time: '09:00',
        pickup_time: '13:00',
        pickup_date: '2026-03-09',
        delivery_fee: 1,
        total_usd: 2,
        payment_method: 'pago_movil',
        status: 'agendado',
        is_paid: true,
        date_paid: '2026-03-09',
      },
      rental: {
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
        status: 'agendado',
        isPaid: true,
        datePaid: '2026-03-09',
        notes: undefined,
      },
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
    });

    expect(rental.id).toContain('temp-');

    const queue = useSyncStore.getState().queue;
    expect(queue).toHaveLength(2);

    const root = queue.find((entry) => entry.table === 'washer_rentals');
    const split = queue.find(
      (entry) => entry.table === 'rental_payment_splits'
    );

    expect(root).toBeDefined();
    expect(split).toBeDefined();
    expect(split?.dependencies.dependsOn).toEqual([
      root?.idempotency.businessKey,
    ]);

    const splitPayload = split?.payload as {
      parentId?: string;
      splits?: Array<{ rental_id: string }>;
    };
    expect(splitPayload.parentId).toBe(rental.id);
    expect(splitPayload.splits?.[0]?.rental_id).toBe(rental.id);
  });

  it('enqueues scoped tip deletion by rental origin', () => {
    enqueueOfflineRentalTipDelete('rental-1');

    const queue = useSyncStore.getState().queue;
    expect(queue).toHaveLength(1);
    expect(queue[0].table).toBe('tips');
    expect(queue[0].type).toBe('DELETE');
    expect(queue[0].payload.__op).toBe('delete_by_parent_id');
    expect(queue[0].payload.parentColumn).toBe('origin_id');
    expect(queue[0].payload.parentScopeColumn).toBe('origin_type');
    expect(queue[0].payload.parentScopeValue).toBe('rental');
  });
});
