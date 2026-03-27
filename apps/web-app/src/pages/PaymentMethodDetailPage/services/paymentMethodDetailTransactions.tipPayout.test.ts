import { describe, expect, it } from 'vitest';
import {
  buildPaymentMethodTransactions,
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
const EMPTY_SALES: Sale[] = [];
const EMPTY_RENTALS: WasherRental[] = [];
const EMPTY_BALANCE_TX: PaymentBalanceTransaction[] = [];

describe('paymentMethodDetailTransactions tip payout behavior', () => {
  it('includes tip payout as expense for selected method and deduplicates by payout id', () => {
    const transactions = buildPaymentMethodTransactions({
      paymentMethod: 'efectivo',
      selectedDate: '2026-03-07',
      exchangeRate: 50,
      sales: [
        {
          id: 'sale-1',
          dailyNumber: 1,
          date: '2026-03-07',
          items: [],
          paymentMethod: 'efectivo',
          totalBs: 120,
          totalUsd: 2.4,
          exchangeRate: 50,
          createdAt: '2026-03-07T08:00:00.000Z',
          updatedAt: '2026-03-07T08:00:00.000Z',
        },
      ],
      rentals: EMPTY_RENTALS,
      expenses: EMPTY_EXPENSES,
      prepaidOrders: EMPTY_PREPAID,
      paymentBalanceTransactions: EMPTY_BALANCE_TX,
      tipPayouts: [
        {
          id: 'tp-1',
          tipDate: '2026-03-07',
          paidAt: '2026-03-07T16:00:00.000Z',
          paymentMethod: 'efectivo',
          amountBs: 30,
          originType: 'sale',
          originId: 'sale-1',
        },
        {
          id: 'tp-1',
          tipDate: '2026-03-07',
          paidAt: '2026-03-07T16:01:00.000Z',
          paymentMethod: 'efectivo',
          amountBs: 30,
          originType: 'rental',
          originId: 'rental-1',
        },
      ],
      getMethodLabel,
    });

    expect(transactions.map((tx) => tx.type)).toEqual(['sale', 'tip_payout']);
    expect(transactions[1].amountBs).toBe(30);
    expect(transactions[1].linkedReference).toBe('Propina de Venta #1');
    expect(summarizePaymentMethodTransactions(transactions)).toEqual({
      income: 120,
      expenses: 30,
      balanceIn: 0,
      balanceOut: 0,
      net: 90,
    });
  });

  it('matches tip payouts to selected day using Venezuela timezone normalization', () => {
    const transactions = buildPaymentMethodTransactions({
      paymentMethod: 'pago_movil',
      selectedDate: '2026-03-13',
      exchangeRate: 50,
      sales: EMPTY_SALES,
      rentals: EMPTY_RENTALS,
      expenses: EMPTY_EXPENSES,
      prepaidOrders: EMPTY_PREPAID,
      paymentBalanceTransactions: EMPTY_BALANCE_TX,
      tipPayouts: [
        {
          id: 'tp-local-1',
          tipDate: '2026-03-13',
          paidAt: '2026-03-14T02:30:00.000Z',
          paymentMethod: 'pago_movil',
          amountBs: 300,
          originType: 'sale',
          originId: 'sale-3',
        },
        {
          id: 'tp-local-2',
          tipDate: '2026-03-13',
          paidAt: '2026-03-13T18:30:00.000Z',
          paymentMethod: 'pago_movil',
          amountBs: 200,
          originType: 'sale',
          originId: 'sale-2',
        },
      ],
      getMethodLabel,
    });

    expect(transactions.map((tx) => tx.type)).toEqual([
      'tip_payout',
      'tip_payout',
    ]);
    expect(transactions.map((tx) => tx.amountBs).sort((a, b) => a - b)).toEqual(
      [200, 300]
    );
    expect(transactions.map((tx) => tx.linkedReference)).toEqual([
      'Propina de sale:sale-3',
      'Propina de sale:sale-2',
    ]);
  });
});
