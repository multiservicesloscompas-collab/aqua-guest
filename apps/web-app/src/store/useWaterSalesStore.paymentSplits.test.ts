import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useWaterSalesStore } from './useWaterSalesStore';

const salesUpdateEqMock = vi.fn();
const salesUpdateMock = vi.fn(() => ({ eq: salesUpdateEqMock }));
const salesSplitsDeleteEqMock = vi.fn();
const salesSplitsDeleteMock = vi.fn(() => ({ eq: salesSplitsDeleteEqMock }));
const salesSplitsInsertMock = vi.fn();

vi.mock('@/services/SalesDataService', () => ({
  salesDataService: {
    invalidateCache: vi.fn(),
  },
}));

vi.mock('@/services/tips/TipDataService', () => ({
  tipsDataService: {
    upsertTipForOrigin: vi.fn(),
    deleteTipByOrigin: vi.fn(),
  },
}));

vi.mock('@/lib/supabaseClient', () => {
  const from = vi.fn((table: string) => {
    if (table === 'sales') {
      return {
        update: salesUpdateMock,
      };
    }

    if (table === 'sale_payment_splits') {
      return {
        delete: salesSplitsDeleteMock,
        insert: salesSplitsInsertMock,
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

describe('useWaterSalesStore payment split persistence', () => {
  beforeEach(() => {
    salesUpdateEqMock.mockResolvedValue({ error: null });
    salesSplitsDeleteEqMock.mockResolvedValue({ error: null });
    salesSplitsInsertMock.mockResolvedValue({ error: null });

    salesUpdateMock.mockClear();
    salesUpdateEqMock.mockClear();
    salesSplitsDeleteMock.mockClear();
    salesSplitsDeleteEqMock.mockClear();
    salesSplitsInsertMock.mockClear();

    useWaterSalesStore.setState({
      sales: [
        {
          id: 'sale-1',
          dailyNumber: 1,
          date: '2026-03-07',
          items: [],
          paymentMethod: 'efectivo',
          totalBs: 100,
          totalUsd: 2,
          exchangeRate: 50,
          createdAt: '2026-03-07T12:00:00.000Z',
          updatedAt: '2026-03-07T12:00:00.000Z',
        },
      ],
      cart: [],
      loadingSalesByRange: {},
    });
  });

  it('updates sale from single -> mixed and persists normalized split rows', async () => {
    await useWaterSalesStore.getState().updateSale('sale-1', {
      paymentMethod: 'efectivo',
      paymentSplits: [
        {
          method: 'efectivo',
          amountBs: 30,
          amountUsd: 0.6,
          exchangeRateUsed: 50,
        },
        {
          method: 'pago_movil',
          amountBs: 70,
          amountUsd: 1.4,
          exchangeRateUsed: 50,
        },
      ],
    });

    expect(salesUpdateMock).toHaveBeenCalledTimes(1);
    expect(salesUpdateEqMock).toHaveBeenCalledWith('id', 'sale-1');

    const updatePayload = (
      salesUpdateMock.mock.calls as unknown as Array<
        Array<{ payment_method: string }>
      >
    )[0]?.[0];
    expect(updatePayload).toBeDefined();
    expect(updatePayload.payment_method).toBe('pago_movil');

    expect(salesSplitsDeleteEqMock).toHaveBeenCalledWith('sale_id', 'sale-1');
    expect(salesSplitsInsertMock).toHaveBeenCalledWith([
      {
        sale_id: 'sale-1',
        payment_method: 'efectivo',
        amount_bs: 30,
        amount_usd: 0.6,
        exchange_rate_used: 50,
      },
      {
        sale_id: 'sale-1',
        payment_method: 'pago_movil',
        amount_bs: 70,
        amount_usd: 1.4,
        exchange_rate_used: 50,
      },
    ]);

    const updatedSale = useWaterSalesStore
      .getState()
      .sales.find((sale) => sale.id === 'sale-1');

    expect(updatedSale?.paymentMethod).toBe('pago_movil');
    expect(updatedSale?.paymentSplits).toHaveLength(2);
  });

  it('updates sale from mixed -> single and persists one split row', async () => {
    useWaterSalesStore.setState({
      sales: [
        {
          ...useWaterSalesStore.getState().sales[0],
          paymentMethod: 'pago_movil',
          paymentSplits: [
            {
              method: 'pago_movil',
              amountBs: 70,
              amountUsd: 1.4,
              exchangeRateUsed: 50,
            },
            {
              method: 'efectivo',
              amountBs: 30,
              amountUsd: 0.6,
              exchangeRateUsed: 50,
            },
          ],
        },
      ],
    });

    await useWaterSalesStore.getState().updateSale('sale-1', {
      paymentMethod: 'divisa',
      paymentSplits: [
        { method: 'divisa', amountBs: 100, amountUsd: 2, exchangeRateUsed: 50 },
      ],
    });

    const updatePayload = (
      salesUpdateMock.mock.calls as unknown as Array<
        Array<{ payment_method: string }>
      >
    )[0]?.[0];
    expect(updatePayload).toBeDefined();
    expect(updatePayload.payment_method).toBe('divisa');
    expect(salesSplitsInsertMock).toHaveBeenCalledWith([
      {
        sale_id: 'sale-1',
        payment_method: 'divisa',
        amount_bs: 100,
        amount_usd: 2,
        exchange_rate_used: 50,
      },
    ]);

    const updatedSale = useWaterSalesStore
      .getState()
      .sales.find((sale) => sale.id === 'sale-1');
    expect(updatedSale?.paymentMethod).toBe('divisa');
    expect(updatedSale?.paymentSplits).toEqual([
      { method: 'divisa', amountBs: 100, amountUsd: 2, exchangeRateUsed: 50 },
    ]);
  });

  it('preserves explicit total and split amounts when tipInput is provided on edit', async () => {
    await useWaterSalesStore.getState().updateSale(
      'sale-1',
      {
        paymentMethod: 'pago_movil',
        totalBs: 100, // Pass principal amount
        totalUsd: 2,
        paymentSplits: [
          {
            method: 'pago_movil',
            amountBs: 80,
            amountUsd: 1.6,
            exchangeRateUsed: 50,
          },
          {
            method: 'efectivo',
            amountBs: 60,
            amountUsd: 1.2,
            exchangeRateUsed: 50,
          },
        ],
      },
      {
        amountBs: 40,
        capturePaymentMethod: 'efectivo',
      }
    );

    const updatePayload = (
      salesUpdateMock.mock.calls as unknown as Array<
        Array<{ total_bs: number; total_usd: number }>
      >
    )[0]?.[0];
    expect(updatePayload.total_bs).toBe(140); // Base 100 + Tip 40
    expect(updatePayload.total_usd).toBe(2.8);

    expect(salesSplitsInsertMock).toHaveBeenCalledWith([
      {
        sale_id: 'sale-1',
        payment_method: 'pago_movil',
        amount_bs: 80,
        amount_usd: 1.6,
        exchange_rate_used: 50,
      },
      {
        sale_id: 'sale-1',
        payment_method: 'efectivo',
        amount_bs: 60,
        amount_usd: 1.2,
        exchange_rate_used: 50,
      },
    ]);
  });
});
