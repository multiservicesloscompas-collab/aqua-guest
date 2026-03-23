/**
 * usePaymentBalanceStore.core.ts
 * Type definitions for the payment balance Zustand store.
 * No Zustand or Supabase dependencies — pure TypeScript.
 */
import {
  PaymentBalanceTransaction,
  PaymentBalanceSummary,
  PaymentMethod,
} from '@/types';

// ─── Row / Insert / Update shapes ────────────────────────────────────────────

export type PaymentBalanceInsertPayload = {
  date: string;
  operation_type?: 'equilibrio' | 'avance';
  from_method: PaymentMethod;
  to_method: PaymentMethod;
  amount: number;
  amount_bs?: number;
  amount_usd?: number;
  amount_out_bs?: number;
  amount_out_usd?: number;
  amount_in_bs?: number;
  amount_in_usd?: number;
  difference_bs?: number;
  difference_usd?: number;
  notes?: string;
};

export type PaymentBalanceUpdatePayload = {
  operation_type?: 'equilibrio' | 'avance';
  from_method?: PaymentMethod;
  to_method?: PaymentMethod;
  amount?: number;
  amount_bs?: number;
  amount_usd?: number;
  amount_out_bs?: number;
  amount_out_usd?: number;
  amount_in_bs?: number;
  amount_in_usd?: number;
  difference_bs?: number;
  difference_usd?: number;
  notes?: string;
  date?: string;
  updated_at: string;
};

export type PaymentBalanceRow = {
  id: string;
  date: string;
  operation_type?: 'equilibrio' | 'avance' | null;
  from_method: PaymentMethod;
  to_method: PaymentMethod;
  amount: number;
  amount_bs?: number | null;
  amount_usd?: number | null;
  amount_out_bs?: number | null;
  amount_out_usd?: number | null;
  amount_in_bs?: number | null;
  amount_in_usd?: number | null;
  difference_bs?: number | null;
  difference_usd?: number | null;
  notes?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

// ─── State interface ──────────────────────────────────────────────────────────

export interface PaymentBalanceState {
  paymentBalanceTransactions: PaymentBalanceTransaction[];

  addPaymentBalanceTransaction: (
    transaction: Omit<
      PaymentBalanceTransaction,
      'id' | 'createdAt' | 'updatedAt'
    >
  ) => Promise<void>;
  updatePaymentBalanceTransaction: (
    id: string,
    updates: Partial<PaymentBalanceTransaction>
  ) => Promise<void>;
  deletePaymentBalanceTransaction: (id: string) => Promise<void>;
  getPaymentBalanceSummary: (date: string) => PaymentBalanceSummary[];
  loadPaymentBalanceTransactions: () => Promise<void>;

  setPaymentBalanceData: (
    paymentBalanceTransactions: PaymentBalanceTransaction[]
  ) => void;
}

// ─── Pure helper ──────────────────────────────────────────────────────────────

export function rowToTransaction(
  row: PaymentBalanceRow
): PaymentBalanceTransaction {
  const amount = Number(row.amount);
  const amountBs =
    row.amount_bs !== null && row.amount_bs !== undefined
      ? Number(row.amount_bs)
      : amount;
  const amountOutBs =
    row.amount_out_bs !== null && row.amount_out_bs !== undefined
      ? Number(row.amount_out_bs)
      : amountBs;
  const amountInBs =
    row.amount_in_bs !== null && row.amount_in_bs !== undefined
      ? Number(row.amount_in_bs)
      : amountBs;

  return {
    id: row.id,
    date: row.date,
    operationType: row.operation_type ?? 'equilibrio',
    fromMethod: row.from_method,
    toMethod: row.to_method,
    amount,
    amountBs,
    amountUsd:
      row.amount_usd !== null && row.amount_usd !== undefined
        ? Number(row.amount_usd)
        : undefined,
    amountOutBs,
    amountOutUsd:
      row.amount_out_usd !== null && row.amount_out_usd !== undefined
        ? Number(row.amount_out_usd)
        : undefined,
    amountInBs,
    amountInUsd:
      row.amount_in_usd !== null && row.amount_in_usd !== undefined
        ? Number(row.amount_in_usd)
        : undefined,
    differenceBs:
      row.difference_bs !== null && row.difference_bs !== undefined
        ? Number(row.difference_bs)
        : amountInBs - amountOutBs,
    differenceUsd:
      row.difference_usd !== null && row.difference_usd !== undefined
        ? Number(row.difference_usd)
        : undefined,
    notes: row.notes || undefined,
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || new Date().toISOString(),
  };
}
