import type { LiterPricing, Product, Sale } from '@aqua-guest/domain';
import {
  toPaymentSplitInsertRows,
  type PaymentSplitInsertRow,
  type PaymentSplitRow,
} from '../../../../shared/infrastructure/supabase';

type NumericLike<T extends number> = T | string;

export const SALES_PAYMENT_SPLITS_TABLE = 'sale_payment_splits';

export type SalePaymentSplitInsertRow = PaymentSplitInsertRow<'sale_id'>;

type SaleRowBase = Pick<
  Sale,
  'id' | 'date' | 'items' | 'notes' | 'createdAt' | 'updatedAt'
>;

export interface SaleRow extends SaleRowBase {
  dailyNumber?: Sale['dailyNumber'] | null;
  paymentMethod?: Sale['paymentMethod'] | null;
  totalBs?: NumericLike<Sale['totalBs']> | null;
  totalUsd?: NumericLike<Sale['totalUsd']> | null;
  exchangeRate?: NumericLike<Sale['exchangeRate']> | null;
  paymentSplits?: PaymentSplitRow[] | null;
}

export interface ProductRow extends Pick<Product, 'id' | 'name'> {
  defaultPrice: NumericLike<Product['defaultPrice']>;
  requiresLiters: Product['requiresLiters'];
  minLiters?: Product['minLiters'] | null;
  maxLiters?: Product['maxLiters'] | null;
}

export interface LiterPricingRow {
  id: string;
  breakpoint: NumericLike<LiterPricing['breakpoint']>;
  price: NumericLike<LiterPricing['price']>;
}

export const toSalePaymentSplitInsertRows = (
  saleId: string,
  splits: Readonly<NonNullable<Sale['paymentSplits']>>
): SalePaymentSplitInsertRow[] =>
  toPaymentSplitInsertRows('sale_id', saleId, splits);
