import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import supabase from '@/lib/supabaseClient';
import { defaultProducts } from '@/data/products';
import { getVenezuelaDate } from '@/services/DateService';
import { ExchangeRateHistory } from '@/types';

import { useCustomerStore } from './useCustomerStore';
import { useConfigStore } from './useConfigStore';
import { useExpenseStore } from './useExpenseStore';
import { usePaymentBalanceStore } from './usePaymentBalanceStore';
import { useWaterSalesStore } from './useWaterSalesStore';
import { usePrepaidStore } from './usePrepaidStore';

interface AppState {
  // Estado UI
  selectedDate: string;

  // Utilidades
  setSelectedDate: (date: string) => void;
  loadFromSupabase: () => Promise<void>;
}

const today = getVenezuelaDate();

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      selectedDate: today,

      setSelectedDate: (date) => set({ selectedDate: date }),

      // Load data from Supabase - Optimizado para cargar solo datos necesarios
      loadFromSupabase: async () => {
        try {
          const [
            customersRes,
            productsRes,
            prepaidRes,
            literPricingRes,
            exchangeRatesRes,
            balanceTransactionsRes,
            salesRes,
          ] = await Promise.all([
            supabase.from('customers').select('*'),
            supabase.from('products').select('*'),
            supabase.from('prepaid_orders').select('*'),
            supabase.from('liter_pricing').select('*'),
            supabase.from('exchange_rates').select('*'),
            supabase
              .from('payment_balance_transactions')
              .select('*')
              .order('created_at', { ascending: false }),
            supabase
              .from('sales')
              .select('*')
              .limit(100)
              .order('date', { ascending: false }),
          ]);

          const customers = customersRes.data || [];
          const products = (productsRes.data || []).map((p: any) => ({
            id: p.id,
            name: p.name,
            defaultPrice: Number(p.default_price),
            requiresLiters: p.requires_liters,
            minLiters: p.minLiters,
            maxLiters: p.max_liters,
            icon: p.icon,
          }));
          const prepaid = (prepaidRes.data || []).map((p: any) => ({
            id: p.id,
            customerName: p.customer_name ?? p.customerName,
            customerPhone: p.customer_phone ?? p.customerPhone,
            liters: Number(p.liters),
            amountBs: Number(p.amount_bs ?? p.amountBs ?? 0),
            amountUsd: Number(p.amount_usd ?? p.amountUsd ?? 0),
            exchangeRate: Number(p.exchange_rate ?? p.exchangeRate ?? 0),
            paymentMethod: p.payment_method ?? p.paymentMethod,
            status: p.status,
            datePaid: p.date_paid ?? p.datePaid,
            dateDelivered: p.date_delivered ?? p.dateDelivered,
            notes: p.notes,
            createdAt: p.created_at ?? p.createdAt,
            updatedAt: p.updated_at ?? p.updatedAt,
          }));
          const literPricing = (literPricingRes.data || []).map((l: any) => ({
            breakpoint: Number(l.breakpoint),
            price: Number(l.price),
          }));

          const paymentBalanceTransactions = (
            balanceTransactionsRes.data || []
          ).map((t: any) => ({
            id: t.id,
            date: t.date,
            fromMethod: t.from_method,
            toMethod: t.to_method,
            amount: Number(t.amount),
            amountBs: t.amount_bs ? Number(t.amount_bs) : Number(t.amount),
            amountUsd: t.amount_usd ? Number(t.amount_usd) : undefined,
            notes: t.notes,
            createdAt: t.created_at || new Date().toISOString(),
            updatedAt: t.updated_at || new Date().toISOString(),
          }));

          const sales = (salesRes.data || []).map((s: any) => ({
            id: s.id,
            dailyNumber: s.daily_number,
            date: s.date,
            items: s.items,
            paymentMethod: s.payment_method,
            totalBs: Number(s.total_bs),
            totalUsd: Number(s.total_usd),
            exchangeRate: Number(s.exchange_rate),
            notes: s.notes,
            createdAt: s.created_at,
            updatedAt: s.updated_at,
          }));

          const configStore = useConfigStore.getState();
          let latestExchangeRate = configStore.config.exchangeRate;
          let exchangeHistory: ExchangeRateHistory[] =
            configStore.config.exchangeRateHistory;

          if (exchangeRatesRes.data) {
            const mappedHistory = exchangeRatesRes.data.map((x: any) => ({
              date: x.date,
              rate: Number(x.rate),
              updatedAt: x.updated_at ?? x.updatedAt,
            }));

            mappedHistory.sort(
              (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
            );
            exchangeHistory = mappedHistory;
            if (exchangeHistory.length > 0) {
              latestExchangeRate = exchangeHistory[0].rate;
            }
          }

          useCustomerStore.getState().setCustomers(customers);
          useWaterSalesStore.getState().setSales(sales);
          usePrepaidStore.getState().setPrepaidOrders(prepaid);
          configStore.setConfigData(
            {
              literPricing: literPricing.length
                ? literPricing
                : configStore.config.literPricing,
              exchangeRateHistory: exchangeHistory,
              exchangeRate: latestExchangeRate,
              lastUpdated: new Date().toISOString(),
            },
            products.length ? products : defaultProducts
          );

          useExpenseStore.getState().setExpensesData([]);
          usePaymentBalanceStore
            .getState()
            .setPaymentBalanceData(paymentBalanceTransactions);
        } catch (err) {
          console.error('Error loading from Supabase', err);
        }
      },
    }),
    {
      name: 'aquagest-core-storage',
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.selectedDate = getVenezuelaDate();
        }
      },
    }
  )
);

try {
  useAppStore.getState().loadFromSupabase &&
    useAppStore.getState().loadFromSupabase();
} catch (err) {
  // ignore
}
