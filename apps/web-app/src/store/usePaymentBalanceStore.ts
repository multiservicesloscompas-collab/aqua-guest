import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { calculatePaymentBalanceSummary } from '@/services/payments/paymentBalanceSummary';
import { appRepositories } from '@/lib/app-repositories';
import {
  enqueueOfflinePaymentBalanceCreate,
  enqueueOfflinePaymentBalanceDelete,
  enqueueOfflinePaymentBalanceUpdate,
} from '@/offline/enqueue/paymentBalanceEnqueue';
import { useConfigStore } from './useConfigStore';
import { useRentalStore } from './useRentalStore';
import { useWaterSalesStore } from './useWaterSalesStore';
import { usePrepaidStore } from './usePrepaidStore';
import {
  type PaymentBalanceState,
  rowToTransaction,
} from './usePaymentBalanceStore.core';
import {
  hasAmountUpdates,
  normalizeTransactionDraft,
} from './paymentBalanceDraft';
import {
  applyLocalTransactionUpdate,
  toDraftInput,
} from './paymentBalanceStoreHelpers';

export type {
  PaymentBalanceState,
};
export { rowToTransaction };

export const usePaymentBalanceStore = create<PaymentBalanceState>()(
  persist(
    (set, get) => ({
      paymentBalanceTransactions: [],

      setPaymentBalanceData: (paymentBalanceTransactions) =>
        set({ paymentBalanceTransactions }),

      addPaymentBalanceTransaction: async (transaction) => {
        try {
          const normalized = normalizeTransactionDraft(transaction);

          if (!window.navigator.onLine) {
            const now = new Date().toISOString();
            const offlineTransaction = enqueueOfflinePaymentBalanceCreate(
              {
                ...transaction,
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
              },
              { createdAt: now, updatedAt: now }
            );
            set((state) => ({
              paymentBalanceTransactions: [
                ...state.paymentBalanceTransactions,
                offlineTransaction,
              ],
            }));
            return;
          }

          const newTransaction =
            await appRepositories.paymentBalanceRepository.create({
              date: transaction.date,
              operationType: normalized.operation_type,
              fromMethod: transaction.fromMethod,
              toMethod: transaction.toMethod,
              amount: normalized.amount,
              amountBs: normalized.amount_bs,
              amountUsd: normalized.amount_usd,
              amountOutBs: normalized.amount_out_bs,
              amountOutUsd: normalized.amount_out_usd,
              amountInBs: normalized.amount_in_bs,
              amountInUsd: normalized.amount_in_usd,
              differenceBs: normalized.difference_bs,
              differenceUsd: normalized.difference_usd,
              notes: normalized.notes,
            });
          set((state) => ({
            paymentBalanceTransactions: [
              ...state.paymentBalanceTransactions,
              newTransaction,
            ],
          }));
        } catch (err) {
          console.error(
            'Failed to add payment balance transaction to Supabase',
            err
          );
          throw err;
        }
      },

      updatePaymentBalanceTransaction: async (id, updates) => {
        try {
          const updatedAt = new Date().toISOString();
          const current = get().paymentBalanceTransactions.find(
            (transaction) => transaction.id === id
          );
          const resetDifference = hasAmountUpdates(updates);
          const merged = current
            ? {
                ...current,
                ...updates,
                ...(resetDifference && updates.differenceBs === undefined
                  ? { differenceBs: undefined }
                  : {}),
                ...(resetDifference && updates.differenceUsd === undefined
                  ? { differenceUsd: undefined }
                  : {}),
              }
            : undefined;
          const normalized = merged
            ? normalizeTransactionDraft(toDraftInput(merged))
            : undefined;

          if (!window.navigator.onLine) {
            enqueueOfflinePaymentBalanceUpdate(
              id,
              updates,
              updatedAt,
              'paymentBalance/updatePaymentBalanceTransaction',
              current
            );
            set((state) => ({
              paymentBalanceTransactions: state.paymentBalanceTransactions.map(
                (t) =>
                  t.id === id
                    ? applyLocalTransactionUpdate(
                        t,
                        updates,
                        normalized,
                        updatedAt
                      )
                    : t
              ),
            }));
            return;
          }

          const repositoryUpdate: Parameters<
            typeof appRepositories.paymentBalanceRepository.update
          >[1] = {};

          if (updates.date !== undefined) repositoryUpdate.date = updates.date;
          if (updates.operationType !== undefined)
            repositoryUpdate.operationType = updates.operationType;
          if (updates.fromMethod !== undefined)
            repositoryUpdate.fromMethod = updates.fromMethod;
          if (updates.toMethod !== undefined) repositoryUpdate.toMethod = updates.toMethod;
          if (updates.amount !== undefined) repositoryUpdate.amount = updates.amount;
          if (updates.amountBs !== undefined) repositoryUpdate.amountBs = updates.amountBs;
          if (updates.amountUsd !== undefined) repositoryUpdate.amountUsd = updates.amountUsd;
          if (updates.amountOutBs !== undefined)
            repositoryUpdate.amountOutBs = updates.amountOutBs;
          if (updates.amountOutUsd !== undefined)
            repositoryUpdate.amountOutUsd = updates.amountOutUsd;
          if (updates.amountInBs !== undefined)
            repositoryUpdate.amountInBs = updates.amountInBs;
          if (updates.amountInUsd !== undefined)
            repositoryUpdate.amountInUsd = updates.amountInUsd;
          if (updates.differenceBs !== undefined)
            repositoryUpdate.differenceBs = updates.differenceBs;
          if (updates.differenceUsd !== undefined)
            repositoryUpdate.differenceUsd = updates.differenceUsd;
          if (updates.notes !== undefined) repositoryUpdate.notes = updates.notes;

          if (normalized !== undefined && hasAmountUpdates(updates)) {
            repositoryUpdate.amount = normalized.amount;
            repositoryUpdate.amountBs = normalized.amount_bs;
            repositoryUpdate.amountUsd = normalized.amount_usd;
            repositoryUpdate.amountOutBs = normalized.amount_out_bs;
            repositoryUpdate.amountOutUsd = normalized.amount_out_usd;
            repositoryUpdate.amountInBs = normalized.amount_in_bs;
            repositoryUpdate.amountInUsd = normalized.amount_in_usd;
            repositoryUpdate.differenceBs = normalized.difference_bs;
            repositoryUpdate.differenceUsd = normalized.difference_usd;
          }

          await appRepositories.paymentBalanceRepository.update(id, repositoryUpdate);

          set((state) => ({
            paymentBalanceTransactions: state.paymentBalanceTransactions.map(
              (t) =>
                t.id === id
                  ? applyLocalTransactionUpdate(
                      t,
                      updates,
                      normalized,
                      updatedAt
                    )
                  : t
            ),
          }));
        } catch (err) {
          console.error(
            'Failed to update payment balance transaction in Supabase',
            err
          );
          throw err;
        }
      },

      deletePaymentBalanceTransaction: async (id) => {
        try {
          if (!window.navigator.onLine) {
            enqueueOfflinePaymentBalanceDelete(id);
            set((state) => ({
              paymentBalanceTransactions:
                state.paymentBalanceTransactions.filter((t) => t.id !== id),
            }));
              return;
            }

          await appRepositories.paymentBalanceRepository.delete(id);
          set((state) => ({
            paymentBalanceTransactions: state.paymentBalanceTransactions.filter(
              (t) => t.id !== id
            ),
          }));
        } catch (err) {
          console.error(
            'Failed to delete payment balance transaction from Supabase',
            err
          );
          throw err;
        }
      },

      getPaymentBalanceSummary: (date) => {
        const { paymentBalanceTransactions } = get();
        const sales = useWaterSalesStore.getState().sales;
        const prepaidOrders = usePrepaidStore.getState().prepaidOrders;
        const config = useConfigStore.getState().config;
        const rentals = useRentalStore.getState().rentals;
        return calculatePaymentBalanceSummary({
          date,
          exchangeRate: config.exchangeRate,
          sales,
          prepaidOrders,
          rentals,
          paymentBalanceTransactions,
        });
      },

      loadPaymentBalanceTransactions: async () => {
        try {
          const transactions =
            await appRepositories.paymentBalanceRepository.getAll();
          set(() => ({ paymentBalanceTransactions: transactions }));
        } catch (err) {
          console.error(
            'Error loading payment balance transactions from Supabase',
            err
          );
        }
      },
    }),
    {
      name: 'aquagest-payment-balance-storage',
    }
  )
);
