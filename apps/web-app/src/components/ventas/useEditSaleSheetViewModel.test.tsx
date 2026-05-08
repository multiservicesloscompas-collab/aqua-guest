import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Sale } from '@/types';
import type { Tip } from '@/types/tips';
import { useTipStore } from '@/store/useTipStore';
import { useEditSaleSheetViewModel } from './useEditSaleSheetViewModel';

const mockUpdateSale = vi.fn();
const mockLoadTipsByDateRange = vi.fn();

const mockConfigState = {
  config: {
    exchangeRate: 50,
  },
  isMixedPaymentEnabled: vi.fn(() => true),
};

const mockTipState: {
  tips: Tip[];
  loadTipsByDateRange: typeof mockLoadTipsByDateRange;
} = {
  tips: [],
  loadTipsByDateRange: mockLoadTipsByDateRange,
};

vi.mock('@/store/useWaterSalesStore', () => ({
  useWaterSalesStore: () => ({
    updateSale: mockUpdateSale,
  }),
}));

vi.mock('@/store/useConfigStore', () => ({
  useConfigStore: (selector?: (state: typeof mockConfigState) => unknown) =>
    selector ? selector(mockConfigState) : mockConfigState,
}));

vi.mock('@/store/useTipStore', () => ({
  useTipStore: Object.assign(
    () => mockTipState,
    {
      getState: () => mockTipState,
    }
  ),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

function buildSale(overrides: Partial<Sale> = {}): Sale {
  return {
    id: 'sale-1',
    dailyNumber: 1,
    date: '2026-05-05',
    items: [
      {
        id: 'item-1',
        productId: 'prod-1',
        productName: 'Botellon 19L',
        quantity: 1,
        unitPrice: 120,
        subtotal: 120,
      },
    ],
    paymentMethod: 'efectivo',
    totalBs: 120,
    totalUsd: 2.4,
    exchangeRate: 50,
    createdAt: '2026-05-05T10:00:00.000Z',
    updatedAt: '2026-05-05T10:00:00.000Z',
    ...overrides,
  };
}

describe('useEditSaleSheetViewModel', () => {
  beforeEach(() => {
    mockUpdateSale.mockReset();
    mockLoadTipsByDateRange.mockReset();
    mockLoadTipsByDateRange.mockResolvedValue(undefined);
    mockTipState.tips = [];
    mockConfigState.isMixedPaymentEnabled.mockClear();
  });

  it('keeps mixed payment disabled when editing a non-mixed sale', async () => {
    const sale = buildSale({
      paymentMethod: 'punto_venta',
      paymentSplits: [
        {
          method: 'punto_venta',
          amountBs: 120,
          amountUsd: 2.4,
          exchangeRateUsed: 50,
        },
      ],
    });

    const { result } = renderHook(() =>
      useEditSaleSheetViewModel({
        sale,
        open: true,
        onOpenChange: vi.fn(),
      })
    );

    await waitFor(() => {
      expect(result.current.isMixedPayment).toBe(false);
    });

    expect(result.current.paymentMethod).toBe('punto_venta');
    expect(result.current.split1Amount).toBe('');
    expect(result.current.split2Method).toBe('efectivo');
  });

  it('hydrates mixed payment state from valid split data', async () => {
    const sale = buildSale({
      paymentMethod: 'efectivo',
      paymentSplits: [
        {
          method: 'pago_movil',
          amountBs: 80,
          amountUsd: 1.6,
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

    const { result } = renderHook(() =>
      useEditSaleSheetViewModel({
        sale,
        open: true,
        onOpenChange: vi.fn(),
      })
    );

    await waitFor(() => {
      expect(result.current.isMixedPayment).toBe(true);
    });

    expect(result.current.paymentMethod).toBe('pago_movil');
    expect(result.current.split1Amount).toBe('40');
    expect(result.current.split2Method).toBe('efectivo');
  });

  it('loads tips only once for the same sale date when no linked tip exists', async () => {
    const sale = buildSale();

    mockLoadTipsByDateRange.mockImplementation(async () => {
      mockTipState.tips = [
        {
          id: 'tip-other-sale',
          originType: 'sale',
          originId: 'sale-2',
          tipDate: sale.date,
          amountBs: 15,
          capturePaymentMethod: 'efectivo',
          status: 'pending',
          notes: '',
          createdAt: '2026-05-05T10:00:00.000Z',
          updatedAt: '2026-05-05T10:00:00.000Z',
        },
      ];
    });

    const { rerender } = renderHook(
      ({ currentSale, isOpen }) =>
        useEditSaleSheetViewModel({
          sale: currentSale,
          open: isOpen,
          onOpenChange: vi.fn(),
        }),
      {
        initialProps: {
          currentSale: sale,
          isOpen: true,
        },
      }
    );

    await waitFor(() => {
      expect(mockLoadTipsByDateRange).toHaveBeenCalledTimes(1);
    });

    rerender({
      currentSale: sale,
      isOpen: true,
    });

    expect(mockLoadTipsByDateRange).toHaveBeenCalledTimes(1);
    expect(useTipStore.getState().tips).toEqual(mockTipState.tips);
  });
});
