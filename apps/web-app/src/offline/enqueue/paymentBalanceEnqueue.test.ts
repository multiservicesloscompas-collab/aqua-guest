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
    expect(queue[0].payload).toMatchObject({
      operation_type: 'equilibrio',
      amount_out_bs: 500,
      amount_in_bs: 500,
      difference_bs: 0,
    });
    expect(queue[0].idempotency.businessKey).toBe(
      `payment-balance:${created.id}`
    );
  });

  it('enqueues avance create payload with explicit out/in amounts', () => {
    enqueueOfflinePaymentBalanceCreate(
      {
        date: '2026-03-09',
        operationType: 'avance',
        fromMethod: 'divisa',
        toMethod: 'pago_movil',
        amount: 1000,
        amountBs: 1000,
        amountUsd: 20,
        amountOutBs: 1000,
        amountOutUsd: 20,
        amountInBs: 980,
        amountInUsd: 19.6,
        differenceBs: -20,
        differenceUsd: -0.4,
      },
      {
        createdAt: '2026-03-09T00:00:00.000Z',
        updatedAt: '2026-03-09T00:00:00.000Z',
      }
    );

    const queue = useSyncStore.getState().queue;
    expect(queue).toHaveLength(1);
    expect(queue[0].payload).toMatchObject({
      operation_type: 'avance',
      amount_out_bs: 1000,
      amount_out_usd: 20,
      amount_in_bs: 980,
      amount_in_usd: 19.6,
      difference_bs: -20,
      difference_usd: -0.4,
    });
  });

  it('normalizes update payload with derived difference fields', () => {
    const existing = {
      id: 'payment-balance-1',
      date: '2026-03-09',
      operationType: 'avance' as const,
      fromMethod: 'pago_movil' as const,
      toMethod: 'efectivo' as const,
      amount: 1000,
      amountBs: 1000,
      amountUsd: 20,
      amountOutBs: 1000,
      amountOutUsd: 20,
      amountInBs: 980,
      amountInUsd: 19.6,
      differenceBs: -20,
      differenceUsd: -0.4,
      createdAt: '2026-03-09T00:00:00.000Z',
      updatedAt: '2026-03-09T00:00:00.000Z',
    };

    enqueueOfflinePaymentBalanceUpdate(
      existing.id,
      {
        amountInBs: 990,
        amountInUsd: 19.8,
      },
      '2026-03-09T01:00:00.000Z',
      'paymentBalance/updatePaymentBalanceTransaction',
      existing
    );

    const queue = useSyncStore.getState().queue;
    expect(queue).toHaveLength(1);
    expect(queue[0].payload).toMatchObject({
      id: existing.id,
      amount: 1000,
      amount_bs: 1000,
      amount_usd: 20,
      amount_out_bs: 1000,
      amount_out_usd: 20,
      amount_in_bs: 990,
      amount_in_usd: 19.8,
      difference_bs: -10,
    });
    expect(Number(queue[0].payload.difference_usd)).toBeCloseTo(-0.2, 10);
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
