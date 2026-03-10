import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  AppConfig,
  Product,
  LiterPricing,
  ExchangeRateHistory,
  DEFAULT_LITER_BREAKPOINTS,
} from '@/types';
import {
  createDefaultMixedPaymentFlags,
  isMixedPaymentEnabledForModule,
} from '@/services/payments/paymentSplitFeatureFlag';
import type {
  MixedPaymentFeatureFlags,
  PaymentSplitModule,
} from '@/types/paymentSplits';
import supabase from '@/lib/supabaseClient';
import { defaultProducts } from '@/data/products';
import { getVenezuelaDate } from '@/services/DateService';
import {
  applyOfflineExchangeRateHistory,
  enqueueOfflineExchangeRateUpsert,
  enqueueOfflineLiterPricingReplace,
} from '@/offline/enqueue/configEnqueue';

interface ConfigState {
  config: AppConfig;
  products: Product[];
  mixedPaymentFlags: MixedPaymentFeatureFlags;

  setExchangeRate: (rate: number) => Promise<void>;
  getExchangeRateForDate: (date: string) => number;
  setLiterPricing: (pricing: LiterPricing[]) => Promise<void>;
  getPriceForLiters: (liters: number) => number;
  setMixedPaymentFlags: (flags: Partial<MixedPaymentFeatureFlags>) => void;
  isMixedPaymentEnabled: (module: PaymentSplitModule) => boolean;

  setConfigData: (
    configUpdates: Partial<AppConfig>,
    products: Product[]
  ) => void;
}

export const useConfigStore = create<ConfigState>()(
  persist(
    (set, get) => ({
      config: {
        exchangeRate: 36.5,
        lastUpdated: new Date().toISOString(),
        literPricing: DEFAULT_LITER_BREAKPOINTS,
        exchangeRateHistory: [],
      },
      products: defaultProducts,
      mixedPaymentFlags: createDefaultMixedPaymentFlags(),

      setConfigData: (configUpdates, products) => {
        set((state) => ({
          config: { ...state.config, ...configUpdates },
          products,
        }));
      },

      setExchangeRate: async (rate) => {
        const today = getVenezuelaDate();
        const newHistoryEntry: ExchangeRateHistory = {
          date: today,
          rate,
          updatedAt: new Date().toISOString(),
        };

        const updatedHistory = applyOfflineExchangeRateHistory(
          get().config.exchangeRateHistory,
          newHistoryEntry
        );

        set((state) => ({
          config: {
            ...state.config,
            exchangeRate: rate,
            lastUpdated: new Date().toISOString(),
            exchangeRateHistory: updatedHistory,
          },
        }));

        if (!window.navigator.onLine) {
          enqueueOfflineExchangeRateUpsert({
            date: today,
            rate,
            updatedAt: newHistoryEntry.updatedAt,
          });
          return;
        }

        try {
          const { error } = await supabase.from('exchange_rates').upsert(
            {
              date: today,
              rate,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'date' }
          );

          if (error) throw error;
        } catch (err) {
          console.error('Failed to save exchange rate to Supabase', err);
          throw err;
        }
      },

      getExchangeRateForDate: (date) => {
        const { config } = get();
        const historyEntry = config.exchangeRateHistory.find(
          (h: ExchangeRateHistory) => h.date === date
        );
        if (historyEntry) return historyEntry.rate;

        const sortedHistory = [...config.exchangeRateHistory].sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        const previousEntry = sortedHistory.find((h) => h.date < date);
        return previousEntry?.rate || config.exchangeRate;
      },

      setLiterPricing: async (pricing) => {
        const previousPricing = get().config.literPricing;

        set((state) => ({
          config: {
            ...state.config,
            literPricing: pricing,
            lastUpdated: new Date().toISOString(),
          },
        }));

        if (!window.navigator.onLine) {
          enqueueOfflineLiterPricingReplace({
            pricing,
            previousPricing,
          });
          return;
        }

        try {
          const { data: existingPricing, error: fetchError } = await supabase
            .from('liter_pricing')
            .select('id, breakpoint, price');
          if (fetchError) throw fetchError;

          const payload = pricing.map((p) => {
            const existing = existingPricing?.find(
              (ep: any) => Number(ep.breakpoint) === Number(p.breakpoint)
            );
            return {
              ...(existing ? { id: existing.id } : {}),
              breakpoint: p.breakpoint,
              price: p.price,
            };
          });

          const updates = payload.filter((p) => 'id' in p);
          const inserts = payload.filter((p) => !('id' in p));

          if (updates.length > 0) {
            const { error: updateError } = await supabase
              .from('liter_pricing')
              .upsert(updates);
            if (updateError) throw updateError;
          }

          if (inserts.length > 0) {
            const { error: insertError } = await supabase
              .from('liter_pricing')
              .insert(inserts);
            if (insertError) throw insertError;
          }
        } catch (err) {
          console.error('Failed to persist liter pricing to Supabase', err);
          throw err;
        }
      },

      getPriceForLiters: (liters) => {
        const { literPricing } = get().config;
        const pricing = literPricing || DEFAULT_LITER_BREAKPOINTS;
        const sortedPricing = [...pricing].sort(
          (a, b) => a.breakpoint - b.breakpoint
        );

        for (const bp of sortedPricing) {
          if (liters <= bp.breakpoint) {
            return bp.price;
          }
        }

        return sortedPricing[sortedPricing.length - 1]?.price || 0;
      },

      setMixedPaymentFlags: (flags) => {
        set((state) => ({
          mixedPaymentFlags: {
            ...state.mixedPaymentFlags,
            ...flags,
          },
        }));
      },

      isMixedPaymentEnabled: (module) => {
        const { mixedPaymentFlags } = get();
        return isMixedPaymentEnabledForModule(mixedPaymentFlags, module);
      },
    }),
    {
      name: 'aquagest-config-storage',
    }
  )
);
