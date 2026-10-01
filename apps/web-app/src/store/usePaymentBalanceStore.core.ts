import type { PaymentBalanceRow } from '@/services/payments/paymentBalanceSchemaContract';
import { PaymentBalanceSummary, PaymentBalanceTransaction } from '@/types';
import type {
  PaymentBalanceTransactionDraft,
  PaymentBalanceTransactionUpdate,
} from '@aqua-guest/domain';

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
    notes: row.notes ?? undefined,
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || new Date().toISOString(),
  };
}
