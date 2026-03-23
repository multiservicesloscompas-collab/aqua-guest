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

function buildBaseSale(overrides: Partial<Sale> = {}): Sale {
  return {
    id: 'sale-1',
    dailyNumber: 1,
    date: '2026-03-07',
    items: [],
    paymentMethod: 'efectivo',
    totalBs: 100,
    totalUsd: 2,
    exchangeRate: 50,
    createdAt: '2026-03-07T10:00:00.000Z',
    updatedAt: '2026-03-07T10:00:00.000Z',
    ...overrides,
  };
}

function buildBaseRental(overrides: Partial<WasherRental> = {}): WasherRental {
  return {
    id: 'rental-1',
    date: '2026-03-07',
    customerName: 'Cliente',
    customerPhone: '000',
    customerAddress: 'Dirección',
    machineId: 'm-1',
    shift: 'medio',
    deliveryTime: '10:00',
    pickupTime: '18:00',
    pickupDate: '2026-03-07',
    deliveryFee: 0,
    totalUsd: 4,
    paymentMethod: 'pago_movil',
    status: 'finalizado',
    isPaid: true,
    datePaid: '2026-03-07',
    createdAt: '2026-03-07T11:00:00.000Z',
    updatedAt: '2026-03-07T11:00:00.000Z',
    ...overrides,
  };
}

describe('calculateDashboardMetrics tip payout behavior', () => {
  it('applies tip payouts as idempotent expenses and avoids double counting', () => {
    const sales = [
      buildBaseSale({ totalBs: 200, paymentMethod: 'pago_movil' }),
    ];
    const rentals = [
      buildBaseRental({
        totalUsd: 2,
        paymentMethod: 'efectivo',
        datePaid: '2026-03-07',
      }),
    ];

    const result = calculateDashboardMetrics({
      selectedDate: '2026-03-07',
      exchangeRate: 50,
      sales,
      rentals,
      expenses: EMPTY_EXPENSES,
      prepaidOrders: EMPTY_PREPAID,
      paymentBalanceTransactions: EMPTY_BALANCE_TX,
      tipPayouts: [
        {
          id: 'payout-dup',
          tipDate: '2026-03-07',
          paidAt: '2026-03-07T14:00:00.000Z',
          paymentMethod: 'pago_movil',
          amountBs: 30,
          originType: 'sale',
          originId: 'sale-1',
        },
        {
          id: 'payout-dup',
          tipDate: '2026-03-07',
          paidAt: '2026-03-07T14:01:00.000Z',
          paymentMethod: 'pago_movil',
          amountBs: 30,
          originType: 'rental',
          originId: 'rental-1',
        },
        {
          id: 'payout-rental',
          tipDate: '2026-03-07',
          paidAt: '2026-03-07T14:05:00.000Z',
          paymentMethod: 'efectivo',
          amountBs: 20,
          originType: 'rental',
          originId: 'rental-1',
        },
      ],
    });

    expect(result.day.totalIncomeBs).toBe(300);
    expect(result.day.expenseBs).toBe(50);
    expect(result.day.netBs).toBe(250);
    expect(result.day.methodTotalsBs).toEqual({
      efectivo: 80,
      pago_movil: 170,
      punto_venta: 0,
      divisa: 0,
    });
  });

  it('normalizes tip payout paidAt by Venezuela timezone for day bucket', () => {
    const result = calculateDashboardMetrics({
      selectedDate: '2026-03-13',
      exchangeRate: 50,
      sales: [],
      rentals: [],
      expenses: EMPTY_EXPENSES,
      prepaidOrders: EMPTY_PREPAID,
      paymentBalanceTransactions: EMPTY_BALANCE_TX,
      tipPayouts: [
        {
          id: 'tip-late-utc',
          tipDate: '2026-03-13',
          paidAt: '2026-03-14T02:30:00.000Z',
          paymentMethod: 'punto_venta',
          amountBs: 300,
          originType: 'sale',
          originId: 'sale-3',
        },
        {
          id: 'tip-normal',
          tipDate: '2026-03-13',
          paidAt: '2026-03-13T18:30:00.000Z',
          paymentMethod: 'pago_movil',
          amountBs: 200,
          originType: 'sale',
          originId: 'sale-2',
        },
      ],
    });

    expect(result.day.expenseBs).toBe(500);
    expect(result.day.methodTotalsBs.pago_movil).toBe(-200);
    expect(result.day.methodTotalsBs.punto_venta).toBe(-300);
    expect(result.day.transactionsCount).toBe(2);
  });
});
