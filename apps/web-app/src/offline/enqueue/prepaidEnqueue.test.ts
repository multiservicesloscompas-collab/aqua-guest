import { beforeEach, describe, expect, it } from 'vitest';
import { useSyncStore } from '@/store/useSyncStore';
import {
  enqueueOfflinePrepaidCreate,
  enqueueOfflinePrepaidDelete,
  enqueueOfflinePrepaidUpdate,
} from './prepaidEnqueue';

describe('prepaidEnqueue', () => {
  beforeEach(() => {
    useSyncStore.getState().clearQueue();
  });

  it('enqueues create and returns temp prepaid order', () => {
    const created = enqueueOfflinePrepaidCreate({
      payload: {
        customer_name: 'Cliente Uno',
        liters: 40,
        amount_bs: 120,
        amount_usd: 2.4,
        exchange_rate: 50,
        payment_method: 'efectivo',
        status: 'pendiente',
        date_paid: '2026-03-09',
      },
      order: {
        customerName: 'Cliente Uno',
        customerPhone: '0414-0000000',
        liters: 40,
        amountBs: 120,
        amountUsd: 2.4,
        exchangeRate: 50,
        paymentMethod: 'efectivo',
        status: 'pendiente',
        datePaid: '2026-03-09',
        dateDelivered: undefined,
        notes: undefined,
      },
      createdAt: '2026-03-09T00:00:00.000Z',
      updatedAt: '2026-03-09T00:00:00.000Z',
    });

    expect(created.id).toContain('temp-');
    const queue = useSyncStore.getState().queue;
    expect(queue).toHaveLength(1);
    expect(queue[0].table).toBe('prepaid_orders');
    expect(queue[0].type).toBe('INSERT');
    expect(queue[0].idempotency.businessKey).toBe(`prepaid:${created.id}`);
  });

  it('enqueues update/delete dependent on temp create key', () => {
    const tempId = 'temp-prepaid-1';

    enqueueOfflinePrepaidUpdate({
      id: tempId,
      payload: {
        status: 'entregado',
        date_delivered: '2026-03-10',
      },
    });
    enqueueOfflinePrepaidDelete(tempId);

    const queue = useSyncStore.getState().queue;
    expect(queue).toHaveLength(2);
    expect(queue[0].type).toBe('UPDATE');
    expect(queue[0].dependencies.dependsOn).toEqual([`prepaid:${tempId}`]);
    expect(queue[1].type).toBe('DELETE');
    expect(queue[1].dependencies.dependsOn).toEqual([`prepaid:${tempId}`]);
  });
});
