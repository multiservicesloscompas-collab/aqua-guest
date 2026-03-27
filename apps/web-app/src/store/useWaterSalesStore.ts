/**
 * useWaterSalesStore.ts
 * Thin Zustand store barrel — wires together types from .core and
 * action implementations from .actions. All consumers can import
 * from this file and nothing breaks.
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Sale } from '@/types';
import { dateService } from '@/services/DateService';
import {
  DateFilterStrategy,
  SalesFilterService,
} from '@/services/SalesFilterService';
import { salesDataService } from '@/services/SalesDataService';
import { tipsDataService } from '@/services/tips/TipDataService';
import { createCurrencyConverter } from '@/services/CurrencyService';

import {
  type WaterSalesState,
  type SalesRow,
  type SaleInsert,
  type SaleUpdate,
  generateId,
} from './useWaterSalesStore.core';
import {
  completeSaleAction,
  updateSaleAction,
  deleteSaleAction,
} from './useWaterSalesStore.actions';
import { useConfigStore } from './useConfigStore';
import {
  enqueueOfflineSaleTipDelete,
  enqueueOfflineSaleTipUpsert,
} from '@/offline/enqueue/salesEnqueue';

// Re-export everything so existing import paths continue to work
export type { WaterSalesState, SalesRow, SaleInsert, SaleUpdate };
export { generateId };

export const useWaterSalesStore = create<WaterSalesState>()(
  persist(
    (set, get) => ({
      sales: [],
      cart: [],
      loadingSalesByRange: {},

      setSales: (sales) => set({ sales }),

      // ── Cart ──────────────────────────────────────────────────────────────

      addToCart: (item) =>
        set((state) => ({
          cart: [
            ...state.cart,
            {
              ...item,
              id: generateId(),
              subtotal: item.quantity * item.unitPrice,
            },
          ],
        })),

      updateCartItem: (id, updates) =>
        set((state) => ({
          cart: state.cart.map((item) => {
            if (item.id !== id) return item;
            const updated = { ...item, ...updates };
            updated.subtotal = updated.quantity * updated.unitPrice;
            return updated;
          }),
        })),

      removeFromCart: (id) =>
        set((state) => ({ cart: state.cart.filter((item) => item.id !== id) })),

      clearCart: () => set({ cart: [] }),

      // ── Sales ─────────────────────────────────────────────────────────────

      completeSale: async (
        paymentMethod,
        selectedDate,
        notes,
        paymentSplits,
        tipInput
      ) => {
        const sale = await completeSaleAction(
          paymentMethod,
          selectedDate,
          notes,
          paymentSplits,
          tipInput,
          set,
          get
        );

        if (tipInput && tipInput.amountBs > 0) {
          const exchangeRateUsed =
            useConfigStore.getState().config.exchangeRate;
          const amountUsd = createCurrencyConverter(exchangeRateUsed).toUsd(
            tipInput.amountBs
          );
          await tipsDataService.upsertTipForOrigin({
            originType: 'sale',
            originId: sale.id,
            tipDate: sale.date,
            amountBs: tipInput.amountBs,
            amountUsd,
            exchangeRateUsed,
            capturePaymentMethod: tipInput.capturePaymentMethod,
            notes: tipInput.notes,
          });
        }

        return sale;
      },

      updateSale: async (id, updates, tipInput) => {
        await updateSaleAction(id, updates, tipInput, set, get);

        if (tipInput === null) {
          if (!window.navigator.onLine) {
            enqueueOfflineSaleTipDelete(id);
            return;
          }

          await tipsDataService.deleteTipByOrigin('sale', id);
          return;
        }

        if (tipInput && tipInput.amountBs > 0) {
          const sale = get().sales.find((item) => item.id === id);
          const exchangeRateUsed =
            useConfigStore.getState().config.exchangeRate;
          const amountUsd = createCurrencyConverter(exchangeRateUsed).toUsd(
            tipInput.amountBs
          );

          if (!window.navigator.onLine) {
            enqueueOfflineSaleTipUpsert({
              saleId: id,
              tipDate: sale?.date ?? updates.date ?? '',
              amountBs: tipInput.amountBs,
              amountUsd,
              exchangeRateUsed,
              capturePaymentMethod: tipInput.capturePaymentMethod,
              notes: tipInput.notes,
            });
            return;
          }

          await tipsDataService.upsertTipForOrigin({
            originType: 'sale',
            originId: id,
            tipDate: sale?.date ?? updates.date ?? '',
            amountBs: tipInput.amountBs,
            amountUsd,
            exchangeRateUsed,
            capturePaymentMethod: tipInput.capturePaymentMethod,
            notes: tipInput.notes,
          });
        }
      },

      deleteSale: (id) =>
        deleteSaleAction(id, set, get, (originType, originId) =>
          tipsDataService.deleteTipByOrigin(originType, originId)
        ),

      // ── Query helpers ─────────────────────────────────────────────────────

      getSalesByDate: (date) => {
        const normalizedDate = dateService.normalizeSaleDate(date);
        const filterService = new SalesFilterService(
          new DateFilterStrategy(dateService)
        );
        return filterService
          .filterSales(get().sales, normalizedDate)
          .sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
      },

      loadSalesByDate: async (date) => {
        try {
          const sales = await salesDataService.loadSalesByDate(date);
          set((state) => {
            const existingSales = state.sales.filter((s) => s.date !== date);
            return { sales: [...existingSales, ...sales] };
          });
          return sales;
        } catch (err) {
          console.error('Error loading sales by date:', err);
          throw err;
        }
      },

      loadSalesByDateRange: async (startDate, endDate) => {
        const rangeKey = `${startDate}_${endDate}`;
        if (get().loadingSalesByRange[rangeKey]) return;
        set((state) => ({
          loadingSalesByRange: {
            ...state.loadingSalesByRange,
            [rangeKey]: true,
          },
        }));

        try {
          const dates: string[] = [];
          const current = new Date(startDate + 'T12:00:00');
          const end = new Date(endDate + 'T12:00:00');
          while (current <= end) {
            const y = current.getFullYear();
            const m = String(current.getMonth() + 1).padStart(2, '0');
            const d = String(current.getDate()).padStart(2, '0');
            dates.push(`${y}-${m}-${d}`);
            current.setDate(current.getDate() + 1);
          }

          if (dates.length === 0) return;

          const salesMap = await salesDataService.loadSalesByDateRange(
            startDate,
            endDate
          );
          const allSales: Sale[] = [];
          for (const entries of salesMap.values()) {
            allSales.push(...entries);
          }

          const loadedDatesSet = new Set(dates);
          set((state) => {
            const map = new Map<string, Sale>();
            state.sales
              .filter((item) => !loadedDatesSet.has(item.date))
              .forEach((item) => map.set(item.id, item));
            allSales.forEach((item) => map.set(item.id, item));
            return { sales: Array.from(map.values()) };
          });
        } catch (err) {
          console.error('Error loading sales for date range:', err);
        } finally {
          set((state) => ({
            loadingSalesByRange: {
              ...state.loadingSalesByRange,
              [rangeKey]: false,
            },
          }));
        }
      },
    }),
    {
      name: 'aquagest-water-sales-storage',
    }
  )
);
