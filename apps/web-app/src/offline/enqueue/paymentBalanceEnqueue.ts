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

export const enqueueOfflinePaymentBalanceCreate = (
  transaction: PaymentBalanceCreateInput,
  timestamps: { createdAt: string; updatedAt: string },
  actionSource = 'paymentBalance/addPaymentBalanceTransaction'
): PaymentBalanceTransaction => {
  const tempId = generateTempId();
  const businessKey = buildEntityBusinessKey(tempId);

  useSyncStore.getState().addToQueue({
    type: 'INSERT',
    table: 'payment_balance_transactions',
    payload: {
      tempId,
      date: transaction.date,
      from_method: transaction.fromMethod,
      to_method: transaction.toMethod,
      amount: transaction.amount,
      amount_bs: transaction.amountBs,
      amount_usd: transaction.amountUsd,
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
  actionSource = 'paymentBalance/updatePaymentBalanceTransaction'
) => {
  const businessKey = buildEntityBusinessKey(id);

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
