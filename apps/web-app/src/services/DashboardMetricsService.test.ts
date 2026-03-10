import { describe, expect, it } from 'vitest';
import { calculateDashboardMetrics } from './DashboardMetricsService';
import type {
  Expense,
  PaymentBalanceTransaction,
  PrepaidOrder,
  Sale,
  WasherRental,
} from '@/types';

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

const EMPTY_EXPENSES: Expense[] = [];
const EMPTY_PREPAID: PrepaidOrder[] = [];
const EMPTY_BALANCE_TX: PaymentBalanceTransaction[] = [];

describe('calculateDashboardMetrics split-aware behavior', () => {
  it('uses split allocation for sales and rentals with legacy fallback', () => {
    const sales: Sale[] = [
      buildBaseSale({
        id: 'sale-split',
        paymentMethod: 'efectivo',
        totalBs: 100,
        totalUsd: 2,
        paymentSplits: [
          {
            method: 'efectivo',
            amountBs: 60,
            amountUsd: 1.2,
            exchangeRateUsed: 50,
          },
          {
            method: 'pago_movil',
            amountBs: 40,
            amountUsd: 0.8,
            exchangeRateUsed: 50,
          },
        ],
      }),
      buildBaseSale({
        id: 'sale-legacy',
        paymentMethod: 'punto_venta',
        totalBs: 50,
        totalUsd: 1,
      }),
    ];

    const rentals: WasherRental[] = [
      buildBaseRental({
        id: 'rental-split',
        totalUsd: 4,
        paymentMethod: 'divisa',
        paymentSplits: [
          {
            method: 'divisa',
            amountBs: 150,
            amountUsd: 3,
            exchangeRateUsed: 50,
          },
          {
            method: 'efectivo',
            amountBs: 50,
            amountUsd: 1,
            exchangeRateUsed: 50,
          },
        ],
      }),
      buildBaseRental({
        id: 'rental-legacy',
        totalUsd: 2,
        paymentMethod: 'pago_movil',
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
    });

    expect(result.day.methodTotalsBs).toEqual({
      efectivo: 110,
      pago_movil: 140,
      punto_venta: 50,
      divisa: 150,
    });
    expect(result.day.totalIncomeBs).toBe(450);
  });

  it('uses deterministic amountBs/amountUsd fallback for payment balance transfers', () => {
    const sales = [buildBaseSale()];
    const rentals: WasherRental[] = [];
    const paymentBalanceTransactions: PaymentBalanceTransaction[] = [
      {
        id: 'tx-amount-bs',
        date: '2026-03-07',
        fromMethod: 'efectivo',
        toMethod: 'pago_movil',
        amount: 999,
        amountBs: 30,
        createdAt: '2026-03-07T12:00:00.000Z',
        updatedAt: '2026-03-07T12:00:00.000Z',
      },
      {
        id: 'tx-amount-usd',
        date: '2026-03-07',
        fromMethod: 'pago_movil',
        toMethod: 'divisa',
        amount: 0,
        amountUsd: 2,
        createdAt: '2026-03-07T13:00:00.000Z',
        updatedAt: '2026-03-07T13:00:00.000Z',
      },
    ];

    const result = calculateDashboardMetrics({
      selectedDate: '2026-03-07',
      exchangeRate: 50,
      sales,
      rentals,
      expenses: EMPTY_EXPENSES,
      prepaidOrders: EMPTY_PREPAID,
      paymentBalanceTransactions,
    });

    expect(result.day.methodTotalsBs).toEqual({
      efectivo: 70,
      pago_movil: -70,
      punto_venta: 0,
      divisa: 100,
    });
  });
});
