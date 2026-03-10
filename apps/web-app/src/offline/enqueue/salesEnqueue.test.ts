import { beforeEach, describe, expect, it } from 'vitest';
import { useSyncStore } from '@/store/useSyncStore';
import {
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
    expect(queue).toHaveLength(2);
    expect(queue.map((entry) => entry.type)).toEqual(['DELETE', 'INSERT']);
    expect(queue[0].payload.__op).toBe('delete_by_parent_id');
  });
});
