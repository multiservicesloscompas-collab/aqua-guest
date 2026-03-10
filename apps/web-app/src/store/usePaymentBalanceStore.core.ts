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
  from_method: PaymentMethod;
  to_method: PaymentMethod;
  amount: number;
  amount_bs?: number;
  amount_usd?: number;
  notes?: string;
};

export type PaymentBalanceUpdatePayload = {
  from_method?: PaymentMethod;
  to_method?: PaymentMethod;
  amount?: number;
  amount_bs?: number;
  amount_usd?: number;
  notes?: string;
  date?: string;
  updated_at: string;
};

export type PaymentBalanceRow = {
  id: string;
  date: string;
  from_method: PaymentMethod;
  to_method: PaymentMethod;
  amount: number;
  amount_bs?: number | null;
  amount_usd?: number | null;
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
  return {
    id: row.id,
    date: row.date,
    fromMethod: row.from_method,
    toMethod: row.to_method,
    amount: Number(row.amount),
    amountBs:
      row.amount_bs !== null && row.amount_bs !== undefined
        ? Number(row.amount_bs)
        : Number(row.amount),
    amountUsd:
      row.amount_usd !== null && row.amount_usd !== undefined
        ? Number(row.amount_usd)
        : undefined,
    notes: row.notes || undefined,
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || new Date().toISOString(),
  };
}
