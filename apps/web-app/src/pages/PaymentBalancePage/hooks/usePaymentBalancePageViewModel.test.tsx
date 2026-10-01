/* @vitest-environment jsdom */

import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAppStore } from '@/store/useAppStore';
import { useConfigStore } from '@/store/useConfigStore';
import { useExpenseStore } from '@/store/useExpenseStore';
import { usePaymentBalanceStore } from '@/store/usePaymentBalanceStore';
import { useRentalStore } from '@/store/useRentalStore';
import { useTipStore } from '@/store/useTipStore';
import { useWaterSalesStore } from '@/store/useWaterSalesStore';
import type { Expense, PaymentBalanceTransaction, TipPayout } from '@/types';
import { usePaymentBalancePageViewModel } from './usePaymentBalancePageViewModel';

vi.mock('@/lib/supabaseClient', () => {
  const client = { from: vi.fn() };
  return { default: client, supabase: client };
});

const DATE = '2026-03-07';
const loadExpensesByDateMock = vi.fn();
const loadPaidTipsByDateRangeMock = vi.fn();

const cashFinal = (
  summary: ReturnType<typeof usePaymentBalancePageViewModel>['balanceSummary']
) => summary.find((row) => row.method === 'efectivo')?.finalTotal;

describe('usePaymentBalancePageViewModel summary (FIN-05, FIN-03)', () => {
  beforeEach(() => {
    loadExpensesByDateMock.mockReset().mockResolvedValue([]);
    loadPaidTipsByDateRangeMock.mockReset().mockResolvedValue(undefined);
    useAppStore.setState({ selectedDate: DATE });
    useConfigStore.setState((state) => ({
      config: { ...state.config, exchangeRate: 50 },
    }));
    useRentalStore.setState({ rentals: [] });
    usePaymentBalanceStore.setState({ paymentBalanceTransactions: [] });
    useExpenseStore.setState({
      expenses: [],
      loadExpensesByDate: loadExpensesByDateMock,
    });
    useTipStore.setState({
      tips: [],
      tipPayouts: [],
      loadPaidTipsByDateRange: loadPaidTipsByDateRangeMock,
    });
    useWaterSalesStore.setState({
      sales: [
        {
          id: 'sale-1',
          dailyNumber: 1,
          date: DATE,
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
          createdAt: `${DATE}T08:00:00.000Z`,
          updatedAt: `${DATE}T08:00:00.000Z`,
        },
      ],
    });
  });

  it('recalculates when expenses arrive after the first render', () => {
    // Arrange
    const { result } = renderHook(() => usePaymentBalancePageViewModel());
    expect(cashFinal(result.current.balanceSummary)).toBe(100);

    // Act
    act(() => {
      useExpenseStore.setState({
        expenses: [
          {
            id: 'expense-1',
            date: DATE,
            description: 'Gasto',
            amount: 30,
            category: 'otros',
            paymentMethod: 'efectivo',
            createdAt: `${DATE}T09:00:00.000Z`,
          } satisfies Expense,
        ],
      });
    });

    // Assert
    expect(cashFinal(result.current.balanceSummary)).toBe(70);
  });

  it('recalculates when a paid tip payout arrives', () => {
    const { result } = renderHook(() => usePaymentBalancePageViewModel());

    act(() => {
      useTipStore.setState({
        tipPayouts: [
          {
            id: 'tip-1',
            originType: 'sale',
            originId: 'sale-1',
            tipDate: DATE,
            amountBs: 20,
            paidAt: `${DATE}T12:00:00.000Z`,
            paymentMethod: 'efectivo',
          } satisfies TipPayout,
        ],
      });
    });

    expect(cashFinal(result.current.balanceSummary)).toBe(80);
  });

  it('recalculates when a transfer is registered', () => {
    const { result } = renderHook(() => usePaymentBalancePageViewModel());

    act(() => {
      usePaymentBalanceStore.setState({
        paymentBalanceTransactions: [
          {
            id: 'tx-1',
            date: DATE,
            operationType: 'equilibrio',
            amount: 50,
            amountBs: 50,
            amountUsd: 1,
            amountOutBs: 50,
            amountInBs: 50,
            fromMethod: 'efectivo',
            toMethod: 'pago_movil',
            createdAt: `${DATE}T10:00:00.000Z`,
            updatedAt: `${DATE}T10:00:00.000Z`,
          } as PaymentBalanceTransaction,
        ],
      });
    });

    expect(cashFinal(result.current.balanceSummary)).toBe(50);
  });

  it('loads the expenses and paid tips of the selected date', () => {
    const { rerender } = renderHook(() => usePaymentBalancePageViewModel());

    expect(loadExpensesByDateMock).toHaveBeenCalledWith(DATE);
    expect(loadPaidTipsByDateRangeMock).toHaveBeenCalledWith(DATE, DATE);

    act(() => {
      useAppStore.setState({ selectedDate: '2026-03-08' });
    });
    rerender();

    expect(loadExpensesByDateMock).toHaveBeenCalledWith('2026-03-08');
    expect(loadPaidTipsByDateRangeMock).toHaveBeenCalledWith(
      '2026-03-08',
      '2026-03-08'
    );
  });
});
