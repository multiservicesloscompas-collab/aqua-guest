import { describe, expect, it } from 'vitest';
import {
  buildPaymentMethodTransactions,
  type PaymentMethodDetailTransactionItem,
  summarizePaymentMethodTransactions,
} from './paymentMethodDetailTransactions';
import type {
  Expense,
  PaymentBalanceTransaction,
  PaymentMethod,
  PrepaidOrder,
  Sale,
  WasherRental,
} from '@/types';

function getMethodLabel(method: PaymentMethod) {
  return method;
}

const EMPTY_EXPENSES: Expense[] = [];
const EMPTY_PREPAID: PrepaidOrder[] = [];

describe('paymentMethodDetailTransactions', () => {
  it('builds split-aware and legacy-fallback transactions for selected method', () => {
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
            amountBs: 20,
            amountUsd: 0.4,
            exchangeRateUsed: 50,
          },
          {
            method: 'pago_movil',
            amountBs: 80,
            amountUsd: 1.6,
            exchangeRateUsed: 50,
          },
        ],
        totalBs: 100,
        totalUsd: 2,
        exchangeRate: 50,
        createdAt: '2026-03-07T08:00:00.000Z',
        updatedAt: '2026-03-07T08:00:00.000Z',
      },
      {
        id: 'sale-legacy',
        dailyNumber: 2,
        date: '2026-03-07',
        items: [],
        paymentMethod: 'pago_movil',
        totalBs: 30,
        totalUsd: 0.6,
        exchangeRate: 50,
        createdAt: '2026-03-07T09:00:00.000Z',
        updatedAt: '2026-03-07T09:00:00.000Z',
      },
    ];

    const rentals: WasherRental[] = [
      {
        id: 'rental-1',
        date: '2026-03-07',
        customerName: 'Cliente',
        customerPhone: '000',
        customerAddress: 'Dir',
        machineId: 'm1',
        shift: 'medio',
        deliveryTime: '10:00',
        pickupTime: '18:00',
        pickupDate: '2026-03-07',
        deliveryFee: 0,
        totalUsd: 4,
        paymentMethod: 'efectivo',
        paymentSplits: [
          {
            method: 'pago_movil',
            amountBs: 50,
            amountUsd: 1,
            exchangeRateUsed: 50,
          },
          {
            method: 'divisa',
            amountBs: 150,
            amountUsd: 3,
            exchangeRateUsed: 50,
          },
        ],
        status: 'finalizado',
        isPaid: true,
        datePaid: '2026-03-07',
        createdAt: '2026-03-07T10:00:00.000Z',
        updatedAt: '2026-03-07T10:00:00.000Z',
      },
    ];

    const paymentBalanceTransactions: PaymentBalanceTransaction[] = [
      {
        id: 'tx-1',
        date: '2026-03-07',
        fromMethod: 'pago_movil',
        toMethod: 'efectivo',
        amount: 500,
        amountBs: 25,
        createdAt: '2026-03-07T11:00:00.000Z',
        updatedAt: '2026-03-07T11:00:00.000Z',
      },
      {
        id: 'tx-2',
        date: '2026-03-07',
        fromMethod: 'divisa',
        toMethod: 'pago_movil',
        amount: 0,
        amountUsd: 1,
        createdAt: '2026-03-07T12:00:00.000Z',
        updatedAt: '2026-03-07T12:00:00.000Z',
      },
    ];

    const transactions = buildPaymentMethodTransactions({
      paymentMethod: 'pago_movil',
      selectedDate: '2026-03-07',
      exchangeRate: 50,
      sales,
      rentals,
      expenses: EMPTY_EXPENSES,
      prepaidOrders: EMPTY_PREPAID,
      paymentBalanceTransactions,
      getMethodLabel,
    });

    expect(
      transactions.map((tx: PaymentMethodDetailTransactionItem) => tx.type)
    ).toEqual(['sale', 'sale', 'rental', 'balance_out', 'balance_in']);

    expect(
      transactions.map((tx: PaymentMethodDetailTransactionItem) => tx.amountBs)
    ).toEqual([80, 30, 50, 25, 50]);

    expect(summarizePaymentMethodTransactions(transactions)).toEqual({
      income: 160,
      expenses: 0,
      balanceIn: 50,
      balanceOut: 25,
      net: 185,
    });
  });
});
