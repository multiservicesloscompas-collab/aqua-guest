import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  PaymentBalanceTransaction,
  PaymentBalanceSummary,
  PaymentMethod,
} from '@/types';
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

interface PaymentBalanceState {
  paymentBalanceTransactions: PaymentBalanceTransaction[];

  // Acciones de equilibrio de pagos
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

  // Inicialización compartida
  setPaymentBalanceData: (
    paymentBalanceTransactions: PaymentBalanceTransaction[]
  ) => void;
}

type PaymentBalanceInsertPayload = {
  date: string;
  from_method: PaymentMethod;
  to_method: PaymentMethod;
  amount: number;
  amount_bs?: number;
  amount_usd?: number;
  notes?: string;
};

type PaymentBalanceUpdatePayload = {
  from_method?: PaymentMethod;
  to_method?: PaymentMethod;
  amount?: number;
  amount_bs?: number;
  amount_usd?: number;
  notes?: string;
  date?: string;
  updated_at: string;
};

type PaymentBalanceRow = {
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

export const usePaymentBalanceStore = create<PaymentBalanceState>()(
  persist(
    (set, get) => ({
      paymentBalanceTransactions: [],

      setPaymentBalanceData: (paymentBalanceTransactions) => {
        set({
          paymentBalanceTransactions,
        });
      },

      addPaymentBalanceTransaction: async (transaction) => {
        try {
          if (!window.navigator.onLine) {
            const now = new Date().toISOString();
            const offlineTransaction = enqueueOfflinePaymentBalanceCreate(
              transaction,
              {
                createdAt: now,
                updatedAt: now,
              }
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
            from_method: transaction.fromMethod,
            to_method: transaction.toMethod,
            amount: transaction.amount,
            amount_bs: transaction.amountBs,
            amount_usd: transaction.amountUsd,
            notes: transaction.notes,
          };
          const { data, error } = await supabase
            .from('payment_balance_transactions')
            .insert(payload)
            .select('*')
            .single();
          if (error) throw error;

          const row = data as PaymentBalanceRow;
          const newTransaction: PaymentBalanceTransaction = {
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

          if (!window.navigator.onLine) {
            enqueueOfflinePaymentBalanceUpdate(id, updates, updatedAt);

            set((state) => ({
              paymentBalanceTransactions: state.paymentBalanceTransactions.map(
                (transaction) =>
                  transaction.id === id
                    ? {
                        ...transaction,
                        ...updates,
                        updatedAt,
                      }
                    : transaction
              ),
            }));
            return;
          }

          const payload: PaymentBalanceUpdatePayload = {
            updated_at: updatedAt,
          };
          if (updates.fromMethod !== undefined)
            payload.from_method = updates.fromMethod;
          if (updates.toMethod !== undefined)
            payload.to_method = updates.toMethod;
          if (updates.amount !== undefined) payload.amount = updates.amount;
          if (updates.amountBs !== undefined)
            payload.amount_bs = updates.amountBs;
          if (updates.amountUsd !== undefined)
            payload.amount_usd = updates.amountUsd;
          if (updates.notes !== undefined) payload.notes = updates.notes;
          if (updates.date !== undefined) payload.date = updates.date;

          const { error } = await supabase
            .from('payment_balance_transactions')
            .update(payload)
            .eq('id', id);
          if (error) throw error;

          set((state) => ({
            paymentBalanceTransactions: state.paymentBalanceTransactions.map(
              (transaction) =>
                transaction.id === id
                  ? {
                      ...transaction,
                      ...updates,
                      updatedAt,
                    }
                  : transaction
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
                state.paymentBalanceTransactions.filter(
                  (transaction) => transaction.id !== id
                ),
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
              (transaction) => transaction.id !== id
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

          const rows = (data || []) as PaymentBalanceRow[];
          const transactions = rows.map((row) => ({
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
          }));

          set((state) => ({
            paymentBalanceTransactions: transactions,
          }));
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
