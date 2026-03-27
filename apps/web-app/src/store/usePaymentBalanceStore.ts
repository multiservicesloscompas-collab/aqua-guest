/**
 * usePaymentBalanceStore.ts
 * Thin Zustand store barrel — imports type definitions from .core.
 * All consumers can import from this file and nothing breaks.
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { calculatePaymentBalanceSummary } from '@/services/payments/paymentBalanceSummary';
import supabase from '@/lib/supabaseClient';
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
  type PaymentBalanceInsertPayload,
  type PaymentBalanceUpdatePayload,
  type PaymentBalanceRow,
  rowToTransaction,
} from './usePaymentBalanceStore.core';
import {
  hasAmountUpdates,
  normalizeTransactionDraft,
} from './paymentBalanceDraft';
import {
  applyLocalTransactionUpdate,
  assignUpdatePayloadFromNormalized,
  assignUpdatePayloadFromUpdates,
  toDraftInput,
} from './paymentBalanceStoreHelpers';

// Re-export types so existing import paths continue to work
export type {
  PaymentBalanceState,
  PaymentBalanceInsertPayload,
  PaymentBalanceUpdatePayload,
  PaymentBalanceRow,
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

          const payload: PaymentBalanceInsertPayload = {
            date: transaction.date,
            operation_type: normalized.operation_type,
            from_method: transaction.fromMethod,
            to_method: transaction.toMethod,
            amount: normalized.amount,
            amount_bs: normalized.amount_bs,
            amount_usd: normalized.amount_usd,
            amount_out_bs: normalized.amount_out_bs,
            amount_out_usd: normalized.amount_out_usd,
            amount_in_bs: normalized.amount_in_bs,
            amount_in_usd: normalized.amount_in_usd,
            difference_bs: normalized.difference_bs,
            difference_usd: normalized.difference_usd,
            notes: normalized.notes,
          };
          const { data, error } = await supabase
            .from('payment_balance_transactions')
            .insert(payload)
            .select('*')
            .single();
          if (error) throw error;

          const newTransaction = rowToTransaction(data as PaymentBalanceRow);
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

          const payload: PaymentBalanceUpdatePayload = {
            updated_at: updatedAt,
          };
          assignUpdatePayloadFromUpdates(payload, updates);

          if (normalized !== undefined && hasAmountUpdates(updates)) {
            assignUpdatePayloadFromNormalized(payload, normalized);
          }

          const { error } = await supabase
            .from('payment_balance_transactions')
            .update(payload)
            .eq('id', id);
          if (error) throw error;

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

          const { error } = await supabase
            .from('payment_balance_transactions')
            .delete()
            .eq('id', id);
          if (error) throw error;
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
          const { data, error } = await supabase
            .from('payment_balance_transactions')
            .select('*')
            .order('created_at', { ascending: false });

          if (error) throw error;

          const transactions = ((data || []) as PaymentBalanceRow[]).map(
            rowToTransaction
          );
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
