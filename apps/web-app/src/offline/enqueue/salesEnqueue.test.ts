import { beforeEach, describe, expect, it } from 'vitest';
import { useSyncStore } from '@/store/useSyncStore';
import {
  enqueueOfflineSaleTipDelete,
  enqueueOfflineSalePaymentSplitsReplace,
  enqueueOfflineSaleUpdate,
} from './salesEnqueue';

describe('salesEnqueue', () => {
  beforeEach(() => {
    useSyncStore.getState().clearQueue();
  });

  it('enqueues sale update with temp dependency when id is temporary', () => {
    enqueueOfflineSaleUpdate({
      id: 'temp-sale-1',
      payload: { notes: 'offline-update' },
    });

    const queue = useSyncStore.getState().queue;
    expect(queue).toHaveLength(1);
    expect(queue[0].table).toBe('sales');
    expect(queue[0].type).toBe('UPDATE');
    expect(queue[0].dependencies.dependsOn).toEqual(['sale:temp-sale-1']);
  });

  it('enqueues split replacement as delete+insert operations', () => {
    enqueueOfflineSalePaymentSplitsReplace('sale-1', [
      {
        method: 'efectivo',
        amountBs: 100,
        amountUsd: 2,
        exchangeRateUsed: 50,
      },
    ]);

    const queue = useSyncStore.getState().queue;
    expect(queue).toHaveLength(1);
    expect(queue[0].type).toBe('UPDATE');
    expect(queue[0].payload.__repository).toBe('sales');
    expect(queue[0].payload.__operation).toBe('update');
    expect(queue[0].payload.__input).toEqual({
      id: 'sale-1',
      updates: {
        paymentSplits: [
          {
            method: 'efectivo',
            amountBs: 100,
            amountUsd: 2,
            exchangeRateUsed: 50,
          },
        ],
      },
    });
  });

  it('enqueues scoped tip deletion by sale origin', () => {
    enqueueOfflineSaleTipDelete('sale-1');

    const queue = useSyncStore.getState().queue;
    expect(queue).toHaveLength(1);
    expect(queue[0].table).toBe('tips');
    expect(queue[0].type).toBe('DELETE');
    expect(queue[0].payload.__repository).toBe('tips');
    expect(queue[0].payload.__operation).toBe('deleteByOrigin');
  });
});
