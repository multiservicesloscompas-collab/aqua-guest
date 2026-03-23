import type { PaymentBalanceTransaction } from '@/types';
import { useSyncStore } from '@/store/useSyncStore';

type PaymentBalanceCreateInput = Omit<
  PaymentBalanceTransaction,
  'id' | 'createdAt' | 'updatedAt'
>;
type PaymentBalanceUpdateInput = Partial<
  Omit<PaymentBalanceTransaction, 'id' | 'createdAt' | 'updatedAt'>
>;

const generateTempId = () =>
  `temp-${Math.random().toString(36).substring(2, 15)}`;

const buildEntityBusinessKey = (id: string) => `payment-balance:${id}`;

type NormalizedPaymentBalanceAmounts = {
  operationType: 'equilibrio' | 'avance';
  amount: number;
  amountBs: number;
  amountUsd?: number;
  amountOutBs: number;
  amountOutUsd?: number;
  amountInBs: number;
  amountInUsd?: number;
  differenceBs: number;
  differenceUsd?: number;
};

const normalizePaymentBalanceAmounts = (
  transaction: PaymentBalanceCreateInput | PaymentBalanceTransaction
): NormalizedPaymentBalanceAmounts => {
  const amount = transaction.amount;
  const amountBs = transaction.amountBs ?? amount;
  const amountUsd = transaction.amountUsd;
  const amountOutBs = transaction.amountOutBs ?? amountBs;
  const amountInBs = transaction.amountInBs ?? amountBs;
  const amountOutUsd = transaction.amountOutUsd ?? amountUsd;
  const amountInUsd = transaction.amountInUsd ?? amountUsd;
  const differenceBs = transaction.differenceBs ?? amountInBs - amountOutBs;

  return {
    operationType: transaction.operationType ?? 'equilibrio',
    amount,
    amountBs,
    amountUsd,
    amountOutBs,
    amountOutUsd,
    amountInBs,
    amountInUsd,
    differenceBs,
    differenceUsd:
      transaction.differenceUsd ??
      (amountInUsd !== undefined && amountOutUsd !== undefined
        ? amountInUsd - amountOutUsd
        : undefined),
  };
};

export const enqueueOfflinePaymentBalanceCreate = (
  transaction: PaymentBalanceCreateInput,
  timestamps: { createdAt: string; updatedAt: string },
  actionSource = 'paymentBalance/addPaymentBalanceTransaction'
): PaymentBalanceTransaction => {
  const tempId = generateTempId();
  const businessKey = buildEntityBusinessKey(tempId);
  const normalized = normalizePaymentBalanceAmounts(transaction);

  useSyncStore.getState().addToQueue({
    type: 'INSERT',
    table: 'payment_balance_transactions',
    payload: {
      tempId,
      date: transaction.date,
      from_method: transaction.fromMethod,
      to_method: transaction.toMethod,
      operation_type: normalized.operationType,
      amount: normalized.amount,
      amount_bs: normalized.amountBs,
      amount_usd: normalized.amountUsd,
      amount_out_bs: normalized.amountOutBs,
      amount_out_usd: normalized.amountOutUsd,
      amount_in_bs: normalized.amountInBs,
      amount_in_usd: normalized.amountInUsd,
      difference_bs: normalized.differenceBs,
      difference_usd: normalized.differenceUsd,
      notes: transaction.notes,
    },
    enqueueSource: actionSource,
    businessKey,
  });

  return {
    id: tempId,
    ...transaction,
    createdAt: timestamps.createdAt,
    updatedAt: timestamps.updatedAt,
  };
};

export const enqueueOfflinePaymentBalanceUpdate = (
  id: string,
  updates: PaymentBalanceUpdateInput,
  updatedAt: string,
  actionSource = 'paymentBalance/updatePaymentBalanceTransaction',
  existingTransaction?: PaymentBalanceTransaction
) => {
  const businessKey = buildEntityBusinessKey(id);

  const hasAmountMutation =
    updates.amount !== undefined ||
    updates.amountBs !== undefined ||
    updates.amountUsd !== undefined ||
    updates.amountOutBs !== undefined ||
    updates.amountOutUsd !== undefined ||
    updates.amountInBs !== undefined ||
    updates.amountInUsd !== undefined ||
    updates.differenceBs !== undefined ||
    updates.differenceUsd !== undefined;

  const mergedTransaction = existingTransaction
    ? {
        ...existingTransaction,
        ...updates,
        ...(hasAmountMutation && updates.differenceBs === undefined
          ? { differenceBs: undefined }
          : {}),
        ...(hasAmountMutation && updates.differenceUsd === undefined
          ? { differenceUsd: undefined }
          : {}),
      }
    : undefined;
  const normalized = mergedTransaction
    ? normalizePaymentBalanceAmounts(mergedTransaction)
    : undefined;

  useSyncStore.getState().addToQueue({
    type: 'UPDATE',
    table: 'payment_balance_transactions',
    payload: {
      id,
      ...(updates.fromMethod !== undefined
        ? { from_method: updates.fromMethod }
        : {}),
      ...(updates.toMethod !== undefined
        ? { to_method: updates.toMethod }
        : {}),
      ...(updates.amount !== undefined ? { amount: updates.amount } : {}),
      ...(updates.amountBs !== undefined
        ? { amount_bs: updates.amountBs }
        : {}),
      ...(updates.amountUsd !== undefined
        ? { amount_usd: updates.amountUsd }
        : {}),
      ...(updates.operationType !== undefined
        ? { operation_type: updates.operationType }
        : {}),
      ...(updates.amountOutBs !== undefined
        ? { amount_out_bs: updates.amountOutBs }
        : {}),
      ...(updates.amountOutUsd !== undefined
        ? { amount_out_usd: updates.amountOutUsd }
        : {}),
      ...(updates.amountInBs !== undefined
        ? { amount_in_bs: updates.amountInBs }
        : {}),
      ...(updates.amountInUsd !== undefined
        ? { amount_in_usd: updates.amountInUsd }
        : {}),
      ...(updates.differenceBs !== undefined
        ? { difference_bs: updates.differenceBs }
        : {}),
      ...(updates.differenceUsd !== undefined
        ? { difference_usd: updates.differenceUsd }
        : {}),
      ...(hasAmountMutation && normalized !== undefined
        ? {
            amount: normalized.amount,
            amount_bs: normalized.amountBs,
            amount_usd: normalized.amountUsd,
            amount_out_bs: normalized.amountOutBs,
            amount_out_usd: normalized.amountOutUsd,
            amount_in_bs: normalized.amountInBs,
            amount_in_usd: normalized.amountInUsd,
            difference_bs: normalized.differenceBs,
            difference_usd: normalized.differenceUsd,
          }
        : {}),
      ...(updates.notes !== undefined ? { notes: updates.notes } : {}),
      ...(updates.date !== undefined ? { date: updates.date } : {}),
      updated_at: updatedAt,
    },
    enqueueSource: actionSource,
    businessKey,
    dependencyKeys: id.startsWith('temp-') ? [businessKey] : undefined,
  });
};

export const enqueueOfflinePaymentBalanceDelete = (
  id: string,
  actionSource = 'paymentBalance/deletePaymentBalanceTransaction'
) => {
  const businessKey = buildEntityBusinessKey(id);

  useSyncStore.getState().addToQueue({
    type: 'DELETE',
    table: 'payment_balance_transactions',
    payload: { id },
    enqueueSource: actionSource,
    businessKey,
    dependencyKeys: id.startsWith('temp-') ? [businessKey] : undefined,
  });
};
