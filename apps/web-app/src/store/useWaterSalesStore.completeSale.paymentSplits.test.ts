import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useConfigStore } from './useConfigStore';
import { useWaterSalesStore } from './useWaterSalesStore';

const salesInsertSingleMock = vi.fn();
const salesInsertSelectMock = vi.fn(() => ({
  single: salesInsertSingleMock,
}));
const salesInsertMock = vi.fn(() => ({
  select: salesInsertSelectMock,
}));

const salesSplitsDeleteEqMock = vi.fn();
const salesSplitsDeleteMock = vi.fn(() => ({ eq: salesSplitsDeleteEqMock }));
const salesSplitsInsertMock = vi.fn();

const salesSplitsSelectEqMock = vi.fn();
const salesSplitsSelectMock = vi.fn(() => ({ eq: salesSplitsSelectEqMock }));

vi.mock('@/services/SalesDataService', () => ({
  salesDataService: {
    invalidateCache: vi.fn(),
  },
}));

vi.mock('@/lib/supabaseClient', () => {
  const from = vi.fn((table: string) => {
    if (table === 'sales') {
      return {
        insert: salesInsertMock,
      };
    }

    if (table === 'sale_payment_splits') {
      return {
        delete: salesSplitsDeleteMock,
        insert: salesSplitsInsertMock,
        select: salesSplitsSelectMock,
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

describe('useWaterSalesStore completeSale mixed/single compatibility', () => {
  beforeEach(() => {
    salesInsertSingleMock.mockResolvedValue({
      data: {
        id: 'sale-new-1',
        daily_number: 2,
        date: '2026-03-07',
        items: [
          {
            id: 'cart-1',
            productId: 'prod-1',
            productName: 'Recarga 19L',
            quantity: 1,
            unitPrice: 100,
            subtotal: 100,
          },
        ],
        payment_method: 'pago_movil',
        total_bs: 100,
        total_usd: 2,
        exchange_rate: 50,
        notes: null,
        created_at: '2026-03-07T12:00:00.000Z',
        updated_at: '2026-03-07T12:00:00.000Z',
      },
      error: null,
    });

    salesSplitsDeleteEqMock.mockResolvedValue({ error: null });
    salesSplitsInsertMock.mockResolvedValue({ error: null });
    salesSplitsSelectEqMock.mockResolvedValue({
      data: [
        {
          payment_method: 'efectivo',
          amount_bs: 30,
          amount_usd: 0.6,
          exchange_rate_used: 50,
        },
        {
          payment_method: 'pago_movil',
          amount_bs: 70,
          amount_usd: 1.4,
          exchange_rate_used: 50,
        },
      ],
      error: null,
    });

    salesInsertMock.mockClear();
    salesInsertSelectMock.mockClear();
    salesInsertSingleMock.mockClear();
    salesSplitsDeleteMock.mockClear();
    salesSplitsDeleteEqMock.mockClear();
    salesSplitsInsertMock.mockClear();
    salesSplitsSelectMock.mockClear();
    salesSplitsSelectEqMock.mockClear();

    useConfigStore.setState((state) => ({
      ...state,
      config: {
        ...state.config,
        exchangeRate: 50,
      },
    }));

    useWaterSalesStore.setState({
      sales: [
        {
          id: 'sale-existing-1',
          dailyNumber: 1,
          date: '2026-03-07',
          items: [],
          paymentMethod: 'efectivo',
          totalBs: 80,
          totalUsd: 1.6,
          exchangeRate: 50,
          createdAt: '2026-03-07T10:00:00.000Z',
          updatedAt: '2026-03-07T10:00:00.000Z',
        },
      ],
      cart: [
        {
          id: 'cart-1',
          productId: 'prod-1',
          productName: 'Recarga 19L',
          quantity: 1,
          unitPrice: 100,
          subtotal: 100,
        },
      ],
      loadingSalesByRange: {},
    });
  });

  it('creates sale with mixed splits and keeps single-method compatibility field', async () => {
    const sale = await useWaterSalesStore
      .getState()
      .completeSale('efectivo', '2026-03-07', 'pago mixto', [
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
      ]);

    const insertPayload = (
      salesInsertMock.mock.calls as unknown as Array<
        Array<{ payment_method: string; daily_number: number }>
      >
    )[0]?.[0];

    expect(insertPayload).toBeDefined();
    expect(insertPayload.daily_number).toBe(2);
    expect(insertPayload.payment_method).toBe('pago_movil');

    expect(salesSplitsDeleteEqMock).toHaveBeenCalledWith(
      'sale_id',
      'sale-new-1'
    );
    expect(salesSplitsInsertMock).toHaveBeenCalledWith([
      {
        sale_id: 'sale-new-1',
        payment_method: 'efectivo',
        amount_bs: 30,
        amount_usd: 0.6,
        exchange_rate_used: 50,
      },
      {
        sale_id: 'sale-new-1',
        payment_method: 'pago_movil',
        amount_bs: 70,
        amount_usd: 1.4,
        exchange_rate_used: 50,
      },
    ]);

    expect(sale.paymentMethod).toBe('pago_movil');
    expect(sale.paymentSplits).toHaveLength(2);
    expect(useWaterSalesStore.getState().cart).toHaveLength(0);
  });

  it('creates sale with a single split preserving legacy single-method behavior', async () => {
    salesInsertSingleMock.mockResolvedValueOnce({
      data: {
        id: 'sale-new-2',
        daily_number: 2,
        date: '2026-03-07',
        items: useWaterSalesStore.getState().cart,
        payment_method: 'efectivo',
        total_bs: 100,
        total_usd: 2,
        exchange_rate: 50,
        notes: null,
        created_at: '2026-03-07T12:30:00.000Z',
        updated_at: '2026-03-07T12:30:00.000Z',
      },
      error: null,
    });

    salesSplitsSelectEqMock.mockResolvedValueOnce({
      data: [
        {
          payment_method: 'efectivo',
          amount_bs: 100,
          amount_usd: 2,
          exchange_rate_used: 50,
        },
      ],
      error: null,
    });

    const sale = await useWaterSalesStore
      .getState()
      .completeSale('efectivo', '2026-03-07', undefined, [
        {
          method: 'efectivo',
          amountBs: 100,
          amountUsd: 2,
          exchangeRateUsed: 50,
        },
      ]);

    const insertPayload = (
      salesInsertMock.mock.calls as unknown as Array<
        Array<{ payment_method: string }>
      >
    )[0]?.[0];
    expect(insertPayload).toBeDefined();
    expect(insertPayload.payment_method).toBe('efectivo');

    expect(salesSplitsInsertMock).toHaveBeenCalledWith([
      {
        sale_id: 'sale-new-2',
        payment_method: 'efectivo',
        amount_bs: 100,
        amount_usd: 2,
        exchange_rate_used: 50,
      },
    ]);

    expect(sale.paymentMethod).toBe('efectivo');
    expect(sale.paymentSplits).toEqual([
      { method: 'efectivo', amountBs: 100, amountUsd: 2, exchangeRateUsed: 50 },
    ]);
  });
});
