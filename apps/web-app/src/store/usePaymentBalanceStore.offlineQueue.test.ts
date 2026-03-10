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
    expect(
      usePaymentBalanceStore.getState().paymentBalanceTransactions
    ).toHaveLength(1);
  });
});
