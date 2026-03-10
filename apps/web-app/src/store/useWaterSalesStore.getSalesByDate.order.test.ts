import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useWaterSalesStore } from './useWaterSalesStore';

vi.mock('@/services/SalesDataService', () => ({
  salesDataService: {
    invalidateCache: vi.fn(),
    loadSalesByDate: vi.fn(),
    loadSalesByDateRange: vi.fn(),
  },
}));

vi.mock('@/lib/supabaseClient', () => {
  const client = {
    from: vi.fn(() => ({
      insert: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      select: vi.fn(),
    })),
  };

  return {
    default: client,
    supabase: client,
  };
});

describe('useWaterSalesStore getSalesByDate ordering', () => {
  beforeEach(() => {
    useWaterSalesStore.setState({
      sales: [
        {
          id: 'sale-older',
          dailyNumber: 1,
          date: '2026-03-07',
          items: [],
          paymentMethod: 'efectivo',
          totalBs: 100,
          totalUsd: 2,
          exchangeRate: 50,
          createdAt: '2026-03-07T10:00:00.000Z',
          updatedAt: '2026-03-07T10:00:00.000Z',
        },
        {
          id: 'sale-newer',
          dailyNumber: 2,
          date: '2026-03-07',
          items: [],
          paymentMethod: 'pago_movil',
          totalBs: 200,
          totalUsd: 4,
          exchangeRate: 50,
          createdAt: '2026-03-07T11:00:00.000Z',
          updatedAt: '2026-03-07T11:00:00.000Z',
        },
        {
          id: 'sale-other-day',
          dailyNumber: 1,
          date: '2026-03-06',
          items: [],
          paymentMethod: 'divisa',
          totalBs: 150,
          totalUsd: 3,
          exchangeRate: 50,
          createdAt: '2026-03-06T09:00:00.000Z',
          updatedAt: '2026-03-06T09:00:00.000Z',
        },
      ],
      cart: [],
      loadingSalesByRange: {},
    });
  });

  it('returns selected date sales in descending temporal order', () => {
    const result = useWaterSalesStore.getState().getSalesByDate('2026-03-07');

    expect(result.map((sale) => sale.id)).toEqual(['sale-newer', 'sale-older']);
  });
});
