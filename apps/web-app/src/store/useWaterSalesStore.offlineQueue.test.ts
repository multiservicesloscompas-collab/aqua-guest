import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useWaterSalesStore } from './useWaterSalesStore';
import { useSyncStore } from './useSyncStore';

const salesUpdateEqMock = vi.fn();
const salesUpdateMock = vi.fn(() => ({ eq: salesUpdateEqMock }));
const salesDeleteEqMock = vi.fn();
const salesDeleteMock = vi.fn(() => ({ eq: salesDeleteEqMock }));
const saleSplitsDeleteEqMock = vi.fn();
const saleSplitsDeleteMock = vi.fn(() => ({ eq: saleSplitsDeleteEqMock }));
const saleSplitsInsertMock = vi.fn();

vi.mock('@/services/SalesDataService', () => ({
  salesDataService: {
    invalidateCache: vi.fn(),
  },
}));

vi.mock('@/lib/supabaseClient', () => {
  const from = vi.fn((table: string) => {
    if (table === 'sales') {
      return {
        update: salesUpdateMock,
        delete: salesDeleteMock,
      };
    }

    if (table === 'sale_payment_splits') {
      return {
        delete: saleSplitsDeleteMock,
        insert: saleSplitsInsertMock,
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

describe('useWaterSalesStore offline queueing', () => {
  beforeEach(() => {
    salesUpdateEqMock.mockReset();
    salesUpdateMock.mockReset();
    salesDeleteEqMock.mockReset();
    salesDeleteMock.mockReset();
    saleSplitsDeleteEqMock.mockReset();
    saleSplitsDeleteMock.mockReset();
    saleSplitsInsertMock.mockReset();

    useSyncStore.getState().clearQueue();
    useWaterSalesStore.setState({
      sales: [
        {
          id: 'sale-1',
          dailyNumber: 1,
          date: '2026-03-09',
          items: [],
          paymentMethod: 'efectivo',
          totalBs: 100,
          totalUsd: 2,
          exchangeRate: 50,
          createdAt: '2026-03-09T10:00:00.000Z',
          updatedAt: '2026-03-09T10:00:00.000Z',
        },
      ],
      cart: [],
      loadingSalesByRange: {},
    });

    Object.defineProperty(globalThis, 'navigator', {
      configurable: true,
      value: { onLine: false },
    });
  });

  it('queues sale update + split replacement and avoids supabase when offline', async () => {
    await useWaterSalesStore.getState().updateSale('sale-1', {
      paymentMethod: 'pago_movil',
      paymentSplits: [
        {
          method: 'pago_movil',
          amountBs: 60,
          amountUsd: 1.2,
          exchangeRateUsed: 50,
        },
        {
          method: 'efectivo',
          amountBs: 40,
          amountUsd: 0.8,
          exchangeRateUsed: 50,
        },
      ],
    });

    expect(salesUpdateMock).not.toHaveBeenCalled();
    expect(saleSplitsDeleteMock).not.toHaveBeenCalled();
    expect(saleSplitsInsertMock).not.toHaveBeenCalled();

    const queue = useSyncStore.getState().queue;
    expect(queue).toHaveLength(3);
    expect(queue.map((q) => q.table)).toEqual([
      'sales',
      'sale_payment_splits',
      'sale_payment_splits',
    ]);
    expect(queue.map((q) => q.type)).toEqual(['UPDATE', 'DELETE', 'INSERT']);
  });

  it('queues sale delete + split delete and removes local sale when offline', async () => {
    await useWaterSalesStore.getState().deleteSale('sale-1');

    expect(salesDeleteMock).not.toHaveBeenCalled();
    expect(saleSplitsDeleteMock).not.toHaveBeenCalled();

    const queue = useSyncStore.getState().queue;
    expect(queue).toHaveLength(2);
    expect(queue.map((q) => q.table)).toEqual(['sales', 'sale_payment_splits']);
    expect(queue.map((q) => q.type)).toEqual(['DELETE', 'DELETE']);
    expect(useWaterSalesStore.getState().sales).toHaveLength(0);
  });
});
