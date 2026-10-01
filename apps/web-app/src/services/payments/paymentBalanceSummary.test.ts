import { describe, expect, it } from 'vitest';
import { calculatePaymentBalanceSummary } from './paymentBalanceSummary';
import { calculateDashboardMetrics } from '@/services/DashboardMetricsService';
import type {
  Expense,
  PaymentBalanceTransaction,
  PrepaidOrder,
  Sale,
  TipPayout,
  WasherRental,
} from '@/types';

const EMPTY_PREPAID: PrepaidOrder[] = [];

describe('calculatePaymentBalanceSummary', () => {
  it('calculates original totals from split-aware sales/rentals and legacy prepaid', () => {
    const sales: Sale[] = [
      {
        id: 'sale-1',
        dailyNumber: 1,
        date: '2026-03-07',
        items: [],
        paymentMethod: 'efectivo',
        paymentSplits: [
          {
            method: 'efectivo',
            amountBs: 70,
            amountUsd: 1.4,
            exchangeRateUsed: 50,
          },
          {
            method: 'pago_movil',
            amountBs: 30,
            amountUsd: 0.6,
            exchangeRateUsed: 50,
          },
        ],
        totalBs: 100,
        totalUsd: 2,
        exchangeRate: 50,
        createdAt: '2026-03-07T08:00:00.000Z',
        updatedAt: '2026-03-07T08:00:00.000Z',
      },
    ];

    const rentals: WasherRental[] = [
      {
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
        paymentSplits: [
          {
            method: 'divisa',
            amountBs: 100,
            amountUsd: 2,
            exchangeRateUsed: 50,
          },
          {
            method: 'efectivo',
            amountBs: 100,
            amountUsd: 2,
            exchangeRateUsed: 50,
          },
        ],
        status: 'finalizado',
        isPaid: true,
        datePaid: '2026-03-07',
        createdAt: '2026-03-07T09:00:00.000Z',
        updatedAt: '2026-03-07T09:00:00.000Z',
      },
    ];

    const prepaidOrders: PrepaidOrder[] = [
      {
        id: 'prepaid-1',
        customerName: 'Cliente PP',
        liters: 19,
        amountBs: 200,
        amountUsd: 4,
        exchangeRate: 50,
        paymentMethod: 'punto_venta',
        status: 'pendiente',
        datePaid: '2026-03-07',
        createdAt: '2026-03-07T10:00:00.000Z',
        updatedAt: '2026-03-07T10:00:00.000Z',
      },
    ];

    const summary = calculatePaymentBalanceSummary({
      date: '2026-03-07',
      exchangeRate: 50,
      sales,
      prepaidOrders,
      rentals,
      paymentBalanceTransactions: [],
    });

    expect(summary).toEqual([
      {
        method: 'efectivo',
        originalTotal: 170,
        adjustments: 0,
        finalTotal: 170,
      },
      {
        method: 'pago_movil',
        originalTotal: 30,
        adjustments: 0,
        finalTotal: 30,
      },
      {
        method: 'punto_venta',
        originalTotal: 200,
        adjustments: 0,
        finalTotal: 200,
      },
      { method: 'divisa', originalTotal: 100, adjustments: 0, finalTotal: 100 },
    ]);
  });

  it('applies balance adjustments with deterministic amount fallback', () => {
    const transactions: PaymentBalanceTransaction[] = [
      {
        id: 'tx-bs',
        date: '2026-03-07',
        fromMethod: 'efectivo',
        toMethod: 'divisa',
        amount: 999,
        amountBs: 20,
        createdAt: '2026-03-07T11:00:00.000Z',
        updatedAt: '2026-03-07T11:00:00.000Z',
      },
      {
        id: 'tx-usd',
        date: '2026-03-07',
        fromMethod: 'divisa',
        toMethod: 'pago_movil',
        amount: 0,
        amountUsd: 1,
        createdAt: '2026-03-07T12:00:00.000Z',
        updatedAt: '2026-03-07T12:00:00.000Z',
      },
      {
        id: 'tx-avance',
        date: '2026-03-07',
        operationType: 'avance',
        fromMethod: 'pago_movil',
        toMethod: 'efectivo',
        amount: 0,
        amountOutBs: 80,
        amountInBs: 75,
        differenceBs: -5,
        createdAt: '2026-03-07T13:00:00.000Z',
        updatedAt: '2026-03-07T13:00:00.000Z',
      },
    ];

    const summary = calculatePaymentBalanceSummary({
      date: '2026-03-07',
      exchangeRate: 50,
      sales: [],
      prepaidOrders: EMPTY_PREPAID,
      rentals: [],
      paymentBalanceTransactions: transactions,
    });

    expect(summary).toEqual([
      {
        method: 'efectivo',
        originalTotal: 0,
        adjustments: 55,
        finalTotal: 55,
      },
      {
        method: 'pago_movil',
        originalTotal: 0,
        adjustments: -30,
        finalTotal: -30,
      },
      {
        method: 'punto_venta',
        originalTotal: 0,
        adjustments: 0,
        finalTotal: 0,
      },
      { method: 'divisa', originalTotal: 0, adjustments: -30, finalTotal: -30 },
    ]);
  });

  it('uses explicit out/in usd legs before legacy fields for avance semantics', () => {
    const transactions: PaymentBalanceTransaction[] = [
      {
        id: 'tx-avance-usd-legs',
        date: '2026-03-07',
        operationType: 'avance',
        fromMethod: 'divisa',
        toMethod: 'pago_movil',
        amount: 999,
        amountBs: 999,
        amountUsd: 10,
        amountOutUsd: 2,
        amountInUsd: 1.8,
        createdAt: '2026-03-07T14:00:00.000Z',
        updatedAt: '2026-03-07T14:00:00.000Z',
      },
    ];

    const summary = calculatePaymentBalanceSummary({
      date: '2026-03-07',
      exchangeRate: 50,
      sales: [],
      prepaidOrders: EMPTY_PREPAID,
      rentals: [],
      paymentBalanceTransactions: transactions,
    });

    expect(summary).toEqual([
      { method: 'efectivo', originalTotal: 0, adjustments: 0, finalTotal: 0 },
      {
        method: 'pago_movil',
        originalTotal: 0,
        adjustments: 90,
        finalTotal: 90,
      },
      {
        method: 'punto_venta',
        originalTotal: 0,
        adjustments: 0,
        finalTotal: 0,
      },
      {
        method: 'divisa',
        originalTotal: 0,
        adjustments: -100,
        finalTotal: -100,
      },
    ]);
  });
});

