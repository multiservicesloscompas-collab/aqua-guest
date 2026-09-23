import { describe, expect, it } from 'vitest';
import { calculateDashboardMetrics } from './DashboardMetricsService';
import type {
  Expense,
  PaymentBalanceTransaction,
  PrepaidOrder,
  Sale,
  WasherRental,
} from '@/types';

const EMPTY_EXPENSES: Expense[] = [];
const EMPTY_PREPAID: PrepaidOrder[] = [];
const EMPTY_BALANCE_TX: PaymentBalanceTransaction[] = [];
const EMPTY_RENTALS: WasherRental[] = [];

describe('calculateDashboardMetrics — divisa payment with change', () => {
  it('attributes the full tender to divisa and the change as a deduction from the remainder method, with no code changes needed to the allocator', () => {
    const sale: Sale = {
      id: 'sale-1',
      dailyNumber: 3,
      date: '2026-08-21',
      items: [],
      paymentMethod: 'divisa',
      totalBs: 600,
      totalUsd: 0.71,
      exchangeRate: 850,
      paymentSplits: [
        {
          method: 'divisa',
          amountBs: 4250,
          amountUsd: 5,
          exchangeRateUsed: 850,
          kind: 'payment',
        },
        {
          method: 'divisa',
          amountBs: -3400,
          amountUsd: -4,
          exchangeRateUsed: 850,
          kind: 'change',
        },
        {
          method: 'efectivo',
          amountBs: -250,
          amountUsd: -0.29,
          exchangeRateUsed: 850,
          kind: 'change',
        },
      ],
      createdAt: '2026-08-21T13:55:00.000Z',
      updatedAt: '2026-08-21T13:55:00.000Z',
    };

    const result = calculateDashboardMetrics({
      selectedDate: '2026-08-21',
      exchangeRate: 850,
      sales: [sale],
      rentals: EMPTY_RENTALS,
      expenses: EMPTY_EXPENSES,
      prepaidOrders: EMPTY_PREPAID,
      paymentBalanceTransactions: EMPTY_BALANCE_TX,
    });

    expect(result.day.methodTotalsBs).toEqual({
      efectivo: -250,
      pago_movil: 0,
      punto_venta: 0,
      divisa: 850,
    });
    expect(result.day.waterBs).toBe(600);

    const totalAcrossMethods = Object.values(result.day.methodTotalsBs).reduce(
      (sum, value) => sum + value,
      0
    );
    expect(totalAcrossMethods).toBe(600);
  });
});
