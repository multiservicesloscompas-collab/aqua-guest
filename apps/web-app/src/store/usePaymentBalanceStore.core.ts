import {
  PaymentBalanceTransactionDraft,
  PaymentBalanceTransaction,
  PaymentBalanceTransactionUpdate,
  PaymentBalanceSummary,
  PaymentMethod,
} from '@/types';
import type { PaymentBalanceOperationType } from '@aqua-guest/domain';

export type PaymentBalanceInsertPayload = {
  date: string;

  // TODO: do not use snake_case!
  operation_type?: PaymentBalanceOperationType;
  // TODO: do not use snake_case!
  from_method: PaymentMethod;
  // TODO: do not use snake_case!
  to_method: PaymentMethod;
  amount: number;
  // TODO: do not use snake_case!
  amount_bs?: number;
  // TODO: do not use snake_case!
  amount_usd?: number;
  // TODO: do not use snake_case!
  amount_out_bs?: number;
  // TODO: do not use snake_case!
  amount_out_usd?: number;
  // TODO: do not use snake_case!
  amount_in_bs?: number;
  // TODO: do not use snake_case!
  amount_in_usd?: number;
  // TODO: do not use snake_case!
  difference_bs?: number;
  // TODO: do not use snake_case!
  difference_usd?: number;
  notes?: string;
};

export type PaymentBalanceUpdatePayload = {
  // TODO: do not use snake_case!
  operation_type?: PaymentBalanceOperationType;
  // TODO: do not use snake_case!
  from_method?: PaymentMethod;
  // TODO: do not use snake_case!
  to_method?: PaymentMethod;
  // TODO: do not use snake_case!
  amount?: number;
  // TODO: do not use snake_case!
  amount_bs?: number;
  // TODO: do not use snake_case!
  amount_usd?: number;
  // TODO: do not use snake_case!
  amount_out_bs?: number;
  // TODO: do not use snake_case!
  amount_out_usd?: number;
  // TODO: do not use snake_case!
  amount_in_bs?: number;
  // TODO: do not use snake_case!
  amount_in_usd?: number;
  // TODO: do not use snake_case!
  difference_bs?: number;
  // TODO: do not use snake_case!
  difference_usd?: number;
  // TODO: do not use snake_case!
  notes?: string;
  date?: string;
  // TODO: do not use snake_case!
  updated_at: string;
};

export type PaymentBalanceRow = {
  id: string;
  date: string;
  operation_type?: PaymentBalanceOperationType | null;
  from_method: PaymentMethod;
  to_method: PaymentMethod;
  amount: number;
  // TODO: do not use snake_case!
  amount_bs?: number | null;
  // TODO: do not use snake_case!
  amount_usd?: number | null;
  // TODO: do not use snake_case!
  amount_out_bs?: number | null;
  // TODO: do not use snake_case!
  amount_out_usd?: number | null;
  // TODO: do not use snake_case!
  amount_in_bs?: number | null;
  // TODO: do not use snake_case!
  amount_in_usd?: number | null;
  // TODO: do not use snake_case!
  difference_bs?: number | null;
  // TODO: do not use snake_case!
  difference_usd?: number | null;
  // TODO: do not use snake_case!
  notes?: string | null;
  // TODO: do not use snake_case!
  created_at?: string | null;
  // TODO: do not use snake_case!
  updated_at?: string | null;
};

// ─── State interface ──────────────────────────────────────────────────────────

export interface PaymentBalanceState {
  paymentBalanceTransactions: PaymentBalanceTransaction[];

  addPaymentBalanceTransaction: (
    transaction: PaymentBalanceTransactionDraft
  ) => Promise<void>;
  updatePaymentBalanceTransaction: (
    id: string,
    updates: PaymentBalanceTransactionUpdate
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
