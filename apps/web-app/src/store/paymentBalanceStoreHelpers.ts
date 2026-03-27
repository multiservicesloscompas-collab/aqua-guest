import type { PaymentBalanceTransaction } from '@/types';
import type { PaymentBalanceUpdatePayload } from './usePaymentBalanceStore.core';
import type { PaymentBalanceDraft } from './paymentBalanceDraft';

export const toDraftInput = (
  transaction: PaymentBalanceTransaction
): Omit<PaymentBalanceTransaction, 'id' | 'createdAt' | 'updatedAt'> => ({
  date: transaction.date,
  fromMethod: transaction.fromMethod,
  toMethod: transaction.toMethod,
  operationType: transaction.operationType,
  amount: transaction.amount,
  amountBs: transaction.amountBs,
  amountUsd: transaction.amountUsd,
  amountOutBs: transaction.amountOutBs,
  amountOutUsd: transaction.amountOutUsd,
  amountInBs: transaction.amountInBs,
  amountInUsd: transaction.amountInUsd,
  differenceBs: transaction.differenceBs,
  differenceUsd: transaction.differenceUsd,
  notes: transaction.notes,
});

export const applyLocalTransactionUpdate = (
  transaction: PaymentBalanceTransaction,
  updates: Partial<PaymentBalanceTransaction>,
  normalized: PaymentBalanceDraft | undefined,
  updatedAt: string
): PaymentBalanceTransaction => ({
  ...transaction,
  ...updates,
  ...(normalized
    ? {
        operationType: normalized.operation_type,
        amount: normalized.amount,
        amountBs: normalized.amount_bs,
        amountUsd: normalized.amount_usd,
        amountOutBs: normalized.amount_out_bs,
        amountOutUsd: normalized.amount_out_usd,
        amountInBs: normalized.amount_in_bs,
        amountInUsd: normalized.amount_in_usd,
        differenceBs: normalized.difference_bs,
        differenceUsd: normalized.difference_usd,
      }
    : {}),
  updatedAt,
});

export const assignUpdatePayloadFromUpdates = (
  payload: PaymentBalanceUpdatePayload,
  updates: Partial<PaymentBalanceTransaction>
) => {
  if (updates.fromMethod !== undefined)
    payload.from_method = updates.fromMethod;
  if (updates.toMethod !== undefined) payload.to_method = updates.toMethod;
  if (updates.amount !== undefined) payload.amount = updates.amount;
  if (updates.amountBs !== undefined) payload.amount_bs = updates.amountBs;
  if (updates.amountUsd !== undefined) payload.amount_usd = updates.amountUsd;
  if (updates.operationType !== undefined)
    payload.operation_type = updates.operationType;
  if (updates.amountOutBs !== undefined)
    payload.amount_out_bs = updates.amountOutBs;
  if (updates.amountOutUsd !== undefined)
    payload.amount_out_usd = updates.amountOutUsd;
  if (updates.amountInBs !== undefined)
    payload.amount_in_bs = updates.amountInBs;
  if (updates.amountInUsd !== undefined)
    payload.amount_in_usd = updates.amountInUsd;
  if (updates.differenceBs !== undefined)
    payload.difference_bs = updates.differenceBs;
  if (updates.differenceUsd !== undefined)
    payload.difference_usd = updates.differenceUsd;
  if (updates.notes !== undefined) payload.notes = updates.notes;
  if (updates.date !== undefined) payload.date = updates.date;
};

export const assignUpdatePayloadFromNormalized = (
  payload: PaymentBalanceUpdatePayload,
  normalized: PaymentBalanceDraft
) => {
  payload.amount = normalized.amount;
  payload.amount_bs = normalized.amount_bs;
  payload.amount_usd = normalized.amount_usd;
  payload.amount_out_bs = normalized.amount_out_bs;
  payload.amount_out_usd = normalized.amount_out_usd;
  payload.amount_in_bs = normalized.amount_in_bs;
  payload.amount_in_usd = normalized.amount_in_usd;
  payload.difference_bs = normalized.difference_bs;
  payload.difference_usd = normalized.difference_usd;
};
