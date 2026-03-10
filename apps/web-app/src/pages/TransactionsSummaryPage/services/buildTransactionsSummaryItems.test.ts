import { describe, expect, it } from 'vitest';
import {
  buildTransactionsSummaryItems,
  type TransactionItem,
} from './buildTransactionsSummaryItems';
import type {
  Expense,
  PaymentBalanceTransaction,
  PrepaidOrder,
  Sale,
  WasherRental,
} from '@/types';

const EMPTY_EXPENSES: Expense[] = [];
const EMPTY_PREPAID: PrepaidOrder[] = [];

describe('buildTransactionsSummaryItems', () => {
  it('splits sale and rental rows by payment split with legacy fallback', () => {
    const sales: Sale[] = [
      {
        id: 'sale-split',
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
      {
        id: 'sale-legacy',
        dailyNumber: 2,
        date: '2026-03-07',
        items: [],
        paymentMethod: 'punto_venta',
        totalBs: 50,
        totalUsd: 1,
        exchangeRate: 50,
        createdAt: '2026-03-07T08:30:00.000Z',
        updatedAt: '2026-03-07T08:30:00.000Z',
      },
    ];

    const rentals: WasherRental[] = [
      {
        id: 'rental-split',
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
        status: 'finalizado',
        isPaid: true,
        datePaid: '2026-03-07',
        createdAt: '2026-03-07T09:00:00.000Z',
        updatedAt: '2026-03-07T09:00:00.000Z',
      },
    ];

    const items = buildTransactionsSummaryItems({
      selectedDate: '2026-03-07',
      exchangeRate: 50,
      sales,
      rentals,
      expenses: EMPTY_EXPENSES,
      prepaidOrders: EMPTY_PREPAID,
      paymentBalanceTransactions: [],
    });

    const saleAndRental = items.filter(
      (item: TransactionItem) => item.type === 'sale' || item.type === 'rental'
    );

    expect(saleAndRental).toHaveLength(5);
    expect(
      saleAndRental
        .map((item: TransactionItem) => item.amountBs)
        .sort((a: number, b: number) => a - b)
    ).toEqual([30, 50, 50, 70, 150]);
  });

  it('uses amountBs then amountUsd then amount fallback for balance transfer rows', () => {
    const transactions: PaymentBalanceTransaction[] = [
      {
        id: 'tx-bs',
        date: '2026-03-07',
        fromMethod: 'efectivo',
        toMethod: 'pago_movil',
        amount: 999,
        amountBs: 20,
        createdAt: '2026-03-07T11:00:00.000Z',
        updatedAt: '2026-03-07T11:00:00.000Z',
      },
      {
        id: 'tx-usd',
        date: '2026-03-07',
        fromMethod: 'pago_movil',
        toMethod: 'divisa',
        amount: 0,
        amountUsd: 1,
        createdAt: '2026-03-07T12:00:00.000Z',
        updatedAt: '2026-03-07T12:00:00.000Z',
      },
      {
        id: 'tx-legacy',
        date: '2026-03-07',
        fromMethod: 'punto_venta',
        toMethod: 'efectivo',
        amount: 10,
        createdAt: '2026-03-07T13:00:00.000Z',
        updatedAt: '2026-03-07T13:00:00.000Z',
      },
    ];

    const items = buildTransactionsSummaryItems({
      selectedDate: '2026-03-07',
      exchangeRate: 50,
      sales: [],
      rentals: [],
      expenses: EMPTY_EXPENSES,
      prepaidOrders: EMPTY_PREPAID,
      paymentBalanceTransactions: transactions,
    });

    const transfers = items.filter(
      (item: TransactionItem) => item.type === 'balance_transfer'
    );
    expect(
      transfers
        .map((item: TransactionItem) => item.amountBs)
        .sort((a: number, b: number) => a - b)
    ).toEqual([10, 20, 50]);
  });
});
