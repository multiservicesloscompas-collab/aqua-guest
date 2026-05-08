import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useWaterSalesStore } from './useWaterSalesStore';
import { useConfigStore } from './useConfigStore';
import { useTipStore } from './useTipStore';

const {
  completeSaleActionMock,
  deleteSaleActionMock,
  updateSaleActionMock,
  upsertTipForOriginMock,
  deleteTipByOriginMock,
  toTipPayoutReadModelMock,
} = vi.hoisted(() => ({
  completeSaleActionMock: vi.fn(),
  deleteSaleActionMock: vi.fn(),
  updateSaleActionMock: vi.fn(),
  upsertTipForOriginMock: vi.fn(),
  deleteTipByOriginMock: vi.fn(),
  toTipPayoutReadModelMock: vi.fn(),
}));

vi.mock('./useWaterSalesStore.actions', () => ({
  completeSaleAction: completeSaleActionMock,
  updateSaleAction: updateSaleActionMock,
  deleteSaleAction: deleteSaleActionMock,
}));

vi.mock('@/services/tips/TipDataService', () => ({
  tipsDataService: {
    deleteTipByOrigin: deleteTipByOriginMock,
    upsertTipForOrigin: upsertTipForOriginMock,
    toTipPayoutReadModel: toTipPayoutReadModelMock,
  },
}));

vi.mock('@/services/SalesDataService', () => ({
  salesDataService: {
    loadSalesByDate: vi.fn(),
    loadSalesByDateRange: vi.fn(async () => new Map()),
  },
}));

vi.mock('@/services/DateService', () => ({
  dateService: {
    normalizeSaleDate: (date: string) => date,
  },
}));

vi.mock('@/services/SalesFilterService', () => ({
  DateFilterStrategy: class {},
  SalesFilterService: class {
    filterSales(sales: unknown[]) {
      return sales;
    }
  },
}));

describe('useWaterSalesStore tip integration', () => {
  beforeEach(() => {
    completeSaleActionMock.mockReset();
    deleteSaleActionMock.mockReset();
    updateSaleActionMock.mockReset();
    deleteTipByOriginMock.mockReset();
    upsertTipForOriginMock.mockReset();
    toTipPayoutReadModelMock.mockReset();
    toTipPayoutReadModelMock.mockReturnValue([]);

    useWaterSalesStore.setState({
      sales: [
        {
          id: 'sale-1',
          dailyNumber: 1,
          date: '2026-03-13',
          items: [],
          paymentMethod: 'efectivo',
          totalBs: 100,
          totalUsd: 2,
          exchangeRate: 50,
          createdAt: '2026-03-13T10:00:00.000Z',
          updatedAt: '2026-03-13T10:00:00.000Z',
        },
      ],
      cart: [],
      loadingSalesByRange: {},
    });

    useConfigStore.setState((state) => ({
      config: {
        ...state.config,
        exchangeRate: 50,
      },
    }));

    useTipStore.setState({
      tips: [],
      tipPayouts: [],
      loadingByRange: {},
    });
  });

  it('creates sale tip linked to created sale origin', async () => {
    upsertTipForOriginMock.mockResolvedValueOnce({
      id: 'tip-created',
      originType: 'sale',
      originId: 'sale-new-1',
      tipDate: '2026-03-13',
      amountBs: 20,
      amountUsd: 0.4,
      exchangeRateUsed: 50,
      capturePaymentMethod: 'pago_movil',
      status: 'pending',
      notes: 'cliente feliz',
      createdAt: '2026-03-13T11:00:00.000Z',
      updatedAt: '2026-03-13T11:00:00.000Z',
    });

    completeSaleActionMock.mockResolvedValueOnce({
      id: 'sale-new-1',
      dailyNumber: 2,
      date: '2026-03-13',
      items: [],
      paymentMethod: 'efectivo',
      totalBs: 80,
      totalUsd: 1.6,
      exchangeRate: 50,
      createdAt: '2026-03-13T11:00:00.000Z',
      updatedAt: '2026-03-13T11:00:00.000Z',
    });

    await useWaterSalesStore
      .getState()
      .completeSale('efectivo', '2026-03-13', undefined, undefined, {
        amountBs: 20,
        capturePaymentMethod: 'pago_movil',
        notes: 'cliente feliz',
      });

    expect(upsertTipForOriginMock).toHaveBeenCalledWith({
      originType: 'sale',
      originId: 'sale-new-1',
      tipDate: '2026-03-13',
      amountBs: 20,
      amountUsd: 0.4,
      exchangeRateUsed: 50,
      capturePaymentMethod: 'pago_movil',
      notes: 'cliente feliz',
    });
    expect(useTipStore.getState().tips).toHaveLength(1);
    expect(useTipStore.getState().tips[0]?.originId).toBe('sale-new-1');
  });

  it('updates sale tip with mandatory origin link on edit', async () => {
    upsertTipForOriginMock.mockResolvedValueOnce({
      id: 'tip-updated',
      originType: 'sale',
      originId: 'sale-1',
      tipDate: '2026-03-13',
      amountBs: 25,
      amountUsd: 0.5,
      exchangeRateUsed: 50,
      capturePaymentMethod: 'efectivo',
      status: 'pending',
      createdAt: '2026-03-13T10:00:00.000Z',
      updatedAt: '2026-03-13T10:05:00.000Z',
    });

    updateSaleActionMock.mockResolvedValueOnce(undefined);

    await useWaterSalesStore.getState().updateSale(
      'sale-1',
      { notes: 'editada' },
      {
        amountBs: 25,
        capturePaymentMethod: 'efectivo',
      }
    );

    expect(upsertTipForOriginMock).toHaveBeenCalledWith({
      originType: 'sale',
      originId: 'sale-1',
      tipDate: '2026-03-13',
      amountBs: 25,
      amountUsd: 0.5,
      exchangeRateUsed: 50,
      capturePaymentMethod: 'efectivo',
      notes: undefined,
    });
    expect(useTipStore.getState().tips).toHaveLength(1);
    expect(useTipStore.getState().tips[0]?.amountBs).toBe(25);
  });

  it('deletes sale tip by origin when deleting a sale', async () => {
    deleteSaleActionMock.mockResolvedValueOnce(undefined);

    await useWaterSalesStore.getState().deleteSale('sale-1');

    expect(deleteSaleActionMock).toHaveBeenCalledTimes(1);
    const deleteTipArg = deleteSaleActionMock.mock.calls[0][3];
    expect(typeof deleteTipArg).toBe('function');

    await deleteTipArg('sale', 'sale-1');
    expect(deleteTipByOriginMock).toHaveBeenCalledWith('sale', 'sale-1');
  });
});
