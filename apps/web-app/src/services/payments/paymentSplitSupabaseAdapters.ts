import type { PaymentSplit } from '@aqua-guest/domain';
import {
  fromPaymentSplitRows,
  toPaymentSplitInsertRows,
} from '@aqua-guest/product-domain/frontend';
import type {
  PaymentSplitAdapter,
  PaymentSplitRow,
  RentalPaymentSplitInsertRow,
  SalePaymentSplitInsertRow,
  ExpensePaymentSplitInsertRow,
} from './paymentSplitSchemaContract';

const fromRows = (rows: readonly PaymentSplitRow[]): PaymentSplit[] =>
  fromPaymentSplitRows(rows);

export const salePaymentSplitAdapter: PaymentSplitAdapter<SalePaymentSplitInsertRow> =
  {
    toInsertRows: (saleId, splits) =>
      toPaymentSplitInsertRows('sale_id', saleId, splits),
    fromRows,
  };

export const rentalPaymentSplitAdapter: PaymentSplitAdapter<RentalPaymentSplitInsertRow> =
  {
    toInsertRows: (rentalId, splits) =>
      toPaymentSplitInsertRows('rental_id', rentalId, splits),
    fromRows,
  };

export const expensePaymentSplitAdapter: PaymentSplitAdapter<ExpensePaymentSplitInsertRow> =
  {
    toInsertRows: (expenseId, splits) =>
      toPaymentSplitInsertRows('expense_id', expenseId, splits),
    fromRows,
  };
