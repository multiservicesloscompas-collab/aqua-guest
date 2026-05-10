import type {
  PaymentBalanceOperationType,
  PaymentBalanceTransactionDraft,
  PaymentBalanceTransactionUpdate,
} from '@aqua-guest/domain';
import type { PaymentBalanceInsertPayload } from './usePaymentBalanceStore.core';

export type PaymentBalanceDraft = Omit<
  PaymentBalanceInsertPayload,
  'date' | 'from_method' | 'to_method'
> & {
  operation_type: PaymentBalanceOperationType;
  amount: number;
  // TODO: do not use snake_case!
  amount_bs: number;
  // TODO: do not use snake_case!
  amount_out_bs: number;
  // TODO: do not use snake_case!
  amount_in_bs: number;
  // TODO: do not use snake_case!
  difference_bs: number;
};

export const normalizeTransactionDraft = (
  transaction: PaymentBalanceTransactionDraft
): PaymentBalanceDraft => {
  const amount = transaction.amount;
  const amountBs = transaction.amountBs ?? amount;
  const amountOutBs = transaction.amountOutBs ?? amountBs;
  const amountInBs = transaction.amountInBs ?? amountBs;
  const amountUsd = transaction.amountUsd;
  const amountOutUsd = transaction.amountOutUsd ?? amountUsd;
  const amountInUsd = transaction.amountInUsd ?? amountUsd;

  return {
    operation_type: transaction.operationType ?? 'equilibrio',
    amount,
    amount_bs: amountBs,
    amount_usd: amountUsd,
    amount_out_bs: amountOutBs,
    amount_out_usd: amountOutUsd,
    amount_in_bs: amountInBs,
    amount_in_usd: amountInUsd,
    difference_bs: transaction.differenceBs ?? amountInBs - amountOutBs,
    difference_usd:
      transaction.differenceUsd ??
      (amountInUsd !== undefined && amountOutUsd !== undefined
        ? amountInUsd - amountOutUsd
        : undefined),
    notes: transaction.notes,
  };
};

export const hasAmountUpdates = (updates: PaymentBalanceTransactionUpdate) =>
  updates.amount !== undefined ||
  updates.amountBs !== undefined ||
  updates.amountUsd !== undefined ||
  updates.amountOutBs !== undefined ||
  updates.amountOutUsd !== undefined ||
  updates.amountInBs !== undefined ||
  updates.amountInUsd !== undefined ||
  updates.differenceBs !== undefined ||
  updates.differenceUsd !== undefined;
