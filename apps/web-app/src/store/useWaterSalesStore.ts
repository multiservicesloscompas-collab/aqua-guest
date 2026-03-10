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

      completeSale: (paymentMethod, selectedDate, notes, paymentSplits) =>
        completeSaleAction(
          paymentMethod,
          selectedDate,
          notes,
          paymentSplits,
          set,
          get
        ),

      updateSale: (id, updates) => updateSaleAction(id, updates, set, get),

      deleteSale: (id) => deleteSaleAction(id, set, get),

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
