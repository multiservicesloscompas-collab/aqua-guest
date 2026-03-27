import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import supabase from '@/lib/supabaseClient';
import { defaultProducts } from '@/data/products';
import { getVenezuelaDate } from '@/services/DateService';
import { ExchangeRateHistory } from '@/types';
import {
  mapExchangeRateHistory,
  mapLiterPricing,
  mapPaymentBalanceTransactions,
  mapPrepaidOrders,
  mapProducts,
  mapSales,
  mapTips,
} from './appStoreMappers';

import { useCustomerStore } from './useCustomerStore';
import { useConfigStore } from './useConfigStore';
import { useExpenseStore } from './useExpenseStore';
import { usePaymentBalanceStore } from './usePaymentBalanceStore';
import { useWaterSalesStore } from './useWaterSalesStore';
import { usePrepaidStore } from './usePrepaidStore';
import { useTipStore } from './useTipStore';

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
            tipsRes,
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
              .select('*, sale_payment_splits(*)')
              .limit(100)
              .order('date', { ascending: false }),
            supabase
              .from('tips')
              .select('*')
              .limit(100)
              .order('tip_date', { ascending: false }),
          ]);

          const customers = customersRes.data || [];
          const products = mapProducts(productsRes.data || []);
          const prepaid = mapPrepaidOrders(prepaidRes.data || []);
          const literPricing = mapLiterPricing(literPricingRes.data || []);
          const paymentBalanceTransactions = mapPaymentBalanceTransactions(
            balanceTransactionsRes.data || []
          );
          const sales = mapSales(salesRes.data || []);
          const tips = mapTips(tipsRes.data || []);

          const configStore = useConfigStore.getState();
          let latestExchangeRate = configStore.config.exchangeRate;
          let exchangeHistory: ExchangeRateHistory[] =
            configStore.config.exchangeRateHistory;

          if (exchangeRatesRes.data) {
            exchangeHistory = mapExchangeRateHistory(exchangeRatesRes.data);
            if (exchangeHistory.length > 0) {
              latestExchangeRate = exchangeHistory[0].rate;
            }
          }

          useCustomerStore.getState().setCustomers(customers);
          useWaterSalesStore.getState().setSales(sales);
          usePrepaidStore.getState().setPrepaidOrders(prepaid);
          useTipStore.getState().setTips(tips);
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
} catch {
  // ignore
}
