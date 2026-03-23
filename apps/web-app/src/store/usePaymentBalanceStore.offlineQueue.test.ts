import { beforeEach, describe, expect, it, vi } from 'vitest';
import { usePaymentBalanceStore } from './usePaymentBalanceStore';
import { useSyncStore } from './useSyncStore';

const paymentBalanceInsertMock = vi.fn();

vi.mock('@/services/payments/paymentBalanceSummary', () => ({
  calculatePaymentBalanceSummary: vi.fn(() => []),
}));

vi.mock('./useConfigStore', () => ({
  useConfigStore: {
    getState: () => ({ config: { exchangeRate: 50 } }),
  },
}));

vi.mock('./useRentalStore', () => ({
  useRentalStore: {
    getState: () => ({ rentals: [] }),
  },
}));

vi.mock('./useWaterSalesStore', () => ({
  useWaterSalesStore: {
    getState: () => ({ sales: [] }),
  },
}));

vi.mock('./usePrepaidStore', () => ({
  usePrepaidStore: {
    getState: () => ({ prepaidOrders: [] }),
  },
}));

vi.mock('@/lib/supabaseClient', () => {
  const from = vi.fn((table: string) => {
    if (table === 'payment_balance_transactions') {
      return {
        insert: paymentBalanceInsertMock,
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

describe('usePaymentBalanceStore offline queueing', () => {
  beforeEach(() => {
    paymentBalanceInsertMock.mockReset();
    useSyncStore.getState().clearQueue();
    usePaymentBalanceStore.setState({ paymentBalanceTransactions: [] });

    Object.defineProperty(globalThis, 'navigator', {
      configurable: true,
      value: { onLine: false },
    });
  });

  it('queues payment balance create and does not call supabase offline', async () => {
    await usePaymentBalanceStore.getState().addPaymentBalanceTransaction({
      date: '2026-03-09',
      fromMethod: 'pago_movil',
      toMethod: 'efectivo',
      amount: 500,
      amountBs: 500,
      amountUsd: 10,
      notes: 'Cierre diario',
    });

    expect(paymentBalanceInsertMock).not.toHaveBeenCalled();
    const queue = useSyncStore.getState().queue;
    expect(queue).toHaveLength(1);
    expect(queue[0].table).toBe('payment_balance_transactions');
    expect(queue[0].type).toBe('INSERT');
    expect(queue[0].payload).toMatchObject({
      operation_type: 'equilibrio',
      amount_out_bs: 500,
      amount_in_bs: 500,
      difference_bs: 0,
    });
    expect(
      usePaymentBalanceStore.getState().paymentBalanceTransactions
    ).toHaveLength(1);
  });

  it('queues avance fields in create payload when provided', async () => {
    await usePaymentBalanceStore.getState().addPaymentBalanceTransaction({
      date: '2026-03-10',
      operationType: 'avance',
      fromMethod: 'pago_movil',
      toMethod: 'efectivo',
      amount: 1000,
      amountBs: 1000,
      amountUsd: 20,
      amountOutBs: 1000,
      amountOutUsd: 20,
      amountInBs: 980,
      amountInUsd: 19.6,
      differenceBs: -20,
      differenceUsd: -0.4,
      notes: 'Avance no equivalente',
    });

    const queue = useSyncStore.getState().queue;
    expect(queue).toHaveLength(1);
    expect(queue[0].payload).toMatchObject({
      operation_type: 'avance',
      amount: 1000,
      amount_bs: 1000,
      amount_usd: 20,
      amount_out_bs: 1000,
      amount_out_usd: 20,
      amount_in_bs: 980,
      amount_in_usd: 19.6,
      difference_bs: -20,
      difference_usd: -0.4,
    });
  });
});
