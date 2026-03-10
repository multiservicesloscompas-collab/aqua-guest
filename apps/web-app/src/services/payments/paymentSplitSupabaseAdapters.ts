import type { PaymentMethod } from '@/types';
import type { PaymentSplit } from '@/types/paymentSplits';
import type {
  PaymentSplitAdapter,
  PaymentSplitRow,
  RentalPaymentSplitInsertRow,
  SalePaymentSplitInsertRow,
} from './paymentSplitSchemaContract';

function toSaleInsertRows(
  saleId: string,
  splits: readonly PaymentSplit[]
): SalePaymentSplitInsertRow[] {
  return splits.map((split) => ({
    sale_id: saleId,
    payment_method: split.method,
    amount_bs: split.amountBs,
    amount_usd: split.amountUsd,
    exchange_rate_used: split.exchangeRateUsed,
  }));
}

function toRentalInsertRows(
  rentalId: string,
  splits: readonly PaymentSplit[]
): RentalPaymentSplitInsertRow[] {
  return splits.map((split) => ({
    rental_id: rentalId,
    payment_method: split.method,
    amount_bs: split.amountBs,
    amount_usd: split.amountUsd,
    exchange_rate_used: split.exchangeRateUsed,
  }));
}

function fromRows(rows: readonly PaymentSplitRow[]): PaymentSplit[] {
  return rows.map((row) => ({
    method: row.payment_method as PaymentMethod,
    amountBs: Number(row.amount_bs ?? 0),
    amountUsd:
      row.amount_usd === null || row.amount_usd === undefined
        ? undefined
        : Number(row.amount_usd),
    exchangeRateUsed:
      row.exchange_rate_used === null || row.exchange_rate_used === undefined
        ? undefined
        : Number(row.exchange_rate_used),
  }));
}

export const salePaymentSplitAdapter: PaymentSplitAdapter<SalePaymentSplitInsertRow> =
  {
    toInsertRows: (saleId, splits) => toSaleInsertRows(saleId, splits),
    fromRows,
  };

export const rentalPaymentSplitAdapter: PaymentSplitAdapter<RentalPaymentSplitInsertRow> =
  {
    toInsertRows: (rentalId, splits) => toRentalInsertRows(rentalId, splits),
    fromRows,
  };
