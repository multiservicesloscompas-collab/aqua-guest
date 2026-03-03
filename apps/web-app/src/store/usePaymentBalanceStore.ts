import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  PaymentBalanceTransaction,
  PaymentBalanceSummary,
  PaymentMethod,
} from '@/types';
import supabase from '@/lib/supabaseClient';
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
  notes?: string;
};

type PaymentBalanceUpdatePayload = {
  from_method?: PaymentMethod;
  to_method?: PaymentMethod;
  amount?: number;
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
          const payload: PaymentBalanceInsertPayload = {
            date: transaction.date,
            from_method: transaction.fromMethod,
            to_method: transaction.toMethod,
            amount: transaction.amount,
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
          const payload: PaymentBalanceUpdatePayload = {
            updated_at: new Date().toISOString(),
          };
          if (updates.fromMethod !== undefined)
            payload.from_method = updates.fromMethod;
          if (updates.toMethod !== undefined)
            payload.to_method = updates.toMethod;
          if (updates.amount !== undefined) payload.amount = updates.amount;
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
                      updatedAt: new Date().toISOString(),
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
        // Dependencias externas
        const sales = useWaterSalesStore.getState().sales;
        const prepaidOrders = usePrepaidStore.getState().prepaidOrders;

        const configStoreState = useConfigStore.getState();
        const config = configStoreState.config;

        const rentals = useRentalStore.getState().rentals;

        const salesOfDay = sales.filter((s) => s.date === date);
        const prepaidOfDay = prepaidOrders.filter((p) => p.datePaid === date);
        const rentalsOfDay = rentals.filter(
          (r) => r.datePaid === date || r.date === date
        );

        const calculateOriginalTotal = (method: PaymentMethod) => {
          const salesTotal = salesOfDay
            .filter((s) => s.paymentMethod === method)
            .reduce((sum, s) => sum + s.totalBs, 0);
          const prepaidTotal = prepaidOfDay
            .filter((p) => p.paymentMethod === method)
            .reduce((sum, p) => sum + p.amountBs, 0);

          const rentalsTotal = rentalsOfDay
            .filter((r) => r.paymentMethod === method && r.isPaid)
            .reduce((sum, r) => sum + r.totalUsd * config.exchangeRate, 0);

          return salesTotal + rentalsTotal + prepaidTotal;
        };

        const balanceTransactionsOfDay = paymentBalanceTransactions.filter(
          (t) => t.date === date
        );

        const calculateAdjustments = (method: PaymentMethod) => {
          return balanceTransactionsOfDay.reduce((adjustment, transaction) => {
            if (transaction.fromMethod === method) {
              if (method === 'divisa') {
                const usdAmount =
                  transaction.amountUsd ||
                  transaction.amount / config.exchangeRate;
                return adjustment - usdAmount * config.exchangeRate;
              } else {
                return adjustment - transaction.amount;
              }
            } else if (transaction.toMethod === method) {
              if (method === 'divisa') {
                const usdAmount =
                  transaction.amountUsd ||
                  transaction.amount / config.exchangeRate;
                return adjustment + usdAmount * config.exchangeRate;
              } else {
                return adjustment + transaction.amount;
              }
            }
            return adjustment;
          }, 0);
        };

        const methods: PaymentMethod[] = [
          'efectivo',
          'pago_movil',
          'punto_venta',
          'divisa',
        ];
        return methods.map((method) => {
          const originalTotal = calculateOriginalTotal(method);
          const adjustments = calculateAdjustments(method);
          const finalTotal = originalTotal + adjustments;

          return {
            method,
            originalTotal,
            adjustments,
            finalTotal,
          } as PaymentBalanceSummary;
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
