import { beforeEach, describe, expect, it, vi } from 'vitest';
import { usePaymentBalanceStore } from './usePaymentBalanceStore';
import { useExpenseStore } from './useExpenseStore';
import { useTipStore } from './useTipStore';
import { useWaterSalesStore } from './useWaterSalesStore';
import { useConfigStore } from './useConfigStore';

vi.mock('@/lib/supabaseClient', () => {
  const client = { from: vi.fn() };
  return { default: client, supabase: client };
});

describe('usePaymentBalanceStore.getPaymentBalanceSummary (FIN-05)', () => {
  beforeEach(() => {
    useConfigStore.setState((state) => ({
      config: { ...state.config, exchangeRate: 50 },
    }));
    usePaymentBalanceStore.setState({ paymentBalanceTransactions: [] });
    useWaterSalesStore.setState({
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
          createdAt: '2026-03-07T08:00:00.000Z',
          updatedAt: '2026-03-07T08:00:00.000Z',
        },
      ],
    });
    useExpenseStore.setState({
      expenses: [
        {
          id: 'expense-1',
          date: '2026-03-07',
          description: 'Gasto',
          amount: 30,
          category: 'otros',
          paymentMethod: 'efectivo',
          createdAt: '2026-03-07T09:00:00.000Z',
        },
      ],
    });
    useTipStore.setState({
      tipPayouts: [
        {
          id: 'tip-1',
          originType: 'sale',
          originId: 'sale-1',
          tipDate: '2026-03-07',
          amountBs: 20,
          paidAt: '2026-03-07T12:00:00.000Z',
          paymentMethod: 'efectivo',
        },
      ],
    });
  });

  it('subtracts the stored expenses and tip payouts of the day', () => {
    // Act
    const summary = usePaymentBalanceStore
      .getState()
      .getPaymentBalanceSummary('2026-03-07');

    // Assert
    const cash = summary.find((row) => row.method === 'efectivo');
    expect(cash?.originalTotal).toBe(50);
    expect(cash?.finalTotal).toBe(50);
  });
});
