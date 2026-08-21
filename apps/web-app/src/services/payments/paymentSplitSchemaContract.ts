import type { PaymentSplit } from '@aqua-guest/domain';
import type {
  PaymentSplitInsertRow as SharedPaymentSplitInsertRow,
  PaymentSplitRow,
} from '@aqua-guest/product-domain/frontend';
import { PAYMENT_SPLIT_READ_SELECT } from '@aqua-guest/product-domain/frontend';

export const PAYMENT_SPLIT_SCHEMA = {
  salesTable: 'sales',
  rentalsTable: 'washer_rentals',
  expensesTable: 'expenses',
  salesSplitsTable: 'sale_payment_splits',
  rentalsSplitsTable: 'rental_payment_splits',
  expensesSplitsTable: 'expense_payment_splits',
  columns: {
    parentId: 'sale_id',
    rentalParentId: 'rental_id',
    expenseParentId: 'expense_id',
    method: 'payment_method',
    amountBs: 'amount_bs',
    amountUsd: 'amount_usd',
    exchangeRateUsed: 'exchange_rate_used',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
} as const;

export const PAYMENT_SPLIT_SELECTS = {
  read: PAYMENT_SPLIT_READ_SELECT,
  salesRelation: `paymentSplits:${PAYMENT_SPLIT_SCHEMA.salesSplitsTable}(${PAYMENT_SPLIT_READ_SELECT})`,
  rentalsRelation: `paymentSplits:${PAYMENT_SPLIT_SCHEMA.rentalsSplitsTable}(${PAYMENT_SPLIT_READ_SELECT})`,
  expensesRelation: `paymentSplits:${PAYMENT_SPLIT_SCHEMA.expensesSplitsTable}(${PAYMENT_SPLIT_READ_SELECT})`,
} as const;

export type { PaymentSplitRow };

export type PaymentSplitInsertRow = Omit<SalePaymentSplitInsertRow, 'sale_id'>;

export type SalePaymentSplitInsertRow = SharedPaymentSplitInsertRow<'sale_id'>;

export type RentalPaymentSplitInsertRow = SharedPaymentSplitInsertRow<'rental_id'>;

export type ExpensePaymentSplitInsertRow = SharedPaymentSplitInsertRow<'expense_id'>;

export interface PaymentSplitAdapter<TInsertRow> {
  toInsertRows(parentId: string, splits: readonly PaymentSplit[]): TInsertRow[];
  fromRows(rows: readonly PaymentSplitRow[]): PaymentSplit[];
}