describe('calculatePaymentBalanceSummary outflows (FIN-05)', () => {
  const DATE = '2026-03-07';

  const sale = (amountBs: number, method: Sale['paymentMethod']): Sale => ({
    id: `sale-${method}-${amountBs}`,
    dailyNumber: 1,
    date: DATE,
    items: [],
    paymentMethod: method,
    paymentSplits: [
      { method, amountBs, amountUsd: amountBs / 50, exchangeRateUsed: 50 },
    ],
    totalBs: amountBs,
    totalUsd: amountBs / 50,
    exchangeRate: 50,
    createdAt: `${DATE}T08:00:00.000Z`,
    updatedAt: `${DATE}T08:00:00.000Z`,
  });

  const expense = (overrides: Partial<Expense>): Expense => ({
    id: 'expense-1',
    date: DATE,
    description: 'Gasto',
    amount: 30,
    category: 'otros',
    paymentMethod: 'efectivo',
    createdAt: `${DATE}T09:00:00.000Z`,
    ...overrides,
  });

  const payout = (overrides: Partial<TipPayout>): TipPayout => ({
    id: 'tip-1',
    originType: 'sale',
    originId: 'sale-1',
    tipDate: DATE,
    amountBs: 20,
    paidAt: `${DATE}T12:00:00.000Z`,
    paymentMethod: 'efectivo',
    ...overrides,
  });

  const summarize = (
    extra: Partial<Parameters<typeof calculatePaymentBalanceSummary>[0]>
  ) =>
    calculatePaymentBalanceSummary({
      date: DATE,
      exchangeRate: 50,
      sales: [sale(100, 'efectivo')],
      prepaidOrders: EMPTY_PREPAID,
      rentals: [],
      paymentBalanceTransactions: [],
      ...extra,
    });

  const byMethod = (
    summary: ReturnType<typeof calculatePaymentBalanceSummary>,
    method: string
  ) => summary.find((row) => row.method === method);

  it('subtracts the expenses of the day from the method they were paid with', () => {
    // Arrange / Act
    const summary = summarize({ expenses: [expense({ amount: 30 })] });

    // Assert
    expect(byMethod(summary, 'efectivo')?.originalTotal).toBe(70);
    expect(byMethod(summary, 'efectivo')?.finalTotal).toBe(70);
  });

  it('subtracts a mixed expense per method', () => {
    const summary = summarize({
      sales: [sale(100, 'efectivo'), sale(80, 'pago_movil')],
      expenses: [
        expense({
          amount: 50,
          paymentSplits: [
            { method: 'efectivo', amountBs: 30, amountUsd: 0.6 },
            { method: 'pago_movil', amountBs: 20, amountUsd: 0.4 },
          ],
        }),
      ],
    });

    expect(byMethod(summary, 'efectivo')?.finalTotal).toBe(70);
    expect(byMethod(summary, 'pago_movil')?.finalTotal).toBe(60);
  });

  it('subtracts paid tip payouts from the method they were paid with', () => {
    const summary = summarize({
      tipPayouts: [payout({ amountBs: 20, paymentMethod: 'efectivo' })],
    });

    expect(byMethod(summary, 'efectivo')?.finalTotal).toBe(80);
  });

  it('ignores expenses and tip payouts of other days', () => {
    const summary = summarize({
      expenses: [expense({ date: '2026-03-06', amount: 30 })],
      tipPayouts: [
        payout({
          tipDate: '2026-03-06',
          paidAt: '2026-03-06T12:00:00.000Z',
        }),
      ],
    });

    expect(byMethod(summary, 'efectivo')?.finalTotal).toBe(100);
  });

  it('keeps applying transfers on top of the net of outflows', () => {
    const transfer: PaymentBalanceTransaction = {
      id: 'tx-1',
      date: DATE,
      operationType: 'equilibrio',
      amount: 40,
      amountBs: 40,
      amountUsd: 0.8,
      amountOutBs: 40,
      amountInBs: 40,
      fromMethod: 'efectivo',
      toMethod: 'pago_movil',
      createdAt: `${DATE}T10:00:00.000Z`,
      updatedAt: `${DATE}T10:00:00.000Z`,
    } as PaymentBalanceTransaction;

    const summary = summarize({
      expenses: [expense({ amount: 30 })],
      paymentBalanceTransactions: [transfer],
    });

    expect(byMethod(summary, 'efectivo')?.originalTotal).toBe(70);
    expect(byMethod(summary, 'efectivo')?.adjustments).toBe(-40);
    expect(byMethod(summary, 'efectivo')?.finalTotal).toBe(30);
    expect(byMethod(summary, 'pago_movil')?.finalTotal).toBe(40);
  });

  it('matches the dashboard per-method totals for the same data', () => {
    const sales = [sale(100, 'efectivo'), sale(80, 'pago_movil')];
    const expenses = [expense({ amount: 30 })];
    const tipPayouts = [payout({ amountBs: 20, paymentMethod: 'pago_movil' })];

    const summary = summarize({ sales, expenses, tipPayouts });
    const dashboard = calculateDashboardMetrics({
      selectedDate: DATE,
      exchangeRate: 50,
      sales,
      rentals: [],
      expenses,
      prepaidOrders: EMPTY_PREPAID,
      paymentBalanceTransactions: [],
      tipPayouts,
    }).day.methodTotalsBs;

    for (const row of summary) {
      expect(row.finalTotal).toBe(dashboard[row.method]);
    }
  });
});
