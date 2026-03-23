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
const EMPTY_BALANCE_TX: PaymentBalanceTransaction[] = [];
const EMPTY_SALES: Sale[] = [];
const EMPTY_RENTALS: WasherRental[] = [];

describe('buildTransactionsSummaryItems tip payout behavior', () => {
  it('adds tip payout rows once per payout id and marks them as expense', () => {
    const items = buildTransactionsSummaryItems({
      selectedDate: '2026-03-07',
      exchangeRate: 50,
      sales: EMPTY_SALES,
      rentals: EMPTY_RENTALS,
      expenses: EMPTY_EXPENSES,
      prepaidOrders: EMPTY_PREPAID,
      paymentBalanceTransactions: EMPTY_BALANCE_TX,
      tipPayouts: [
        {
          id: 'tip-payout-1',
          tipDate: '2026-03-07',
          paidAt: '2026-03-07T15:00:00.000Z',
          paymentMethod: 'efectivo',
          amountBs: 40,
          originType: 'sale',
          originId: 'sale-1',
        },
        {
          id: 'tip-payout-1',
          tipDate: '2026-03-07',
          paidAt: '2026-03-07T15:01:00.000Z',
          paymentMethod: 'efectivo',
          amountBs: 40,
          originType: 'rental',
          originId: 'rental-1',
        },
        {
          id: 'tip-payout-2',
          tipDate: '2026-03-07',
          paidAt: '2026-03-07T16:00:00.000Z',
          paymentMethod: 'pago_movil',
          amountBs: 25,
          originType: 'rental',
          originId: 'rental-2',
        },
      ],
    });

    const tipRows = items.filter(
      (item: TransactionItem) => item.type === 'tip_payout'
    );
    expect(tipRows).toHaveLength(2);
    expect(tipRows.every((item: TransactionItem) => !item.isIncome)).toBe(true);
    expect(
      tipRows
        .map((item: TransactionItem) => item.amountBs)
        .sort((a: number, b: number) => a - b)
    ).toEqual([25, 40]);
  });

  it('normalizes tip payout paidAt to Venezuela timezone for selected date', () => {
    const items = buildTransactionsSummaryItems({
      selectedDate: '2026-03-13',
      exchangeRate: 50,
      sales: EMPTY_SALES,
      rentals: EMPTY_RENTALS,
      expenses: EMPTY_EXPENSES,
      prepaidOrders: EMPTY_PREPAID,
      paymentBalanceTransactions: EMPTY_BALANCE_TX,
      tipPayouts: [
        {
          id: 'tip-utc-next-day',
          tipDate: '2026-03-13',
          paidAt: '2026-03-14T02:30:00.000Z',
          paymentMethod: 'punto_venta',
          amountBs: 300,
          originType: 'sale',
          originId: 'sale-3',
        },
        {
          id: 'tip-local-day',
          tipDate: '2026-03-13',
          paidAt: '2026-03-13T18:30:00.000Z',
          paymentMethod: 'pago_movil',
          amountBs: 200,
          originType: 'sale',
          originId: 'sale-2',
        },
      ],
    });

    const tipRows = items.filter(
      (item: TransactionItem) => item.type === 'tip_payout'
    );

    expect(tipRows).toHaveLength(2);
    expect(
      tipRows
        .map((item: TransactionItem) => item.amountBs)
        .sort((a: number, b: number) => a - b)
    ).toEqual([200, 300]);
  });
});
