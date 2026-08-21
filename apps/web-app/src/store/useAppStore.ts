import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ExchangeRateHistory } from '@aqua-guest/domain';
import { appRepositories } from '@/lib/app-repositories';
import { defaultProducts } from '@/data/products';
import { getVenezuelaDate } from '@/services/DateService';

import { useCustomerStore } from './useCustomerStore';
import { useConfigStore } from './useConfigStore';
import { useExpenseStore } from './useExpenseStore';
import { usePaymentBalanceStore } from './usePaymentBalanceStore';
import { useWaterSalesStore } from './useWaterSalesStore';
import { usePrepaidStore } from './usePrepaidStore';
import { useTipStore } from './useTipStore';

interface AppState {
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  loadFromSupabase: () => Promise<void>;
}

const today = getVenezuelaDate();

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      selectedDate: today,

      setSelectedDate: (date) => set({ selectedDate: date }),

      loadFromSupabase: async () => {
          try {
            const [
             customers,
             products,
             prepaid,
             literPricing,
             exchangeHistory,
             paymentBalanceTransactions,
             sales,
             tips,
           ] = await Promise.all([
             appRepositories.customersRepository.getAll(),
             appRepositories.productsRepository.getAll(),
             appRepositories.prepaidOrdersRepository.getAll(),
             appRepositories.literPricingRepository.getAll(),
             appRepositories.exchangeRatesRepository.getAll(),
             appRepositories.paymentBalanceRepository.getAll(),
             appRepositories.salesRepository.getAll({
               limit: 100,
               relations: ['paymentSplits'],
             }),
             appRepositories.tipsRepository.getAll({ limit: 100 }),
           ]);
           const productsWithIcons = products;

           const configStore = useConfigStore.getState();
           let latestExchangeRate = configStore.config.exchangeRate;
           let normalizedExchangeHistory: ExchangeRateHistory[] =
             configStore.config.exchangeRateHistory;

           if (exchangeHistory.length > 0) {
             normalizedExchangeHistory = [...exchangeHistory].sort(
               (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
             );
             latestExchangeRate = normalizedExchangeHistory[0].rate;
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
               exchangeRateHistory: normalizedExchangeHistory,
               exchangeRate: latestExchangeRate,
               lastUpdated: new Date().toISOString(),
             },
             productsWithIcons.length ? productsWithIcons : defaultProducts
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
  void useAppStore.getState().loadFromSupabase?.();
} catch (error) {
  console.error(error);
}
