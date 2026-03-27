import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useConfigStore } from './useConfigStore';
import { useSyncStore } from './useSyncStore';

const upsertMock = vi.fn();
const selectMock = vi.fn();

vi.mock('@/services/DateService', () => ({
  getVenezuelaDate: () => '2026-03-09',
}));

vi.mock('@/lib/supabaseClient', () => {
  const from = vi.fn((table: string) => {
    if (table === 'exchange_rates') {
      return {
        upsert: upsertMock,
      };
    }

    if (table === 'liter_pricing') {
      return {
        select: selectMock,
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

describe('useConfigStore offline queueing', () => {
  beforeEach(() => {
    upsertMock.mockReset();
    selectMock.mockReset();
    useSyncStore.getState().clearQueue();

    useConfigStore.setState({
      config: {
        exchangeRate: 36.5,
        lastUpdated: '2026-03-08T00:00:00.000Z',
        literPricing: [
          { breakpoint: 2, price: 25 },
          { breakpoint: 5, price: 45 },
        ],
        exchangeRateHistory: [],
      },
    });

    Object.defineProperty(globalThis, 'navigator', {
      configurable: true,
      value: { onLine: false },
    });
  });

  it('queues exchange-rate update without calling supabase when offline', async () => {
    await useConfigStore.getState().setExchangeRate(52);

    expect(upsertMock).not.toHaveBeenCalled();
    const queue = useSyncStore.getState().queue;
    expect(queue).toHaveLength(1);
    expect(queue[0].table).toBe('exchange_rates');
    expect(queue[0].payload.__op).toBe('upsert_on_date');
  });

  it('queues liter pricing replace operations when offline', async () => {
    await useConfigStore.getState().setLiterPricing([
      { breakpoint: 5, price: 50 },
      { breakpoint: 19, price: 160 },
    ]);

    expect(selectMock).not.toHaveBeenCalled();
    const queue = useSyncStore.getState().queue;
    expect(queue).toHaveLength(3);
    expect(queue.filter((item) => item.table === 'liter_pricing')).toHaveLength(
      3
    );
    expect(queue.some((item) => item.type === 'DELETE')).toBe(true);
  });
});
