import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useWaterSalesStore } from './useWaterSalesStore';
import { useConfigStore } from './useConfigStore';
import { useSyncStore } from './useSyncStore';

const salesUpdateEqMock = vi.fn();
const salesUpdateMock = vi.fn(() => ({ eq: salesUpdateEqMock }));
const salesDeleteEqMock = vi.fn();
const salesDeleteMock = vi.fn(() => ({ eq: salesDeleteEqMock }));
const saleSplitsDeleteEqMock = vi.fn();
const saleSplitsDeleteMock = vi.fn(() => ({ eq: saleSplitsDeleteEqMock }));
const saleSplitsInsertMock = vi.fn();
const tipsDeleteEqMock = vi.fn();
const tipsDeleteScopeEqMock = vi.fn();
const tipsDeleteMock = vi.fn(() => ({ eq: tipsDeleteEqMock }));
const tipsUpsertMock = vi.fn();
const tipsInsertMock = vi.fn();

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

    if (table === 'tips') {
      return {
        delete: tipsDeleteMock,
        upsert: tipsUpsertMock,
        insert: tipsInsertMock,
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
    tipsDeleteEqMock.mockReset();
    tipsDeleteScopeEqMock.mockReset();
    tipsDeleteMock.mockReset();
    tipsUpsertMock.mockReset();
    tipsInsertMock.mockReset();

    tipsDeleteEqMock.mockImplementation(() => ({ eq: tipsDeleteScopeEqMock }));
    tipsDeleteScopeEqMock.mockResolvedValue({ error: null });

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

    useConfigStore.setState((state) => ({
      config: {
        ...state.config,
        exchangeRate: 50,
      },
    }));

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

  it('queues edited sale with tip added to total and capture split, plus the tip upsert', async () => {
    await useWaterSalesStore.getState().updateSale(
      'sale-1',
      {
        paymentMethod: 'pago_movil',
        totalBs: 140,
        totalUsd: 2.8,
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
        notes: 'edicion offline',
      }
    );

    const queue = useSyncStore.getState().queue;
    expect(queue.map((q) => `${q.table}:${q.type}`)).toEqual([
      'sales:UPDATE',
      'sale_payment_splits:DELETE',
      'sale_payment_splits:INSERT',
      'tips:INSERT',
    ]);

    expect(queue[0].payload).toMatchObject({
      id: 'sale-1',
      total_bs: 180, // principal 140 Bs + tip 40 Bs
      total_usd: 3.6,
      payment_method: 'efectivo', // legacy method = largest split (efectivo 100 > pago_movil 80)
    });
    expect(
      (queue[2].payload as { splits: Array<{ amount_bs: number }> }).splits
    ).toHaveLength(2);
    expect(queue[3].payload).toMatchObject({
      origin_type: 'sale',
      origin_id: 'sale-1',
      amount_bs: 40,
      capture_payment_method: 'efectivo',
      notes: 'edicion offline',
    });
  });

  it('queues sale delete + split delete and removes local sale when offline', async () => {
    await useWaterSalesStore.getState().deleteSale('sale-1');

    expect(salesDeleteMock).not.toHaveBeenCalled();
    expect(saleSplitsDeleteMock).not.toHaveBeenCalled();
    expect(tipsDeleteMock).not.toHaveBeenCalled();

    const queue = useSyncStore.getState().queue;
    expect(queue).toHaveLength(3);
    expect(queue.map((q) => q.table)).toEqual([
      'sales',
      'sale_payment_splits',
      'tips',
    ]);
    expect(queue.map((q) => q.type)).toEqual(['DELETE', 'DELETE', 'DELETE']);
    expect(useWaterSalesStore.getState().sales).toHaveLength(0);
  });

  it('queues the tip of a new sale instead of calling supabase when offline (B11)', async () => {
    // Arrange
    useWaterSalesStore.setState({
      cart: [
        {
          id: 'item-1',
          productId: 'product-1',
          productName: 'Garrafón',
          quantity: 1,
          unitPrice: 1000,
          subtotal: 1000,
        },
      ],
    });

    // Act
    const sale = await useWaterSalesStore
      .getState()
      .completeSale('efectivo', '2026-03-09', undefined, undefined, {
        amountBs: 100,
        capturePaymentMethod: 'efectivo',
      });

    // Assert
    expect(tipsUpsertMock).not.toHaveBeenCalled();
    expect(tipsInsertMock).not.toHaveBeenCalled();
    const queue = useSyncStore.getState().queue;
    const saleAction = queue.find((entry) => entry.table === 'sales');
    const tipAction = queue.find((entry) => entry.table === 'tips');
    expect(tipAction?.type).toBe('INSERT');
    expect(tipAction?.payload).toMatchObject({
      origin_type: 'sale',
      origin_id: sale.id,
      amount_bs: 100,
      __op: 'upsert_on_origin',
    });
    expect(tipAction?.dependencies.dependsOn).toEqual([
      saleAction?.idempotency.businessKey,
    ]);
  });
});
