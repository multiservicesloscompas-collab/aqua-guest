import { beforeEach, describe, expect, it } from 'vitest';
import { useSyncStore } from '@/store/useSyncStore';
import {
  enqueueOfflinePaymentBalanceCreate,
  enqueueOfflinePaymentBalanceDelete,
  enqueueOfflinePaymentBalanceUpdate,
} from './paymentBalanceEnqueue';

describe('paymentBalanceEnqueue', () => {
  beforeEach(() => {
    useSyncStore.getState().clearQueue();
  });

  it('enqueues create and returns transaction with temp id', () => {
    const created = enqueueOfflinePaymentBalanceCreate(
      {
        date: '2026-03-09',
        fromMethod: 'pago_movil',
        toMethod: 'efectivo',
        amount: 500,
        amountBs: 500,
        amountUsd: 10,
        notes: 'Cierre diario',
      },
      {
        createdAt: '2026-03-09T00:00:00.000Z',
        updatedAt: '2026-03-09T00:00:00.000Z',
      }
    );

    expect(created.id).toContain('temp-');
    const queue = useSyncStore.getState().queue;
    expect(queue).toHaveLength(1);
    expect(queue[0].table).toBe('payment_balance_transactions');
    expect(queue[0].type).toBe('INSERT');
    expect(queue[0].idempotency.businessKey).toBe(
      `payment-balance:${created.id}`
    );
  });

  it('enqueues update/delete with temp dependency key', () => {
    const tempId = 'temp-payment-balance-1';

    enqueueOfflinePaymentBalanceUpdate(
      tempId,
      { notes: 'Ajuste' },
      '2026-03-09T01:00:00.000Z'
    );
    enqueueOfflinePaymentBalanceDelete(tempId);

    const queue = useSyncStore.getState().queue;
    expect(queue).toHaveLength(2);
    expect(queue[0].type).toBe('UPDATE');
    expect(queue[0].dependencies.dependsOn).toEqual([
      `payment-balance:${tempId}`,
    ]);
    expect(queue[1].type).toBe('DELETE');
    expect(queue[1].dependencies.dependsOn).toEqual([
      `payment-balance:${tempId}`,
    ]);
  });
});
