import { beforeEach, describe, expect, it } from 'vitest';
import { useSyncStore } from '@/store/useSyncStore';
import {
  applyOfflineExchangeRateHistory,
  enqueueOfflineExchangeRateUpsert,
  enqueueOfflineLiterPricingReplace,
} from './configEnqueue';

describe('configEnqueue', () => {
  beforeEach(() => {
    useSyncStore.getState().clearQueue();
  });

  it('enqueues exchange-rate upsert with operation hint', () => {
    enqueueOfflineExchangeRateUpsert({
      date: '2026-03-09',
      rate: 52,
      updatedAt: '2026-03-09T10:00:00.000Z',
    });

    const queue = useSyncStore.getState().queue;
    expect(queue).toHaveLength(1);
    expect(queue[0].table).toBe('exchange_rates');
    expect(queue[0].type).toBe('INSERT');
    expect(queue[0].payload.__op).toBe('upsert_on_date');
  });

  it('enqueues liter pricing upserts and deletes removed breakpoints', () => {
    enqueueOfflineLiterPricingReplace({
      pricing: [
        { breakpoint: 5, price: 50 },
        { breakpoint: 19, price: 160 },
      ],
      previousPricing: [
        { breakpoint: 2, price: 25 },
        { breakpoint: 5, price: 45 },
      ],
    });

    const queue = useSyncStore.getState().queue;
    expect(queue).toHaveLength(3);

    const upserts = queue.filter((item) => item.type === 'INSERT');
    const deletions = queue.filter((item) => item.type === 'DELETE');
    expect(upserts).toHaveLength(2);
    expect(deletions).toHaveLength(1);
    expect(
      upserts.every((item) => item.payload.__op === 'upsert_on_breakpoint')
    ).toBe(true);
    expect(deletions[0].payload.__op).toBe('delete_by_breakpoint');
    expect(deletions[0].payload.breakpoint).toBe(2);
  });

  it('updates history entry by date and appends new dates', () => {
    const replaced = applyOfflineExchangeRateHistory(
      [
        {
          date: '2026-03-08',
          rate: 50,
          updatedAt: '2026-03-08T08:00:00.000Z',
        },
      ],
      {
        date: '2026-03-08',
        rate: 51,
        updatedAt: '2026-03-08T09:00:00.000Z',
      }
    );

    const appended = applyOfflineExchangeRateHistory(replaced, {
      date: '2026-03-09',
      rate: 52,
      updatedAt: '2026-03-09T09:00:00.000Z',
    });

    expect(replaced).toHaveLength(1);
    expect(replaced[0].rate).toBe(51);
    expect(appended).toHaveLength(2);
    expect(appended.map((entry) => entry.date)).toEqual([
      '2026-03-08',
      '2026-03-09',
    ]);
  });
});
