import type { CartItem, PaymentMethod, PaymentSplit } from '@aqua-guest/domain';
import type { PaymentSplitRow } from '@/services/payments/paymentSplitSchemaContract';

/** Row returned by `select('*')` on `sales` (numeric columns may arrive as strings). */
export interface SaleRow {
  id: string;
  daily_number: number;
  date: string;
  items: CartItem[];
  payment_method: PaymentMethod;
  total_bs: number | string;
  total_usd: number | string;
  exchange_rate: number | string;
  notes?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  sale_payment_splits?: PaymentSplitRow[];
}

/**
 * Tolerant read shape used by `SalesDataService`: also accepts camelCase
 * aliases and alternative split relation names from legacy/offline payloads.
 */
export interface SaleReadRow
  extends Pick<SaleRow, 'id' | 'date'>,
    Partial<
      Omit<SaleRow, 'id' | 'date' | 'sale_payment_splits' | 'daily_number'>
    > {
  daily_number?: number | null;
  dailyNumber?: number | null;
  paymentMethod?: PaymentMethod | null;
  totalBs?: number | null;
  totalUsd?: number | null;
  exchangeRate?: number | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  sale_payment_splits?: PaymentSplitRow[] | null;
  payment_splits?: PaymentSplitRow[] | null;
  splits?: PaymentSplitRow[] | null;
}

export type SaleInsertRow = {
  daily_number: number;
  date: string;
  items: CartItem[];
  payment_method: PaymentMethod;
  total_bs: number;
  total_usd: number;
  exchange_rate: number;
  notes?: string;
};

export type SaleUpdateRow = Partial<{
  payment_method: PaymentMethod;
  paymentSplits?: PaymentSplit[];
  total_bs: number;
  total_usd: number;
  notes?: string;
  items?: CartItem[];
  updated_at: string;
}>;
