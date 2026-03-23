import { describe, expect, it } from 'vitest';
import { calculatePaymentBalanceSummary } from './paymentBalanceSummary';
import type {
  PaymentBalanceTransaction,
  PrepaidOrder,
  Sale,
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
