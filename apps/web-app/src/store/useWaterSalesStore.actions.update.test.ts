import { beforeEach, describe, expect, it, vi } from 'vitest';
import { updateSaleAction } from './useWaterSalesStore.actions.update';
import type { WaterSalesState } from './useWaterSalesStore.core';

const {
  enqueueOfflineSaleUpdateMock,
  enqueueOfflineSalePaymentSplitsReplaceMock,
  invalidateCacheMock,
} = vi.hoisted(() => ({
  enqueueOfflineSaleUpdateMock: vi.fn(),
  enqueueOfflineSalePaymentSplitsReplaceMock: vi.fn(),
  invalidateCacheMock: vi.fn(),
}));

vi.mock('@/offline/enqueue/salesEnqueue', () => ({
  enqueueOfflineSaleUpdate: enqueueOfflineSaleUpdateMock,
  enqueueOfflineSalePaymentSplitsReplace:
    enqueueOfflineSalePaymentSplitsReplaceMock,
}));

vi.mock('@/services/SalesDataService', () => ({
  salesDataService: {
    invalidateCache: invalidateCacheMock,
  },
}));

vi.mock('@/lib/supabaseClient', () => ({
  default: {
    from: vi.fn(() => ({
      update: vi.fn(() => ({
        eq: vi.fn().mockResolvedValue({ error: null }),
      })),
    })),
  },
}));

function buildState(): WaterSalesState {
  return {
    sales: [
      {
        id: 'sale-1',
        dailyNumber: 1,
        date: '2026-03-07',
        items: [],
        paymentMethod: 'efectivo',
        paymentSplits: [
          {
            method: 'efectivo',
            amountBs: 100,
            amountUsd: 2,
            exchangeRateUsed: 50,
          },
        ],
        totalBs: 100,
        totalUsd: 2,
        exchangeRate: 50,
        createdAt: '2026-03-07T12:00:00.000Z',
        updatedAt: '2026-03-07T12:00:00.000Z',
      },
    ],
    cart: [],
    loadingSalesByRange: {},
    setSales: vi.fn(),
    addToCart: vi.fn(),
    updateCartItem: vi.fn(),
    removeFromCart: vi.fn(),
    clearCart: vi.fn(),
    completeSale: vi.fn(),
    updateSale: vi.fn(),
    deleteSale: vi.fn(),
    getSalesByDate: vi.fn(),
    loadSalesByDate: vi.fn(),
    loadSalesByDateRange: vi.fn(),
  };
}

describe('updateSaleAction tip-aware recomputation guard', () => {
  beforeEach(() => {
    enqueueOfflineSaleUpdateMock.mockReset();
    enqueueOfflineSalePaymentSplitsReplaceMock.mockReset();
    invalidateCacheMock.mockReset();

    Object.defineProperty(globalThis, 'navigator', {
      configurable: true,
      value: { onLine: false },
    });
  });

  it('keeps explicit totals and explicit mixed splits when tipInput is provided', async () => {
    let state = buildState();
    const setState = vi.fn((partial) => {
      const next = typeof partial === 'function' ? partial(state) : partial;
      state = { ...state, ...next };
    });
    const getState = () => state;

    await updateSaleAction(
      'sale-1',
      {
        paymentMethod: 'pago_movil',
        totalBs: 150,
        totalUsd: 3,
        paymentSplits: [
          {
            method: 'pago_movil',
            amountBs: 95,
            amountUsd: 1.9,
            exchangeRateUsed: 50,
          },
          {
            method: 'efectivo',
            amountBs: 55,
            amountUsd: 1.1,
            exchangeRateUsed: 50,
          },
        ],
      },
      {
        amountBs: 50,
        capturePaymentMethod: 'efectivo',
      },
      setState,
      getState
    );

    const updated = state.sales[0];
    expect(updated.totalBs).toBe(150);
    expect(updated.totalUsd).toBe(3);
    expect(updated.paymentSplits).toEqual([
      {
        method: 'pago_movil',
        amountBs: 95,
        amountUsd: 1.9,
        exchangeRateUsed: 50,
      },
      {
        method: 'efectivo',
        amountBs: 55,
        amountUsd: 1.1,
        exchangeRateUsed: 50,
      },
    ]);

    expect(enqueueOfflineSalePaymentSplitsReplaceMock).toHaveBeenCalledWith(
      'sale-1',
      [
        {
          method: 'pago_movil',
          amountBs: 95,
          amountUsd: 1.9,
          exchangeRateUsed: 50,
        },
        {
          method: 'efectivo',
          amountBs: 55,
          amountUsd: 1.1,
          exchangeRateUsed: 50,
        },
      ]
    );
  });
});
