import { describe, expect, it } from 'vitest';
import { calculateDashboardMetrics } from './DashboardMetricsService';
import type { Expense, PaymentBalanceTransaction, PrepaidOrder } from '@/types';

const EMPTY_PREPAID: PrepaidOrder[] = [];
const EMPTY_BALANCE_TX: PaymentBalanceTransaction[] = [];

describe('calculateDashboardMetrics expense split attribution', () => {
  it('attributes mixed and legacy expenses by method without changing expense total', () => {
    const expenses: Expense[] = [
      {
        id: 'expense-mixed',
        date: '2026-03-07',
        description: 'Mixto',
        amount: 100,
        category: 'operativo',
        paymentMethod: 'efectivo',
        paymentSplits: [
          {
            method: 'efectivo',
            amountBs: 40,
            amountUsd: 0.8,
            exchangeRateUsed: 50,
          },
          {
            method: 'pago_movil',
            amountBs: 60,
            amountUsd: 1.2,
            exchangeRateUsed: 50,
          },
        ],
        createdAt: '2026-03-07T10:00:00.000Z',
      },
      {
        id: 'expense-legacy',
        date: '2026-03-07',
        description: 'Legacy',
        amount: 30,
        category: 'servicios',
        paymentMethod: 'divisa',
        createdAt: '2026-03-07T10:00:00.000Z',
      },
    ];

    const result = calculateDashboardMetrics({
      selectedDate: '2026-03-07',
      exchangeRate: 50,
      sales: [],
      rentals: [],
      expenses,
      prepaidOrders: EMPTY_PREPAID,
      paymentBalanceTransactions: EMPTY_BALANCE_TX,
    });

    expect(result.day.expenseBs).toBe(130);
    expect(result.day.methodTotalsBs).toEqual({
      efectivo: -40,
      pago_movil: -60,
      punto_venta: 0,
      divisa: -30,
    });
  });

  it('falls back to legacy method when paymentSplits are invalid', () => {
    const expenses: Expense[] = [
      {
        id: 'expense-invalid-split',
        date: '2026-03-07',
        description: 'Split invalido',
        amount: 90,
        category: 'otros',
        paymentMethod: 'punto_venta',
        paymentSplits: [
          {
            method: 'punto_venta',
            amountBs: 90,
            amountUsd: 1.8,
            exchangeRateUsed: 50,
          },
        ],
        createdAt: '2026-03-07T10:00:00.000Z',
      },
    ];

    const result = calculateDashboardMetrics({
      selectedDate: '2026-03-07',
      exchangeRate: 50,
      sales: [],
      rentals: [],
      expenses,
      prepaidOrders: EMPTY_PREPAID,
      paymentBalanceTransactions: EMPTY_BALANCE_TX,
    });

    expect(result.day.expenseBs).toBe(90);
    expect(result.day.methodTotalsBs).toEqual({
      efectivo: 0,
      pago_movil: 0,
      punto_venta: -90,
      divisa: 0,
    });
  });
});
