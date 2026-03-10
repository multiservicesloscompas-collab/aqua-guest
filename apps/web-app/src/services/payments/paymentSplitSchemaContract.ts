import type { PaymentMethod } from '@/types';
import type { PaymentSplit } from '@/types/paymentSplits';

export const PAYMENT_SPLIT_SCHEMA = {
  salesTable: 'sales',
  rentalsTable: 'washer_rentals',
  salesSplitsTable: 'sale_payment_splits',
  rentalsSplitsTable: 'rental_payment_splits',
  columns: {
    parentId: 'sale_id',
    rentalParentId: 'rental_id',
    method: 'payment_method',
    amountBs: 'amount_bs',
    amountUsd: 'amount_usd',
    exchangeRateUsed: 'exchange_rate_used',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
} as const;

export interface PaymentSplitRow {
  id?: string;
  payment_method: PaymentMethod;
  amount_bs: number;
  amount_usd?: number | null;
  exchange_rate_used?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface PaymentSplitInsertRow {
  payment_method: PaymentMethod;
  amount_bs: number;
  amount_usd?: number;
  exchange_rate_used?: number;
}

export interface SalePaymentSplitInsertRow extends PaymentSplitInsertRow {
  sale_id: string;
}

export interface RentalPaymentSplitInsertRow extends PaymentSplitInsertRow {
  rental_id: string;
}

export interface PaymentSplitAdapter<TInsertRow> {
  toInsertRows(parentId: string, splits: readonly PaymentSplit[]): TInsertRow[];
  fromRows(rows: readonly PaymentSplitRow[]): PaymentSplit[];
}
